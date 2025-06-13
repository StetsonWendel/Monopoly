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
        this.numBustickets = 0;
        this.inJail = false; 
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
}

module.exports = Player;