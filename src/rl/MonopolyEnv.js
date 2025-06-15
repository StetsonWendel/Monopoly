const MonopolyBaseLogic = require('../games/mega-monopoly/MonopolyBaseLogic');
const Player = require('../games/mega-monopoly/Player');

class MonopolyEnv {
    constructor(boardData, playerConfigs) {
        this.boardData = boardData;
        this.playerConfigs = playerConfigs;
        this.reset();
    }

    reset() {
        this.players = this.playerConfigs.map(cfg => new Player(cfg));
        this.board = this.boardData.map(space => Object.assign({}, space));
        this.logic = new MonopolyBaseLogic(this.players, this.board);
        this.players.forEach(p => { p.position = 0; });
        this.whosTurn = 0;
        this.done = false;
        this.phase = 'start'; // 'start', 'buy', 'mrmonopoly_buy'
        this.lastLanded = null;
        return this.getState();
    }

    getState() {
        return {
            players: this.players.map(p => ({
                position: p.position,
                bank: p.bank,
                properties: p.properties ? p.properties.map(prop => prop.id) : [],
                inJail: p.inJail,
                numBusTickets: p.numBusTickets || 0,
            })),
            whosTurn: this.whosTurn,
            phase: this.phase,
            lastLanded: this.lastLanded ? this.lastLanded.id : null,
            winner: this.winner ? this.winner.username : null,
        };
    }

    step(action) {
        if (this.done) return { state: this.getState(), reward: 0, done: true };
        const player = this.players[this.whosTurn];
        let reward = 0;
        const prevBank = player.bank;

        // PHASE: Start of turn
        if (this.phase === 'start') {
            if (action.type === 'roll') {
                const roll = this.logic.rollDice();
                const total = roll.d1 + roll.d2 + (typeof roll.mega === "number" ? roll.mega : 0);
                const landedSquare = this.logic.movePlayer(player, total);

                // Reward for passing GO
                // if (player.position === 0) reward += .01;
                // if (player.inJail) reward -= 1;

                // If landed on buyable property
                if (landedSquare && landedSquare.owner == null && landedSquare.price && player.bank >= landedSquare.price) {
                    this.phase = 'buy';
                    this.lastLanded = landedSquare;
                    return { state: this.getState(), reward, done: this.done };
                }
                // If Mr. Monopoly, move to next unowned property
                if (roll.mega === "mrMonopoly") {
                    const nextSpace = this.logic.moveMrMonopoly(player, this.board);
                    if (nextSpace && nextSpace.owner == null && nextSpace.price && player.bank >= nextSpace.price) {
                        this.phase = 'mrmonopoly_buy';
                        this.lastLanded = nextSpace;
                        return { state: this.getState(), reward, done: this.done };
                    }
                }
                // If bus ticket, let agent choose to use it next turn (or you can add a 'bus_ticket' phase)
                // Otherwise, advance turn
                // this._advanceTurn();
            } else if (action.type === 'useBusTicket' && player.numBusTickets > 0) {
                // action.targetIdx should be the board index to move to
                player.numBusTickets--;
                player.position = action.targetIdx;

                const landedSquare = this.board[player.position];
                if (landedSquare && landedSquare.owner == null && landedSquare.price && player.bank >= landedSquare.price) {
                    this.phase = 'buy';
                    this.lastLanded = landedSquare;
                    return { state: this.getState(), reward, done: this.done };
                }
                // Otherwise, advance turn
                this.phase = 'start';
                // this._advanceTurn();
            }
        }

        // PHASE: Buy after landing
        else if (this.phase === 'buy' || this.phase === 'mrmonopoly_buy') {
            if (action.type === 'buy') {
                this.lastLanded.owner = player;
                player.bank -= this.lastLanded.price;
                if (player.addRealEstate) player.addRealEstate(this.lastLanded);
                reward += 0.5;
            }
            // Whether buy or pass, advance turn
            this.phase = 'start';
            // this._advanceTurn();
        }

        // Inside step(action)
        if (action.type === 'develop') {
            const prop = this.board.find(sq => sq.id === action.propertyId);
            if (!prop || prop.owner !== player) {
                // Can't develop what you don't own
                this.phase = 'start';
                // this._advanceTurn();
                return { state: this.getState(), reward, done: this.done };
            }

            if (prop.realEstateType === "property" && typeof prop.canDevelop === "function") {
                // Group properties for even building
                const groups = {};
                player.properties.forEach(p => {
                    const group = p.colorGroup;
                    if (!groups[group]) groups[group] = [];
                    groups[group].push(p);
                });
                const { canBuild, buildingCost } = prop.canDevelop(player, this.board, groups);
                if (canBuild && player.bank >= buildingCost) {
                    if (prop.develop()) {
                        player.bank -= buildingCost;
                        reward += 0.3;
                    }
                }
            } else if (prop.realEstateType === "railroad" && typeof prop.canDevelop === "function") {
                const { canBuild } = prop.canDevelop(player);
                if (canBuild && player.bank >= 100) {
                    if (prop.buildDepot()) {
                        player.bank -= 100;
                        reward += 0.2;
                    }
                }
            }
            // Utilities cannot be developed
            this.phase = 'start';
            // this._advanceTurn();
            return { state: this.getState(), reward, done: this.done };
        }

        if (action.type === 'proposeTrade') {
            this.pendingTrade = { from: this.whosTurn, to: action.to, offer: action.offer, want: action.want };
            this.phase = 'trade_review';
            return { state: this.getState(), reward, done: this.done };
        }

        if (this.phase === 'trade_review') {
            if (action.type === 'acceptTrade') {
                this.logic.executeTrade(this.pendingTrade);
                reward += 0.2;
                this.pendingTrade = null;
                this.phase = 'start';
                // this._advanceTurn();
            } else if (action.type === 'rejectTrade') {
                this.pendingTrade = null;
                this.phase = 'start';
                // this._advanceTurn();
            }
        }

        if (action.type === 'undevelop' || action.type === 'mortgage' || action.type === 'unmortgage') {
            const prop = this.board.find(sq => sq.id === action.propertyId);
            if (!prop || prop.owner !== player) {
                // Can't undevelop what you don't own
                this.phase = 'start';
                // this._advanceTurn();
                return { state: this.getState(), reward, done: this.done };
            }

            if (action.type === 'undevelop' && typeof prop.undevelop === "function") {
                // Group properties for even selling
                const groups = {};
                player.properties.forEach(p => {
                    const group = p.colorGroup;
                    if (!groups[group]) groups[group] = [];
                    groups[group].push(p);
                });
                const result = prop.undevelop(player, this.board, groups);
                if (result.success) {
                    // reward += 0.1; // Small reward for gaining liquidity
                }
            } else if (action.type === 'mortgage' && typeof prop.mortgage === "function") {
                const result = prop.mortgage(player);
                if (result.success) {
                    // reward += 0.05; // Small reward for gaining liquidity
                }
            } else if (action.type === 'unmortgage' && typeof prop.unmortgage === "function") {
                const result = prop.unmortgage(player);
                if (result.success) {
                    reward += 0.05; // Small reward for restoring property
                }
            }
            // Do NOT call _advanceTurn() here
            // Just return state, reward, done
            return { state: this.getState(), reward, done: this.done };
        }
        
        // Reward for gaining money
        const moneyGained = player.bank - prevBank;
        if (moneyGained > 0) reward += moneyGained * 0.005; // Tune the multiplier as needed
        if (player.bank < 0) reward -= 5; // Penalty for going bankrupt
        

        if (action.type === 'pass') {
            this.phase = 'start';
            this._advanceTurn();
            if (this.done && this.winner === player) reward += 10; // Big reward for winning{
            return { state: this.getState(), reward, done: this.done };
        }
            
        if (this.done && this.winner === player) reward += 5; // Big reward for winning{

        return { state: this.getState(), reward, done: this.done };
    }

    _advanceTurn() {
        // Remove bankrupt players
        for (let i = this.players.length - 1; i >= 0; i--) {
            const p = this.players[i];
            if (p.bank < 0) {
                // Transfer all properties to the bank/unowned
                if (p.properties) p.properties.forEach(prop => { prop.owner = null; });
                if (p.railroads) p.railroads.forEach(rr => { rr.owner = null; });
                if (p.utilities) p.utilities.forEach(util => { util.owner = null; });
                this.players.splice(i, 1);
                // Adjust whosTurn if needed
                if (this.whosTurn >= i) this.whosTurn--;
            }
        }

        // Check for win condition
        if (this.players.length === 1) {
            this.done = true;
            this.winner = this.players[0];
            
            return;
        }

        // Advance turn
        this.whosTurn = (this.whosTurn + 1) % this.players.length;
    }

    getValidActions(player) {
        const actions = [];
        // Start phase: roll or use bus ticket
        if (this.phase === 'start') {
            actions.push({ type: 'roll' });
            if (player.numBusTickets > 0) {
                const validDest = MonopolyBaseLogic.getValidBusTicketDestinations(player, this.board);
                actions.push(...validDest.map(idx => ({ type: 'useBusTicket', targetIdx: idx })));
            }
        }
        // Buy phases: buy or pass
        if (['buy', 'mrmonopoly_buy'].includes(this.phase)) {
            actions.push({ type: 'buy' }, { type: 'pass' });
        }
        // Trade review: accept or reject
        if (this.phase === 'trade_review') {
            actions.push({ type: 'acceptTrade' }, { type: 'rejectTrade' });
        }
        // Development and liquidity actions
        for (const prop of player.properties || []) {
            if (typeof prop.canDevelop === "function" && prop.canDevelop(player, this.board, {/*groups*/}).canBuild) {
                actions.push({ type: 'develop', propertyId: prop.id });
            }
            if (typeof prop.undevelop === "function" && prop.numHouses > 0) {
                actions.push({ type: 'undevelop', propertyId: prop.id });
            }
            if (typeof prop.mortgage === "function" && !prop.isMortgaged) {
                actions.push({ type: 'mortgage', propertyId: prop.id });
            }
            if (typeof prop.unmortgage === "function" && prop.isMortgaged) {
                actions.push({ type: 'unmortgage', propertyId: prop.id });
            }
        }
        // Pass is always allowed in liquidity phases
        if (['develop', 'undevelop', 'mortgage', 'unmortgage'].includes(this.phase)) {
            actions.push({ type: 'pass' });
        }
        return actions;
    }
}

// Add this static method to MonopolyBaseLogic.js
MonopolyBaseLogic.getValidBusTicketDestinations = function(player, board) {
    const boardLen = board.length;
    const sideLen = boardLen / 4;
    const pos = player.position;
    let validIndexes = [];

    if (pos >= 0 && pos < sideLen) {
        for (let i = pos + 1; i < sideLen; i++) validIndexes.push(i);
    } else if (pos >= sideLen && pos < 2 * sideLen) {
        for (let i = pos + 1; i < 2 * sideLen; i++) validIndexes.push(i);
    } else if (pos >= 2 * sideLen && pos < 3 * sideLen) {
        for (let i = pos + 1; i < 3 * sideLen; i++) validIndexes.push(i);
    } else if (pos >= 3 * sideLen && pos < 4 * sideLen) {
        for (let i = pos + 1; i < 4 * sideLen; i++) validIndexes.push(i);
    }
    return validIndexes;
}

module.exports = MonopolyEnv;