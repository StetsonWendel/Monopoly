const { io } = require("socket.io-client");

class MonopolyNetwork {
  constructor(serverUrl, gameCode, playerIds, boardLength, propertyCount) {
    this.socket = io(serverUrl);
    this.gameCode = gameCode;
    this.playerPositions = {};
    this.properties = {};
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

    this.socket.on("sync-positions", (positions) => {
      this.playerPositions = positions;
      this.onPositions(positions);
    });

    this.socket.on("sync-properties", (properties) => {
      this.properties = properties;
      this.onProperties(properties);
    });

    this.socket.on("turn-update", ({ currentTurn }) => {
      this.onTurnUpdate(currentTurn);
    });

    this.socket.on("buy-failed", ({ propertyId, reason }) => {
      alert(`Failed to buy property ${propertyId}: ${reason}`);
    });
  }

  movePlayer(playerId, roll) {
    this.socket.emit("player-move", {
      gameCode: this.gameCode,
      playerId,
      roll
    });
  }

  buyProperty(propertyId, playerId) {
    this.socket.emit("buy-property", {
      gameCode: this.gameCode,
      propertyId,
      playerId
    });
  }

  endTurn() {
    this.socket.emit("end-turn", { gameCode: this.gameCode });
  }

  setPositionsHandler(fn) {
    this.onPositions = fn;
  }

  setPropertiesHandler(fn) {
    this.onProperties = fn;
  }

  setTurnUpdateHandler(fn) {
    this.onTurnUpdate = fn;
  }
}

module.exports = { MonopolyNetwork };