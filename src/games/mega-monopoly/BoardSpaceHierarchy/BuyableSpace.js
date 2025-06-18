const BoardSpace = require('../BoardSpace');

class BuyableSpace extends BoardSpace {
    constructor({ pos, name, edge, price, img, colorGroup, cell, backgroundColor = "#fffbe6", realEstateType }) {
        super({ pos, name, edge, img, cell, backgroundColor });
        this.price = price;
        this.owner = null;
        this.mortgageValue = price / 2;
        this.isMortgaged = false;
        this.colorGroup = colorGroup;
        this.realEstateType = realEstateType;
        if (this.cell) {
            // For single-player, clicking the cell shows the deed.
            // For multiplayer, deed viewing might be handled differently or through a button.
            this.cell.onclick = () => {
                if (typeof this.renderDeed === 'function') {
                    this.renderDeed(); // This implies renderDeed uses client-side modal logic
                }
            };
        }
    }

    populateCell() {
        super.renderName();
        this.renderPrice();
        this.renderColorBar();
    }

    renderPrice() {
        const priceDiv = document.createElement("div");
        priceDiv.textContent = `Price $${this.price}`;
        priceDiv.style.fontSize = "11px";
        priceDiv.style.color = "#444";
        priceDiv.style.fontWeight = "bold";
        priceDiv.style.position = "absolute";
        priceDiv.style.bottom = "4px";
        priceDiv.style.right = "6px";
        priceDiv.style.left = "6px";
        priceDiv.style.textAlign = "center";
        priceDiv.style.zIndex = "1";
        if (this.edge === "left") priceDiv.style.marginLeft = "50px";
        if (this.edge === "right") priceDiv.style.marginRight = "50px";
        this.cell.appendChild(priceDiv);
    }

    renderColorBar() {
        const colorBar = document.createElement("div");
        colorBar.className = "property-color-bar"; // <-- Add this line!
        colorBar.style.background = this.colorGroup;
        colorBar.style.border = "1px solid #000";
        if (this.edge === "top" || this.edge === "bottom") {
            colorBar.style.width = "100%";
            colorBar.style.height = "35px";
            colorBar.style.position = "absolute";
            colorBar.style.top = "0px";
        } else {
            colorBar.style.width = "40px";
            colorBar.style.height = "100%";
            colorBar.style.position = "absolute";
            colorBar.style.left = this.edge === "left" ? "0px" : "";
            colorBar.style.right = this.edge === "right" ? "0px" : "";
            colorBar.style.margin = "0";
        }
        this.cell.appendChild(colorBar);
    }

    renderDeed() {
        // This method as-is uses client-side DOM manipulation for a modal.
        // It's suitable for single-player.
        // For multiplayer, viewing deeds might be a client-side action not directly tied to onLand.
    }

    baseRenderDeed(fillHTML) {
        const modal = document.querySelector("#property-modal");
        const modalBody = document.querySelector("#property-modal-body");
        const modalClose = document.querySelector("#property-modal-close");
        const modalContent = document.querySelector("#property-modal-content");
        modalContent.style.background = "#fffbe6"; // Main modal content area

        modalClose.onclick = () => { modal.style.display = "none"; };
        modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };
        modalBody.innerHTML = fillHTML;
        modal.style.display = "flex";
    }

    // buy(player) - This method is now effectively handled by logic.purchaseProperty
    // and the server/client interaction for offers.

    // offerPurchase(player) - This logic is moved into onLand and adapted for context.

    /**
     * Called when a player lands on this space.
     * @param {Player} player - The player object landing on the space.
     * @param {MonopolyBaseLogic} logic - The game logic instance.
     * @param {SinglePlayerGame | {io: SocketIO.Server, gameCode: string, socketId: string}} context - Context object.
     */
    onLand(player, logic, context) {
        console.log(`[BuyableSpace] ${player.username} landed on ${this.name}. Owner: ${this.owner ? this.owner.username : 'None'}. Mortgaged: ${this.isMortgaged}`);
        console.log("context.fixedUI:", context.fixedUI);
        console.log("showBuyPropertyModal:", context.fixedUI && context.fixedUI.showBuyPropertyModal);
        if (this.owner === null) {
            // Space is unowned
            if (player.money >= this.price) {
                if (context.fixedUI && typeof context.fixedUI.showBuyPropertyModal === 'function') { // Single-player
                    console.log(`[BuyableSpace SP] Offering ${this.name} to ${player.username} via modal.`);
                    context.fixedUI.showBuyPropertyModal(this, player, 
                        () => { // onBuy
                            logic.purchaseProperty(player, this);
                            context.fixedUI.updateChatMessage(`${player.username} bought ${this.name}.`);
                            context.render(); // Re-render single-player game
                        },
                        () => { // onDecline (Auction)
                            context.fixedUI.updateChatMessage(`${player.username} declined to buy ${this.name}. Starting auction.`);
                            logic.startAuction(this, player); // Single-player auction
                        }
                    );
                } else if (context.io) { // Multiplayer server context
                    console.log(`[BuyableSpace MP] Emitting "offer-to-buy-property" for ${this.name} to player ${player.id} (socket ${context.socketId}).`);
                    const targetSocket = context.io.sockets.sockets.get(context.socketId);
                    if (targetSocket) {
                        targetSocket.emit("offer-to-buy-property", {
                            propertyPos: this.pos,
                            propertyName: this.name,
                            price: this.price
                        });
                    }
                    context.io.to(context.gameCode).emit("game-message", `${player.username} landed on unowned ${this.name} and can buy it for $${this.price}.`);
                }
            } else {
                // Cannot afford
                const message = `${player.username} landed on unowned ${this.name} but cannot afford it.`;
                if (context.fixedUI) { // Single-player
                    context.fixedUI.updateChatMessage(message);
                    logic.startAuction(this, player); // Trigger auction in single-player
                } else if (context.io) { // Multiplayer
                    context.io.to(context.gameCode).emit("game-message", message + " Auction will begin.");
                    // Server directly calls logic to start auction
                    logic.startAuction(this, player, context.io, context.gameCode);
                }
            }
        } else if (this.owner.id !== player.id && !this.isMortgaged) {
            // Space is owned by another player and not mortgaged - pay rent
            let rent = 0;
            // UtilitySpace needs dice roll for rent calculation, which isn't directly in this signature.
            // The `logic` instance or `context` (if server) should provide the last roll.
            if (this.realEstateType === 'utility') {
                // Assuming logic.getLastRoll() exists or context for server has roll info
                const lastRoll = logic.getLastRoll ? logic.getLastRoll() : (context.lastClientRoll || {d1:1, d2:1}); // Fallback for safety
                const totalRoll = lastRoll.d1 + lastRoll.d2 + (typeof lastRoll.mega === 'number' ? lastRoll.mega : 0);
                rent = this.calculateRent(totalRoll); // UtilitySpace's calculateRent needs the roll
            } else {
                rent = this.calculateRent(player, logic); // PropertySpace and RailroadSpace
            }
            
            const rentPaid = logic.playerPaysRent(player, this.owner, rent);

            if (context.fixedUI) { // Single-player
                context.fixedUI.updateChatMessage(`${player.username} paid $${rentPaid} rent to ${this.owner.username} for ${this.name}.`);
                context.render();
            } else if (context.io) { // Multiplayer
                context.io.to(context.gameCode).emit("player-data-updated", { playerId: player.id, money: player.money });
                context.io.to(context.gameCode).emit("player-data-updated", { playerId: this.owner.id, money: this.owner.money });
                context.io.to(context.gameCode).emit("game-message", `${player.username} paid $${rentPaid} rent to ${this.owner.username} for ${this.name}.`);
            }
        } else if (this.owner.id === player.id) {
            // Landed on own property
            const message = `${player.username} landed on their own property: ${this.name}.`;
            if (context.fixedUI) {
                context.fixedUI.updateChatMessage(message);
            } else if (context.io) {
                context.io.to(context.gameCode).emit("game-message", message);
            }
        } else if (this.isMortgaged) {
            // Landed on a mortgaged property
            const message = `${this.name} is mortgaged. No rent collected.`;
             if (context.fixedUI) {
                context.fixedUI.updateChatMessage(message);
            } else if (context.io) {
                context.io.to(context.gameCode).emit("game-message", message);
            }
        }
    }

    /**
     * Calculates rent. To be overridden by subclasses.
     * @param {Player} [playerLanded] - The player who landed (for context like set ownership).
     * @param {MonopolyBaseLogic} [logic] - Game logic for context.
     * @returns {number}
     */
    calculateRent(playerLanded, logic) {
        console.warn(`[BuyableSpace] Base calculateRent called for ${this.name}. This should be overridden.`);
        return 0; // Base implementation
    }

    mortgage(player, logic) { // Pass logic for potential game rule interactions
        if (this.isMortgaged) {
            return { success: false, reason: "Already mortgaged." };
        }
        // Prevent mortgaging if developed (logic might be better handled in PropertySpace/RailroadSpace directly or via logic checks)
        if (this.realEstateType === "property") {
            if ((this.houses && this.houses > 0) || this.hasHotel || this.hasSkyscraper) {
                return { success: false, reason: "Cannot mortgage a developed property." };
            }
        } else if (this.realEstateType === "railroad") {
            if (this.hasDepot) { // Assuming hasDepot is a property of RailroadSpace
                return { success: false, reason: "Cannot mortgage a railroad with a depot." };
            }
        } // Utilities typically don't have "development" in the same way, but check if your game has it.

        this.isMortgaged = true;
        player.money += this.mortgageValue; // Use player.money consistently
        return { success: true, amount: this.mortgageValue };
    }

    unmortgage(player, logic) { // Pass logic
        if (!this.isMortgaged) {
            return { success: false, reason: "Property is not mortgaged." };
        }
        const cost = Math.ceil(this.mortgageValue * 1.1); // 10% interest
        if (player.money < cost) {
            return { success: false, reason: "Not enough money to unmortgage.", cost };
        }
        player.money -= cost;
        this.isMortgaged = false;
        return { success: true, cost };
    }
}

module.exports = BuyableSpace;