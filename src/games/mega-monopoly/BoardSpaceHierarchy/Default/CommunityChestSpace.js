const BoardSpace = require('../../BoardSpace');

class CommunityChestSpace extends BoardSpace {
    constructor({ pos, name = "Community Chest", edge, cell }) { 
        super({ pos, name, edge, cell });                        
        this.type = "community-chest";
        
    }

    populateCell() {
        // Insert community chest image with desired parameters.
        const imgSrc = "games/mega-monopoly/assets/community-chest.png";
        super.renderImage(imgSrc, "100%", "70%", "70%");
        super.renderName("-60%", "1.5em", "1px");
    }

    // Called when a player lands on this space
    onLand(player, game) {
        // Draw a community chest card and apply its effect
        if (game && typeof game.drawCommunityChestCard === "function") {
            game.drawCommunityChestCard(player);
        } else {
            console.log(`${player.name} landed on Community Chest, but no card logic is implemented.`);
        }
    }
}

module.exports = CommunityChestSpace;