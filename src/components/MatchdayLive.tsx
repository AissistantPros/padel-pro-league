import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  UserPlus,
  X,
  Award,
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
import { StorageService } from '../services/storageService.ts';

export const getOrdinalDateName = (index: number): string => {
  const ordinals = [
    'Primera Fecha',
    'Segunda Fecha',
    'Tercera Fecha',
    'Cuarta Fecha',
    'Quinta Fecha',
    'Sexta Fecha',
    'Séptima Fecha',
    'Octava Fecha',
    'Novena Fecha',
    'Décima Fecha',
    'Undécima Fecha',
    'Duodécima Fecha',
  ];
  return ordinals[index] || `Fecha #${index + 1}`;
};

export const formatSpanishDate = (dateStr: string): string => {
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (!year || !month || !day) return dateStr;
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${day} de ${months[month - 1]} de ${year}`;
  } catch {
    return dateStr;
  }
};

interface MatchdayLiveProps {
  days: TournamentDay[];
  players: Player[];
  statsList: PlayerIntelligenceStats[];
  config: TournamentConfig;
  isAdmin: boolean;
  onSaveDays: (updatedDays: TournamentDay[]) => void;
  onRequestAdmin: () => void;
  onSavePlayers?: (players: Player[]) => void;
}

export const MatchdayLive: React.FC<MatchdayLiveProps> = ({
  days,
  players,
  statsList,
  config,
  isAdmin,
  onSaveDays,
  onSavePlayers,
}) => {
  // Find if there is an ongoing active matchday (not completed)
  const activeDay = days.find(d => d.status !== 'completed');

  // selectedDayId: If there's an active day, default to it; otherwise null (to show list of dates)
  const [selectedDayId, setSelectedDayId] = useState<string>(activeDay ? activeDay.id : '');
  const [activeRoundTab, setActiveRoundTab] = useState<number>(1);
  const [activeScoreMatch, setActiveScoreMatch] = useState<Match | null>(null);

  // New Date Wizard State
  const [isCreatingNewDay, setIsCreatingNewDay] = useState(false);
  const [targetPlayerCount, setTargetPlayerCount] = useState<number>(16);
  const [newDayDate, setNewDayDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkedInIds, setCheckedInIds] = useState<string[]>([]);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [pairingMode, setPairingMode] = useState<'ranking' | 'random'>('ranking');

  // Inline Player Registration in Wizard
  const [isAddingPlayerInline, setIsAddingPlayerInline] = useState(false);
  const [inlinePlayerName, setInlinePlayerName] = useState('');
  const [inlinePlayerNickname, setInlinePlayerNickname] = useState('');
  const [inlinePlayerPhone, setInlinePlayerPhone] = useState('');

  // Sync selectedDayId when an active day is created or changes
  useEffect(() => {
    if (activeDay && !selectedDayId) {
      setSelectedDayId(activeDay.id);
    }
  }, [activeDay]);

  const currentDay = days.find(d => d.id === selectedDayId) || null;

  const handleOpenWizard = () => {
    setIsCreatingNewDay(true);
    setNewDayDate(new Date().toISOString().split('T')[0]);
    setIsAddingPlayerInline(false);
    setInlinePlayerName('');
    setInlinePlayerNickname('');
    setInlinePlayerPhone('');

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

  // Inline Player Creation inside Wizard
  const handleCreateInlinePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlinePlayerName.trim()) return;

    const newPlayer: Player = {
      id: `p_${Date.now()}`,
      name: inlinePlayerName.trim(),
      nickname: inlinePlayerNickname.trim() || undefined,
      phone: inlinePlayerPhone.trim() || undefined,
      registeredAt: new Date().toISOString().split('T')[0],
      isActive: true,
      role: 'player',
    };

    const updatedPlayers = [...players, newPlayer];
    if (onSavePlayers) {
      onSavePlayers(updatedPlayers);
    } else {
      StorageService.savePlayers(updatedPlayers);
    }

    // Auto-checkin if slots available
    if (checkedInIds.length < targetPlayerCount) {
      setCheckedInIds(prev => [...prev, newPlayer.id]);
    }

    setInlinePlayerName('');
    setInlinePlayerNickname('');
    setInlinePlayerPhone('');
    setIsAddingPlayerInline(false);
  };

  const handleStartNewDay = () => {
    if (checkedInIds.length !== targetPlayerCount) {
      alert(`Debes seleccionar exactamente ${targetPlayerCount} jugadores. Actualmente tienes ${checkedInIds.length}.`);
      return;
    }

    const dayId = `jornada_${Date.now()}`;
    const fixedDayName = getOrdinalDateName(days.length);
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
      name: fixedDayName,
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

    // Auto-progression: If all 3 preliminary rounds (1, 2, 3) are now fully completed and finals haven't been created yet,
    // automatically switch to the Finales tab (Tab 4) to prompt the admin to generate the finals!
    const allPrelimsDone = [1, 2, 3].every(rNum => {
      const r = updatedRounds.find(round => round.roundNumber === rNum);
      return r && r.matches.every(m => m.score.completed);
    });

    if (allPrelimsDone && currentDay.status === 'preliminaries') {
      setActiveRoundTab(4);
    }
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

    // Automatically navigate to the Tabla Día tab (Tab 99) to display the official final results!
    setActiveRoundTab(99);
  };

  const filteredPlayers = players.filter(p => {
    if (!playerSearchQuery.trim()) return true;
    const q = playerSearchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.nickname && p.nickname.toLowerCase().includes(q));
  });

  // Calculate completion status for each round
  const isRound1Done = currentDay?.rounds.find(r => r.roundNumber === 1)?.matches.every(m => m.score.completed) ?? false;
  const isRound2Done = currentDay?.rounds.find(r => r.roundNumber === 2)?.matches.every(m => m.score.completed) ?? false;
  const isRound3Done = currentDay?.rounds.find(r => r.roundNumber === 3)?.matches.every(m => m.score.completed) ?? false;
  const isFinalsDone = currentDay?.rounds.find(r => r.roundNumber === 4)?.matches.every(m => m.score.completed) ?? false;

  return (
    <div className="space-y-4 pb-20 md:pb-6 select-none">
      {/* ========================================================================= */}
      {/* SCENARIO 1: NO CURRENT MATCHDAY SELECTED (SHOW PAST DATES LIST)          */}
      {/* ========================================================================= */}
      {!currentDay && (
        <div className="space-y-4 animate-fade-in">
          {/* Header of Dates List */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-1">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-[#FFD60A] bg-[#FFD60A]/15 px-2.5 py-0.5 rounded-full border border-[#FFD60A]/30">
                  {config.editionName || 'Tercera Edición'}
                </span>
                <span className="text-xs text-[#8E8E93]">
                  {days.length} {days.length === 1 ? 'jornada guardada' : 'jornadas guardadas'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                Jornadas del Torneo
              </h1>
            </div>

            {isAdmin && (
              <button
                onClick={handleOpenWizard}
                className="px-4 py-2.5 rounded-2xl bg-[#30D158] active:bg-[#28B84B] text-black font-extrabold text-sm flex items-center justify-center shadow-lg shadow-[#30D158]/20 ios-touch"
              >
                <Plus className="w-4 h-4 mr-1.5 stroke-[3]" />
                Iniciar Nueva Fecha
              </button>
            )}
          </div>

          {/* Grid of Dates Cards */}
          {days.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {days.map((d, idx) => {
                const isDayCompleted = d.status === 'completed';
                const totalMatches = d.rounds.flatMap(r => r.matches).length;
                const winnerPlayer = d.finalStandings && d.finalStandings.length > 0 ? d.finalStandings[0] : null;

                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      setSelectedDayId(d.id);
                      setActiveRoundTab(isDayCompleted ? 99 : 1);
                    }}
                    className="ios-card p-5 space-y-3 cursor-pointer hover:border-white/20 active:scale-[0.99] transition-all relative overflow-hidden group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-white group-hover:text-[#30D158] transition-colors">
                        {getOrdinalDateName(idx)}
                      </span>
                      {isDayCompleted ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold text-[#30D158] bg-[#30D158]/15 border border-[#30D158]/30">
                          <CheckCircle className="w-3 h-3 mr-1" /> Completada
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider text-red-400 bg-red-600/20 border border-red-500/40 animate-pulse">
                          En Vivo
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#FFD60A] font-medium flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-80" />
                      {formatSpanishDate(d.date)}
                    </div>

                    <div className="text-xs text-[#8E8E93] flex items-center space-x-2">
                      <span>🎾 {d.checkedInPlayerIds.length} Jugadores</span>
                      <span>•</span>
                      <span>{totalMatches} Partidos</span>
                    </div>

                    {winnerPlayer && (
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-[#8E8E93] flex items-center">
                          <Trophy className="w-3.5 h-3.5 text-[#FFD60A] mr-1" />
                          Campeón de Fecha:
                        </span>
                        <span className="font-bold text-white truncate max-w-[150px]">
                          {winnerPlayer.playerName}
                        </span>
                      </div>
                    )}

                    <div className="pt-1 flex items-center justify-end text-xs font-semibold text-[#0A84FF] group-hover:translate-x-0.5 transition-transform">
                      Ver Partidos y Marcadores <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="ios-card p-10 text-center space-y-3">
              <Calendar className="w-12 h-12 text-[#FFD60A] mx-auto opacity-60" />
              <h3 className="text-lg font-bold text-white">Aún no hay fechas creadas</h3>
              <p className="text-xs text-[#8E8E93] max-w-sm mx-auto">
                Inicia la Primera Fecha del torneo seleccionando a los participantes para generar automáticamente los emparejamientos 50-50.
              </p>
              {isAdmin && (
                <button
                  onClick={handleOpenWizard}
                  className="px-5 py-2.5 rounded-xl bg-[#30D158] text-black font-bold text-sm inline-flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Crear Primera Fecha
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCENARIO 2: ACTIVE OR INSPECTED MATCHDAY VIEW                             */}
      {/* ========================================================================= */}
      {currentDay && (
        <div className="space-y-4 animate-fade-in">
          {/* Top Navigation Bar with Back Button when inspecting past day */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-1">
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                {/* Back to Dates List Button */}
                {(!activeDay || activeDay.id !== currentDay.id || currentDay.status === 'completed') && (
                  <button
                    onClick={() => setSelectedDayId('')}
                    className="inline-flex items-center px-2.5 py-1 rounded-xl bg-[#1C1C1E] text-xs font-bold text-[#8E8E93] hover:text-white border border-white/10 ios-touch mr-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    Fechas
                  </button>
                )}

                <span className="text-xs font-semibold text-[#FFD60A] bg-[#FFD60A]/15 px-2.5 py-0.5 rounded-full border border-[#FFD60A]/30">
                  {formatSpanishDate(currentDay.date)}
                </span>

                {/* TV-Style Animated Broadcast Badge */}
                {currentDay.status !== 'completed' && (
                  <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-red-600/20 border border-red-500/50 shadow-[0_0_10px_rgba(255,59,48,0.4)] animate-pulse">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                      EN VIVO
                    </span>
                  </div>
                )}

                <span className="text-xs text-[#8E8E93]">
                  {currentDay.checkedInPlayerIds.length} jugadores • {Math.floor(currentDay.checkedInPlayerIds.length / 4)} pistas
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                {currentDay.name}
              </h1>
            </div>

            {/* Day Selector & Action Buttons */}
            <div className="flex items-center space-x-2">
              {days.length > 1 && (
                <select
                  value={selectedDayId}
                  onChange={(e) => {
                    setSelectedDayId(e.target.value);
                  }}
                  className="bg-[#1C1C1E] border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#30D158]"
                >
                  {days.map((d, idx) => (
                    <option key={d.id} value={d.id}>
                      {getOrdinalDateName(idx)} ({d.date})
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

          {/* Non-Admin In-Progress Informative Notice */}
          {!isAdmin && currentDay.status !== 'completed' && (
            <div className="ios-card p-4 border border-[#FFD60A]/30 bg-[#FFD60A]/10 flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-[#FFD60A] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[#E5E5EA] space-y-1">
                <strong className="text-white block font-semibold text-sm">🎾 Jornada en Curso</strong>
                <p className="text-[#8E8E93]">
                  Consulta a continuación tus pistas y parejas asignadas. La tabla de posiciones oficial se revelará en cuanto el Administrador concluya y guarde la jornada completa.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ORDERED SEGMENTED CONTROL: [1] [2] [3] [Finales] [Tabla Día]              */}
          {/* ========================================================================= */}
          <div className="ios-segmented-control grid grid-cols-5 p-1 bg-[#1C1C1E] rounded-2xl border border-white/10">
            {/* Round 1 */}
            <button
              onClick={() => setActiveRoundTab(1)}
              className={`ios-segmented-item flex items-center justify-center space-x-1 ${
                activeRoundTab === 1 ? 'active' : ''
              } ${isRound1Done ? 'text-[#30D158]' : ''}`}
            >
              <span className="font-black text-sm sm:text-base">1</span>
              {isRound1Done && <span className="text-xs text-[#30D158] font-bold">✓</span>}
            </button>

            {/* Round 2 */}
            <button
              onClick={() => setActiveRoundTab(2)}
              className={`ios-segmented-item flex items-center justify-center space-x-1 ${
                activeRoundTab === 2 ? 'active' : ''
              } ${isRound2Done ? 'text-[#30D158]' : ''}`}
            >
              <span className="font-black text-sm sm:text-base">2</span>
              {isRound2Done && <span className="text-xs text-[#30D158] font-bold">✓</span>}
            </button>

            {/* Round 3 */}
            <button
              onClick={() => setActiveRoundTab(3)}
              className={`ios-segmented-item flex items-center justify-center space-x-1 ${
                activeRoundTab === 3 ? 'active' : ''
              } ${isRound3Done ? 'text-[#30D158]' : ''}`}
            >
              <span className="font-black text-sm sm:text-base">3</span>
              {isRound3Done && <span className="text-xs text-[#30D158] font-bold">✓</span>}
            </button>

            {/* Round 4 (Finales) */}
            <button
              onClick={() => setActiveRoundTab(4)}
              className={`ios-segmented-item flex items-center justify-center space-x-1 ${
                activeRoundTab === 4 ? 'active' : ''
              } ${isFinalsDone ? 'text-[#30D158]' : ''}`}
            >
              <span className="font-bold text-xs sm:text-sm">Finales</span>
              {isFinalsDone && <span className="text-xs text-[#30D158] font-bold">✓</span>}
            </button>

            {/* Intermediate / Final Standings Tab (ALWAYS LAST ITEM) */}
            <button
              onClick={() => setActiveRoundTab(99)}
              className={`ios-segmented-item font-bold text-xs sm:text-sm ${
                activeRoundTab === 99 ? 'active' : ''
              }`}
            >
              Tabla Día
            </button>
          </div>

          {/* ========================================================================= */}
          {/* PRELIMINARY ROUNDS (1, 2, 3)                                              */}
          {/* ========================================================================= */}
          {[1, 2, 3].includes(activeRoundTab) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#8E8E93] px-1">
                <span className="font-semibold text-white">Juego {activeRoundTab} de 3 preliminares</span>
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
                      currentDay={currentDay}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FINALES DE LA JORNADA (TAB 4)                                             */}
          {/* ========================================================================= */}
          {activeRoundTab === 4 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <span className="text-sm font-bold text-white">Finales de la Jornada</span>
                  <p className="text-[11px] text-[#8E8E93]">Definición de posiciones del 1º al último lugar</p>
                </div>

                {isAdmin && currentDay.status !== 'completed' && currentDay.rounds.find(r => r.roundNumber === 4) && (
                  <button
                    onClick={handleCompleteDay}
                    className="px-3.5 py-1.5 rounded-xl bg-[#30D158] text-black font-black text-xs ios-touch shadow-md shadow-[#30D158]/20"
                  >
                    Cerrar Fecha y Guardar
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
                        currentDay={currentDay}
                      />
                    ))}
                </div>
              ) : (
                <div className="ios-card p-8 text-center space-y-3">
                  <Flame className="w-12 h-12 text-[#FFD60A] mx-auto opacity-80" />
                  <h4 className="text-base font-bold text-white">Finales Listas para Generar</h4>
                  <p className="text-xs text-[#8E8E93] max-w-md mx-auto">
                    Los 3 juegos preliminares han finalizado. Haz clic a continuación para generar los cruces de finales (1º y 2º, 3º y 4º, 5º y 6º, 7º y 8º...).
                  </p>
                  {isAdmin && (
                    <button
                      onClick={handleGenerateDailyFinals}
                      className="px-5 py-3 rounded-2xl bg-[#FFD60A] text-black font-black text-sm inline-flex items-center shadow-lg shadow-[#FFD60A]/20 ios-touch"
                    >
                      <Flame className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                      Generar Cruces de Finales del Día
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TABLA DÍA (TAB 99 - MUST BE THE LAST ITEM)                                */}
          {/* ========================================================================= */}
          {activeRoundTab === 99 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <span className="text-sm font-bold text-white">
                    {currentDay.status === 'completed' ? '🏆 Resultados Finales Oficiales' : 'Posiciones Preliminares del Día'}
                  </span>
                  <p className="text-[11px] text-[#8E8E93]">
                    {currentDay.status === 'completed' ? 'Puntos acumulados y lugares oficiales' : 'Actualizada en tiempo real con cada game anotado'}
                  </p>
                </div>

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

              {/* Roster / Standings Rows */}
              <div className="ios-grouped-list divide-y divide-white/5">
                {(currentDay.status === 'completed' && currentDay.finalStandings && currentDay.finalStandings.length > 0
                  ? currentDay.finalStandings
                  : currentDay.prelimStandings.length > 0
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
                ).map((ps, idx) => {
                  const isGold = idx === 0;
                  const isSilver = idx === 1;
                  const isBronze = idx === 2;

                  return (
                    <div key={ps.playerId} className="ios-grouped-row flex items-center justify-between py-3 px-4">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <span className={`text-xs font-mono font-bold w-6 text-center ${
                          isGold ? 'text-[#FFD60A] font-black' : isSilver ? 'text-[#E5E5EA]' : isBronze ? 'text-[#FF9F0A]' : 'text-[#8E8E93]'
                        }`}>
                          #{idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-white truncate flex items-center">
                            {ps.playerName}
                            {isGold && <Trophy className="w-3.5 h-3.5 text-[#FFD60A] ml-1.5 inline" />}
                          </div>
                          <div className="text-xs text-[#8E8E93]">
                            {ps.matchesWon}V - {ps.matchesLost}D • {ps.gamesWon} games ({ps.gameDiff > 0 ? `+${ps.gameDiff}` : ps.gameDiff})
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold text-[#30D158]">
                          {formatScoreDisplay(ps.totalDailyScore)} pts
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULLSCREEN NEW DAY CREATION WIZARD MODAL                                  */}
      {/* ========================================================================= */}
      {isCreatingNewDay && (
        <div className="fixed inset-0 z-[100] bg-[#000000] text-white flex flex-col justify-between overflow-y-auto select-none animate-fade-in">
          {/* Top Bar */}
          <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <button
              onClick={() => setIsCreatingNewDay(false)}
              className="px-3.5 py-1.5 rounded-full bg-[#1C1C1E] text-[#8E8E93] hover:text-white text-xs font-semibold border border-white/10 ios-touch"
            >
              Cancelar
            </button>

            <div className="text-center">
              <span className="text-xs font-bold text-[#FFD60A]">
                {config.editionName || 'Tercera Edición'}
              </span>
              <h2 className="text-sm font-bold text-white">
                🎾 Programar {getOrdinalDateName(days.length)}
              </h2>
            </div>

            <button
              onClick={() => setIsCreatingNewDay(false)}
              className="w-8 h-8 rounded-full bg-[#1C1C1E] text-[#8E8E93] hover:text-white flex items-center justify-center border border-white/10 ios-touch"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main Wizard Content Area */}
          <div className="max-w-lg w-full mx-auto px-4 sm:px-6 py-4 space-y-5 flex-1">
            {/* Step 1: Fixed Name Badge & Date Picker */}
            <div className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#8E8E93] block font-semibold uppercase tracking-wider">Fecha del Torneo</span>
                  <div className="text-base font-black text-white">{getOrdinalDateName(days.length)}</div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30">
                  Automático
                </span>
              </div>

              <div>
                <label className="text-xs text-[#8E8E93] font-medium block mb-1">
                  📅 Día programado:
                </label>
                <input
                  type="date"
                  value={newDayDate}
                  onChange={(e) => setNewDayDate(e.target.value)}
                  className="w-full bg-[#2C2C2E] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-[#30D158]"
                />
              </div>
            </div>

            {/* Step 2: Player Count Selector */}
            <div className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/10 space-y-2.5">
              <label className="text-xs font-semibold uppercase text-[#8E8E93] tracking-wider block">
                1. Cupo de Jugadores:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[8, 12, 16, 20].map((num) => {
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
                      className={`py-3 px-2 rounded-xl text-center transition-all ios-touch border ${
                        isSelected
                          ? 'bg-[#30D158] text-black font-black border-[#30D158] shadow-md shadow-[#30D158]/30'
                          : 'bg-[#2C2C2E] border-white/5 text-white'
                      }`}
                    >
                      <div className="text-base font-black">{num}</div>
                      <div className="text-[10px] opacity-80">{courts} {courts === 1 ? 'Pista' : 'Pistas'}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Player Selection Roster & Inline Add Option */}
            <div className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase text-[#8E8E93] tracking-wider">
                  2. Participantes ({checkedInIds.length}/{targetPlayerCount}):
                </label>
                <button
                  type="button"
                  onClick={handleSelectTopByRanking}
                  className="text-xs text-[#0A84FF] font-bold hover:underline"
                >
                  Auto Top {targetPlayerCount}
                </button>
              </div>

              {/* Search + Add Player Inline Button */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-[#8E8E93] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={playerSearchQuery}
                    onChange={(e) => setPlayerSearchQuery(e.target.value)}
                    placeholder="Buscar jugador o apodo..."
                    className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#30D158]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingPlayerInline(prev => !prev)}
                  className="px-3 py-2 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-bold text-[#30D158] border border-white/10 flex items-center flex-shrink-0 ios-touch"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  + Nuevo
                </button>
              </div>

              {/* Inline Player Creation Form */}
              {isAddingPlayerInline && (
                <form onSubmit={handleCreateInlinePlayer} className="p-3 bg-[#2C2C2E] rounded-xl border border-[#30D158]/40 space-y-2.5 animate-slide-up">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Inscribir Jugador Nuevo al Torneo:</span>
                    <button type="button" onClick={() => setIsAddingPlayerInline(false)} className="text-[#8E8E93] hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre Completo *"
                      value={inlinePlayerName}
                      onChange={(e) => setInlinePlayerName(e.target.value)}
                      required
                      className="bg-[#1C1C1E] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#30D158]"
                    />
                    <input
                      type="text"
                      placeholder="Apodo (Ej: El Rayo)"
                      value={inlinePlayerNickname}
                      onChange={(e) => setInlinePlayerNickname(e.target.value)}
                      className="bg-[#1C1C1E] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#30D158]"
                    />
                  </div>
                  <input
                    type="tel"
                    placeholder="Teléfono (Opcional)"
                    value={inlinePlayerPhone}
                    onChange={(e) => setInlinePlayerPhone(e.target.value)}
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#30D158]"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-[#30D158] text-black font-black text-xs ios-touch"
                  >
                    Guardar e Inscribir a la Fecha
                  </button>
                </form>
              )}

              {/* Selection Roster List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1 bg-[#2C2C2E]/60 rounded-xl border border-white/5">
                {filteredPlayers.map((p) => {
                  const isChecked = checkedInIds.includes(p.id);
                  const pStat = statsList.find(s => s.playerId === p.id);

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleToggleCheckin(p.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ios-touch border ${
                        isChecked
                          ? 'bg-[#30D158]/20 text-white font-bold border-[#30D158]/50 shadow-sm'
                          : 'bg-[#1C1C1E] text-[#8E8E93] hover:text-white border-white/5'
                      }`}
                    >
                      <div className="min-w-0 flex-1 truncate pr-2">
                        <div className="text-white font-bold truncate">
                          {p.nickname ? `${p.nickname}` : p.name}
                        </div>
                        <div className="text-[10px] text-[#8E8E93] truncate">
                          {p.name} {pStat ? `• #${pStat.currentRank || '-'}` : ''}
                        </div>
                      </div>

                      {isChecked ? (
                        <CheckCircle className="w-4 h-4 text-[#30D158] flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Bar Action */}
          <div className="sticky bottom-0 z-20 bg-black/95 backdrop-blur-xl border-t border-white/10 px-4 sm:px-6 py-4 pb-8 sm:pb-6">
            <div className="max-w-lg mx-auto">
              <button
                type="button"
                onClick={handleStartNewDay}
                disabled={checkedInIds.length !== targetPlayerCount}
                className={`w-full h-14 sm:h-16 rounded-2xl font-black text-base flex items-center justify-center transition-all ios-touch ${
                  checkedInIds.length === targetPlayerCount
                    ? 'bg-[#30D158] text-black shadow-[0_0_25px_rgba(48,209,88,0.45)] active:scale-98 cursor-pointer'
                    : 'bg-[#1C1C1E] text-[#8E8E93] border border-white/10 cursor-not-allowed opacity-80'
                }`}
              >
                {checkedInIds.length === targetPlayerCount ? (
                  <>
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    Iniciar Jornada ({checkedInIds.length} Jugadores)
                  </>
                ) : (
                  <span className="text-xs sm:text-sm font-semibold text-[#8E8E93]">
                    Selecciona {targetPlayerCount - checkedInIds.length} jugadores más para iniciar
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCORE CAPTURE FULLSCREEN MODAL                                            */}
      {/* ========================================================================= */}
      <ScoreModal
        match={activeScoreMatch}
        isOpen={Boolean(activeScoreMatch)}
        onClose={() => setActiveScoreMatch(null)}
        onSaveScore={handleSaveMatchScore}
        players={players}
        statsList={statsList}
      />
    </div>
  );
};
