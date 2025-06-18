const { io } = require("socket.io-client");
const MonopolySyncClient = require("./games/mega-monopoly/Multiplayer/MonopolySyncClient");
// Make sure MultiplayerGame is also required if not already
const MultiplayerGameClient = require('./games/mega-monopoly/Multiplayer/MultiplayerGameClient');
const SinglePlayerGame = require('./games/mega-monopoly/SinglePlayerGame'); // Assuming you have this

// Establish the ONE main socket connection
const mainSocket = io("http://localhost:3000"); // Or your server URL
// Remove global currentGameCode and myLobbyPlayerInfo if they are managed by the Launcher instance
// let currentGameCode = null;
// let myLobbyPlayerInfo = null;

mainSocket.on("connect", () => {
    console.log(`[Launcher GLOBAL] Connected to server with socket ID: ${mainSocket.id}`);
});

// --- Global Lobby Event Handlers (can be moved into Launcher or kept if simple) ---
// It's generally cleaner to have all socket event handling that affects UI
// within the class that manages that UI. However, for now, let's focus on fixing game start.
// If these are kept global, ensure they don't conflict with Launcher instance logic.

// mainSocket.on("hosted", (gc) => { ... }); // These might be better inside Launcher.setupSocket
// mainSocket.on("joined", (gc) => { ... });
// mainSocket.on("player-list", (players) => { ... });


// REMOVE THE ENTIRE GLOBAL mainSocket.on("game-started", ...) HANDLER HERE
// From: mainSocket.on("game-started", (data) => { ... });
// To: }); // End of the old global handler


class Launcher {
    constructor() {
        // UI references
        this.mainMenu = document.getElementById('main-menu');
        this.multiplayerMenu = document.getElementById('multiplayer-menu');
        this.hostMenu = document.getElementById('host-menu');
        this.joinMenu = document.getElementById('join-menu');
        this.playerSetupMenu = document.getElementById('player-setup-menu');
        this.waitingRoom = document.getElementById('waiting-room');
        this.gameContainer = document.getElementById('game-container'); // This is the one to use
        this.gameSelect = document.getElementById('game-select');
        this.playerUsername = document.getElementById('player-username');
        this.gameCodeSpan = document.getElementById('game-code');
        this.joinCodeInput = document.getElementById('join-code');
        this.playerColor = document.getElementById('player-color');
        this.aiCount = document.getElementById('ai-count');
        this.waitingGameCode = document.getElementById('waiting-game-code');
        this.playerCountSpan = document.getElementById('player-count');
        this.startGameBtn = document.getElementById('start-game');
        this.waitingBackBtn = document.getElementById('waiting-back');
        this.playerListDiv = document.getElementById('player-list');

        this.selectedGame = this.gameSelect.value;
        this.currentGameInstance = null;
        this.players = []; // This will be populated by player-list event

        this.setupUI();
        this.setupSocket(); // This will set up the "game-started" listener correctly
    }

    showMenu(menu) {
        [
            this.mainMenu, this.multiplayerMenu, this.hostMenu, this.joinMenu,
            this.playerSetupMenu, this.waitingRoom, this.gameContainer
        ].forEach(m => m.classList.add('hidden'));
        if (menu) { // Ensure menu is not null/undefined
            menu.classList.remove('hidden');
        } else {
            console.error("Attempted to show an undefined menu");
        }
    }

    setupUI() {
        this.gameSelect.onchange = () => {
            this.selectedGame = this.gameSelect.value;
        };

        document.getElementById('single-player').onclick = () => {
            this.showMenu(this.playerSetupMenu);
        };

        document.getElementById('multi-player').onclick = () => {
            this.showMenu(this.multiplayerMenu);
        };

        document.getElementById('host-game').onclick = () => {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            this.gameCodeSpan.textContent = code;
            this.showMenu(this.hostMenu);
            mainSocket.emit("host-game", code);
            mainSocket.emit("set-username", {
                gameCode: code,
                username: this.playerUsername.value.trim().substring(0, 16)
            });
            mainSocket.emit("set-color", {
                gameCode: code,
                color: this.playerColor.value
            });
        };

        document.getElementById('join-game').onclick = () => {
            this.joinCodeInput.value = '';
            this.showMenu(this.joinMenu);
        };

        document.getElementById('back-main').onclick = () => {
            this.showMenu(this.mainMenu);
        };
        document.getElementById('host-back').onclick = () => {
            this.showMenu(this.multiplayerMenu);
        };
        document.getElementById('join-back').onclick = () => {
            this.showMenu(this.multiplayerMenu);
        };

        document.getElementById('join-confirm').onclick = () => {
            const code = this.joinCodeInput.value.trim().toUpperCase();
            if (code.length === 6) {
                mainSocket.emit("join-game", code);
                mainSocket.emit("set-username", {
                    gameCode: code,
                    username: this.playerUsername.value.trim().substring(0, 16)
                });
                mainSocket.emit("set-color", {
                    gameCode: code,
                    color: this.playerColor.value
                });
            } else {
                alert('Please enter a valid 6-character game code.');
            }
        };

        document.getElementById('player-setup-confirm').onclick = () => {
            const color = document.getElementById('player-setup-color').value;
            const ai = parseInt(this.aiCount.value, 10);
            this.players = [
                { id: "human", username: "You", color: color }
            ];
            for (let i = 0; i < ai; i++) {
                this.players.push({
                    id: `ai${i + 1}`,
                    username: `AI ${i + 1}`,
                    color: ["red", "blue", "green", "yellow", "purple", "orange"].filter(c => !this.players.some(p => p.color === c))[0] || "gray"
                });
            }
            this.showMenu(this.gameContainer);
            // Use the class directly
            this.currentGameInstance = new SinglePlayerGame(this.gameContainer, this.players);
        };

        document.getElementById('player-setup-back').onclick = () => {
            this.showMenu(this.mainMenu);
        };

        this.playerColor.onchange = () => {
            if (this.waitingGameCode.textContent) {
                mainSocket.emit("set-color", {
                    gameCode: this.waitingGameCode.textContent,
                    color: this.playerColor.value
                });
            }
        };

        this.startGameBtn.onclick = () => {
            mainSocket.emit("start-game", this.waitingGameCode.textContent);
        };

        this.waitingBackBtn.onclick = () => {
            this.showMenu(this.mainMenu);
        };
    }

    setupSocket() {
        mainSocket.on("hosted", (gameCode) => {
            this.waitingGameCode.textContent = gameCode;
            this.playerCountSpan.textContent = "1";
            this.showMenu(this.waitingRoom);
            this.startGameBtn.classList.remove('hidden');
            this.setFirstAvailableColor();
        });

        mainSocket.on("joined", (gameCode) => {
            this.waitingGameCode.textContent = gameCode;
            this.showMenu(this.waitingRoom);
            this.startGameBtn.classList.add('hidden'); // Non-hosts shouldn't see start button
            this.setFirstAvailableColor();
        });

        mainSocket.on("player-joined", (playerCount) => {
            if (this.playerCountSpan) this.playerCountSpan.textContent = playerCount;
        });

        mainSocket.on("player-list", (playersList) => {
            this.players = playersList; // Store the latest player list
            if (this.playerListDiv) {
                this.playerListDiv.innerHTML = `
                    <h3>Players:</h3>
                    <ul>
                        ${this.players.map((p, i) =>
                            `<li>
                                <strong>${p.username ? p.username : `Player ${i + 1}`}</strong>
                                <span style="color:${p.color || 'black'};margin-left:8px;">
                                    ${p.color || "No color"}
                                </span>
                            </li>`
                        ).join("")}
                    </ul>
                `;
            }
            const myPlayer = this.players.find(p => p.id === mainSocket.id);
            const myColor = myPlayer ? myPlayer.color : null;
            const takenColors = this.players
                .map(p => p.color)
                .filter(color => color && color !== myColor);
            
            if (this.playerColor) {
                Array.from(this.playerColor.options).forEach(option => {
                    option.disabled = takenColors.includes(option.value);
                });
                if (myColor && this.playerColor.value !== myColor) {
                    this.playerColor.value = myColor;
                }
            }
        });

        // THIS IS THE CORRECT "game-started" HANDLER
        mainSocket.on("game-started", (data) => {
            console.log(`[Launcher class] Received "game-started" for game ${data.gameCode} with players:`, data.players);

            if (data.gameCode && data.players) {
                this.players = data.players; 

                this.showMenu(this.gameContainer); 

                const syncClientInstance = new MonopolySyncClient(
                    mainSocket,       
                    data.gameCode,
                    this.players.map(p => p.id), 
                    40,               
                    28                
                );
                console.log("[Launcher class] MonopolySyncClient instance created with socket:", syncClientInstance.socket.id);

                // **** ADD THIS LINE ****
                syncClientInstance.joinMonopolyGame(); // Tell the client to emit "join-monopoly"

                if (!this.gameContainer) {
                    console.error("[Launcher class] Game container (this.gameContainer) is not found!");
                    return;
                }
                
                this.currentGameInstance = new MultiplayerGameClient(
                    this.gameContainer,   
                    this.players,         
                    syncClientInstance,
                    data.gameCode,
                    mainSocket.id
                );
                console.log("[Launcher class] MultiplayerGame instance created.");
            } else {
                console.error("[Launcher class] 'game-started' event received with missing data:", data);
            }
        });
    }

    setFirstAvailableColor() {
        // ... your existing setFirstAvailableColor ...
        // Ensure it uses mainSocket correctly if it's not already.
    }
}

// Initialize the launcher when the window loads
window.onload = () => {
    new Launcher();
};