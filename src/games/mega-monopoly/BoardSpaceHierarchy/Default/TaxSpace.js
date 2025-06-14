const BoardSpace = require('../../BoardSpace');

class TaxSpace extends BoardSpace {
    constructor({ pos, name = "Tax", edge, cell }) {
        super({ pos, name, edge, cell });
        this.type = "tax";
        // Set amount based on tax type
        if (name === "Income Tax") {
            this.amount = 200;
        } else if (name === "Luxury Tax") {
            this.amount = 75;
        } else {
            this.amount = 100; // Default/fallback
        }
    }

    // Called when a player lands on this space
    onLand(player, game) {
        player.bank -= this.amount;
        if (game.fixedUI && typeof game.fixedUI.updateChatMessage === "function") {
            game.fixedUI.updateChatMessage(`${player.username} paid $${this.amount} in taxes (${this.name}).`);
        }
        if (typeof game.render === "function") {
            game.render();
        }
    }
}

module.exports = TaxSpace;