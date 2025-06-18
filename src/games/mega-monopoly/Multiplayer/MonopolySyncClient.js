class MonopolySyncClient {
    // MODIFIED CONSTRUCTOR:
    constructor(socket, gameCode, playerIds, boardLength, propertyCount) {
        if (!socket || !socket.connected) {
            throw new Error("A connected socket instance must be provided to MonopolySyncClient constructor.");
        }
        if (!gameCode || !playerIds || !boardLength || !propertyCount) {
            throw new Error("Invalid game parameters passed to MonopolySyncClient constructor.");
        }

        this.socket = socket;
        this.gameCode = gameCode;

        this._onPositionsUpdate = () => {};
        this._onPropertiesUpdate = () => {};
        this._onTurnUpdate = () => {};
        this._onTradeCompleted = () => {};
        this._onGameStarted = () => {}; // This can still be used by MultiplayerGameClient if needed

        this.socket.on("connect", () => {
            console.log(`[MonopolySyncClient ${this.socket.id}] 'connect' event fired on existing socket. GameCode: ${this.gameCode}. Socket connected: ${this.socket.connected}`);
        });

        this.socket.on("sync-positions", (positions) => this._onPositionsUpdate(positions));
        this.socket.on("sync-properties", (properties) => this._onPropertiesUpdate(properties));
        this.socket.on("turn-update", ({ currentTurn }) => {
            console.log(`[MonopolySyncClient ${this.socket.id}] CLIENT: Received "turn-update" event from server. New turn: ${currentTurn}`);
            this._onTurnUpdate(currentTurn);
        });
        this.socket.on("buy-failed", ({ propertyId, reason }) => {
            alert(`Failed to buy property ${propertyId}: ${reason}`);
        });
        this.socket.on("trade-completed", (data) => this._onTradeCompleted(data));

        // REMOVE THIS LISTENER:
        // this.socket.on("game-started", (eventData) => { ... });
    }

    // ADD THIS NEW METHOD
    /**
     * Called after the game has officially started and this client needs to join the Monopoly game instance on the server.
     */
    joinMonopolyGame() {
        console.log(`[MonopolySyncClient ${this.socket.id}] Explicitly joining Monopoly game. Emitting "join-monopoly" for gameCode: ${this.gameCode}.`);
        this.socket.emit("join-monopoly", { gameCode: this.gameCode });
        
        // Notify MultiplayerGameClient that the game has started from its perspective
        // if it has registered a handler via onGameStartedHandler.
        if (typeof this._onGameStarted === 'function') {
            this._onGameStarted();
        }
    }

    // --- Methods to set the callbacks ---
    onPositionsUpdate(fn) { this._onPositionsUpdate = fn; }
    onPropertiesUpdate(fn) { this._onPropertiesUpdate = fn; }
    onTurnUpdateHandler(fn) {
        //console.log(`[MonopolySyncClient ${this.socket.id}] Setting _onTurnUpdate callback function.`);
        this._onTurnUpdate = fn;
    }
    onTradeCompleted(fn) { this._onTradeCompleted = fn; }
    onGameStartedHandler(fn) { this._onGameStarted = fn; } // Allow MultiplayerGameClient to hook into this

    // --- Methods to emit events to server ---
    endTurn() {
        console.log(`[MonopolySyncClient ${this.socket.id}] Emitting "end-turn" for game ${this.gameCode}`);
        this.socket.emit("end-turn", { gameCode: this.gameCode });
    }

    movePlayer(playerId, roll) {
        this.socket.emit("player-move", { gameCode: this.gameCode, playerId, roll });
    }
    buyProperty(propertyId, playerId) {
        this.socket.emit("buy-property", { gameCode: this.gameCode, propertyId, playerId });
    }
    proposeTrade(tradeObj) {
        this.socket.emit("propose-trade", { gameCode: this.gameCode, tradeObj });
    }
    developProperty(propertyPos, playerId) { // propertyPos is correct
        this.socket.emit("develop-property", { gameCode: this.gameCode, propertyPos, playerId });
    }
    undevelopProperty(propertyPos, playerId) {
        this.socket.emit("undevelop-property", { gameCode: this.gameCode, propertyPos, playerId });
    }
    mortgageProperty(propertyPos, playerId) {
        this.socket.emit("mortgage-property", { gameCode: this.gameCode, propertyPos, playerId });
    }
    unmortgageProperty(propertyPos, playerId) {
        this.socket.emit("unmortgage-property", { gameCode: this.gameCode, propertyPos, playerId });
    }
}

module.exports = MonopolySyncClient;