import type { GameStats, GameSession } from "@/types/game"
import { ACHIEVEMENTS } from "@/constants/game"

export const getStoredStats = (): GameStats => {
  if (typeof window === "undefined") return getDefaultStats()

  const stored = localStorage.getItem("neon-snake-stats")
  if (!stored) return getDefaultStats()

  try {
    return JSON.parse(stored)
  } catch {
    return getDefaultStats()
  }
}

export const saveStats = (stats: GameStats) => {
  if (typeof window === "undefined") return
  localStorage.setItem("neon-snake-stats", JSON.stringify(stats))
}

export const getDefaultStats = (): GameStats => ({
  totalGames: 0,
  totalScore: 0,
  bestScore: 0,
  totalTime: 0,
  longestSnake: 0,
  foodEaten: {
    normal: 0,
    speed: 0,
    size: 0,
    shield: 0,
    teleport: 0,
  },
  evolutionsReached: {
    basic: 0,
    fast: 0,
    armored: 0,
    quantum: 0,
  },
  powerUpsUsed: {
    speed: 0,
    shield: 0,
    teleport: 0,
    size: 0,
  },
  levelsReached: [],
  achievements: [],
  lastPlayed: 0,
})

export const updateStatsAfterGame = (stats: GameStats, session: GameSession): GameStats => {
  const newStats = { ...stats }

  newStats.totalGames++
  newStats.totalScore += session.score
  newStats.bestScore = Math.max(newStats.bestScore, session.score)
  newStats.totalTime += session.timeAlive
  newStats.longestSnake = Math.max(newStats.longestSnake, session.snakeLength)
  newStats.lastPlayed = session.date

  // Add level to reached levels if not already there
  if (!newStats.levelsReached.includes(session.level)) {
    newStats.levelsReached.push(session.level)
  }

  return newStats
}

export const checkAchievements = (stats: GameStats, session: GameSession): string[] => {
  const newAchievements: string[] = []

  ACHIEVEMENTS.forEach((achievement) => {
    if (stats.achievements.includes(achievement.id)) return

    let earned = false

    switch (achievement.id) {
      case "first_game":
        earned = stats.totalGames >= 1
        break
      case "score_100":
        earned = session.score >= 100
        break
      case "score_500":
        earned = session.score >= 500
        break
      case "score_1000":
        earned = session.score >= 1000
        break
      case "evolution_fast":
        earned = session.evolution >= 1
        break
      case "evolution_armored":
        earned = session.evolution >= 2
        break
      case "evolution_quantum":
        earned = session.evolution >= 3
        break
      case "snake_20":
        earned = session.snakeLength >= 20
        break
      case "snake_50":
        earned = session.snakeLength >= 50
        break
      case "level_5":
        earned = session.level >= 5
        break
      case "level_10":
        earned = session.level >= 10
        break
      case "food_100":
        earned = Object.values(stats.foodEaten).reduce((a, b) => a + b, 0) >= 100
        break
      case "powerup_master":
        earned = Object.values(stats.powerUpsUsed).every((count) => count > 0)
        break
      case "survivor":
        earned = session.timeAlive >= 300 // 5 minutes
        break
      case "speed_demon":
        earned = stats.powerUpsUsed.speed >= 10
        break
    }

    if (earned) {
      newAchievements.push(achievement.id)
    }
  })

  return newAchievements
}

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

export const getRecentSessions = (): GameSession[] => {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem("neon-snake-sessions")
  if (!stored) return []

  try {
    return JSON.parse(stored).slice(-10) // Last 10 sessions
  } catch {
    return []
  }
}

export const saveSession = (session: GameSession) => {
  if (typeof window === "undefined") return

  const sessions = getRecentSessions()
  sessions.push(session)

  // Keep only last 50 sessions
  const recentSessions = sessions.slice(-50)
  localStorage.setItem("neon-snake-sessions", JSON.stringify(recentSessions))
}
