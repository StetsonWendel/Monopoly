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

        Object.keys(groups).forEach(group => {
            const groupDiv = document.createElement("div");
            groupDiv.style.marginBottom = "18px";
            groupDiv.innerHTML = `<div style="font-weight:bold; margin-bottom:4px;">${group.replace(/\b\w/g, c => c.toUpperCase())}</div>`;

            // Only check for color groups (not railroads/utilities)
            const colorProps = board.filter(
                sq => sq.realEstateType === "property" && sq.colorGroup === group
            );
            let canDevelop = false;
            let buildingCost = null;
            if (colorProps.length > 0) {
                // Use the new countSet method
                const groupProperty = groups[group].find(p => p.realEstateType === "property");
                const colorGroup = groupProperty ? groupProperty.colorGroup : null;
                const allOwned = colorGroup ? (player.countSet(colorGroup) === 0) : false;
                canDevelop = allOwned && colorProps.some(p => !p.hasSkyscraper);
                buildingCost = colorProps[0].buildingCost;
            }

            groups[group].forEach(prop => {
                const row = document.createElement("div");
                row.style.display = "flex";
                row.style.alignItems = "center";
                row.style.marginBottom = "6px";
                row.innerHTML = `<span style="flex:1; margin-right:16px;">${prop.name}</span>`;

                // Only show develop button for properties and railroads
                if (prop.realEstateType === "property") {
                    // Enforce even building
                    const groupProps = groups[group].filter(p => p.realEstateType === "property");
                    const minHouses = Math.min(...groupProps.map(p => p.houses || 0));
                    const minHotels = Math.min(...groupProps.map(p => p.hasHotel ? 1 : 0));
                    const minSkyscrapers = Math.min(...groupProps.map(p => p.hasSkyscraper ? 1 : 0));

                    let canBuild = false;
                    let nextDev = "";
                    if (!prop.hasHotel && !prop.hasSkyscraper && (prop.houses || 0) < 4) {
                        canBuild = canDevelop && (prop.houses || 0) === minHouses && groupProps.every(p => (p.houses || 0) <= 4);
                        nextDev = `House (${buildingCost})`;
                    } else if (
                        !prop.hasHotel &&
                        (prop.houses || 0) === 4 &&
                        groupProps.every(p => (p.houses === 4 || p.hasHotel || p.hasSkyscraper))
                    ) {
                        canBuild = canDevelop;
                        nextDev = `Hotel (${buildingCost})`;
                    } else if (!prop.hasSkyscraper && prop.hasHotel && groupProps.every(p => (p.hasHotel || p.hasSkyscraper))) {
                        canBuild = canDevelop;
                        nextDev = `Skyscraper (${buildingCost})`;
                    }

                    let reason = "";
                    if (!canDevelop) {
                        reason = "You must own all properties in this color group to develop.";
                    } else if (player.bank < buildingCost) {
                        reason = "Not enough money to develop.";
                    } else if (!canBuild) {
                        reason = "You must build evenly across all properties in this group.";
                    }

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
                        // Actually develop the property using its method
                        if (prop.develop && prop.develop()) {
                            player.bank -= buildingCost;
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
                } else if (prop.realEstateType === "railroad") {
                    // Get all railroads from the board
                    const canBuildDepot = !prop.hasDepot && player.bank >= 100;

                    let reason = "";
                    if (prop.hasDepot) {
                        reason = "Depot already built on this railroad.";
                    } else if (player.bank < 100) {
                        reason = "Not enough money to build depot.";
                    }

                    const depotBtn = document.createElement("button");
                    depotBtn.textContent = canBuildDepot ? "Develop ($100)" : "Develop";
                    depotBtn.disabled = !canBuildDepot;
                    depotBtn.style.opacity = depotBtn.disabled ? "0.5" : "1";
                    depotBtn.style.cursor = depotBtn.disabled ? "not-allowed" : "pointer";
                    if (depotBtn.disabled && reason) depotBtn.title = reason;
                    depotBtn.onclick = () => {
                        if (depotBtn.disabled) return;
                        if (player.bank < 100) {
                            alert("Not enough money to build depot!");
                            return;
                        }
                        // Actually build the depot using its method
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
                groupDiv.appendChild(row);
            });
            box.appendChild(groupDiv);
        });

        // Bottom close button (optional, keep for accessibility)
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "Close";
        closeBtn.style.marginTop = "12px";
        closeBtn.onclick = () => document.body.removeChild(modal);
        box.appendChild(closeBtn);

        modal.appendChild(box);
        document.body.appendChild(modal);
    }
}

module.exports = FixedUIScreen;