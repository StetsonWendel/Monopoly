const { Server } = require("socket.io");
const MonopolyMultiplayerServer = require("./src/games/mega-monopoly/Multiplayer/MonopolyMultiplayerServer"); // Ensure this path is correct

const io = new Server(3000, {
  cors: { origin: "*" }
});

const lobbies = {}; // { gameCode: { host, players: [{id, color, username}], gameType } }
const activeGameInstances = {}; // To store active game server instances

io.on("connection", (socket) => {
    // **** TEMPORARY DEBUG LISTENER ****
    socket.on("join-monopoly", (data) => {
        console.log(`[Server.js DEBUG] Global listener caught "join-monopoly" from socket ${socket.id} with data:`, data);
    });
    // **** END TEMPORARY DEBUG LISTENER ****

    // Host a new game
    socket.on("host-game", (gameCode) => {
        lobbies[gameCode] = { host: socket.id, players: [{ id: socket.id, color: null, username: null }], gameType: "monopoly" };
        socket.join(gameCode);
        socket.emit("hosted", gameCode);
        io.to(gameCode).emit("player-list", lobbies[gameCode].players);
    });

    // Join an existing game
    socket.on("join-game", (gameCode) => {
        if (lobbies[gameCode]) {
            lobbies[gameCode].players.push({ id: socket.id, color: null, username: null });
            socket.join(gameCode);
            socket.emit("joined", gameCode);
            io.to(gameCode).emit("player-list", lobbies[gameCode].players);
            io.to(gameCode).emit("player-joined", lobbies[gameCode].players.length);
        } else {
            socket.emit("error", "Game not found");
        }
    });

    // Set username
    socket.on("set-username", ({ gameCode, username }) => {
        if (lobbies[gameCode]) {
            const player = lobbies[gameCode].players.find(p => p.id === socket.id);
            if (player) player.username = username;
            io.to(gameCode).emit("player-list", lobbies[gameCode].players);
        }
    });

    // Set color
    socket.on("set-color", ({ gameCode, color }) => {
        if (lobbies[gameCode]) {
            const player = lobbies[gameCode].players.find(p => p.id === socket.id);
            if (player) player.color = color;
            io.to(gameCode).emit("player-list", lobbies[gameCode].players);
        }
    });

    // Handle disconnects in the lobby
    socket.on("disconnect", () => {
        for (const code in lobbies) {
            const idx = lobbies[code].players.findIndex(p => p.id === socket.id);
            if (idx !== -1) {
                lobbies[code].players.splice(idx, 1);
                io.to(code).emit("player-joined", lobbies[code].players.length);
                if (lobbies[code].players.length === 0) {
                    delete lobbies[code];
                }
                break;
            }
        }
    });

    // Start the game (hand off to Monopoly server)
    socket.on("start-game", (gameCode) => {
        if (lobbies[gameCode] && lobbies[gameCode].host === socket.id) {
            // Ensure players array is populated correctly from the lobby
            if (!lobbies[gameCode].players || lobbies[gameCode].players.length === 0) {
                console.error(`[Server.js] Attempted to start game ${gameCode} with no players in lobby.`);
                socket.emit("error", "Cannot start game with no players.");
                return;
            }

            console.log(`[Server.js] Starting game ${gameCode}. Creating MonopolyMultiplayerServer instance.`);
            const gameInstance = new MonopolyMultiplayerServer(io, gameCode, lobbies[gameCode]);
            activeGameInstances[gameCode] = gameInstance;
            
            // **** ADD THIS DEBUG BLOCK ****
            const roomSockets = io.sockets.adapter.rooms.get(gameCode);
            if (roomSockets) {
                console.log(`[Server.js DEBUG] Sockets in room ${gameCode} right before emitting "game-started": ${Array.from(roomSockets)}`);
            } else {
                console.log(`[Server.js DEBUG] Room ${gameCode} is empty or does not exist right before emitting "game-started".`);
            }
            // **** END DEBUG BLOCK ****

            console.log(`[Server.js] MonopolyMultiplayerServer instance created for ${gameCode}. Emitting "game-started" to room ${gameCode}.`);
            // Send the list of players from the lobby along with the game-started event
            io.to(gameCode).emit("game-started", { gameCode, players: lobbies[gameCode].players });
        } else {
            socket.emit("error", "Only the host can start the game or game not found.");
        }
    });
});

console.log("Socket.IO server listening on port 3000");