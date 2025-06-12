const MonopolyGame = require('./MonopolyGame');
const { GameEngine } = require('../game-engine');

class SinglePlayerGame {
    constructor(container, playersInfo) {
        this.container = container;
        this.players = playersInfo.map(p => ({
            ...p,
            bank: typeof p.bank === "number" ? p.bank : 1500
        }));

        // Create the MonopolyGame instance (handles board, positions, etc.)
        this.monopolyGame = new MonopolyGame(this.players);

        // Create the game engine instance with the board and players
        this.engine = new GameEngine(this.monopolyGame.board, this.players);

        // Initialize player positions if not already present
        if (!this.engine.playerPositions) {
            this.engine.playerPositions = {};
            this.players.forEach(p => { this.engine.playerPositions[String(p.id)] = 0; });
        }

        // Set the first player as the current turn
        this.engine.currentTurn = 0;

        // Initial render and event handlers
        this.render();
        this.attachHandlers();
    }

    attachHandlers() {
        const infoDiv = this.container.querySelector("#mm-info");

        // Handle rolling the dice
        this.container.querySelector("#mm-roll").onclick = () => {
            const player = this.players[this.engine.currentTurn];
            const roll = this.monopolyGame.rollDice();
            const total = roll.d1 + roll.d2;

            // Move the player token forward by the dice total
            this.engine.playerPositions[String(player.id)] =
                (this.engine.playerPositions[String(player.id)] + total) % this.monopolyGame.board.length;

            // Show info about the roll and new position
            infoDiv.innerHTML = `${player.username} rolled ${roll.d1} + ${roll.d2} (Mega: ${roll.mega}) and moved to ${this.monopolyGame.board[this.engine.playerPositions[player.id]].name}`;

            // Get the square the player landed on
            const landedSquare = this.monopolyGame.board[this.engine.playerPositions[player.id]];

            // If it's an unowned property, show the buy property modal
            if (
                landedSquare.type === "property" &&
                (!landedSquare.owner || landedSquare.owner === "unowned" || landedSquare.owner === "bank")
            ) {
                // showBuyPropertyModal(landedSquare, player); // Implement this as needed
            } else {
                // Otherwise, just re-render the board
                this.render();
            }
        };

        // Handle ending the turn (move to next player)
        this.container.querySelector("#mm-end-turn").onclick = () => {
            this.engine.currentTurn = (this.engine.currentTurn + 1) % this.players.length;
            this.render();
        };

        // Handle going back to the menu (reloads the page)
        this.container.querySelector("#mm-back").onclick = () => window.location.reload();
    }

    render() {
        this.monopolyGame.renderBoard();
        // You can add renderPlayerTokens, renderFixedUI, etc. here if needed
    }
}

module.exports = SinglePlayerGame;