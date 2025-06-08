import { EVOLUTION_NAMES } from "@/constants/game"
import type { SnakeSegment } from "@/types/game"

interface HeaderProps {
  score: number
  evolution: number 
  gameState: "playing" | "paused" | "gameOver"
  level: number
  snake: SnakeSegment[]
  resetGame: () => void
  pauseGame: () => void
}

export default function Header({
  score, 
  evolution, 
  gameState, 
  level, 
  resetGame,
  snake,
  pauseGame
}: HeaderProps) {
  return (
    <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
      <div className="flex gap-4 md:gap-6 text-sm md:text-base">
        <div className="text-green-400">
          <div className="font-pixel text-xs opacity-75">PONTOS</div>
          <div className="font-pixel font-bold">{score}</div>
        </div>
        <div className="text-blue-400">
          <div className="font-pixel text-xs opacity-75">NÍVEL</div>
          <div className="font-pixel font-bold">{level}</div>
        </div>
        <div className="text-purple-400">
          <div className="font-pixel text-xs opacity-75">EVOLUÇÃO</div>
          <div className="font-pixel font-bold">{EVOLUTION_NAMES[evolution]}</div>
        </div>
        <div className="text-yellow-400">
          <div className="font-pixel text-xs opacity-75">TAMANHO</div>
          <div className="font-pixel font-bold">{snake.length}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={pauseGame}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold transition-colors"
        >
          {gameState === "paused" ? "▶️" : "⏸️"}
        </button>
        <button
          onClick={resetGame}
          className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm font-bold transition-colors"
        >
          🏠
        </button>
      </div>
    </div>
  );
}
