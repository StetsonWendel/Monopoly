function moveToAndCheckGo(player, newPosition) {
    if (newPosition < player.position) {
        player.bank += 200;
    }
    player.position = newPosition;
}

module.exports = [
    {
        text: 'Advance to "Go". (Collect $200)',
        img: 'games/mega-monopoly/assets/CommunityChest/Community_Chest_ATGo.png',
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
        text: "Bank error in your favor. Collect $200.",
        img: 'games/mega-monopoly/assets/CommunityChest/Community_Chest_BEIYF.png',
        effect: (player) => {
            player.bank += 200;
        }
    },
    {
        text: "Doctor's fees. Pay $50.",
        img: 'games/mega-monopoly/assets/CommunityChest/Community_Chest_DF.png',
        effect: (player) => {
            player.bank -= 50;
        }
    },
    {
        text: "From sale of stock you get $50.",
        img: 'games/mega-monopoly/assets/CommunityChest/Community_Chest_FSOS.png',
        effect: (player) => {
            player.bank += 50;
        }
    },
    {
        text: "Get Out of Jail Free. This card may be kept until needed or sold/traded.",
        img: 'games/mega-monopoly/assets/CommunityChest/Community_Chest_GOOJF.png',
        effect: (player) => {
            player.hasGetOutOfJailFree = true;
        }
    },
    {
        text: "Go to Jail. Go directly to jail. Do not pass Go, Do not collect $200.",
        img: 'games/mega-monopoly/assets/CommunityChest/Community_Chest_GTJ.png',
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
        text: "Grand Opera Night. Collect $50 from every player for opening night seats.",
        img: 'games/mega-monopoly/assets/CommunityChest/Community_Chest_GOO.png',
        effect: (player, game) => {
            game.players.forEach(p => {
                if (p !== player) {
                    p.bank -= 50;
                    player.bank += 50;
                }
            });
        }
    },
    {
        text: "Holiday Fund matures. Receive $100.",
        img: 'games/mega-monopoly/assets/CommunityChest/Community_Chest_HFM.png', // You may need to add this image or use the closest match
        effect: (player) => {
            player.bank += 100;
        }
    },
    {
        text: "Income tax refund. Collect $20.",
        img: 'games/mega-monopoly/assets/CommunityChest/Community_Chest_ITR.png',
        effect: (player) => {
            player.bank += 20;
        }
    },
    {
        text: "It is your birthday. Collect $10 from every player.",
        img: 'games/mega-monopoly/assets/CommunityChest/Community_Chest_YI.png',
        effect: (player, game) => {
            game.players.forEach(p => {
                if (p !== player) {
                    p.bank -= 10;
                    player.bank += 10;
                }
            });
        }
    },
    {
        text: "Life insurance matures – Collect $100.",
        img: 'games/mega-monopoly/assets/CommunityChest/Community_Chest_LIM.png',
        effect: (player) => {
            player.bank += 100;
        }
    },
    {
        text: "Hospital Fees. Pay $50.",
        img: 'games/mega-monopoly/assets/CommunityChest/Community_Chest_PH.png',
        effect: (player) => {
            player.bank -= 50;
        }
    },
    {
        text: "School fees. Pay $50.",
        img: 'games/mega-monopoly/assets/CommunityChest/Community_Chest_PST.png',
        effect: (player) => {
            player.bank -= 50;
        }
    },
    {
        text: "Receive $25 consultancy fee.",
        img: 'games/mega-monopoly/assets/CommunityChest/Community_Chest_RFS.png',
        effect: (player) => {
            player.bank += 25;
        }
    },
    {
        text: "You are assessed for street repairs: Pay $40 per house and $115 per hotel you own.",
        img: 'games/mega-monopoly/assets/CommunityChest/Community_Chest_XFM.png',
        effect: (player) => {
            let houses = 0, hotels = 0;
            player.properties.forEach(prop => {
                houses += prop.houses || 0;
                hotels += prop.hasHotel ? 1 : 0;
            });
            player.bank -= (houses * 40 + hotels * 115);
        }
    },
    {
        text: "You have won second prize in a beauty contest. Collect $10.",
        img: 'games/mega-monopoly/assets/CommunityChest/Community_Chest_YHWSPIABC.png',
        effect: (player) => {
            player.bank += 10;
        }
    },
    {
        text: "You inherit $100.",
        img: 'games/mega-monopoly/assets/CommunityChest/Community_Chest_YAAFSR.png',
        effect: (player) => {
            player.bank += 100;
        }
    }
];