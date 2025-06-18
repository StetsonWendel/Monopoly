const RenderMonopolyGame = require('./RenderMonopolyGame');
const MonopolyBaseLogic = require('./MonopolyBaseLogic');
const { GameEngine } = require('../GameEngine');
const Player = require('./Player');
const FixedUIScreen = require('./FixedUIScreen');
const Deck = require('./Deck');
const chanceCards = require('./chance-cards');
const communityChestCards = require('./community-chest-cards');
const busTicketCards = require('./bus-ticket-cards');

class SinglePlayerGame {
    constructor(container, playersInfo) { // <-- add boardData param
        this.container = container;
        this.whosTurn = 0;
        this.players = playersInfo.map(p => new Player(p));

        // Rendering and board creation
        this.renderGame = new RenderMonopolyGame(this.players);
        this.board = this.renderGame.renderBoard(); 

        // Game logic
        this.logic = new MonopolyBaseLogic(this.players, this.board);

        this.engine = new GameEngine(this.board, this.players);
        this.engine.currentTurn = 0;

        // Set all player positions to 0 at start
        this.players.forEach(p => { p.position = 0; });

        // Create the fixed UI ONCE
        this.fixedUI = new FixedUIScreen(this.container, {
            onEndTurn: () => this.endTurn(),
            onQuit: () => { window.location.reload(); },
            onTrade: () => this.handleTrade(),
            onSave: () => { /* save game logic */ },
            onViewRealEstate: () => {
                const currentPlayer = this.players[this.whosTurn];
                this.fixedUI.showRealEstateList(
                    currentPlayer,
                    this.board,
                    { // Action Handlers for Single Player
                        onDevelop: (prop) => {
                            // Use the property's develop method, which should use player.money and logic
                            const result = prop.develop(currentPlayer, this.logic);
                            if (result.success) {
                                if (typeof prop.renderDevelopment === "function") prop.renderDevelopment(); // Client-side visual update
                                this.fixedUI.updateChatMessage(`${currentPlayer.username} developed ${prop.name}.`);
                                this.render(); // Re-render game state (e.g., player money)
                                this.fixedUI.showRealEstateList(currentPlayer, this.board, /* pass handlers again to refresh modal */); // Refresh modal
                            } else {
                                alert(result.reason || "Cannot develop this property.");
                            }
                        },
                        onUndevelop: (prop) => {
                            const result = prop.undevelop(currentPlayer, this.logic);
                            if (result.success) {
                                if (typeof prop.renderDevelopment === "function") prop.renderDevelopment();
                                this.fixedUI.updateChatMessage(`${currentPlayer.username} sold development on ${prop.name} for $${result.refund}.`);
                                this.render();
                                this.fixedUI.showRealEstateList(currentPlayer, this.board, /* pass handlers again */);
                            } else {
                                alert(result.reason || "Cannot undevelop.");
                            }
                        },
                        onMortgage: (prop) => {
                            const result = prop.mortgage(currentPlayer, this.logic);
                            if (result.success) {
                                this.fixedUI.updateChatMessage(`${currentPlayer.username} mortgaged ${prop.name} for $${result.amount}.`);
                                this.render();
                                this.fixedUI.showRealEstateList(currentPlayer, this.board, /* pass handlers again */);
                            } else {
                                alert(result.reason || "Cannot mortgage.");
                            }
                        },
                        onUnmortgage: (prop) => {
                            const result = prop.unmortgage(currentPlayer, this.logic);
                            if (result.success) {
                                this.fixedUI.updateChatMessage(`${currentPlayer.username} unmortgaged ${prop.name} for $${result.cost}.`);
                                this.render();
                                this.fixedUI.showRealEstateList(currentPlayer, this.board, /* pass handlers again */);
                            } else {
                                alert(result.reason || "Cannot unmortgage.");
                            }
                        }
                    }
                );
            }
        });

        // Optionally, render other info
        this.render();

        this.fixedUI.updatePlayerInfo(this.players, this.whosTurn);

        // Initialize decks
        this.chanceDeck = new Deck(chanceCards);
        this.communityChestDeck = new Deck(communityChestCards);
        this.busTicketDeck = new Deck(busTicketCards);

        // Pass the decks to MonopolyBaseLogic
        this.logic = new MonopolyBaseLogic(
            this.players,
            this.board,
            this.chanceDeck,
            this.communityChestDeck,
            this.busTicketDeck
        );

        this.debugMode = true; // Set to true to enable debug mode
    }

    endTurn() {
        this.whosTurn = (this.whosTurn + 1) % this.players.length;
        this.engine.currentTurn++;
        this.render();
        this.startTurn();
    }

    render() {
        // Just update info displays, etc.
        this.renderGame.renderPlayerTokens();
        this.fixedUI.updatePlayerInfo(this.players, this.whosTurn);
    }

    startTurn() {
        const player = this.players[this.whosTurn];
        const modal = document.getElementById("turn-modal");
        const title = document.getElementById("turn-modal-title");
        const rollBtn = document.getElementById("turn-modal-roll");
        const busBtn = document.getElementById("turn-modal-bus");

        title.textContent = `${player.username}, it's your turn!`;
        rollBtn.style.display = "inline-block";
        busBtn.style.display = player.numBusTickets > 0 ? "inline-block" : "none";

        modal.style.display = "flex";

        // Disable "End Turn" button until the player rolls
        this.fixedUI.enableEndTurnButton(false);

        // Remove previous handlers
        rollBtn.onclick = null;
        busBtn.onclick = null;

        rollBtn.onclick = () => {
            modal.style.display = "none";
            this.rollDiceAndMove();
        };
        busBtn.onclick = () => {
            modal.style.display = "none";
            this.logic.useBusTicket(this.players[this.whosTurn], this);
        };

        if (player.inJail) {
            // Show jail options
            this.logic.showJailOptions(player, this);
            return;
        }
    }

    async rollDiceAndMove() {
        const player = this.players[this.whosTurn];
        
        let roll;
        if (this.debugMode) {
            roll = await this.getDebugDiceValues();
        } else {
            roll = this.logic.rollDice();
        }

        // Ensure logic has the latest roll for utility calculations if needed by onLand
        this.logic.setLastRoll(roll);

        let d3 = 0;
        if (typeof roll.mega === "number") {
            d3 = roll.mega;
        }
        const total = roll.d1 + roll.d2 + d3;

        // Check for triples (all dice equal and d3 is a number)
        if (typeof roll.mega === "number" && roll.d1 === roll.d2 && roll.d2 === roll.mega) {
            this.fixedUI.updateChatMessage(`${player.username} rolled TRIPLLES! Choose any space to move to.`);
            // Pass 'this' (SinglePlayerGame instance) as gameContext
            this.logic.moveTriples(player, this, (chosenMonopolyIndex) => {
                // Player has chosen a square. Now move the player.
                player.position = chosenMonopolyIndex; // Directly set position
                const landedSquare = this.board[player.position];
                
                this.fixedUI.updateChatMessage(`${player.username} moved to ${landedSquare.name} with triples.`);
                this.render(); // Update token position

                if (landedSquare && typeof landedSquare.onLand === "function") {
                    landedSquare.onLand(player, this.logic, this);
                }

                // Enable "End Turn" button after triples
                this.fixedUI.updateChatMessage(`${player.username} finished their move after rolling triples. Click "End Turn" to proceed.`);
                this.fixedUI.enableEndTurnButton(true); // Allow the player to manually end their turn
            });
            return; // Stop further processing in rollDiceAndMove for triples
        }

        // Move player using MonopolyBaseLogic's method
        const landedSquare = this.logic.movePlayer(player, total);

        this.render();

        // Call onLand
        if (typeof landedSquare.onLand === "function") {
            landedSquare.onLand(player, this.logic, this);
        }

        // Mr. Monopoly logic
        if (roll.mega === "mrMonopoly") {
            this.logic.moveMrMonopoly(player, this.board, (nextSpace) => {
                this.render();

                if (typeof nextSpace.onLand === "function") {
                    nextSpace.onLand(player, this.logic, this);
                }
                // Move the chat message here:
                this.fixedUI.updateChatMessage(
                    `${player.username} is moved by Mr. Monopoly to ${nextSpace.name}!`
                );

                // After Mr. Monopoly logic, check for doubles
                this.handleTurnEndOrDoubles(roll, player);
            });
        } else if (roll.mega === "busTicket") {
            player.numBusTickets++;
            this.fixedUI.updateChatMessage(`${player.username} received a Bus Ticket!`);
            this.handleTurnEndOrDoubles(roll, player);
        } else {
            // If no special mega die logic, check for doubles
            this.handleTurnEndOrDoubles(roll, player);
        }
    }



    getDebugDiceValues() {
        return new Promise(resolve => {
            const modal = document.getElementById('debug-dice-modal');
            modal.style.display = 'flex';
            document.getElementById('debug-dice-ok').onclick = () => {
                const d1 = parseInt(document.getElementById('debug-die1').value, 10);
                const d2 = parseInt(document.getElementById('debug-die2').value, 10);
                let mega = document.getElementById('debug-mega').value;
                if (mega !== "mrMonopoly" && mega !== "busTicket") mega = parseInt(mega, 10);
                modal.style.display = 'none';
                resolve({ d1, d2, mega });
            };
        });
    }

    handleTrade() {
        this.fixedUI.showTradeModal(this.players, this.whosTurn, (tradeObj) => {
            // Show the review modal to the other player
            this.fixedUI.showTradeReviewModal(
                tradeObj,
                // onAccept
                (trade) => {
                    this.logic.executeTrade(trade); // Move trade logic to MonopolyBaseLogic
                    this.fixedUI.updatePlayerInfo(this.players, this.whosTurn);
                    this.fixedUI.updateChatMessage(
                        `${trade.from.username} and ${trade.to.username} completed a trade!`
                    );
                    this.render();
                },
                // onReject
                (trade) => {
                    this.fixedUI.updateChatMessage(`${trade.to.username} rejected the trade.`);
                }
            );
        });
    }

    handleTurnEndOrDoubles(roll, player) {
        if (roll.d1 === roll.d2 && !(typeof roll.mega === "number" && roll.d1 === roll.d2 && roll.d2 === roll.mega)) {
            // Player rolled doubles
            this.fixedUI.updateChatMessage(
                `${player.username} rolled doubles and gets another turn!`
            );

            if (!player.inJail) { // Only grant another turn if not getting out of jail with doubles
                player.consecutiveDoubles++;
                if (player.consecutiveDoubles === 3) {
                    this.fixedUI.updateChatMessage(`${player.username} rolled doubles three times! Go to Jail.`);
                    this.logic.sendPlayerToJail(player);
                    this.fixedUI.enableEndTurnButton(true); // Allow ending turn after going to jail
                } else {
                    this.startTurn(); // Automatically start another turn
                }
            } else {
                // If they got out of jail with doubles, their turn usually ends.
                player.consecutiveDoubles = 0; // Reset doubles count
                this.fixedUI.enableEndTurnButton(true); // Allow ending turn
            }
        } else {
            // Not doubles, enable "End Turn" button
            player.consecutiveDoubles = 0; // Reset doubles count
            this.fixedUI.enableEndTurnButton(true);
        }
    }
}

module.exports = SinglePlayerGame;