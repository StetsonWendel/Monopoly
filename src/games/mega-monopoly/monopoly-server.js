const { Server } = require("socket.io");

const io = new Server(3100, { cors: { origin: "*" } });

const games = {};

io.on("connection", (socket) => {
  socket.on("init-monopoly", ({ gameCode, playerIds, boardLength, propertyCount }) => {
    if (!games[gameCode]) {
      games[gameCode] = {
        playerPositions: {},
        properties: {}, // propertyId: ownerId or "unowned"
        boardLength: boardLength || 52
      };
      playerIds.forEach(id => {
        games[gameCode].playerPositions[id] = 0;
      });
      // Initialize all properties as unowned
      for (let i = 0; i < (propertyCount || 28); i++) {
        games[gameCode].properties[i] = "unowned";
      }
    }
    socket.join(gameCode);
    socket.emit("sync-positions", games[gameCode].playerPositions);
    socket.emit("sync-properties", games[gameCode].properties);
  });

  socket.on("player-move", ({ gameCode, playerId, roll }) => {
    const game = games[gameCode];
    if (!game) return;
    if (typeof game.playerPositions[playerId] !== "number") game.playerPositions[playerId] = 0;
    const moveBy = roll.d1 + roll.d2;
    game.playerPositions[playerId] = (game.playerPositions[playerId] + moveBy) % game.boardLength;
    io.to(gameCode).emit("sync-positions", game.playerPositions);
  });

  socket.on("buy-property", ({ gameCode, propertyId, playerId }) => {
    const game = games[gameCode];
    if (!game) return;
    if (game.properties[propertyId] === "unowned") {
      game.properties[propertyId] = playerId;
      io.to(gameCode).emit("sync-properties", game.properties);
    } else {
      // Optionally emit an error if already owned
      socket.emit("buy-failed", { propertyId, reason: "already owned" });
    }
  });

  socket.on("disconnect", () => {
    for (const code in games) {
      // Optionally clean up player positions/properties if needed
      // If all sockets for a game are gone, you could delete the game
    }
  });
});

console.log("Monopoly server running on port 3100");