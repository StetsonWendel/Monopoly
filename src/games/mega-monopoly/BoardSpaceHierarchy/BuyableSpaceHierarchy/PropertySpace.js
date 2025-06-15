const BuyableSpace = require('../BuyableSpace');

class PropertySpace extends BuyableSpace {
    constructor({ pos, name, edge, price, rentArray, colorGroup, buildingCost, cell, numInSet }) {
        super({ pos, name, edge, price, img: null, colorGroup, cell, realEstateType: "property" });
        this.rentArray = rentArray;
        this.houses = 0;
        this.hasHotel = false;
        this.hasSkyscraper = false;
        this.buildingCost = buildingCost;
        this.numInSet = numInSet;
    }

    calculateRent(board) {
        // If property is undeveloped (no houses, no hotel, no skyscraper)
        if (!this.hasSkyscraper && !this.hasHotel && (this.houses === 0 || this.houses === undefined)) {
            if (this.owner && typeof this.owner.countSet === "function") {
                const setStatus = this.owner.countSet(this.colorGroup, board);
                if (setStatus === 0) {
                    return this.rentArray[0] * 3; // Tripled rent
                } else if (setStatus === 1) {
                    return this.rentArray[0] * 2; // Doubled rent
                }
            }
            return this.rentArray[0]; // Base rent
        } else if (this.hasSkyscraper) {
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
        if (this.hasSkyscraper) return false;

        if (this.houses < 4 && this.hasHotel === false) {
            this.houses++;
        } else if (this.hasHotel === false) {
            this.hasHotel = true;
        } else {
            this.hasSkyscraper = true;
        }

        // console.log(`${this.name} developed: ${this.hasHotel ? "Hotel" : this.houses + " houses"}`);
        return true;
    }



    // Untouched Method made to render upgrades on the board.
    renderDevelopment() {
        if (!this.cell) return;

        // Always use the color bar created by BuyableSpace
        let colorBar = this.cell.querySelector('.property-color-bar');
        if (!colorBar) return; // If for some reason it's missing, just exit

        // Remove any previous dev icon in the color bar
        const oldDev = colorBar.querySelector('.dev-icon');
        if (oldDev) colorBar.removeChild(oldDev);

        // Create the dev icon
        const devDiv = document.createElement("div");
        devDiv.className = "dev-icon";
        // devDiv.style.marginRight = "6px";
        devDiv.style.fontSize = "2em";
        devDiv.style.color = "green";
        devDiv.style.zIndex = "4";
        devDiv.style.background = "transparent";

        // Show skyscraper first, then hotel, then houses
        if (this.hasSkyscraper) {
            devDiv.textContent = "🏢";
            devDiv.style.fontSize = "3em";
            devDiv.style.marginTop = "-23px";
            devDiv.style.textAlign = "center";
        } else if (this.hasHotel) {
            devDiv.textContent = "🏨";
            devDiv.style.fontSize = "2.5em";
            devDiv.style.marginTop = "-13px";
            devDiv.style.textAlign = "center";
        } else if (this.houses > 0) {
            devDiv.textContent = "🏠".repeat(this.houses);
            devDiv.style.marginTop = "-3px";
        } else {
            devDiv.textContent = "";
        }

        colorBar.appendChild(devDiv);
    }

}

module.exports = PropertySpace;