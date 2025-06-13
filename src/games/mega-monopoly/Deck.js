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
}

module.exports = Deck;