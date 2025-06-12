const BoardSpace = require('../../BoardSpace');

class AuctionSpace extends BoardSpace {
    constructor({ pos, name = "Auction", edge, cell }) {
        super({ pos, name, edge , cell});
        this.type = "auction";


    }

    populateCell(){
        // Insert auction image with desired parameters.
        const imgSrc = "games/mega-monopoly/assets/auction.png";
        super.renderImage( imgSrc, "100%", "100%", "55%");
        super.renderName( "-70%", "2.5em", "2px");
    }

    // Called when a player lands on this space
    onLand(player, game) {
        // Trigger auction logic if implemented in the game
        if (game && typeof game.startAuction === "function") {
            game.startAuction(player);
        } else {
            console.log(`${player.name} landed on Auction, but no auction logic is implemented.`);
        }
    }
}

module.exports = AuctionSpace;