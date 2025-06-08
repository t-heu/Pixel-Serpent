export interface Position {
  x: number
  y: number
}

export interface SnakeSegment extends Position {
  type: "head" | "body" | "tail"
}

export interface Food extends Position {
  type: "normal" | "speed" | "size" | "shield" | "teleport"
  value: number
  color: string
}

export interface Obstacle extends Position {
  moving: boolean
  direction: { x: number; y: number }
  speed: number
}

export interface PowerUp {
  type: "speed" | "shield" | "teleport" | "size"
  duration: number
  active: boolean
}

export interface GameStats {
  totalGames: number
  totalScore: number
  bestScore: number
  totalTime: number
  longestSnake: number
  foodEaten: {
    normal: number
    speed: number
    size: number
    shield: number
    teleport: number
  }
  evolutionsReached: {
    basic: number
    fast: number
    armored: number
    quantum: number
  }
  powerUpsUsed: {
    speed: number
    shield: number
    teleport: number
    size: number
  }
  levelsReached: number[]
  achievements: string[]
  lastPlayed: number
}

export interface GameSession {
  score: number
  level: number
  evolution: number
  snakeLength: number
  timeAlive: number
  foodEaten: number
  powerUpsUsed: number
  date: number
}

export type GameState = "menu" | "playing" | "paused" | "gameOver" | "stats"
