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

    chooseBoardPositionByClick(player, board, onComplete) {
        // Show instruction
        const infoDiv = document.querySelector("#mm-info");
        infoDiv.innerHTML = `${player.username} rolled TRIPLES! Click any space on the board to move there.`;

        // Get all board cells
        const boardCells = document.querySelectorAll('#mm-board > div');
        // Handler function
        const handleCellClick = (e) => {
            const idx = Array.from(boardCells).indexOf(e.currentTarget);
            if (idx === -1) return;

            // Move player
            player.position = idx;
            const landedSquare = board[player.position];

            // Clean up: remove all handlers
            boardCells.forEach(cell => cell.removeEventListener('click', handleCellClick));

            // Callback to continue game logic
            if (typeof onComplete === "function") {
                onComplete(landedSquare, idx);
            }
        };

        // Attach click handler to each cell
        boardCells.forEach(cell => cell.addEventListener('click', handleCellClick));
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
}

module.exports = MonopolyBaseLogic;