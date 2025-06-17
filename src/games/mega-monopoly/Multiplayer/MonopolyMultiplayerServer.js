const games = {}; // This global object stores game states.
const Player = require('../Player');
const MonopolyBaseLogic = require('../MonopolyBaseLogic');
const Deck = require('../Deck');
const chanceCards = require('../chance-cards');
const communityChestCards = require('../community-chest-cards');
const busTicketCards = require('../bus-ticket-cards');
const boardData = require('../monopoly-board-data.json'); // Import your board data

// Import BoardSpace and its subclasses
const BoardSpace = require('../BoardSpace');
const PropertySpace = require('../BoardSpaceHierarchy/BuyableSpaceHierarchy/PropertySpace');
const RailroadSpace = require('../BoardSpaceHierarchy/BuyableSpaceHierarchy/RailroadSpace');
const UtilitySpace = require('../BoardSpaceHierarchy/BuyableSpaceHierarchy/UtilitySpace');
const GoToJailSpace = require('../BoardSpaceHierarchy/Default/GoToJailSpace');
const GoSpace = require('../BoardSpaceHierarchy/Default/GoSpace');
const JailSpace = require('../BoardSpaceHierarchy/Default/JailSpace');
const FreeParkingSpace = require('../BoardSpaceHierarchy/Default/FreeParkingSpace');
const ChanceSpace = require('../BoardSpaceHierarchy/Default/ChanceSpace');
const CommunityChestSpace = require('../BoardSpaceHierarchy/Default/CommunityChestSpace');
const AuctionSpace = require('../BoardSpaceHierarchy/Default/AuctionSpace');
const BirthdayGiftSpace = require('../BoardSpaceHierarchy/Default/BirthdayGiftSpace');
const BusTicketSpace = require('../BoardSpaceHierarchy/Default/BusTicketSpace');
const TaxSpace = require('../BoardSpaceHierarchy/Default/TaxSpace');


// Helper function to create server-side board objects
// This is similar to RenderMonopolyGame.createBoardObjects but without DOM cell dependencies
function initializeServerBoard(boardLayoutData) {
    const colorGroupCounts = {};
    boardLayoutData.forEach(sq => {
        if (sq.type === "property" && sq.color) {
            colorGroupCounts[sq.color] = (colorGroupCounts[sq.color] || 0) + 1;
        }
    });

    return boardLayoutData.map((sq, idx) => {
        // 'edge' and 'cell' are not relevant for server-side logic here
        // We pass 'null' for cell, and edge can be omitted or set to a default if needed by any logic
        const spaceParams = { pos: idx, name: sq.name, edge: null, cell: null };

        switch (sq.type) {
            case "property":
                return new PropertySpace({
                    ...spaceParams,
                    price: sq.price,
                    rentArray: sq.rent,
                    colorGroup: sq.color,
                    buildingCost: sq.buildingCost,
                    realEstateType: "property",
                    numInSet: colorGroupCounts[sq.color] || 0
                });
            case "railroad":
                return new RailroadSpace({ ...spaceParams, price: sq.price, realEstateType: "railroad" });
            case "utility":
                return new UtilitySpace({ ...spaceParams, price: sq.price, realEstateType: "utility" });
            case "chance":
                return new ChanceSpace(spaceParams);
            case "community-chest":
                return new CommunityChestSpace(spaceParams);
            case "special":
                switch (sq.name) {
                    case "GO": return new GoSpace(spaceParams);
                    case "Go To Jail": return new GoToJailSpace(spaceParams);
                    case "Jail / Just Visiting": return new JailSpace(spaceParams); // name is already in spaceParams
                    case "Free Parking": return new FreeParkingSpace(spaceParams);
                    case "Auction": return new AuctionSpace(spaceParams);
                    case "Birthday Gift": return new BirthdayGiftSpace(spaceParams);
                    case "Bus Ticket": return new BusTicketSpace(spaceParams);
                    default: // This will be Tax spaces
                        return new TaxSpace({ ...spaceParams, taxAmount: sq.taxAmount });
                }
            default:
                // Fallback for any other types, though your JSON seems to cover these
                console.warn(`[ServerBoardInit] Unknown space type: ${sq.type} for ${sq.name}. Creating generic BoardSpace.`);
                return new BoardSpace(spaceParams);
        }
    });
}


class MonopolyMultiplayerServer {
    constructor(io, gameCode, lobby) {
        this.io = io;
        this.gameCode = gameCode;

        if (!games[gameCode]) {
            const serverPlayers = lobby.players.map(pInfo => new Player(pInfo));
            
            // Initialize the server-side board
            const serverBoard = initializeServerBoard(boardData);

            games[gameCode] = {
                host: lobby.host,
                players: serverPlayers,
                currentTurn: 0,
                chanceDeck: new Deck(chanceCards),
                communityChestDeck: new Deck(communityChestCards),
                busTicketDeck: new Deck(busTicketCards),
                board: serverBoard, // Store the actual server board
                // Instantiate REAL MonopolyBaseLogic
                serverLogic: new MonopolyBaseLogic(
                    serverPlayers,
                    serverBoard, // Pass the server-side board
                    new Deck(chanceCards), // Use new deck instances for the logic
                    new Deck(communityChestCards),
                    new Deck(busTicketCards)
                )
            };
            console.log(`[MonopolyServer INSTANCE ${this.gameCode}] Initialized with real MonopolyBaseLogic and server board.`);
        } else {
            console.log(`[MonopolyServer INSTANCE ${this.gameCode}] Re-using existing game state for ${gameCode}.`);
        }
        // ... (rest of constructor: setupJoinListenerForSocket, iterating room
        // IMPORTANT: Remove the global io.on("connection", ...) from this constructor.
        // Relying on iterating existing sockets in the room (above) is more targeted for the current flow.
        // The global io.on("connection") listener, when used by multiple game instances,
        // is the likely source of conflicts or missed events for already-connected sockets.
        // This change assumes games don't support players connecting to the server *for the first time*
        // directly into an already started game without going through the lobby managed by server.js.
        // If late-joining of brand new connections is needed, server.js would need to route them.
    }

    attachHandlers(socket) {
        const instanceGameCode = this.gameCode;
        const game = games[instanceGameCode];

        if (!game) {
            console.error(`[MonopolyServer ${instanceGameCode}] ATTACH_HANDLERS: Game object not found for ${instanceGameCode}. Cannot attach handlers for socket ${socket.id}.`);
            return;
        }
        // Add checks for game.serverLogic and game.board
        if (!game.serverLogic) {
            console.error(`[MonopolyServer ${instanceGameCode}] ATTACH_HANDLERS: serverLogic not found for game ${instanceGameCode}.`);
            return;
        }
        if (!game.board || game.board.length === 0) {
            console.error(`[MonopolyServer ${instanceGameCode}] ATTACH_HANDLERS: board not found or empty for game ${instanceGameCode}.`);
            return;
        }

        console.log(`[MonopolyServer ${instanceGameCode}] ATTACH_HANDLERS: Called for socket ${socket.id}.`);
        console.log(`[MonopolyServer ${instanceGameCode}] ATTACH_HANDLERS: Socket ${socket.id} current _monopolyGameCode: ${socket._monopolyGameCode}, _monopolyHandlersAttachedBy: ${socket._monopolyHandlersAttachedBy === this ? 'this_instance' : socket._monopolyHandlersAttachedBy}`);
        console.log(`[MonopolyServer ${instanceGameCode}] ATTACH_HANDLERS: Socket ${socket.id} 'end-turn' listener count BEFORE: ${socket.listenerCount('end-turn')}`);

        if (socket._monopolyGameCode === instanceGameCode && socket._monopolyHandlersAttachedBy === this) {
            console.log(`[MonopolyServer ${instanceGameCode}] ATTACH_HANDLERS: Handlers ALREADY attached by THIS EXACT INSTANCE for socket ${socket.id}. Skipping.`);
            return;
        }

        if (socket._monopolyGameCode && socket._monopolyGameCode !== instanceGameCode) {
            console.warn(`[MonopolyServer ${instanceGameCode}] ATTACH_HANDLERS: Socket ${socket.id} had handlers for a DIFFERENT game (${socket._monopolyGameCode}). This instance for ${instanceGameCode} will now take over.`);
        }
        
        console.log(`[MonopolyServer ${instanceGameCode}] ATTACH_HANDLERS: Attaching "end-turn" listener for socket ${socket.id}.`);

        const endTurnHandler = (data) => {
            if (!data || data.gameCode !== instanceGameCode) {
                console.error(`[MonopolyServer ${instanceGameCode}] "end-turn" HANDLER (socket ${socket.id}): IGNORED. Event data missing gameCode or event for game ${data?.gameCode}, but this handler is for ${instanceGameCode}.`);
                return;
            }
            console.log(`[MonopolyServer ${instanceGameCode}] "end-turn" HANDLER (socket ${socket.id}): Processing for game ${data.gameCode}.`);
            
            const currentGame = games[instanceGameCode]; // Use a different variable name to avoid conflict
            if (!currentGame) {
                console.error(`[MonopolyServer ${instanceGameCode}] "end-turn" HANDLER (socket ${socket.id}): Game object not found in 'games' for ${instanceGameCode}.`);
                return;
            }
            if (typeof currentGame.currentTurn !== "number") currentGame.currentTurn = 0;
            if (!currentGame.players || currentGame.players.length === 0) {
                console.error(`[MonopolyServer ${instanceGameCode}] "end-turn" HANDLER (socket ${socket.id}): No players in game.`);
                return;
            }
            currentGame.currentTurn = (currentGame.currentTurn + 1) % currentGame.players.length; 
            console.log(`[MonopolyServer ${instanceGameCode}] "end-turn" HANDLER (socket ${socket.id}): New turn is ${currentGame.currentTurn} for player ID ${currentGame.players[currentGame.currentTurn]?.id}.`);
            
            const roomSockets = this.io.of("/").adapter.rooms.get(instanceGameCode);
            if (roomSockets) {
                console.log(`[MonopolyServer ${instanceGameCode}] "end-turn" HANDLER (socket ${socket.id}): Sockets in room ${instanceGameCode}: ${Array.from(roomSockets)}`);
            } else {
                console.error(`[MonopolyServer ${instanceGameCode}] "end-turn" HANDLER (socket ${socket.id}): Room ${instanceGameCode} does not exist or is empty.`);
            }
            console.log(`[MonopolyServer ${instanceGameCode}] "end-turn" HANDLER (socket ${socket.id}): Broadcasting "turn-update" to room ${instanceGameCode} with new turn: ${currentGame.currentTurn}.`);
            this.io.to(instanceGameCode).emit("turn-update", { currentTurn: currentGame.currentTurn });
            console.log(`[MonopolyServer ${instanceGameCode}] "end-turn" HANDLER (socket ${socket.id}): "turn-update" broadcast completed.`);
        };
        
        socket.on("end-turn", endTurnHandler);


        // DICE ROLLED BY CLIENT HANDLER
        socket.on("dice-rolled-by-client", ({ gameCode: clientGameCode, playerId, roll }) => {
            if (clientGameCode !== instanceGameCode) {
                console.warn(`[MonopolyServer ${instanceGameCode}] "dice-rolled-by-client" for wrong game ${clientGameCode}. Ignoring.`);
                return;
            }
            // Ensure game.board is also checked
            if (!game || !game.players || !game.serverLogic || !game.board || game.board.length === 0) {
                console.error(`[MonopolyServer ${instanceGameCode}] Game, players, serverLogic, or board not initialized for "dice-rolled-by-client".`);
                return;
            }

            const currentPlayerTurnIndex = game.currentTurn;
            const currentPlayerExpected = game.players[currentPlayerTurnIndex];

            if (!currentPlayerExpected || currentPlayerExpected.id !== playerId) {
                console.warn(`[MonopolyServer ${instanceGameCode}] "dice-rolled-by-client" from player ${playerId}, but expected player ${currentPlayerExpected?.id}. Ignoring.`);
                return;
            }

            console.log(`[MonopolyServer ${instanceGameCode}] "dice-rolled-by-client" received from ${playerId}. Roll:`, roll);

            const player = game.players.find(p => p.id === playerId);
            if (!player) {
                console.error(`[MonopolyServer ${instanceGameCode}] Player ${playerId} not found in game state.`);
                return;
            }
            
            const moneyBeforeMove = player.money; // Store money before move

            const totalRoll = roll.d1 + roll.d2 + (typeof roll.mega === 'number' ? roll.mega : 0);
            // Use the real serverLogic.movePlayer, which uses the server's board
            const landedSquare = game.serverLogic.movePlayer(player, totalRoll); 

            this.io.to(instanceGameCode).emit("player-moved", {
                playerId: player.id,
                newPosition: player.position,
                landedSquareName: landedSquare ? landedSquare.name : `Space ${player.position}`, // Use landedSquare.name
                rollDetails: roll
            });
            console.log(`[MonopolyServer ${instanceGameCode}] "player-moved" event emitted for ${playerId}. New position: ${player.position}, Landed square: ${landedSquare?.name}, Roll:`, roll);

            // Send money updates separately if they occurred (e.g., passing Go)
            if (player.money !== moneyBeforeMove) {
                 this.io.to(instanceGameCode).emit("player-data-updated", {
                    playerId: player.id,
                    money: player.money
                });
            }

            // Call onLand
            if (landedSquare && typeof landedSquare.onLand === 'function') {
                console.log(`[MonopolyServer ${instanceGameCode}] Calling onLand for ${landedSquare.name} (Player: ${player.username})`);
                // Pass the server's MonopolyBaseLogic instance and a context for server IO
                landedSquare.onLand(player, game.serverLogic, {
                    io: this.io,
                    gameCode: instanceGameCode,
                    socketId: player.id // The socket ID of the player whose turn it is
                });
            } else {
                console.warn(`[MonopolyServer ${instanceGameCode}] Landed square ${landedSquare?.name} (pos ${player.position}) has no onLand function or landedSquare is undefined.`);
            }


            let megaMessagePart = "";
            if (typeof roll.mega === 'number') megaMessagePart = `+${roll.mega}`;
            else if (roll.mega) megaMessagePart = ` (${roll.mega})`;

            this.io.to(instanceGameCode).emit("game-message",
                `${player.username} rolled ${roll.d1}+${roll.d2}${megaMessagePart} = ${totalRoll}, landed on ${landedSquare ? landedSquare.name : `Space ${player.position}`}.`
            );

            if (roll.d1 === roll.d2 && roll.d1 !== 0) {
                console.log(`[MonopolyServer ${instanceGameCode}] Player ${player.username} rolled doubles. Emitting "another-turn".`);
                const clientSocket = this.io.sockets.sockets.get(playerId);
                if (clientSocket) {
                    clientSocket.emit("another-turn", { reason: "doubles" });
                } else {
                    console.warn(`[MonopolyServer ${instanceGameCode}] Could not find socket for player ${playerId} to emit "another-turn".`);
                }
            } else {
                console.log(`[MonopolyServer ${instanceGameCode}] Player ${player.username} did not roll doubles. Turn action complete.`);
            }
        });
        
        socket._monopolyGameCode = instanceGameCode;
        socket._monopolyHandlersAttachedBy = this;

        console.log(`[MonopolyServer ${instanceGameCode}] ATTACH_HANDLERS: Finished for socket ${socket.id}.`);
        console.log(`[MonopolyServer ${instanceGameCode}] ATTACH_HANDLERS: Socket ${socket.id} 'end-turn' listener count AFTER: ${socket.listenerCount('end-turn')}`);
    }
}

module.exports = MonopolyMultiplayerServer;