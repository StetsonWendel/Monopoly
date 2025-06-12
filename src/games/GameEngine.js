class GameEngine {
  constructor(board, players) {
    this.board = board;
    this.players = players;
    this.currentTurn = 0;
    // Game-agnostic: don't assume player positions or dice
  }

  // Add only generic, game-agnostic methods here
}

module.exports = { GameEngine };