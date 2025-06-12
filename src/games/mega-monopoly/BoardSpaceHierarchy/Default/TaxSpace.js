const BoardSpace = require('../../BoardSpace');

class TaxSpace extends BoardSpace {
    constructor({ pos, name = "Tax", edge, amount = 100, cell }) {
        super({ pos, name, edge, cell });
        this.type = "tax";
        this.amount = amount; // The tax amount to pay
    }


    // Called when a player lands on this space
    onLand(player, game) {
        if (player && typeof player.money === "number") {
            player.money -= this.amount;
            console.log(`${player.name} paid $${this.amount} in taxes.`);
        }
    }
}

module.exports = TaxSpace;