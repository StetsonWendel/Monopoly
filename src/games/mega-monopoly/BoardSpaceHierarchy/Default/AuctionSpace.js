const BoardSpace = require('../../BoardSpace');

class AuctionSpace extends BoardSpace {
    constructor({ pos, name = "Auction", edge, cell }) {
        super({ pos, name, edge , cell});
        this.type = "auction";


    }

    populateCell(){
        // Insert auction image with desired parameters.
        const imgSrc = "games/mega-monopoly/assets/auction.png";
        super.renderImage( imgSrc, "100%", "100%", "55%");
        super.renderName( "-70%", "2.5em", "2px");
    }

    // Called when a player lands on this space
    onLand(player, game) {

        const unowned = game.board.filter(sq =>
            (sq.realEstateType === "property" || sq.realEstateType === "railroad" || sq.realEstateType === "utility") &&
            (!sq.owner || sq.owner === "unowned" || sq.owner === "bank")
        );

        if (unowned.length > 0) {
            this.startAuction(player, unowned, game);
        } else if (game.logic && typeof game.logic.findHighestOwnedRent === "function") {
            // Use MonopolyBaseLogic's method
            const best = game.logic.findHighestOwnedRent();
            if (best) {
                player.position = best.pos;
                game.render();
                if (typeof best.onLand === "function") {
                    best.onLand(player, game);
                }
                game.fixedUI.updateChatMessage(`${player.username} was moved to ${best.name} (highest rent property) since no unowned properties remain.`);
            }
        }

    }

    startAuction(player, unowned, game) {
        // Only show modal to the current player
        const currentPlayer = game.players[game.whosTurn];
        if (!currentPlayer || player.id !== currentPlayer.id) return;

        const pageSize = 10;
        let page = 0;

        const showModal = () => {
            // Remove any existing modal
            const oldModal = document.getElementById("auction-property-modal");
            if (oldModal) document.body.removeChild(oldModal);

            const modal = document.createElement("div");
            modal.id = "auction-property-modal";
            modal.style.position = "fixed";
            modal.style.left = "0";
            modal.style.top = "0";
            modal.style.width = "100vw";
            modal.style.height = "100vh";
            modal.style.background = "#0008";
            modal.style.zIndex = "9999";
            modal.style.display = "flex";
            modal.style.alignItems = "center";
            modal.style.justifyContent = "center";

            const box = document.createElement("div");
            box.style.background = "#fffbeed0";
            box.style.padding = "24px";
            box.style.borderRadius = "12px";
            box.style.maxWidth = "400px";
            box.style.boxShadow = "0 2px 12px #0003";
            box.innerHTML = `<h3>Select a property to auction:</h3>`;

            // Show only properties for this page
            const start = page * pageSize;
            const end = Math.min(start + pageSize, unowned.length);
            for (let i = start; i < end; i++) {
                const sq = unowned[i];
                const btn = document.createElement("button");
                btn.textContent = `${sq.name} ($${sq.price})`;
                btn.style.display = "block";
                btn.style.margin = "8px 0";
                btn.onclick = () => {
                    document.body.removeChild(modal);
                    this.runAuction(sq, game);
                };
                box.appendChild(btn);
            }

            // Paging controls
            const controls = document.createElement("div");
            controls.style.marginTop = "16px";
            controls.style.textAlign = "center";

            const prevBtn = document.createElement("button");
            prevBtn.textContent = "Previous";
            prevBtn.disabled = page === 0;
            prevBtn.onclick = () => {
                page = Math.max(0, page - 1);
                showModal();
            };

            const nextBtn = document.createElement("button");
            nextBtn.textContent = "Next";
            nextBtn.disabled = end >= unowned.length;
            nextBtn.onclick = () => {
                page = Math.min(Math.floor((unowned.length - 1) / pageSize), page + 1);
                showModal();
            };

            controls.appendChild(prevBtn);
            controls.appendChild(nextBtn);
            box.appendChild(controls);

            // Page info
            const pageInfo = document.createElement("div");
            pageInfo.style.marginTop = "8px";
            pageInfo.textContent = `Showing ${start + 1}-${end} of ${unowned.length}`;
            box.appendChild(pageInfo);

            modal.appendChild(box);
            document.body.appendChild(modal);
        };

        showModal();
    }

    runAuction(property, game) {
        const players = game.players.filter(p => p.bank >= 1); // Only players with money can bid
        if (players.length === 0) {
            game.fixedUI.updateChatMessage(`No one can afford to bid for ${property.name}.`);
            return;
        }

        let activeBidders = [...players];
        let currentBid = 0;
        let highestBidder = null;

        const nextBid = () => {
            if (activeBidders.length === 1) {
                // Auction ends
                const winner = activeBidders[0];
                winner.bank -= currentBid;
                property.owner = winner;
                if (typeof winner.addRealEstate === "function") winner.addRealEstate(property);
                game.fixedUI.updateChatMessage(`${winner.username} won the auction for ${property.name} at $${currentBid}!`);
                game.render();
                return;
            }

            // Next bidder
            const bidder = activeBidders.shift();

            // Modal for bidding
            const modal = document.createElement("div");
            modal.style.position = "fixed";
            modal.style.left = "0";
            modal.style.top = "0";
            modal.style.width = "100vw";
            modal.style.height = "100vh";
            modal.style.background = "#0008";
            modal.style.zIndex = "9999";
            modal.style.display = "flex";
            modal.style.alignItems = "center";
            modal.style.justifyContent = "center";

            const box = document.createElement("div");
            box.style.background = "#fffbeed0";
            box.style.padding = "24px";
            box.style.borderRadius = "12px";
            box.style.maxWidth = "400px";
            box.style.boxShadow = "0 2px 12px #0003";
            box.innerHTML = `
                <h3>${bidder.username}, it's your turn to bid!</h3>
                <p>Current bid: $${currentBid} for ${property.name}</p>
                <p>Your bank: $${bidder.bank}</p>
            `;

            const bidInput = document.createElement("input");
            bidInput.type = "number";
            bidInput.min = currentBid + 5;
            bidInput.max = bidder.bank;
            bidInput.value = currentBid + 5;
            bidInput.style.marginRight = "8px";
            bidInput.style.width = "80px";

            const bidBtn = document.createElement("button");
            bidBtn.textContent = "Bid";
            bidBtn.style.marginRight = "12px";

            const passBtn = document.createElement("button");
            passBtn.textContent = "Pass";

            bidBtn.onclick = () => {
                const bidAmount = parseInt(bidInput.value, 10);
                if (
                    isNaN(bidAmount) ||
                    bidAmount < currentBid + 5 ||
                    bidAmount > bidder.bank
                ) {
                    alert(`Bid must be at least $${currentBid + 5} and no more than your bank ($${bidder.bank}).`);
                    return;
                }
                document.body.removeChild(modal);
                currentBid = bidAmount;
                highestBidder = bidder;
                activeBidders.push(bidder); // Stay in the bidding
                nextBid();
            };

            passBtn.onclick = () => {
                document.body.removeChild(modal);
                // Do not add bidder back to activeBidders
                nextBid();
            };

            box.appendChild(bidInput);
            box.appendChild(bidBtn);
            box.appendChild(passBtn);
            modal.appendChild(box);
            document.body.appendChild(modal);
        };

        // Start auction with all bidders
        // The first bid must be at least $5
        currentBid = 0;
        highestBidder = null;
        nextBid();
    }


}

module.exports = AuctionSpace;