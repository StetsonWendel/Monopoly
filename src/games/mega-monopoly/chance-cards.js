function moveToAndCheckGo(player, newPosition) {
    if (newPosition < player.position) {
        player.bank += 200;
    }
    player.position = newPosition;
}

module.exports = [
    {
        text: 'Advance to "Go". (Collect $200)',
        img: 'games/mega-monopoly/assets/ChanceCards/Advance_To_Go.png',
        effect: (player, game) => {
            moveToAndCheckGo(player, 0);
            player.bank += 200; // Always collect $200 for landing on Go
            game.render();
            if (typeof game.board[player.position].onLand === "function") {
                game.board[player.position].onLand(player, game);
            }
        }
    },
    {
        text: 'Advance to Illinois Ave. If you pass Go, collect $200.',
        img: 'games/mega-monopoly/assets/ChanceCards/Chance_ATIA.png',
        effect: (player, game) => {
            const illinoisIdx = game.board.findIndex(sq => sq.name === "Illinois Avenue");
            if (illinoisIdx !== -1) {
                moveToAndCheckGo(player, illinoisIdx);
                game.render();
                if (typeof game.board[player.position].onLand === "function") {
                    game.board[player.position].onLand(player, game);
                }
            }
        }
    },
    {
        text: 'Advance to St. Charles Place. If you pass Go, collect $200.',
        img: 'games/mega-monopoly/assets/ChanceCards/Chance_ATSCP.png',
        effect: (player, game) => {
            const stCharlesIdx = game.board.findIndex(sq => sq.name === "St. Charles Place");
            if (stCharlesIdx !== -1) {
                moveToAndCheckGo(player, stCharlesIdx);
                game.render();
                if (typeof game.board[player.position].onLand === "function") {
                    game.board[player.position].onLand(player, game);
                }
            }
        }
    },
    {
        text: 'Advance token to the nearest Utility. If unowned, you may buy it from the Bank. If owned, throw dice and pay owner a total 10 times the amount thrown.',
        img: 'games/mega-monopoly/assets/ChanceCards/Chance_ATTNU.png',
        effect: (player, game) => {
            const utilities = game.board
                .map((sq, idx) => ({ sq, idx }))
                .filter(obj => obj.sq.realEstateType === "utility");
            const nextUtility = utilities.find(obj => obj.idx > player.position) || utilities[0];
            if (nextUtility) {
                moveToAndCheckGo(player, nextUtility.idx);
                game.render();
                if (typeof game.board[player.position].onLand === "function") {
                    game.board[player.position].onLand(player, game);
                }
                // Add logic for buying or paying rent as needed
            }
        }
    },
    {
        text: 'Advance to the nearest Railroad. If unowned, you may buy it from the Bank. If owned, pay owner twice the rent to which they are otherwise entitled.',
        img: 'games/mega-monopoly/assets/ChanceCards/Chance_ATTNR.png',
        effect: (player, game) => {
            const railroads = game.board
                .map((sq, idx) => ({ sq, idx }))
                .filter(obj => obj.sq.realEstateType === "railroad");
            const nextRailroad = railroads.find(obj => obj.idx > player.position) || railroads[0];
            if (nextRailroad) {
                moveToAndCheckGo(player, nextRailroad.idx);
                game.render();
                if (typeof game.board[player.position].onLand === "function") {
                    game.board[player.position].onLand(player, game);
                }
                // Add logic for buying or paying double rent as needed
            }
        }
    },
    {
        text: "Bank pays you dividend of $50.",
        img: 'games/mega-monopoly/assets/ChanceCards/Chance_BPYD.png',
        effect: (player) => { player.bank += 50; }
    },
    {
        text: "Get out of Jail Free. This card may be kept until needed, or traded/sold.",
        img: 'games/mega-monopoly/assets/ChanceCards/Chance_GOOJF.png',
        effect: (player) => { player.hasGetOutOfJailFree = true; }
    },
    {
        text: "Go Back Three Spaces.",
        img: 'games/mega-monopoly/assets/ChanceCards/Chance_GB3S.png',
        effect: (player, game) => {
            // This does not pass Go, so no need to check
            player.position = (player.position - 3 + game.board.length) % game.board.length;
            game.render();
            if (typeof game.board[player.position].onLand === "function") {
                game.board[player.position].onLand(player, game);
            }
        }
    },
    {
        text: "Go to Jail. Go directly to Jail. Do not pass GO, do not collect $200.",
        img: 'games/mega-monopoly/assets/ChanceCards/Chance_GTJ.png',
        effect: (player, game) => {
            const jailIdx = game.board.findIndex(sq => sq.type === "jail" || sq.name === "Jail");
            if (jailIdx !== -1) {
                player.position = jailIdx;
                player.inJail = true;
                game.render();
                if (typeof game.board[player.position].onLand === "function") {
                    game.board[player.position].onLand(player, game);
                }
            }
        }
    },
    {
        text: "Make general repairs on all your property: For each house pay $25, For each hotel pay $100.",
        img: 'games/mega-monopoly/assets/ChanceCards/Chance_MGR.png',
        effect: (player) => {
            let houses = 0, hotels = 0;
            player.properties.forEach(prop => {
                houses += prop.houses || 0;
                hotels += prop.hasHotel ? 1 : 0;
            });
            player.bank -= (houses * 25 + hotels * 100);
        }
    },
    {
        text: "Take a trip to Reading Railroad. If you pass Go, collect $200.",
        img: 'games/mega-monopoly/assets/ChanceCards/Chance_TAROTR.png',
        effect: (player, game) => {
            const rrIdx = game.board.findIndex(sq => sq.name === "Reading Railroad");
            if (rrIdx !== -1) {
                moveToAndCheckGo(player, rrIdx);
                game.render();
                if (typeof game.board[player.position].onLand === "function") {
                    game.board[player.position].onLand(player, game);
                }
            }
        }
    },
    {
        text: "Pay Poor Tax of $15.",
        img: 'games/mega-monopoly/assets/ChanceCards/Chance_PPT.png',
        effect: (player) => { player.bank -= 15; }
    },
    {
        text: "Take a walk on the Boardwalk. Advance token to Boardwalk.",
        img: 'games/mega-monopoly/assets/ChanceCards/Advance_To_Boardwalk.png',
        effect: (player, game) => {
            const bwIdx = game.board.findIndex(sq => sq.name === "Boardwalk");
            if (bwIdx !== -1) {
                moveToAndCheckGo(player, bwIdx);
                game.render();
                if (typeof game.board[player.position].onLand === "function") {
                    game.board[player.position].onLand(player, game);
                }
            }
        }
    },
    {
        text: "You have been elected Chairman of the Board. Pay each player $50.",
        img: 'games/mega-monopoly/assets/ChanceCards/Chance_YHBAECOTB.png',
        effect: (player, game) => {
            game.players.forEach(p => {
                if (p !== player) {
                    player.bank -= 50;
                    p.bank += 50;
                }
            });
        }
    },
    {
        text: "Your building and loan matures. Receive $150.",
        img: 'games/mega-monopoly/assets/ChanceCards/Chance_YBALM.png',
        effect: (player) => { player.bank += 150; }
    }
];