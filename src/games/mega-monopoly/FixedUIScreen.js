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
            ["mm-view-realestate", "V", "View/Upgrade Real Estate"],
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
}

module.exports = FixedUIScreen;