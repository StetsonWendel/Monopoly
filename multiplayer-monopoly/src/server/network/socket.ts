import { Server } from 'socket.io';

class SocketManager {
    private io: Server;

    constructor(server: any) {
        this.io = new Server(server);
        this.initialize();
    }

    private initialize() {
        this.io.on('connection', (socket) => {
            this.onConnection(socket);
        });
    }

    private onConnection(socket: any) {
        console.log(`New client connected: ${socket.id}`);

        socket.on('disconnect', () => {
            this.onDisconnect(socket);
        });

        // Additional event listeners can be added here
    }

    private onDisconnect(socket: any) {
        console.log(`Client disconnected: ${socket.id}`);
    }

    public emitEvent(event: string, data: any) {
        this.io.emit(event, data);
    }
}

export default SocketManager;