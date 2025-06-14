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
        game.logic.sendToJail(player);
        if (game.fixedUI && typeof game.fixedUI.updateChatMessage === "function") {
            game.fixedUI.updateChatMessage(`${player.username} was sent to Jail!`);
        }
        if (typeof game.endTurn === "function") {
            game.endTurn();
        }
    }
}

module.exports = GoToJailSpace;