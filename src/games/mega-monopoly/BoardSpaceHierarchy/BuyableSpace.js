const BoardSpace = require('../BoardSpace');

class BuyableSpace extends BoardSpace {
    constructor({ pos, name, edge, price, img, colorGroup, cell, backgroundColor = "#fffbe6", realEstateType }) {
        super({ pos, name, edge, img, cell, backgroundColor });
        this.price = price;
        this.owner = null;
        this.mortgageValue = price / 2;
        this.isMortgaged = false;
        this.colorGroup = colorGroup;
        this.realEstateType = realEstateType; // <-- Use this property
        if (this.cell) {
            this.cell.onclick = () => this.renderDeed();
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

    buy(player) {
        player.bank -= this.price; // <-- changed from player.money
        this.owner = player;
        player.addRealEstate(this); // Add to player's owned list
        return true;
    }

    offerPurchase(player) {
        if (this.owner) return false;
        if (player.bank < this.price) return false; // <-- changed from player.money
        const confirmation = confirm(`${player.name}, do you want to buy ${this.name} for $${this.price}?`);
        if (confirmation) {
            return this.buy(player);
        }
    }

    onLand(player) {
        if (!this.owner) {
            this.offerPurchase(player);
        } else if (this.owner !== player) {
            const rent = this.calculateRent();
            player.bank -= rent; // <-- changed from player.money
            this.owner.bank += rent; // <-- changed from this.owner.money
            console.log(`${player.name} paid $${rent} rent to ${this.owner.name}`);
        }
    }

    calculateRent() {
        return 0;
    }

    /**
     * Mortgage this property. Returns {success, reason, amount}
     * Cannot mortgage if developed (houses/hotel/skyscraper for properties, depot for railroads, etc).
     */
    mortgage(player) {
        if (this.isMortgaged) {
            return { success: false, reason: "Already mortgaged." };
        }
        // Prevent mortgaging if developed
        if (this.realEstateType === "property") {
            if ((this.houses && this.houses > 0) || this.hasHotel || this.hasSkyscraper) {
                return { success: false, reason: "Cannot mortgage a developed property." };
            }
        } else if (this.realEstateType === "railroad") {
            if (this.hasDepot) {
                return { success: false, reason: "Cannot mortgage a railroad with a depot." };
            }
        } else if (this.realEstateType === "utility") {
            // If you have development for utilities, check here
            if (this.hasDevelopment) {
                return { success: false, reason: "Cannot mortgage a developed utility." };
            }
        }
        this.isMortgaged = true;
        player.bank += this.mortgageValue;
        return { success: true, amount: this.mortgageValue };
    }

    /**
     * Unmortgage this property. Returns {success, reason, cost}
     * Cost is mortgage value + 10% interest (rounded up).
     */
    unmortgage(player) {
        if (!this.isMortgaged) {
            return { success: false, reason: "Property is not mortgaged." };
        }
        const cost = Math.ceil(this.mortgageValue * 1.1);
        if (player.bank < cost) {
            return { success: false, reason: "Not enough money to unmortgage.", cost };
        }
        player.bank -= cost;
        this.isMortgaged = false;
        return { success: true, cost };
    }
}

module.exports = BuyableSpace;