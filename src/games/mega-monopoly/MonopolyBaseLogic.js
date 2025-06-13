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

    showCardModal(card, onClose) {
        const modal = document.getElementById("card-modal");
        const img = document.getElementById("card-modal-img");
        const text = document.getElementById("card-modal-text");
        const closeBtn = document.getElementById("card-modal-close");
    
        img.src = card.img;
        text.textContent = card.text;
        modal.style.display = "flex";
    
        // Remove any previous handler
        closeBtn.onclick = null;
        closeBtn.onclick = () => {
            modal.style.display = "none";
            if (typeof onClose === "function") onClose();
        };
    }

    drawChanceCard(player, gameInstance) {
        const card = this.chanceDeck.draw();
        this.showCardModal(card, () => {
            card.effect(player, gameInstance);
            gameInstance.render();
        });
    }
}

module.exports = MonopolyBaseLogic;