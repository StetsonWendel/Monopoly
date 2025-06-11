// Load the board data from a JSON file
const gameBoard = require('./monopoly-board-data.json');

/**
 * Calculate the positions of each board space around the edge of a square board.
 * Returns an array of {row, col} objects for each board space.
 */
function getBoardPositions(size) {
  const positions = [];
  let row = 0, col = 0;
  // Top edge (left to right)
  for (col = 0; col < size; col++) positions.push({ row: 0, col });
  // Right edge (top to bottom)
  for (row = 1; row < size; row++) positions.push({ row, col: size - 1 });
  // Bottom edge (right to left)
  for (col = size - 2; col >= 0; col--) positions.push({ row: size - 1, col });
  // Left edge (bottom to top)
  for (row = size - 2; row > 0; row--) positions.push({ row, col: 0 });
  return positions;
}

/**
 * Render the Monopoly board and UI.
 * This function is called every time the board needs to be updated.
 * 
 * @param {HTMLElement} container - The DOM element to render the board into
 * @param {object} engine - The game engine instance (for player positions, etc.)
 * @param {Array} players - Array of player objects
 * myId - The current player's ID
 * pendingAction - Any pending modal/action to show (e.g. buy property)
 * @param {Array} board - The board state (array of squares, defaults to gameBoard)
 * onCellClick - Callback for when a property/railroad/utility cell is clicked
 */
function renderBoard(container, engine, players, board = gameBoard) {
  const size = 14; // Board is 14x14
  const cellPx = 200; // Size of each cell in pixels
  const boardPx = size * cellPx; // Total board size in pixels

  // Set up the main HTML structure for the board and UI elements
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
    //  <!-- Floating action buttons for trade and real estate -->
    // <div id="mm-fab-buttons" style="position:fixed;bottom:32px;left:50%;transform:translateX(-50%);z-index:3000;display:flex;gap:28px;">
    //   <div class="mm-fab-btn" id="mm-trade-btn" title="Trade" style="width:56px;height:56px;border-radius:50%;background:#fff;box-shadow:0 2px 8px #0003;display:flex;align-items:center;justify-content:center;font-size:2em;font-weight:bold;cursor:pointer;transition:background 0.2s;">
    //     T
    //   </div>
    //   <div class="mm-fab-btn" id="mm-realestate-btn" title="Real Estate" style="width:56px;height:56px;border-radius:50%;background:#fff;box-shadow:0 2px 8px #0003;display:flex;align-items:center;justify-content:center;font-size:2em;font-weight:bold;cursor:pointer;transition:background 0.2s;">
    //     R
    //   </div>
    // </div>
    // <!-- Real estate modal (shows all properties you own) -->
    // <div id="mm-realestate-modal" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);align-items:center;justify-content:center;z-index:4000;">
    //   <div style="background:#fff;border-radius:12px;box-shadow:0 4px 32px #0008;padding:32px 28px;min-width:340px;min-height:220px;position:relative;">
    //     <button id="mm-realestate-close" style="position:absolute;top:8px;right:12px;font-size:20px;background:none;border:none;cursor:pointer;">&times;</button>
    //     <div id="mm-realestate-list"></div>
    //   </div>
    // </div>

  const playersDiv = container.querySelector("#mm-players");


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
  board.forEach((square, idx) => {
    const { row, col } = positions[idx];
    const cellIdx = row * size + col;
    const cell = boardDiv.children[cellIdx];

    // Determine edge for color bar orientation
    let edge = "";
    if (row === 0) edge = "top";
    else if (col === size - 1) edge = "left";
    else if (row === size - 1) edge = "bottom";
    else if (col === 0) edge = "right";

    // Stick names in spaces. Used as the base by all spaces.
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
    nameDiv.style.fontSize = "1.5em";
    nameDiv.style.marginTop = "-35%";
    if (edge === "left") nameDiv.style.marginLeft = "45px";
    if (edge === "right") nameDiv.style.marginRight = "45px";
    cell.appendChild(nameDiv);

    // Initiate variable to define in switch case for our special squares.
    let imgSrc = null;
    let imgAlt = "";
    let imgWidth = "80%";
    let imgHeight = "70%";
    let imgTop = "60%";
    cell.style.background = "#f5fde8";
    switch(square.type) {
      // Get the railroad, property, and utility spaces set up. No break statements means they will fall through to the next case.
      case "railroad":
      case "property":
      case "utility":
        
        // Light yellow background properties
        cell.style.background = "#fffbe6"; 

        // Color bar
        const colorBar = document.createElement("div");
        colorBar.style.background = square.color;
        colorBar.style.border = "1px solid #000";
        if (edge === "top" || edge === "bottom") {
          colorBar.style.width = "100%";
          colorBar.style.height = "35px";
          colorBar.style.position = "absolute";
          colorBar.style.top = "0px";
        } else {
          colorBar.style.width = "40px";
          colorBar.style.height = "100%";
          colorBar.style.position = "absolute";
          colorBar.style.left = edge === "left" ? "0px" : "";
          colorBar.style.right = edge === "right" ? "0px" : "";
          colorBar.style.margin = "0";
        }
        cell.appendChild(colorBar);
      
        // Add the small price print.
        const priceDiv = document.createElement("div");
        priceDiv.textContent = `Price $${square.price}`;
        priceDiv.style.fontSize = "11px";
        priceDiv.style.color = "#444";
        priceDiv.style.fontWeight = "bold"; 
        priceDiv.style.position = "absolute";
        priceDiv.style.bottom = "4px";
        priceDiv.style.right = "6px";
        priceDiv.style.left = "6px";
        priceDiv.style.textAlign = "center";
        priceDiv.style.zIndex = "1";
        if (edge === "right") priceDiv.style.marginLeft = "24px";
        if (edge === "left") priceDiv.style.marginRight = "24px";
        cell.appendChild(priceDiv);

        // Make clickable for property/railroad/utility.
        cell.style.cursor = "pointer";
        cell.onclick = () => showDeedModal(square, players, board);
        break;

      case "chance":
        // Edit image.
        imgSrc = "games/mega-monopoly/assets/chance-question-mark.png"; 
        imgAlt = "?";
        imgWidth = "70%";
        imgHeight = "70%";
        imgTop = "60%";

        // Edit text.
        nameDiv.style.fontSize = "1.5em";
        nameDiv.style.marginTop = "5%";
        nameDiv.style.alignItems = "flex-start";
        nameDiv.style.fontFamily = "'Comic Sans MS', 'Comic Sans', cursive, sans-serif";
        nameDiv.style.fontWeight = "400";
        nameDiv.style.letterSpacing = "1px";
        break;

      // Community chest.
      case "community-chest" :
        // Edit image.
        imgSrc = "games/mega-monopoly/assets/community-chest.png"; 
        imgAlt = "?";
        imgWidth = "100%";
        imgHeight = "70%";
        imgTop = "70%";

        // Edit text.
        nameDiv.style.fontSize = "1.5em";
        nameDiv.style.marginTop = "5%";
        nameDiv.style.alignItems = "flex-start";
        nameDiv.style.fontFamily = "";
        nameDiv.style.fontWeight = "bold";
        nameDiv.style.letterSpacing = "1px";
        break;

      // Edit the special squares.
      case "special" :
        switch (square.name) {
          // case "Jail / Just Visiting":
          //   imgSrc = "games/mega-monopoly/assets/go_arrow.png";
          //   imgAlt = "Jail";
          //   break;
          case "Free Parking":
            // Edit free parking image.
            imgSrc = "games/mega-monopoly/assets/free-parking.png";
            imgAlt = "Free Parking";
            imgWidth = "60%";
            imgHeight = "60%";
            imgTop = "75%";

            // Edit text.
            nameDiv.style.marginTop = "-50%";
            nameDiv.style.fontSize = "2em";
            nameDiv.style.letterSpacing = "5px";
            break;

          case "Go To Jail":
            // Edit go to jail image.
            imgSrc = "games/mega-monopoly/assets/go-to-jail.png";
            imgAlt = "Go To Jail";
            imgWidth = "80%";
            imgHeight = "80%";
            imgTop = "80%";

            // Edit text.
            nameDiv.style.marginTop = "-55%";
            nameDiv.style.fontSize = "2.5em";
            nameDiv.style.letterSpacing = "2px";
            break;

          case "GO":
            // Light yellow background.
            cell.style.background = "#fffbe6";

            // Edit go image.
            imgSrc = "games/mega-monopoly/assets/go_arrow.png";
            imgAlt = "GO";
            imgWidth = "70%";
            imgHeight = "20%";
            imgTop = "80%";

            // Edit text.
            nameDiv.style.marginTop = "-25%";
            nameDiv.style.fontSize = "2.5em";
            nameDiv.style.letterSpacing = "1px";
            break;

          case "Auction":
            // Edit auction image.
            imgSrc = "games/mega-monopoly/assets/auction.png";
            imgAlt = "Auction";
            imgWidth = "100%";
            imgHeight = "100%";
            imgTop = "55%";

            // Edit text.
            nameDiv.style.marginTop = "-70%";
            nameDiv.style.fontSize = "2.5em";
            nameDiv.style.letterSpacing = "2px";
            break;

          case "Bus Ticket":
            // Edit bus ticket image.
            imgSrc = "games/mega-monopoly/assets/bus-ticket.png";
            imgAlt = "Bus Ticket";
            imgWidth = "100%";
            imgHeight = "110%";
            imgTop = "80%";

            // Edit text.
            nameDiv.style.marginTop = "-60%";
            nameDiv.style.fontSize = "2.5em";
            nameDiv.style.letterSpacing = "1px";
            break;

          case "Birthday Gift":
            // Edit birthday gift image.
            imgSrc = "games/mega-monopoly/assets/birthday-gift.png";
            imgAlt = "Birthday Gift";
            imgWidth = "60%";
            imgHeight = "60%";
            imgTop = "70%";

            // Edit text.
            nameDiv.style.marginTop = "-70%";
            nameDiv.style.marginLeft = "10%";
            nameDiv.style.fontSize = "1.70em";
            nameDiv.style.letterSpacing = "1px";
            break;

          default:
            // Covers the two tax spaces and jail?.
            nameDiv.style.fontSize = "2.5em";
            nameDiv.style.letterSpacing = "1px";
            nameDiv.style.marginTop = "-25%";
            break;
        } 

        break;

      case "railroad" :
        nameDiv.style.fontSize = "1.5em";
        nameDiv.style.letterSpacing = "1px";
        nameDiv.style.marginTop = "-25%";
        nameDiv.style.fontFamily = "Arial Black";
        break;

      case "utility" :
        nameDiv.style.fontSize = "1.5em";
        nameDiv.style.fontFamily = "Arial, sans-serif";
        nameDiv.style.fontWeight = "bold";
        nameDiv.style.letterSpacing = "1px";
        nameDiv.style.marginTop = "-35%";
        break;
    }

    // Input the image we edited if src is defined
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


  });


};





/**
 * Renders the fixed UI elements that are always visible on the screen,
 * such as player bank info, trade/real estate buttons, and turn/menu buttons.
 * This should be called after any change to player banks or UI state.
 * 
 * @param {HTMLElement} container - The main game container element
 * @param {Array} players - Array of player objects
 * @param {string} myId - The current player's ID
 */
function renderFixedUI(container, players, myId) {
  // Remove the old UI if it exists to avoid duplicates
  let uiDiv = container.querySelector("#mm-fixed-ui");
  if (uiDiv) uiDiv.remove();

  // Create a new div for the fixed UI
  uiDiv = document.createElement("div");
  uiDiv.id = "mm-fixed-ui";

  // Set the HTML for player banks, floating action buttons, and bottom buttons
  uiDiv.innerHTML = `
    <div id="mm-players" style="position:fixed;left:32px;bottom:32px;z-index:2000;display:flex;flex-direction:column;align-items:flex-start;gap:8px;background:rgba(255,255,255,0.85);padding:12px 18px;border-radius:10px;box-shadow:0 2px 12px #0002;min-width:160px;">
      ${players.map(p =>
        p.id === myId
          ? `<div style="color:${p.color};font-weight:bold;font-size:1.3em;margin-bottom:2px;line-height:1.2;">You: $${p.bank}</div>`
          : `<div style="color:${p.color};font-weight:normal;font-size:1em;margin-bottom:2px;line-height:1.2;">${p.username}: <span style="opacity:0.7;">$${p.bank}</span></div>`
      ).join("")}
    </div>
    <div id="mm-fab-buttons" style="position:fixed;bottom:32px;left:50%;transform:translateX(-50%);z-index:3000;display:flex;gap:28px;">
      <div class="mm-fab-btn" id="mm-trade-btn" title="Trade" style="width:56px;height:56px;border-radius:50%;background:#fff;box-shadow:0 2px 8px #0003;display:flex;align-items:center;justify-content:center;font-size:2em;font-weight:bold;cursor:pointer;">T</div>
      <div class="mm-fab-btn" id="mm-realestate-btn" title="Real Estate" style="width:56px;height:56px;border-radius:50%;background:#fff;box-shadow:0 2px 8px #0003;display:flex;align-items:center;justify-content:center;font-size:2em;font-weight:bold;cursor:pointer;">R</div>
    </div>
    <div id="mm-bottom-buttons" style="position:fixed;right:32px;bottom:32px;z-index:2000;display:flex;flex-direction:column;gap:12px;">
      <button id="mm-end-turn" style="min-width:120px;">End Turn</button>
      <button id="mm-back" style="min-width:120px;">Back to Menu</button>
    </div>
     <!-- Real estate modal (shows all properties you own) -->
    <div id="mm-realestate-modal" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);align-items:center;justify-content:center;z-index:4000;">
      <div style="background:#fff;border-radius:12px;box-shadow:0 4px 32px #0008;padding:32px 28px;min-width:340px;min-height:220px;position:relative;">
        <button id="mm-realestate-close" style="position:absolute;top:8px;right:12px;font-size:20px;background:none;border:none;cursor:pointer;">&times;</button>
        <div id="mm-realestate-list"></div>
      </div>
    </div>
  `;

  /**
   * Updates the player bank display (for example, after a transaction).
   * @param {string} myId - The current player's ID
   */
  function updatePlayerBanksUI(myId) {
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

  // Floating Action Buttons logic
  // Get references to the trade and real estate buttons and modal elements
  const tradeBtn = container.querySelector("#mm-trade-btn");
  const realestateBtn = container.querySelector("#mm-realestate-btn");
  const realestateModal = container.querySelector("#mm-realestate-modal");
  const realestateList = container.querySelector("#mm-realestate-list");
  const realestateClose = container.querySelector("#mm-realestate-close");

  // Tooltip effect for floating action buttons (visual feedback on hover)
  tradeBtn.onmouseenter = () => tradeBtn.style.background = "#e0e0ff";
  tradeBtn.onmouseleave = () => tradeBtn.style.background = "#fff";
  realestateBtn.onmouseenter = () => realestateBtn.style.background = "#ffe0e0";
  realestateBtn.onmouseleave = () => realestateBtn.style.background = "#fff";

  // Trade button click handler (currently a placeholder)
  tradeBtn.onclick = () => {
    alert("Trade feature coming soon!");
  };

  // Real Estate button click handler
  realestateBtn.onclick = () => {
    // Find all properties, railroads, and utilities owned by the current player (myId)
    const owned = board.filter(sq =>
      (sq.type === "property" || sq.type === "railroad" || sq.type === "utility") &&
      sq.owner === myId
    );
    // If the player owns nothing, show a message
    if (owned.length === 0) {
      realestateList.innerHTML = "<div style='font-size:1.2em;'>You don't own any properties yet.</div>";
    } else {
      // Otherwise, list all owned properties with color and house count
      realestateList.innerHTML = `
        <div style="font-size:1.3em;font-weight:bold;margin-bottom:12px;">Your Properties</div>
        <ul style="list-style:none;padding:0;margin:0;">
          ${owned.map(sq => `<li style="margin-bottom:8px;">
            <span style="display:inline-block;width:18px;height:18px;background:${sq.color || "#ccc"};border-radius:4px;margin-right:8px;vertical-align:middle;"></span>
            <b>${sq.name}</b>
            ${sq.type === "property" && sq.buildings ? `&nbsp;🏠x${sq.buildings}` : ""}
          </li>`).join("")}
        </ul>
      `;
    }
    // Show the real estate modal
    realestateModal.style.display = "flex";
  };

  // Handler to close the real estate modal when the close button is clicked
  realestateClose.onclick = () => {
    realestateModal.style.display = "none";
  };

  // Handler to close the real estate modal when clicking outside the modal content
  realestateModal.onclick = (e) => {
    if (e.target === realestateModal) realestateModal.style.display = "none";
  };


  //Function call
  updatePlayerBanksUI(myId);

  // Add the fixed UI to the document body so it stays on top of the board
  document.body.appendChild(uiDiv);
}

/**
 * Shows the property/railroad/utility deed popup modal.
 * Displays owner, rent, mortgage, and group links.
 * @param {object} square - The board square object being shown
 * @param {Array} players - Array of all players
 * @param {Array} board - The board data array
 */
function showDeedModal(square, players, board) {
  // property? Modal logic
  const modal = document.querySelector("#property-modal");
  const modalBody = document.querySelector("#property-modal-body");
  const modalClose = document.querySelector("#property-modal-close");
  modalClose.onclick = () => { modal.style.display = "none"; };
  modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };


  let ownerName = "Unowned";
  // Find the owner name if the property is owned
  if (square.owner !== "unowned") {
    const ownerPlayer = players.find(p => p.id === square.owner);
    ownerName = ownerPlayer && ownerPlayer.username ? ownerPlayer.username : square.owner;
  }

  // Property deed modal
  if (square.type === "property") {
    // Find all properties in the same color group
    const colorGroup = board.filter(
      s => s.type === "property" && s.color === square.color
    );
    // Create links to other properties in the group
    const colorLinks = colorGroup
      .filter(s => s.name !== square.name)
      .map(s =>
        `<a href="#" data-prop="${s.pos}" style="color:${s.color};text-decoration:underline;cursor:pointer;margin:0 4px;">${s.name}</a>`
      )
      .join(" ");
    // Fill modal with property info and group links
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
  // Railroad deed modal
  } else if (square.type === "railroad") {
    // Find all railroads for group links
    const rrGroup = board.filter(s => s.type === "railroad");
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
  // Utility deed modal
  } else if (square.type === "utility") {
    // Find all utilities for group links
    const utilGroup = board.filter(s => s.type === "utility");
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

  // Show the modal
  modal.style.display = "flex";
  // Add event listeners for modal group links (clicking another property in the group)
  Array.from(modalBody.querySelectorAll("a[data-prop]")).forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      const propIdx = parseInt(link.getAttribute("data-prop"));
      const newSquare = board.find(s => s.pos === propIdx);
      if (newSquare) showDeedModal(newSquare, players, board);
    };
  });
}

/**
 * Renders only the player tokens (pieces) on top of the board.
 * Call this after a player moves, instead of re-rendering the whole board.
 * 
 * @param {HTMLElement} container - The main game container element
 * @param {object} engine - The game engine instance (for player positions)
 * @param {Array} players - Array of player objects
 * @param {Array} board - The board data array
 * @param {number} size - The board size (default 14)
 */
function renderPlayerTokens(container, engine, players, board, size = 14) {
  const tokensLayer = container.querySelector("#player-tokens-layer");
  tokensLayer.innerHTML = ""; // Clear previous tokens
  const positions = getBoardPositions(size);
  players.forEach(p => {
    const idx = engine.playerPositions[String(p.id)];
    if (typeof idx !== "number") return;
    const { row, col } = positions[idx];
    const cellPx = 200;
    const left = col * cellPx + cellPx / 2;
    const top = row * cellPx + cellPx / 2;
    const token = document.createElement("div");
    token.title = p.username || "Player";
    token.style.position = "absolute";
    token.style.left = `${left}px`;
    token.style.top = `${top}px`;
    token.style.width = "28px";
    token.style.height = "28px";
    token.style.borderRadius = "50%";
    token.style.background = p.color || "gray";
    token.style.border = "2px solid #000";
    token.style.transform = "translate(-50%, -50%)";
    tokensLayer.appendChild(token);
  });
}

/**
 * Simulates rolling the dice for Monopoly.
 * Returns an object with two 6-sided dice and a 12-sided "mega" die.
 */
function rollDice() {
  return {
    d1: Math.ceil(Math.random() * 6),
    d2: Math.ceil(Math.random() * 6),
    mega: Math.ceil(Math.random() * 12)
  };
}

// This function creates a fresh copy of the Mega Monopoly board for a new game instance.
// It assigns a unique propertyId to each property, railroad, and utility square.
// This helps with tracking ownership and trading, and prevents accidental mutation of the base board data.
function createGameBoard() {
  let propertyIdx = 0;
  return gameBoard.map(sq => {
    const copy = { ...sq };
    // Assign a unique propertyId to all ownable spaces
    if (["property", "railroad", "utility"].includes(copy.type)) {
      copy.propertyId = propertyIdx++;
    }
    return copy;
  });
}

// Export the board renderer, position helper, and board data for use in other modules
module.exports = {
  renderBoard,
  getBoardPositions,
  renderFixedUI,
  renderPlayerTokens,
  createGameBoard,
  showDeedModal,
  gameBoard
};