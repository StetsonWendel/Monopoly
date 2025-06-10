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

function rollDice() {
  return {
    d1: Math.ceil(Math.random() * 6),
    d2: Math.ceil(Math.random() * 6),
    mega: Math.ceil(Math.random() * 12)
  };
}

function movePlayer(playerPositions, playerId, spaces, boardLength) {
  playerPositions[playerId] = (playerPositions[playerId] + spaces) % boardLength;
  return playerPositions[playerId];
}

function renderBoard(container, engine, players, myId) {
  const size = 14; // 14x14 grid for Mega Monopoly
  const cellPx = 200;
  const boardPx = size * cellPx;


  container.innerHTML = `
    <div id="mm-players" style="
      position:fixed;
      left:32px;
      bottom:32px;
      z-index:2000;
      display:flex;
      flex-direction:column;
      align-items:flex-start;
      gap:8px;
      background:rgba(255,255,255,0.85);
      padding:12px 18px;
      border-radius:10px;
      box-shadow:0 2px 12px #0002;
      min-width:160px;
    "></div>
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
    <div id="mm-board-title" style="
      position: absolute;
      left: 100%;
      top: 165%;
      transform: translate(-50%, -50%);
      z-index: 100;
      pointer-events: none;
      user-select: none;
      text-align: center;
      width: 90vw;
      font-family: Impact, Arial Black, Arial, sans-serif;
    ">
      <div style="font-size:4vw; letter-spacing:0.3em; font-weight:400;">THE</div>
      <div style="font-size:12vw; font-weight:bold; letter-spacing:0.08em; margin:0.1em 0;">MEGA</div>
      <div style="font-size:4vw; letter-spacing:0.3em; font-weight:400;">EDITION</div>
    </div>
    <div id="mm-info"></div>
    <button id="mm-roll">Roll Dice</button>
    <div id="mm-bottom-buttons" style="
      position:fixed;
      right:32px;
      bottom:32px;
      z-index:2000;
      display:flex;
      flex-direction:column;
      gap:12px;
    ">
      <button id="mm-end-turn" style="min-width:120px;">End Turn</button>
      <button id="mm-back" style="min-width:120px;">Back to Menu</button>
    </div>
    <div id="property-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.4); align-items:center; justify-content:center; z-index:1000;">
      <div id="property-modal-content" style="background:#fff; border-radius:8px; box-shadow:0 4px 32px #0008; padding:0; min-width:340px; min-height:420px; position:relative;">
        <button id="property-modal-close" style="position:absolute; top:8px; right:12px; font-size:20px; background:none; border:none; cursor:pointer;">&times;</button>
        <div id="property-modal-body"></div>
      </div>
    </div>
  `;
  
  const playersDiv = container.querySelector("#mm-players");
  function updatePlayerBanks(myId) {
    playersDiv.innerHTML = players.map(p =>
      p.id === myId
        ? `<div style="
            color:${p.color};
            font-weight:bold;
            font-size:1.3em;
            margin-bottom:2px;
            line-height:1.2;
          ">
            You: $${p.bank} <span style="opacity:0.85;font-weight:bold;font-size:1em;"</span>
        </div>`
        : `<div style="
            color:${p.color};
            font-weight:normal;
            font-size:1em;
            margin-bottom:2px;
            line-height:1.2;
          ">
            ${p.username}: <span style="opacity:0.7;">$${p.bank}</span>
        </div>`
    ).join("");
  }
  updatePlayerBanks(myId);


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
      cell.style.border = "1px solid #000";
    } else {
      cell.style.border = "none";
      cell.style.background = "#eaffea"; // light green for center cells
    }
    boardDiv.appendChild(cell);
  }

  // Place board spaces around the edge
  const positions = getBoardPositions(size);
  megaBoard.forEach((square, idx) => {
    const { row, col } = positions[idx];
    const cellIdx = row * size + col;
    const cell = boardDiv.children[cellIdx];
    if (square.type === "property" || square.type === "railroad" || square.type === "utility") {
      cell.style.background = "#fffbe6"; // light yellow for properties
    } else if (idx === 0) {
      cell.style.background = "#fffbe6"; // GO space
    } else {
      cell.style.background = "#f5fde8";
    }
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
      colorBar.style.border = "1px solid #000"; // <-- Add this line for a black border
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
    nameDiv.style.fontWeight = "bold";
    nameDiv.style.zIndex = "1";

    // Move Chance and Community Chest titles up
    if (square.type === "special" && square.name === "Free Parking") {
      nameDiv.style.marginTop = "-50%";
      nameDiv.style.fontSize = "2em";
      nameDiv.style.letterSpacing = "5px";
    } else if (square.type === "special" && square.name === "Auction") {
      nameDiv.style.marginTop = "-70%";
      nameDiv.style.fontSize = "2.5em";
      nameDiv.style.letterSpacing = "2px";
    } else if (square.type === "special" && square.name === "Bus Ticket") {
      nameDiv.style.marginTop = "-60%";
      nameDiv.style.fontSize = "2.5em";
      nameDiv.style.letterSpacing = "1px";
    } else if (square.type === "special" && square.name === "Go To Jail") {
      nameDiv.style.marginTop = "-55%";
      nameDiv.style.fontSize = "2.5em";
      nameDiv.style.letterSpacing = "2px";
    } else if (square.type === "special" && square.name === "Birthday Gift") {
      nameDiv.style.marginTop = "-70%";
      nameDiv.style.marginLeft = "10%";
      nameDiv.style.fontSize = "1.70em";
      nameDiv.style.letterSpacing = "1px";
    } else if (square.type === "chance") {
      nameDiv.style.fontSize = "1.5em";
      nameDiv.style.marginTop = "5%";
      nameDiv.style.marginBottom = "auto";
      nameDiv.style.alignItems = "flex-start";
      nameDiv.style.fontFamily = "'Comic Sans MS', 'Comic Sans', cursive, sans-serif";
      nameDiv.style.fontWeight = "400";
      nameDiv.style.letterSpacing = "1px";
    } else if (square.type === "community-chest") {
      nameDiv.style.fontSize = "1.5em";
      nameDiv.style.marginTop = "5%";
      nameDiv.style.marginBottom = "auto";
      nameDiv.style.alignItems = "flex-start";
      nameDiv.style.fontFamily = "";
      nameDiv.style.fontWeight = "bold";
      nameDiv.style.letterSpacing = "1px";
    } else if (square.type === "special") {
      nameDiv.style.fontSize = "2.5em";
      nameDiv.style.letterSpacing = "1px";
      nameDiv.style.marginBottom = "25%";
    } else if (square.type === "railroad") {
      nameDiv.style.fontSize = "1.5em";
      nameDiv.style.fontWeight = "bold"; // Bold railroad titles
      nameDiv.style.letterSpacing = "1px";
      nameDiv.style.marginBottom = "25%";
    } else if (square.type === "utility") {
      nameDiv.style.fontSize = "1.5em";
      nameDiv.style.fontFamily = "Arial, sans-serif";
      nameDiv.style.fontWeight = "bold"; // Make utility titles bold
      nameDiv.style.letterSpacing = "1px";
      nameDiv.style.marginBottom = "25%";
    } else {
      nameDiv.style.fontSize = "1.5em";
      nameDiv.style.marginBottom = "25%";
    }

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
      priceDiv.style.fontWeight = "bold"; // Bold the price
      priceDiv.style.position = "absolute";
      priceDiv.style.bottom = "4px";
      priceDiv.style.right = "6px";
      priceDiv.style.left = "6px";
      priceDiv.style.textAlign = "center";
      priceDiv.style.zIndex = "1";
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
        token.style.border = "2px solid #000";
        token.style.position = "absolute";
        token.style.left = "50%";
        token.style.top = "60%"; // Move down from center (50%) to 60%
        token.style.transform = "translate(-50%, -50%)";
        cell.appendChild(token);
      }
    });

    // Chance card indicator
    if (square.type === "chance") {
      const img = document.createElement("img");
      img.src = "games/mega-monopoly/assets/chance-question-mark.png"; // Adjust path as needed
      img.alt = "?";
      img.style.width = "70%";
      img.style.height = "70%";
      img.style.position = "absolute";
      img.style.left = "50%";
      img.style.top = "60%";
      img.style.transform = "translate(-50%, -50%)";
      img.style.pointerEvents = "none"; // So cell remains clickable
      cell.appendChild(img);
    }
    // Community chest card indicator
    if (square.type === "community-chest") {
      const img = document.createElement("img");
      img.src = "games/mega-monopoly/assets/community-chest.png"; // Adjust path as needed
      img.alt = "?";
      img.style.width = "100%";
      img.style.height = "70%";
      img.style.position = "absolute";
      img.style.left = "50%";
      img.style.top = "65%";
      img.style.transform = "translate(-50%, -50%)";
      img.style.pointerEvents = "none"; // So cell remains clickable
      cell.appendChild(img);
    }

    // After handling player tokens and before the end of megaBoard.forEach:
    if (square.type === "special") {
      let imgSrc = null;
      let imgAlt = "";
      let imgWidth = "80%";
      let imgHeight = "70%";
      let imgTop = "60%";
      switch (square.name) {
        case "Free Parking":
          imgSrc = "games/mega-monopoly/assets/free-parking.png";
          imgAlt = "Free Parking";
          imgWidth = "60%";
          imgHeight = "60%";
          imgTop = "75%";
          break;
        case "Go To Jail":
          imgSrc = "games/mega-monopoly/assets/go-to-jail.png";
          imgAlt = "Go To Jail";
          imgWidth = "80%";
          imgHeight = "80%";
          imgTop = "80%";
          break;
        // case "Jail / Just Visiting":
        //   imgSrc = "games/mega-monopoly/assets/go_arrow.png";
        //   imgAlt = "Jail";
        //   break;
        case "GO":
          imgSrc = "games/mega-monopoly/assets/go_arrow.png";
          imgAlt = "GO";
          imgWidth = "70%";
          imgHeight = "20%";
          imgTop = "80%";
          break;
        case "Auction":
          imgSrc = "games/mega-monopoly/assets/auction.png";
          imgAlt = "Auction";
          imgWidth = "100%";
          imgHeight = "100%";
          imgTop = "55%";
          break;
        case "Bus Ticket":
          imgSrc = "games/mega-monopoly/assets/bus-ticket.png";
          imgAlt = "Bus Ticket";
          imgWidth = "100%";
          imgHeight = "110%";
          imgTop = "80%";
          break;
        case "Birthday Gift":
          imgSrc = "games/mega-monopoly/assets/birthday-gift.png";
          imgAlt = "Birthday Gift";
          imgWidth = "60%";
          imgHeight = "60%";
          imgTop = "70%";
          break;
        // Add more cases as you add more special spaces
      }
      if (imgSrc) {
        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = imgAlt;
        img.style.width = imgWidth;
        img.style.height = imgHeight;
        img.style.position = "absolute";
        img.style.left = "50%";
        img.style.top = imgTop;
        img.style.transform = "translate(-50%, -50%)";
        img.style.pointerEvents = "none";
        cell.appendChild(img);
      }
    }
  });

  // Roll dice and end turn handlers (demo)
  container.querySelector("#mm-roll").onclick = () => {
    const player = players[engine.currentTurn];
    const roll = rollDice();
    const total = roll.d1 + roll.d2;
    const newPos = movePlayer(engine.playerPositions, player.id, total, megaBoard.length);
    infoDiv.innerHTML = `${player.username} rolled ${roll.d1} + ${roll.d2} (Mega: ${roll.mega}) and moved to ${megaBoard[newPos].name}`;
    renderBoard(container, engine, players, myId); // re-render tokens
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

function adjustBank(players, playerId, amount) {
  const player = players.find(p => p.id === playerId);
  if (player) player.bank += amount;
}

module.exports = {
  key: "mega-monopoly",
  name: "Mega Monopoly",

  startSinglePlayer(container, players) {
    players.forEach(p => {
      if (typeof p.bank !== "number") p.bank = 1500;
    });
    const engine = new GameEngine(megaBoard, players);
    // Initialize player positions if not present
    if (!engine.playerPositions) {
      engine.playerPositions = {};
      players.forEach((p, i) => {
        engine.playerPositions[p.id] = 0; // Start at GO
      });
    }
    renderBoard(container, engine, players);
  },
  startMultiplayerGame(container, players, socket, gameCode, myId) {
    players.forEach(p => {
      if (typeof p.bank !== "number") p.bank = 1500;
    });
    const engine = new GameEngine(megaBoard, players);
    if (!engine.playerPositions) {
      engine.playerPositions = {};
      players.forEach((p, i) => {
        engine.playerPositions[p.id] = 0;
      });
    }
    renderBoard(container, engine, players, myId); // <-- pass myId here!
    // Multiplayer turn sync logic would go here
  }
};