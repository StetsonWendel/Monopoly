const MonopolyGame = require('./MonopolyGame');
const { MonopolyNetwork } = require('./monopoly-client');
const { GameEngine } = require('../game-engine');
const boardData = require('./monopoly-board-data.json');

class MultiplayerGame {
    constructor(container, players, socket, gameCode, myId) {
        this.container = container;
        this.players = players.map(player => ({
            ...player,
            bank: typeof player.bank === 'number' ? player.bank : 1500
        }));
        this.socket = socket;
        this.gameCode = gameCode;
        this.myId = myId;

        // Create MonopolyGame and GameEngine
        this.monopolyGame = new MonopolyGame(this.players);
        this.engine = new GameEngine(this.monopolyGame.board, this.players);

        // Ensure playerPositions is initialized
        if (typeof this.engine.playerPositions !== 'object' || this.engine.playerPositions === null) {
            this.engine.playerPositions = {};
        }
        this.players.forEach(player => {
            if (this.engine.playerPositions[player.id] === undefined) {
                this.engine.playerPositions[player.id] = 0;
            }
        });

        // Prepare MonopolyNetwork
        const playerIds = this.players.map(p => p.id);
        this.network = new MonopolyNetwork(
            "http://localhost:3100",
            this.gameCode,
            playerIds,
            this.monopolyGame.board.length,
            this.monopolyGame.board.filter(
                sq => sq.type === "property" || sq.type === "railroad" || sq.type === "utility"
            ).length
        );

        // Set up network handlers
        this.network.setPositionsHandler((positions) => {
            this.engine.playerPositions = positions;
            this.render();
        });

        this.network.setPropertiesHandler((properties) => {
            Object.keys(properties).forEach(pid => {
                const prop = this.monopolyGame.board.find(sq =>
                    (sq.type === "property" || sq.type === "railroad" || sq.type === "utility") &&
                    String(sq.propertyId) === pid
                );
                if (prop) prop.owner = properties[pid];
            });
            this.render();
        });

        this.network.setTurnUpdateHandler((currentTurn) => {
            this.engine.currentTurn = currentTurn;
            this.render();
        });

        // Initial render and handlers
        this.render();
    }

    handleCellClick(square) {
        // Show property modal, trade, etc.
    }

    attachHandlers() {
        const infoDiv = this.container.querySelector("#mm-info");
        const rollBtn = this.container.querySelector("#mm-roll");
        const endTurnBtn = this.container.querySelector("#mm-end-turn");
        const backBtn = this.container.querySelector("#mm-back");

        if (rollBtn) {
            rollBtn.onclick = () => {
                if (this.players[this.engine.currentTurn].id !== this.myId) {
                    infoDiv.innerHTML = "It's not your turn!";
                    return;
                }
                const player = this.players[this.engine.currentTurn];
                const roll = {
                    d1: Math.ceil(Math.random() * 6),
                    d2: Math.ceil(Math.random() * 6),
                    mega: Math.ceil(Math.random() * 12)
                };
                this.network.movePlayer(player.id, roll);
            };
        }

        if (endTurnBtn) {
            endTurnBtn.onclick = () => {
                if (this.players[this.engine.currentTurn].id !== this.myId) return;
                this.network.endTurn();
            };
        }

        if (backBtn) {
            backBtn.onclick = () => {
                window.location.reload();
            };
        }
    }

    render() {
        // Use MonopolyGame's renderBoard method
        this.monopolyGame.renderBoard();
        this.attachHandlers();
    }
}

module.exports = MultiplayerGame;