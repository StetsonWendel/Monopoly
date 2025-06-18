class MonopolyBaseLogic {
    constructor(players, board, chanceDeck, communityChestDeck, busTicketDeck) {
        this.players = players;
        this.board = board; // This should be the array of BoardSpace objects
        this.chanceDeck = chanceDeck;
        this.communityChestDeck = communityChestDeck;
        this.busTicketDeck = busTicketDeck;
        this.lastRoll = null; // Add this to store the last roll
        this.auctionData = null; // For managing auction state
    }

    setLastRoll(roll) {
        this.lastRoll = roll;
    }

    getLastRoll() {
        return this.lastRoll;
    }

    purchaseProperty(player, property) {
        if (player.money >= property.price && property.owner === null) {
            player.money -= property.price;
            property.owner = player;
            player.addRealEstate(property); // Make sure Player class has this method
            console.log(`[Logic] ${player.username} purchased ${property.name}`);
            return true;
        }
        console.log(`[Logic] ${player.username} failed to purchase ${property.name}`);
        return false;
    }

    playerPaysRent(payer, recipient, amount) {
        if (payer.money >= amount) {
            payer.money -= amount;
            recipient.money += amount;
            console.log(`[Logic] ${payer.username} paid $${amount} to ${recipient.username}`);
            return amount;
        } else {
            // Handle bankruptcy or insufficient funds - complex, for later
            const amountPaid = payer.money;
            recipient.money += payer.money;
            payer.money = 0;
            console.log(`[Logic] ${payer.username} paid $${amountPaid} (all money) to ${recipient.username}. Potential bankruptcy.`);
            // logic.handleBankruptcy(payer, recipient);
            return amountPaid;
        }
    }

    countPlayerUtilities(player) {
        return player.getUtilities().length;
    }

    countPlayerRailroads(player) {
        return player.getRailroads().length;
    }

    // Placeholder for auction logic
    startAuction(property, playerInitiated, io, gameCode) {
        console.log(`[Logic] Auction started for ${property.name}. Initiated by ${playerInitiated.username}`);
        this.auctionData = {
            property,
            highestBid: 0,
            highestBidder: null,
            participants: [...this.players], // All current players
            currentPlayerIndex: this.players.indexOf(playerInitiated), // Or start with player after initiator
        };
        if (io && gameCode) { // Multiplayer
            io.to(gameCode).emit("auction-started", {
                propertyName: property.name,
                propertyPos: property.pos,
                currentBid: 0,
                // nextBidderId: this.auctionData.participants[this.auctionData.currentPlayerIndex].id
            });
            // Need to manage bidding turns via client events "place-bid", "pass-auction"
        } else { // Single-player
            // Implement SP auction UI flow (e.g. via FixedUIScreen)
            console.log("[Logic SP] Auction UI flow needs implementation.");
        }
    }
    
    // Add canBuildEvenly, canSellDevelopmentEvenly if they are not already in MonopolyBaseLogic
    canBuildEvenly(player, propertyToBuildOn, colorGroup, type = 'house') {
        // Simplified: Assumes player owns all in group.
        // Real check: no other property in the group can be more than one house/hotel level below this one *before* building.
        // And this property must be at the lowest level of development (or tied) to build a house.
        // For hotels/skyscrapers, all others must have 4 houses/hotel respectively.
        const groupProperties = this.board.filter(p => p.colorGroup === colorGroup && p.realEstateType === "property");
        const devLevel = p => p.hasSkyscraper ? 6 : p.hasHotel ? 5 : (p.houses || 0);
        
        const currentDevLevel = devLevel(propertyToBuildOn);

        if (type === 'house') {
            if (currentDevLevel >= 4) return false; // Max houses or already hotel/skyscraper
            // Can build a house if this property is at or below the minimum development level of the group (excluding hotels/skyscrapers on others)
            const houseLevels = groupProperties.map(p => p.houses || 0);
            return (propertyToBuildOn.houses || 0) <= Math.min(...houseLevels.filter(l => l < 5)); // only consider properties with < 5 houses (not hotel/skyscraper)
        } else if (type === 'hotel') {
            if (currentDevLevel !== 4) return false; // Must have 4 houses
            // All other properties in the group must have 4 houses or a hotel/skyscraper
            return groupProperties.every(p => devLevel(p) >= 4);
        } else if (type === 'skyscraper') {
            if (currentDevLevel !== 5) return false; // Must have a hotel
            // All other properties in the group must have a hotel or a skyscraper
            return groupProperties.every(p => devLevel(p) >= 5);
        }
        return false;
    }

    canSellDevelopmentEvenly(player, propertyToSellFrom, colorGroup) {
        // Simplified: Can sell if this property is at or above the maximum development level of the group.
        const groupProperties = this.board.filter(p => p.colorGroup === colorGroup && p.realEstateType === "property");
        const devLevel = p => p.hasSkyscraper ? 6 : p.hasHotel ? 5 : (p.houses || 0);
        const currentDevLevel = devLevel(propertyToSellFrom);
        if (currentDevLevel === 0) return false; // Nothing to sell

        const houseLevels = groupProperties.map(p => p.houses || 0);
        return (propertyToSellFrom.houses || 0) >= Math.max(...houseLevels.filter(l => l < 5));
    }

    rollDice() {
        let megaDie = Math.ceil(Math.random() * 6);
        if (megaDie >= 5) {
            megaDie = "mrMonopoly";
        } else if (megaDie == 4) {
            megaDie = "busTicket";
        }
        return {
            d1: Math.ceil(Math.random() * 6),
            d2: Math.ceil(Math.random() * 6),
            mega: megaDie
        };
    }

    movePlayer(player, steps) {
        const oldPosition = player.position;
        const boardLen = this.board.length;
        player.position = (player.position + steps) % boardLen;
        // Check if passed Go or landed on Go (usually index 0)
        if (player.position <= oldPosition) {
            player.bank += 200;
        }
        return this.board[player.position];
    }

    findNextUnownedProperty(fromPos) {
        const boardLen = this.board.length;
        for (let i = 1; i < boardLen; i++) {
            const idx = (fromPos + i) % boardLen;
            const space = this.board[idx];
            if (
                (space.realEstateType === "property" ||
                 space.realEstateType === "railroad" ||
                 space.realEstateType === "utility") &&
                (!space.owner || space.owner === "unowned" || space.owner === "bank")
            ) {
                return idx;
            }
        }
        return null; // No unowned property found
    }

    moveMrMonopoly(player, board, onLandCallback) {
        const nextUnownedIdx = this.findNextUnownedProperty(player.position);
        if (nextUnownedIdx !== null) {
            // Calculate steps to move forward (handle wrap-around)
            const steps = (nextUnownedIdx - player.position + board.length) % board.length;
            this.movePlayer(player, steps);
            const nextSpace = board[player.position];
            if (typeof onLandCallback === "function") {
                onLandCallback(nextSpace);
            }
            return nextSpace;
        }
        return null;
    }

    findHighestOwnedRent() {
        let best = null;
        let bestRent = -1;
        for (const sq of this.board) {
            if (
                (sq.realEstateType === "property" || sq.realEstateType === "railroad" || sq.realEstateType === "utility") &&
                sq.owner && sq.owner !== "unowned" && sq.owner !== "bank" &&
                typeof sq.calculateRent === "function"
            ) {
                const rent = sq.calculateRent();
                if (rent > bestRent) {
                    bestRent = rent;
                    best = sq;
                }
            }
        }
        return best;
    }

    sendToJail(player) {
        const jailIdx = this.board.findIndex(sq => sq.type === "jail" || sq.name === "Jail");
        player.position = jailIdx;
        player.inJail = true;
        player.jailTurns = 0;
    }

    showJailOptions(player, game) {
        const modal = document.getElementById("jail-modal");
        const rollBtn = document.getElementById("jail-modal-roll");
        const payBtn = document.getElementById("jail-modal-pay");
        const cardBtn = document.getElementById("jail-modal-card");
        const info = document.getElementById("jail-modal-info");

        modal.style.display = "flex";
        info.textContent = `${player.username}, you are in Jail (Turn ${player.jailTurns + 1}/3).`;

        // Remove previous handlers
        rollBtn.onclick = null;
        payBtn.onclick = null;
        cardBtn.onclick = null;

        // Roll for doubles
        rollBtn.onclick = async () => {
            modal.style.display = "none";
            let roll = game.debugMode ? await game.getDebugDiceValues() : this.rollDice();
            if (roll.d1 === roll.d2) {
                // Got out with doubles
                player.inJail = false;
                player.jailTurns = 0;
                game.fixedUI.updateChatMessage(`${player.username} rolled doubles and gets out of Jail!`);
                this.movePlayer(player, roll.d1 + roll.d2); // Player moves the sum of the doubles
                game.render();
                const landedSquare = game.board[player.position];
                if (typeof landedSquare.onLand === "function") {
                    landedSquare.onLand(player, game.logic, game); // Pass correct args
                }
                game.fixedUI.updateChatMessage(`${player.username} moves ${roll.d1 + roll.d2} spaces.`);
                game.fixedUI.enableEndTurnButton(true); // Allow the player to manually end their turn
            } else {
                player.jailTurns++;
                // If player fails to roll doubles 3 times, they must pay $50 and move
                if (player.jailTurns >= 3) {
                    // Must pay $50 and move
                    player.bank -= 50;
                    player.inJail = false;
                    player.jailTurns = 0;
                    game.fixedUI.updateChatMessage(`${player.username} paid $50 after 3 turns and gets out of Jail.`);
                    this.movePlayer(player, roll.d1 + roll.d2); // Player moves sum of the failed roll
                    game.render();
                    const landedSquare = game.board[player.position];
                    if (typeof landedSquare.onLand === "function") {
                        landedSquare.onLand(player, game.logic, game); // Pass correct args
                    }
                    game.fixedUI.updateChatMessage(`${player.username} moves ${roll.d1 + roll.d2} spaces.`);
                    game.fixedUI.enableEndTurnButton(true); // Allow the player to manually end their turn
                } else {
                    game.fixedUI.updateChatMessage(`${player.username} did not roll doubles and remains in Jail.`);
                    game.fixedUI.enableEndTurnButton(true); // Allow the player to manually end their turn
                }
            }
        };

        // Pay $50 to get out
        payBtn.onclick = () => {
            modal.style.display = "none";
            player.bank -= 50;
            player.inJail = false;
            player.jailTurns = 0;
            game.fixedUI.updateChatMessage(`${player.username} paid $50 to get out of Jail.`);
            game.fixedUI.enableEndTurnButton(true); // Allow the player to manually end their turn
        };

        // Use Get Out of Jail Free card
        cardBtn.onclick = () => {
            if (player.hasGetOutOfJailFree) {
                modal.style.display = "none";
                player.hasGetOutOfJailFree = false;
                player.inJail = false;
                player.jailTurns = 0;
                game.fixedUI.updateChatMessage(`${player.username} used a Get Out of Jail Free card!`);
                game.fixedUI.enableEndTurnButton(true); // Allow the player to manually end their turn
            } else {
                game.fixedUI.updateChatMessage(`You do not have a Get Out of Jail Free card.`);
            }
        };
    }

    useBusTicket(player, game) {
        player.numBusTickets--;

        const boardLen = this.board.length;
        const sideLen = boardLen / 4;
        const pos = player.position;

        let validIndexes = [];

        // Bottom row (0 to sideLen-1)
        if (pos >= 0 && pos < sideLen) {
            for (let i = pos + 1; i < sideLen; i++) validIndexes.push(i);
        }
        // Left side (sideLen to 2*sideLen-1)
        else if (pos >= sideLen && pos < 2 * sideLen) {
            for (let i = pos + 1; i < 2 * sideLen; i++) validIndexes.push(i);
        }
        // Top row (2*sideLen to 3*sideLen-1)
        else if (pos >= 2 * sideLen && pos < 3 * sideLen) {
            for (let i = pos + 1; i < 3 * sideLen; i++) validIndexes.push(i);
        }
        // Right side (3*sideLen to 4*sideLen-1)
        else if (pos >= 3 * sideLen && pos < 4 * sideLen) {
            for (let i = pos + 1; i < 4 * sideLen; i++) validIndexes.push(i);
        }

        if (validIndexes.length === 0) {
            game.fixedUI.updateChatMessage("No spaces ahead in this row/side to move to.");
            return;
        }

        // --- MAPPING LOGIC START ---
        const size = 14; // or get from game.renderGame if dynamic
        const positions = game.renderGame.getBoardPositions(size);
        const boardCells = Array.from(document.querySelectorAll('#mm-board > div'));

        // Handler function
        const handleCellClick = (e) => {
            // Find which Monopoly index was clicked
            const cellIdx = boardCells.indexOf(e.currentTarget);
            const clickedMonopolyIdx = positions.findIndex(
                pos => pos.row * size + pos.col === cellIdx
            );
            if (!validIndexes.includes(clickedMonopolyIdx)) return;

            // Clean up
            validIndexes.forEach(monopolyIdx => {
                const { row, col } = positions[monopolyIdx];
                const idx = row * size + col;
                boardCells[idx].removeEventListener('click', handleCellClick);
                boardCells[idx].classList.remove('bus-ticket-highlight');
            });

            // Move player
            player.position = clickedMonopolyIdx;
            const landedSquare = this.board[player.position];
            game.fixedUI.updateChatMessage(`${player.username} used a Bus Ticket to move to ${landedSquare.name || `Space ${clickedMonopolyIdx + 1}`}.`);
            game.render();
            if (typeof landedSquare.onLand === "function") {
                landedSquare.onLand(player, game);
            }
        };

        // Highlight and add listeners to the correct cells
        validIndexes.forEach(monopolyIdx => {
            const { row, col } = positions[monopolyIdx];
            const cellIdx = row * size + col;
            const cell = boardCells[cellIdx];
            if (!cell) return;
            cell.classList.add('bus-ticket-highlight');
            cell.addEventListener('click', handleCellClick);
        });
        // --- MAPPING LOGIC END ---

        // Show instruction
        const infoDiv = document.querySelector("#mm-info");
        if (infoDiv) {
            infoDiv.innerHTML = `${player.username} used a Bus Ticket! Click any space ahead on your current side to move there.`;
        }
    }

    moveTriples(player, gameContext, onSquareChosen) { // gameContext is the SinglePlayerGame instance
        const infoDiv = document.querySelector("#mm-info"); // Consider moving UI updates to FixedUIScreen via gameContext
        if (infoDiv) {
            infoDiv.innerHTML = `${player.username} rolled TRIPLES! Click any space on the board to move there.`;
        }

        const size = 14; // Or get from gameContext.renderGame.gridSize or similar
        const positions = gameContext.renderGame.getBoardPositions(size);
        const boardCells = Array.from(document.querySelectorAll('#mm-board > div'));

        const handleCellClick = (e) => {
            const cellDomElement = e.currentTarget;
            const cellIdx = boardCells.indexOf(cellDomElement);
            // Find the Monopoly board index (0-55) corresponding to the clicked DOM cell
            const clickedMonopolyIdx = positions.findIndex(
                pos => pos.row * size + pos.col === cellIdx // Assuming getBoardPositions maps 0-55 to row/col
            );

            if (clickedMonopolyIdx === -1) { // Should not happen if highlighting is correct
                console.warn("Clicked cell not found in board positions map", cellDomElement);
                return;
            }

            // Clean up highlights and listeners
            boardCells.forEach(cell => {
                cell.removeEventListener('click', handleCellClick);
                cell.classList.remove('bus-ticket-highlight'); // Ensure this class is defined and used for highlighting
            });
            if (typeof onSquareChosen === "function") {
                onSquareChosen(clickedMonopolyIdx);
            }
        };

        // Highlight all cells for the player to choose
        boardCells.forEach(cell => {
            cell.classList.add('bus-ticket-highlight');
            cell.addEventListener('click', handleCellClick);
        });
    }
}

module.exports = MonopolyBaseLogic;