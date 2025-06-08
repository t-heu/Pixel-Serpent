export const GRID_SIZE = 20
export const INITIAL_SPEED = 150

export const FOOD_TYPES = {
  normal: { color: "#22c55e", value: 1, chance: 0.6 },
  speed: { color: "#3b82f6", value: 2, chance: 0.15 },
  size: { color: "#f59e0b", value: 3, chance: 0.1 },
  shield: { color: "#8b5cf6", value: 2, chance: 0.1 },
  teleport: { color: "#ec4899", value: 4, chance: 0.05 },
} as const

export const EVOLUTION_COLORS = ["#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b"]
export const EVOLUTION_NAMES = ["Básica", "Veloz", "Blindada", "Quântica"]

export const ACHIEVEMENTS = [
  { id: "first_game", name: "Primeiro Jogo", description: "Jogue sua primeira partida" },
  { id: "score_100", name: "Centena", description: "Alcance 100 pontos" },
  { id: "score_500", name: "Quinhentos", description: "Alcance 500 pontos" },
  { id: "score_1000", name: "Milhar", description: "Alcance 1000 pontos" },
  { id: "evolution_fast", name: "Velocista", description: "Evolua para cobra veloz" },
  { id: "evolution_armored", name: "Blindado", description: "Evolua para cobra blindada" },
  { id: "evolution_quantum", name: "Quântico", description: "Alcance a evolução máxima" },
  { id: "snake_20", name: "Gigante", description: "Tenha uma cobra com 20+ segmentos" },
  { id: "snake_50", name: "Colossal", description: "Tenha uma cobra com 50+ segmentos" },
  { id: "level_5", name: "Veterano", description: "Alcance o nível 5" },
  { id: "level_10", name: "Mestre", description: "Alcance o nível 10" },
  { id: "food_100", name: "Glutão", description: "Coma 100 comidas" },
  { id: "powerup_master", name: "Mestre dos Poderes", description: "Use todos os tipos de power-up" },
  { id: "survivor", name: "Sobrevivente", description: "Sobreviva por 5 minutos" },
  { id: "speed_demon", name: "Demônio da Velocidade", description: "Use 10 power-ups de velocidade" },
]
