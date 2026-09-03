import React, { useState } from 'react';
import { Trophy, ChevronRight, HelpCircle, Sparkles, Globe, Zap, Info } from 'lucide-react';
import type { PlayerIntelligenceStats, TournamentConfig } from '../types/index.ts';
import { formatScoreDisplay } from '../utils/tieBreakerEngine.ts';
import { PlayerDetailModal } from './PlayerDetailModal.tsx';

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
}) => {
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<PlayerIntelligenceStats | null>(null);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [viewScope, setViewScope] = useState<'current' | 'all_time'>('current');

  // Sort based on view scope
  const sortedStats = [...stats].sort((a, b) => {
    if (viewScope === 'current') {
      if (b.totalChampionshipPoints !== a.totalChampionshipPoints) {
        return b.totalChampionshipPoints - a.totalChampionshipPoints;
      }
      return b.winRatePercentage - a.winRatePercentage;
    } else {
      if (b.bayesianRating !== a.bayesianRating) {
        return b.bayesianRating - a.bayesianRating;
      }
      return b.totalChampionshipPoints - a.totalChampionshipPoints;
    }
  });

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* iOS Large Title Header */}
      <div className="pt-1 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-[#FFD60A] bg-[#FFD60A]/15 px-2.5 py-0.5 rounded-full border border-[#FFD60A]/30">
                {config.editionName || `${config.editionNumber || 3}er Torneo`}
              </span>
              <span className="text-xs font-medium text-[#8E8E93]">
                {stats.length} participantes
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              {viewScope === 'current' ? 'Clasificación' : 'Histórico Global'}
            </h1>
          </div>

          <button
            onClick={() => setShowCriteriaModal(true)}
            className="w-9 h-9 rounded-full bg-[#1C1C1E] text-[#8E8E93] hover:text-white flex items-center justify-center border border-white/10 ios-touch"
            title="Criterios de desempate"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* iOS Native Segmented Control */}
        <div className="ios-segmented-control mt-3">
          <button
            onClick={() => setViewScope('current')}
            className={`ios-segmented-item ${viewScope === 'current' ? 'active' : ''}`}
          >
            🏆 Torneo Actual
          </button>
          <button
            onClick={() => setViewScope('all_time')}
            className={`ios-segmented-item ${viewScope === 'all_time' ? 'active' : ''}`}
          >
            🌐 Ranking Histórico
          </button>
        </div>
      </div>

      {/* Empty State */}
      {sortedStats.length === 0 ? (
        <div className="ios-card p-10 text-center space-y-3">
          <Trophy className="w-12 h-12 text-[#8E8E93] mx-auto opacity-50" />
          <h3 className="text-lg font-bold text-white">Sin datos registrados</h3>
          <p className="text-xs text-[#8E8E93] max-w-xs mx-auto">
            Ve a la pestaña <strong>Jornada</strong> para arrancar los primeros partidos.
          </p>
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* 1. MOBILE INSET GROUPED LIST (Apple Native HIG Style)     */}
          {/* ======================================================== */}
          <div className="block md:hidden">
            <div className="ios-grouped-list divide-y divide-white/5">
              {sortedStats.map((player, idx) => {
                const rank = idx + 1;
                const isPodium1 = rank === 1 && player.totalMatchesPlayed > 0;
                const isPodium2 = rank === 2 && player.totalMatchesPlayed > 0;
                const isPodium3 = rank === 3 && player.totalMatchesPlayed > 0;

                return (
                  <div
                    key={player.playerId}
                    onClick={() => setSelectedPlayerForDetail(player)}
                    className="ios-grouped-row cursor-pointer flex items-center justify-between py-3.5 px-4 active:bg-[#2C2C2E] transition-colors"
                  >
                    {/* Left: Position Rank & Avatar */}
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {/* Position Number */}
                      <div className="w-6 text-center flex-shrink-0">
                        {isPodium1 ? (
                          <span className="text-base font-bold text-[#FFD60A]">1º</span>
                        ) : isPodium2 ? (
                          <span className="text-base font-bold text-[#E5E5EA]">2º</span>
                        ) : isPodium3 ? (
                          <span className="text-base font-bold text-[#FF9F0A]">3º</span>
                        ) : (
                          <span className="text-sm font-semibold text-[#8E8E93]">{rank}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      {player.avatar ? (
                        <img
                          src={player.avatar}
                          alt={player.playerName}
                          className="w-11 h-11 rounded-full object-cover border border-white/10 bg-[#2C2C2E] flex-shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[#2C2C2E] text-[#8E8E93] font-bold text-xs flex items-center justify-center flex-shrink-0 border border-white/10">
                          {player.playerName.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      {/* Player Name & Subtitle */}
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-base font-semibold text-white truncate leading-snug">
                          {player.playerName}
                        </div>
                        <div className="text-xs text-[#8E8E93] truncate mt-0.5">
                          {player.nickname ? `"${player.nickname}"` : `${player.daysAttended} fechas`} • {player.winRatePercentage}% Vic
                        </div>
                      </div>
                    </div>

                    {/* Right: Clean Score & Chevron */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-mono text-base font-bold text-[#30D158]">
                          {formatScoreDisplay(player.totalChampionshipPoints)}
                        </div>
                        <div className="text-[10px] text-[#8E8E93] font-medium uppercase tracking-wider">
                          PTS
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8E8E93]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. DESKTOP / IPAD SLEEK TABLE                            */}
          {/* ======================================================== */}
          <div className="hidden md:block ios-card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1C1C1E] text-[#8E8E93] text-xs uppercase tracking-wider font-bold border-b border-white/10">
                  <th className="py-3.5 px-4 text-center w-16">Pos</th>
                  <th className="py-3.5 px-4">Jugador</th>
                  <th className="py-3.5 px-3 text-center">Fechas</th>
                  <th className="py-3.5 px-3 text-center">Récord</th>
                  <th className="py-3.5 px-3 text-center">% Vic</th>
                  <th className="py-3.5 px-3 text-center">Games Base</th>
                  <th className="py-3.5 px-3 text-center">Desempate</th>
                  <th className="py-3.5 px-5 text-right">Puntos Totales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {sortedStats.map((player, idx) => {
                  const rank = idx + 1;
                  const isPodium1 = rank === 1 && player.totalMatchesPlayed > 0;
                  const isPodium2 = rank === 2 && player.totalMatchesPlayed > 0;
                  const isPodium3 = rank === 3 && player.totalMatchesPlayed > 0;

                  return (
                    <tr
                      key={player.playerId}
                      onClick={() => setSelectedPlayerForDetail(player)}
                      className="hover:bg-[#2C2C2E]/60 cursor-pointer transition-colors"
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-bold">
                        {isPodium1 ? (
                          <span className="text-[#FFD60A]">👑 1</span>
                        ) : isPodium2 ? (
                          <span className="text-[#E5E5EA]">🥈 2</span>
                        ) : isPodium3 ? (
                          <span className="text-[#FF9F0A]">🥉 3</span>
                        ) : (
                          <span className="text-[#8E8E93]">{rank}</span>
                        )}
                      </td>

                      {/* Player Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          {player.avatar ? (
                            <img
                              src={player.avatar}
                              alt={player.playerName}
                              className="w-10 h-10 rounded-full object-cover border border-white/10 bg-[#2C2C2E]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#2C2C2E] text-[#8E8E93] font-bold text-xs flex items-center justify-center">
                              {player.playerName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white">{player.playerName}</div>
                            <div className="text-xs text-[#8E8E93]">{player.nickname ? `"${player.nickname}"` : 'Jugador'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center text-white font-medium">{player.daysAttended}</td>
                      <td className="py-3.5 px-3 text-center font-mono text-[#8E8E93]">{player.totalMatchesWon}V - {player.totalMatchesLost}D</td>
                      <td className="py-3.5 px-3 text-center font-semibold text-white">{player.winRatePercentage}%</td>
                      <td className="py-3.5 px-3 text-center font-mono text-white">{player.totalBasePoints} pts</td>
                      <td className="py-3.5 px-3 text-center font-mono text-xs text-[#30D158]">
                        {player.totalDecimalBonus >= 0 ? `+${player.totalDecimalBonus.toFixed(3)}` : player.totalDecimalBonus.toFixed(3)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-base text-[#30D158]">
                        {formatScoreDisplay(player.totalChampionshipPoints)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Detail Half Sheet Modal */}
      {selectedPlayerForDetail && (
        <PlayerDetailModal
          player={selectedPlayerForDetail}
          onClose={() => setSelectedPlayerForDetail(null)}
          onOpenRadar={(playerId) => onSelectPlayerForIntelligence(playerId)}
        />
      )}

      {/* Clean iOS Criteria Modal */}
      {showCriteriaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="ios-card w-full max-w-md p-6 space-y-4 border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Sistema de Puntuación</h3>
              <button
                onClick={() => setShowCriteriaModal(false)}
                className="text-xs text-[#8E8E93] hover:text-white px-2.5 py-1 bg-[#2C2C2E] rounded-lg"
              >
                Cerrar
              </button>
            </div>
            <div className="space-y-3 text-xs text-[#8E8E93] leading-relaxed">
              <div className="p-3 bg-[#2C2C2E] rounded-xl">
                <strong className="text-white block mb-1">1. Puntos Base (Mandan)</strong>
                Cada game ganado suma 1 punto base a la tabla. Quien gana más games se coloca más arriba.
              </div>
              <div className="p-3 bg-[#2C2C2E] rounded-xl">
                <strong className="text-white block mb-1">2. Desempates (Decimales)</strong>
                En caso de empate en games, se suman decimales por margen de victoria (ej. 6-1 suma +0.003) y rachas de partidos invicto.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
