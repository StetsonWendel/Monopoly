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



class MonopolyGame {
  constructor(players) {
    this.players = players;
    this.currentTurn = 0;
    this.board = this.renderBoard();
  }

  createBoardObjects(boardData, positions, cells, size) {
    // console.log("boardData length:", boardData.length, "positions length:", positions.length);
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
            cell,
            realEstateType: "property" 
          });
        case "railroad":
          return new RailroadSpace({
            pos: idx,
            name: sq.name,
            edge,
            price: sq.price,
            cell,
            realEstateType: "railroad" 
          });
        case "utility":
          return new UtilitySpace({
            pos: idx,
            name: sq.name,
            edge,
            price: sq.price,
            cell,
            realEstateType: "utility" 
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
    let megaDie = Math.ceil(Math.random() * 6)
    if (megaDie >= 0) {
      megaDie = "mrMonopoly";
    } else if (mega == 4) {
      megaDie = "busTicket";
    }

    return {
      d1: Math.ceil(Math.random() * 6),
      d2: Math.ceil(Math.random() * 6),
      mega: megaDie
    };
  }

  movePlayer(player, steps) {
    player.position = (player.position + steps) % this.board.length;
    this.renderPlayerTokens();
    return this.board[player.position];
  }

  renderBoard() {
    const size = 14;
    const cellPx = 200;
    const boardPx = size * cellPx;
    const container = document.getElementById("game-container");

    container.innerHTML = `

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
      <div id="turn-modal" style="display:none; position:fixed; left:0; top:0; width:100vw; height:100vh; background:rgba(0,0,0,0.4); align-items:center; justify-content:center; z-index:4000;">
        <div style="background:#fffbe6; border-radius:12px; box-shadow:0 4px 32px #0008; padding:32px 28px; min-width:320px; min-height:120px; position:relative; text-align:center;">
          <div id="turn-modal-title" style="font-size:1.2em; font-weight:bold; margin-bottom:18px;"></div>
          <button id="turn-modal-roll" style="margin:0 12px; min-width:80px;">Roll Dice</button>
          <button id="turn-modal-bus" style="margin:0 12px; min-width:120px; display:none;">Use Bus Ticket</button>
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

    this.renderPlayerTokens();
    return this.board;
  }

  getBoardPositions(size) {
    const positions = [];
    // Top row (left to right)
    for (let i = 0; i < size; i++) positions.push({ row: 0, col: i });
    // Right column (top to bottom, skipping top)
    for (let i = 1; i < size; i++) positions.push({ row: i, col: size - 1 });
    // Bottom row (right to left, skipping rightmost)
    for (let i = size - 2; i >= 0; i--) positions.push({ row: size - 1, col: i });
    // Left column (bottom to top, skipping bottom and top)
    for (let i = size - 2; i > 0; i--) positions.push({ row: i, col: 0 });
    return positions;
  };

  renderPlayerTokens() {
    // Remove all existing tokens
    document.querySelectorAll('.mm-player-token').forEach(el => el.remove());

    const size = 14; // Make sure this matches your board size
    const positions = this.getBoardPositions(size);
    const cells = Array.from(document.querySelectorAll('#mm-board > div'));

    this.players.forEach(player => {
        const pos = player.position;
        const boardPos = positions[pos];
        if (!boardPos) return;
        const cellIdx = boardPos.row * size + boardPos.col;
        const cell = cells[cellIdx];
        if (!cell) return;

        // Create token element
        const token = document.createElement('div');
        token.className = 'mm-player-token';
        token.title = player.username;
        token.style.width = '32px';
        token.style.height = '32px';
        token.style.borderRadius = '50%';
        token.style.background = player.color || '#444';
        token.style.border = '2px solid #fff';
        token.style.display = 'flex';
        token.style.alignItems = 'center';
        token.style.justifyContent = 'center';
        token.style.position = 'absolute';
        token.style.bottom = '6px';
        token.style.left = '6px';
        token.style.zIndex = '10';
        token.style.fontWeight = 'bold';
        token.style.color = '#fff';
        token.style.fontSize = '1.1em';
        token.innerText = player.username[0] || '?';

        cell.appendChild(token);
    });
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
}

module.exports = MonopolyGame;