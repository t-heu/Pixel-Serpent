export const GRID_SIZE = 20
export const INITIAL_SPEED = 150

export const FOOD_TYPES = {
  normal: { color: "#22c55e", value: 1, chance: 0.6 },
  speed: { color: "#3b82f6", value: 2, chance: 0.15 },
  size: { color: "#f59e0b", value: 3, chance: 0.1 },
  shield: { color: "#8b5cf6", value: 2, chance: 0.1 },
  teleport: { color: "#ec4899", value: 4, chance: 0.05 },
} as const

export const EVOLUTION_COLORS = [
  "#22c55e", // Básica - Verde
  "#3b82f6", // Veloz - Azul
  "#8b5cf6", // Blindada - Roxa
  "#f59e0b", // Quântica - Laranja
  "#e5e7eb", // Fantasma - Cinza claro
  "#dc2626", // Magnética - Vermelha
  "#06b6d4", // Cristal - Ciano
  "#d946ef", // Cósmica - Magenta
  "#fbbf24", // Divina - Dourada
]

export const EVOLUTION_NAMES = [
  "Básica",
  "Veloz",
  "Blindada",
  "Quântica",
  "Fantasma",
  "Magnética",
  "Cristal",
  "Cósmica",
  "Divina",
]

export const EVOLUTION_REQUIREMENTS = [
  0, // Básica - início
  10, // Veloz - 10 segmentos
  20, // Blindada - 20 segmentos
  35, // Quântica - 35 segmentos
  50, // Fantasma - 50 segmentos
  70, // Magnética - 70 segmentos
  95, // Cristal - 95 segmentos
  125, // Cósmica - 125 segmentos
  160, // Divina - 160 segmentos
]

export const EVOLUTION_ABILITIES = {
  0: [] as string[], // Básica - sem habilidades especiais
  1: ["speed_boost"], // Veloz - velocidade aumentada
  2: ["armor"], // Blindada - resistência a colisões
  3: ["quantum_tunnel"], // Quântica - atravessa paredes
  4: ["ghost_mode"], // Fantasma - atravessa obstáculos
  5: ["food_magnet"], // Magnética - atrai comida
  6: ["double_points"], // Cristal - pontos dobrados
  7: ["auto_teleport"], // Cósmica - teletransporte automático
  8: ["divine_power"], // Divina - todos os poderes
}

export const ACHIEVEMENTS = [
  { id: "first_game", name: "Primeiro Jogo", description: "Jogue sua primeira partida" },
  { id: "score_100", name: "Centena", description: "Alcance 100 pontos" },
  { id: "score_500", name: "Quinhentos", description: "Alcance 500 pontos" },
  { id: "score_1000", name: "Milhar", description: "Alcance 1000 pontos" },
  { id: "score_5000", name: "Cinco Mil", description: "Alcance 5000 pontos" },
  { id: "score_10000", name: "Dez Mil", description: "Alcance 10000 pontos" },
  { id: "evolution_fast", name: "Velocista", description: "Evolua para cobra veloz" },
  { id: "evolution_armored", name: "Blindado", description: "Evolua para cobra blindada" },
  { id: "evolution_quantum", name: "Quântico", description: "Alcance a evolução quântica" },
  { id: "evolution_ghost", name: "Fantasma", description: "Evolua para cobra fantasma" },
  { id: "evolution_magnetic", name: "Magnético", description: "Evolua para cobra magnética" },
  { id: "evolution_crystal", name: "Cristalino", description: "Evolua para cobra cristal" },
  { id: "evolution_cosmic", name: "Cósmico", description: "Evolua para cobra cósmica" },
  { id: "evolution_divine", name: "Divino", description: "Alcance a evolução máxima" },
  { id: "snake_20", name: "Gigante", description: "Tenha uma cobra com 20+ segmentos" },
  { id: "snake_50", name: "Colossal", description: "Tenha uma cobra com 50+ segmentos" },
  { id: "snake_100", name: "Titânico", description: "Tenha uma cobra com 100+ segmentos" },
  { id: "snake_200", name: "Lendário", description: "Tenha uma cobra com 200+ segmentos" },
  { id: "level_5", name: "Veterano", description: "Alcance o nível 5" },
  { id: "level_10", name: "Mestre", description: "Alcance o nível 10" },
  { id: "level_20", name: "Lenda", description: "Alcance o nível 20" },
  { id: "food_100", name: "Glutão", description: "Coma 100 comidas" },
  { id: "food_500", name: "Devorador", description: "Coma 500 comidas" },
  { id: "powerup_master", name: "Mestre dos Poderes", description: "Use todos os tipos de power-up" },
  { id: "survivor", name: "Sobrevivente", description: "Sobreviva por 5 minutos" },
  { id: "marathon", name: "Maratonista", description: "Sobreviva por 10 minutos" },
  { id: "speed_demon", name: "Demônio da Velocidade", description: "Use 10 power-ups de velocidade" },
  { id: "ghost_walker", name: "Caminhante Fantasma", description: "Atravesse 50 obstáculos como fantasma" },
  { id: "magnet_master", name: "Mestre Magnético", description: "Colete 100 comidas com magnetismo" },
  { id: "crystal_collector", name: "Colecionador de Cristais", description: "Ganhe 10000 pontos com bônus de cristal" },
]
