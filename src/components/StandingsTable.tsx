import React, { useState } from 'react';
import { Trophy, ChevronDown, ChevronUp, Zap, HelpCircle, ArrowUpRight, Award, TrendingUp, Sparkles } from 'lucide-react';
import type { PlayerIntelligenceStats, TournamentConfig } from '../types/index.ts';
import { formatScoreDisplay } from '../utils/tieBreakerEngine.ts';

interface StandingsTableProps {
  stats: PlayerIntelligenceStats[];
  config: TournamentConfig;
  onSelectPlayerForIntelligence: (playerId: string) => void;
  onChangeRankingSystem: (system: 'bayesian' | 'total_points' | 'avg_points') => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  stats,
  config,
  onSelectPlayerForIntelligence,
  onChangeRankingSystem,
}) => {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  const toggleExpand = (playerId: string) => {
    setExpandedPlayerId(expandedPlayerId === playerId ? null : playerId);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / System Switcher */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center">
              <Trophy className="w-6 h-6 mr-2 text-amber-400" />
              Tabla General del Campeonato
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {stats.length} Jugadores
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Puntuación individual acumulada con rotación de parejas, bonos decimales de margen y récord de jornada.
          </p>
        </div>

        {/* Ranking System Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-900/90 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => onChangeRankingSystem('bayesian')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                config.rankingSystem === 'bayesian'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-neon'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⭐ Rating Padel Intelligence
            </button>
            <button
              onClick={() => onChangeRankingSystem('total_points')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                config.rankingSystem === 'total_points'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-blue-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Puntos Totales
            </button>
            <button
              onClick={() => onChangeRankingSystem('avg_points')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                config.rankingSystem === 'avg_points'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Promedio
            </button>
          </div>

          <button
            onClick={() => setShowFormulaModal(!showFormulaModal)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors border border-slate-700/80"
            title="Ver explicación de fórmulas y desempates"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Formula Explanation Alert (Collapsible / Modal) */}
      {showFormulaModal && (
        <div className="glass-panel-neon p-5 rounded-2xl text-xs sm:text-sm text-slate-300 space-y-3 animate-fade-in border border-emerald-500/30">
          <div className="flex items-center justify-between font-bold text-emerald-400 text-sm">
            <span className="flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-emerald-300" />
              Sistema Matemático de Desempates y Puntuación
            </span>
            <button
              onClick={() => setShowFormulaModal(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded-lg"
            >
              Cerrar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="font-semibold text-white block mb-1 text-xs">1. Margen por Partido</span>
              <ul className="space-y-0.5 text-slate-400 text-[11px]">
                <li><span className="text-emerald-400 font-mono">+0.004</span> / <span className="text-rose-400 font-mono">-0.004</span> (7-0 ó 0-7)</li>
                <li><span className="text-emerald-400 font-mono">+0.003</span> / <span className="text-rose-400 font-mono">-0.003</span> (6-1 ó 1-6)</li>
                <li><span className="text-emerald-400 font-mono">+0.002</span> / <span className="text-rose-400 font-mono">-0.003</span> (5-2 ó 2-5)</li>
                <li><span className="text-slate-300 font-mono"> 0.000</span> / <span className="text-rose-400 font-mono">-0.002</span> (4-3 ó 3-4)</li>
              </ul>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="font-semibold text-white block mb-1 text-xs">2. Récord Preliminares (3 Juegos)</span>
              <ul className="space-y-0.5 text-slate-400 text-[11px]">
                <li><span className="text-emerald-400 font-mono">+0.003</span> (Ganó 3 de 3)</li>
                <li><span className="text-emerald-400 font-mono">+0.002</span> (Ganó 2 de 3)</li>
                <li><span className="text-emerald-400 font-mono">+0.001</span> (Ganó 1 de 3)</li>
                <li><span className="text-rose-400 font-mono">-0.003</span> (Perdió los 3)</li>
              </ul>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="font-semibold text-white block mb-1 text-xs">3. Bonos de Finales de Jornada</span>
              <ul className="space-y-0.5 text-slate-400 text-[11px]">
                <li><span className="text-emerald-400 font-mono">+0.001</span> Ganar su Final (Cualquier Cancha)</li>
                <li><span className="text-amber-400 font-mono">+0.001</span> Pleno Diario (Ganó 4 de 4)</li>
                <li className="text-slate-400 pt-1">
                  <strong>Padel Intelligence Rating:</strong> Pondera rendimiento y regularidad para evitar que quien juegue 1 sola fecha supere injustamente a los constantes.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Standings Table Card */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                <th className="py-3.5 px-4 text-center w-14">Pos</th>
                <th className="py-3.5 px-4">Jugador</th>
                <th className="py-3.5 px-3 text-center">Fechas</th>
                <th className="py-3.5 px-3 text-center">PJ (V-D)</th>
                <th className="py-3.5 px-3 text-center">% Vic</th>
                <th className="py-3.5 px-3 text-center">Games (Dif)</th>
                <th className="py-3.5 px-4 text-right">
                  {config.rankingSystem === 'bayesian' && '⭐ Rating PI'}
                  {config.rankingSystem === 'total_points' && '🏆 Puntos Totales'}
                  {config.rankingSystem === 'avg_points' && '📈 Promedio / PJ'}
                </th>
                <th className="py-3.5 px-3 text-center w-24">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {stats.map((player) => {
                const isExpanded = expandedPlayerId === player.playerId;
                const isPodium1 = player.currentRank === 1;
                const isPodium2 = player.currentRank === 2;
                const isPodium3 = player.currentRank === 3;
                const isTop8 = player.currentRank <= 8;

                return (
                  <React.Fragment key={player.playerId}>
                    <tr
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isPodium1 ? 'bg-amber-500/5' : isPodium2 ? 'bg-slate-400/5' : isPodium3 ? 'bg-amber-700/5' : ''
                      }`}
                    >
                      {/* Rank Position */}
                      <td className="py-4 px-4 text-center font-display font-extrabold text-base">
                        {isPodium1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-black font-black text-sm shadow-gold-glow">
                            1
                          </span>
                        ) : isPodium2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-black font-black text-sm">
                            2
                          </span>
                        ) : isPodium3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600 text-white font-black text-sm">
                            3
                          </span>
                        ) : (
                          <span className={`text-slate-400 ${isTop8 ? 'text-emerald-400 font-bold' : ''}`}>
                            #{player.currentRank}
                          </span>
                        )}
                      </td>

                      {/* Player Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${
                            isTop8 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {player.playerName.slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white text-sm sm:text-base hover:text-emerald-400 transition-colors cursor-pointer" onClick={() => onSelectPlayerForIntelligence(player.playerId)}>
                                {player.playerName}
                              </span>
                              {isTop8 && (
                                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Bombo 1
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                              <span>Base: {player.totalBasePoints} pts</span>
                              <span>•</span>
                              <span className="font-mono text-emerald-400">
                                {player.totalDecimalBonus >= 0 ? `+${player.totalDecimalBonus.toFixed(3)}` : player.totalDecimalBonus.toFixed(3)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Days Attended */}
                      <td className="py-4 px-3 text-center text-slate-300 font-semibold text-xs sm:text-sm">
                        {player.daysAttended}
                      </td>

                      {/* Matches Played (Wins - Losses) */}
                      <td className="py-4 px-3 text-center text-xs sm:text-sm font-medium">
                        <span className="text-white">{player.totalMatchesPlayed}</span>
                        <span className="text-slate-400 text-xs ml-1.5 font-mono">
                          ({player.totalMatchesWon}V - {player.totalMatchesLost}D)
                        </span>
                      </td>

                      {/* Win Rate */}
                      <td className="py-4 px-3 text-center font-medium">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          player.winRatePercentage >= 65
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : player.winRatePercentage >= 45
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {player.winRatePercentage}%
                        </span>
                      </td>

                      {/* Games Won / Difference */}
                      <td className="py-4 px-3 text-center text-xs sm:text-sm">
                        <span className="text-slate-200 font-semibold">{player.totalGamesWon}</span>
                        <span className={`text-xs ml-1 font-mono ${
                          player.gameDifference > 0 ? 'text-emerald-400' : player.gameDifference < 0 ? 'text-rose-400' : 'text-slate-400'
                        }`}>
                          ({player.gameDifference > 0 ? `+${player.gameDifference}` : player.gameDifference})
                        </span>
                      </td>

                      {/* Final Score / Rating Column */}
                      <td className="py-4 px-4 text-right">
                        <div className="font-mono font-black text-sm sm:text-base text-emerald-400 tracking-tight">
                          {config.rankingSystem === 'bayesian' && player.bayesianRating.toFixed(3)}
                          {config.rankingSystem === 'total_points' && formatScoreDisplay(player.totalChampionshipPoints)}
                          {config.rankingSystem === 'avg_points' && `${player.avgPointsPerMatch.toFixed(2)} pts/pj`}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Total: {formatScoreDisplay(player.totalChampionshipPoints)}
                        </div>
                      </td>

                      {/* Action Drilldown & Intelligence */}
                      <td className="py-4 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onSelectPlayerForIntelligence(player.playerId)}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors"
                            title="Ver Padel Intelligence"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleExpand(player.playerId)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            title="Desglose de cálculo"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Drilldown Row */}
                    {isExpanded && (
                      <tr className="bg-slate-950/60 border-y border-slate-800/80 animate-fade-in">
                        <td colSpan={8} className="py-4 px-6">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                              <span className="text-slate-400 font-medium block mb-1">🎮 Puntos Base (Games)</span>
                              <div className="text-lg font-bold text-white font-mono">{player.totalBasePoints} pts</div>
                              <div className="text-[10px] text-slate-500">Suma directa de games ganados</div>
                            </div>
                            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                              <span className="text-slate-400 font-medium block mb-1">🔢 Bonos Decimales</span>
                              <div className="text-lg font-bold text-emerald-400 font-mono">
                                {player.totalDecimalBonus >= 0 ? `+${player.totalDecimalBonus.toFixed(3)}` : player.totalDecimalBonus.toFixed(3)}
                              </div>
                              <div className="text-[10px] text-slate-500">Margen + Récord 3-0 + Finales</div>
                            </div>
                            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                              <span className="text-slate-400 font-medium block mb-1">🤝 Mejor Pareja</span>
                              <div className="text-sm font-bold text-cyan-300">
                                {player.bestPartner ? `${player.bestPartner.partnerName} (${player.bestPartner.winRate}%)` : 'Sin registros'}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {player.bestPartner ? `${player.bestPartner.winsTogether}V de ${player.bestPartner.matchesTogether} partidos` : ''}
                              </div>
                            </div>
                            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                              <div>
                                <span className="text-slate-400 font-medium block mb-1">⚡ Rating Bayesiano</span>
                                <div className="text-lg font-bold text-amber-400 font-mono">{player.bayesianRating.toFixed(3)}</div>
                              </div>
                              <button
                                onClick={() => onSelectPlayerForIntelligence(player.playerId)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center shadow-neon"
                              >
                                Ver Radar <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
