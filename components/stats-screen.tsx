"use client"

import { useState } from "react"
import type { GameStats } from "../types/game"
import { ACHIEVEMENTS, EVOLUTION_NAMES } from "../constants/game"
import { formatTime, getRecentSessions } from "@/utils/game-utils"

interface StatsScreenProps {
  stats: GameStats
  onBack: () => void
  onResetStats: () => void
}

export default function StatsScreen({ stats, onBack, onResetStats }: StatsScreenProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "achievements" | "history">("overview")
  const recentSessions = getRecentSessions()

  const totalFoodEaten = Object.values(stats.foodEaten).reduce((a, b) => a + b, 0)
  const totalPowerUpsUsed = Object.values(stats.powerUpsUsed).reduce((a, b) => a + b, 0)
  const averageScore = stats.totalGames > 0 ? Math.round(stats.totalScore / stats.totalGames) : 0
  const averageTime = stats.totalGames > 0 ? Math.round(stats.totalTime / stats.totalGames) : 0

  const achievementsList = ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    earned: stats.achievements.includes(achievement.id),
  }))

  const earnedAchievements = achievementsList.filter((a) => a.earned).length
  const achievementProgress = Math.round((earnedAchievements / ACHIEVEMENTS.length) * 100)

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-pixel text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Estatísticas
            </h1>
            <p className="font-pixel text-gray-400 mt-1">Seu progresso no Neon Snake</p>
          </div>
          <button onClick={onBack} className="font-pixel px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
            ← Voltar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: "overview", label: "Visão Geral", icon: "📊" },
            { id: "achievements", label: "Conquistas", icon: "🏆" },
            { id: "history", label: "Histórico", icon: "📈" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`font-pixel px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id ? "bg-purple-600 text-white" : "bg-slate-800 text-gray-300 hover:bg-slate-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="font-pixel text-2xl font-bold text-green-400">{stats.totalGames}</div>
                <div className="font-pixel text-sm text-gray-400">Jogos Totais</div>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="font-pixel text-2xl font-bold text-blue-400">{stats.bestScore.toLocaleString()}</div>
                <div className="font-pixel text-sm text-gray-400">Melhor Pontuação</div>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="font-pixel text-2xl font-bold text-purple-400">{stats.longestSnake}</div>
                <div className="font-pixel text-sm text-gray-400">Maior Cobra</div>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="font-pixel text-2xl font-bold text-yellow-400">{formatTime(stats.totalTime)}</div>
                <div className="font-pixel text-sm text-gray-400">Tempo Total</div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Food Stats */}
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="font-pixel text-xl font-bold mb-4 text-green-400">🍎 Comidas Consumidas</h3>
                <div className="space-y-3">
                  {Object.entries(stats.foodEaten).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="font-pixel capitalize text-gray-300">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-green-400 h-2 rounded-full transition-all"
                            style={{ width: `${totalFoodEaten > 0 ? (count / totalFoodEaten) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="font-pixel text-white font-bold w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-600">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="font-pixel">Total</span>
                      <span className="font-pixel text-green-400">{totalFoodEaten}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evolution Stats */}
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="font-pixel text-xl font-bold mb-4 text-purple-400">🧬 Evoluções Alcançadas</h3>
                <div className="space-y-3">
                  {Object.entries(stats.evolutionsReached).map(([evolution, count], index) => (
                    <div key={evolution} className="flex justify-between items-center">
                      <span className="font-pixel text-gray-300">{EVOLUTION_NAMES[index]}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-purple-400 h-2 rounded-full transition-all"
                            style={{
                              width: `${stats.totalGames > 0 ? (count / stats.totalGames) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="font-pixel text-white font-bold w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Power-up Stats */}
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="font-pixel text-xl font-bold mb-4 text-blue-400">⚡ Power-ups Utilizados</h3>
                <div className="space-y-3">
                  {Object.entries(stats.powerUpsUsed).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="font-pixel capitalize text-gray-300">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-400 h-2 rounded-full transition-all"
                            style={{
                              width: `${totalPowerUpsUsed > 0 ? (count / totalPowerUpsUsed) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="font-pixel text-white font-bold w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-600">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="font-pixel">Total</span>
                      <span className="font-pixel text-blue-400">{totalPowerUpsUsed}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="font-pixel text-xl font-bold mb-4 text-yellow-400">📈 Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-pixel text-gray-300">Pontuação Média</span>
                    <span className="font-pixel text-white font-bold">{averageScore.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-pixel text-gray-300">Tempo Médio</span>
                    <span className="font-pixel text-white font-bold">{formatTime(averageTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-pixel text-gray-300">Maior Nível</span>
                    <span className="font-pixel text-white font-bold">{Math.max(...stats.levelsReached, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-pixel text-gray-300">Última Partida</span>
                    <span className="font-pixel text-white font-bold">
                      {stats.lastPlayed ? new Date(stats.lastPlayed).toLocaleDateString() : "Nunca"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <div className="space-y-6">
            {/* Progress Overview */}
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-pixel text-xl font-bold text-yellow-400">🏆 Progresso das Conquistas</h3>
                <span className="text-2xl font-bold text-yellow-400">
                  {earnedAchievements}/{ACHIEVEMENTS.length}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-4 mb-2">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${achievementProgress}%` }}
                ></div>
              </div>
              <p className="font-pixel text-gray-400 text-center">{achievementProgress}% Completo</p>
            </div>

            {/* Achievements Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {achievementsList.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border transition-all ${
                    achievement.earned ? "bg-yellow-900/20 border-yellow-400/50" : "bg-slate-800 border-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`text-2xl ${achievement.earned ? "grayscale-0" : "grayscale opacity-50"}`}>🏆</div>
                    <div className="flex-1">
                      <h4 className={`font-pixel font-bold ${achievement.earned ? "text-yellow-400" : "text-gray-400"}`}>
                        {achievement.name}
                      </h4>
                      <p className={`font-pixel text-sm ${achievement.earned ? "text-gray-300" : "text-gray-500"}`}>
                        {achievement.description}
                      </p>
                    </div>
                    {achievement.earned && <div className="text-green-400 text-xl">✓</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h3 className="font-pixel text-xl font-bold mb-4 text-blue-400">📈 Últimas Partidas</h3>
              {recentSessions.length === 0 ? (
                <p className="font-pixel text-gray-400 text-center py-8">Nenhuma partida registrada ainda</p>
              ) : (
                <div className="space-y-3">
                  {recentSessions
                    .slice(-10)
                    .reverse()
                    .map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">
                            {session.evolution === 0
                              ? "🐍"
                              : session.evolution === 1
                                ? "⚡"
                                : session.evolution === 2
                                  ? "🛡️"
                                  : "✨"}
                          </div>
                          <div>
                            <div className="font-pixel font-bold text-white">{session.score.toLocaleString()} pts</div>
                            <div className="font-pixel text-sm text-gray-400">
                              Nível {session.level} • {EVOLUTION_NAMES[session.evolution]}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-300">
                            Cobra: {session.snakeLength} • {formatTime(session.timeAlive)}
                          </div>
                          <div className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reset Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              if (confirm("Tem certeza que deseja resetar todas as estatísticas? Esta ação não pode ser desfeita.")) {
                onResetStats()
              }
            }}
            className="font-pixel px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
          >
            🗑️ Resetar Estatísticas
          </button>
        </div>
      </div>
    </div>
  )
}
