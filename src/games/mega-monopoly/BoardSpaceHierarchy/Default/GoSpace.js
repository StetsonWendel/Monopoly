const BoardSpace = require('../../BoardSpace');

class GoSpace extends BoardSpace {
    constructor({ pos, name = "Go", edge, cell, backgroundColor = "#fffbe6" }) {
        super({ pos, name, edge, cell, backgroundColor });
        this.type = "go";

    }

    populateCell() {
        // Insert GO image with desired parameters.
        const imgSrc = "games/mega-monopoly/assets/go_arrow.png";
        super.renderImage(imgSrc, "70%", "20%", "80%");
        super.renderName("-25%", "2.5em", "1px");
    }

    // Called when a player lands on this space
    onLand(player, game) {
        // Award $200 (or custom amount) for landing on GO
        if (player && typeof player.money === "number") {
            player.money += 200;
            console.log(`${player.name} landed on GO and collected $200!`);
        }
    }
}

module.exports = GoSpace;