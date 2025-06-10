const { Server } = require("socket.io");

const io = new Server(3000, {
  cors: { origin: "*" }
});

const games = {};

io.on("connection", (socket) => {
  socket.on("host-game", (gameCode) => {
    games[gameCode] = { host: socket.id, players: [{ id: socket.id, color: null, username: null }] };
    socket.join(gameCode);
    socket.emit("hosted", gameCode);
    io.to(gameCode).emit("player-list", games[gameCode].players);
  });

  socket.on("join-game", (gameCode) => {
    if (games[gameCode]) {
      games[gameCode].players.push({ id: socket.id, color: null, username: null });
      socket.join(gameCode);
      socket.emit("joined", gameCode);
      io.to(gameCode).emit("player-list", games[gameCode].players);
      io.to(gameCode).emit("player-joined", games[gameCode].players.length);
    } else {
      socket.emit("error", "Game not found");
    }
  });

  socket.on("set-username", ({ gameCode, username }) => {
    if (games[gameCode]) {
      const player = games[gameCode].players.find(p => p.id === socket.id);
      if (player) player.username = username;
      io.to(gameCode).emit("player-list", games[gameCode].players);
    }
  });

  socket.on("set-color", ({ gameCode, color }) => {
    if (games[gameCode]) {
      const player = games[gameCode].players.find(p => p.id === socket.id);
      if (player) player.color = color;
      io.to(gameCode).emit("player-list", games[gameCode].players);
    }
  });

  socket.on("start-game", (gameCode) => {
    if (games[gameCode] && games[gameCode].host === socket.id) {
      io.to(gameCode).emit("game-started");
    }
  });

  socket.on("disconnect", () => {
    for (const code in games) {
      const idx = games[code].players.indexOf(socket.id);
      if (idx !== -1) {
        games[code].players.splice(idx, 1);
        io.to(code).emit("player-joined", games[code].players.length);
        if (games[code].players.length === 0) {
          delete games[code];
        }
        break;
      }
    }
  });
});

console.log("Game server running on port 3000");