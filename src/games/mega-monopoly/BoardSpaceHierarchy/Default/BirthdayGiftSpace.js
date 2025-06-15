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

    onLand(player, game) {
        // Only show modal to the current player
        const currentPlayer = game.players[game.whosTurn];
        if (!currentPlayer || player.id !== currentPlayer.id) return;

        // Remove any existing modal
        const oldModal = document.getElementById("birthday-gift-modal");
        if (oldModal) document.body.removeChild(oldModal);

        // Create modal
        const modal = document.createElement("div");
        modal.id = "birthday-gift-modal";
        modal.style.position = "fixed";
        modal.style.left = "0";
        modal.style.top = "0";
        modal.style.width = "100vw";
        modal.style.height = "100vh";
        modal.style.background = "#0008";
        modal.style.zIndex = "9999";
        modal.style.display = "flex";
        modal.style.alignItems = "center";
        modal.style.justifyContent = "center";

        const box = document.createElement("div");
        box.style.background = "#fffbeed0";
        box.style.padding = "24px";
        box.style.borderRadius = "12px";
        box.style.maxWidth = "400px";
        box.style.boxShadow = "0 2px 12px #0003";
        box.innerHTML = `<h3>Birthday Gift!</h3>
            <p>Choose your gift:</p>`;

        const busBtn = document.createElement("button");
        busBtn.textContent = "Take a Bus Ticket";
        busBtn.style.marginRight = "16px";
        busBtn.onclick = () => {
            player.numBusTickets = (player.numBusTickets || 0) + 1;
            document.body.removeChild(modal);
            if (game.fixedUI && typeof game.fixedUI.updateChatMessage === "function") {
                game.fixedUI.updateChatMessage(`${player.username} chose a Bus Ticket as their birthday gift!`);
            }
            game.render();
        };

        const cashBtn = document.createElement("button");
        cashBtn.textContent = "Take $100";
        cashBtn.onclick = () => {
            player.bank += 100;
            document.body.removeChild(modal);
            if (game.fixedUI && typeof game.fixedUI.updateChatMessage === "function") {
                game.fixedUI.updateChatMessage(`${player.username} took $100 as their birthday gift!`);
            }
            game.render();
        };

        box.appendChild(busBtn);
        box.appendChild(cashBtn);
        modal.appendChild(box);
        document.body.appendChild(modal);
    }
}

module.exports = BirthdayGiftSpace;