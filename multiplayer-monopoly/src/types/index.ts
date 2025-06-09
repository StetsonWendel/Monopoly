export interface Player {
    id: string;
    name: string;
    position: number;
    money: number;
    properties: string[];
}

export interface GameState {
    players: Player[];
    currentPlayerIndex: number;
    board: string[];
    isGameActive: boolean;
}

export interface Action {
    type: string;
    payload: any;
}