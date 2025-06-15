class Player {
    constructor({ id, username, color, bank = 2500, isHuman}) {
        this.id = id;
        this.username = username;
        this.color = color;
        this.bank = bank;
        this.properties = [];
        this.utilities = [];
        this.railroads = [];
        this.isHuman = isHuman;
        this.position = 0;
        this.numBusTickets = 0;
        this.inJail = false;
        this.jailTurns = 0; // Number of turns spent in jail
        this.hasGetOutOfJailFree = false; 
    }

    countRailroads() {
        return this.railroads ? this.railroads.length : 0;
    }
    countUtilities() {
        return this.utilities ? this.utilities.length : 0;
    }

    addRealEstate(space) {
        switch (space.realEstateType) {
            case "property":
                this.properties.push(space);
                break;
            case "railroad":
                this.railroads.push(space);
                break;
            case "utility":
                this.utilities.push(space);
                break;
            default:
                throw new Error("Unknown real estate type");
        }
    }

    countSet(colorGroup) {
        // Get all properties of this color group the player owns
        const ownedProps = this.properties.filter(
            prop => prop.colorGroup === colorGroup
        );
        // Get the number in set from any owned property, or fallback to ownedProps.length
        const numInSet = ownedProps[0]?.numInSet || ownedProps.length;
        const owned = ownedProps.length;

        if (owned === numInSet) return 0;
        if (owned === numInSet - 1) return 1;
        return 2;
    }
}

module.exports = Player;