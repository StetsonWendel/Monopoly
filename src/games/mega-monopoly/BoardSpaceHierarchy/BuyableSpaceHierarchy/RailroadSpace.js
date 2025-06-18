const BuyableSpace = require('../BuyableSpace');

class RailroadSpace extends BuyableSpace {
    constructor({ pos, name, edge, price, cell, colorGroup = "black", realEstateType = "railroad" }) {
        super({ pos, name, edge, cell, price, colorGroup, realEstateType });
        this.hasDepot = false;
    }

    /**
     * Calculates rent for this railroad.
     * @param {Player} playerLanded - The player who landed (not directly used here but good for consistency).
     * @param {MonopolyBaseLogic} logic - The game logic instance.
     * @returns {number} The calculated rent.
     */
    calculateRent(playerLanded, logic) {
        if (!this.owner) return 25; // Should not happen if called correctly
        const numOwned = logic.countPlayerRailroads(this.owner); // Use logic to count
        let rent = 25 * Math.pow(2, Math.max(0, numOwned - 1));
        if (this.hasDepot) {
            rent *= 2;
        }
        return rent;
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

    buildDepot(player, logic) { // Pass logic
        if (!this.owner || this.owner.id !== player.id) return { success: false, reason: "Not your property."};
        if (this.hasDepot) return { success: false, reason: "Depot already built."};
        if (player.money < 100) return { success: false, reason: "Not enough money."}; // Depot cost
        
        // Potentially add logic check: player must own all railroads to build depot?
        // if (logic.countPlayerRailroads(player) < logic.getTotalRailroadsOnBoard()) {
        //    return { success: false, reason: "Must own all railroads to build a depot." };
        // }

        player.money -= 100;
        this.hasDepot = true;
        return { success: true };
    }

    canDevelop(player, logic) { // Pass logic
        if (this.realEstateType !== "railroad") return { canBuild: false, reason: "Not a railroad."};
        if (this.hasDepot) return { canBuild: false, reason: "Depot already built." };
        if (player.money < 100) return { canBuild: false, reason: "Not enough money.", buildingCost: 100 };
        
        // Optional: Check if player owns all railroads
        // const ownsAllRailroads = logic.countPlayerRailroads(player) === logic.getTotalRailroadsOnBoard();
        // if (!ownsAllRailroads) return { canBuild: false, reason: "Must own all railroads to build a depot."};

        return { canBuild: true, nextDev: "Depot", reason: "", buildingCost: 100 };
    }

    undevelop(player, logic) { // Pass logic
        if (!this.hasDepot) {
            return { success: false, reason: "No depot to sell." };
        }
        this.hasDepot = false;
        player.money += 50; // Half of $100 depot cost
        return { success: true, refund: 50 };
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
        devDiv.style.marginRight = "0";
        devDiv.style.marginTop = "-22px";
        devDiv.style.fontSize = "3em";
        devDiv.style.color = "green";
        devDiv.style.zIndex = "4";
        devDiv.style.background = "transparent";
        devDiv.style.textAlign = "center";

        if (this.hasDepot) {
            devDiv.textContent = "🏛️";
        } else {
            devDiv.textContent = "";
        }

        colorBar.appendChild(devDiv);
    }
    // onLand is inherited from BuyableSpace
}

module.exports = RailroadSpace;