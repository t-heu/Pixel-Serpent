import type { GameStats } from "@/types/game"

interface HomeProps {
  stats: GameStats
  startGame: () => void 
  showStats: () => void
}

export default function Home({
  stats, 
  startGame, 
  showStats,
}: HomeProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <h1 className="font-pixel text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-6">
          Pixel Serpent
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8">Evolua sua cobra coletando poderes especiais!</p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <div className="bg-slate-800 p-3 rounded-lg">
            <div className="text-green-400 font-bold">{stats.bestScore.toLocaleString()}</div>
            <div className="text-gray-400">Melhor Pontuação</div>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg">
            <div className="text-blue-400 font-bold">{stats.totalGames}</div>
            <div className="text-gray-400">Jogos Totais</div>
          </div>
        </div>

        <div className="space-y-4 text-gray-400 mb-8 text-sm md:text-base">
          <p>🍎 Comida verde: Crescimento básico</p>
          <p>⚡ Comida azul: Velocidade temporária</p>
          <p>🛡️ Comida roxa: Escudo protetor</p>
          <p>🌀 Comida rosa: Atravessar paredes</p>
          <p>➕ Comida laranja: Crescimento extra</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={startGame}
            className="font-pixel w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold text-xl rounded-lg transition-colors shadow-lg"
          >
            COMEÇAR JOGO
          </button>

          <button
            onClick={showStats}
            className="font-pixel w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors"
          >
            📊 ESTATÍSTICAS
          </button>

          <div className="text-xs md:text-sm text-gray-500 space-y-1">
            <p>🖱️ Desktop: Use WASD ou setas</p>
            <p>📱 Mobile: Deslize para mover</p>
            <p>⏸️ Espaço para pausar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
