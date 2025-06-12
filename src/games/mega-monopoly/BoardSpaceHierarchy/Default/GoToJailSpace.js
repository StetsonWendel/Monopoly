const BoardSpace = require('../../BoardSpace');

class GoToJailSpace extends BoardSpace {
    constructor({ pos, name = "Go To Jail", edge, cell }) {
        super({ pos, name, edge, cell });
        this.type = "go-to-jail";

    }

    populateCell() {
        // Insert Go To Jail image with desired parameters.
        const imgSrc = "games/mega-monopoly/assets/go-to-jail.png";
        super.renderImage(imgSrc, "80%", "80%", "80%");
        super.renderName("-55%", "2.5em", "2px");
    }

    // Called when a player lands on this space
    onLand(player, game) {
        // Send the player to jail if game logic is implemented
        if (game && typeof game.sendPlayerToJail === "function") {
            game.sendPlayerToJail(player);
        } else {
            console.log(`${player.name} landed on Go To Jail, but no jail logic is implemented.`);
        }
    }
}

module.exports = GoToJailSpace;