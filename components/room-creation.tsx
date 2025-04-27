"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"

interface RoomCreationProps {
  onCreateRoom: (playerName: string) => void
  onJoinRoom: (roomId: string, playerName: string) => void
  connected: boolean
}

export default function RoomCreation({ onCreateRoom, onJoinRoom, connected }: RoomCreationProps) {
  const [playerName, setPlayerName] = useState("")
  const [roomId, setRoomId] = useState("")

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome to Ludo!</CardTitle>
        <CardDescription>Create a new game or join an existing one</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label htmlFor="playerName">Your Name</Label>
          <Input
            id="playerName"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="mt-1"
          />
        </div>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Room</TabsTrigger>
            <TabsTrigger value="join">Join Room</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-4">
            <p className="text-sm text-slate-500 mb-4">
              Create a new game room and invite friends to join with the room code.
            </p>
            <Button onClick={() => onCreateRoom(playerName)} disabled={!playerName || !connected} className="w-full">
              Create New Room
            </Button>
          </TabsContent>

          <TabsContent value="join" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="roomId">Room Code</Label>
                <Input
                  id="roomId"
                  placeholder="Enter room code"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={() => onJoinRoom(roomId, playerName)}
                disabled={!roomId || !playerName || !connected}
                className="w-full"
              >
                Join Room
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-xs text-slate-500">{connected ? "Connected to server" : "Connecting to server..."}</p>
      </CardFooter>
    </Card>
  )
}
