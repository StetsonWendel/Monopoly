const BoardSpace = require('../../BoardSpace');

class ChanceSpace extends BoardSpace {
    constructor({ pos, name = "Chance", edge, cell }) { // <-- add cell
        super({ pos, name, edge, cell });              // <-- pass cell
        this.type = "chance";
        
    }

    populateCell() {
        // Insert chance image with desired parameters.
        const imgSrc = "games/mega-monopoly/assets/chance-question-mark.png";
        super.renderImage(imgSrc, "70%", "70%", "60%");
        super.renderName( "-70%", "1.5em", "1px", "'Comic Sans MS', 'Comic Sans', cursive, sans-serif");
    }

    // Called when a player lands on this space
    onLand(player, game) {
        if (game.logic && typeof game.logic.drawChanceCard === "function") {
            game.logic.drawChanceCard(player, game);
        }
    }
}

module.exports = ChanceSpace;