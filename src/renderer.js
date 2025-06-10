const { io } = require("socket.io-client");
const socket = io("http://localhost:3000");

window.onload = () => {
  // UI references
  const mainMenu = document.getElementById('main-menu');
  const multiplayerMenu = document.getElementById('multiplayer-menu');
  const hostMenu = document.getElementById('host-menu');
  const joinMenu = document.getElementById('join-menu');
  const playerSetupMenu = document.getElementById('player-setup-menu');
  const waitingRoom = document.getElementById('waiting-room');
  const gameContainer = document.getElementById('game-container');
  const gameSelect = document.getElementById('game-select');
  const playerUsername = document.getElementById('player-username');
  const gameCodeSpan = document.getElementById('game-code');
  const joinCodeInput = document.getElementById('join-code');
  const playerColor = document.getElementById('player-color');
  const aiCount = document.getElementById('ai-count');
  const waitingGameCode = document.getElementById('waiting-game-code');
  const playerCountSpan = document.getElementById('player-count');
  const startGameBtn = document.getElementById('start-game');
  const waitingBackBtn = document.getElementById('waiting-back');
  const playerListDiv = document.getElementById('player-list');

  let selectedGame = gameSelect.value;
  let currentGameModule = null;
  let players = [];

  function showMenu(menu) {
    [mainMenu, multiplayerMenu, hostMenu, joinMenu, playerSetupMenu, waitingRoom, gameContainer].forEach(m => m.classList.add('hidden'));
    menu.classList.remove('hidden');
  }

  gameSelect.onchange = () => {
    selectedGame = gameSelect.value;
  };

  document.getElementById('single-player').onclick = async () => {
    await loadGameModule(selectedGame);
    showMenu(playerSetupMenu);
  };

  document.getElementById('multi-player').onclick = () => {
    showMenu(multiplayerMenu);
  };

  document.getElementById('host-game').onclick = async () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    gameCodeSpan.textContent = code;
    showMenu(hostMenu);
    socket.emit("host-game", code);
    socket.emit("set-username", {
      gameCode: code,
      username: playerUsername.value.trim().substring(0, 16)
    });
    socket.emit("set-color", {
      gameCode: code,
      color: playerColor.value
    });
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

  document.getElementById('player-setup-confirm').onclick = async () => {
    await loadGameModule(selectedGame);
    const color = document.getElementById('player-setup-color').value;
    const ai = parseInt(aiCount.value, 10);
    players = [
      { id: "human", username: "You", color: color }
    ];
    for (let i = 0; i < ai; i++) {
      players.push({
        id: `ai${i + 1}`,
        username: `AI ${i + 1}`,
        color: ["red", "blue", "green", "yellow", "purple", "orange"].filter(c => !players.some(p => p.color === c))[0] || "gray"
      });
    }
    showMenu(gameContainer);
    currentGameModule.startSinglePlayer(gameContainer, players);
  };

  document.getElementById('player-setup-back').onclick = () => {
    showMenu(mainMenu);
  };

  // Multiplayer waiting room logic (player list, color, etc) stays here and is game-agnostic!
  playerColor.onchange = () => {
    if (waitingGameCode.textContent) {
      socket.emit("set-color", {
        gameCode: waitingGameCode.textContent,
        color: playerColor.value
      });
    }
  };

  socket.on("hosted", (gameCode) => {
    waitingGameCode.textContent = gameCode;
    playerCountSpan.textContent = "1";
    showMenu(waitingRoom);
    startGameBtn.classList.remove('hidden');
    setFirstAvailableColor();
  });

  socket.on("joined", (gameCode) => {
    waitingGameCode.textContent = gameCode;
    showMenu(waitingRoom);
    startGameBtn.classList.add('hidden');
    setFirstAvailableColor();
  });

  socket.on("player-joined", (playerCount) => {
    playerCountSpan.textContent = playerCount;
  });

  socket.on("player-list", (playersList) => {
    players = playersList;
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
    // Color locking
    const myPlayer = players.find(p => p.id === socket.id);
    const myColor = myPlayer ? myPlayer.color : null;
    const takenColors = players
      .map(p => p.color)
      .filter(color => color && color !== myColor);
    Array.from(playerColor.options).forEach(option => {
      option.disabled = takenColors.includes(option.value);
    });
    if (myColor && playerColor.value !== myColor) {
      playerColor.value = myColor;
    }
  });

  startGameBtn.onclick = () => {
    socket.emit("start-game", waitingGameCode.textContent);
  };

  waitingBackBtn.onclick = () => {
    showMenu(mainMenu);
  };

  // Helper function to set first available color
  function setFirstAvailableColor() {
    socket.once("player-list", (players) => {
      const myPlayer = players.find(p => p.id === socket.id);
      const myColor = myPlayer ? myPlayer.color : null;
      const takenColors = players
        .map(p => p.color)
        .filter(color => color && color !== myColor);
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

  // Dynamically load the selected game module
  async function loadGameModule(gameKey) {
    if (currentGameModule && currentGameModule.key === gameKey) return;
    currentGameModule = require(`./games/${gameKey}/${gameKey}.js`);
  }

  socket.on("game-started", async () => {
    await loadGameModule(selectedGame);
    showMenu(gameContainer);
    currentGameModule.startMultiplayerGame(
      gameContainer,
      players,
      socket,
      waitingGameCode.textContent,
      socket.id
    );
  });
};