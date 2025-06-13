module.exports = Array(16).fill().map(() => ({
    text: "This ticket may be used in place of a dice roll. Move to any space on your current side of the board. Discard after use.",
    img: "games/mega-monopoly/assets/BusTickets/Bus_Ticket.png",
    effect: (player, game) => {
        // Implement bus ticket logic in your game (let player pick a space on their edge)
        player.numBustickets++;
    }
}));