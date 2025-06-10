const { io } = require("socket.io-client");
const socket = io("http://localhost:3000");

window.onload = () => {
  const mainMenu = document.getElementById('main-menu');
  const multiplayerMenu = document.getElementById('multiplayer-menu');
  const hostMenu = document.getElementById('host-menu');
  const joinMenu = document.getElementById('join-menu');
  const playerSetupMenu = document.getElementById('player-setup-menu');
  const gameCodeSpan = document.getElementById('game-code');
  const joinCodeInput = document.getElementById('join-code');
  const playerColor = document.getElementById('player-color');
  const aiCount = document.getElementById('ai-count');
  const waitingRoom = document.getElementById('waiting-room');
  const waitingGameCode = document.getElementById('waiting-game-code');
  const playerCountSpan = document.getElementById('player-count');
  const startGameBtn = document.getElementById('start-game');
  const waitingBackBtn = document.getElementById('waiting-back');
  const playerListDiv = document.getElementById('player-list');
  const playerUsername = document.getElementById('player-username');
  const gameBoard = document.getElementById('game-board');
  const boardContainer = document.getElementById('board-container');
  const gameInfo = document.getElementById('game-info');
  const leaveGameBtn = document.getElementById('leave-game');

  let isHost = false;
  let playerPositions = {}; // { playerId: squareIndex }

  function showMenu(menu) {
    [mainMenu, multiplayerMenu, hostMenu, joinMenu, playerSetupMenu, waitingRoom, gameBoard].forEach(m => m.classList.add('hidden'));
    menu.classList.remove('hidden');
  }

  document.getElementById('single-player').onclick = () => {
    showMenu(playerSetupMenu);
  };

  document.getElementById('multi-player').onclick = () => {
    showMenu(multiplayerMenu);
  };

  document.getElementById('host-game').onclick = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    gameCodeSpan.textContent = code;
    showMenu(hostMenu);
    socket.emit("host-game", code);

    // Send username and color after hosting
    socket.emit("set-username", {
      gameCode: code,
      username: playerUsername.value.trim().substring(0, 16)
    });
    socket.emit("set-color", {
      gameCode: code,
      color: playerColor.value
    });

    isHost = true;
  };

  document.getElementById('join-game').onclick = () => {
    joinCodeInput.value = '';
    showMenu(joinMenu);
  };

  document.getElementById('back-main').onclick = () => {
    showMenu(mainMenu);
  };

  document.getElementById('host-back').onclick = () => {
    showMenu(multiplayerMenu);
  };

  document.getElementById('join-back').onclick = () => {
    showMenu(multiplayerMenu);
  };

  document.getElementById('join-confirm').onclick = () => {
    const code = joinCodeInput.value.trim().toUpperCase();
    if (code.length === 6) {
      socket.emit("join-game", code);

      // Send username and color after joining
      socket.emit("set-username", {
        gameCode: code,
        username: playerUsername.value.trim().substring(0, 16)
      });
      socket.emit("set-color", {
        gameCode: code,
        color: playerColor.value
      });
    } else {
      alert('Please enter a valid 6-character game code.');
    }
  };

  document.getElementById('player-setup-confirm').onclick = () => {
    const color = document.getElementById('player-setup-color').value;
    const ai = parseInt(aiCount.value, 10);

    // Set up single player state
    const players = [
      { id: "human", username: "You", color: color }
    ];
    for (let i = 0; i < ai; i++) {
      players.push({
        id: `ai${i + 1}`,
        username: `AI ${i + 1}`,
        color: ["red", "blue", "green", "yellow", "purple", "orange"].filter(c => !players.some(p => p.color === c))[0] || "gray"
      });
    }
    // Set all player positions to 0 (GO)
    playerPositions = {};
    players.forEach(p => playerPositions[p.id] = 0);

    // Show the board and render it
    showMenu(gameBoard);
    renderBoard(players);
    gameInfo.textContent = "Single player game started!";
  };

  document.getElementById('player-setup-back').onclick = () => {
    showMenu(mainMenu);
  };

  socket.on("hosted", (gameCode) => {
    waitingGameCode.textContent = gameCode;
    playerCountSpan.textContent = "1";
    showMenu(waitingRoom);
    startGameBtn.classList.remove('hidden');

    // Set color to first available and emit
    setFirstAvailableColor();
  });

  socket.on("joined", (gameCode) => {
    waitingGameCode.textContent = gameCode;
    showMenu(waitingRoom);
    startGameBtn.classList.add('hidden');
    isHost = false;

    // Set color to first available and emit
    setFirstAvailableColor();
  });

  socket.on("player-joined", (playerCount) => {
    playerCountSpan.textContent = playerCount;
  });

  // When in waiting room, send color to server on change
  playerColor.onchange = () => {
    if (waitingGameCode.textContent) {
      socket.emit("set-color", {
        gameCode: waitingGameCode.textContent,
        color: playerColor.value
      });
    }
  };

  // Display player list and lock taken colors
  socket.on("player-list", (players) => {
    playerListDiv.innerHTML = `
      <h3>Players:</h3>
      <ul>
        ${players.map((p, i) =>
          `<li>
            <strong>${p.username ? p.username : `Player ${i + 1}`}</strong>
            <span style="color:${p.color || 'black'};margin-left:8px;">
              ${p.color || "No color"}
            </span>
          </li>`
        ).join("")}
      </ul>
    `;

    // Color locking: disable taken colors except for this player
    const myPlayer = players.find(p => p.id === socket.id);
    const myColor = myPlayer ? myPlayer.color : null;
    const takenColors = players
      .map(p => p.color)
      .filter(color => color && color !== myColor);

    Array.from(playerColor.options).forEach(option => {
      option.disabled = takenColors.includes(option.value);
    });

    // Set dropdown to this player's color if not already set
    if (myColor && playerColor.value !== myColor) {
      playerColor.value = myColor;
    }

    // Initialize player positions if not set
    players.forEach(p => {
      if (!(p.id in playerPositions)) {
        playerPositions[p.id] = 0;
      }
    });

    // Re-render board to show tokens
    renderBoard(players);
  });

  startGameBtn.onclick = () => {
    console.log("Start Game clicked");
    socket.emit("start-game", waitingGameCode.textContent);
  };

  // Simple board squares for demo (replace with real Monopoly squares later)
  const boardSquares = [
    "GO", "Mediterranean Ave", "Community Chest", "Baltic Ave", "Income Tax", "Reading RR",
    "Oriental Ave", "Chance", "Vermont Ave", "Connecticut Ave", "Jail",
    // ...add more squares as needed...
  ];

  // Render the board as a grid
  function renderBoard(players = []) {
    boardContainer.innerHTML = "";
    boardSquares.forEach((name, i) => {
      const square = document.createElement("div");
      square.textContent = name;
      square.style.border = "1px solid #888";
      square.style.width = "96px";
      square.style.height = "96px";
      square.style.display = "flex";
      square.style.flexDirection = "column";
      square.style.alignItems = "center";
      square.style.justifyContent = "center";
      square.style.fontSize = "12px";
      square.style.background = i === 0 ? "#ffd" : "#fff";

      // Add player tokens for this square
      const tokensHere = players.filter(p => playerPositions[p.id] === i);
      tokensHere.forEach(p => {
        const token = document.createElement("div");
        token.title = p.username || "Player";
        token.style.width = "24px";
        token.style.height = "24px";
        token.style.borderRadius = "50%";
        token.style.background = p.color || "gray";
        token.style.margin = "2px";
        token.style.border = "2px solid #222";
        square.appendChild(token);
      });

      boardContainer.appendChild(square);
    });
  }

  // Show the board when the game starts
  socket.on("game-started", () => {
    showMenu(gameBoard);
    renderBoard();
    gameInfo.textContent = "Game started! (Player movement and turns coming soon)";

    // Initialize all players at GO (index 0)
    socket.emit("request-player-list", waitingGameCode.textContent);
  });

  // Leave game button
  leaveGameBtn.onclick = () => {
    showMenu(mainMenu);
    // Optionally: notify server to leave game
  };

  socket.on("error", (msg) => {
    alert(msg);
  });

  // Helper function to set first available color
  function setFirstAvailableColor() {
    // Wait for player-list event to get current taken colors
    socket.once("player-list", (players) => {
      const myPlayer = players.find(p => p.id === socket.id);
      const myColor = myPlayer ? myPlayer.color : null;
      const takenColors = players
        .map(p => p.color)
        .filter(color => color && color !== myColor);

      // Find first available color
      const colorOptions = Array.from(playerColor.options).map(opt => opt.value);
      const firstAvailable = colorOptions.find(c => !takenColors.includes(c)) || colorOptions[0];

      if (playerColor.value !== firstAvailable) {
        playerColor.value = firstAvailable;
        socket.emit("set-color", {
          gameCode: waitingGameCode.textContent,
          color: firstAvailable
        });
      }
    });
  }
};