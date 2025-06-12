const BuyableSpace = require('../BuyableSpace');

class RailroadSpace extends BuyableSpace {
    constructor({ pos, name, edge, price, cell, colorGroup = "black", realEstateType = "railroad" }) {
        super({ pos, name, edge, cell, price, colorGroup, realEstateType });
        this.hasDepot = false; // Track if a depot has been built;
    }

    // Rent is 25 * (2 ^ (number of railroads owned by this.owner - 1))
    calculateRent() {
        if (!this.owner || typeof this.owner.countRailroads !== "function") return 25;
        const numOwned = this.owner.countRailroads();
        if (this.hasDepot) depotDouble = 2; else depotDouble = 1;
        return 25 * Math.pow(2, Math.max(0, numOwned - 1)) * depotDouble;
    }

    renderDeed() {
        this.baseRenderDeed(this.getDeedFillHTML());
    }

    getDeedFillHTML(){
        return `
        <div style="font-family:monospace,Arial,sans-serif; width:340px; min-height:220px; background:#fffbe6; border-radius:8px; overflow:hidden;">
            <div style="background:${this.colorGroup}; color:#fff; padding:16px 0 8px 0; text-align:center; font-weight:bold; font-size:22px; letter-spacing:1px;">
            <div style="font-size:12px; font-weight:normal; letter-spacing:0.5px; margin-bottom:2px;">TITLE&nbsp;&nbsp;DEED</div>
            <div style="font-size:20px; font-weight:bold; text-transform:uppercase;">${this.name}</div>
            </div>
            <div style="padding:18px 24px 8px 24px; color:#222; background:#fffbe6;">
            <div style="font-size:15px; margin-bottom:8px;"><b>Owner:</b> ${this.owner ? this.owner.name : "Unowned"}</div>
            <div style="font-size:17px; margin-bottom:8px;">Rent <b>$25</b>.</div>
            <div style="font-size:15px; margin-bottom:2px;">If 2 Railroads, <span style="float:right;">$50</span></div>
            <div style="font-size:15px; margin-bottom:2px;">If 3 Railroads, <span style="float:right;">$100</span></div>
            <div style="font-size:15px; margin-bottom:8px;">If 4 Railroads, <span style="float:right;">$200</span></div>
            <div style="font-size:14px; margin-bottom:4px;">Mortgage Value <b>$${this.price / 2 || ""}</b>.</div>
            <div style="font-size:11px; color:#444; margin-top:12px; text-align:center;">
                Train Depots double rents
            </div>
            </div>
        </div>
        `;
    }

    buildDepot() {
        if (this.hasDepot) return false; // Depot already built
        if (!this.owner || this.owner.money < 100) return false; // Not enough money
        this.owner.money -= 100;
        this.hasDepot = true;
        console.log(`${this.name} depot built by ${this.owner.name}`);
        return true;
    }
}

module.exports = RailroadSpace;