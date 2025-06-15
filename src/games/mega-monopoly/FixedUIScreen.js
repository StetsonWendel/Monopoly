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

    showRealEstateList(player, board) {
        const properties = [
            ...(player.properties || []),
            ...(player.railroads || []),
            ...(player.utilities || [])
        ];

        // Group properties by colorGroup or type
        const groups = {};
        properties.forEach(prop => {
            const group = prop.colorGroup || prop.realEstateType || "Other";
            if (!groups[group]) groups[group] = [];
            groups[group].push(prop);
        });

        // Remove any existing modal
        let oldModal = document.getElementById("realestate-modal");
        if (oldModal) oldModal.remove();

        // Create modal
        const modal = document.createElement("div");
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
        box.style.background = "#fff";
        box.style.padding = "24px";
        box.style.borderRadius = "12px";
        box.style.maxWidth = "500px";
        box.style.boxShadow = "0 2px 12px #0003";
        box.style.maxHeight = "80vh";
        box.style.overflowY = "auto";
        box.style.position = "relative"; // For absolute positioning of the X

        box.innerHTML += `<h3 style="margin-top:0;">Your Properties</h3>`;

        // Toggle button for Develop/Mortgage-Undevelop mode
        let mode = "develop";
        const toggleBtn = document.createElement("button");
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
            // Re-render property list in new mode
            renderPropertyList();
        };
        box.appendChild(toggleBtn);

        // Add X close button at the top right (after innerHTML)
        const xBtn = document.createElement("button");
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

        // Container for property groups
        const groupsContainer = document.createElement("div");
        box.appendChild(groupsContainer);

        function renderPropertyList() {
            groupsContainer.innerHTML = "";
            Object.keys(groups).forEach(group => {
                const groupDiv = document.createElement("div");
                groupDiv.style.marginBottom = "18px";
                groupDiv.innerHTML = `<div style="font-weight:bold; margin-bottom:4px;">${group.replace(/\b\w/g, c => c.toUpperCase())}</div>`;

                groups[group].forEach(prop => {
                    const row = document.createElement("div");
                    row.style.display = "flex";
                    row.style.alignItems = "center";
                    row.style.marginBottom = "6px";
                    row.innerHTML = `<span style="flex:1; margin-right:16px;">${prop.name}</span>`;

                    if (mode === "develop") {
                        // DEVELOP MODE
                        if (prop.realEstateType === "property" && typeof prop.canDevelop === "function") {
                            const { canBuild, nextDev, reason, buildingCost } = prop.canDevelop(player, board, groups);

                            const devBtn = document.createElement("button");
                            devBtn.textContent = canBuild ? `Develop ${nextDev}` : "Develop";
                            devBtn.disabled = !canBuild || player.bank < buildingCost;
                            devBtn.style.opacity = devBtn.disabled ? "0.5" : "1";
                            devBtn.style.cursor = devBtn.disabled ? "not-allowed" : "pointer";
                            if (devBtn.disabled && reason) devBtn.title = reason;
                            devBtn.onclick = () => {
                                if (devBtn.disabled) return;
                                if (player.bank < buildingCost) {
                                    alert("Not enough money to develop!");
                                    return;
                                }
                                if (prop.develop && prop.develop()) {
                                    if (typeof prop.renderDevelopment === "function") {
                                        prop.renderDevelopment();
                                    }
                                    this.updateChatMessage &&
                                        this.updateChatMessage(`${player.username} developed ${prop.name}!`);
                                    document.body.removeChild(modal);
                                    this.showRealEstateList(player, board);
                                } else {
                                    alert("Unable to develop this property.");
                                }
                            };
                            row.appendChild(devBtn);
                        } else if (prop.realEstateType === "railroad" && typeof prop.canDevelop === "function") {
                            const { canBuild, reason } = prop.canDevelop(player);

                            const depotBtn = document.createElement("button");
                            depotBtn.textContent = canBuild ? "Develop ($100)" : "Develop";
                            depotBtn.disabled = !canBuild;
                            depotBtn.style.opacity = depotBtn.disabled ? "0.5" : "1";
                            depotBtn.style.cursor = depotBtn.disabled ? "not-allowed" : "pointer";
                            if (depotBtn.disabled && reason) depotBtn.title = reason;
                            depotBtn.onclick = () => {
                                if (depotBtn.disabled) return;
                                if (player.bank < 100) {
                                    alert("Not enough money to build depot!");
                                    return;
                                }
                                if (prop.buildDepot && prop.buildDepot()) {
                                    if (typeof prop.renderDevelopment === "function") {
                                        prop.renderDevelopment();
                                    }
                                    this.updateChatMessage &&
                                        this.updateChatMessage(`${player.username} built a depot on ${prop.name}!`);
                                    document.body.removeChild(modal);
                                    this.showRealEstateList(player, board);
                                } else {
                                    alert("Unable to build depot.");
                                }
                            };
                            row.appendChild(depotBtn);
                        }
                    } else {
                        // MORTGAGE/UNDEVELOP MODE
                        // Undevelop button for properties/railroads
                        if (typeof prop.undevelop === "function") {
                            const undevelopBtn = document.createElement("button");
                            undevelopBtn.textContent = "Undevelop";
                            undevelopBtn.disabled = false;
                            undevelopBtn.style.marginRight = "8px";
                            undevelopBtn.onclick = () => {
                                let result;
                                if (prop.realEstateType === "property") {
                                    result = prop.undevelop(player, board, groups);
                                } else {
                                    result = prop.undevelop(player);
                                }
                                if (result.success) {
                                    if (typeof prop.renderDevelopment === "function") {
                                        prop.renderDevelopment();
                                    }
                                    this.updateChatMessage &&
                                        this.updateChatMessage(`${player.username} sold development on ${prop.name} for $${result.refund}.`);
                                    document.body.removeChild(modal);
                                    this.showRealEstateList(player, board);
                                } else {
                                    alert(result.reason || "Unable to undevelop.");
                                }
                            };
                            row.appendChild(undevelopBtn);
                        }
                        // Mortgage/unmortgage button for all buyable spaces
                        if (typeof prop.mortgage === "function" && !prop.isMortgaged) {
                            const mortgageBtn = document.createElement("button");
                            mortgageBtn.textContent = `Mortgage (+$${prop.mortgageValue})`;
                            mortgageBtn.onclick = () => {
                                const result = prop.mortgage(player);
                                if (result.success) {
                                    this.updateChatMessage &&
                                        this.updateChatMessage(`${player.username} mortgaged ${prop.name} for $${result.amount}.`);
                                    document.body.removeChild(modal);
                                    this.showRealEstateList(player, board);
                                } else {
                                    alert(result.reason || "Unable to mortgage.");
                                }
                            };
                            row.appendChild(mortgageBtn);
                        } else if (typeof prop.unmortgage === "function" && prop.isMortgaged) {
                            const unmortgageBtn = document.createElement("button");
                            unmortgageBtn.textContent = `Unmortgage (-$${Math.ceil(prop.mortgageValue * 1.1)})`;
                            unmortgageBtn.onclick = () => {
                                const result = prop.unmortgage(player);
                                if (result.success) {
                                    this.updateChatMessage &&
                                        this.updateChatMessage(`${player.username} unmortgaged ${prop.name} for $${result.cost}.`);
                                    document.body.removeChild(modal);
                                    this.showRealEstateList(player, board);
                                } else {
                                    alert(result.reason || "Unable to unmortgage.");
                                }
                            };
                            row.appendChild(unmortgageBtn);
                        }
                    }
                    groupDiv.appendChild(row);
                });
                groupsContainer.appendChild(groupDiv);
            });
        }

        renderPropertyList();

        // Bottom close button (optional, keep for accessibility)
        const closeBtn = document.createElement("button");
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
}

module.exports = FixedUIScreen;