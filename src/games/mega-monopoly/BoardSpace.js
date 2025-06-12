class BoardSpace {
    constructor({ pos, name, edge, img = null, cell = null, backgroundColor = "#f5fde8" }) {
        this.pos = pos;
        this.name = name;
        this.edge = edge;
        this.cell = cell; // The cell element where this space will be displayed
        this.backgroundColor = backgroundColor; // Default background color for the space
        this.renderBackground();
        // this.imgSrc = img; // Image to display on the space (optional)
        // cell.style.background = "#f5fde8"; // This line is not valid here; cell is undefined in constructor
        
    }

    populateCell() {
        this.renderName();
    }
    
    renderBackground() {
        this.cell.style.background = this.backgroundColor;
    }

    renderName(marginTop = "-35%", fontSize = "1.5em", letterSpacing = "normal", fontFamily = "") {
        if (!this.cell) {
            console.warn(`No cell to render name for space: ${this.name}`);
            return;
        }
        // Stick names in spaces. Used as the base by all spaces.
        const nameDiv = document.createElement("div");
        nameDiv.textContent = this.name;
        nameDiv.style.textAlign = "center";
        nameDiv.style.flex = "1";
        nameDiv.style.display = "flex";
        nameDiv.style.alignItems = "center";
        nameDiv.style.justifyContent = "center";
        nameDiv.style.width = "90%";
        nameDiv.style.fontWeight = "bold";
        nameDiv.style.zIndex = "1";
        nameDiv.style.fontFamily = fontFamily
        nameDiv.style.fontSize = fontSize;
        nameDiv.style.marginTop = marginTop;
        nameDiv.style.letterSpacing = letterSpacing;
        if (this.edge === "left") nameDiv.style.marginLeft = "45px";
        if (this.edge === "right") nameDiv.style.marginRight = "45px";
        this.cell.appendChild(nameDiv);
    }

    renderImage(imgSrc, imgWidth, imgHeight, imgTop) {
        if (!this.cell) {
            console.warn(`No cell to render image for space: ${this.name}`);
            return;
        }
        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = this.name;
        img.style.width = imgWidth;
        img.style.height = imgHeight;
        img.style.position = "absolute";
        img.style.left = "50%";
        img.style.top = imgTop;
        img.style.transform = "translate(-50%, -50%)";
        img.style.pointerEvents = "none";
        this.cell.appendChild(img);
    }

    /**
     * Called when a player lands on this space.
     * Override in subclasses for custom behavior.
     * @param {object} player - The player object landing on the space.
     */
    onLand(player) {
        // Default: do nothing
        console.log("Error: BoardSpace onLand called for", this.name);
    }
}

module.exports = BoardSpace;