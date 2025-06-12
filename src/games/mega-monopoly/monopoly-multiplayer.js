const { renderBoard } = require('./MonopolyGame');
const { MonopolyNetwork } = require('./monopoly-client');
const { GameEngine } = require('../game-engine');
const baseMegaBoard = require('./monopoly-board-data.json');


function startMultiplayerGame(container, players, socket, gameCode, myId) {
  players.forEach(player => { if (typeof player.bank !== 'number') player.bank = 1500; });
  const megaBoard = createMegaBoard();
  const engine = new GameEngine(megaBoard, players);

  // Ensure playerPositions is initialized in the engine for all players
  // This prevents errors if GameEngine doesn't initialize it or if initial render happens
  // before network sync.
  if (typeof engine.playerPositions !== 'object' || engine.playerPositions === null) {
    engine.playerPositions = {};
  }
  players.forEach(player => {
    if (engine.playerPositions[player.id] === undefined) {
      engine.playerPositions[player.id] = 0; // Default to starting position (e.g., GO)
    }
  });

  // Prepare MonopolyNetwork
  const playerIds = players.map(p => p.id);
  const network = new MonopolyNetwork(
    "http://localhost:3100",
    gameCode,
    playerIds,
    megaBoard.length,
    megaBoard.filter(sq => sq.type === "property" || sq.type === "railroad" || sq.type === "utility").length
  );

  network.setPositionsHandler((positions) => {
    engine.playerPositions = positions;
    render();
  });

  network.setPropertiesHandler((properties) => {
    Object.keys(properties).forEach(pid => {
      const prop = megaBoard.find(sq =>
        (sq.type === "property" || sq.type === "railroad" || sq.type === "utility") &&
        String(sq.propertyId) === pid
      );
      if (prop) prop.owner = properties[pid];
    });
    render();
  });

  network.setTurnUpdateHandler((currentTurn) => {
    engine.currentTurn = currentTurn;
    render();
  });

  function handleCellClick(square) {
    // Show property modal, trade, etc.
  }

  function attachHandlers() {
    const infoDiv = container.querySelector("#mm-info");
    const rollBtn = container.querySelector("#mm-roll");
    const endTurnBtn = container.querySelector("#mm-end-turn");
    const backBtn = container.querySelector("#mm-back");

    if (rollBtn) {
      rollBtn.onclick = () => {
        if (players[engine.currentTurn].id !== myId) {
          infoDiv.innerHTML = "It's not your turn!";
          return;
        }
        const player = players[engine.currentTurn];
        const roll = {
          d1: Math.ceil(Math.random() * 6),
          d2: Math.ceil(Math.random() * 6),
          mega: Math.ceil(Math.random() * 12)
        };
        network.movePlayer(player.id, roll);
      };
    }

    if (endTurnBtn) {
      endTurnBtn.onclick = () => {
        if (players[engine.currentTurn].id !== myId) return;
        network.endTurn();
      };
    }

    if (backBtn) {
      backBtn.onclick = () => {
        window.location.reload();
      };
    }
  }

  function render() {
    renderBoard(container, engine, players, myId, undefined, megaBoard, handleCellClick);
    attachHandlers();
  }

  // Initial render and handlers
  render();
}

module.exports = {
  key: "mega-monopoly-multiplayer",
  name: "Mega Monopoly (Multiplayer)",
  startMultiplayerGame
};