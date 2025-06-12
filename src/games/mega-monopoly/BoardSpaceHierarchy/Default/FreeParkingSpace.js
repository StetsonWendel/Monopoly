const BoardSpace = require('../../BoardSpace');

class FreeParkingSpace extends BoardSpace {
    constructor({ pos, name = "Free Parking", edge, cell }) {
        super({ pos, name, edge, cell });
        this.type = "free-parking";
    }

    populateCell() {
        // Insert Free Parking image with desired parameters.
        const imgSrc = "games/mega-monopoly/assets/free-parking.png";
        super.renderImage(imgSrc, "60%", "60%", "75%");
        super.renderName( "-50%", "2em", "5px");
    }

    // Called when a player lands on this space
    onLand(player, game) {
        // Free Parking usually does nothing, but you can add custom logic here if desired
        console.log(`${player.name} landed on Free Parking.`);
    }
}

module.exports = FreeParkingSpace;