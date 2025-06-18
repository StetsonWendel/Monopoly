const RenderMonopolyGame = require('../RenderMonopolyGame');
const MonopolyBaseLogic = require('../MonopolyBaseLogic');
const { GameEngine } = require('../../GameEngine');
const Player = require('../Player');
const FixedUIScreen = require('../FixedUIScreen');
const Deck = require('../Deck');
const chanceCards = require('../chance-cards');
const communityChestCards = require('../community-chest-cards');
const busTicketCards = require('../bus-ticket-cards');

class MultiplayerGameClient {
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
            // onSave: () => { /* save game logic */ }, // Multiplayer save is server-side
            onViewRealEstate: () => {
                const currentPlayer = this.players[this.whosTurn];
                // Ensure it's this client's turn to open their own properties
                if (currentPlayer && currentPlayer.id === this.mySocketId) {
                    this.fixedUI.showRealEstateList(
                        currentPlayer,
                        this.board, // Client's local board copy
                        { // Action Handlers for Multiplayer Client (emit to server)
                            onDevelop: (prop) => {
                                console.log(`[MP Client] Requesting develop for ${prop.name} (pos ${prop.pos})`);
                                this.syncClient.developProperty(prop.pos, currentPlayer.id);
                                // Modal will be refreshed/closed when server sends updates
                            },
                            onUndevelop: (prop) => {
                                console.log(`[MP Client] Requesting undevelop for ${prop.name} (pos ${prop.pos})`);
                                this.syncClient.undevelopProperty(prop.pos, currentPlayer.id);
                            },
                            onMortgage: (prop) => {
                                console.log(`[MP Client] Requesting mortgage for ${prop.name} (pos ${prop.pos})`);
                                this.syncClient.mortgageProperty(prop.pos, currentPlayer.id);
                            },
                            onUnmortgage: (prop) => {
                                console.log(`[MP Client] Requesting unmortgage for ${prop.name} (pos ${prop.pos})`);
                                this.syncClient.unmortgageProperty(prop.pos, currentPlayer.id);
                            }
                        }
                    );
                } else {
                    // Optionally show a read-only view or a message if trying to view others' properties for management
                    this.fixedUI.updateChatMessage("You can only manage your own properties on your turn.");
                }
            }
        });

        this.setupSync(); // Ensure this is called
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

        // NEW: Handle offer to buy property
        this.syncClient.socket.on("offer-to-buy-property", ({ propertyPos, propertyName, price }) => {
            console.log(`[MultiplayerGameClient ${this.mySocketId}] Received "offer-to-buy-property" for ${propertyName}`);
            if (this.players[this.whosTurn] && this.players[this.whosTurn].id === this.mySocketId) {
                // It's my turn and I'm being offered the property
                const property = this.board[propertyPos]; // Get property from client's board instance
                this.fixedUI.showBuyPropertyModal(property, this.players[this.whosTurn],
                    () => { // onBuy
                        this.syncClient.socket.emit("buy-property-decision", { gameCode: this.gameCode, propertyPos, accepted: true });
                    },
                    () => { // onDecline (Auction)
                        this.syncClient.socket.emit("buy-property-decision", { gameCode: this.gameCode, propertyPos, accepted: false });
                    }
                );
            }
        });

        // NEW: Handle auction started
        this.syncClient.socket.on("auction-started", ({ propertyName, propertyPos, currentBid }) => {
            console.log(`[MultiplayerGameClient ${this.mySocketId}] Received "auction-started" for ${propertyName}`);
            const property = this.board[propertyPos];
            this.fixedUI.showAuctionModal(property, currentBid, this.players, this.mySocketId, 
                (bidAmount) => { // onPlaceBid
                    this.syncClient.socket.emit("auction-place-bid", { gameCode: this.gameCode, propertyPos, bidAmount });
                },
                () => { // onPass
                    this.syncClient.socket.emit("auction-pass", { gameCode: this.gameCode, propertyPos });
                }
            );
        });

        // NEW: Handle auction bid update (someone else bid)
        this.syncClient.socket.on("auction-bid-update", ({ propertyName, propertyPos, currentBid, highestBidderName, nextBidderId }) => {
            console.log(`[MultiplayerGameClient ${this.mySocketId}] Received "auction-bid-update" for ${propertyName}. New bid: ${currentBid} by ${highestBidderName}`);
            // Update auction modal if it's open
            this.fixedUI.updateAuctionModal(currentBid, highestBidderName, nextBidderId === this.mySocketId);
        });
        
        // NEW: Handle auction ended
        this.syncClient.socket.on("auction-ended", ({ propertyName, winnerName, winningBid }) => {
            console.log(`[MultiplayerGameClient ${this.mySocketId}] Received "auction-ended" for ${propertyName}. Winner: ${winnerName}, Bid: ${winningBid}`);
            this.fixedUI.closeAuctionModal();
            this.fixedUI.updateChatMessage(`Auction for ${propertyName} ended. ${winnerName ? `${winnerName} won with a bid of $${winningBid}.` : 'No bids were placed.'}`);
        });

        this.syncClient.socket.on("property-updated", ({ pos, ownerId, isMortgaged, houses, hasHotel, hasSkyscraper, hasDepot }) => {
            console.log(`[MP Client] Received "property-updated" for pos ${pos}:`, { ownerId, isMortgaged, houses, hasHotel, hasSkyscraper, hasDepot });
            const property = this.board[pos];
            if (property) {
                if (ownerId !== undefined) { // ownerId could be null if sold to bank (not typical for develop/mortgage)
                    property.owner = this.players.find(p => p.id === ownerId) || null;
                }
                if (isMortgaged !== undefined) property.isMortgaged = isMortgaged;
                if (houses !== undefined) property.houses = houses;
                if (hasHotel !== undefined) property.hasHotel = hasHotel;
                if (hasSkyscraper !== undefined) property.hasSkyscraper = hasSkyscraper;
                if (hasDepot !== undefined && property.realEstateType === 'railroad') property.hasDepot = hasDepot;

                // If the real estate modal is open for the current player, refresh it
                const modal = document.getElementById("realestate-modal");
                const currentPlayer = this.players[this.whosTurn];
                if (modal && currentPlayer && currentPlayer.id === this.mySocketId) {
                    // Re-invoke showRealEstateList to refresh its content
                    // This requires the callbacks to be accessible or re-passed.
                    // For simplicity, we might just close it and let the user reopen,
                    // or the FixedUIScreen needs a more direct refresh method.
                    // Let's assume for now the user might need to reopen or the game's `render()` handles UI updates.
                    // A simple approach:
                    // if (document.getElementById("realestate-modal")) {
                    //    document.getElementById("realestate-modal").remove(); // Close it
                    //    this.fixedUI.updateChatMessage("Property updated. Re-open list to see changes.");
                    // }
                }
                this.render(); // Re-render game board visuals if needed (e.g., house icons)
            }
        });

        this.syncClient.socket.on("action-failed", ({ reason }) => {
            console.warn(`[MP Client] Server reported action failed: ${reason}`);
            alert(`Action failed: ${reason}`); // Simple alert for now
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

module.exports = MultiplayerGameClient;