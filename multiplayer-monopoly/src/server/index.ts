import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";
import { SocketManager } from './network/socket';
import { Monopoly } from './game/monopoly';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const socketManager = new SocketManager(io);
const monopolyGame = new Monopoly();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Welcome to the Multiplayer Monopoly Game!');
});

// Initialize socket connections
io.on('connection', (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join", (playerName: string) => {
        try {
            monopolyGame.addPlayer(playerName);
            io.emit("playerList", monopolyGame['players']); // Expose player list
        } catch (err: any) {
            socket.emit("error", err.message);
        }
    });

    socket.on("startGame", () => {
        try {
            monopolyGame.startGame();
            io.emit("gameStarted", monopolyGame.getCurrentPlayer());
        } catch (err: any) {
            socket.emit("error", err.message);
        }
    });

    socket.on("action", (action) => {
        monopolyGame.handleAction(action);
        io.emit("gameState", monopolyGame['gameState']);
    });

    socket.on("nextTurn", () => {
        monopolyGame.nextTurn();
        io.emit("currentPlayer", monopolyGame.getCurrentPlayer());
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});