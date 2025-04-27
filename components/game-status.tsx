"use client"

import type { GameState, Player, PlayerColor } from "./ludo-game"

interface GameStatusProps {
  gameState: GameState
  winner: Player | null
  myColor: PlayerColor | null
}

export default function GameStatus({ gameState, winner, myColor }: GameStatusProps) {
  if (gameState === "waiting") {
    return (
      <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-lg font-medium mb-2">Game Status</h3>
        <p>Waiting for players to join...</p>
      </div>
    )
  }

  if (gameState === "finished" && winner) {
    const isWinner = myColor === winner.color

    return (
      <div className={`p-4 rounded-xl shadow-md ${isWinner ? "bg-green-100" : "bg-red-100"}`}>
        <h3 className="text-lg font-medium mb-2">Game Over</h3>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: winner.color }} />
          <span className="font-medium">{winner.name} wins!</span>
        </div>

        {isWinner ? (
          <p className="mt-2 text-green-700">Congratulations! You won! 🎉</p>
        ) : (
          <p className="mt-2 text-red-700">Better luck next time!</p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <h3 className="text-lg font-medium mb-2">Game Status</h3>
      <p>Game in progress</p>
      <ul className="mt-2 text-sm text-slate-600 list-disc list-inside">
        <li>Roll a 6 to move a token out of home</li>
        <li>Land on an opponent to send them home</li>
        <li>Get all 4 tokens to the center to win</li>
      </ul>
    </div>
  )
}
