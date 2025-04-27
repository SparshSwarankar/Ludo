"use client"

import { useState, useEffect } from "react"
import type { GameRoom, PlayerColor, Token } from "./ludo-game"
import type React from "react"

interface LudoBoardProps {
  room: GameRoom
  playerId: string
  onTokenClick: (tokenId: number) => void
  selectedToken: number | null
  setSelectedToken: (tokenId: number | null) => void
  diceValue: number
}

// Board layout constants
const BOARD_SIZE = 15
const CELL_SIZE = 40

// Path coordinates for each color
const PATHS: Record<PlayerColor, number[][]> = {
  red: [
    // Red path coordinates (from home to center)
    [6, 1],
    [6, 2],
    [6, 3],
    [6, 4],
    [6, 5],
    [5, 6],
    [4, 6],
    [3, 6],
    [2, 6],
    [1, 6],
    [0, 6],
    [0, 7],
    [0, 8],
    [1, 8],
    [2, 8],
    [3, 8],
    [4, 8],
    [5, 8],
    [6, 9],
    [6, 10],
    [6, 11],
    [6, 12],
    [6, 13],
    [6, 14],
    [7, 14],
    [8, 14],
    [8, 13],
    [8, 12],
    [8, 11],
    [8, 10],
    [8, 9],
    [9, 8],
    [10, 8],
    [11, 8],
    [12, 8],
    [13, 8],
    [14, 8],
    [14, 7],
    [14, 6],
    [13, 6],
    [12, 6],
    [11, 6],
    [10, 6],
    [9, 6],
    [8, 5],
    [8, 4],
    [8, 3],
    [8, 2],
    [8, 1],
    [8, 0],
    [7, 0],
    // Home stretch
    [7, 1],
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],
    [7, 6],
    [7, 7],
  ],
  green: [
    // Green path coordinates
    [1, 8],
    [2, 8],
    [3, 8],
    [4, 8],
    [5, 8],
    [6, 9],
    [6, 10],
    [6, 11],
    [6, 12],
    [6, 13],
    [6, 14],
    [7, 14],
    [8, 14],
    [8, 13],
    [8, 12],
    [8, 11],
    [8, 10],
    [8, 9],
    [9, 8],
    [10, 8],
    [11, 8],
    [12, 8],
    [13, 8],
    [14, 8],
    [14, 7],
    [14, 6],
    [13, 6],
    [12, 6],
    [11, 6],
    [10, 6],
    [9, 6],
    [8, 5],
    [8, 4],
    [8, 3],
    [8, 2],
    [8, 1],
    [8, 0],
    [7, 0],
    [6, 0],
    [6, 1],
    [6, 2],
    [6, 3],
    [6, 4],
    [6, 5],
    [5, 6],
    [4, 6],
    [3, 6],
    [2, 6],
    [1, 6],
    [0, 6],
    [0, 7],
    // Home stretch
    [1, 7],
    [2, 7],
    [3, 7],
    [4, 7],
    [5, 7],
    [6, 7],
    [7, 7],
  ],
  blue: [
    // Blue path coordinates
    [8, 13],
    [8, 12],
    [8, 11],
    [8, 10],
    [8, 9],
    [9, 8],
    [10, 8],
    [11, 8],
    [12, 8],
    [13, 8],
    [14, 8],
    [14, 7],
    [14, 6],
    [13, 6],
    [12, 6],
    [11, 6],
    [10, 6],
    [9, 6],
    [8, 5],
    [8, 4],
    [8, 3],
    [8, 2],
    [8, 1],
    [8, 0],
    [7, 0],
    [6, 0],
    [6, 1],
    [6, 2],
    [6, 3],
    [6, 4],
    [6, 5],
    [5, 6],
    [4, 6],
    [3, 6],
    [2, 6],
    [1, 6],
    [0, 6],
    [0, 7],
    [0, 8],
    [1, 8],
    [2, 8],
    [3, 8],
    [4, 8],
    [5, 8],
    [6, 9],
    [6, 10],
    [6, 11],
    [6, 12],
    [6, 13],
    [6, 14],
    [7, 14],
    // Home stretch
    [7, 13],
    [7, 12],
    [7, 11],
    [7, 10],
    [7, 9],
    [7, 8],
    [7, 7],
  ],
  yellow: [
    // Yellow path coordinates
    [13, 6],
    [12, 6],
    [11, 6],
    [10, 6],
    [9, 6],
    [8, 5],
    [8, 4],
    [8, 3],
    [8, 2],
    [8, 1],
    [8, 0],
    [7, 0],
    [6, 0],
    [6, 1],
    [6, 2],
    [6, 3],
    [6, 4],
    [6, 5],
    [5, 6],
    [4, 6],
    [3, 6],
    [2, 6],
    [1, 6],
    [0, 6],
    [0, 7],
    [0, 8],
    [1, 8],
    [2, 8],
    [3, 8],
    [4, 8],
    [5, 8],
    [6, 9],
    [6, 10],
    [6, 11],
    [6, 12],
    [6, 13],
    [6, 14],
    [7, 14],
    [8, 14],
    [8, 13],
    [8, 12],
    [8, 11],
    [8, 10],
    [8, 9],
    [9, 8],
    [10, 8],
    [11, 8],
    [12, 8],
    [13, 8],
    [14, 8],
    [14, 7],
    // Home stretch
    [13, 7],
    [12, 7],
    [11, 7],
    [10, 7],
    [9, 7],
    [8, 7],
    [7, 7],
  ],
}

// Home positions for each color
const HOME_POSITIONS: Record<PlayerColor, number[][]> = {
  red: [
    [2, 2],
    [2, 4],
    [4, 2],
    [4, 4],
  ],
  green: [
    [2, 10],
    [2, 12],
    [4, 10],
    [4, 12],
  ],
  blue: [
    [10, 10],
    [10, 12],
    [12, 10],
    [12, 12],
  ],
  yellow: [
    [10, 2],
    [10, 4],
    [12, 2],
    [12, 4],
  ],
}

export default function LudoBoard({
  room,
  playerId,
  onTokenClick,
  selectedToken,
  setSelectedToken,
  diceValue,
}: LudoBoardProps) {
  const [boardCells, setBoardCells] = useState<React.JSX.Element[][]>([])

  // Get player by ID
  const getMyPlayer = () => {
    return room.players.find((p) => p.id === playerId)
  }

  // Check if it's the current player's turn
  const isMyTurn = () => {
    const currentPlayer = room.players[room.currentTurn]
    return currentPlayer && currentPlayer.id === playerId
  }

  // Check if a token can be moved
  const canMoveToken = (token: Token) => {
    if (!isMyTurn() || diceValue === 0) return false

    // If token is in home, need a 6 to move out
    if (token.position === -1 && diceValue !== 6) return false

    // If token is already in final home, can't move
    if (token.isHome) return false

    return true
  }

  // Get position coordinates for a token
  const getTokenPosition = (player: PlayerColor, token: Token) => {
    // If token is in starting area
    if (token.position === -1) {
      const homeIndex = token.id % 4
      return HOME_POSITIONS[player][homeIndex]
    }

    // If token is on the board
    if (token.position >= 0 && token.position < PATHS[player].length) {
      return PATHS[player][token.position]
    }

    // Default fallback
    return [7, 7]
  }

  // Render the board
  useEffect(() => {
    const cells: React.JSX.Element[][] = []

    // Create empty board
    for (let y = 0; y < BOARD_SIZE; y++) {
      const row: React.JSX.Element[] = []
      for (let x = 0; x < BOARD_SIZE; x++) {
        // Determine cell color based on position
        let cellColor = "bg-white"

        // Red home area
        if (x < 6 && y < 6) {
          cellColor = "bg-red-100"
        }
        // Green home area
        else if (x < 6 && y > 8) {
          cellColor = "bg-green-100"
        }
        // Blue home area
        else if (x > 8 && y > 8) {
          cellColor = "bg-blue-100"
        }
        // Yellow home area
        else if (x > 8 && y < 6) {
          cellColor = "bg-yellow-100"
        }

        // Path cells
        const isRedPath = PATHS.red.some(([px, py]) => px === x && py === y)
        const isGreenPath = PATHS.green.some(([px, py]) => px === x && py === y)
        const isBluePath = PATHS.blue.some(([px, py]) => px === x && py === y)
        const isYellowPath = PATHS.yellow.some(([px, py]) => px === x && py === y)

        if (isRedPath) cellColor = "bg-red-200"
        if (isGreenPath) cellColor = "bg-green-200"
        if (isBluePath) cellColor = "bg-blue-200"
        if (isYellowPath) cellColor = "bg-yellow-200"

        // Safe cells (overlap of paths)
        if (
          (isRedPath && isGreenPath) ||
          (isRedPath && isBluePath) ||
          (isRedPath && isYellowPath) ||
          (isGreenPath && isBluePath) ||
          (isGreenPath && isYellowPath) ||
          (isBluePath && isYellowPath)
        ) {
          cellColor = "bg-purple-200"
        }

        // Center home
        if (x === 7 && y === 7) {
          cellColor = "bg-purple-300"
        }

        row.push(
          <div
            key={`${x}-${y}`}
            className={`${cellColor} border border-gray-300`}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              position: "relative",
            }}
          />,
        )
      }
      cells.push(row)
    }

    setBoardCells(cells)
  }, [])

  // Render tokens on the board
  const renderTokens = () => {
    return room.players.flatMap((player) => {
      return player.tokens.map((token) => {
        const [x, y] = getTokenPosition(player.color, token)

        // Determine if this token is movable
        const isMovable = player.id === playerId && canMoveToken(token)
        const isSelected = selectedToken === token.id && player.id === playerId

        // Token colors
        const tokenColors: Record<PlayerColor, string> = {
          red: "bg-red-500",
          green: "bg-green-500",
          blue: "bg-blue-500",
          yellow: "bg-yellow-500",
        }

        return (
          <div
            key={`token-${player.color}-${token.id}`}
            className={`absolute rounded-full border-2 border-white shadow-md flex items-center justify-center
              ${tokenColors[player.color]}
              ${isMovable ? "cursor-pointer animate-pulse" : ""}
              ${isSelected ? "ring-2 ring-white ring-offset-2" : ""}
            `}
            style={{
              width: CELL_SIZE * 0.7,
              height: CELL_SIZE * 0.7,
              left: x * CELL_SIZE + (CELL_SIZE - CELL_SIZE * 0.7) / 2,
              top: y * CELL_SIZE + (CELL_SIZE - CELL_SIZE * 0.7) / 2,
              zIndex: isSelected ? 20 : 10,
              transition: "all 0.3s ease",
            }}
            onClick={() => {
              if (isMovable) {
                if (isSelected) {
                  onTokenClick(token.id)
                } else {
                  setSelectedToken(token.id)
                }
              }
            }}
          >
            {(token.id % 4) + 1}
          </div>
        )
      })
    })
  }

  return (
    <div className="relative bg-white rounded-xl shadow-lg p-4 overflow-hidden">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
        }}
      >
        {boardCells.map((row, y) => row.map((cell, x) => <div key={`cell-${x}-${y}`}>{cell}</div>))}
      </div>

      {/* Render tokens on top of the board */}
      {renderTokens()}
    </div>
  )
}
