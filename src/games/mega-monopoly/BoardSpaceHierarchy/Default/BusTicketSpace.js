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
        // Trigger bus ticket logic if implemented in the game
        if (game && typeof game.giveBusTicket === "function") {
            game.drawBusTicket(player);
        } else {
            console.log(`${player.name} landed on Bus Ticket, but no bus ticket logic is implemented.`);
        }
    }
}

module.exports = BusTicketSpace;