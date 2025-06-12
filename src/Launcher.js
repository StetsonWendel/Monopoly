const { io } = require("socket.io-client");
const socket = io("http://localhost:3000");

// Import your game classes
const SinglePlayerGame = require("./games/mega-monopoly/SinglePlayerGame");
const MultiplayerGame = require("./games/mega-monopoly/MultiplayerGame");

class Launcher {
    constructor() {
        // UI references
        this.mainMenu = document.getElementById('main-menu');
        this.multiplayerMenu = document.getElementById('multiplayer-menu');
        this.hostMenu = document.getElementById('host-menu');
        this.joinMenu = document.getElementById('join-menu');
        this.playerSetupMenu = document.getElementById('player-setup-menu');
        this.waitingRoom = document.getElementById('waiting-room');
        this.gameContainer = document.getElementById('game-container');
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
        this.currentGameInstance = null; // Will hold the SinglePlayerGame or MultiplayerGame instance
        this.players = [];

        this.setupUI();
        this.setupSocket();
    }

    showMenu(menu) {
        [
            this.mainMenu, this.multiplayerMenu, this.hostMenu, this.joinMenu,
            this.playerSetupMenu, this.waitingRoom, this.gameContainer
        ].forEach(m => m.classList.add('hidden'));
        menu.classList.remove('hidden');
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
            socket.emit("host-game", code);
            socket.emit("set-username", {
                gameCode: code,
                username: this.playerUsername.value.trim().substring(0, 16)
            });
            socket.emit("set-color", {
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
                socket.emit("join-game", code);
                socket.emit("set-username", {
                    gameCode: code,
                    username: this.playerUsername.value.trim().substring(0, 16)
                });
                socket.emit("set-color", {
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
                socket.emit("set-color", {
                    gameCode: this.waitingGameCode.textContent,
                    color: this.playerColor.value
                });
            }
        };

        this.startGameBtn.onclick = () => {
            socket.emit("start-game", this.waitingGameCode.textContent);
        };

        this.waitingBackBtn.onclick = () => {
            this.showMenu(this.mainMenu);
        };
    }

    setupSocket() {
        socket.on("hosted", (gameCode) => {
            this.waitingGameCode.textContent = gameCode;
            this.playerCountSpan.textContent = "1";
            this.showMenu(this.waitingRoom);
            this.startGameBtn.classList.remove('hidden');
            this.setFirstAvailableColor();
        });

        socket.on("joined", (gameCode) => {
            this.waitingGameCode.textContent = gameCode;
            this.showMenu(this.waitingRoom);
            this.startGameBtn.classList.add('hidden');
            this.setFirstAvailableColor();
        });

        socket.on("player-joined", (playerCount) => {
            this.playerCountSpan.textContent = playerCount;
        });

        socket.on("player-list", (playersList) => {
            this.players = playersList;
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
            const myPlayer = this.players.find(p => p.id === socket.id);
            const myColor = myPlayer ? myPlayer.color : null;
            const takenColors = this.players
                .map(p => p.color)
                .filter(color => color && color !== myColor);
            Array.from(this.playerColor.options).forEach(option => {
                option.disabled = takenColors.includes(option.value);
            });
            if (myColor && this.playerColor.value !== myColor) {
                this.playerColor.value = myColor;
            }
        });

        socket.on("game-started", () => {
            this.showMenu(this.gameContainer);
            // Use the class directly
            this.currentGameInstance = new MultiplayerGame(
                this.gameContainer,
                this.players,
                socket,
                this.waitingGameCode.textContent,
                socket.id
            );
        });
    }

    setFirstAvailableColor() {
        socket.once("player-list", (players) => {
            const myPlayer = players.find(p => p.id === socket.id);
            const myColor = myPlayer ? myPlayer.color : null;
            const takenColors = players
                .map(p => p.color)
                .filter(color => color && color !== myColor);
            const colorOptions = Array.from(this.playerColor.options).map(opt => opt.value);
            const firstAvailable = colorOptions.find(c => !takenColors.includes(c)) || colorOptions[0];
            if (this.playerColor.value !== firstAvailable) {
                this.playerColor.value = firstAvailable;
                socket.emit("set-color", {
                    gameCode: this.waitingGameCode.textContent,
                    color: firstAvailable
                });
            }
        });
    }
}

// Initialize the launcher when the window loads
window.onload = () => {
    new Launcher();
};