"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react"

interface DiceProps {
  value: number
  onRoll: () => void
  disabled: boolean
  isRolling: boolean
  canRollAgain: boolean
}

export default function Dice({ value, onRoll, disabled, isRolling, canRollAgain }: DiceProps) {
  const [animation, setAnimation] = useState(false)

  useEffect(() => {
    if (isRolling) {
      setAnimation(true)
    } else {
      setAnimation(false)
    }
  }, [isRolling])

  const renderDiceFace = () => {
    if (isRolling) {
      // Show random dice face during animation
      const randomFace = Math.floor(Math.random() * 6) + 1
      switch (randomFace) {
        case 1:
          return <Dice1 className="w-12 h-12" />
        case 2:
          return <Dice2 className="w-12 h-12" />
        case 3:
          return <Dice3 className="w-12 h-12" />
        case 4:
          return <Dice4 className="w-12 h-12" />
        case 5:
          return <Dice5 className="w-12 h-12" />
        case 6:
          return <Dice6 className="w-12 h-12" />
        default:
          return <Dice1 className="w-12 h-12" />
      }
    }

    // Show actual dice value
    switch (value) {
      case 1:
        return <Dice1 className="w-12 h-12" />
      case 2:
        return <Dice2 className="w-12 h-12" />
      case 3:
        return <Dice3 className="w-12 h-12" />
      case 4:
        return <Dice4 className="w-12 h-12" />
      case 5:
        return <Dice5 className="w-12 h-12" />
      case 6:
        return <Dice6 className="w-12 h-12" />
      default:
        return <div className="w-12 h-12 flex items-center justify-center text-slate-400">Roll</div>
    }
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-md flex flex-col items-center">
      <h3 className="text-lg font-medium mb-2">Dice</h3>

      <div
        className={`w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mb-3
          ${animation ? "animate-bounce" : ""}`}
      >
        {renderDiceFace()}
      </div>

      <Button onClick={onRoll} disabled={disabled} className="w-full">
        {isRolling ? "Rolling..." : "Roll Dice"}
      </Button>

      {canRollAgain && value === 6 && !isRolling && (
        <p className="text-sm text-green-600 mt-2">You rolled a 6! Roll again.</p>
      )}
    </div>
  )
}
