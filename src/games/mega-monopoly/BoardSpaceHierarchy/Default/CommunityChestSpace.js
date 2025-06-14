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
        if (game.communityChestDeck && typeof game.communityChestDeck.drawAndShowCard === "function") {
            game.communityChestDeck.drawAndShowCard(player, game);
        }
    }
}

module.exports = CommunityChestSpace;