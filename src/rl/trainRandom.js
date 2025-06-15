const MonopolyEnv = require('./MonopolyEnv');
const boardData = require('../games/mega-monopoly/board-data.json');

const playerConfigs = [
    { username: "AI1" },
    { username: "AI2" }
];

const env = new MonopolyEnv(boardData, playerConfigs);

for (let episode = 0; episode < 10; episode++) {
    let state = env.reset();
    let done = false;
    let totalReward = 0;
    while (!done) {
        const player = env.players[env.whosTurn];
        const validActions = env.getValidActions(player);
        // Random agent: pick a random valid action
        const action = validActions[Math.floor(Math.random() * validActions.length)];
        const { state: nextState, reward, done: isDone } = env.step(action);
        totalReward += reward;
        state = nextState;
        done = isDone;
    }
    console.log(`Episode ${episode + 1} finished. Total reward: ${totalReward}`);
}