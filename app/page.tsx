import LudoGame from "@/components/ludo-game"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-slate-800">Multiplayer Ludo Game</h1>
      <LudoGame />
    </main>
  )
}
