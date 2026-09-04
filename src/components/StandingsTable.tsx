import React, { useState } from 'react';
import { Trophy, ChevronRight, HelpCircle, Sparkles, Globe, Zap, Info, Calendar, Award, CheckCircle2, Flame, Clock } from 'lucide-react';
import type { PlayerIntelligenceStats, TournamentConfig, TournamentDay, Player } from '../types/index.ts';
import { formatScoreDisplay } from '../utils/tieBreakerEngine.ts';
import { PlayerDetailModal } from './PlayerDetailModal.tsx';

interface StandingsTableProps {
  stats: PlayerIntelligenceStats[];
  days: TournamentDay[];
  players: Player[];
  config: TournamentConfig;
  onSelectPlayerForIntelligence: (playerId: string) => void;
  onChangeRankingSystem: (system: 'bayesian' | 'total_points' | 'avg_points') => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  stats,
  days,
  players,
  config,
  onSelectPlayerForIntelligence,
}) => {
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<PlayerIntelligenceStats | null>(null);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [showHistoricalModal, setShowHistoricalModal] = useState(false);
  const [viewScope, setViewScope] = useState<'current' | 'matchdays'>('current');
  const [selectedMatchdayId, setSelectedMatchdayId] = useState<string>(
    days.length > 0 ? days[days.length - 1].id : ''
  );

  // Overall current tournament stats
  const sortedStats = [...stats].sort((a, b) => {
    if (b.totalChampionshipPoints !== a.totalChampionshipPoints) {
      return b.totalChampionshipPoints - a.totalChampionshipPoints;
    }
    return b.winRatePercentage - a.winRatePercentage;
  });

  // Career historical all-time sorted stats
  const historicalStats = [...stats].sort((a, b) => {
    if (b.bayesianRating !== a.bayesianRating) {
      return b.bayesianRating - a.bayesianRating;
    }
    return b.totalChampionshipPoints - a.totalChampionshipPoints;
  });

  const selectedDay = days.find(d => d.id === selectedMatchdayId) || (days.length > 0 ? days[days.length - 1] : null);

  const getPlayerAvatar = (playerId: string) => {
    const p = players.find(pl => pl.id === playerId);
    return p?.avatar;
  };

  const getPlayerNickname = (playerId: string) => {
    const p = players.find(pl => pl.id === playerId);
    return p?.nickname;
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* iOS Large Title Header */}
      <div className="pt-1 pb-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {viewScope === 'current' ? 'Clasificación' : 'Fechas del Torneo'}
            </h1>
            <p className="text-xs font-medium text-[#8E8E93] mt-0.5">
              {viewScope === 'current' 
                ? `${stats.length} jugadores inscritos • ${config.editionName || 'Tercera Edición'}`
                : `${days.length} ${days.length === 1 ? 'fecha registrada' : 'fechas registradas'}`}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHistoricalModal(true)}
              className="px-3 py-1.5 rounded-full bg-[#1C1C1E] text-[#8E8E93] hover:text-white flex items-center space-x-1.5 text-xs font-semibold border border-white/10 ios-touch"
              title="Récords Históricos Globales"
            >
              <Globe className="w-3.5 h-3.5 text-[#64D2FF]" />
              <span className="hidden sm:inline">Histórico</span>
            </button>

            <button
              onClick={() => setShowCriteriaModal(true)}
              className="w-8 h-8 rounded-full bg-[#1C1C1E] text-[#8E8E93] hover:text-white flex items-center justify-center border border-white/10 ios-touch"
              title="Criterios de desempate"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* iOS Native Segmented Control */}
        <div className="ios-segmented-control mt-3">
          <button
            onClick={() => setViewScope('current')}
            className={`ios-segmented-item ${viewScope === 'current' ? 'active' : ''}`}
          >
            🏆 Tabla General
          </button>
          <button
            onClick={() => setViewScope('matchdays')}
            className={`ios-segmented-item ${viewScope === 'matchdays' ? 'active' : ''}`}
          >
            📅 Fechas Anteriores
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. VIEW SCOPE: CURRENT TOURNAMENT OVERALL STANDINGS       */}
      {/* ======================================================== */}
      {viewScope === 'current' && (
        <>
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
              {/* Mobile Inset Grouped List */}
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

                          <div className="min-w-0 flex-1 pr-2">
                            <div className="text-base font-semibold text-white truncate leading-snug">
                              {player.playerName}
                            </div>
                            <div className="text-xs text-[#8E8E93] truncate mt-0.5">
                              {player.nickname ? `"${player.nickname}"` : `${player.daysAttended} fechas`} • {player.winRatePercentage}% Vic
                            </div>
                          </div>
                        </div>

                        {/* Right: Score */}
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

              {/* Desktop / iPad Table */}
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
        </>
      )}

      {/* ======================================================== */}
      {/* 2. VIEW SCOPE: MATCHDAYS OF THE CURRENT TOURNAMENT        */}
      {/* ======================================================== */}
      {viewScope === 'matchdays' && (
        <div className="space-y-4">
          {days.length === 0 ? (
            <div className="ios-card p-10 text-center space-y-3">
              <Calendar className="w-12 h-12 text-[#8E8E93] mx-auto opacity-50" />
              <h3 className="text-lg font-bold text-white">Sin fechas registradas</h3>
              <p className="text-xs text-[#8E8E93] max-w-xs mx-auto">
                Las fechas disputadas en este torneo aparecerán aquí con sus resultados y posiciones.
              </p>
            </div>
          ) : (
            <>
              {/* Horizontal Date Selector */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                {days.map((d, index) => {
                  const isSelected = (selectedDay?.id === d.id);
                  const isDone = d.status === 'completed';

                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedMatchdayId(d.id)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ios-touch flex items-center space-x-1.5 border ${
                        isSelected
                          ? 'bg-[#FFD60A] text-black border-[#FFD60A] shadow-md'
                          : 'bg-[#1C1C1E] text-white border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span>{d.name || `Fecha #${index + 1}`}</span>
                      {isDone && <span className="text-[10px] opacity-80">✓</span>}
                    </button>
                  );
                })}
              </div>

              {selectedDay && (
                <div className="space-y-4">
                  {/* Matchday Header Card */}
                  <div className="ios-card p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-[#FFD60A]">
                          🎾 {selectedDay.name}
                        </span>
                        <span className="text-xs text-[#8E8E93]">
                          {selectedDay.date}
                        </span>
                      </div>
                      <div className="text-xs text-[#8E8E93] mt-1">
                        {selectedDay.checkedInPlayerIds.length} jugadores • {selectedDay.rounds.length} rondas
                      </div>
                    </div>

                    <div>
                      {selectedDay.status === 'completed' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Finalizada
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30 flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" /> En Progreso
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Day Standings Table */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] px-1 block">
                      Posiciones Oficiales de la Fecha
                    </span>

                    {(selectedDay.finalStandings?.length > 0 || selectedDay.prelimStandings?.length > 0) ? (
                      <div className="ios-grouped-list divide-y divide-white/5">
                        {(selectedDay.finalStandings?.length > 0 ? selectedDay.finalStandings : selectedDay.prelimStandings).map((ps, idx) => {
                          const rank = idx + 1;
                          const avatar = getPlayerAvatar(ps.playerId);
                          const nickname = getPlayerNickname(ps.playerId);
                          const isGold = rank === 1;
                          const isSilver = rank === 2;
                          const isBronze = rank === 3;

                          return (
                            <div key={ps.playerId} className="ios-grouped-row flex items-center justify-between py-3 px-4">
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <span className="w-5 text-center font-bold text-xs">
                                  {isGold ? '🥇' : isSilver ? '🥈' : isBronze ? '🥉' : `#${rank}`}
                                </span>

                                {avatar ? (
                                  <img src={avatar} alt={ps.playerName} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-[#2C2C2E] text-[#8E8E93] font-bold text-xs flex items-center justify-center border border-white/10">
                                    {ps.playerName.slice(0, 2).toUpperCase()}
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-semibold text-white truncate">
                                    {ps.playerName}
                                  </div>
                                  <div className="text-xs text-[#8E8E93] truncate">
                                    {nickname ? `"${nickname}" • ` : ''}{ps.matchesWon}V - {ps.matchesLost}D ({ps.gamesWon} games)
                                  </div>
                                </div>
                              </div>

                              <div className="text-right pl-2">
                                <div className="font-mono text-sm font-bold text-[#30D158]">
                                  {formatScoreDisplay(ps.totalDailyScore || ps.prelimTotalScore || 0)}
                                </div>
                                <div className="text-[10px] text-[#8E8E93]">PTS DÍA</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="ios-card p-6 text-center text-xs text-[#8E8E93]">
                        La tabla de posiciones de esta fecha se computará al finalizar todos los partidos.
                      </div>
                    )}
                  </div>

                  {/* Day Matches Breakdown */}
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] px-1 block">
                      Partidos y Marcadores de la Fecha
                    </span>

                    {selectedDay.rounds.map((round) => (
                      <div key={round.roundNumber} className="space-y-2">
                        <div className="text-xs font-bold text-white px-1">
                          {round.name || `Ronda ${round.roundNumber}`}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {round.matches.map((m) => {
                            const isDone = m.score.completed;
                            const winA = isDone && m.score.winner === 'teamA';
                            const winB = isDone && m.score.winner === 'teamB';

                            return (
                              <div key={m.id} className="ios-card p-3 space-y-2 border border-white/5">
                                <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
                                  <span>🎾 {m.courtNumber ? `Pista ${m.courtNumber}` : (m.courtName?.replace(/Cancha/g, 'Pista') || 'Pista')}</span>
                                  <span>{isDone ? 'Finalizado' : 'Pendiente'}</span>
                                </div>

                                <div className="space-y-1.5">
                                  <div className={`p-2 rounded-xl flex items-center justify-between text-xs ${
                                    winA ? 'bg-[#30D158]/15 font-bold text-white' : 'bg-[#2C2C2E] text-white'
                                  }`}>
                                    <span className="truncate">{m.teamA.player1Name} & {m.teamA.player2Name}</span>
                                    <span className="font-mono font-bold text-sm pl-2">{isDone ? m.score.scoreA : '-'}</span>
                                  </div>

                                  <div className={`p-2 rounded-xl flex items-center justify-between text-xs ${
                                    winB ? 'bg-[#30D158]/15 font-bold text-white' : 'bg-[#2C2C2E] text-white'
                                  }`}>
                                    <span className="truncate">{m.teamB.player1Name} & {m.teamB.player2Name}</span>
                                    <span className="font-mono font-bold text-sm pl-2">{isDone ? m.score.scoreB : '-'}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Detail Half Sheet Modal */}
      {selectedPlayerForDetail && (
        <PlayerDetailModal
          player={selectedPlayerForDetail}
          onClose={() => setSelectedPlayerForDetail(null)}
          onOpenRadar={(playerId) => onSelectPlayerForIntelligence(playerId)}
        />
      )}

      {/* Historical All-Time Career Modal */}
      {showHistoricalModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#1C1C1E] border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-[28px] p-6 text-white shadow-2xl z-10 max-h-[85vh] overflow-y-auto space-y-4 animate-slide-up">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2 sm:hidden" />

            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <span className="text-xs font-semibold text-[#64D2FF]">Historial Multitorneo</span>
                <h3 className="text-lg font-bold text-white">Récords y Ranking Histórico</h3>
              </div>
              <button
                onClick={() => setShowHistoricalModal(false)}
                className="text-xs text-[#8E8E93] hover:text-white px-2.5 py-1 bg-[#2C2C2E] rounded-lg"
              >
                Cerrar
              </button>
            </div>

            <p className="text-xs text-[#8E8E93]">
              Clasificación acumulada ponderada por el algoritmo bayesiano a lo largo de todas las ediciones disputadas:
            </p>

            <div className="ios-grouped-list divide-y divide-white/5 max-h-96 overflow-y-auto">
              {historicalStats.map((player, idx) => (
                <div key={player.playerId} className="ios-grouped-row flex items-center justify-between py-3 px-4">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <span className="text-xs font-mono font-bold text-[#8E8E93] w-5">#{idx + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white truncate">{player.playerName}</div>
                      <div className="text-xs text-[#8E8E93]">
                        {player.daysAttended} fechas • {player.totalMatchesWon}V-{player.totalMatchesLost}D ({player.winRatePercentage}%)
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-[#FFD60A]">
                      {player.bayesianRating.toFixed(2)} PI
                    </div>
                    <div className="text-[10px] text-[#8E8E93]">
                      {formatScoreDisplay(player.totalChampionshipPoints)} pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
