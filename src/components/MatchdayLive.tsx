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
    <div className="space-y-5 pb-20 md:pb-6">
      {/* Top Matchday Header & Switcher */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
              <Calendar className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-white">
                {currentDay ? currentDay.name : 'Gestión de Fecha'}
              </h2>
              <div className="text-xs sm:text-sm text-slate-400 flex items-center space-x-2 mt-0.5 flex-wrap">
                <span className="font-bold text-slate-300">{currentDay ? currentDay.date : ''}</span>
                {currentDay && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">
                      {currentDay.checkedInPlayerIds.length} Jugadores ({Math.floor(currentDay.checkedInPlayerIds.length / 4)} Canchas)
                    </span>
                    <span>•</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[11px] ${
                      currentDay.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : currentDay.status === 'finals'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {currentDay.status === 'completed' ? 'Fecha Concluida' : currentDay.status === 'finals' ? 'Fase Finales' : 'Juegos Preliminares'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Day Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {days.length > 0 && (
            <select
              value={selectedDayId}
              onChange={(e) => {
                setSelectedDayId(e.target.value);
                setIsCreatingNewDay(false);
              }}
              className="bg-slate-900 border border-slate-700 text-white rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-black focus:outline-none focus:border-emerald-500 flex-1 md:flex-none"
            >
              {days.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.date}) - {d.checkedInPlayerIds.length} Jugadores
                </option>
              ))}
            </select>
          )}

          {isAdmin && currentDay && currentDay.status === 'preliminaries' && (
            <button
              onClick={() => {
                if (confirm('¿Reequilibrar los 3 juegos preliminares al 50-50?')) {
                  const participatingPlayers = players.filter(p => currentDay.checkedInPlayerIds.includes(p.id));
                  const rankingMap = new Map<string, number>(
                    statsList.map(s => [s.playerId, s.totalChampionshipPoints > 0 ? s.totalChampionshipPoints : (50 - (s.currentRank || 20)) * 2])
                  );
                  const rounds = generatePreliminaryRounds(
                    currentDay.id,
                    participatingPlayers,
                    false,
                    rankingMap,
                    config.courtNames
                  );
                  const updatedDay: TournamentDay = {
                    ...currentDay,
                    rounds,
                  };
                  const updatedDays = days.map(d => (d.id === currentDay.id ? updatedDay : d));
                  onSaveDays(updatedDays);
                }
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 active:bg-slate-700 text-cyan-400 font-black text-xs sm:text-sm border border-slate-700 flex items-center transition-all"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              50-50
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleOpenWizard}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 active:bg-emerald-400 text-black font-black text-xs sm:text-sm shadow-neon flex items-center transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nueva Fecha
            </button>
          )}
        </div>
      </div>

      {/* Step-by-Step New Day Creation Wizard */}
      {isCreatingNewDay && (
        <div className="glass-panel-neon p-5 sm:p-7 rounded-3xl space-y-5 animate-fade-in border-2 border-emerald-500/40">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center">
              <span className="w-7 h-7 rounded-xl bg-emerald-500 text-black inline-flex items-center justify-center font-black text-sm mr-2">
                +
              </span>
              Programar Nueva Fecha
            </h3>
            <button
              onClick={() => setIsCreatingNewDay(false)}
              className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
          </div>

          {/* PASO 1: ¿Cuántos jugadores van a jugar? */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-emerald-400 tracking-wider block">
              Paso 1: ¿Cuántos jugadores van a participar hoy?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
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
                    className={`p-3.5 rounded-2xl text-center transition-all border ${
                      isSelected
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-neon font-black scale-105'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xl sm:text-2xl font-black font-display">{num} Jugadores</div>
                    <div className="text-xs opacity-80 font-bold">{courts} {courts === 1 ? 'Cancha' : 'Canchas'}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fecha y Nombre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Nombre de la Fecha</label>
              <input
                type="text"
                value={newDayName}
                onChange={(e) => setNewDayName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Fecha de Juego</label>
              <input
                type="date"
                value={newDayDate}
                onChange={(e) => setNewDayDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* PASO 2: Selección de Jugadores */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-black uppercase text-cyan-400 tracking-wider">
                  Paso 2: Elegir a los {targetPlayerCount} Participantes
                </label>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  checkedInIds.length === targetPlayerCount
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {checkedInIds.length} / {targetPlayerCount} Listos
                </span>
              </div>

              <button
                type="button"
                onClick={handleSelectTopByRanking}
                className="text-xs text-cyan-400 font-extrabold flex items-center bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800"
              >
                <Zap className="w-3.5 h-3.5 mr-1" />
                Auto Top {targetPlayerCount} del Ranking
              </button>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={playerSearchQuery}
                onChange={(e) => setPlayerSearchQuery(e.target.value)}
                placeholder="Buscar jugador..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* Players Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto p-2.5 bg-slate-950 rounded-2xl border border-slate-800">
              {filteredPlayers.map((p) => {
                const isChecked = checkedInIds.includes(p.id);
                const st = statsList.find(s => s.playerId === p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => handleToggleCheckin(p.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                      isChecked
                        ? 'bg-emerald-500/20 border-emerald-500/70 text-white font-black'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-600 flex-shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="block truncate text-sm font-bold text-white">{p.name}</span>
                        {p.nickname && <span className="text-xs text-slate-400 italic">"{p.nickname}"</span>}
                      </div>
                    </div>
                    {st && st.currentRank && (
                      <span className="text-xs font-mono text-emerald-400 font-black pl-1 flex-shrink-0">
                        #{st.currentRank}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* PASO 3: Criterio */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-black uppercase text-amber-400 tracking-wider">
              Paso 3: Criterio de Emparejamiento
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setPairingMode('ranking')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  pairingMode === 'ranking'
                    ? 'bg-emerald-500/15 border-emerald-500/60 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="font-extrabold text-xs sm:text-sm text-emerald-400">Por Ranking Global (50-50)</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Usa los puntos y nivel para que las duplas y partidos sean matemáticamente parejos.
                </p>
              </div>

              <div
                onClick={() => setPairingMode('random')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  pairingMode === 'random'
                    ? 'bg-blue-500/15 border-blue-500/60 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Dice5 className="w-4 h-4 text-blue-400" />
                  <span className="font-extrabold text-xs sm:text-sm text-blue-400">Sorteo al Azar</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Para primer día de temporada desde cero.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleStartNewDay}
            disabled={checkedInIds.length !== targetPlayerCount}
            className={`w-full py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center transition-all ${
              checkedInIds.length === targetPlayerCount
                ? 'bg-emerald-500 active:bg-emerald-400 text-black shadow-neon cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Play className="w-5 h-5 mr-2" />
            {checkedInIds.length === targetPlayerCount
              ? `Generar Cruces Parejos (${targetPlayerCount} Jugadores)`
              : `Selecciona ${targetPlayerCount} jugadores (Llevas ${checkedInIds.length})`}
          </button>
        </div>
      )}

      {/* Main Active Day Rounds & Tabs */}
      {currentDay && (
        <div className="space-y-4">
          {/* Round Selector Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {[1, 2, 3].map((rNum) => {
              const r = currentDay.rounds.find(round => round.roundNumber === rNum);
              const isDone = r?.isCompleted;

              return (
                <button
                  key={rNum}
                  onClick={() => setActiveRoundTab(rNum)}
                  className={`flex items-center px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all border ${
                    activeRoundTab === rNum
                      ? 'bg-emerald-500 text-black border-emerald-400 shadow-neon'
                      : isDone
                      ? 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {isDone && <CheckCircle className="w-4 h-4 mr-1.5 text-emerald-400" />}
                  Juego Corto {rNum}
                </button>
              );
            })}

            {/* Preliminary Standings Tab */}
            <button
              onClick={() => setActiveRoundTab(99)}
              className={`flex items-center px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all border ${
                activeRoundTab === 99
                  ? 'bg-blue-600 text-white border-blue-500 shadow-blue-glow'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Trophy className="w-4 h-4 mr-1.5 text-amber-400" />
              Tabla Fecha (1-{currentDay.checkedInPlayerIds.length})
            </button>

            {/* Daily Final Round Tab */}
            <button
              onClick={() => setActiveRoundTab(4)}
              className={`flex items-center px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all border ${
                activeRoundTab === 4
                  ? 'bg-amber-500 text-black border-amber-400 shadow-gold-glow'
                  : 'bg-slate-900 text-amber-300 border-amber-500/30 hover:bg-slate-800'
              }`}
            >
              <Flame className="w-4 h-4 mr-1.5" />
              Finales (Juego 4)
            </button>
          </div>

          {/* Prelim Matches (1, 2, 3) */}
          {[1, 2, 3].includes(activeRoundTab) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Juego Corto #{activeRoundTab} - Mejor de 7 games
                </h3>
                <span className="text-xs sm:text-sm text-slate-400 font-bold">
                  {currentDay.checkedInPlayerIds.length} Jugadores
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Intermediate Daily Standings View (Tab 99) with Mobile-Friendly Native Cards */}
          {activeRoundTab === 99 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-3xl border border-slate-800">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-amber-400" />
                    Tabla de la Fecha (Tras 3 Juegos Cortos)
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Games ganados mandan la tabla. Esta posición define las parejas para el Juego 4.
                  </p>
                </div>

                {isAdmin && (
                  <button
                    onClick={handleGenerateDailyFinals}
                    className="px-4 py-2.5 rounded-2xl bg-amber-500 active:bg-amber-400 text-black font-black text-xs sm:text-sm shadow-gold-glow flex items-center transition-all"
                  >
                    <Flame className="w-4 h-4 mr-1.5" />
                    Generar Finales (1&4 vs 2&3...)
                  </button>
                )}
              </div>

              {/* Mobile Native Cards (block md:hidden) */}
              <div className="block md:hidden space-y-2.5">
                {currentDay.prelimStandings.map((s) => {
                  let courtBadge = '';
                  if (s.prelimRank <= 4) courtBadge = '👑 Cancha 1 (Oro)';
                  else if (s.prelimRank <= 8) courtBadge = '🥈 Cancha 2 (Plata)';
                  else if (s.prelimRank <= 12) courtBadge = '🥉 Cancha 3 (Bronce)';
                  else if (s.prelimRank <= 16) courtBadge = '🍖 Cancha 4 (Cobre)';
                  else courtBadge = '🪵 Cancha 5 (Madera)';

                  return (
                    <div
                      key={s.playerId}
                      className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-2 bg-[#121829]"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 font-mono font-black text-xs flex items-center justify-center flex-shrink-0">
                          #{s.prelimRank}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block font-black text-base text-white truncate">{s.playerName}</span>
                          <div className="text-xs text-slate-400 font-semibold mt-0.5">
                            {s.matchesWon}V-{s.matchesLost}D • {courtBadge}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="font-mono text-lg font-black text-emerald-400">
                          {formatScoreDisplay(s.prelimTotalScore)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold block">{s.basePoints} games</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Full Table (hidden md:block) */}
              <div className="hidden md:block glass-panel rounded-3xl overflow-hidden border border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-xs uppercase font-extrabold border-b border-slate-800">
                      <th className="py-3.5 px-4 text-center">Pos</th>
                      <th className="py-3.5 px-4">Jugador</th>
                      <th className="py-3.5 px-3 text-center">PJ</th>
                      <th className="py-3.5 px-3 text-center">V - D</th>
                      <th className="py-3.5 px-3 text-center">Games Base</th>
                      <th className="py-3.5 px-3 text-center">Desempates</th>
                      <th className="py-3.5 px-4 text-right">Puntaje Fecha</th>
                      <th className="py-3.5 px-4 text-center">Cancha Asignada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {currentDay.prelimStandings.map((s) => {
                      let courtBadge = '';
                      if (s.prelimRank <= 4) courtBadge = '👑 Cancha 1 (Oro: 1º-4º)';
                      else if (s.prelimRank <= 8) courtBadge = '🥈 Cancha 2 (Plata: 5º-8º)';
                      else if (s.prelimRank <= 12) courtBadge = '🥉 Cancha 3 (Bronce: 9º-12º)';
                      else if (s.prelimRank <= 16) courtBadge = '🍖 Cancha 4 (Cobre: 13º-16º)';
                      else courtBadge = '🪵 Cancha 5 (Madera: 17º-20º)';

                      return (
                        <tr key={s.playerId} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4 text-center font-black font-display text-base">
                            #{s.prelimRank}
                          </td>
                          <td className="py-3 px-4 font-bold text-white text-base">
                            {s.playerName}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-300 font-semibold">{s.matchesPlayed}</td>
                          <td className="py-3 px-3 text-center font-mono text-xs text-slate-300 font-bold">
                            {s.matchesWon}V - {s.matchesLost}D
                          </td>
                          <td className="py-3 px-3 text-center font-extrabold text-slate-200">
                            {s.basePoints} pts
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-xs font-bold">
                            <span className={s.marginBonus + s.roundRecordBonus >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {s.marginBonus + s.roundRecordBonus >= 0 ? `+${(s.marginBonus + s.roundRecordBonus).toFixed(3)}` : (s.marginBonus + s.roundRecordBonus).toFixed(3)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 text-base">
                            {formatScoreDisplay(s.prelimTotalScore)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`text-xs font-black px-3 py-1 rounded-full ${
                              s.prelimRank <= 4
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : s.prelimRank <= 8
                                ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30'
                                : s.prelimRank <= 12
                                ? 'bg-amber-700/20 text-amber-400 border border-amber-700/30'
                                : s.prelimRank <= 16
                                ? 'bg-orange-600/20 text-orange-300 border border-orange-600/30'
                                : 'bg-stone-600/20 text-stone-300 border border-stone-600/30'
                            }`}>
                              {courtBadge}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Daily Final Round (Round 4) */}
          {activeRoundTab === 4 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-3xl border border-slate-800">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center">
                    <Flame className="w-5 h-5 mr-2 text-amber-400" />
                    Finales del Día (Juego 4 - Definición)
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    1 y 4 vs 2 y 3 (Oro) • 5 y 8 vs 6 y 7 (Plata) • 9 y 12 vs 10 y 11 (Bronce) • 13 y 16 vs 14 y 15 (Cobre)
                  </p>
                </div>

                {isAdmin && currentDay.status !== 'completed' && (
                  <button
                    onClick={handleCompleteDay}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 active:from-emerald-400 active:to-teal-400 text-black font-black text-sm shadow-neon flex items-center transition-all"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Cerrar Fecha y Sumar a la Tabla General
                  </button>
                )}
              </div>

              {/* Grid of Final Courts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          )}
        </div>
      )}

      {/* Score Modal */}
      <ScoreModal
        match={activeScoreMatch}
        isOpen={!!activeScoreMatch}
        onClose={() => setActiveScoreMatch(null)}
        onSaveScore={handleSaveMatchScore}
      />
    </div>
  );
};
