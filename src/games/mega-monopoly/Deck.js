class Deck {
    constructor(cards) {
        this.cards = [...cards];
        this.discard = [];
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        if (this.cards.length === 0) {
            // Reshuffle discard pile if empty
            this.cards = this.discard;
            this.discard = [];
            this.shuffle();
        }
        const card = this.cards.shift();
        this.discard.push(card);
        return card;
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

    /**
     * Draws a card, shows the modal, applies the effect, and re-renders the game.
     * @param {Object} player - The player who drew the card.
     * @param {Object} gameInstance - The game instance.
     */
    drawAndShowCard(player, gameInstance) {
        const card = this.draw();
        this.showCardModal(card, () => {
            card.effect(player, gameInstance);
            if (typeof gameInstance.render === "function") gameInstance.render();
        });
    }
}

module.exports = Deck;