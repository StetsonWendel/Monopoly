const RenderMonopolyGame = require('./RenderMonopolyGame');
const MonopolyBaseLogic = require('./MonopolyBaseLogic');
const { GameEngine } = require('../GameEngine');
const Player = require('./Player');
const FixedUIScreen = require('./FixedUIScreen');
const Deck = require('./Deck');
const chanceCards = require('./chance-cards');
const communityChestCards = require('./community-chest-cards');
const busTicketCards = require('./bus-ticket-cards');

class SinglePlayerGame {
    constructor(container, playersInfo, boardData) { // <-- add boardData param
        this.container = container;
        this.whosTurn = 0;
        this.players = playersInfo.map(p => new Player(p));

        // Rendering and board creation
        this.renderGame = new RenderMonopolyGame(this.players);
        this.board = this.renderGame.renderBoard(boardData); // <-- pass boardData here

        // Game logic
        this.logic = new MonopolyBaseLogic(this.players, this.board);

        this.engine = new GameEngine(this.board, this.players);
        this.engine.currentTurn = 0;

        // Set all player positions to 0 at start
        this.players.forEach(p => { p.position = 0; });

        // Create the fixed UI ONCE
        this.fixedUI = new FixedUIScreen(this.container, {
            onEndTurn: () => this.endTurn(),
            onQuit: () => { window.location.reload(); },
            onTrade: () => { /* trade logic */ },
            onSave: () => { /* save game logic */ },
            onViewRealEstate: () => this.fixedUI.showRealEstateList(this.players[this.whosTurn], this.board)
        });

        // Optionally, render other info
        this.render();

        this.fixedUI.updatePlayerInfo(this.players, this.whosTurn);

        // Initialize decks
        this.chanceDeck = new Deck(chanceCards);
        this.communityChestDeck = new Deck(communityChestCards);
        this.busTicketDeck = new Deck(busTicketCards);

        // Pass the decks to MonopolyBaseLogic
        this.logic = new MonopolyBaseLogic(
            this.players,
            this.board,
            this.chanceDeck,
            this.communityChestDeck,
            this.busTicketDeck
        );

        this.debugMode = false; // Set to true to enable debug mode
    }

    endTurn() {
        this.whosTurn = (this.whosTurn + 1) % this.players.length;
        this.engine.currentTurn++;
        this.render();
        this.startTurn();
    }

    render() {
        // Just update info displays, etc.
        this.renderGame.renderPlayerTokens();
        this.fixedUI.updatePlayerInfo(this.players, this.whosTurn);
    }

    startTurn() {
        const player = this.players[this.whosTurn];
        const modal = document.getElementById("turn-modal");
        const title = document.getElementById("turn-modal-title");
        const rollBtn = document.getElementById("turn-modal-roll");
        const busBtn = document.getElementById("turn-modal-bus");

        title.textContent = `${player.username}, it's your turn!`;
        rollBtn.style.display = "inline-block";
        busBtn.style.display = player.numBusTickets > 0 ? "inline-block" : "none";

        modal.style.display = "flex";

        // Remove previous handlers
        rollBtn.onclick = null;
        busBtn.onclick = null;

        rollBtn.onclick = () => {
            modal.style.display = "none";
            this.rollDiceAndMove();
        };
        busBtn.onclick = () => {
            modal.style.display = "none";
            this.logic.useBusTicket(this.players[this.whosTurn], this);
        };

        if (player.inJail) {
            // Show jail options
            this.logic.showJailOptions(player, this);
            return;
        }
    }

    async rollDiceAndMove() {
        const player = this.players[this.whosTurn];
        
        let roll;
        if (this.debugMode) {
            roll = await this.getDebugDiceValues();
        } else {
            roll = this.logic.rollDice();
        }

        let d3 = 0;
        if (typeof roll.mega === "number") {
            d3 = roll.mega;
        }
        const total = roll.d1 + roll.d2 + d3;

        // Check for triples (all dice equal and d3 is a number)
        if (typeof roll.mega === "number" && roll.d1 === roll.d2 && roll.d2 === roll.mega) {
            this.logic.chooseBoardPositionByClick(player, this.board, (landedSquare) => {
                this.render();
                if (typeof landedSquare.onLand === "function") {
                    landedSquare.onLand(player, this);
                }
                // End turn after moving anywhere
            });
            return;
        }

        // Move player using MonopolyBaseLogic's method
        const landedSquare = this.logic.movePlayer(player, total);

        this.render();
   
        // Call onLand
        if (typeof landedSquare.onLand === "function") {
            landedSquare.onLand(player, this);
        }

        // Mr. Monopoly logic
        if (roll.mega === "mrMonopoly") {
            this.logic.moveMrMonopoly(player, this.board, (nextSpace) => {
                this.render();

                if (typeof nextSpace.onLand === "function") {
                    nextSpace.onLand(player, this);
                }
                // Move the chat message here:
                this.fixedUI.updateChatMessage(
                    `${player.username} is moved by Mr. Monopoly to ${nextSpace.name}!`
                );
            });
        } else if (roll.mega === "busTicket") {
            player.numBusTickets++;
        }

        // If doubles, let the player take another turn
        if (roll.d1 === roll.d2) {
            this.fixedUI.updateChatMessage(
                `${player.username} rolled doubles and gets another turn!`
            );
            this.startTurn();
        }

        this.fixedUI.updateChatMessage(
            `${player.username} rolled ${roll.d1} + ${roll.d2} (Mega: ${roll.mega}) and moved to ${landedSquare.name}`
        );
    }



    getDebugDiceValues() {
        return new Promise(resolve => {
            const modal = document.getElementById('debug-dice-modal');
            modal.style.display = 'flex';
            document.getElementById('debug-dice-ok').onclick = () => {
                const d1 = parseInt(document.getElementById('debug-die1').value, 10);
                const d2 = parseInt(document.getElementById('debug-die2').value, 10);
                let mega = document.getElementById('debug-mega').value;
                if (mega !== "mrMonopoly" && mega !== "busTicket") mega = parseInt(mega, 10);
                modal.style.display = 'none';
                resolve({ d1, d2, mega });
            };
        });
    }
}

module.exports = SinglePlayerGame;