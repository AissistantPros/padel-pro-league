import React, { useState } from 'react';
import {
  Calendar,
  CheckSquare,
  Square,
  Play,
  CheckCircle,
  Trophy,
  Flame,
  Plus,
  RefreshCw,
  Sparkles,
  Search,
  Zap,
  Dice5,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type {
  Player,
  TournamentDay,
  Match,
  MatchScore,
  PlayerIntelligenceStats,
  TournamentConfig
} from '../types/index.ts';
import { MatchCard } from './MatchCard.tsx';
import { ScoreModal } from './ScoreModal.tsx';
import { generatePreliminaryRounds, generateDailyFinalRound } from '../utils/pairingEngine.ts';
import { calculateDailyPrelimStandings, calculateDailyFinalStandings } from '../utils/intelligenceEngine.ts';
import { formatScoreDisplay } from '../utils/tieBreakerEngine.ts';

interface MatchdayLiveProps {
  days: TournamentDay[];
  players: Player[];
  statsList: PlayerIntelligenceStats[];
  config: TournamentConfig;
  isAdmin: boolean;
  onSaveDays: (updatedDays: TournamentDay[]) => void;
  onRequestAdmin: () => void;
}

export const MatchdayLive: React.FC<MatchdayLiveProps> = ({
  days,
  players,
  statsList,
  config,
  isAdmin,
  onSaveDays,
}) => {
  const [selectedDayId, setSelectedDayId] = useState<string>(
    days.length > 0 ? days[days.length - 1].id : ''
  );
  const [activeRoundTab, setActiveRoundTab] = useState<number>(1);
  const [activeScoreMatch, setActiveScoreMatch] = useState<Match | null>(null);

  // New Date Wizard State
  const [isCreatingNewDay, setIsCreatingNewDay] = useState(false);
  const [targetPlayerCount, setTargetPlayerCount] = useState<number>(16);
  const [newDayName, setNewDayName] = useState(`Fecha G20 #${days.length + 1}`);
  const [newDayDate, setNewDayDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkedInIds, setCheckedInIds] = useState<string[]>([]);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [pairingMode, setPairingMode] = useState<'ranking' | 'random'>('ranking');

  const currentDay = days.find(d => d.id === selectedDayId) || (days.length > 0 ? days[days.length - 1] : null);

  const handleOpenWizard = () => {
    setIsCreatingNewDay(true);
    setNewDayName(`Fecha G20 #${days.length + 1}`);
    setNewDayDate(new Date().toISOString().split('T')[0]);

    const available = players.filter(p => p.isActive).length;
    let defCount = 16;
    if (available < 16 && available >= 12) defCount = 12;
    else if (available < 12 && available >= 8) defCount = 8;
    else if (available < 8 && available >= 4) defCount = 4;
    setTargetPlayerCount(defCount);

    const active = players.filter(p => p.isActive).slice(0, defCount);
    setCheckedInIds(active.map(p => p.id));
    setPairingMode(statsList.some(s => s.totalMatchesPlayed > 0) ? 'ranking' : 'random');
  };

  const handleToggleCheckin = (playerId: string) => {
    setCheckedInIds(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        if (prev.length >= targetPlayerCount) {
          return prev;
        }
        return [...prev, playerId];
      }
    });
  };

  const handleSelectTopByRanking = () => {
    const sorted = [...players].sort((a, b) => {
      const stA = statsList.find(s => s.playerId === a.id)?.currentRank ?? 999;
      const stB = statsList.find(s => s.playerId === b.id)?.currentRank ?? 999;
      return stA - stB;
    });
    setCheckedInIds(sorted.slice(0, targetPlayerCount).map(p => p.id));
  };

  const handleStartNewDay = () => {
    if (checkedInIds.length !== targetPlayerCount) {
      alert(`Debes seleccionar exactamente ${targetPlayerCount} jugadores. Actualmente tienes ${checkedInIds.length}.`);
      return;
    }

    const dayId = `jornada_${Date.now()}`;
    const participatingPlayers = players.filter(p => checkedInIds.includes(p.id));
    const isRandom = pairingMode === 'random';

    const rankingMap = new Map<string, number>(
      statsList.map(s => [s.playerId, s.totalChampionshipPoints > 0 ? s.totalChampionshipPoints : (50 - (s.currentRank || 20)) * 2])
    );

    const rounds = generatePreliminaryRounds(
      dayId,
      participatingPlayers,
      isRandom,
      isRandom ? undefined : rankingMap,
      config.courtNames
    );

    const newDay: TournamentDay = {
      id: dayId,
      name: newDayName,
      date: newDayDate,
      status: 'preliminaries',
      checkedInPlayerIds: checkedInIds,
      rounds,
      prelimStandings: [],
      finalStandings: [],
      createdAt: new Date().toISOString(),
    };

    const updated = [...days, newDay];
    onSaveDays(updated);
    setSelectedDayId(dayId);
    setIsCreatingNewDay(false);
    setActiveRoundTab(1);
  };

  const handleSaveMatchScore = (matchId: string, score: MatchScore) => {
    if (!currentDay) return;

    const updatedRounds = currentDay.rounds.map(round => {
      const matchIndex = round.matches.findIndex(m => m.id === matchId);
      if (matchIndex === -1) return round;

      const updatedMatches = [...round.matches];
      updatedMatches[matchIndex] = {
        ...updatedMatches[matchIndex],
        score,
        completedAt: new Date().toISOString(),
      };

      const allMatchesCompleted = updatedMatches.every(m => m.score.completed);

      return {
        ...round,
        matches: updatedMatches,
        isCompleted: allMatchesCompleted,
      };
    });

    const prelimMatches = updatedRounds
      .filter(r => r.roundNumber <= 3)
      .flatMap(r => r.matches);
    
    const participatingPlayers = players.filter(p => currentDay.checkedInPlayerIds.includes(p.id));
    const newPrelimStandings = calculateDailyPrelimStandings(participatingPlayers, prelimMatches);

    const finalRound = updatedRounds.find(r => r.roundNumber === 4);
    const newFinalStandings = finalRound
      ? calculateDailyFinalStandings(newPrelimStandings, finalRound.matches)
      : currentDay.finalStandings;

    const updatedDay: TournamentDay = {
      ...currentDay,
      rounds: updatedRounds,
      prelimStandings: newPrelimStandings,
      finalStandings: newFinalStandings,
    };

    const updatedDays = days.map(d => (d.id === currentDay.id ? updatedDay : d));
    onSaveDays(updatedDays);
  };

  const handleGenerateDailyFinals = () => {
    if (!currentDay) return;

    const prelimMatches = currentDay.rounds
      .filter(r => r.roundNumber <= 3)
      .flatMap(r => r.matches);

    const participatingPlayers = players.filter(p => currentDay.checkedInPlayerIds.includes(p.id));
    const prelimStandings = calculateDailyPrelimStandings(participatingPlayers, prelimMatches);

    const finalRound = generateDailyFinalRound(
      currentDay.id,
      prelimStandings,
      config.courtNames
    );

    const existingRounds = currentDay.rounds.filter(r => r.roundNumber <= 3);
    const updatedRounds = [...existingRounds, finalRound];

    const updatedDay: TournamentDay = {
      ...currentDay,
      status: 'finals',
      rounds: updatedRounds,
      prelimStandings,
    };

    const updatedDays = days.map(d => (d.id === currentDay.id ? updatedDay : d));
    onSaveDays(updatedDays);
    setActiveRoundTab(4);
  };

  const handleCompleteDay = () => {
    if (!currentDay) return;

    const finalRound = currentDay.rounds.find(r => r.roundNumber === 4);
    if (!finalRound || !finalRound.matches.every(m => m.score.completed)) {
      alert('Completa todos los marcadores de las Finales antes de cerrar la fecha.');
      return;
    }

    const finalStandings = calculateDailyFinalStandings(currentDay.prelimStandings, finalRound.matches);

    const updatedDay: TournamentDay = {
      ...currentDay,
      status: 'completed',
      finalStandings,
      completedAt: new Date().toISOString(),
    };

    const updatedDays = days.map(d => (d.id === currentDay.id ? updatedDay : d));
    onSaveDays(updatedDays);

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  const filteredPlayers = players.filter(p => {
    if (!playerSearchQuery.trim()) return true;
    const q = playerSearchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.nickname && p.nickname.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-4 pb-20 md:pb-6 select-none">
      {/* Top Matchday Header */}
      <div className="pt-1 pb-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-[#FFD60A] bg-[#FFD60A]/15 px-2.5 py-0.5 rounded-full border border-[#FFD60A]/30">
                {currentDay ? currentDay.date : 'Calendario'}
              </span>
              {currentDay && (
                <span className="text-xs text-[#8E8E93]">
                  {currentDay.checkedInPlayerIds.length} jugadores • {Math.floor(currentDay.checkedInPlayerIds.length / 4)} canchas
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              {currentDay ? currentDay.name : 'Jornada en Vivo'}
            </h1>
          </div>

          {/* Day Selector & Action Buttons */}
          <div className="flex items-center space-x-2">
            {days.length > 0 && (
              <select
                value={selectedDayId}
                onChange={(e) => {
                  setSelectedDayId(e.target.value);
                  setIsCreatingNewDay(false);
                }}
                className="bg-[#1C1C1E] border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#30D158]"
              >
                {days.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.date})
                  </option>
                ))}
              </select>
            )}

            {isAdmin && (
              <button
                onClick={handleOpenWizard}
                className="px-3.5 py-2 rounded-xl bg-[#30D158] active:bg-[#28B84B] text-black font-bold text-xs flex items-center ios-touch"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Nueva Fecha
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Step-by-Step New Day Creation Wizard Modal */}
      {isCreatingNewDay && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#1C1C1E] border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-[28px] p-6 text-white shadow-2xl z-10 max-h-[90vh] overflow-y-auto space-y-4 animate-slide-up">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2 sm:hidden" />

            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center">
                🎾 Programar Nueva Fecha
              </h3>
              <button
                onClick={() => setIsCreatingNewDay(false)}
                className="text-xs font-semibold text-[#8E8E93] hover:text-white px-2.5 py-1 bg-[#2C2C2E] rounded-lg"
              >
                Cancelar
              </button>
            </div>

            {/* Paso 1: Cantidad */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-[#8E8E93] tracking-wider block">
                1. Número de Jugadores:
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[4, 8, 12, 16, 20].map((num) => {
                  const courts = num / 4;
                  const isSelected = targetPlayerCount === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setTargetPlayerCount(num);
                        if (checkedInIds.length > num) {
                          setCheckedInIds(checkedInIds.slice(0, num));
                        }
                      }}
                      className={`p-2.5 rounded-xl text-center transition-all ios-touch border ${
                        isSelected
                          ? 'bg-[#30D158] text-black font-bold border-[#30D158]'
                          : 'bg-[#2C2C2E] border-white/5 text-white'
                      }`}
                    >
                      <div className="text-base font-bold">{num}</div>
                      <div className="text-[10px] opacity-80">{courts} {courts === 1 ? 'C' : 'C'}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fecha y Nombre */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-[#8E8E93] block mb-1">Nombre</label>
                <input
                  type="text"
                  value={newDayName}
                  onChange={(e) => setNewDayName(e.target.value)}
                  className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#8E8E93] block mb-1">Fecha</label>
                <input
                  type="date"
                  value={newDayDate}
                  onChange={(e) => setNewDayDate(e.target.value)}
                  className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-semibold"
                />
              </div>
            </div>

            {/* Paso 2: Selección */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase text-[#8E8E93] tracking-wider">
                  2. Participantes ({checkedInIds.length}/{targetPlayerCount}):
                </label>
                <button
                  type="button"
                  onClick={handleSelectTopByRanking}
                  className="text-xs text-[#0A84FF] font-semibold"
                >
                  Auto Top {targetPlayerCount}
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8E8E93] absolute left-3 top-3" />
                <input
                  type="text"
                  value={playerSearchQuery}
                  onChange={(e) => setPlayerSearchQuery(e.target.value)}
                  placeholder="Buscar jugador..."
                  className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-[#2C2C2E] rounded-xl border border-white/5">
                {filteredPlayers.map((p) => {
                  const isChecked = checkedInIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleToggleCheckin(p.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                        isChecked
                          ? 'bg-[#30D158]/20 text-[#30D158] font-bold border border-[#30D158]/40'
                          : 'bg-[#1C1C1E] text-[#8E8E93] hover:text-white'
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      {isChecked ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-white/20" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleStartNewDay}
              disabled={checkedInIds.length !== targetPlayerCount}
              className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center transition-all ios-touch ${
                checkedInIds.length === targetPlayerCount
                  ? 'bg-[#30D158] text-black active:bg-[#28B84B]'
                  : 'bg-[#2C2C2E] text-[#8E8E93] cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 mr-1.5" />
              Generar Cruces Parejos
            </button>
          </div>
        </div>
      )}

      {/* Main Active Day Rounds & Tabs */}
      {currentDay && (
        <div className="space-y-4">
          {/* iOS Segmented Control for Rounds */}
          <div className="ios-segmented-control">
            {[1, 2, 3].map((rNum) => {
              const r = currentDay.rounds.find(round => round.roundNumber === rNum);
              const isDone = r?.isCompleted;

              return (
                <button
                  key={rNum}
                  onClick={() => setActiveRoundTab(rNum)}
                  className={`ios-segmented-item ${activeRoundTab === rNum ? 'active' : ''}`}
                >
                  {isDone ? '✓ ' : ''}Juego {rNum}
                </button>
              );
            })}

            <button
              onClick={() => setActiveRoundTab(99)}
              className={`ios-segmented-item ${activeRoundTab === 99 ? 'active' : ''}`}
            >
              Tabla Día
            </button>

            <button
              onClick={() => setActiveRoundTab(4)}
              className={`ios-segmented-item ${activeRoundTab === 4 ? 'active' : ''}`}
            >
              👑 Finales
            </button>
          </div>

          {/* Prelim Matches (1, 2, 3) */}
          {[1, 2, 3].includes(activeRoundTab) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#8E8E93] px-1">
                <span>Ronda {activeRoundTab} de 3 preliminares</span>
                <span>Al mejor de 7 games</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentDay.rounds
                  .find(r => r.roundNumber === activeRoundTab)
                  ?.matches.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      isAdmin={isAdmin}
                      onOpenScoreModal={(m) => setActiveScoreMatch(m)}
                      statsList={statsList}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Intermediate Daily Standings View (Tab 99) */}
          {activeRoundTab === 99 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-bold text-white">Posiciones de la Jornada</span>
                {isAdmin && currentDay.status === 'preliminaries' && (
                  <button
                    onClick={handleGenerateDailyFinals}
                    className="px-3 py-1.5 rounded-xl bg-[#FFD60A] text-black font-bold text-xs ios-touch flex items-center"
                  >
                    <Flame className="w-3.5 h-3.5 mr-1" />
                    Generar Finales
                  </button>
                )}
              </div>

              <div className="ios-grouped-list divide-y divide-white/5">
                {(currentDay.prelimStandings.length > 0
                  ? currentDay.prelimStandings
                  : currentDay.checkedInPlayerIds.map((id, idx) => ({
                      playerId: id,
                      playerName: players.find(p => p.id === id)?.name || id,
                      dailyRank: idx + 1,
                      matchesPlayed: 0,
                      matchesWon: 0,
                      matchesLost: 0,
                      gamesWon: 0,
                      gamesLost: 0,
                      gameDiff: 0,
                      basePoints: 0,
                      marginBonus: 0,
                      roundRecordBonus: 0,
                      finalMatchBonus: 0,
                      cleanSweepBonus: 0,
                      prelimTotalScore: 0,
                      totalDailyScore: 0,
                      prelimRank: idx + 1,
                    }))
                ).map((ps, idx) => (
                  <div key={ps.playerId} className="ios-grouped-row flex items-center justify-between py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-mono font-bold text-[#8E8E93] w-5">#{idx + 1}</span>
                      <div>
                        <div className="text-sm font-semibold text-white">{ps.playerName}</div>
                        <div className="text-xs text-[#8E8E93]">{ps.matchesWon}V - {ps.matchesLost}D ({ps.gamesWon} games)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-[#30D158]">
                        {formatScoreDisplay(ps.totalDailyScore)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Final Round (Tab 4) */}
          {activeRoundTab === 4 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-bold text-white">Finales del Día</span>
                {isAdmin && currentDay.status !== 'completed' && (
                  <button
                    onClick={handleCompleteDay}
                    className="px-3.5 py-1.5 rounded-xl bg-[#30D158] text-black font-bold text-xs ios-touch"
                  >
                    Cerrar Fecha y Sumar Puntos
                  </button>
                )}
              </div>

              {currentDay.rounds.find(r => r.roundNumber === 4) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentDay.rounds
                    .find(r => r.roundNumber === 4)
                    ?.matches.map(match => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        isAdmin={isAdmin}
                        onOpenScoreModal={(m) => setActiveScoreMatch(m)}
                        statsList={statsList}
                      />
                    ))}
                </div>
              ) : (
                <div className="ios-card p-8 text-center space-y-2">
                  <Flame className="w-10 h-10 text-[#FFD60A] mx-auto opacity-70" />
                  <h4 className="text-base font-bold text-white">Finales aún no generadas</h4>
                  <p className="text-xs text-[#8E8E93]">
                    Juega los 3 juegos preliminares y luego genera los cruces de Oro, Plata y Bronce.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Score Modal */}
      <ScoreModal
        match={activeScoreMatch}
        isOpen={Boolean(activeScoreMatch)}
        onClose={() => setActiveScoreMatch(null)}
        onSaveScore={handleSaveMatchScore}
      />
    </div>
  );
};
