const MonopolyGame = require('./MonopolyGame');
const { GameEngine } = require('../GameEngine');
const Player = require('./Player'); // <-- Add this line
const FixedUIScreen = require('./FixedUIScreen');

class SinglePlayerGame {
    constructor(container, playersInfo) {
        this.container = container;
        this.whosTurn = 0;
        this.players = playersInfo.map(p => new Player(p));
        this.monopolyGame = new MonopolyGame(this.players);
        this.engine = new GameEngine(this.monopolyGame.board, this.players);

        this.engine.currentTurn = 0;

        // Set all player positions to 0 at start
        this.players.forEach(p => { p.position = 0; });

        // Only render the board ONCE here!
        this.monopolyGame.renderBoard();

        // Create the fixed UI ONCE
        this.fixedUI = new FixedUIScreen(this.container, {
            onEndTurn: () => this.endTurn(),
            onQuit: () => { window.location.reload(); },
            onTrade: () => { /* trade logic */ },
            onSave: () => { /* save game logic */ },
            onViewRealEstate: () => { /* show real estate modal */ }
        });

        // Attach handlers ONCE
        this.attachHandlers();

        // Optionally, render other info
        this.render();

        this.fixedUI.updatePlayerInfo(this.players, this.whosTurn);
    }

    endTurn() {
        this.whosTurn = (this.whosTurn + 1) % this.players.length;
        this.engine.currentTurn++;
        this.render();
        this.startTurn();
    }

    attachHandlers() {
        const infoDiv = this.container.querySelector("#mm-info");

        this.container.querySelector("#mm-roll").onclick = () => {
            const player = this.players[this.whosTurn];
            const roll = this.monopolyGame.rollDice();
            const total = roll.d1 + roll.d2;

            // Move player using MonopolyGame's method
            const landedSquare = this.monopolyGame.movePlayer(player, total);

            infoDiv.innerHTML = `${player.username} rolled ${roll.d1} + ${roll.d2} (Mega: ${roll.mega}) and moved to ${landedSquare.name}`;

            // if (typeof landedSquare.onLand === "function") {
            //     landedSquare.onLand(player);
            // }
        };
    }

    render() {
        // Just update info displays, etc.
        this.monopolyGame.renderPlayerTokens();
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
        busBtn.style.display = player.numBustickets > 0 ? "inline-block" : "none";

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
            this.useBusTicket();
        };
    }

    rollDiceAndMove() {
        const player = this.players[this.whosTurn];
        const roll = this.monopolyGame.rollDice();
        let d3 = 0;
        if (typeof roll.mega === "number") {
            d3 = roll.mega;
        }
        const total = roll.d1 + roll.d2 + d3;

        // Move player using MonopolyGame's method
        const landedSquare = this.monopolyGame.movePlayer(player, total);

        this.render();

        // Update info
        const infoDiv = this.container.querySelector("#mm-info");
        infoDiv.innerHTML = `${player.username} rolled ${roll.d1} + ${roll.d2} (Mega: ${roll.mega}) and moved to ${landedSquare.name}`;

        // Call onLand
        if (typeof landedSquare.onLand === "function") {
            landedSquare.onLand(player);
        }

        // Mr. Monopoly logic
        if (roll.mega === "mrMonopoly") {
            const nextUnownedIdx = this.monopolyGame.findNextUnownedProperty(player.position);
            if (nextUnownedIdx !== null) {
                this.monopolyGame.movePlayer(player, (nextUnownedIdx - player.position + this.monopolyGame.board.length) % this.monopolyGame.board.length);
                const nextSpace = this.monopolyGame.board[player.position];
                this.render();
                infoDiv.innerHTML += `<br>${player.username} is moved by Mr. Monopoly to ${nextSpace.name}!`;
                if (typeof nextSpace.onLand === "function") {
                    nextSpace.onLand(player);
                }
            }
        }
    }

    useBusTicket() {
        const player = this.players[this.whosTurn];
        player.numBustickets--;
        // Implement bus ticket logic here (e.g., let player choose destination)
        alert(`${player.username} used a bus ticket! (Implement destination selection logic)`);
        // After using, call onLand for the chosen space
        // this.monopolyGame.board[newPosition].onLand(player);
    }
}

module.exports = SinglePlayerGame;