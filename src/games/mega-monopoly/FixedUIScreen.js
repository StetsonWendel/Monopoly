class FixedUIScreen {
    /**
     * @param {HTMLElement} container - The main game container element
     * @param {Object} callbacks - { onEndTurn, onQuit, onTrade, onSave, onViewRealEstate }
     */
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.render();
        this.attachHandlers();
        this.endTurnButton = document.getElementById('end-turn-btn'); // Make sure this ID matches your HTML
    }

    render() {
        // Remove old UI if it exists
        let uiDiv = document.getElementById("mm-fixed-ui");
        if (uiDiv) uiDiv.remove();

        // Add styles for circle buttons and tooltips
        if (!document.getElementById("mm-fixed-ui-style")) {
            const style = document.createElement("style");
            style.id = "mm-fixed-ui-style";
            style.textContent = `
    #mm-fixed-ui {
        position: fixed;
        left: 50%;
        bottom: 32px;
        transform: translateX(-50%);
        z-index: 2000;
        display: flex;
        flex-direction: row;
        gap: 24px;
    }
    .mm-circle-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: 2px solid #3e2412;
        background: linear-gradient(145deg, #5a3a1a 0%, #2d1808 100%);
        color: #fff;
        font-size: 2rem;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: relative;
        transition: background 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 12px #0007, 0 2px 0 #2d1808 inset, 0 -2px 8px #7a4f1d inset;
        outline: none;
    }
    .mm-circle-btn:hover {
        background: linear-gradient(145deg, #2d1808 0%, #5a3a1a 100%);
        box-shadow: 0 2px 6px #000a, 0 1px 0 #2d1808 inset, 0 -1px 4px #7a4f1d inset;
    }
    .mm-circle-btn:active {
        background: linear-gradient(145deg, #1a0d04 0%, #5a3a1a 100%);
        box-shadow: 0 1px 2px #000c inset;
    }
    .mm-tooltip {
        visibility: hidden;
        opacity: 0;
        width: max-content;
        background: #222;
        color: #fff;
        text-align: center;
        border-radius: 6px;
        padding: 6px 14px;
        position: absolute;
        left: 50%;
        bottom: 70px;
        transform: translateX(-50%);
        z-index: 10;
        font-size: 1rem;
        pointer-events: none;
        transition: opacity 0.2s;
        white-space: nowrap;
    }
    .mm-circle-btn:hover .mm-tooltip {
        visibility: visible;
        opacity: 1;
    }
`;
            document.head.appendChild(style);
        }

        uiDiv = document.createElement("div");
        uiDiv.id = "mm-fixed-ui";

        // Button definitions: [id, first letter, tooltip]
        const btns = [
            ["mm-end-turn", "E", "End Turn"],
            ["mm-trade", "T", "Trade"],
            ["mm-view-realestate", "V", "View/Develop Real Estate"],
            ["mm-save", "S", "Save Game"],
            ["mm-back", "Q", "Quit Game"]
        ];

        uiDiv.innerHTML = btns.map(
            ([id, letter, tooltip]) => `
                <button id="${id}" class="mm-circle-btn" title="${tooltip}">
                    ${letter}
                    <span class="mm-tooltip">${tooltip}</span>
                </button>
            `
        ).join("");

        document.body.appendChild(uiDiv);

        // Add or update player info panel (bottom left)
        let infoDiv = document.getElementById("mm-player-info");
        if (!infoDiv) {
            infoDiv = document.createElement("div");
            infoDiv.id = "mm-player-info";
            infoDiv.style.position = "fixed";
            infoDiv.style.left = "32px";
            infoDiv.style.bottom = "32px";
            infoDiv.style.zIndex = "2000";
            infoDiv.style.background = "#fffbeed0";
            infoDiv.style.border = "2px solid #7a4f1d";
            infoDiv.style.borderRadius = "12px";
            infoDiv.style.padding = "16px 20px";
            infoDiv.style.minWidth = "180px";
            infoDiv.style.fontFamily = "sans-serif";
            infoDiv.style.boxShadow = "0 2px 12px #0002";
            document.body.appendChild(infoDiv);
        }
        infoDiv.innerHTML = ""; // Will be filled by updatePlayerInfo

        // Add or update chat panel (bottom right)
        let chatDiv = document.getElementById("mm-chat");
        if (!chatDiv) {
            chatDiv = document.createElement("div");
            chatDiv.id = "mm-chat";
            chatDiv.style.position = "fixed";
            chatDiv.style.right = "12px"; // Move closer to the edge
            chatDiv.style.bottom = "12px"; // Move closer to the edge
            chatDiv.style.zIndex = "2000";
            chatDiv.style.background = "#fffbeed0";
            chatDiv.style.border = "2px solid #7a4f1d";
            chatDiv.style.borderRadius = "10px";
            chatDiv.style.padding = "10px 12px";
            chatDiv.style.minWidth = "160px";
            chatDiv.style.maxWidth = "220px";
            chatDiv.style.maxHeight = "140px";
            chatDiv.style.overflowY = "auto";
            chatDiv.style.fontFamily = "sans-serif";
            chatDiv.style.fontSize = "0.98em";
            chatDiv.style.boxShadow = "0 2px 8px #0002";
            chatDiv.innerHTML = `<div id="mm-chat-messages"></div>`;
            document.body.appendChild(chatDiv);
        }
    }

    attachHandlers() {
        document.getElementById("mm-end-turn").onclick = () => this.callbacks.onEndTurn && this.callbacks.onEndTurn();
        document.getElementById("mm-back").onclick = () => this.callbacks.onQuit && this.callbacks.onQuit();
        document.getElementById("mm-trade").onclick = () => this.callbacks.onTrade && this.callbacks.onTrade();
        document.getElementById("mm-save").onclick = () => this.callbacks.onSave && this.callbacks.onSave();
        document.getElementById("mm-view-realestate").onclick = () => this.callbacks.onViewRealEstate && this.callbacks.onViewRealEstate();
    }

    updatePlayerInfo(players, whosTurn) {
        const infoDiv = document.getElementById("mm-player-info");
        if (!infoDiv) return;
        infoDiv.innerHTML = players.map((p, i) =>
            `<div style="margin-bottom:6px;">
                <span style="font-weight:${i === whosTurn ? "bold" : "normal"}; color:${i === whosTurn ? "#7a4f1d" : "#222"};">
                    ${p.username}
                </span>
                <span style="float:right;">$${p.bank}</span>
            </div>`
        ).join("");
    }

    enableEndTurnButton(enabled) {
        const endTurnBtn = document.getElementById("end-turn-btn");
        if (endTurnBtn) {
            endTurnBtn.disabled = !enabled;
            endTurnBtn.style.opacity = enabled ? "1" : "0.5";
            endTurnBtn.style.cursor = enabled ? "pointer" : "not-allowed";
        }
    }

    updateChatMessage(message) {
        const chatMessages = document.getElementById("mm-chat-messages");
        if (!chatMessages) return;
        // Add new message to the bottom
        const msgDiv = document.createElement("div");
        msgDiv.style.marginBottom = "6px";
        msgDiv.textContent = message;
        chatMessages.appendChild(msgDiv);
        // Scroll to bottom (use setTimeout to ensure DOM update)
        requestAnimationFrame(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    /**
     * Shows the real estate list modal.
     * @param {Player} player - The current player.
     * @param {BoardSpace[]} board - The game board.
     * @param {Object} actionHandlers - Callbacks for actions.
     * @param {Function} actionHandlers.onDevelop - (property) => void
     * @param {Function} actionHandlers.onUndevelop - (property) => void
     * @param {Function} actionHandlers.onMortgage - (property) => void
     * @param {Function} actionHandlers.onUnmortgage - (property) => void
     */
    showRealEstateList(player, board, actionHandlers = {}, logic = null) {
        const properties = [
            ...(player.properties || []),
            ...(player.railroads || []),
            ...(player.utilities || [])
        ];

        const groups = {};
        properties.forEach(prop => {
            const group = prop.colorGroup || prop.realEstateType || "Other";
            if (!groups[group]) groups[group] = [];
            groups[group].push(prop);
        });

        let oldModal = document.getElementById("realestate-modal");
        if (oldModal) oldModal.remove();

        const modal = document.createElement("div");
        // ... (modal styling) ...
        modal.id = "realestate-modal";
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
        // ... (box styling) ...
        box.style.background = "#fff";
        box.style.padding = "24px";
        box.style.borderRadius = "12px";
        box.style.maxWidth = "500px";
        box.style.boxShadow = "0 2px 12px #0003";
        box.style.maxHeight = "80vh";
        box.style.overflowY = "auto";
        box.style.position = "relative"; // For absolute positioning of the X


        box.innerHTML += `<h3 style="margin-top:0;">Your Properties</h3>`;

        let mode = "develop";
        const toggleBtn = document.createElement("button");
        // ... (toggleBtn styling and logic) ...
        toggleBtn.textContent = "Switch to Mortgage/Undevelop";
        toggleBtn.style.position = "absolute";
        toggleBtn.style.top = "10px";
        toggleBtn.style.left = "16px";
        toggleBtn.style.background = "#eee";
        toggleBtn.style.border = "1px solid #aaa";
        toggleBtn.style.borderRadius = "6px";
        toggleBtn.style.fontSize = "0.95em";
        toggleBtn.style.cursor = "pointer";
        toggleBtn.onclick = () => {
            mode = mode === "develop" ? "mortgage" : "develop";
            toggleBtn.textContent = mode === "develop" ? "Switch to Mortgage/Undevelop" : "Switch to Develop";
            renderPropertyList();
        };
        box.appendChild(toggleBtn);


        const xBtn = document.createElement("button");
        // ... (xBtn styling and logic) ...
        xBtn.textContent = "×";
        xBtn.style.position = "absolute";
        xBtn.style.top = "10px";
        xBtn.style.right = "16px";
        xBtn.style.background = "transparent";
        xBtn.style.border = "none";
        xBtn.style.fontSize = "1.6em";
        xBtn.style.cursor = "pointer";
        xBtn.onclick = () => document.body.removeChild(modal);
        box.appendChild(xBtn);


        const groupsContainer = document.createElement("div");
        box.appendChild(groupsContainer);

        function renderPropertyList() {
            groupsContainer.innerHTML = "";
            Object.keys(groups).forEach(group => {
                const groupDiv = document.createElement("div");
                // ... (groupDiv styling) ...
                groupDiv.style.marginBottom = "18px";
                groupDiv.innerHTML = `<div style="font-weight:bold; margin-bottom:4px;">${group.replace(/\b\w/g, c => c.toUpperCase())}</div>`;


                groups[group].forEach(prop => {
                    const row = document.createElement("div");
                    // ... (row styling) ...
                    row.style.display = "flex";
                    row.style.alignItems = "center";
                    row.style.marginBottom = "6px";
                    row.innerHTML = `<span style="flex:1; margin-right:16px;">${prop.name} ${prop.isMortgaged ? '(Mortgaged)' : ''}</span>`;


                    if (mode === "develop") {
                        if ((prop.realEstateType === "property" || prop.realEstateType === "railroad") && typeof prop.canDevelop === "function" && actionHandlers.onDevelop) {
                            // Assuming prop.canDevelop takes (player, logic_or_board_context)
                            // For UI, we might simplify or assume logic is implicitly handled by the game instance
                            // For FixedUIScreen, it's better if canDevelop doesn't need complex logic objects directly
                            // Or, the game instance (SP or MP client) pre-calculates this.
                            // For now, let's assume canDevelop can be called with player.
                            // The `board` argument to `showRealEstateList` can be used if `canDevelop` needs it.
                            // The `logic` instance is not directly available here, so `canDevelop` on the client-side
                            // property object might need to be simpler or rely on data already on the property/player.
                            // A better way for MP is for the server to send `canDevelop` status.
                            // For SP, `prop.canDevelop(player, game.logic)` would be called by the game.

                            // Simplified client-side check for button text, actual validation is server-side for MP
                            let canDevelopInfo = { canBuild: true, nextDev: "Next", buildingCost: prop.buildingCost || 100 };
                            if (typeof prop.canDevelop === 'function') {
                                // In SP, this `board` is the game board. In MP client, it's the client's board.
                                // `logic` is not available here. `canDevelop` on client-side `prop` might be limited.
                                // This is a tricky part for a shared UI component.
                                // Let's assume `canDevelop` on the `prop` object itself can give some indication.
                                // The true validation for MP is on the server.
                                try {
                                   canDevelopInfo = prop.canDevelop(player, logic);
                                } catch (e) { /* might fail if logic is strictly required */ }
                            }


                            const devBtn = document.createElement("button");
                            devBtn.textContent = canDevelopInfo.canBuild ? `Develop ${canDevelopInfo.nextDev || ''} ($${canDevelopInfo.buildingCost || prop.buildingCost})` : "Develop";
                            devBtn.disabled = !canDevelopInfo.canBuild || player.money < (canDevelopInfo.buildingCost || prop.buildingCost);
                            // ... (devBtn styling) ...
                            devBtn.style.opacity = devBtn.disabled ? "0.5" : "1";
                            devBtn.style.cursor = devBtn.disabled ? "not-allowed" : "pointer";
                            if (devBtn.disabled && canDevelopInfo.reason) devBtn.title = canDevelopInfo.reason;

                            devBtn.onclick = () => {
                                if (devBtn.disabled) return;
                                actionHandlers.onDevelop(prop); // Call the provided handler
                                // UI will be updated based on game state changes (SP) or server events (MP)
                                // No need to close modal here immediately unless actionHandlers do it.
                            };
                            row.appendChild(devBtn);
                        }
                    } else { // Mortgage/Undevelop mode
                        if (typeof prop.undevelop === "function" && actionHandlers.onUndevelop) {
                            // Check if there's anything to undevelop (e.g., houses > 0, hasHotel, etc.)
                            const canUndevelop = prop.houses > 0 || prop.hasHotel || prop.hasSkyscraper || prop.hasDepot;
                            const undevelopBtn = document.createElement("button");
                            undevelopBtn.textContent = "Undevelop";
                            undevelopBtn.disabled = !canUndevelop;
                            // ... (undevelopBtn styling) ...
                            undevelopBtn.style.marginRight = "8px";
                            undevelopBtn.style.opacity = undevelopBtn.disabled ? "0.5" : "1";
                            undevelopBtn.style.cursor = undevelopBtn.disabled ? "not-allowed" : "pointer";
                            undevelopBtn.onclick = () => {
                                if (undevelopBtn.disabled) return;
                                actionHandlers.onUndevelop(prop);
                            };
                            row.appendChild(undevelopBtn);
                        }
                        if (typeof prop.mortgage === "function" && !prop.isMortgaged && actionHandlers.onMortgage) {
                            const mortgageBtn = document.createElement("button");
                            mortgageBtn.textContent = `Mortgage (+$${prop.mortgageValue})`;
                            mortgageBtn.onclick = () => actionHandlers.onMortgage(prop);
                            row.appendChild(mortgageBtn);
                        } else if (typeof prop.unmortgage === "function" && prop.isMortgaged && actionHandlers.onUnmortgage) {
                            const unmortgageBtn = document.createElement("button");
                            const unmortgageCost = Math.ceil(prop.mortgageValue * 1.1);
                            unmortgageBtn.textContent = `Unmortgage (-$${unmortgageCost})`;
                            unmortgageBtn.disabled = player.money < unmortgageCost;
                            // ... (unmortgageBtn styling) ...
                            unmortgageBtn.style.opacity = unmortgageBtn.disabled ? "0.5" : "1";
                            unmortgageBtn.style.cursor = unmortgageBtn.disabled ? "not-allowed" : "pointer";
                            unmortgageBtn.onclick = () => {
                                if (unmortgageBtn.disabled) return;
                                actionHandlers.onUnmortgage(prop);
                            };
                            row.appendChild(unmortgageBtn);
                        }
                    }
                    groupDiv.appendChild(row);
                });
                groupsContainer.appendChild(groupDiv);
            });
        }

        renderPropertyList(); // Initial render

        const closeBtn = document.createElement("button");
        // ... (closeBtn styling and logic) ...
        closeBtn.textContent = "Close";
        closeBtn.style.marginTop = "12px";
        closeBtn.onclick = () => document.body.removeChild(modal);
        box.appendChild(closeBtn);


        modal.appendChild(box);
        document.body.appendChild(modal);
    }

    /**
     * Show the trade modal UI.
     * @param {Object[]} players - All players in the game.
     * @param {number} whosTurn - Index of the current player.
     * @param {Function} onProposeTrade - Callback(tradeObj) when trade is proposed.
     */
    showTradeModal(players, whosTurn, onProposeTrade) {
        // Remove any existing modal
        let oldModal = document.getElementById("trade-modal");
        if (oldModal) oldModal.remove();

        const player = players[whosTurn];

        // Modal setup
        const modal = document.createElement("div");
        modal.id = "trade-modal";
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
        box.style.background = "#fff";
        box.style.padding = "24px";
        box.style.borderRadius = "12px";
        box.style.maxWidth = "600px";
        box.style.boxShadow = "0 2px 12px #0003";
        box.style.maxHeight = "80vh";
        box.style.overflowY = "auto";
        box.style.position = "relative";

        // Select player to trade with
        box.innerHTML = `<h3>Propose a Trade</h3>
            <label>Trade with:
                <select id="trade-with">
                    ${players
                        .map((p, i) =>
                            i !== whosTurn
                                ? `<option value="${i}">${p.username}</option>`
                                : ""
                        )
                        .join("")}
                </select>
            </label>
            <hr>
            <div>
                <b>What do you want?</b>
                <div id="trade-want-list"></div>
            </div>
            <hr>
            <div>
                <b>What will you offer?</b>
                <div id="trade-offer-list"></div>
            </div>
            <button id="trade-propose-btn">Propose Trade</button>
            <button id="trade-cancel-btn" style="margin-left:12px;">Cancel</button>
        `;

        // Fill in want/offer lists
        const wantList = box.querySelector("#trade-want-list");
        const offerList = box.querySelector("#trade-offer-list");

        // Helper to create checkboxes for properties/cards
        function makeCheckboxList(items, namePrefix) {
            return items
                .map(
                    (item, idx) =>
                        `<label><input type="checkbox" name="${namePrefix}" value="${idx}"> ${item.name}</label><br>`
                )
                .join("");
        }

        // Want: properties/cards from other player
        const updateWantList = () => {
            const otherIdx = parseInt(box.querySelector("#trade-with").value, 10);
            const other = players[otherIdx];
            wantList.innerHTML =
                "<b>Properties:</b><br>" +
                makeCheckboxList(
                    [
                        ...(other.properties || []),
                        ...(other.railroads || []),
                        ...(other.utilities || [])
                    ],
                    "want-prop"
                ) +
                "<b>Get Out of Jail Free Cards:</b><br>" +
                (other.getOutOfJailFree > 0
                    ? `<label><input type="checkbox" name="want-jail" value="1"> 1 Card</label><br>`
                    : "<i>None</i><br>");
        };

        // Offer: properties/cards/money from current player
        const updateOfferList = () => {
            offerList.innerHTML =
                "<b>Properties:</b><br>" +
                makeCheckboxList(
                    [
                        ...(player.properties || []),
                        ...(player.railroads || []),
                        ...(player.utilities || [])
                    ],
                    "offer-prop"
                ) +
                "<b>Get Out of Jail Free Cards:</b><br>" +
                (player.getOutOfJailFree > 0
                    ? `<label><input type="checkbox" name="offer-jail" value="1"> 1 Card</label><br>`
                    : "<i>None</i><br>") +
                `<b>Money:</b><br>
                <input type="number" id="offer-money" min="0" max="${player.bank}" value="0" style="width:80px;">`;
        };

        box.querySelector("#trade-with").onchange = updateWantList;
        updateWantList();
        updateOfferList();

        // Propose/cancel handlers
        box.querySelector("#trade-propose-btn").onclick = () => {
            const otherIdx = parseInt(box.querySelector("#trade-with").value, 10);
            const other = players[otherIdx];

            // Gather wants
            const wantProps = Array.from(
                box.querySelectorAll('input[name="want-prop"]:checked')
            ).map(cb => {
                const idx = parseInt(cb.value, 10);
                return [
                    ...(other.properties || []),
                    ...(other.railroads || []),
                    ...(other.utilities || [])
                ][idx];
            });
            const wantJail = !!box.querySelector('input[name="want-jail"]:checked');

            // Gather offers
            const offerProps = Array.from(
                box.querySelectorAll('input[name="offer-prop"]:checked')
            ).map(cb => {
                const idx = parseInt(cb.value, 10);
                return [
                    ...(player.properties || []),
                    ...(player.railroads || []),
                    ...(player.utilities || [])
                ][idx];
            });
            const offerJail = !!box.querySelector('input[name="offer-jail"]:checked');
            const offerMoney = parseInt(box.querySelector("#offer-money").value, 10) || 0;

            // Validate
            if (
                wantProps.length === 0 &&
                !wantJail &&
                offerProps.length === 0 &&
                !offerJail &&
                offerMoney === 0
            ) {
                alert("You must select at least one item to trade.");
                return;
            }
            if (offerMoney > player.bank) {
                alert("You don't have enough money!");
                return;
            }

            document.body.removeChild(modal);

            // Callback to game logic
            if (typeof onProposeTrade === "function") {
                onProposeTrade({
                    from: player,
                    to: other,
                    wantProps,
                    wantJail,
                    offerProps,
                    offerJail,
                    offerMoney,
                    fromIdx: whosTurn,
                    toIdx: otherIdx
                });
            }
        };

        box.querySelector("#trade-cancel-btn").onclick = () =>
            document.body.removeChild(modal);

        modal.appendChild(box);
        document.body.appendChild(modal);
    }

    /**
     * Show the trade review/accept modal for the other player.
     * @param {Object} trade - Trade object.
     * @param {Function} onAccept - Callback(tradeObj) if accepted.
     * @param {Function} onReject - Callback(tradeObj) if rejected.
     */
    showTradeReviewModal(trade, onAccept, onReject) {
        let oldModal = document.getElementById("trade-review-modal");
        if (oldModal) oldModal.remove();

        const modal = document.createElement("div");
        modal.id = "trade-review-modal";
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
        box.style.background = "#fff";
        box.style.padding = "24px";
        box.style.borderRadius = "12px";
        box.style.maxWidth = "500px";
        box.style.boxShadow = "0 2px 12px #0003";
        box.style.maxHeight = "80vh";
        box.style.overflowY = "auto";
        box.style.position = "relative";

        // Trade summary
        box.innerHTML = `<h3>Trade Offer</h3>
            <div><b>${trade.from.username}</b> offers:</div>
            <ul>
                ${trade.offerProps.map(p => `<li>${p.name}</li>`).join("")}
                ${trade.offerJail ? "<li>Get Out of Jail Free Card</li>" : ""}
                ${trade.offerMoney > 0 ? `<li>$${trade.offerMoney}</li>` : ""}
                ${trade.offerProps.length === 0 && !trade.offerJail && trade.offerMoney === 0 ? "<li>Nothing</li>" : ""}
            </ul>
            <div><b>${trade.from.username}</b> wants:</div>
            <ul>
                ${trade.wantProps.map(p => `<li>${p.name}</li>`).join("")}
                ${trade.wantJail ? "<li>Get Out of Jail Free Card</li>" : ""}
                ${trade.wantProps.length === 0 && !trade.wantJail ? "<li>Nothing</li>" : ""}
            </ul>
            <button id="trade-accept-btn">Accept</button>
            <button id="trade-reject-btn" style="margin-left:12px;">Reject</button>
        `;

        box.querySelector("#trade-accept-btn").onclick = () => {
            document.body.removeChild(modal);
            if (typeof onAccept === "function") onAccept(trade);
        };
        box.querySelector("#trade-reject-btn").onclick = () => {
            document.body.removeChild(modal);
            if (typeof onReject === "function") onReject(trade);
        };

        modal.appendChild(box);
        document.body.appendChild(modal);
    }

    showBuyPropertyModal(property, player, onBuy, onDecline) {
        // Simple modal implementation
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
        box.style.background = "#fff";
        box.style.padding = "24px";
        box.style.borderRadius = "12px";
        box.style.maxWidth = "400px";
        box.style.boxShadow = "0 2px 12px #0003";
        box.innerHTML = `
        <h3>Buy ${property.name}?</h3>
        <p>Price: $${property.price}</p>
        <button id="buy-prop-btn">Buy</button>
        <button id="decline-prop-btn">Decline</button>
    `;

        modal.appendChild(box);
        document.body.appendChild(modal);

        document.getElementById("buy-prop-btn").onclick = () => {
            document.body.removeChild(modal);
            if (onBuy) onBuy();
        };
        document.getElementById("decline-prop-btn").onclick = () => {
            document.body.removeChild(modal);
            if (onDecline) onDecline();
        };
    }
}

module.exports = FixedUIScreen;