const BuyableSpace = require('../BuyableSpace');

class PropertySpace extends BuyableSpace {
    constructor({ pos, name, edge, price, rentArray, colorGroup, buildingCost, cell }) {
        super({ pos, name, edge, price, img: null, colorGroup, cell });
        this.rentArray = rentArray;
        this.houses = 0;
        this.hasHotel = false;
        this.hasSkyscraper = false;
        this.buildingCost = buildingCost;
    }

    calculateRent() {
        if (this.hasSkyscraper) {
            return this.rentArray[5]; // Skyscraper rent
        } else if (this.hasHotel) {
            return this.rentArray[4]; // Hotel rent
        } else {
            return this.rentArray[this.houses]; // Rent based on number of houses
        }
    }

    renderDeed() {
        this.baseRenderDeed(this.getDeedFillHTML());
    }
    
    getDeedFillHTML() {
        // Fill modal with property info and group links
        return `
        <div style="font-family:monospace,Arial,sans-serif; width:340px; min-height:420px; background:#fffbe6; border-radius:8px; overflow:hidden;">
            <div style="background:${this.colorGroup}; color:#111; padding:16px 0 8px 0; text-align:center; font-weight:bold; font-size:22px; letter-spacing:1px;">
                <div style="font-size:12px; font-weight:normal; letter-spacing:0.5px; margin-bottom:2px;">TITLE&nbsp;&nbsp;DEED</div>
                <div style="font-size:20px; font-weight:bold; text-transform:uppercase;">${this.name}</div>
            </div>
            <div style="padding:18px 24px 8px 24px; color:#222; background: #fffbe6;">
                <div style="font-size:15px; margin-bottom:8px;"><b>Owner:</b> ${this.owner ? this.owner : "Unowned"}</div>
                <div style="font-size:17px; margin-bottom:8px;">Rent <b>$${this.rentArray[0]}</b>.</div>
                <div style="font-size:15px; margin-bottom:2px;">With 1 House <span style="float:right;">$${this.rentArray[1]}</span></div>
                <div style="font-size:15px; margin-bottom:2px;">With 2 Houses <span style="float:right;">$${this.rentArray[2]}</span></div>
                <div style="font-size:15px; margin-bottom:2px;">With 3 Houses <span style="float:right;">$${this.rentArray[3]}</span></div>
                <div style="font-size:15px; margin-bottom:2px;">With 4 Houses <span style="float:right;">$${this.rentArray[4]}</span></div>
                <div style="font-size:15px; margin-bottom:8px;">With HOTEL <span style="float:right;">$${this.rentArray[5]}</span></div>
                <div style="font-size:15px; margin-bottom:8px;">With SKYSCRAPER <span style="float:right;">$${this.rentArray[6]}</span></div>
                <div style="font-size:14px; margin-bottom:4px;">Mortgage Value <b>$${this.price / 2}</b>.</div>
                <div style="font-size:14px; margin-bottom:4px;">Build cost <b>$${this.buildingCost}</b> each.</div>
                <div style="font-size:11px; color:#444; margin-top:12px; text-align:center;">
                    If a player owns <b>ALL BUT ONE</b> the lots of any color-group, the rent is <b>DOUBLED</b> on unimproved lots in that group.<br>
                    If a player owns <b>ALL</b> the lots of any color-group, the rent is <b>TRIPLED</b> on unimproved lots in that group.
                </div>
            </div>
        </div>
        `;
    }

    // Untouched method to handle the purchase of this property by a player
    develop() {
        if (this.hasHotel) return false;

        if (this.houses < 4) {
            this.houses++;
        } else {
            this.houses = 0;
            this.hasHotel = true;
        }

        console.log(`${this.name} developed: ${this.hasHotel ? "Hotel" : this.houses + " houses"}`);
        return true;
    }


    // Untouched Method made to render upgrades on the board.
    renderDevelopment() {
        // Optional: Display house/hotel count on board
        const devDiv = document.createElement("div");
        devDiv.style.position = "absolute";
        devDiv.style.bottom = "5px";
        devDiv.style.right = "5px";
        devDiv.style.fontSize = "0.9em";
        devDiv.style.color = "green";
        devDiv.style.zIndex = "2";

        devDiv.textContent = this.hasHotel ? "🏨" : "🏠".repeat(this.houses);
        this.cell.appendChild(devDiv);
    }
}

module.exports = PropertySpace;