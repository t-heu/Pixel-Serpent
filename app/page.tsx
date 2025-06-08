"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import type { SnakeSegment, Food, Obstacle, PowerUp, GameState, Position, GameStats, GameSession } from "@/types/game"
import { FOOD_TYPES, INITIAL_SPEED, ACHIEVEMENTS } from "@/constants/game"
import {
  getStoredStats,
  saveStats,
  updateStatsAfterGame,
  checkAchievements,
  saveSession,
  getDefaultStats,
} from "@/utils/game-utils"

import StatsScreen from "@/components/stats-screen"
import Home from "@/components/home"
import HeaderGame from "@/components/header"
import GameOverOrPausedOverlay from "@/components/game-over-or-paused-overlay"
import AdBanner from "../components/ad-banner"

export default function NeonSnakeFixed() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>(0)
  const lastMoveTime = useRef(0)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const gameStartTime = useRef(0)

  const [gameState, setGameState] = useState<GameState>("menu")
  const [stats, setStats] = useState<GameStats>(getDefaultStats())
  const [snake, setSnake] = useState<SnakeSegment[]>([
    { x: 10, y: 10, type: "head" },
    { x: 9, y: 10, type: "body" },
    { x: 8, y: 10, type: "tail" },
  ])
  const [direction, setDirection] = useState<Position>({ x: 1, y: 0 })
  const [nextDirection, setNextDirection] = useState<Position>({ x: 1, y: 0 })
  const [food, setFood] = useState<Food[]>([])
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [speed, setSpeed] = useState(INITIAL_SPEED)
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [evolution, setEvolution] = useState(0)
  const [gridWidth, setGridWidth] = useState(25)
  const [gridHeight, setGridHeight] = useState(20)
  const [newAchievements, setNewAchievements] = useState<string[]>([])

  // Load stats on mount
  useEffect(() => {
    setStats(getStoredStats())
  }, [])

  // Responsive grid sizing
  useEffect(() => {
    const updateGridSize = () => {
      const isMobile = window.innerWidth < 768
      if (isMobile) {
        setGridWidth(15)
        setGridHeight(20)
      } else {
        setGridWidth(25)
        setGridHeight(20)
      }
    }

    updateGridSize()
    window.addEventListener("resize", updateGridSize)
    return () => window.removeEventListener("resize", updateGridSize)
  }, [])

  const generateFood = useCallback(() => {
    const types = Object.keys(FOOD_TYPES) as (keyof typeof FOOD_TYPES)[]
    const randomType = types.find((type) => Math.random() < FOOD_TYPES[type].chance) || "normal"

    let position: Position
    let attempts = 0
    do {
      position = {
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight),
      }
      attempts++
      // Prevent infinite loop
      if (attempts > 50) return
    } while (
      snake.some((segment) => segment.x === position.x && segment.y === position.y) ||
      obstacles.some((obstacle) => obstacle.x === position.x && obstacle.y === position.y)
    )

    const newFood: Food = {
      ...position,
      type: randomType,
      value: FOOD_TYPES[randomType].value,
      color: FOOD_TYPES[randomType].color,
    }

    setFood((prev) => [...prev, newFood])
  }, [snake, obstacles, gridWidth, gridHeight])

  const generateObstacle = useCallback(() => {
    if (level < 3) return

    let position: Position
    let attempts = 0
    do {
      position = {
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight),
      }
      attempts++
      // Prevent infinite loop
      if (attempts > 50) return
    } while (
      snake.some((segment) => segment.x === position.x && segment.y === position.y) ||
      food.some((f) => f.x === position.x && f.y === position.y)
    )

    const newObstacle: Obstacle = {
      ...position,
      moving: Math.random() > 0.7,
      direction: { x: Math.random() > 0.5 ? 1 : -1, y: Math.random() > 0.5 ? 1 : -1 },
      speed: 0.1,
    }

    setObstacles((prev) => [...prev, newObstacle])
  }, [snake, food, level, gridWidth, gridHeight])

  const endGame = useCallback(() => {
    const timeAlive = Math.floor((Date.now() - gameStartTime.current) / 1000)

    const session: GameSession = {
      score,
      level,
      evolution,
      snakeLength: snake.length,
      timeAlive,
      foodEaten: Object.values(stats.foodEaten).reduce((a, b) => a + b, 0),
      powerUpsUsed: Object.values(stats.powerUpsUsed).reduce((a, b) => a + b, 0),
      date: Date.now(),
    }

    // Update stats
    const newStats = updateStatsAfterGame(stats, session)
    const achievements = checkAchievements(newStats, session)

    if (achievements.length > 0) {
      newStats.achievements.push(...achievements)
      setNewAchievements(achievements)
    }

    setStats(newStats)
    saveStats(newStats)
    saveSession(session)
    setGameState("gameOver")
  }, [score, level, evolution, snake.length, stats])

  const moveSnake = useCallback(() => {
    setDirection(nextDirection)

    setSnake((prevSnake) => {
      const head = prevSnake[0]
      const newHead: SnakeSegment = {
        x: head.x + nextDirection.x,
        y: head.y + nextDirection.y,
        type: "head",
      }

      // Teleport power-up wrapping
      const hasTeleport = powerUps.some((p) => p.type === "teleport" && p.active)
      if (hasTeleport) {
        if (newHead.x < 0) newHead.x = gridWidth - 1
        if (newHead.x >= gridWidth) newHead.x = 0
        if (newHead.y < 0) newHead.y = gridHeight - 1
        if (newHead.y >= gridHeight) newHead.y = 0
      } else {
        // Check wall collision
        if (newHead.x < 0 || newHead.x >= gridWidth || newHead.y < 0 || newHead.y >= gridHeight) {
          endGame()
          return prevSnake
        }
      }

      // Check self collision (unless shield is active)
      const hasShield = powerUps.some((p) => p.type === "shield" && p.active)
      if (!hasShield && prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        endGame()
        return prevSnake
      }

      // Check obstacle collision
      if (!hasShield && obstacles.some((obstacle) => obstacle.x === newHead.x && obstacle.y === newHead.y)) {
        endGame()
        return prevSnake
      }

      let newSnake = [newHead, ...prevSnake]

      // Check food collision
      const eatenFood = food.find((f) => f.x === newHead.x && f.y === newHead.y)
      if (eatenFood) {
        setScore((prev) => prev + eatenFood.value * 10)
        setFood((prev) => prev.filter((f) => f !== eatenFood))

        // Update food stats
        setStats((prev) => ({
          ...prev,
          foodEaten: {
            ...prev.foodEaten,
            [eatenFood.type]: prev.foodEaten[eatenFood.type] + 1,
          },
        }))

        // Apply food effects
        if (eatenFood.type === "speed") {
          setPowerUps((prev) => [...prev, { type: "speed", duration: 300, active: true }])
          setStats((prev) => ({
            ...prev,
            powerUpsUsed: { ...prev.powerUpsUsed, speed: prev.powerUpsUsed.speed + 1 },
          }))
        } else if (eatenFood.type === "shield") {
          setPowerUps((prev) => [...prev, { type: "shield", duration: 200, active: true }])
          setStats((prev) => ({
            ...prev,
            powerUpsUsed: { ...prev.powerUpsUsed, shield: prev.powerUpsUsed.shield + 1 },
          }))
        } else if (eatenFood.type === "teleport") {
          setPowerUps((prev) => [...prev, { type: "teleport", duration: 400, active: true }])
          setStats((prev) => ({
            ...prev,
            powerUpsUsed: { ...prev.powerUpsUsed, teleport: prev.powerUpsUsed.teleport + 1 },
          }))
        } else if (eatenFood.type === "size") {
          // Grow extra segments
          for (let i = 0; i < 2; i++) {
            const lastSegment = newSnake[newSnake.length - 1]
            newSnake.push({ ...lastSegment, type: "body" })
          }
          setStats((prev) => ({
            ...prev,
            powerUpsUsed: { ...prev.powerUpsUsed, size: prev.powerUpsUsed.size + 1 },
          }))
        }

        // Evolution check
        if (newSnake.length >= 10 && evolution === 0) {
          setEvolution(1)
          setStats((prev) => ({
            ...prev,
            evolutionsReached: { ...prev.evolutionsReached, fast: prev.evolutionsReached.fast + 1 },
          }))
        } else if (newSnake.length >= 20 && evolution === 1) {
          setEvolution(2)
          setStats((prev) => ({
            ...prev,
            evolutionsReached: { ...prev.evolutionsReached, armored: prev.evolutionsReached.armored + 1 },
          }))
        } else if (newSnake.length >= 35 && evolution === 2) {
          setEvolution(3)
          setStats((prev) => ({
            ...prev,
            evolutionsReached: { ...prev.evolutionsReached, quantum: prev.evolutionsReached.quantum + 1 },
          }))
        }

        // Don't remove tail when eating
      } else {
        // Remove tail
        newSnake.pop()
      }

      // Update segment types
      newSnake = newSnake.map((segment, index) => ({
        ...segment,
        type: index === 0 ? "head" : index === newSnake.length - 1 ? "tail" : "body",
      }))

      return newSnake
    })
  }, [nextDirection, food, obstacles, powerUps, gridWidth, gridHeight, evolution, endGame])

  const updateObstacles = useCallback(() => {
    setObstacles((prev) =>
      prev.map((obstacle) => {
        if (!obstacle.moving) return obstacle

        let newX = obstacle.x + obstacle.direction.x * obstacle.speed
        let newY = obstacle.y + obstacle.direction.y * obstacle.speed

        // Bounce off walls
        if (newX <= 0 || newX >= gridWidth - 1) {
          obstacle.direction.x *= -1
          newX = Math.max(0, Math.min(gridWidth - 1, newX))
        }
        if (newY <= 0 || newY >= gridHeight - 1) {
          obstacle.direction.y *= -1
          newY = Math.max(0, Math.min(gridHeight - 1, newY))
        }

        return { ...obstacle, x: Math.round(newX), y: Math.round(newY) }
      }),
    )
  }, [gridWidth, gridHeight])

  const updatePowerUps = useCallback(() => {
    setPowerUps((prev) =>
      prev.map((powerUp) => ({ ...powerUp, duration: powerUp.duration - 1 })).filter((powerUp) => powerUp.duration > 0),
    )

    // Update speed based on power-ups
    const hasSpeedBoost = powerUps.some((p) => p.type === "speed" && p.active)
    const evolutionSpeedBonus = evolution * 20
    setSpeed(hasSpeedBoost ? INITIAL_SPEED - 50 - evolutionSpeedBonus : INITIAL_SPEED - evolutionSpeedBonus)
  }, [powerUps, evolution])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const cellSize = Math.min(canvas.width / gridWidth, canvas.height / gridHeight)
    const hasShield = powerUps.some((p) => p.type === "shield" && p.active)

    // Clear canvas
    ctx.fillStyle = "#0f172a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid (simplified)
    ctx.strokeStyle = "#1e293b"
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.3
    for (let x = 0; x <= gridWidth; x += 2) {
      ctx.beginPath()
      ctx.moveTo(x * cellSize, 0)
      ctx.lineTo(x * cellSize, gridHeight * cellSize)
      ctx.stroke()
    }
    for (let y = 0; y <= gridHeight; y += 2) {
      ctx.beginPath()
      ctx.moveTo(0, y * cellSize)
      ctx.lineTo(gridWidth * cellSize, y * cellSize)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Draw food
    food.forEach((f) => {
      const x = f.x * cellSize
      const y = f.y * cellSize

      // Simple glow
      ctx.shadowColor = f.color
      ctx.shadowBlur = 8
      ctx.fillStyle = f.color
      ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4)
      ctx.shadowBlur = 0

      // Special food indicators
      if (f.type !== "normal") {
        ctx.fillStyle = "white"
        ctx.font = `${cellSize / 3}px Arial`
        ctx.textAlign = "center"
        const symbol = f.type === "speed" ? "⚡" : f.type === "shield" ? "🛡️" : f.type === "teleport" ? "🌀" : "+"
        ctx.fillText(symbol, x + cellSize / 2, y + cellSize / 2 + cellSize / 6)
      }
    })

    // Draw obstacles
    obstacles.forEach((obstacle) => {
      const x = obstacle.x * cellSize
      const y = obstacle.y * cellSize

      ctx.fillStyle = obstacle.moving ? "#dc2626" : "#7f1d1d"
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2)

      if (obstacle.moving) {
        ctx.fillStyle = "#fca5a5"
        ctx.fillRect(x + cellSize / 4, y + cellSize / 4, cellSize / 2, cellSize / 2)
      }
    })

    // Draw snake
    const baseColor = ["#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b"][evolution]

    snake.forEach((segment, index) => {
      const x = segment.x * cellSize
      const y = segment.y * cellSize

      // Shield effect
      if (hasShield) {
        ctx.shadowColor = "#8b5cf6"
        ctx.shadowBlur = 8
      }

      // Segment body
      ctx.fillStyle = baseColor
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2)

      // Head details
      if (segment.type === "head") {
        ctx.fillStyle = "white"
        ctx.fillRect(x + cellSize / 3, y + cellSize / 4, 3, 3) // eye 1
        ctx.fillRect(x + (2 * cellSize) / 3, y + cellSize / 4, 3, 3) // eye 2

        // Evolution effects
        if (evolution >= 2) {
          ctx.fillStyle = "#fbbf24"
          ctx.fillRect(x, y, cellSize, 2) // armor top
          ctx.fillRect(x, y + cellSize - 2, cellSize, 2) // armor bottom
        }
      }

      // Tail glow
      if (segment.type === "tail") {
        const alpha = Math.sin(Date.now() * 0.005) * 0.3 + 0.7
        ctx.globalAlpha = alpha
        ctx.fillStyle = baseColor
        ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4)
        ctx.globalAlpha = 1
      }

      ctx.shadowBlur = 0
    })
  }, [snake, food, obstacles, powerUps, evolution, gridWidth, gridHeight])

  const gameLoop = useCallback(
    (timestamp: number) => {
      if (gameState !== "playing") return

      // Update game state at fixed intervals
      if (timestamp - lastMoveTime.current >= speed) {
        moveSnake()
        updateObstacles()
        updatePowerUps()
        lastMoveTime.current = timestamp

        // Generate food
        if (food.length < 3 && Math.random() < 0.3) {
          generateFood()
        }

        // Generate obstacles
        if (obstacles.length < level && Math.random() < 0.1) {
          generateObstacle()
        }

        // Level progression
        if (score > level * 200) {
          setLevel((prev) => prev + 1)
        }
      }

      // Render at every frame for smooth animation
      render()

      gameLoopRef.current = requestAnimationFrame(gameLoop)
    },
    [
      gameState,
      speed,
      moveSnake,
      updateObstacles,
      updatePowerUps,
      food.length,
      obstacles.length,
      generateFood,
      generateObstacle,
      score,
      level,
      render,
    ],
  )

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const minSwipeDistance = 30

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0 && direction.x !== -1) setNextDirection({ x: 1, y: 0 })
        else if (deltaX < 0 && direction.x !== 1) setNextDirection({ x: -1, y: 0 })
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0 && direction.y !== -1) setNextDirection({ x: 0, y: 1 })
        else if (deltaY < 0 && direction.y !== 1) setNextDirection({ x: 0, y: -1 })
      }
    }

    touchStartRef.current = null
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState === "playing") {
        switch (e.key) {
          case "ArrowUp":
          case "w":
          case "W":
            if (direction.y !== 1) setNextDirection({ x: 0, y: -1 })
            break
          case "ArrowDown":
          case "s":
          case "S":
            if (direction.y !== -1) setNextDirection({ x: 0, y: 1 })
            break
          case "ArrowLeft":
          case "a":
          case "A":
            if (direction.x !== 1) setNextDirection({ x: -1, y: 0 })
            break
          case "ArrowRight":
          case "d":
          case "D":
            if (direction.x !== -1) setNextDirection({ x: 1, y: 0 })
            break
          case " ":
            e.preventDefault()
            setGameState("paused")
            break
        }
      } else if (gameState === "paused" && e.key === " ") {
        e.preventDefault()
        setGameState("playing")
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [direction, gameState])

  // Game loop
  useEffect(() => {
    if (gameState === "playing") {
      lastMoveTime.current = performance.now()
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    } else if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameLoop, gameState])

  const startGame = () => {
    setGameState("playing")
    gameStartTime.current = Date.now()
    setSnake([
      { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2), type: "head" },
      { x: Math.floor(gridWidth / 2) - 1, y: Math.floor(gridHeight / 2), type: "body" },
      { x: Math.floor(gridWidth / 2) - 2, y: Math.floor(gridHeight / 2), type: "tail" },
    ])
    setDirection({ x: 1, y: 0 })
    setNextDirection({ x: 1, y: 0 })
    setFood([])
    setObstacles([])
    setScore(0)
    setLevel(1)
    setEvolution(0)
    setPowerUps([])
    setNewAchievements([])
    generateFood()
  }

  const pauseGame = () => {
    setGameState(gameState === "paused" ? "playing" : "paused")
  }

  const resetGame = () => {
    setGameState("menu")
  }

  const showStats = () => {
    setGameState("stats")
  }

  const resetStats = () => {
    const defaultStats = getDefaultStats()
    setStats(defaultStats)
    saveStats(defaultStats)
    if (typeof window !== "undefined") {
      localStorage.removeItem("neon-snake-sessions")
    }
  }

  if (gameState === "stats") {
    return <StatsScreen stats={stats} onBack={() => setGameState("menu")} onResetStats={resetStats} />
  }

  if (gameState === "menu") {
    return (
      <Home showStats={showStats} startGame={startGame} stats={stats} />
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-2 md:p-4">
      {/* Header */}
      <HeaderGame 
        score={score}
        snake={snake}
        evolution={evolution}
        level={level}
        gameState={gameState}
        pauseGame={pauseGame}
        resetGame={resetGame}
      />

      {/* New Achievements Notification */}
      {newAchievements.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {newAchievements.map((achievementId) => {
            const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId)
            return (
              <div key={achievementId} className="bg-yellow-600 text-white p-3 rounded-lg shadow-lg animate-bounce">
                <div className="font-pixel font-bold">🏆 Nova Conquista!</div>
                <div className="font-pixel text-sm">{achievement?.name}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Power-ups display */}
      {powerUps.length > 0 && (
        <div className="flex gap-2 mb-4 justify-center">
          {powerUps.map((powerUp, index) => (
            <div key={index} className="px-3 py-1 bg-purple-600 rounded-full text-xs font-bold flex items-center gap-1">
              {powerUp.type === "speed" && "⚡"}
              {powerUp.type === "shield" && "🛡️"}
              {powerUp.type === "teleport" && "🌀"}
              <span>{Math.ceil(powerUp.duration / 60)}s</span>
            </div>
          ))}
        </div>
      )}

      {/* Game Canvas */}
      <div className="flex justify-center mb-4">
        <canvas
          ref={canvasRef}
          width={gridWidth * 20}
          height={gridHeight * 20}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="border-2 border-slate-600 bg-slate-800 rounded-lg max-w-full h-auto"
          style={{ touchAction: "none", imageRendering: "pixelated" }}
        />
      </div>

      {/* Mobile Controls */}
      <div className="md:hidden">
        <div className="grid grid-cols-3 gap-2 max-w-48 mx-auto">
          <div></div>
          <button
            onTouchStart={() => direction.y !== 1 && setNextDirection({ x: 0, y: -1 })}
            className="bg-slate-700 hover:bg-slate-600 p-4 rounded-lg text-2xl active:bg-slate-500"
          >
            ⬆️
          </button>
          <div></div>
          <button
            onTouchStart={() => direction.x !== 1 && setNextDirection({ x: -1, y: 0 })}
            className="bg-slate-700 hover:bg-slate-600 p-4 rounded-lg text-2xl active:bg-slate-500"
          >
            ⬅️
          </button>
          <button
            onTouchStart={pauseGame}
            className="bg-blue-600 hover:bg-blue-500 p-4 rounded-lg text-xl active:bg-blue-400"
          >
            {gameState === "paused" ? "▶️" : "⏸️"}
          </button>
          <button
            onTouchStart={() => direction.x !== -1 && setNextDirection({ x: 1, y: 0 })}
            className="bg-slate-700 hover:bg-slate-600 p-4 rounded-lg text-2xl active:bg-slate-500"
          >
            ➡️
          </button>
          <div></div>
          <button
            onTouchStart={() => direction.y !== -1 && setNextDirection({ x: 0, y: 1 })}
            className="bg-slate-700 hover:bg-slate-600 p-4 rounded-lg text-2xl active:bg-slate-500"
          >
            ⬇️
          </button>
          <div></div>
        </div>
      </div>

      <AdBanner
        dataAdFormat="auto"
        dataFullWidthResponsive={true}
        dataAdSlot="9380851329"
      />

      {/* Game Over / Paused Overlay */}
      {(gameState === "gameOver" || gameState === "paused") && (
        <GameOverOrPausedOverlay 
          gameState={gameState}
          pauseGame={pauseGame}
          resetGame={resetGame}
          startGame={startGame}
          showStats={showStats}
          score={score}
          evolution={evolution}
        />
      )}
    </div>
  )
}
