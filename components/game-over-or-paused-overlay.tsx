import { EVOLUTION_NAMES } from "@/constants/game"

interface GameOverOrPausedOverlayProps {
  score: number
  evolution: number 
  gameState: "gameOver" | "paused"
  startGame: () => void 
  resetGame: () => void
  showStats: () => void
  pauseGame: () => void
}

export default function GameOverOrPausedOverlay({
  score, 
  evolution, 
  gameState, 
  startGame, 
  resetGame,
  showStats,
  pauseGame
}: GameOverOrPausedOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-6 md:p-8 rounded-lg text-center max-w-md w-full">
        {gameState === "gameOver" ? (
          <>
            <h2 className="font-pixel text-3xl md:text-4xl font-bold text-red-400 mb-4">GAME OVER</h2>
            <p className="font-pixel text-xl md:text-2xl text-white mb-2">Pontuação Final: {score}</p>
            <p className="font-pixel text-lg text-gray-300 mb-6">Evolução: {EVOLUTION_NAMES[evolution]}</p>
            <div className="space-y-3">
              <button
                onClick={startGame}
                className="font-pixel w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
              >
                JOGAR NOVAMENTE
              </button>
              <button
                onClick={resetGame}
                className="font-pixel w-full py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors"
              >
                MENU PRINCIPAL
              </button>
              <button
                onClick={showStats}
                className="font-pixel w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors"
              >
                📊 VER ESTATÍSTICAS
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-pixel text-3xl md:text-4xl font-bold text-blue-400 mb-4">PAUSADO</h2>
            <div className="space-y-3">
              <button
                onClick={pauseGame}
                className="font-pixel w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
              >
                CONTINUAR
              </button>
              <button
                onClick={resetGame}
                className="font-pixel w-full py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors"
              >
                MENU PRINCIPAL
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}