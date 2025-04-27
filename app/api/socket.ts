import { Server } from "socket.io"
import type { NextApiRequest } from "next"
import type { Socket as NetSocket } from "net"
import type { Server as HTTPServer } from "http"
import type { NextApiResponse } from "next"

interface SocketServer extends HTTPServer {
  io?: Server | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

// Game types
type GameState = "waiting" | "playing" | "finished"
type PlayerColor = "red" | "green" | "blue" | "yellow"

interface Token {
  id: number
  position: number // -1 means in home, 0-57 is on board
  isHome: boolean
  isSafe: boolean
}

interface Player {
  id: string
  name: string
  color: PlayerColor
  tokens: Token[]
  isBot: boolean
}

interface GameRoom {
  id: string
  players: Player[]
  currentTurn: number
  gameState: GameState
  winner: Player | null
  lastDiceRoll: number
  canRollAgain: boolean
}

// Store active game rooms
const gameRooms: Record<string, GameRoom> = {}

// Available colors
const COLORS: PlayerColor[] = ["red", "green", "blue", "yellow"]

// Generate a random room ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Create initial tokens for a player
function createInitialTokens(): Token[] {
  return Array.from({ length: 4 }, (_, i) => ({
    id: i,
    position: -1, // Start in home
    isHome: false,
    isSafe: false,
  }))
}

// Check if a player has won
function checkWinCondition(player: Player): boolean {
  return player.tokens.every((token) => token.isHome)
}

// Get next available color
function getNextAvailableColor(players: Player[]): PlayerColor {
  const usedColors = players.map((p) => p.color)
  return COLORS.find((color) => !usedColors.includes(color)) || "red"
}

// Create a bot player
function createBotPlayer(roomId: string): Player {
  const room = gameRooms[roomId]
  const botNames = ["Bot Alice", "Bot Bob", "Bot Charlie", "Bot Dave"]
  const usedNames = room.players.filter((p) => p.isBot).map((p) => p.name)
  const availableNames = botNames.filter((name) => !usedNames.includes(name))
  const botName = availableNames[0] || `Bot ${Math.floor(Math.random() * 1000)}`

  return {
    id: `bot-${Date.now()}-${Math.random()}`,
    name: botName,
    color: getNextAvailableColor(room.players),
    tokens: createInitialTokens(),
    isBot: true,
  }
}

// Bot logic - make a move
function botMove(roomId: string, botId: string) {
  const room = gameRooms[roomId]
  if (!room) return

  // Find the bot player
  const botPlayer = room.players.find((p) => p.id === botId)
  if (!botPlayer || !botPlayer.isBot) return

  // Simulate thinking time
  setTimeout(() => {
    // Roll the dice
    const diceValue = Math.floor(Math.random() * 6) + 1
    room.lastDiceRoll = diceValue
    room.canRollAgain = diceValue === 6

    // Broadcast dice roll
    const io = getSocketIO()
    io.to(roomId).emit("diceRolled", { room, value: diceValue })

    // Wait a bit before moving
    setTimeout(() => {
      // Find movable tokens
      const movableTokens = botPlayer.tokens.filter((token) => {
        // If token is in home, need a 6 to move out
        if (token.position === -1) return diceValue === 6
        // If token is already in final home, can't move
        if (token.isHome) return false
        return true
      })

      if (movableTokens.length > 0) {
        // Prioritize tokens that can capture opponents or are close to home
        // For simplicity, just pick a random movable token
        const tokenToMove = movableTokens[Math.floor(Math.random() * movableTokens.length)]

        // Move the token
        moveToken(room, botPlayer, tokenToMove.id, diceValue)

        // Broadcast the move
        io.to(roomId).emit("tokenMoved", room)

        // Check for win
        if (checkWinCondition(botPlayer)) {
          room.gameState = "finished"
          room.winner = botPlayer
          io.to(roomId).emit("gameOver", room)
          return
        }
      }

      // If can roll again (got a 6), do it
      if (room.canRollAgain) {
        botMove(roomId, botId)
      } else {
        // Move to next player
        room.currentTurn = (room.currentTurn + 1) % room.players.length
        io.to(roomId).emit("gameUpdate", room)

        // If next player is also a bot, make its move
        const nextPlayer = room.players[room.currentTurn]
        if (nextPlayer.isBot) {
          botMove(roomId, nextPlayer.id)
        }
      }
    }, 1000)
  }, 1500)
}

// Move a token
function moveToken(room: GameRoom, player: Player, tokenId: number, diceValue: number) {
  const token = player.tokens.find((t) => t.id === tokenId)
  if (!token) return false

  // If token is in home and dice is 6, move to start position
  if (token.position === -1 && diceValue === 6) {
    token.position = 0
    return true
  }

  // If token is on the board, move it forward
  if (token.position >= 0) {
    const newPosition = token.position + diceValue

    // Check if token reaches home
    if (newPosition >= 57) {
      token.position = 57
      token.isHome = true
      return true
    }

    token.position = newPosition

    // Check for captures (tokens at the same position)
    const otherPlayers = room.players.filter((p) => p.color !== player.color)

    for (const otherPlayer of otherPlayers) {
      for (const otherToken of otherPlayer.tokens) {
        // Skip tokens in home or that have reached final home
        if (otherToken.position === -1 || otherToken.isHome) continue

        // Skip tokens on safe spots
        if (otherToken.isSafe) continue

        // Check if positions match (capture)
        if (
          getPositionOnBoard(player.color, token.position) ===
          getPositionOnBoard(otherPlayer.color, otherToken.position)
        ) {
          // Send token back to home
          otherToken.position = -1
        }
      }
    }

    return true
  }

  return false
}

// Get the absolute position on the board (for collision detection)
function getPositionOnBoard(color: PlayerColor, relativePosition: number): string {
  // This is a simplified version - in a real game, you'd map each player's
  // relative position to an absolute board position
  return `${color}-${relativePosition}`
}

// Get Socket.IO instance
function getSocketIO() {
  if (global.io) {
    return global.io
  }
  return null
}

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO server...")
    const io = new Server(res.socket.server)
    res.socket.server.io = io

    // Store io globally for bot moves
    global.io = io

    io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`)

      // Create a new room
      socket.on("createRoom", ({ playerName }) => {
        const roomId = generateRoomId()

        // Create player
        const player: Player = {
          id: socket.id,
          name: playerName || `Player ${socket.id.substring(0, 4)}`,
          color: "red", // First player is always red
          tokens: createInitialTokens(),
          isBot: false,
        }

        // Create room
        const room: GameRoom = {
          id: roomId,
          players: [player],
          currentTurn: 0,
          gameState: "waiting",
          winner: null,
          lastDiceRoll: 0,
          canRollAgain: false,
        }

        // Store room
        gameRooms[roomId] = room

        // Join socket to room
        socket.join(roomId)

        // Send room data to client
        socket.emit("roomCreated", room)
      })

      // Join an existing room
      socket.on("joinRoom", ({ roomId, playerName }) => {
        const room = gameRooms[roomId]

        if (!room) {
          socket.emit("error", "Room not found")
          return
        }

        if (room.gameState !== "waiting") {
          socket.emit("error", "Game already in progress")
          return
        }

        if (room.players.length >= 4) {
          socket.emit("error", "Room is full")
          return
        }

        // Create player
        const player: Player = {
          id: socket.id,
          name: playerName || `Player ${socket.id.substring(0, 4)}`,
          color: getNextAvailableColor(room.players),
          tokens: createInitialTokens(),
          isBot: false,
        }

        // Add player to room
        room.players.push(player)

        // Join socket to room
        socket.join(roomId)

        // Send room data to all clients in the room
        io.to(roomId).emit("roomJoined", room)
      })

      // Add a bot to the room
      socket.on("addBot", ({ roomId }) => {
        const room = gameRooms[roomId]

        if (!room) {
          socket.emit("error", "Room not found")
          return
        }

        if (room.gameState !== "waiting") {
          socket.emit("error", "Game already in progress")
          return
        }

        if (room.players.length >= 4) {
          socket.emit("error", "Room is full")
          return
        }

        // Create bot player
        const botPlayer = createBotPlayer(roomId)

        // Add bot to room
        room.players.push(botPlayer)

        // Send room data to all clients in the room
        io.to(roomId).emit("roomJoined", room)
      })

      // Start the game
      socket.on("startGame", ({ roomId }) => {
        const room = gameRooms[roomId]

        if (!room) {
          socket.emit("error", "Room not found")
          return
        }

        if (room.gameState !== "waiting") {
          socket.emit("error", "Game already in progress")
          return
        }

        if (room.players.length < 2) {
          socket.emit("error", "Need at least 2 players to start")
          return
        }

        // Start the game
        room.gameState = "playing"
        room.currentTurn = 0

        // Send game update to all clients
        io.to(roomId).emit("gameUpdate", room)

        // If first player is a bot, make its move
        const firstPlayer = room.players[0]
        if (firstPlayer.isBot) {
          botMove(roomId, firstPlayer.id)
        }
      })

      // Roll the dice
      socket.on("rollDice", ({ roomId, playerId }) => {
        const room = gameRooms[roomId]

        if (!room) {
          socket.emit("error", "Room not found")
          return
        }

        if (room.gameState !== "playing") {
          socket.emit("error", "Game not in progress")
          return
        }

        const currentPlayer = room.players[room.currentTurn]

        if (currentPlayer.id !== playerId) {
          socket.emit("error", "Not your turn")
          return
        }

        // Roll the dice
        const diceValue = Math.floor(Math.random() * 6) + 1
        room.lastDiceRoll = diceValue
        room.canRollAgain = diceValue === 6

        // Send dice roll to all clients
        io.to(roomId).emit("diceRolled", { room, value: diceValue })
      })

      // Move a token
      socket.on("moveToken", ({ roomId, playerId, tokenId }) => {
        const room = gameRooms[roomId]

        if (!room) {
          socket.emit("error", "Room not found")
          return
        }

        if (room.gameState !== "playing") {
          socket.emit("error", "Game not in progress")
          return
        }

        const currentPlayer = room.players[room.currentTurn]

        if (currentPlayer.id !== playerId) {
          socket.emit("error", "Not your turn")
          return
        }

        // Move the token
        const moved = moveToken(room, currentPlayer, tokenId, room.lastDiceRoll)

        if (!moved) {
          socket.emit("error", "Invalid move")
          return
        }

        // Send token moved to all clients
        io.to(roomId).emit("tokenMoved", room)

        // Check for win
        if (checkWinCondition(currentPlayer)) {
          room.gameState = "finished"
          room.winner = currentPlayer
          io.to(roomId).emit("gameOver", room)
          return
        }

        // If player rolled a 6, they get another turn
        if (room.canRollAgain) {
          room.lastDiceRoll = 0
          io.to(roomId).emit("gameUpdate", room)
          return
        }

        // Move to next player
        room.currentTurn = (room.currentTurn + 1) % room.players.length
        room.lastDiceRoll = 0

        // Send game update to all clients
        io.to(roomId).emit("gameUpdate", room)

        // If next player is a bot, make its move
        const nextPlayer = room.players[room.currentTurn]
        if (nextPlayer.isBot) {
          botMove(roomId, nextPlayer.id)
        }
      })

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`)

        // Find rooms where this player is
        for (const roomId in gameRooms) {
          const room = gameRooms[roomId]
          const playerIndex = room.players.findIndex((p) => p.id === socket.id)

          if (playerIndex !== -1) {
            // Remove player from room
            room.players.splice(playerIndex, 1)

            // If no players left, delete the room
            if (room.players.length === 0) {
              delete gameRooms[roomId]
              continue
            }

            // If game is in progress, end it
            if (room.gameState === "playing") {
              room.gameState = "finished"

              // If only one player left, they win
              if (room.players.length === 1) {
                room.winner = room.players[0]
              }

              // Send game over to all clients
              io.to(roomId).emit("gameOver", room)
            } else {
              // Send room update to all clients
              io.to(roomId).emit("roomJoined", room)
            }
          }
        }
      })
    })
  }

  res.end()
}
