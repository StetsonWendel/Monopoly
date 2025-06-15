class MonopolyBaseLogic {
    constructor(players, board, chanceDeck, communityChestDeck, busTicketDeck) {
        this.players = players;
        this.currentTurn = 0;
        this.board = board;
        this.chanceDeck = chanceDeck;
        this.communityChestDeck = communityChestDeck;
        this.busTicketDeck = busTicketDeck;
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
                this.movePlayer(player, roll.d1 + roll.d2);
                game.render();
                const landedSquare = game.board[player.position];
                if (typeof landedSquare.onLand === "function") {
                    landedSquare.onLand(player, game);
                }
                // Do NOT give another turn for doubles
            } else {
                player.jailTurns++;
                if (player.jailTurns >= 3) {
                    // Must pay $50 and move
                    player.bank -= 50;
                    player.inJail = false;
                    player.jailTurns = 0;
                    game.fixedUI.updateChatMessage(`${player.username} paid $50 after 3 turns and gets out of Jail.`);
                    this.movePlayer(player, roll.d1 + roll.d2);
                    game.render();
                    const landedSquare = game.board[player.position];
                    if (typeof landedSquare.onLand === "function") {
                        landedSquare.onLand(player, game);
                    }
                } else {
                    game.fixedUI.updateChatMessage(`${player.username} did not roll doubles and remains in Jail.`);
                    game.endTurn();
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
            game.startTurn(); // Let them roll and move
        };

        // Use Get Out of Jail Free card
        cardBtn.onclick = () => {
            if (player.hasGetOutOfJailFree) {
                modal.style.display = "none";
                player.hasGetOutOfJailFree = false;
                player.inJail = false;
                player.jailTurns = 0;
                game.fixedUI.updateChatMessage(`${player.username} used a Get Out of Jail Free card!`);
                game.startTurn(); // Let them roll and move
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

    moveTriples(player, game, onComplete) {
        // Show instruction
        const infoDiv = document.querySelector("#mm-info");
        if (infoDiv) {
            infoDiv.innerHTML = `${player.username} rolled TRIPLES! Click any space on the board to move there.`;
        }

        // Get mapping and board cells
        const size = 14; // or get from game.renderGame if dynamic
        const positions = game.renderGame.getBoardPositions(size);
        const boardCells = Array.from(document.querySelectorAll('#mm-board > div'));

        // Handler function
        const handleCellClick = (e) => {
            const cellIdx = boardCells.indexOf(e.currentTarget);
            const clickedMonopolyIdx = positions.findIndex(
                pos => pos.row * size + pos.col === cellIdx
            );
            if (clickedMonopolyIdx === -1) return;

            // Clean up: remove all handlers
            positions.forEach(({row, col}) => {
                const idx = row * size + col;
                if (boardCells[idx]) {
                    boardCells[idx].removeEventListener('click', handleCellClick);
                    boardCells[idx].classList.remove('bus-ticket-highlight');
                }
            });

            // Move player
            player.position = clickedMonopolyIdx;
            const landedSquare = game.board[player.position];

            // Callback to continue game logic
            if (typeof onComplete === "function") {
                onComplete(landedSquare, clickedMonopolyIdx);
            }
        };

        // Highlight and attach click handler to every cell
        positions.forEach(({row, col}, monopolyIdx) => {
            const idx = row * size + col;
            const cell = boardCells[idx];
            if (!cell) return;
            cell.classList.add('bus-ticket-highlight');
            cell.addEventListener('click', handleCellClick);
        });
    }
}

module.exports = MonopolyBaseLogic;