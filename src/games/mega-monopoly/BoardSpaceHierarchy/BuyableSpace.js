const BoardSpace = require('../BoardSpace');

class BuyableSpace extends BoardSpace {
    constructor({ pos, name, edge, price, img, colorGroup, cell, backgroundColor = "#fffbe6", realestateType }) {
        super({ pos, name, edge, img, cell, backgroundColor });
        this.price = price;
        this.owner = null;
        this.mortgageValue = price / 2;
        this.isMortgaged = false;
        this.colorGroup = colorGroup;
        this.type = realestateType;
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
        player.money -= this.price;
        this.owner = player;
        return true;
    }

    offerPurchase(player) {
        if (this.owner) return false;
        if (player.money < this.price) return false;
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
            player.money -= rent;
            this.owner.money += rent;
            console.log(`${player.name} paid $${rent} rent to ${this.owner.name}`);
        }
    }

    calculateRent() {
        return 0;
    }
}

module.exports = BuyableSpace;