const BoardSpace = require('../../BoardSpace');

class BusTicketSpace extends BoardSpace {
    constructor({ pos, name = "Bus Ticket", edge, cell }) {
        super({ pos, name, edge, cell });
        this.type = "bus-ticket";

    }
    
    populateCell() {
        // Insert bus ticket image with desired parameters.
        const imgSrc = "games/mega-monopoly/assets/bus-ticket.png";
        super.renderImage(imgSrc, "100%", "110%", "80%");
        super.renderName("-60%", "2.5em", "1px");
    }


    // Called when a player lands on this space
    onLand(player, game) {
        player.numBustickets = (player.numBustickets || 0) + 1;
        if (game.fixedUI && typeof game.fixedUI.updateChatMessage === "function") {
            game.fixedUI.updateChatMessage(`${player.username} received a Bus Ticket!`);
        }
        if (typeof game.render === "function") {
            game.render();
        }
    }
}

module.exports = BusTicketSpace;