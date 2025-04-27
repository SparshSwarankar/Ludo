"use client"

import { useState, useEffect } from "react"
import { io, type Socket } from "socket.io-client"
import LudoBoard from "./ludo-board"
import RoomCreation from "./room-creation"
import PlayerInfo from "./player-info"
import Dice from "./dice"
import GameStatus from "./game-status"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

// Game states
export type GameState = "waiting" | "playing" | "finished"
export type PlayerColor = "red" | "green" | "blue" | "yellow"

export interface Player {
  id: string
  name: string
  color: PlayerColor
  tokens: Token[]
  isBot: boolean
}

export interface Token {
  id: number
  position: number // -1 means in home, 0-57 is on board
  isHome: boolean
  isSafe: boolean
}

export interface GameRoom {
  id: string
  players: Player[]
  currentTurn: number
  gameState: GameState
  winner: Player | null
  lastDiceRoll: number
  canRollAgain: boolean
}

let socket: Socket | null = null

export default function LudoGame() {
  const [connected, setConnected] = useState(false)
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [playerId, setPlayerId] = useState<string>("")
  const [diceValue, setDiceValue] = useState<number>(0)
  const [isRolling, setIsRolling] = useState(false)
  const [selectedToken, setSelectedToken] = useState<number | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Initialize socket connection
    const socketInitializer = async () => {
      // In production, this would be your deployed backend URL
      await fetch("/api/socket")

      socket = io()

      socket.on("connect", () => {
        setConnected(true)
        setPlayerId(socket!.id)
        console.log("Connected to socket server")
      })

      socket.on("roomCreated", (roomData: GameRoom) => {
        setRoom(roomData)
        toast({
          title: "Room Created!",
          description: `Share this Room ID: ${roomData.id}`,
        })
      })

      socket.on("roomJoined", (roomData: GameRoom) => {
        setRoom(roomData)
        toast({
          title: "Room Joined!",
          description: `You joined room: ${roomData.id}`,
        })
      })

      socket.on("gameUpdate", (roomData: GameRoom) => {
        setRoom(roomData)
      })

      socket.on("diceRolled", (data: { room: GameRoom; value: number }) => {
        setDiceValue(data.value)
        setRoom(data.room)
        setIsRolling(false)
      })

      socket.on("tokenMoved", (roomData: GameRoom) => {
        setRoom(roomData)
        setSelectedToken(null)
      })

      socket.on("gameOver", (roomData: GameRoom) => {
        setRoom(roomData)
        const winner = roomData.winner
        if (winner) {
          toast({
            title: `Game Over!`,
            description: `${winner.name} (${winner.color}) has won the game!`,
          })
        }
      })

      socket.on("error", (error: string) => {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        })
      })

      return () => {
        if (socket) {
          socket.disconnect()
        }
      }
    }

    socketInitializer()
  }, [toast])

  const createRoom = (playerName: string) => {
    if (socket) {
      socket.emit("createRoom", { playerName })
    }
  }

  const joinRoom = (roomId: string, playerName: string) => {
    if (socket) {
      socket.emit("joinRoom", { roomId, playerName })
    }
  }

  const startGame = () => {
    if (socket && room) {
      socket.emit("startGame", { roomId: room.id })
    }
  }

  const addBot = () => {
    if (socket && room) {
      socket.emit("addBot", { roomId: room.id })
    }
  }

  const rollDice = () => {
    if (socket && room) {
      setIsRolling(true)
      socket.emit("rollDice", { roomId: room.id, playerId })
    }
  }

  const moveToken = (tokenId: number) => {
    if (socket && room && diceValue > 0) {
      socket.emit("moveToken", { roomId: room.id, playerId, tokenId })
    }
  }

  const isMyTurn = () => {
    if (!room) return false
    const currentPlayer = room.players[room.currentTurn]
    return currentPlayer && currentPlayer.id === playerId
  }

  const getMyColor = (): PlayerColor | null => {
    if (!room) return null
    const myPlayer = room.players.find((p) => p.id === playerId)
    return myPlayer ? myPlayer.color : null
  }

  // If not connected to a room yet
  if (!room) {
    return <RoomCreation onCreateRoom={createRoom} onJoinRoom={joinRoom} connected={connected} />
  }

  return (
    <div className="w-full max-w-5xl flex flex-col items-center gap-6">
      {room.gameState === "waiting" ? (
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Waiting for players</h2>
          <p className="mb-2">
            Room ID: <span className="font-mono bg-slate-100 p-1 rounded">{room.id}</span>
          </p>
          <p className="mb-4">Players: {room.players.length}/4</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {room.players.map((player) => (
              <div
                key={player.id}
                className="px-3 py-1 rounded-full text-white text-sm"
                style={{ backgroundColor: player.color }}
              >
                {player.name} {player.isBot && "(Bot)"}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={startGame} disabled={room.players.length < 2} className="w-full">
              Start Game
            </Button>
            <Button onClick={addBot} variant="outline" disabled={room.players.length >= 4} className="w-full">
              Add Bot
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-3/4">
            <LudoBoard
              room={room}
              playerId={playerId}
              onTokenClick={moveToken}
              selectedToken={selectedToken}
              setSelectedToken={setSelectedToken}
              diceValue={diceValue}
            />
          </div>

          <div className="w-full md:w-1/4 flex flex-col gap-4">
            <PlayerInfo players={room.players} currentTurn={room.currentTurn} playerId={playerId} />

            <Dice
              value={diceValue}
              onRoll={rollDice}
              disabled={!isMyTurn() || isRolling}
              isRolling={isRolling}
              canRollAgain={room.canRollAgain}
            />

            <GameStatus gameState={room.gameState} winner={room.winner} myColor={getMyColor()} />
          </div>
        </div>
      )}
    </div>
  )
}
