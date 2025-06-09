# Multiplayer Monopoly
This project is a multiplayer version of the classic Monopoly game that can be hosted on a single machine while allowing other players to join the game over the internet.

## Project Structure
- **src/**: Contains the source code for the server and client applications.
  - **server/**: The backend logic for managing the game state and player interactions.
    - **index.ts**: Entry point for the server, initializes the server and sets up socket connections.
    - **game/**: Contains the game logic.
      - **monopoly.ts**: Manages the game state, player actions, and game rules.
    - **network/**: Handles real-time communication.
      - **socket.ts**: Manages WebSocket connections.
  - **client/**: The frontend application for players to interact with the game.
    - **index.ts**: Entry point for the client application, initializes the UI and connects to the server.
    - **ui/**: Contains UI components.
      - **app.ts**: Manages user interface components and interactions.
  - **types/**: Contains TypeScript interfaces for type definitions.
    - **index.ts**: Defines the structure of data used throughout the application.

## Setup Instructions
1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Install the dependencies using npm:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm run start:server
   ```
5. Open the client application in your browser:
   ```
   npm run start:client
   ```

## Gameplay Details
- Players can join the game by connecting to the host's IP address.
- The host can start the game and manage player actions.
- The game follows the traditional Monopoly rules with some enhancements for multiplayer interaction.

## Contributing
Feel free to submit issues or pull requests to improve the game!