class Player {
    constructor({ id, username, color, money = 1500, position = 0, properties = [], railroads = [], utilities = [], numBusTickets = 0, inJail = false, jailTurns = 0, consecutiveDoubles = 0, isAI = false, aiDifficulty = null }) {
        this.id = id;
        this.username = username;
        this.color = color;
        this.money = money;
        this.position = position;
        this.properties = properties; // Array of PropertySpace objects
        this.railroads = railroads;   // Array of RailroadSpace objects
        this.utilities = utilities;   // Array of UtilitySpace objects
        this.numBusTickets = numBusTickets;
        this.inJail = inJail;
        this.jailTurns = jailTurns;
        this.consecutiveDoubles = 0;
        this.isAI = isAI;
        this.aiDifficulty = aiDifficulty;
        this.token = null; // DOM element for the token
    }

    addRealEstate(space) {
        if (space.realEstateType === "property") {
            if (!this.properties.includes(space)) this.properties.push(space);
        } else if (space.realEstateType === "railroad") {
            if (!this.railroads.includes(space)) this.railroads.push(space);
        } else if (space.realEstateType === "utility") {
            if (!this.utilities.includes(space)) this.utilities.push(space);
        }
    }

    removeRealEstate(space) {
        if (space.realEstateType === "property") {
            this.properties = this.properties.filter(p => p !== space);
        } else if (space.realEstateType === "railroad") {
            this.railroads = this.railroads.filter(r => r !== space);
        } else if (space.realEstateType === "utility") {
            this.utilities = this.utilities.filter(u => u !== space);
        }
    }

    getProperties() { return this.properties; }
    getRailroads() { return this.railroads; }
    getUtilities() { return this.utilities; }

    // countSet, countRailroads, countUtilities might be better placed in MonopolyBaseLogic
    // to operate on the canonical board state if player objects aren't always perfectly synced
    // or if they need to check the board directly.
    // For now, assuming player.properties etc. are the source of truth for their ownership.

    countSet(colorGroup, board) { // board is needed to know total in set
        const groupPropsOnBoard = board.filter(s => s.colorGroup === colorGroup && s.realEstateType === "property");
        const ownedInGroup = this.properties.filter(p => p.colorGroup === colorGroup);
        if (ownedInGroup.length === groupPropsOnBoard.length && groupPropsOnBoard.length > 0) return 0; // Owns all
        if (ownedInGroup.length === groupPropsOnBoard.length -1 && groupPropsOnBoard.length > 1) return 1; // Owns all but one
        return 2; // Owns less than all but one
    }
    
    countRailroads() {
        return this.railroads.length;
    }

    countUtilities() {
        return this.utilities.length;
    }
    
    pay(amount, recipient = null) {
        if (this.money >= amount) {
            this.money -= amount;
            if (recipient) {
                recipient.money += amount;
            }
            return true;
        }
        // Handle insufficient funds (partial payment, bankruptcy) - complex
        if (recipient) {
            recipient.money += this.money;
        }
        this.money = 0;
        // Trigger bankruptcy logic here
        return false; 
    }
}

module.exports = Player;