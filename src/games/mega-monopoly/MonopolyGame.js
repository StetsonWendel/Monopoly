const PropertySpace = require('./BoardSpaceHierarchy/BuyableSpaceHierarchy/PropertySpace');
const RailroadSpace = require('./BoardSpaceHierarchy/BuyableSpaceHierarchy/RailroadSpace');
const UtilitySpace = require('./BoardSpaceHierarchy/BuyableSpaceHierarchy/UtilitySpace');
const GoToJailSpace = require('./BoardSpaceHierarchy/Default/GoToJailSpace');
const GoSpace = require('./BoardSpaceHierarchy/Default/GoSpace');
const JailSpace = require('./BoardSpaceHierarchy/Default/JailSpace');
const FreeParkingSpace = require('./BoardSpaceHierarchy/Default/FreeParkingSpace');
const ChanceSpace = require('./BoardSpaceHierarchy/Default/ChanceSpace');
const CommunityChestSpace = require('./BoardSpaceHierarchy/Default/CommunityChestSpace');
const AuctionSpace = require('./BoardSpaceHierarchy/Default/AuctionSpace');
const BirthdayGiftSpace = require('./BoardSpaceHierarchy/Default/BirthdayGiftSpace');
const BusTicketSpace = require('./BoardSpaceHierarchy/Default/BusTicketSpace');
const TaxSpace = require('./BoardSpaceHierarchy/Default/TaxSpace');
const BoardSpace = require('./BoardSpace');
const boardData = require('./monopoly-board-data.json');
// const getBoardPositions = require('./getBoardPositions'); // Make sure this exists and is exported


class MonopolyGame {
  constructor(players) {
    this.players = players;
    this.currentTurn = 0;
    this.playerPositions = {};
    players.forEach(p => this.playerPositions[p.id] = 0);
    this.board = this.renderBoard();
  }

  createBoardObjects(boardData, positions, cells, size) {
    console.log("boardData length:", boardData.length, "positions length:", positions.length);
    return boardData.map((sq, idx) => {
      const pos = positions[idx];
      if (!pos) {
        console.warn(`No position for board index ${idx}`);
        return null;
      }
      const { row, col } = pos;
      const cell = cells[row * size + col];
      if (!cell) {
        console.warn(`Cell is undefined for idx=${idx}, row=${row}, col=${col}, name=${sq.name}`);
        return null;
      }

      let edge = "";
      if (row === 0) edge = "top";
      else if (col === size - 1) edge = "left";
      else if (row === size - 1) edge = "bottom";
      else if (col === 0) edge = "right";

      switch (sq.type) {
        case "property":
          return new PropertySpace({
            pos: idx,
            name: sq.name,
            edge,
            price: sq.price,
            rentArray: sq.rent,
            colorGroup: sq.color,
            buildingCost: sq.buildingCost,
            cell
          });
        case "railroad":
          return new RailroadSpace({
            pos: idx,
            name: sq.name,
            edge,
            price: sq.price,
            cell
          });
        case "utility":
          return new UtilitySpace({
            pos: idx,
            name: sq.name,
            edge,
            price: sq.price,
            cell
          });
        case "chance":
          return new ChanceSpace({ pos: idx, edge, cell });
        case "community-chest":
          return new CommunityChestSpace({ pos: idx, edge, cell });
        case "special":
          switch (sq.name) {
            case "GO":
              return new GoSpace({ pos: idx, edge, cell });
            case "Go To Jail":
              return new GoToJailSpace({ pos: idx, edge, cell });
            case "Jail / Just Visiting":  
              return new JailSpace({ pos: idx, name: sq.name, edge, cell });
            case "Free Parking":
              return new FreeParkingSpace({ pos: idx, edge, cell });
            case "Auction":
              return new AuctionSpace({ pos: idx, edge, cell });
            case "Birthday Gift":
              return new BirthdayGiftSpace({ pos: idx, edge, cell });
            case "Bus Ticket":
              return new BusTicketSpace({ pos: idx, edge, cell });
            default:
              return new TaxSpace({ pos: idx, name: sq.name, edge, cell, taxAmount: sq.taxAmount });
          }
        default:
          return new BoardSpace({ ...sq, pos: idx, edge, cell });
      }
    });
  }

  rollDice() {
    return {
      d1: Math.ceil(Math.random() * 6),
      d2: Math.ceil(Math.random() * 6),
      mega: Math.ceil(Math.random() * 12)
    };
  }

  movePlayer(playerId, steps) {
    const oldPos = this.playerPositions[playerId];
    const newPos = (oldPos + steps) % this.board.length;
    this.playerPositions[playerId] = newPos;
    return this.board[newPos];
  }

  renderBoard() {
    const size = 14;
    const cellPx = 200;
    const boardPx = size * cellPx;
    const container = document.getElementById("game-container");

    container.innerHTML = `
      <!-- Player bank/status area -->
      <div id="mm-players" style="position:fixed;left:32px;bottom:32px;z-index:2000;display:flex;flex-direction:column;align-items:flex-start;gap:8px;background:rgba(255,255,255,0.85);padding:12px 18px;border-radius:10px;box-shadow:0 2px 12px #0002;min-width:160px;"></div>
      <!-- The board grid itself -->
      <div id="mm-board" style="display: grid;grid-template-columns: repeat(${size}, 1fr);grid-template-rows: repeat(${size}, 1fr);width: ${boardPx}px;height: ${boardPx}px;border: 2px solid #222;margin-bottom: 20px;background: #fff;"></div>
      <!-- Board title overlay -->
      <div id="mm-board-title" style="position: absolute;left: 100%;top: 165%;transform: translate(-50%, -50%);z-index: 100;pointer-events: none;user-select: none;text-align: center;width: 90vw;font-family: Impact, Arial Black, Arial, sans-serif;">
        <div style="font-size:4vw; letter-spacing:0.3em; font-weight:400;">THE</div>
        <div style="font-size:12vw; font-weight:bold; letter-spacing:0.08em; margin:0.1em 0;">MEGA</div>
        <div style="font-size:4vw; letter-spacing:0.3em; font-weight:400;">EDITION</div>
      </div>
      <!-- Info area for messages -->
      <div id="mm-info"></div>
      <!-- Roll dice button -->
      <button id="mm-roll">Roll Dice</button>
      <!-- End turn and back buttons -->
      <div id="mm-bottom-buttons" style="position:fixed;right:32px;bottom:32px;z-index:2000;display:flex;flex-direction:column;gap:12px;">
        <button id="mm-end-turn" style="min-width:120px;">End Turn</button>
        <button id="mm-back" style="min-width:120px;">Back to Menu</button>
      </div>
      <!-- Property deed modal -->
      <div id="property-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.4); align-items:center; justify-content:center; z-index:1000;">
        <div id="property-modal-content" style="background:#fff; border-radius:8px; box-shadow:0 4px 32px #0008; padding:0; min-width:340px; min-height:420px; position:relative;">
          <button id="property-modal-close" style="position:absolute; top:8px; right:12px; font-size:20px; background:none; border:none; cursor:pointer;">&times;</button>
          <div id="property-modal-body"></div>
        </div>
      </div>
      <!-- Buy property modal -->
      <div id="buy-property-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.4); align-items:center; justify-content:center; z-index:3000;">
        <div style="background:#fff; border-radius:8px; box-shadow:0 4px 32px #0008; padding:32px 28px; min-width:320px; min-height:120px; position:relative; text-align:center;">
          <div id="buy-property-title" style="font-size:1.3em; font-weight:bold; margin-bottom:18px;"></div>
          <button id="buy-property-confirm" style="margin:0 12px; min-width:80px;">Buy</button>
          <button id="buy-property-cancel" style="margin:0 12px; min-width:80px;">Cancel</button>
        </div>
      </div>
  
    `;
    const boardDiv = document.getElementById("mm-board");

    // Fill grid with empty cells
    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement("div");
      cell.style.boxSizing = "border-box";
      cell.style.position = "relative";
      cell.style.display = "flex";
      cell.style.flexDirection = "column";
      cell.style.alignItems = "center";
      cell.style.justifyContent = "center";
      cell.style.overflow = "hidden";
      cell.style.width = `${cellPx}px`;
      cell.style.height = `${cellPx}px`;
      // Calculate row and col for this cell
      const row = Math.floor(i / size);
      const col = i % size;
      // Only edge cells get a border
      if (
        row === 0 || row === size - 1 ||
        col === 0 || col === size - 1
      ) {
        cell.style.border = "1px solid #000";
      } else {
        cell.style.border = "none";
        cell.style.background = "#eaffea";
      }
      boardDiv.appendChild(cell);
    }

    const positions = this.getBoardPositions(size);
    const cells = Array.from(boardDiv.children);
    this.board = this.createBoardObjects(boardData, positions, cells, size).filter(Boolean);
    this.board.forEach(space => {
      if (typeof space.populateCell === "function") {
        space.populateCell();
      }
    });

    return this.board;
  }

  getBoardPositions(size) {
    // Example: returns edge positions for a square board
    const positions = [];
    for (let i = 0; i < size; i++) positions.push({ row: 0, col: i }); // Top
    for (let i = 1; i < size; i++) positions.push({ row: i, col: size - 1 }); // Right
    for (let i = size - 2; i >= 0; i--) positions.push({ row: size - 1, col: i }); // Bottom
    for (let i = size - 2; i > 0; i--) positions.push({ row: i, col: 0 }); // Left

    const seen = new Set();
    positions.forEach((pos, idx) => {
      const key = `${pos.row},${pos.col}`;
      if (seen.has(key)) {
        console.warn(`Duplicate cell position at idx=${idx}:`, pos);
      }
      seen.add(key);
      if (pos.row < 0 || pos.row >= size || pos.col < 0 || pos.col >= size) {
        console.warn(`Out-of-bounds position at idx=${idx}:`, pos);
      }
    });

    return positions;
  };
}

module.exports = MonopolyGame;