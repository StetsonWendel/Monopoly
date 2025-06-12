const BuyableSpace = require('../BuyableSpace');

class UtilitySpace extends BuyableSpace {
    constructor({ pos, name, edge, price, cell, colorGroup = "lightgreen", realEstateType = "utility" }) {
        super({ pos, name, edge, cell, price, colorGroup, realEstateType });
    }

    // Rent is 4x dice roll if one utility owned, 10x if both owned by same player
    calculateRent(diceRoll) {
        if (!this.owner || typeof this.owner.countUtilities !== "function") return 0;
        const numOwned = this.owner.countUtilities();
        const multiplier = numOwned === 2 ? 10 : 4;
        return diceRoll * multiplier;
    }

    renderDeed() {
        this.baseRenderDeed(this.getDeedFillHTML());
    }

    getDeedFillHTML() {
        return `
        <div style="font-family:monospace,Arial,sans-serif; width:340px; min-height:220px; background:#fffbe6; border-radius:8px; overflow:hidden;">
            <div style="background:${this.colorGroup}; color:#111; padding:16px 0 8px 0; text-align:center; font-weight:bold; font-size:22px; letter-spacing:1px;">
                <div style="font-size:12px; font-weight:normal; letter-spacing:0.5px; margin-bottom:2px;">TITLE&nbsp;&nbsp;DEED</div>
                <div style="font-size:20px; font-weight:bold; text-transform:uppercase;">${this.name}</div>
            </div>
            <div style="padding:18px 24px 8px 24px; color:#222; background: #fffbe6;">
                <div style="font-size:15px; margin-bottom:8px;"><b>Owner:</b> ${this.owner ? this.owner : "Unowned"}</div>
                <div style="font-size:15px; margin-bottom:2px;">If one Utility is owned, rent is 4x dice roll.</div>
                <div style="font-size:15px; margin-bottom:8px;">If two Utilities are owned, rent is 10x dice roll.</div>
                <div style="font-size:15px; margin-bottom:8px;">If all three Utilities are owned, rent is 20x dice roll.</div>
                <div style="font-size:14px; margin-bottom:4px;">Mortgage Value <b>$${this.price / 2 || ""}</b>.</div>
                <div style="font-size:11px; color:#444; margin-top:12px; text-align:center;">
                    Utilities cannot be improved.
                </div>

        `;

    }

    onLand(player, diceRoll) {
        if (!this.owner) {
            this.offerPurchase(player);
        } else if (this.owner !== player) {
            const rent = this.calculateRent(diceRoll);
            player.money -= rent;
            this.owner.money += rent;
            console.log(`${player.name} paid $${rent} rent to ${this.owner.name}`);
        }
    }
}

module.exports = UtilitySpace;