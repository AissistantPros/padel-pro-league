import React, { useState } from 'react';
import {
  Calendar,
  CheckSquare,
  Square,
  Play,
  CheckCircle,
  Trophy,
  ArrowRight,
  Flame,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
  ShieldCheck,
  Beer
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
  onRequestAdmin,
}) => {
  const [selectedDayId, setSelectedDayId] = useState<string>(
    days.length > 0 ? days[days.length - 1].id : ''
  );
  const [activeRoundTab, setActiveRoundTab] = useState<number>(1);
  const [activeScoreMatch, setActiveScoreMatch] = useState<Match | null>(null);

  // Check-in state for new day creation
  const [isCreatingNewDay, setIsCreatingNewDay] = useState(false);
  const [newDayName, setNewDayName] = useState(`Fecha G20 #${days.length + 1}`);
  const [newDayDate, setNewDayDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkedInIds, setCheckedInIds] = useState<string[]>(players.map(p => p.id));

  const currentDay = days.find(d => d.id === selectedDayId) || days[days.length - 1];

  const handleToggleCheckin = (playerId: string) => {
    setCheckedInIds(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  const handleSelectAllPlayers = () => {
    setCheckedInIds(players.map(p => p.id));
  };

  // Start new matchday with equal sum balancing
  const handleStartNewDay = () => {
    if (checkedInIds.length % 4 !== 0 || checkedInIds.length < 4) {
      alert(`Se requiere un múltiplo de 4 jugadores (ej. 8, 12, 16). Seleccionados: ${checkedInIds.length}`);
      return;
    }

    const dayId = `jornada_${Date.now()}`;
    const participatingPlayers = players.filter(p => checkedInIds.includes(p.id));
    const isFirstDay = days.length === 0;

    // Use current ranking points for exact parity optimization
    const rankingMap = new Map<string, number>(
      statsList.map(s => [s.playerId, s.totalChampionshipPoints > 0 ? s.totalChampionshipPoints : (17 - (s.currentRank || 16)) * 4])
    );

    const rounds = generatePreliminaryRounds(
      dayId,
      participatingPlayers,
      isFirstDay,
      rankingMap,
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

  // Save match score
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

  // Generate Daily Finals (Round 4) after 3 preliminary rounds
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

  // Complete and Close Matchday
  const handleCompleteDay = () => {
    if (!currentDay) return;

    const finalRound = currentDay.rounds.find(r => r.roundNumber === 4);
    if (!finalRound || !finalRound.matches.every(m => m.score.completed)) {
      alert('Completa todos los marcadores de las 4 Finales antes de cerrar la fecha.');
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

  return (
    <div className="space-y-6">
      {/* Top Matchday Header & Switcher */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Calendar className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-white">
                {currentDay ? currentDay.name : 'Gestión de Fecha'}
              </h2>
              <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                <span className="font-semibold">{currentDay ? currentDay.date : ''}</span>
                {currentDay && (
                  <>
                    <span>•</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[10px] ${
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

        {/* Day Selector & New Day Trigger */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {days.length > 0 && (
            <select
              value={selectedDayId}
              onChange={(e) => {
                setSelectedDayId(e.target.value);
                setIsCreatingNewDay(false);
              }}
              className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs sm:text-sm font-extrabold focus:outline-none focus:border-emerald-500"
            >
              {days.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.date})
                </option>
              ))}
            </select>
          )}

          {isAdmin && currentDay && currentDay.status === 'preliminaries' && (
            <button
              onClick={() => {
                if (confirm('¿Regenerar los 3 juegos preliminares de esta fecha con el optimizador de máximo equilibrio 50-50?')) {
                  const participatingPlayers = players.filter(p => currentDay.checkedInPlayerIds.includes(p.id));
                  const rankingMap = new Map<string, number>(
                    statsList.map(s => [s.playerId, s.totalChampionshipPoints > 0 ? s.totalChampionshipPoints : (17 - (s.currentRank || 16)) * 4])
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
              title="Reequilibrar Cruces"
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-extrabold text-xs sm:text-sm border border-slate-700 flex items-center transition-all"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Reequilibrar Cruces (50-50)
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                setIsCreatingNewDay(!isCreatingNewDay);
                setCheckedInIds(players.map(p => p.id));
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm shadow-neon flex items-center transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nueva Fecha
            </button>
          )}
        </div>
      </div>

      {/* New Day Creation Form / Check-in Modal */}
      {isCreatingNewDay && (
        <div className="glass-panel-neon p-5 sm:p-6 rounded-3xl space-y-5 animate-fade-in border-2 border-emerald-500/40">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-black text-white">Check-in de Asistencia y Emparejamiento Parejo</h3>
            </div>
            <button
              onClick={() => setIsCreatingNewDay(false)}
              className="text-xs font-bold text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded-lg"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Nombre de la Fecha</label>
              <input
                type="text"
                value={newDayName}
                onChange={(e) => setNewDayName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Fecha de Juego</label>
              <input
                type="date"
                value={newDayDate}
                onChange={(e) => setNewDayDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Player Check-in Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-300">
                Jugadores Confirmados ({checkedInIds.length} seleccionados - Múltiplo de 4)
              </span>
              <button
                type="button"
                onClick={handleSelectAllPlayers}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-extrabold"
              >
                Seleccionar Todos
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto p-2.5 bg-slate-950 rounded-2xl border border-slate-800">
              {players.map((p) => {
                const isChecked = checkedInIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => handleToggleCheckin(p.id)}
                    className={`flex items-center p-2.5 rounded-xl cursor-pointer transition-all border ${
                      isChecked
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 mr-2 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 mr-2 text-slate-600 flex-shrink-0" />
                    )}
                    <span className="text-xs font-semibold truncate">{p.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
            <span className="font-extrabold text-emerald-400 block">⚖️ Algoritmo de Emparejamiento Parejo:</span>
            <p>
              Divide a los jugadores en <strong>Bombo 1 (Top 8)</strong> y <strong>Bombo 2 (Bottom 8)</strong> según la tabla anterior. Los Top 8 nunca jugarán juntos en los 3 juegos preliminares, y las sumas de ranking entre duplas rivales son exactamente iguales (ej. 1+16 vs 8+9).
            </p>
          </div>

          <button
            onClick={handleStartNewDay}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm sm:text-base shadow-neon flex items-center justify-center transition-all"
          >
            <Play className="w-5 h-5 mr-2" />
            Generar Cruces Parejos y Arrancar Fecha
          </button>
        </div>
      )}

      {/* Main Active Day Rounds & Tabs */}
      {currentDay && (
        <div className="space-y-5">
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
              Tabla Preliminar (1-16)
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
              Finales del Día (Juego 4)
            </button>
          </div>

          {/* Preliminary Round Matches (1, 2, or 3) */}
          {[1, 2, 3].includes(activeRoundTab) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center">
                  <span>Juego Corto #{activeRoundTab} - Al mejor de 7 games</span>
                </h3>
                <span className="text-xs text-slate-400 font-semibold">
                  Parejas Equilibradas en Suma de Ranks
                </span>
              </div>

              {/* Grid of 4 Courts */}
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

          {/* Intermediate Daily Standings View (Tab 99) */}
          {activeRoundTab === 99 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-amber-400" />
                    Tabla de la Fecha (Tras 3 Juegos Cortos)
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Games ganados base mandan la tabla + desempate por margen y récord. Esta tabla define las 4 Finales.
                  </p>
                </div>

                {isAdmin && (
                  <button
                    onClick={handleGenerateDailyFinals}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm shadow-gold-glow flex items-center transition-all"
                  >
                    <Flame className="w-4 h-4 mr-1.5" />
                    Generar Cruces de Finales (1&4 vs 2&3...)
                  </button>
                )}
              </div>

              {/* Prelim Standings Table */}
              <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-xs uppercase font-extrabold border-b border-slate-800">
                      <th className="py-3.5 px-3 sm:px-4 text-center">Pos</th>
                      <th className="py-3.5 px-3 sm:px-4">Jugador</th>
                      <th className="py-3.5 px-2 sm:px-3 text-center">PJ</th>
                      <th className="py-3.5 px-2 sm:px-3 text-center">V - D</th>
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
                      else courtBadge = '🍖 Cancha 4 (Cobre: 13º-16º)';

                      return (
                        <tr key={s.playerId} className="hover:bg-slate-800/40">
                          <td className="py-3 px-3 sm:px-4 text-center font-black font-display">
                            #{s.prelimRank}
                          </td>
                          <td className="py-3 px-3 sm:px-4 font-bold text-white">
                            {s.playerName}
                          </td>
                          <td className="py-3 px-2 sm:px-3 text-center text-slate-300 font-semibold">{s.matchesPlayed}</td>
                          <td className="py-3 px-2 sm:px-3 text-center font-mono text-xs text-slate-300 font-bold">
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
                          <td className="py-3 px-4 text-right font-mono font-black text-emerald-400">
                            {formatScoreDisplay(s.prelimTotalScore)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${
                              s.prelimRank <= 4
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : s.prelimRank <= 8
                                ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30'
                                : s.prelimRank <= 12
                                ? 'bg-amber-700/20 text-amber-400 border border-amber-700/30'
                                : 'bg-orange-600/20 text-orange-300 border border-orange-600/30'
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center">
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
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm shadow-neon flex items-center transition-all"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Cerrar Fecha y Sumar a la Tabla General
                  </button>
                )}
              </div>

              {/* Grid of 4 Final Courts */}
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
