const { GameEngine } = require('../game-engine');
const megaBoard = require('./mega-board.json');

// Helper: get edge positions for a 13x13 grid, starting at top-left and going clockwise
function getBoardPositions(size) {
  const positions = [];
  // Top row (left to right)
  for (let i = 0; i < size; i++) positions.push({ row: 0, col: i });
  // Right column (top to bottom, skip top)
  for (let i = 1; i < size; i++) positions.push({ row: i, col: size - 1 });
  // Bottom row (right to left, skip rightmost)
  for (let i = size - 2; i >= 0; i--) positions.push({ row: size - 1, col: i });
  // Left column (bottom to top, skip bottom and top)
  for (let i = size - 2; i > 0; i--) positions.push({ row: i, col: 0 });
  return positions;
}

function renderBoard(container, engine, players) {
  const size = 14; // 14x14 grid for Mega Monopoly
  const cellPx = 200;
  const boardPx = size * cellPx;


  container.innerHTML = `
    <div id="mm-board" style="
      display: grid;
      grid-template-columns: repeat(${size}, 1fr);
      grid-template-rows: repeat(${size}, 1fr);
      width: ${boardPx}px;
      height: ${boardPx}px;
      border: 2px solid #222;
      margin-bottom: 20px;
      background: #fff;
    "></div>
    <div id="mm-info"></div>
    <button id="mm-roll">Roll Dice</button>
    <button id="mm-end-turn">End Turn</button>
    <button id="mm-back">Back to Menu</button>

    <div id="property-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.4); align-items:center; justify-content:center; z-index:1000;">
      <div id="property-modal-content" style="background:#fff; border-radius:8px; box-shadow:0 4px 32px #0008; padding:0; min-width:340px; min-height:420px; position:relative;">
        <button id="property-modal-close" style="position:absolute; top:8px; right:12px; font-size:20px; background:none; border:none; cursor:pointer;">&times;</button>
        <div id="property-modal-body"></div>
      </div>
    </div>
  `;
  const boardDiv = container.querySelector("#mm-board");
  const infoDiv = container.querySelector("#mm-info");

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
    // Calculate row and col for this cell
    const row = Math.floor(i / size);
    const col = i % size;
    // Only edge cells get a border
    if (
      row === 0 || row === size - 1 ||
      col === 0 || col === size - 1
    ) {
      cell.style.border = "1px solid #666";
    } else {
      cell.style.border = "none";
    }
    boardDiv.appendChild(cell);
  }

  // Place board spaces around the edge
  const positions = getBoardPositions(size);
  megaBoard.forEach((square, idx) => {
    const { row, col } = positions[idx];
    const cellIdx = row * size + col;
    const cell = boardDiv.children[cellIdx];
    cell.style.background = idx === 0 ? "#ffd" : "#fff";
    cell.innerHTML = "";

    // Determine edge for color bar orientation
    let edge = "";
    if (row === 0) edge = "top";
    else if (col === size - 1) edge = "right";
    else if (row === size - 1) edge = "bottom";
    else if (col === 0) edge = "left";

    // Property, Railroad, Utility cell styling
    if (
      (square.type === "property" && square.color) ||
      (square.type === "railroad" && square.color) ||
      (square.type === "utility" && square.color)
    ) {
      // Color bar
      const colorBar = document.createElement("div");
      colorBar.style.background = square.color;
      if (edge === "top" || edge === "bottom") {
        colorBar.style.width = "100%";
        colorBar.style.height = "44px";
        colorBar.style.margin = "0 auto";
        colorBar.style.alignSelf = "center";
      } else {
        colorBar.style.width = "44px";
        colorBar.style.height = "100%";
        colorBar.style.position = "absolute";
        colorBar.style.left = edge === "right" ? "0px" : "";
        colorBar.style.right = edge === "left" ? "0px" : "";
        colorBar.style.margin = "0";
      }
      cell.appendChild(colorBar);
    }

    // Name
    const nameDiv = document.createElement("div");
    nameDiv.textContent = square.name;
    nameDiv.style.textAlign = "center";
    nameDiv.style.flex = "1";
    nameDiv.style.display = "flex";
    nameDiv.style.alignItems = "center";
    nameDiv.style.justifyContent = "center";
    nameDiv.style.width = "90%";
    // nameDiv.style.margin = "0 auto";
    nameDiv.style.fontWeight = "bold";
    nameDiv.style.zIndex = "1";
    // Offset for left/right edge
    nameDiv.style.marginBottom = "25%";
    if (edge === "right") nameDiv.style.marginLeft = "24px";
    if (edge === "left") nameDiv.style.marginRight = "24px";
    cell.appendChild(nameDiv);

    // Only show price for property, railroad, or utility with a price
    if (
      (["property", "railroad", "utility"].includes(square.type)) &&
      typeof square.price !== "undefined"
    ) {
      const priceDiv = document.createElement("div");
      priceDiv.textContent = `Price $${square.price}`;
      priceDiv.style.fontSize = "11px";
      priceDiv.style.color = "#555";
      priceDiv.style.position = "absolute";
      priceDiv.style.bottom = "4px";
      priceDiv.style.right = "6px";
      priceDiv.style.left = "6px";
      priceDiv.style.textAlign = "center";
      priceDiv.style.zIndex = "1";
      // Offset for left/right edge
      if (edge === "right") priceDiv.style.marginLeft = "24px";
      if (edge === "left") priceDiv.style.marginRight = "24px";
      cell.appendChild(priceDiv);
    }

    // Clickable for property/railroad/utility
    if (["property", "railroad", "utility"].includes(square.type)) {
      cell.style.cursor = "pointer";
      cell.onclick = () => showDeedModal(square);
    }

    // Player tokens
    players.forEach(p => {
      if (engine.playerPositions[p.id] === idx) {
        const token = document.createElement("div");
        token.title = p.username || "Player";
        token.style.width = "20px";
        token.style.height = "20px";
        token.style.borderRadius = "50%";
        token.style.background = p.color || "gray";
        token.style.margin = "2px";
        token.style.border = "2px solid #222";
        token.style.position = "absolute";
        token.style.left = "50%";
        token.style.top = "50%";
        token.style.transform = "translate(-50%, -50%)";
        cell.appendChild(token);
      }
    });
  });

  // Roll dice and end turn handlers (demo)
  container.querySelector("#mm-roll").onclick = () => {
    const player = players[engine.currentTurn];
    const roll = engine.rollDice();
    const total = roll.d1 + roll.d2;
    const newPos = engine.movePlayer(player.id, total);
    infoDiv.innerHTML = `${player.username} rolled ${roll.d1} + ${roll.d2} (Mega: ${roll.mega}) and moved to ${megaBoard[newPos].name}`;
    renderBoard(container, engine, players); // re-render tokens
  };
  container.querySelector("#mm-end-turn").onclick = () => {
    engine.currentTurn = (engine.currentTurn + 1) % players.length;
    infoDiv.innerHTML = `Turn: ${players[engine.currentTurn].username}`;
  };
  container.querySelector("#mm-back").onclick = () => {
    window.location.reload(); // or call your showMenu(mainMenu)
  };

  // Modal logic
  const modal = container.querySelector("#property-modal");
  const modalBody = container.querySelector("#property-modal-body");
  const modalClose = container.querySelector("#property-modal-close");
  modalClose.onclick = () => { modal.style.display = "none"; };
  modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

  // Add this helper inside renderBoard, before megaBoard.forEach:
  function showDeedModal(square) {
    let ownerName = "Bank";
    if (square.owner && square.owner !== "bank") {
      const ownerPlayer = players.find(p => p.id === square.owner);
      ownerName = ownerPlayer ? ownerPlayer.username : square.owner;
    }

    if (square.type === "property") {
      const colorGroup = megaBoard.filter(
        s => s.type === "property" && s.color === square.color
      );
      const colorLinks = colorGroup
        .filter(s => s.name !== square.name)
        .map(s =>
          `<a href="#" data-prop="${s.pos}" style="color:${s.color};text-decoration:underline;cursor:pointer;margin:0 4px;">${s.name}</a>`
        )
        .join(" ");
      modalBody.innerHTML = `
        <div style="font-family:monospace,Arial,sans-serif; width:340px; min-height:420px; background:#fff; border-radius:8px; overflow:hidden;">
          <div style="background:${square.color}; color:#111; padding:16px 0 8px 0; text-align:center; font-weight:bold; font-size:22px; letter-spacing:1px;">
            <div style="font-size:12px; font-weight:normal; letter-spacing:0.5px; margin-bottom:2px;">TITLE&nbsp;&nbsp;DEED</div>
            <div style="font-size:20px; font-weight:bold; text-transform:uppercase;">${square.name}</div>
          </div>
          <div style="padding:18px 24px 8px 24px; color:#222;">
            <div style="font-size:15px; margin-bottom:8px;"><b>Owner:</b> ${ownerName}</div>
            <div style="font-size:17px; margin-bottom:8px;">Rent <b>$${square.rent[0]}</b>.</div>
            <div style="font-size:15px; margin-bottom:2px;">With 1 House <span style="float:right;">$${square.rent[1]}</span></div>
            <div style="font-size:15px; margin-bottom:2px;">With 2 Houses <span style="float:right;">$${square.rent[2]}</span></div>
            <div style="font-size:15px; margin-bottom:2px;">With 3 Houses <span style="float:right;">$${square.rent[3]}</span></div>
            <div style="font-size:15px; margin-bottom:2px;">With 4 Houses <span style="float:right;">$${square.rent[4]}</span></div>
            <div style="font-size:15px; margin-bottom:8px;">With HOTEL <span style="float:right;">$${square.rent[5]}</span></div>
            ${square.rent[6] !== undefined ? `<div style="font-size:15px; margin-bottom:8px;">With SKYSCRAPER <span style="float:right;">$${square.rent[6]}</span></div>` : ""}
            <div style="font-size:14px; margin-bottom:4px;">Mortgage Value <b>$${square.mortgage}</b>.</div>
            <div style="font-size:14px; margin-bottom:4px;">Build cost <b>$${square.buildingCost}</b> each.</div>
            <div style="font-size:11px; color:#444; margin-top:12px; text-align:center;">
              If a player owns <b>ALL BUT ONE</b> the lots of any color-group, the rent is <b>DOUBLED</b> on unimproved lots in that group.<br>
              If a player owns <b>ALL</b> the lots of any color-group, the rent is <b>TRIPLED</b> on unimproved lots in that group.
            </div>
            ${colorLinks
              ? `<div style="margin-top:18px; text-align:center; font-size:13px;">
                  <b>In group:</b> ${colorLinks}
                </div>`
              : ""}
          </div>
        </div>
      `;
    } else if (square.type === "railroad") {
      const rrGroup = megaBoard.filter(s => s.type === "railroad");
      const rrLinks = rrGroup
        .filter(s => s.name !== square.name)
        .map(s =>
          `<a href="#" data-prop="${s.pos}" style="color:#222;text-decoration:underline;cursor:pointer;margin:0 4px;">${s.name}</a>`
        )
        .join(" ");
      modalBody.innerHTML = `
        <div style="font-family:monospace,Arial,sans-serif; width:340px; min-height:220px; background:#fff; border-radius:8px; overflow:hidden;">
          <div style="background:#222; color:#fff; padding:16px 0 8px 0; text-align:center; font-weight:bold; font-size:22px; letter-spacing:1px;">
            <div style="font-size:12px; font-weight:normal; letter-spacing:0.5px; margin-bottom:2px;">TITLE&nbsp;&nbsp;DEED</div>
            <div style="font-size:20px; font-weight:bold; text-transform:uppercase;">${square.name}</div>
          </div>
          <div style="padding:18px 24px 8px 24px; color:#222;">
            <div style="font-size:15px; margin-bottom:8px;"><b>Owner:</b> ${ownerName}</div>
            <div style="font-size:17px; margin-bottom:8px;">Rent <b>$${square.rent[0]}</b>.</div>
            <div style="font-size:15px; margin-bottom:2px;">If 2 Railroads, <span style="float:right;">$${square.rent[1]}</span></div>
            <div style="font-size:15px; margin-bottom:2px;">If 3 Railroads, <span style="float:right;">$${square.rent[2]}</span></div>
            <div style="font-size:15px; margin-bottom:8px;">If 4 Railroads, <span style="float:right;">$${square.rent[3]}</span></div>
            <div style="font-size:14px; margin-bottom:4px;">Mortgage Value <b>$${square.mortgage || ""}</b>.</div>
            <div style="font-size:11px; color:#444; margin-top:12px; text-align:center;">
            </div>
            ${rrLinks
              ? `<div style="margin-top:18px; text-align:center; font-size:13px;">
                  <b>Other railroads:</b> ${rrLinks}
                </div>`
              : ""}
          </div>
        </div>
      `;
    } else if (square.type === "utility") {
      const utilGroup = megaBoard.filter(s => s.type === "utility");
      const utilLinks = utilGroup
        .filter(s => s.name !== square.name)
        .map(s =>
          `<a href="#" data-prop="${s.pos}" style="color:#222;text-decoration:underline;cursor:pointer;margin:0 4px;">${s.name}</a>`
        )
        .join(" ");
      modalBody.innerHTML = `
        <div style="font-family:monospace,Arial,sans-serif; width:340px; min-height:220px; background:#fff; border-radius:8px; overflow:hidden;">
          <div style="background:#eee; color:#111; padding:16px 0 8px 0; text-align:center; font-weight:bold; font-size:22px; letter-spacing:1px;">
            <div style="font-size:12px; font-weight:normal; letter-spacing:0.5px; margin-bottom:2px;">TITLE&nbsp;&nbsp;DEED</div>
            <div style="font-size:20px; font-weight:bold; text-transform:uppercase;">${square.name}</div>
          </div>
          <div style="padding:18px 24px 8px 24px; color:#222;">
            <div style="font-size:15px; margin-bottom:8px;"><b>Owner:</b> ${ownerName}</div>
            <div style="font-size:15px; margin-bottom:2px;">If one Utility is owned, rent is 4x dice roll.</div>
            <div style="font-size:15px; margin-bottom:8px;">If both Utilities are owned, rent is 10x dice roll.</div>
            <div style="font-size:14px; margin-bottom:4px;">Mortgage Value <b>$${square.mortgage || ""}</b>.</div>
            <div style="font-size:11px; color:#444; margin-top:12px; text-align:center;">
              Utilities cannot be improved.
            </div>
            ${utilLinks
              ? `<div style="margin-top:18px; text-align:center; font-size:13px;">
                  <b>Other utilities:</b> ${utilLinks}
                </div>`
              : ""}
          </div>
        </div>
      `;
    }
    modal.style.display = "flex";
    // Add event listeners for modal links
    Array.from(modalBody.querySelectorAll("a[data-prop]")).forEach(link => {
      link.onclick = (e) => {
        e.preventDefault();
        const propIdx = parseInt(link.getAttribute("data-prop"));
        const newSquare = megaBoard.find(s => s.pos === propIdx);
        if (newSquare) showDeedModal(newSquare);
      };
    });
  }

  // In your megaBoard.forEach, replace the cell.onclick assignment with:
  // cell.onclick = () => showDeedModal(square);
}



module.exports = {
  key: "mega-monopoly",
  name: "Mega Monopoly",

  startSinglePlayer(container, players) {
    const engine = new GameEngine(megaBoard, players);
    renderBoard(container, engine, players);
  },

  startMultiplayerGame(container, players, socket, gameCode, myId) {
    const engine = new GameEngine(megaBoard, players);
    renderBoard(container, engine, players);
    // Multiplayer turn sync logic would go here
  }
};