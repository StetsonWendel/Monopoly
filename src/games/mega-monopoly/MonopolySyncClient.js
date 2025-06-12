const { io } = require("socket.io-client");

class MonopolySyncClient {
    constructor(serverUrl, gameCode, playerIds, boardLength, propertyCount) {
        this.socket = io(serverUrl);
        this.gameCode = gameCode;
        this.onPositions = () => {};
        this.onProperties = () => {};
        this.onTurnUpdate = () => {};

        this.socket.on("connect", () => {
            this.socket.emit("init-monopoly", {
                gameCode,
                playerIds,
                boardLength,
                propertyCount
            });
        });

        this.socket.on("sync-positions", (positions) => this.onPositions(positions));
        this.socket.on("sync-properties", (properties) => this.onProperties(properties));
        this.socket.on("turn-update", ({ currentTurn }) => this.onTurnUpdate(currentTurn));
        this.socket.on("buy-failed", ({ propertyId, reason }) => {
            alert(`Failed to buy property ${propertyId}: ${reason}`);
        });
    }

    movePlayer(playerId, roll) {
        this.socket.emit("player-move", { gameCode: this.gameCode, playerId, roll });
    }
    buyProperty(propertyId, playerId) {
        this.socket.emit("buy-property", { gameCode: this.gameCode, propertyId, playerId });
    }
    endTurn() {
        this.socket.emit("end-turn", { gameCode: this.gameCode });
    }
    onPositionsUpdate(fn) { this.onPositions = fn; }
    onPropertiesUpdate(fn) { this.onProperties = fn; }
    onTurnUpdateHandler(fn) { this.onTurnUpdate = fn; }
}

module.exports = MonopolySyncClient;