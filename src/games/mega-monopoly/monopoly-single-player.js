// Import the GameEngine class and the renderBoard function from other modules
const { GameEngine } = require('../game-engine');
const { renderBoard, renderPlayerTokens, renderFixedUI, createGameBoard } = require('./monopoly-base');


/**
 * Starts a single player game of Mega Monopoly.
 * Sets up the board, initializes player banks and positions, and handles game turns.
 * @param {HTMLElement} container - The DOM element to render the game into
 * @param {Array} players - Array of player objects
 */
function startSinglePlayer(container, players) {
  // Create a fresh copy of the board for this game
  const megaBoard = createGameBoard();

  // Ensure every player starts with $1500 if not already set
  players.forEach(p => { if (typeof p.bank !== "number") p.bank = 1500; });

  // Create the game engine instance with the board and players
  const engine = new GameEngine(megaBoard, players);

  // Initialize player positions if not already present
  if (!engine.playerPositions) {
    engine.playerPositions = {};
    players.forEach(p => { engine.playerPositions[String(p.id)] = 0; });
  }

  // Set the first player as the current turn
  engine.currentTurn = 0;



  /**
   * Attaches event handlers to UI buttons (roll, end turn, back).
   * Handles rolling dice, moving players, buying properties, and ending turns.
   */
  function attachHandlers() {
    const infoDiv = container.querySelector("#mm-info");

    // Handle rolling the dice
    container.querySelector("#mm-roll").onclick = () => {
      const player = players[engine.currentTurn];
      const roll = rollDice();
      const total = roll.d1 + roll.d2;

      // Move the player token forward by the dice total
      engine.playerPositions[String(player.id)] =
        (engine.playerPositions[String(player.id)] + total) % megaBoard.length;

      // Show info about the roll and new position
      infoDiv.innerHTML = `${player.username} rolled ${roll.d1} + ${roll.d2} (Mega: ${roll.mega}) and moved to ${megaBoard[engine.playerPositions[player.id]].name}`;

      // Get the square the player landed on
      const landedSquare = megaBoard[engine.playerPositions[player.id]];

      // If it's an unowned property, show the buy property modal
      if (
        landedSquare.type === "property" &&
        (!landedSquare.owner || landedSquare.owner === "unowned" || landedSquare.owner === "bank")
      ) {
        showBuyPropertyModal(landedSquare, player);
      } else {
        // Otherwise, just re-render the board
        render();
      }
    };

    // Handle ending the turn (move to next player)
    container.querySelector("#mm-end-turn").onclick = () => {
      engine.currentTurn = (engine.currentTurn + 1) % players.length;
      render();
    };

    // Handle going back to the menu (reloads the page)
    container.querySelector("#mm-back").onclick = () => window.location.reload();
    
  }

  /**
   * Renders the board and attaches handlers.
   * Called after every game state change.
   */
  // function render() {
  //   renderBoard(
  //     container,
  //     engine,
  //     players,
  //     players[engine.currentTurn].id,
  //     undefined,
  //     megaBoard,
  //     handleCellClick // This should be your cell click handler
  //   );
  
  function render() {
    renderBoard(container, engine, players, megaBoard);
    renderPlayerTokens(container, engine, players, megaBoard);
    renderFixedUI(container, players, players[engine.currentTurn].id);
  }

  render();
  attachHandlers();

}

// Export the single player game module for use elsewhere
module.exports = {
  key: "mega-monopoly-single-player",
  name: "Mega Monopoly (Single Player)",
  startSinglePlayer
};