"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import type { SnakeSegment, Food, Obstacle, PowerUp, GameState, Position, GameStats, GameSession } from "@/types/game"
import {
  FOOD_TYPES,
  INITIAL_SPEED,
  EVOLUTION_NAMES,
  EVOLUTION_COLORS,
  EVOLUTION_REQUIREMENTS,
  EVOLUTION_ABILITIES,
  ACHIEVEMENTS,
} from "@/constants/game"
import {
  getStoredStats,
  saveStats,
  updateStatsAfterGame,
  checkAchievements,
  saveSession,
  getDefaultStats,
} from "@/utils/game-utils"
import StatsScreen from "@/components/stats-screen"
import AdBanner from "@/components/ad-banner"

type SpecialAbilities = {
  ghostWalk: number;
  magneticPull: number;
  crystalBonus: number;
  autoTeleport: number;
};

type EvolutionStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export default function NeonSnakePerformance() {
  // Refs para performance crítica
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>(0)
  const renderLoopRef = useRef<number>(0)
  const lastUpdateTime = useRef(0)
  const lastRenderTime = useRef(0)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const gameStartTime = useRef(0)

  // Refs para valores que mudam frequentemente (evita re-renders)
  const snakeRef = useRef<SnakeSegment[]>([])
  const directionRef = useRef<Position>({ x: 1, y: 0 })
  const nextDirectionRef = useRef<Position>({ x: 1, y: 0 })
  const foodRef = useRef<Food[]>([])
  const obstaclesRef = useRef<Obstacle[]>([])
  const powerUpsRef = useRef<PowerUp[]>([])
  const scoreRef = useRef(0)
  const levelRef = useRef(1)
  const evolutionRef = useRef<EvolutionStage>(0)
  const speedRef = useRef(INITIAL_SPEED)
  const gameStateRef = useRef<GameState>("menu")
  const specialAbilitiesRef = useRef<SpecialAbilities>({
    ghostWalk: 0,
    magneticPull: 0,
    crystalBonus: 0,
    autoTeleport: 0,
  });

  // Estados para UI (atualizados imediatamente)
  const [gameState, setGameState] = useState<GameState>("menu")
  const [stats, setStats] = useState<GameStats>(getDefaultStats())
  const [displayScore, setDisplayScore] = useState(0)
  const [displayLevel, setDisplayLevel] = useState(1)
  const [displayEvolution, setDisplayEvolution] = useState(0)
  const [displaySnakeLength, setDisplaySnakeLength] = useState(3)
  const [displayPowerUps, setDisplayPowerUps] = useState<PowerUp[]>([])
  const [newAchievements, setNewAchievements] = useState<string[]>([])
  const [gridWidth, setGridWidth] = useState(25)
  const [gridHeight, setGridHeight] = useState(20)

  // Memoized canvas dimensions
  const canvasSize = useMemo(() => {
    const cellSize = 20
    return {
      width: gridWidth * cellSize,
      height: gridHeight * cellSize,
      cellSize,
    }
  }, [gridWidth, gridHeight])

  // Load stats on mount
  useEffect(() => {
    setStats(getStoredStats())
  }, [])

  // Responsive grid sizing
  useEffect(() => {
    const updateGridSize = () => {
      const isMobile = window.innerWidth < 768
      setGridWidth(isMobile ? 15 : 25)
      setGridHeight(20)
    }

    updateGridSize()
    window.addEventListener("resize", updateGridSize)
    return () => window.removeEventListener("resize", updateGridSize)
  }, [])

  // Sync refs with game state changes
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  // Função para atualizar UI imediatamente
  const updateUIImmediate = useCallback(() => {
    setDisplayScore(scoreRef.current)
    setDisplayLevel(levelRef.current)
    setDisplayEvolution(evolutionRef.current)
    setDisplaySnakeLength(snakeRef.current.length)
    setDisplayPowerUps([...powerUpsRef.current])
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
      if (attempts > 20) return // Prevent infinite loops
    } while (
      snakeRef.current.some((segment) => segment.x === position.x && segment.y === position.y) ||
      obstaclesRef.current.some((obstacle) => obstacle.x === position.x && obstacle.y === position.y)
    )

    const newFood: Food = {
      ...position,
      type: randomType,
      value: FOOD_TYPES[randomType].value,
      color: FOOD_TYPES[randomType].color,
    }

    foodRef.current = [...foodRef.current, newFood]
  }, [gridWidth, gridHeight])

  const generateObstacle = useCallback(() => {
    if (levelRef.current < 3) return

    let position: Position
    let attempts = 0
    do {
      position = {
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight),
      }
      attempts++
      if (attempts > 20) return
    } while (
      snakeRef.current.some((segment) => segment.x === position.x && segment.y === position.y) ||
      foodRef.current.some((f) => f.x === position.x && f.y === position.y)
    )

    const newObstacle: Obstacle = {
      ...position,
      moving: Math.random() > 0.7,
      direction: { x: Math.random() > 0.5 ? 1 : -1, y: Math.random() > 0.5 ? 1 : -1 },
      speed: 0.1,
    }

    obstaclesRef.current = [...obstaclesRef.current, newObstacle]
  }, [gridWidth, gridHeight])

  // Função para aplicar habilidades especiais baseadas na evolução
  const applyEvolutionAbilities = useCallback(
    (head: SnakeSegment) => {
      const abilities = EVOLUTION_ABILITIES[evolutionRef.current] || []

      // Magnetismo - atrai comida próxima
      if (abilities.includes("food_magnet") || abilities.includes("divine_power")) {
        foodRef.current.forEach((food) => {
          const distance = Math.abs(food.x - head.x) + Math.abs(food.y - head.y)
          if (distance <= 3) {
            // Move food closer to snake
            if (food.x < head.x) food.x++
            else if (food.x > head.x) food.x--
            if (food.y < head.y) food.y++
            else if (food.y > head.y) food.y--

            specialAbilitiesRef.current.magneticPull++
          }
        })
      }

      // Auto-teleport quando em perigo
      if (abilities.includes("auto_teleport") || abilities.includes("divine_power")) {
        const nextX = head.x + nextDirectionRef.current.x
        const nextY = head.y + nextDirectionRef.current.y

        // Check if next position is dangerous
        const wouldHitWall = nextX < 0 || nextX >= gridWidth || nextY < 0 || nextY >= gridHeight
        const wouldHitSelf = snakeRef.current.some((segment) => segment.x === nextX && segment.y === nextY)
        const wouldHitObstacle = obstaclesRef.current.some((obstacle) => obstacle.x === nextX && obstacle.y === nextY)

        if (wouldHitWall || wouldHitSelf || wouldHitObstacle) {
          // Find safe position
          let safePosition: Position | null = null
          for (let attempts = 0; attempts < 50; attempts++) {
            const testPos = {
              x: Math.floor(Math.random() * gridWidth),
              y: Math.floor(Math.random() * gridHeight),
            }

            const isSafe =
              !snakeRef.current.some((segment) => segment.x === testPos.x && segment.y === testPos.y) &&
              !obstaclesRef.current.some((obstacle) => obstacle.x === testPos.x && obstacle.y === testPos.y)

            if (isSafe) {
              safePosition = testPos
              break
            }
          }

          if (safePosition) {
            snakeRef.current[0].x = safePosition.x
            snakeRef.current[0].y = safePosition.y
            specialAbilitiesRef.current.autoTeleport++
            return true // Teleported successfully
          }
        }
      }

      return false
    },
    [gridWidth, gridHeight],
  )

  const endGame = useCallback(() => {
    const timeAlive = Math.floor((Date.now() - gameStartTime.current) / 1000)

    const session: GameSession = {
      score: scoreRef.current,
      level: levelRef.current,
      evolution: evolutionRef.current,
      snakeLength: snakeRef.current.length,
      timeAlive,
      foodEaten: Object.values(stats.foodEaten).reduce((a, b) => a + b, 0),
      powerUpsUsed: Object.values(stats.powerUpsUsed).reduce((a, b) => a + b, 0),
      date: Date.now(),
    }

    // Update stats
    const newStats = updateStatsAfterGame(stats, session)

    newStats.specialAbilitiesUsed ??= {
      ghostWalk: 0,
      magneticPull: 0,
      crystalBonus: 0,
      autoTeleport: 0,
    };

    // Add special abilities to stats
    newStats.specialAbilitiesUsed.ghostWalk += specialAbilitiesRef.current.ghostWalk
    newStats.specialAbilitiesUsed.magneticPull += specialAbilitiesRef.current.magneticPull
    newStats.specialAbilitiesUsed.crystalBonus += specialAbilitiesRef.current.crystalBonus
    newStats.specialAbilitiesUsed.autoTeleport += specialAbilitiesRef.current.autoTeleport

    const achievements = checkAchievements(newStats, session)

    if (achievements.length > 0) {
      newStats.achievements.push(...achievements)
      setNewAchievements(achievements)
    }

    setStats(newStats)
    saveStats(newStats)
    saveSession(session)
    setGameState("gameOver")
  }, [stats])

  const moveSnake = useCallback(() => {
    directionRef.current = nextDirectionRef.current
    const head = snakeRef.current[0]
    if (!head) return

    // Apply evolution abilities before moving
    const teleported = applyEvolutionAbilities(head)
    if (teleported) return // Skip normal movement if teleported

    const newHead: SnakeSegment = {
      x: head.x + nextDirectionRef.current.x,
      y: head.y + nextDirectionRef.current.y,
      type: "head",
    }

    const abilities = EVOLUTION_ABILITIES[evolutionRef.current] || []

    // Teleport power-up wrapping or quantum tunnel
    const hasTeleport = powerUpsRef.current.some((p) => p.type === "teleport" && p.active)
    const hasQuantumTunnel = abilities.includes("quantum_tunnel") || abilities.includes("divine_power")

    if (hasTeleport || hasQuantumTunnel) {
      if (newHead.x < 0) newHead.x = gridWidth - 1
      if (newHead.x >= gridWidth) newHead.x = 0
      if (newHead.y < 0) newHead.y = gridHeight - 1
      if (newHead.y >= gridHeight) newHead.y = 0
    } else {
      // Check wall collision
      if (newHead.x < 0 || newHead.x >= gridWidth || newHead.y < 0 || newHead.y >= gridHeight) {
        endGame()
        return
      }
    }

    // Check self collision (unless shield is active or armor)
    const hasShield = powerUpsRef.current.some((p) => p.type === "shield" && p.active)
    const hasArmor = abilities.includes("armor") || abilities.includes("divine_power")

    if (
      !hasShield &&
      !hasArmor &&
      snakeRef.current.some((segment) => segment.x === newHead.x && segment.y === newHead.y)
    ) {
      endGame()
      return
    }

    // Check obstacle collision (ghost mode can pass through)
    const hasGhostMode = abilities.includes("ghost_mode") || abilities.includes("divine_power")
    const obstacleHit = obstaclesRef.current.some((obstacle) => obstacle.x === newHead.x && obstacle.y === newHead.y)

    if (obstacleHit) {
      if (hasGhostMode) {
        specialAbilitiesRef.current.ghostWalk++
      } else if (!hasShield && !hasArmor) {
        endGame()
        return
      }
    }

    let newSnake = [newHead, ...snakeRef.current]

    // Check food collision
    const eatenFood = foodRef.current.find((f) => f.x === newHead.x && f.y === newHead.y)
    if (eatenFood) {
      let points = eatenFood.value * 10

      // Crystal evolution doubles points
      const hasCrystalPower = abilities.includes("double_points") || abilities.includes("divine_power")
      if (hasCrystalPower) {
        points *= 2
        specialAbilitiesRef.current.crystalBonus += points / 2
      }

      scoreRef.current += points
      foodRef.current = foodRef.current.filter((f) => f !== eatenFood)

      // Atualizar UI imediatamente
      updateUIImmediate()

      // Update stats
      setStats((prev) => ({
        ...prev,
        foodEaten: {
          ...prev.foodEaten,
          [eatenFood.type]: prev.foodEaten[eatenFood.type] + 1,
        },
      }))

      // Apply food effects
      if (eatenFood.type === "speed") {
        powerUpsRef.current = [...powerUpsRef.current, { type: "speed", duration: 300, active: true }]
        setStats((prev) => ({
          ...prev,
          powerUpsUsed: { ...prev.powerUpsUsed, speed: prev.powerUpsUsed.speed + 1 },
        }))
      } else if (eatenFood.type === "shield") {
        powerUpsRef.current = [...powerUpsRef.current, { type: "shield", duration: 200, active: true }]
        setStats((prev) => ({
          ...prev,
          powerUpsUsed: { ...prev.powerUpsUsed, shield: prev.powerUpsUsed.shield + 1 },
        }))
      } else if (eatenFood.type === "teleport") {
        powerUpsRef.current = [...powerUpsRef.current, { type: "teleport", duration: 400, active: true }]
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
      for (let i = EVOLUTION_REQUIREMENTS.length - 1; i > evolutionRef.current; i--) {
        if (newSnake.length >= EVOLUTION_REQUIREMENTS[i]) {
          evolutionRef.current = i as EvolutionStage

          // Update evolution stats
          const evolutionKeys = [
            "basic",
            "fast",
            "armored",
            "quantum",
            "ghost",
            "magnetic",
            "crystal",
            "cosmic",
            "divine",
          ] as const
          if (evolutionKeys[i]) {
            setStats((prev) => ({
              ...prev,
              evolutionsReached: {
                ...prev.evolutionsReached,
                [evolutionKeys[i]]: prev.evolutionsReached[evolutionKeys[i]] + 1,
              },
            }))
          }
          break
        }
      }
    } else {
      // Remove tail
      newSnake.pop()
    }

    // Update segment types
    newSnake = newSnake.map((segment, index) => ({
      ...segment,
      type: index === 0 ? "head" : index === newSnake.length - 1 ? "tail" : "body",
    }))

    snakeRef.current = newSnake

    // Atualizar UI imediatamente após movimento
    updateUIImmediate()
  }, [gridWidth, gridHeight, endGame, applyEvolutionAbilities, updateUIImmediate])

  const updateObstacles = useCallback(() => {
    obstaclesRef.current = obstaclesRef.current.map((obstacle) => {
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
    })
  }, [gridWidth, gridHeight])

  const updatePowerUps = useCallback(() => {
    powerUpsRef.current = powerUpsRef.current
      .map((powerUp) => ({ ...powerUp, duration: powerUp.duration - 1 }))
      .filter((powerUp) => powerUp.duration > 0)

    // Update speed based on power-ups and evolution
    const hasSpeedBoost = powerUpsRef.current.some((p) => p.type === "speed" && p.active)
    const abilities = EVOLUTION_ABILITIES[evolutionRef.current] || []
    const hasSpeedEvolution = abilities.includes("speed_boost") || abilities.includes("divine_power")

    let evolutionSpeedBonus = evolutionRef.current * 15
    if (hasSpeedEvolution) evolutionSpeedBonus += 30

    speedRef.current = hasSpeedBoost ? INITIAL_SPEED - 50 - evolutionSpeedBonus : INITIAL_SPEED - evolutionSpeedBonus

    // Atualizar power-ups na UI
    setDisplayPowerUps([...powerUpsRef.current])
  }, [])

  // Optimized render function
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { cellSize } = canvasSize
    const abilities = EVOLUTION_ABILITIES[evolutionRef.current] || []
    const hasShield = powerUpsRef.current.some((p) => p.type === "shield" && p.active)

    // Clear canvas
    ctx.fillStyle = "#0f172a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid (reduced frequency)
    ctx.strokeStyle = "#1e293b"
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.2
    for (let x = 0; x <= gridWidth; x += 4) {
      ctx.beginPath()
      ctx.moveTo(x * cellSize, 0)
      ctx.lineTo(x * cellSize, gridHeight * cellSize)
      ctx.stroke()
    }
    for (let y = 0; y <= gridHeight; y += 4) {
      ctx.beginPath()
      ctx.moveTo(0, y * cellSize)
      ctx.lineTo(gridWidth * cellSize, y * cellSize)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Draw food (optimized)
    foodRef.current.forEach((f) => {
      const x = f.x * cellSize
      const y = f.y * cellSize

      ctx.fillStyle = f.color
      ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4)

      // Special food indicators (simplified)
      if (f.type !== "normal") {
        ctx.fillStyle = "white"
        ctx.font = `${cellSize / 3}px Arial`
        ctx.textAlign = "center"
        const symbol = f.type === "speed" ? "⚡" : f.type === "shield" ? "🛡️" : f.type === "teleport" ? "🌀" : "+"
        ctx.fillText(symbol, x + cellSize / 2, y + cellSize / 2 + cellSize / 6)
      }
    })

    // Draw obstacles (optimized)
    const hasGhostMode = abilities.includes("ghost_mode") || abilities.includes("divine_power")
    obstaclesRef.current.forEach((obstacle) => {
      const x = obstacle.x * cellSize
      const y = obstacle.y * cellSize

      // Make obstacles semi-transparent if ghost mode is active
      ctx.globalAlpha = hasGhostMode ? 0.5 : 1
      ctx.fillStyle = obstacle.moving ? "#dc2626" : "#7f1d1d"
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2)

      if (obstacle.moving) {
        ctx.fillStyle = "#fca5a5"
        ctx.fillRect(x + cellSize / 4, y + cellSize / 4, cellSize / 2, cellSize / 2)
      }
      ctx.globalAlpha = 1
    })

    // Draw snake (optimized)
    const baseColor = EVOLUTION_COLORS[evolutionRef.current] || "#22c55e"

    snakeRef.current.forEach((segment, index) => {
      const x = segment.x * cellSize
      const y = segment.y * cellSize

      // Special effects based on evolution
      if (segment.type === "head") {
        // Shield effect
        if (hasShield) {
          ctx.shadowColor = "#8b5cf6"
          ctx.shadowBlur = 6
        }

        // Ghost mode effect
        if (hasGhostMode) {
          ctx.globalAlpha = 0.8
          ctx.shadowColor = "#e5e7eb"
          ctx.shadowBlur = 8
        }

        // Magnetic effect
        if (abilities.includes("food_magnet") || abilities.includes("divine_power")) {
          ctx.shadowColor = "#dc2626"
          ctx.shadowBlur = 4
        }

        // Crystal effect
        if (abilities.includes("double_points") || abilities.includes("divine_power")) {
          ctx.shadowColor = "#06b6d4"
          ctx.shadowBlur = 6
        }

        // Divine effect (rainbow glow)
        if (abilities.includes("divine_power")) {
          const time = Date.now() * 0.005
          const r = Math.sin(time) * 127 + 128
          const g = Math.sin(time + 2) * 127 + 128
          const b = Math.sin(time + 4) * 127 + 128
          ctx.shadowColor = `rgb(${r},${g},${b})`
          ctx.shadowBlur = 10
        }
      }

      // Segment body
      ctx.fillStyle = baseColor
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2)

      // Head details (simplified)
      if (segment.type === "head") {
        ctx.fillStyle = "white"
        ctx.fillRect(x + cellSize / 3, y + cellSize / 4, 2, 2) // eye 1
        ctx.fillRect(x + (2 * cellSize) / 3, y + cellSize / 4, 2, 2) // eye 2

        // Evolution effects (simplified)
        if (evolutionRef.current >= 2) {
          ctx.fillStyle = "#fbbf24"
          ctx.fillRect(x, y, cellSize, 1) // armor top
          ctx.fillRect(x, y + cellSize - 1, cellSize, 1) // armor bottom
        }

        // Divine crown
        if (evolutionRef.current === 8) {
          ctx.fillStyle = "#fbbf24"
          ctx.fillRect(x + cellSize / 4, y - 2, cellSize / 2, 3)
          ctx.fillRect(x + cellSize / 3, y - 4, cellSize / 3, 2)
        }
      }

      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    })
  }, [canvasSize, gridWidth, gridHeight])

  // Separated game update loop (60 FPS max)
  const gameUpdate = useCallback(() => {
    if (gameStateRef.current !== "playing") return

    const now = performance.now()

    // Update game logic at controlled intervals
    if (now - lastUpdateTime.current >= speedRef.current) {
      moveSnake()
      updateObstacles()
      updatePowerUps()
      lastUpdateTime.current = now

      // Generate food (throttled)
      if (foodRef.current.length < 3 && Math.random() < 0.1) {
        generateFood()
      }

      // Generate obstacles (throttled)
      if (obstaclesRef.current.length < levelRef.current && Math.random() < 0.05) {
        generateObstacle()
      }

      // Level progression
      if (scoreRef.current > levelRef.current * 200) {
        levelRef.current += 1
        updateUIImmediate() // Atualizar UI imediatamente
      }
    }

    gameLoopRef.current = requestAnimationFrame(gameUpdate)
  }, [moveSnake, updateObstacles, updatePowerUps, generateFood, generateObstacle, updateUIImmediate])

  // Separated render loop (30 FPS for better performance)
  const renderLoop = useCallback(() => {
    const now = performance.now()

    // Render at 30 FPS for better performance
    if (now - lastRenderTime.current >= 33.33) {
      render()
      lastRenderTime.current = now
    }

    renderLoopRef.current = requestAnimationFrame(renderLoop)
  }, [render])

  // Touch controls (optimized)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const minSwipeDistance = 30

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0 && directionRef.current.x !== -1) nextDirectionRef.current = { x: 1, y: 0 }
        else if (deltaX < 0 && directionRef.current.x !== 1) nextDirectionRef.current = { x: -1, y: 0 }
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0 && directionRef.current.y !== -1) nextDirectionRef.current = { x: 0, y: 1 }
        else if (deltaY < 0 && directionRef.current.y !== 1) nextDirectionRef.current = { x: 0, y: -1 }
      }
    }

    touchStartRef.current = null
  }, [])

  // Keyboard controls (debounced)
  useEffect(() => {
    let lastKeyTime = 0
    const keyDebounce = 50

    const handleKeyPress = (e: KeyboardEvent) => {
      const now = Date.now()
      if (now - lastKeyTime < keyDebounce) return
      lastKeyTime = now

      if (gameState === "playing") {
        switch (e.key) {
          case "ArrowUp":
          case "w":
          case "W":
            if (directionRef.current.y !== 1) nextDirectionRef.current = { x: 0, y: -1 }
            break
          case "ArrowDown":
          case "s":
          case "S":
            if (directionRef.current.y !== -1) nextDirectionRef.current = { x: 0, y: 1 }
            break
          case "ArrowLeft":
          case "a":
          case "A":
            if (directionRef.current.x !== 1) nextDirectionRef.current = { x: -1, y: 0 }
            break
          case "ArrowRight":
          case "d":
          case "D":
            if (directionRef.current.x !== -1) nextDirectionRef.current = { x: 1, y: 0 }
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
  }, [gameState])

  // Game loops management
  useEffect(() => {
    if (gameState === "playing") {
      lastUpdateTime.current = performance.now()
      lastRenderTime.current = performance.now()
      gameLoopRef.current = requestAnimationFrame(gameUpdate)
      renderLoopRef.current = requestAnimationFrame(renderLoop)
    } else {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
      if (renderLoopRef.current) cancelAnimationFrame(renderLoopRef.current)
    }

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
      if (renderLoopRef.current) cancelAnimationFrame(renderLoopRef.current)
    }
  }, [gameState, gameUpdate, renderLoop])

  const startGame = useCallback(() => {
    // Reset all refs
    snakeRef.current = [
      { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2), type: "head" },
      { x: Math.floor(gridWidth / 2) - 1, y: Math.floor(gridHeight / 2), type: "body" },
      { x: Math.floor(gridWidth / 2) - 2, y: Math.floor(gridHeight / 2), type: "tail" },
    ]
    directionRef.current = { x: 1, y: 0 }
    nextDirectionRef.current = { x: 1, y: 0 }
    foodRef.current = []
    obstaclesRef.current = []
    powerUpsRef.current = []
    scoreRef.current = 0
    levelRef.current = 1
    evolutionRef.current = 0
    speedRef.current = INITIAL_SPEED
    specialAbilitiesRef.current = {
      ghostWalk: 0,
      magneticPull: 0,
      crystalBonus: 0,
      autoTeleport: 0,
    }

    // Reset UI states
    setDisplayScore(0)
    setDisplayLevel(1)
    setDisplayEvolution(0)
    setDisplaySnakeLength(3)
    setDisplayPowerUps([])
    setNewAchievements([])

    gameStartTime.current = Date.now()
    setGameState("playing")
    generateFood()
  }, [gridWidth, gridHeight, generateFood])

  const pauseGame = useCallback(() => {
    setGameState(gameState === "paused" ? "playing" : "paused")
  }, [gameState])

  const resetGame = useCallback(() => {
    setGameState("menu")
  }, [])

  const showStats = useCallback(() => {
    setGameState("stats")
  }, [])

  const resetStats = useCallback(() => {
    const defaultStats = getDefaultStats()
    setStats(defaultStats)
    saveStats(defaultStats)
    if (typeof window !== "undefined") {
      localStorage.removeItem("neon-snake-sessions")
    }
  }, [])

  if (gameState === "stats") {
    return <StatsScreen stats={stats} onBack={() => setGameState("menu")} onResetStats={resetStats} />
  }

  if (gameState === "menu") {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 flex items-center justify-center pixel-font">
        <div className="text-center max-w-md mx-auto">
          <h1 className="pixel-title font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-6">
            Pixel Serpent
          </h1>
          <p className="pixel-subtitle text-gray-300 mb-8">Evolua sua cobra através de 9 estágios únicos!</p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-600">
              <div className="text-green-400 font-bold pixel-stats">{stats.bestScore.toLocaleString()}</div>
              <div className="text-gray-400 pixel-ui">Melhor Pontuação</div>
            </div>
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-600">
              <div className="text-blue-400 font-bold pixel-stats">{stats.totalGames}</div>
              <div className="text-gray-400 pixel-ui">Jogos Totais</div>
            </div>
          </div>

          {/* Evolution Preview */}
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-600 mb-6">
            <h3 className="pixel-ui text-purple-400 mb-3">🧬 EVOLUÇÕES DISPONÍVEIS</h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {EVOLUTION_NAMES.slice(0, 9).map((name, index) => (
                <div key={index} className="text-center">
                  <div
                    className="w-4 h-4 mx-auto mb-1 rounded"
                    style={{ backgroundColor: EVOLUTION_COLORS[index] }}
                  ></div>
                  <div className="pixel-ui text-gray-400">{name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 text-gray-400 mb-8 pixel-ui">
            <p>🍎 Comida verde: Crescimento básico</p>
            <p>⚡ Comida azul: Velocidade temporária</p>
            <p>🛡️ Comida roxa: Escudo protetor</p>
            <p>🌀 Comida rosa: Atravessar paredes</p>
            <p>➕ Comida laranja: Crescimento extra</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={startGame}
              className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors shadow-lg pixel-button border-2 border-green-400"
            >
              COMEÇAR JOGO
            </button>

            <button
              onClick={showStats}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors pixel-button border-2 border-purple-400"
            >
              📊 ESTATÍSTICAS
            </button>

            <div className="pixel-ui text-gray-500 space-y-2 mt-6">
              <p>🖱️ Desktop: Use WASD ou setas</p>
              <p>📱 Mobile: Deslize para mover</p>
              <p>⏸️ Espaço para pausar</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-2 md:p-4">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2 pixel-font">
        <div className="flex gap-4 md:gap-6">
          <div className="text-green-400">
            <div className="pixel-ui opacity-75">PONTOS</div>
            <div className="font-bold pixel-stats">{displayScore}</div>
          </div>
          <div className="text-blue-400">
            <div className="pixel-ui opacity-75">NÍVEL</div>
            <div className="font-bold pixel-stats">{displayLevel}</div>
          </div>
          <div className="text-purple-400">
            <div className="pixel-ui opacity-75">EVOLUÇÃO</div>
            <div className="font-bold pixel-ui">{EVOLUTION_NAMES[displayEvolution]}</div>
          </div>
          <div className="text-yellow-400">
            <div className="pixel-ui opacity-75">TAMANHO</div>
            <div className="font-bold pixel-stats">{displaySnakeLength}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={pauseGame}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded pixel-button font-bold transition-colors border border-blue-400"
          >
            {gameState === "paused" ? "▶️" : "⏸️"}
          </button>
          <button
            onClick={resetGame}
            className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded pixel-button font-bold transition-colors border border-gray-400"
          >
            🏠
          </button>
        </div>
      </div>

      {/* Achievement Notifications */}
      {newAchievements.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {newAchievements.map((achievementId) => {
            const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId)
            return (
              <div
                key={achievementId}
                className="bg-yellow-600 text-white p-3 rounded-lg shadow-lg animate-bounce border-2 border-yellow-400 pixel-font"
              >
                <div className="font-bold pixel-ui">🏆 Nova Conquista!</div>
                <div className="pixel-ui">{achievement?.name}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Power-ups display */}
      <div className="h-6 mb-2 justify-center">
        {displayPowerUps.length > 0 && (
          <div className="flex gap-2 justify-center">
            {displayPowerUps.map((powerUp, index) => (
              <div
                key={index}
                className="px-3 py-1 bg-purple-600 rounded-full font-bold flex items-center gap-1 border border-purple-400 pixel-ui"
              >
                {powerUp.type === "speed" && "⚡"}
                {powerUp.type === "shield" && "🛡️"}
                {powerUp.type === "teleport" && "🌀"}
                <span>{Math.ceil(powerUp.duration / 60)}s</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evolution Progress */}
      <div className="mb-4 text-center">
        <div className="pixel-ui text-gray-400 mb-1">
          Próxima evolução: {EVOLUTION_NAMES[Math.min(displayEvolution + 1, EVOLUTION_NAMES.length - 1)]}(
          {displaySnakeLength}/
          {EVOLUTION_REQUIREMENTS[Math.min(displayEvolution + 1, EVOLUTION_REQUIREMENTS.length - 1)]})
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 max-w-md mx-auto">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${Math.min(100, (displaySnakeLength / EVOLUTION_REQUIREMENTS[Math.min(displayEvolution + 1, EVOLUTION_REQUIREMENTS.length - 1)]) * 100)}%`,
              backgroundColor: EVOLUTION_COLORS[Math.min(displayEvolution + 1, EVOLUTION_COLORS.length - 1)],
            }}
          ></div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex justify-center mb-4">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="border-2 border-slate-600 bg-slate-800 rounded-lg max-w-full h-auto"
          style={{ touchAction: "none", imageRendering: "pixelated" }}
        />
      </div>

      {/* Mobile Controls */}
      <div className="md:hidden mb-2">
        <div className="grid grid-cols-3 gap-2 max-w-48 mx-auto">
          <div></div>
          <button
            onTouchStart={() => directionRef.current.y !== 1 && (nextDirectionRef.current = { x: 0, y: -1 })}
            className="bg-slate-700 hover:bg-slate-600 p-4 rounded-lg text-2xl active:bg-slate-500 border border-slate-500"
          >
            ⬆️
          </button>
          <button
            onTouchStart={pauseGame}
            className="bg-blue-600 hover:bg-blue-500 p-4 rounded-lg text-xl active:bg-blue-400 border border-blue-400"
          >
            {gameState === "paused" ? "▶️" : "⏸️"}
          </button>
          <button
            onTouchStart={() => directionRef.current.x !== 1 && (nextDirectionRef.current = { x: -1, y: 0 })}
            className="bg-slate-700 hover:bg-slate-600 p-4 rounded-lg text-2xl active:bg-slate-500 border border-slate-500"
          >
            ⬅️
          </button>
          <button
            onTouchStart={() => directionRef.current.y !== -1 && (nextDirectionRef.current = { x: 0, y: 1 })}
            className="bg-slate-700 hover:bg-slate-600 p-4 rounded-lg text-2xl active:bg-slate-500 border border-slate-500"
          >
            ⬇️
          </button>
          <button
            onTouchStart={() => directionRef.current.x !== -1 && (nextDirectionRef.current = { x: 1, y: 0 })}
            className="bg-slate-700 hover:bg-slate-600 p-4 rounded-lg text-2xl active:bg-slate-500 border border-slate-500"
          >
            ➡️
          </button>
        </div>
      </div>

      <AdBanner
        dataAdFormat="auto"
        dataFullWidthResponsive={true}
        dataAdSlot="9380851329"
      />

      {/* Game Over / Paused Overlay */}
      {(gameState === "gameOver" || gameState === "paused") && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-slate-800 p-6 md:p-8 rounded-lg text-center max-w-md w-full border-2 border-slate-600 pixel-font">
            {gameState === "gameOver" ? (
              <>
                <h2 className="pixel-title font-bold text-red-400 mb-4">GAME OVER</h2>
                <p className="pixel-stats text-white mb-2">Pontuação Final: {displayScore}</p>
                <p className="pixel-ui text-gray-300 mb-6">Evolução: {EVOLUTION_NAMES[displayEvolution]}</p>
                <div className="space-y-3">
                  <button
                    onClick={startGame}
                    className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors pixel-button border-2 border-green-400"
                  >
                    JOGAR NOVAMENTE
                  </button>
                  <button
                    onClick={resetGame}
                    className="w-full py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors pixel-button border-2 border-gray-400"
                  >
                    MENU PRINCIPAL
                  </button>
                  <button
                    onClick={showStats}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors pixel-button border-2 border-purple-400"
                  >
                    📊 VER ESTATÍSTICAS
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="pixel-title font-bold text-blue-400 mb-4">PAUSADO</h2>
                <div className="space-y-3">
                  <button
                    onClick={pauseGame}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors pixel-button border-2 border-blue-400"
                  >
                    CONTINUAR
                  </button>
                  <button
                    onClick={resetGame}
                    className="w-full py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors pixel-button border-2 border-gray-400"
                  >
                    MENU PRINCIPAL
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
