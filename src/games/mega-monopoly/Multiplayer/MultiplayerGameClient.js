const RenderMonopolyGame = require('../RenderMonopolyGame');
const MonopolyBaseLogic = require('../MonopolyBaseLogic');
const { GameEngine } = require('../../GameEngine');
const Player = require('../Player');
const FixedUIScreen = require('../FixedUIScreen');
const Deck = require('../Deck');
const chanceCards = require('../chance-cards');
const communityChestCards = require('../community-chest-cards');
const busTicketCards = require('../bus-ticket-cards');

class MultiplayerGame {
    /**
     * @param {HTMLElement} container
     * @param {Array} playersInfo - Array of player objects from the server
     * @param {MonopolySyncClient} syncClient
     * @param {string} gameCode
     * @param {string} mySocketId
     */
    constructor(container, playersInfo, syncClient, gameCode, mySocketId) {
        if (!syncClient || !syncClient.socket) {
            throw new Error("SyncClient or its socket is undefined. Ensure the MonopolySyncClient is properly initialized.");
        }
        console.log("Initializing MultiplayerGame with players:", playersInfo);
        console.log("SyncClient Socket:", syncClient.socket);
        console.log("Socket Connected:", syncClient.socket.connected);

        this.container = container;
        this.syncClient = syncClient;
        this.gameCode = gameCode;
        this.mySocketId = mySocketId;
        this.players = playersInfo.map(p => new Player(p));
        console.log("Players initialized:", this.players);
        this.whosTurn = 0;

        this.renderGame = new RenderMonopolyGame(this.players);
        this.board = this.renderGame.renderBoard();
        if (!this.board) {
            throw new Error("Board failed to render. Check RenderMonopolyGame.");
        }
        console.log("Board rendered successfully.");

        this.chanceDeck = new Deck(chanceCards);
        this.communityChestDeck = new Deck(communityChestCards);
        this.busTicketDeck = new Deck(busTicketCards);
        this.logic = new MonopolyBaseLogic(
            this.players,
            this.board,
            this.chanceDeck,
            this.communityChestDeck,
            this.busTicketDeck
        );
        this.engine = new GameEngine(this.board, this.players);
        this.engine.currentTurn = 0;
        this.players.forEach(p => { p.position = 0; });

        this.fixedUI = new FixedUIScreen(this.container, {
            onEndTurn: () => this.endTurn(),
            onQuit: () => { window.location.reload(); },
            onTrade: () => this.handleTrade(),
            onSave: () => { /* save game logic */ },
            onViewRealEstate: () => this.fixedUI.showRealEstateList(this.players[this.whosTurn], this.board)
        });

        this.setupSync();
        this.render();
        this.fixedUI.updatePlayerInfo(this.players, this.whosTurn);

        // If it's this client's turn at the very start of the game (player 0)
        if (this.players[this.whosTurn] && this.players[this.whosTurn].id === this.mySocketId) {
            console.log(`[MultiplayerGameClient ${this.mySocketId}] GAME_CLIENT: It's my turn at game start. Calling startTurn().`);
            this.startTurn();
        }
    }

    setupSync() {
        // Sync player positions
        this.syncClient.onPositionsUpdate((positions) => {
            positions.forEach((pos, idx) => {
                if (this.players[idx]) this.players[idx].position = pos;
            });
            this.render();
        });

        // Sync property ownership and state (implement as needed)
        this.syncClient.onPropertiesUpdate((properties) => {
            properties.forEach(propUpdate => {
                const space = this.board[propUpdate.pos];
                if (!space) return;
                if ('ownerId' in propUpdate) space.owner = this.players.find(p => p.id === propUpdate.ownerId) || null;
                if ('houses' in propUpdate) space.houses = propUpdate.houses;
                if ('hasHotel' in propUpdate) space.hasHotel = propUpdate.hasHotel;
                if ('hasSkyscraper' in propUpdate) space.hasSkyscraper = propUpdate.hasSkyscraper;
                if ('isMortgaged' in propUpdate) space.isMortgaged = propUpdate.isMortgaged;
            });
            this.render();
        });

        // Sync turn
        this.syncClient.onTurnUpdateHandler((currentTurn) => {
            console.log(`[MultiplayerGameClient ${this.mySocketId}] GAME_CLIENT: Handling "turn-update". New turn: ${currentTurn}. My socket ID: ${this.mySocketId}. Player whose turn it is: ${this.players[currentTurn]?.id}`);
            this.whosTurn = currentTurn;
            this.render(); // Update UI like player info
            if (this.players[this.whosTurn] && this.players[this.whosTurn].id === this.mySocketId) {
                console.log(`[MultiplayerGameClient ${this.mySocketId}] GAME_CLIENT: It's my turn. Calling startTurn().`);
                this.fixedUI.enableEndTurnButton(false); // Disable end turn until after an action
                this.startTurn();
            } else {
                console.log(`[MultiplayerGameClient ${this.mySocketId}] GAME_CLIENT: It's not my turn.`);
                this.fixedUI.enableEndTurnButton(false); // Disable for others
            }
        });

        this.syncClient.socket.on("player-moved", ({ playerId, newPosition, landedSquareName, rollDetails }) => {
            console.log(`[MultiplayerGameClient ${this.mySocketId}] Received "player-moved":`, { playerId, newPosition, landedSquareName, rollDetails });
            const player = this.players.find(p => p.id === playerId);
            if (player) {
                player.position = newPosition;
                this.render(); // Re-render tokens
                // this.fixedUI.updateChatMessage(`${player.username} moved to ${landedSquareName}.`); // Server sends a game-message
            }
            // If it was MY move, I can now end my turn (unless I got doubles)
            if (playerId === this.mySocketId && !(rollDetails.d1 === rollDetails.d2 && rollDetails.d1 !== 0)) {
                 this.fixedUI.enableEndTurnButton(true);
            }
        });

        this.syncClient.socket.on("player-data-updated", ({ playerId, money, properties, inJail, jailTurns }) => {
            console.log(`[MultiplayerGameClient ${this.mySocketId}] Received "player-data-updated" for ${playerId}:`, { money, properties, inJail, jailTurns });
            const player = this.players.find(p => p.id === playerId);
            if (player) {
                if (money !== undefined) player.money = money;
                if (inJail !== undefined) player.inJail = inJail;
                if (jailTurns !== undefined) player.jailTurns = jailTurns;
                // if (properties) player.properties = properties; // More complex sync needed for properties
                this.fixedUI.updatePlayerInfo(this.players, this.whosTurn); // Update UI
            }
        });
        
        this.syncClient.socket.on("another-turn", ({ reason }) => {
            console.log(`[MultiplayerGameClient ${this.mySocketId}] Received "another-turn" because: ${reason}.`);
            if (this.players[this.whosTurn] && this.players[this.whosTurn].id === this.mySocketId) {
                this.fixedUI.updateChatMessage(`You get another turn (${reason})!`);
                this.startTurn(); // Prompt for action again
            }
        });

        this.syncClient.socket.on("game-message", (message) => {
            console.log(`[MultiplayerGameClient ${this.mySocketId}] Received "game-message": ${message}`);
            this.fixedUI.updateChatMessage(message);
        });
    }

    endTurn() {
        console.log(`[MultiplayerGameClient ${this.mySocketId}] Emitting "end-turn" for game ${this.gameCode}`);
        this.syncClient.endTurn();
        this.fixedUI.enableEndTurnButton(false); // Disable after ending
    }

    render() {
        this.renderGame.renderPlayerTokens();
        this.fixedUI.updatePlayerInfo(this.players, this.whosTurn);
    }

    startTurn() {
        const player = this.players[this.whosTurn];
        if (!player || player.id !== this.mySocketId) {
            console.log(`[MultiplayerGameClient ${this.mySocketId}] startTurn called, but it's not my turn or player undefined.`);
            return;
        }

        console.log(`[MultiplayerGameClient ${this.mySocketId}] Starting turn for ${player.username}.`);

        const modal = document.getElementById("turn-modal");
        const title = document.getElementById("turn-modal-title");
        const rollBtn = document.getElementById("turn-modal-roll");
        const busBtn = document.getElementById("turn-modal-bus"); // Assuming you have this

        title.textContent = `${player.username}, it's your turn!`;
        rollBtn.style.display = "inline-block";
        busBtn.style.display = player.numBusTickets > 0 ? "inline-block" : "none"; // Example

        modal.style.display = "flex";

        rollBtn.onclick = () => {
            modal.style.display = "none";
            this.localRollDiceAndNotifyServer();
        };
        // busBtn.onclick = () => { /* TODO: Handle bus ticket usage */ };

        if (player.inJail) {
            // TODO: this.logic.showJailOptions(player, this); // Needs adaptation for multiplayer
            this.fixedUI.updateChatMessage("You are in jail. (Jail options not yet implemented for multiplayer)");
            // For now, if in jail, maybe just allow ending turn or a simplified "pay fine"
            this.fixedUI.enableEndTurnButton(true); // Allow ending turn if stuck in jail with no options
        }
    }

    localRollDiceAndNotifyServer() {
        const player = this.players[this.whosTurn];
        if (!player || player.id !== this.mySocketId) return;

        const roll = this.logic.rollDice(); // Roll dice using client's logic instance
        console.log(`[MultiplayerGameClient ${this.mySocketId}] Locally rolled:`, roll, `Emitting "dice-rolled-by-client".`);
        this.syncClient.socket.emit("dice-rolled-by-client", {
            gameCode: this.gameCode,
            playerId: player.id,
            roll: roll // Send the roll object {d1, d2, mega}
        });
        // The "End Turn" button should typically be disabled after rolling,
        // until the server confirms the move and if no further actions (like doubles) occur.
        // It will be re-enabled by "player-moved" if the turn should end.
        this.fixedUI.enableEndTurnButton(false);
    }

    handleTrade() {
        this.fixedUI.showTradeModal(this.players, this.whosTurn, (tradeObj) => {
            this.syncClient.proposeTrade(tradeObj);
        });

        this.syncClient.onTradeCompleted((data) => {
            if (data.players) {
                this.players.forEach((p, i) => {
                    Object.assign(p, data.players[i]);
                });
            }
            this.fixedUI.updatePlayerInfo(this.players, this.whosTurn);
            this.fixedUI.updateChatMessage("Trade completed!");
            this.render();
        });
    }

    buyProperty(propertyId) {
        const player = this.players[this.whosTurn];
        if (player.id !== this.mySocketId) return;
        this.syncClient.buyProperty(propertyId, player.id);
    }

    developProperty(propertyId) {
        const player = this.players[this.whosTurn];
        if (player.id !== this.mySocketId) return;
        this.syncClient.developProperty(propertyId, player.id);
    }

    mortgageProperty(propertyId) {
        const player = this.players[this.whosTurn];
        if (player.id !== this.mySocketId) return;
        this.syncClient.mortgageProperty(propertyId, player.id);
    }

    unmortgageProperty(propertyId) {
        const player = this.players[this.whosTurn];
        if (player.id !== this.mySocketId) return;
        this.syncClient.unmortgageProperty(propertyId, player.id);
    }
}

module.exports = MultiplayerGame;