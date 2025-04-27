"use client"

import type { Player } from "./ludo-game"

interface PlayerInfoProps {
  players: Player[]
  currentTurn: number
  playerId: string
}

export default function PlayerInfo({ players, currentTurn, playerId }: PlayerInfoProps) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <h3 className="text-lg font-medium mb-3">Players</h3>

      <div className="space-y-2">
        {players.map((player, index) => {
          const isCurrentTurn = index === currentTurn
          const isMe = player.id === playerId

          return (
            <div
              key={player.id}
              className={`flex items-center p-2 rounded-lg ${isCurrentTurn ? "bg-slate-100 shadow-sm" : ""}`}
            >
              <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: player.color }} />
              <span className="flex-1">
                {player.name} {player.isBot && "(Bot)"} {isMe && "(You)"}
              </span>
              {isCurrentTurn && <span className="text-xs bg-slate-200 px-2 py-1 rounded-full">Current Turn</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
