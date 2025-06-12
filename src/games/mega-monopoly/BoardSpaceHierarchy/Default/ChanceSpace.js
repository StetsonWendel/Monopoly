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
        // Draw a chance card and apply its effect
        if (game && typeof game.drawChanceCard === "function") {
            game.drawChanceCard(player);
        } else {
            console.log(`${player.name} landed on Chance, but no card logic is implemented.`);
        }
    }
}

module.exports = ChanceSpace;