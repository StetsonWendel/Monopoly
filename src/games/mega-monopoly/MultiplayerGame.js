const MonopolyGame = require('./MonopolyGame');
const { GameEngine } = require('../game-engine');
const boardData = require('./monopoly-board-data.json');

class MultiplayerGame {
    constructor(container, players, syncClient, gameCode, myId) {
        this.container = container;
        this.players = players.map(player => ({
            ...player,
            bank: typeof player.bank === 'number' ? player.bank : 1500
        }));
        this.syncClient = syncClient;
        this.gameCode = gameCode;
        this.myId = myId;

        this.monopolyGame = new MonopolyGame(this.players);
        this.engine = new GameEngine(this.monopolyGame.board, this.players);

        if (typeof this.engine.playerPositions !== 'object' || this.engine.playerPositions === null) {
            this.engine.playerPositions = {};
        }
        this.players.forEach(player => {
            if (this.engine.playerPositions[player.id] === undefined) {
                this.engine.playerPositions[player.id] = 0;
            }
        });

        // Set up sync handlers
        this.syncClient.onPositionsUpdate((positions) => {
            this.engine.playerPositions = positions;
            this.render();
        });

        this.syncClient.onPropertiesUpdate((properties) => {
            Object.keys(properties).forEach(pid => {
                const prop = this.monopolyGame.board.find(sq =>
                    (sq.type === "property" || sq.type === "railroad" || sq.type === "utility") &&
                    String(sq.propertyId) === pid
                );
                if (prop) prop.owner = properties[pid];
            });
            this.render();
        });

        this.syncClient.onTurnUpdateHandler((currentTurn) => {
            this.engine.currentTurn = currentTurn;
            this.render();
        });

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
                this.syncClient.movePlayer(player.id, roll);
            };
        }

        if (endTurnBtn) {
            endTurnBtn.onclick = () => {
                if (this.players[this.engine.currentTurn].id !== this.myId) return;
                this.syncClient.endTurn();
            };
        }

        if (backBtn) {
            backBtn.onclick = () => {
                window.location.reload();
            };
        }
    }

    render() {
        this.monopolyGame.renderBoard();
        this.attachHandlers();
    }
}

module.exports = MultiplayerGame;