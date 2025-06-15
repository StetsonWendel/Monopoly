class AIPlayer {
    constructor(player) {
        this.player = player; // Reference to the Player instance
    }

    async takeTurn(game) {
        // Default AI: roll and buy if possible
        await game.rollDiceAndMove();
        const landedSquare = game.board[this.player.position];
        if (
            landedSquare &&
            landedSquare.owner == null &&
            landedSquare.price &&
            this.player.bank >= landedSquare.price
        ) {
            landedSquare.owner = this.player;
            this.player.bank -= landedSquare.price;
            this.player.addRealEstate(landedSquare);
            game.fixedUI.updateChatMessage(`${this.player.username} bought ${landedSquare.name} for $${landedSquare.price}.`);
            game.render();
        }
        setTimeout(() => game.endTurn(), 1200);
    }
}

module.exports = AIPlayer;