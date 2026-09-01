import React, { useState } from 'react';
import { Trophy, ChevronDown, ChevronUp, Zap, HelpCircle, ArrowUpRight, Award, TrendingUp, Sparkles, Flame, Skull, Beer, Users } from 'lucide-react';
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
      {/* Top Banner */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-black font-display text-white flex items-center">
              <Trophy className="w-6 h-6 mr-2 text-amber-400" />
              Tabla General del G20
            </h2>
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {stats.length} Jugadores
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Los <strong>Puntos Totales (Games)</strong> mandan la tabla. Los decimales (`+0.004, -0.004`) son el desempate supremo.
          </p>
        </div>

        {/* Quick Help and Mode selector */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFormulaModal(!showFormulaModal)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-emerald-400 text-xs sm:text-sm font-bold transition-all border border-slate-700 flex items-center"
          >
            <HelpCircle className="w-4 h-4 mr-1.5 text-amber-400" />
            Criterios de Desempate
          </button>
        </div>
      </div>

      {/* Spicy Formula & Tie Breaker Explanation Box */}
      {showFormulaModal && (
        <div className="glass-panel-neon p-5 rounded-3xl text-xs sm:text-sm text-slate-300 space-y-3 animate-fade-in border-2 border-emerald-500/40">
          <div className="flex items-center justify-between font-black text-emerald-400 text-sm">
            <span className="flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-emerald-300" />
              Reglamento de Desempates y Puntos Extra (G20 by Peter Inc.)
            </span>
            <button
              onClick={() => setShowFormulaModal(false)}
              className="text-slate-400 hover:text-white text-xs px-2.5 py-1 bg-slate-800 rounded-lg font-bold"
            >
              Cerrar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
              <span className="font-extrabold text-white block mb-1 text-xs">1. Puntos Base (Mandan)</span>
              <p className="text-slate-400 text-[11px]">
                Cada game ganado suma 1 punto base a tu cuenta. Quien tiene más games ganados siempre está arriba.
              </p>
            </div>
            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
              <span className="font-extrabold text-white block mb-1 text-xs">2. Margen de Paliza (Desempate)</span>
              <ul className="space-y-0.5 text-slate-400 text-[11px]">
                <li><span className="text-emerald-400 font-mono font-bold">+0.004</span> / <span className="text-rose-400 font-mono font-bold">-0.004</span> (7-0 ó 0-7)</li>
                <li><span className="text-emerald-400 font-mono font-bold">+0.003</span> / <span className="text-rose-400 font-mono font-bold">-0.003</span> (6-1 ó 1-6)</li>
                <li><span className="text-emerald-400 font-mono font-bold">+0.002</span> / <span className="text-rose-400 font-mono font-bold">-0.003</span> (5-2 ó 2-5)</li>
                <li><span className="text-slate-300 font-mono font-bold"> 0.000</span> / <span className="text-rose-400 font-mono font-bold">-0.002</span> (4-3 ó 3-4)</li>
              </ul>
            </div>
            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
              <span className="font-extrabold text-white block mb-1 text-xs">3. Bonos de Racha y Final</span>
              <ul className="space-y-0.5 text-slate-400 text-[11px]">
                <li><span className="text-emerald-400 font-mono font-bold">+0.003</span> Ganar 3 de 3 preliminares</li>
                <li><span className="text-emerald-400 font-mono font-bold">+0.002</span> Ganar 2 de 3 | <span className="text-emerald-400 font-mono font-bold">+0.001</span> Ganar 1</li>
                <li><span className="text-rose-400 font-mono font-bold">-0.003</span> Perder los 3 (Pagar botana)</li>
                <li><span className="text-amber-400 font-mono font-bold">+0.001</span> Ganar tu Final / <span className="text-amber-400 font-mono font-bold">+0.001</span> Pleno 4/4</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Empty Zero State */}
      {stats.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 space-y-4">
          <Trophy className="w-16 h-16 text-slate-600 mx-auto" />
          <h3 className="text-xl font-black text-white">Tabla Vacía - El Torneo Aún No Comienza</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Ve a la pestaña <strong>Jugadores</strong> para registrar a los 16 participantes, y luego arranca la <strong>Fecha #1</strong> en Jornada en Vivo.
          </p>
        </div>
      ) : (
        /* Standings Table Card */
        <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider font-extrabold border-b border-slate-800">
                  <th className="py-4 px-3 sm:px-4 text-center w-14">Pos</th>
                  <th className="py-4 px-3 sm:px-4">Jugador</th>
                  <th className="py-4 px-2 sm:px-3 text-center">Fechas</th>
                  <th className="py-4 px-2 sm:px-3 text-center">PJ (V-D)</th>
                  <th className="py-4 px-2 sm:px-3 text-center">% Vic</th>
                  <th className="py-4 px-3 text-center">Games Base</th>
                  <th className="py-4 px-3 text-center">Bono Desempate</th>
                  <th className="py-4 px-4 text-right">🏆 PUNTOS TOTALES</th>
                  <th className="py-4 px-3 text-center w-20">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {stats.map((player) => {
                  const isExpanded = expandedPlayerId === player.playerId;
                  const isPodium1 = player.currentRank === 1 && player.totalMatchesPlayed > 0;
                  const isPodium2 = player.currentRank === 2 && player.totalMatchesPlayed > 0;
                  const isPodium3 = player.currentRank === 3 && player.totalMatchesPlayed > 0;
                  const isTop8 = player.currentRank <= 8;

                  return (
                    <React.Fragment key={player.playerId}>
                      <tr
                        className={`hover:bg-slate-800/50 transition-colors ${
                          isPodium1 ? 'bg-amber-500/10' : isPodium2 ? 'bg-slate-400/10' : isPodium3 ? 'bg-amber-700/10' : ''
                        }`}
                      >
                        {/* Rank Position */}
                        <td className="py-4 px-3 sm:px-4 text-center font-display font-black text-base">
                          {isPodium1 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 text-black font-black text-sm shadow-gold-glow">
                              👑 1
                            </span>
                          ) : isPodium2 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-300 text-black font-black text-sm">
                              🥈 2
                            </span>
                          ) : isPodium3 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-600 text-white font-black text-sm">
                              🥉 3
                            </span>
                          ) : (
                            <span className={`font-mono ${isTop8 ? 'text-emerald-400 font-extrabold' : 'text-slate-400'}`}>
                              #{player.currentRank}
                            </span>
                          )}
                        </td>

                        {/* Player Info */}
                        <td className="py-4 px-3 sm:px-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm uppercase flex-shrink-0 ${
                              isTop8 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {player.playerName.slice(0, 2)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span
                                  className="font-extrabold text-white text-sm sm:text-base hover:text-emerald-400 transition-colors cursor-pointer"
                                  onClick={() => onSelectPlayerForIntelligence(player.playerId)}
                                >
                                  {player.playerName}
                                </span>
                                {isTop8 ? (
                                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Top 8
                                  </span>
                                ) : (
                                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                                    Bombo 2
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-medium">
                                {player.bestPartner ? `Sinergia Top: ${player.bestPartner.partnerName}` : 'G20 Master'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Days Attended */}
                        <td className="py-4 px-2 sm:px-3 text-center text-slate-200 font-bold text-xs sm:text-sm">
                          {player.daysAttended}
                        </td>

                        {/* Matches Played */}
                        <td className="py-4 px-2 sm:px-3 text-center text-xs sm:text-sm font-semibold">
                          <span className="text-white font-mono">{player.totalMatchesWon}V - {player.totalMatchesLost}D</span>
                          <div className="text-[10px] text-slate-500">({player.totalMatchesPlayed} PJ)</div>
                        </td>

                        {/* Win Rate */}
                        <td className="py-4 px-2 sm:px-3 text-center font-bold">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black ${
                            player.winRatePercentage >= 65
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : player.winRatePercentage >= 45
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {player.winRatePercentage}%
                          </span>
                        </td>

                        {/* Base Games */}
                        <td className="py-4 px-3 text-center text-xs sm:text-sm font-extrabold text-slate-200 font-mono">
                          {player.totalBasePoints} pts
                        </td>

                        {/* Desempate Decimals */}
                        <td className="py-4 px-3 text-center font-mono text-xs font-bold">
                          <span className={player.totalDecimalBonus >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {player.totalDecimalBonus >= 0 ? `+${player.totalDecimalBonus.toFixed(3)}` : player.totalDecimalBonus.toFixed(3)}
                          </span>
                        </td>

                        {/* PUNTOS TOTALES (Mandan la tabla) */}
                        <td className="py-4 px-4 text-right">
                          <div className="font-mono font-black text-base sm:text-xl text-emerald-400 tracking-tight glow-text-neon">
                            {formatScoreDisplay(player.totalChampionshipPoints)}
                          </div>
                        </td>

                        {/* Drilldown button */}
                        <td className="py-4 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => onSelectPlayerForIntelligence(player.playerId)}
                              className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-cyan-400 hover:text-cyan-300"
                              title="Ver Padel Intelligence"
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleExpand(player.playerId)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Drilldown Row */}
                      {isExpanded && (
                        <tr className="bg-slate-950/90 border-y border-slate-800 animate-fade-in">
                          <td colSpan={9} className="py-4 px-4 sm:px-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                                <span className="text-slate-400 font-bold block mb-1">🎮 Games Ganados (Base)</span>
                                <div className="text-xl font-black text-white font-mono">{player.totalBasePoints} pts</div>
                                <div className="text-[11px] text-slate-500">Games acumulados en todas las fechas</div>
                              </div>
                              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                                <span className="text-slate-400 font-bold block mb-1">🔢 Decimales de Desempate</span>
                                <div className="text-xl font-black text-emerald-400 font-mono">
                                  {player.totalDecimalBonus >= 0 ? `+${player.totalDecimalBonus.toFixed(3)}` : player.totalDecimalBonus.toFixed(3)}
                                </div>
                                <div className="text-[11px] text-slate-500">Margen + Récord 3-0 + Finales</div>
                              </div>
                              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                                <span className="text-slate-400 font-bold block mb-1">🤝 Pareja de Oro</span>
                                <div className="text-sm font-black text-cyan-300">
                                  {player.bestPartner ? `${player.bestPartner.partnerName}` : 'Sin registros'}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {player.bestPartner ? `${player.bestPartner.winRate}% Vic (${player.bestPartner.winsTogether}V de ${player.bestPartner.matchesTogether})` : ''}
                                </div>
                              </div>
                              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                                <div>
                                  <span className="text-slate-400 font-bold block mb-1">⚡ Rating PI</span>
                                  <div className="text-xl font-black text-amber-400 font-mono">{player.bayesianRating.toFixed(3)}</div>
                                </div>
                                <button
                                  onClick={() => onSelectPlayerForIntelligence(player.playerId)}
                                  className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-neon flex items-center"
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
      )}
    </div>
  );
};
