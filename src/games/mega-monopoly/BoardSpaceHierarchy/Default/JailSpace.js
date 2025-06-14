const BoardSpace = require('../../BoardSpace');

class JailSpace extends BoardSpace {
    constructor({ pos, name = "Jail", edge, cell }) {
        super({ pos, name, edge, cell });
        this.type = "jail";

    }

    // Called when a player lands on this space
    onLand(player, game) {
        // Usually, nothing happens if you just land on Jail (not sent there)
        // console.log(`${player.name} is just visiting Jail.`);
    }
}

module.exports = JailSpace;