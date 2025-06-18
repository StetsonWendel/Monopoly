const BuyableSpace = require('../BuyableSpace');

class PropertySpace extends BuyableSpace {
    constructor({ pos, name, edge, price, rentArray, colorGroup, buildingCost, cell, numInSet }) {
        super({ pos, name, edge, price, img: null, colorGroup, cell, realEstateType: "property" });
        this.rentArray = rentArray;
        this.houses = 0;
        this.hasHotel = false;
        this.hasSkyscraper = false;
        this.buildingCost = buildingCost;
        this.numInSet = numInSet; // Number of properties in this color group
    }

    /**
     * Calculates rent for this property.
     * @param {Player} playerLanded - The player who landed on the space.
     * @param {MonopolyBaseLogic} logic - The game logic instance.
     * @returns {number} The calculated rent.
     */
    calculateRent(playerLanded, logic) {
        if (!this.owner) return 0;

        // If property is undeveloped
        if (!this.hasSkyscraper && !this.hasHotel && (this.houses === 0 || this.houses === undefined)) {
            // Check if owner has a monopoly or near-monopoly on this color group
            const ownsAllInSet = logic.playerOwnsAllInColorGroup(this.owner, this.colorGroup);
            const ownsAllButOneInSet = logic.playerOwnsAllButOneInColorGroup(this.owner, this.colorGroup, this.numInSet);

            if (ownsAllInSet) {
                return this.rentArray[0] * 3; // Tripled rent for full set
            } else if (ownsAllButOneInSet) {
                return this.rentArray[0] * 2; // Doubled rent for all but one
            }
            return this.rentArray[0]; // Base rent
        } else if (this.hasSkyscraper) {
            return this.rentArray[6] || this.rentArray[5]; // Skyscraper rent (index 6 if exists, else 5)
        } else if (this.hasHotel) {
            return this.rentArray[5] || this.rentArray[4]; // Hotel rent (index 5 if exists, else 4)
        } else if (this.houses > 0 && this.houses <= 4) { // Rent for 1-4 houses
             return this.rentArray[this.houses];
        }
        // Fallback, though should be covered
        return this.rentArray[0];
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

    develop(player, logic) { // Pass logic for any rule checks if needed
        if (this.hasSkyscraper) return { success: false, reason: "Already has a skyscraper." };
        if (player.money < this.buildingCost) return { success: false, reason: "Not enough money."};
        
        // Add logic here to check for even building rules if using MonopolyBaseLogic
        if (!logic.canBuildEvenly(player, this, this.colorGroup)) {
            return { success: false, reason: "Must build evenly across the color group." };
        }

        player.money -= this.buildingCost;
        if (this.houses < 4 && !this.hasHotel) {
            this.houses++;
        } else if (!this.hasHotel) {
            this.houses = 0; // Reset houses when building hotel
            this.hasHotel = true;
        } else { // Has hotel, building skyscraper
            this.hasHotel = false; // Skyscraper replaces hotel
            this.hasSkyscraper = true;
        }
        return { success: true };
    }

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

    canDevelop(player) { // Pass logic
        // Only for properties
        console.log("Checking canDevelop for", this.name, "owned by", this.owner ? this.owner.username : "none");
        if (this.realEstateType !== "property") return { canBuild: false, reason: "Not a developable property."};

        const ownsAllInGroup = logic.playerOwnsAllInColorGroup(player, this.colorGroup);
        if (!ownsAllInGroup) {
            return { canBuild: false, reason: "You must own all properties in this color group to develop." };
        }
        if (player.money < this.buildingCost) {
            return { canBuild: false, reason: "Not enough money.", buildingCost: this.buildingCost };
        }

        let nextDevStage = "";
        let canBuildThisProperty = false;

        if (!this.hasSkyscraper && !this.hasHotel && this.houses < 4) {
            nextDevStage = `House (${this.houses + 1})`;
            canBuildThisProperty = logic.canBuildEvenly(player, this, this.colorGroup, 'house');
        } else if (!this.hasSkyscraper && !this.hasHotel && this.houses === 4) {
            nextDevStage = "Hotel";
            canBuildThisProperty = logic.canBuildEvenly(player, this, this.colorGroup, 'hotel');
        } else if (!this.hasSkyscraper && this.hasHotel) {
            nextDevStage = "Skyscraper";
            canBuildThisProperty = logic.canBuildEvenly(player, this, this.colorGroup, 'skyscraper');
        } else if (this.hasSkyscraper) {
            return { canBuild: false, reason: "Already fully developed with a skyscraper." };
        }
        
        return {
            canBuild: canBuildThisProperty,
            nextDev: nextDevStage,
            reason: canBuildThisProperty ? "" : "Must build evenly across the group.",
            buildingCost: this.buildingCost
        };
    }

    undevelop(player, logic) { // Pass logic
        // Logic for selling development evenly
        if (!logic.canSellDevelopmentEvenly(player, this, this.colorGroup)) {
            return { success: false, reason: "Must sell development evenly across the color group." };
        }

        let refund = 0;
        if (this.hasSkyscraper) {
            this.hasSkyscraper = false; // Skyscraper becomes hotel
            this.hasHotel = true;
            refund = Math.floor(this.buildingCost / 2);
        } else if (this.hasHotel) {
            this.hasHotel = false; // Hotel becomes 4 houses
            this.houses = 4;
            refund = Math.floor(this.buildingCost / 2);
        } else if (this.houses > 0) {
            this.houses--;
            refund = Math.floor(this.buildingCost / 2);
        } else {
            return { success: false, reason: "No development to sell." };
        }

        player.money += refund;
        return { success: true, refund };
    }

    playerOwnsColorGroup (player) {
        let numOwned = 0;
        for (let property of player.properties){
            if (this.colorGroup === property.colorGroup) {
                numOwned++;
            }
        }
        if (numOwned === this.numInSet) {
            return 0; // Player owns all properties in this color group
        } else if (numOwned === this.numInSet - 1) {
            return 1; // Player owns all but one property in this color group
        } else {
            return 2;
        }
    }
}

module.exports = PropertySpace;