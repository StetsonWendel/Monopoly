class GameEngine {
  constructor(board, players) {
    this.board = board;
    this.players = players;
    this.currentTurn = 0;
    this.playerPositions = {};
    players.forEach(p => this.playerPositions[p.id] = 0);
  }

  rollDice() {
    return {
      d1: Math.ceil(Math.random() * 6),
      d2: Math.ceil(Math.random() * 6),
      mega: Math.ceil(Math.random() * 6)
    };
  }

  movePlayer(playerId, spaces) {
    this.playerPositions[playerId] = (this.playerPositions[playerId] + spaces) % this.board.length;
    return this.playerPositions[playerId];
  }

  // Add more: handle rent, buying, bus tickets, etc.
}

module.exports = { GameEngine };