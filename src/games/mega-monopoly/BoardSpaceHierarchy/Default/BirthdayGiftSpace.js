const BoardSpace = require('../../BoardSpace');

class BirthdayGiftSpace extends BoardSpace {
    constructor({ pos, name = "Birthday Gift", edge, cell }) {
        super({ pos, name, edge, cell });
        this.type = "birthday-gift";

    }

    populateCell(){
        // Insert auction image with desired parameters.
        const imgSrc = "games/mega-monopoly/assets/birthday-gift.png";
        super.renderImage(imgSrc, "60%", "60%", "70%");
        super.renderName("-70%", "1.7em", "1px");
    }

    // Called when a player lands on this space
    onLand(player, game) {
        // Trigger birthday gift logic if implemented in the game
        if (game && typeof game.giveBirthdayGift === "function") {
            game.giveBirthdayGift(player);
        } else {
            console.log(`${player.name} landed on Birthday Gift, but no birthday gift logic is implemented.`);
        }
    }
}

module.exports = BirthdayGiftSpace;