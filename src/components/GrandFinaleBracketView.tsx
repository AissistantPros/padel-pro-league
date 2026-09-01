import React, { useState } from 'react';
import { Award, Trophy, Play, CheckCircle2, Flame, Sparkles, Shield, ChevronRight, Edit3 } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { GrandFinaleBracket, Match, MatchScore, PlayerIntelligenceStats, TournamentConfig } from '../types/index.ts';
import { generateGrandFinaleBracket } from '../utils/grandFinaleEngine.ts';
import { ScoreModal } from './ScoreModal.tsx';

interface GrandFinaleBracketViewProps {
  bracket: GrandFinaleBracket | null;
  statsList: PlayerIntelligenceStats[];
  config: TournamentConfig;
  isAdmin: boolean;
  onSaveBracket: (bracket: GrandFinaleBracket) => void;
}

export const GrandFinaleBracketView: React.FC<GrandFinaleBracketViewProps> = ({
  bracket,
  statsList,
  config,
  isAdmin,
  onSaveBracket,
}) => {
  const [activeScoreMatch, setActiveScoreMatch] = useState<Match | null>(null);

  const handleCreateBracket = () => {
    const newBracket = generateGrandFinaleBracket(statsList, config.courtNames);
    onSaveBracket(newBracket);
  };

  const handleSaveScore = (matchId: string, score: MatchScore) => {
    if (!bracket) return;

    const updatedRounds = bracket.rounds.map(round => {
      const mIdx = round.matches.findIndex(m => m.id === matchId);
      if (mIdx === -1) return round;

      const updatedMatches = [...round.matches];
      const match = updatedMatches[mIdx];
      updatedMatches[mIdx] = {
        ...match,
        score,
        completedAt: new Date().toISOString(),
      };

      return {
        ...round,
        matches: updatedMatches,
        isCompleted: updatedMatches.every(m => m.score.completed),
      };
    });

    const r1 = updatedRounds[0];
    const r2 = updatedRounds[1];
    const r3 = updatedRounds[2];

    if (r1.matches[0].score.completed && r1.matches[1].score.completed) {
      const winnerM1 = r1.matches[0].score.winner === 'teamA' ? r1.matches[0].teamA : r1.matches[0].teamB;
      const winnerM2 = r1.matches[1].score.winner === 'teamA' ? r1.matches[1].teamA : r1.matches[1].teamB;

      r2.matches[0].teamA = { ...winnerM1 };
      r2.matches[0].teamB = { ...winnerM2 };
    }

    if (r1.matches[2].score.completed && r1.matches[3].score.completed) {
      const winnerM3 = r1.matches[2].score.winner === 'teamA' ? r1.matches[2].teamA : r1.matches[2].teamB;
      const loserM1 = r1.matches[0].score.winner === 'teamA' ? r1.matches[0].teamB : r1.matches[0].teamA;

      r2.matches[1].teamA = { ...winnerM3 };
      r2.matches[1].teamB = { ...loserM1 };

      const winnerM4 = r1.matches[3].score.winner === 'teamA' ? r1.matches[3].teamA : r1.matches[3].teamB;
      const loserM2 = r1.matches[1].score.winner === 'teamA' ? r1.matches[1].teamB : r1.matches[1].teamA;

      r2.matches[2].teamA = { ...winnerM4 };
      r2.matches[2].teamB = { ...loserM2 };
    }

    if (r2.matches[0].score.completed && r2.matches[1].score.completed) {
      const winSemi1 = r2.matches[0].score.winner === 'teamA' ? r2.matches[0].teamA : r2.matches[0].teamB;
      const winSemi2 = r2.matches[1].score.winner === 'teamA' ? r2.matches[1].teamA : r2.matches[1].teamB;
      const loseSemi1 = r2.matches[0].score.winner === 'teamA' ? r2.matches[0].teamB : r2.matches[0].teamA;

      r3.matches[0].teamA = { ...winSemi1 };
      r3.matches[0].teamB = { ...winSemi2 };

      if (r2.matches[2].score.completed) {
        const winSemiBronce = r2.matches[2].score.winner === 'teamA' ? r2.matches[2].teamA : r2.matches[2].teamB;
        r3.matches[1].teamA = { ...loseSemi1 };
        r3.matches[1].teamB = { ...winSemiBronce };
      }
    }

    let podium = { ...bracket.podium };
    if (r3.matches[0].score.completed) {
      const grandChamp = r3.matches[0].score.winner === 'teamA' ? r3.matches[0].teamA : r3.matches[0].teamB;
      const runnerUp = r3.matches[0].score.winner === 'teamA' ? r3.matches[0].teamB : r3.matches[0].teamA;
      podium.firstPlace = { player1: grandChamp.player1Name, player2: grandChamp.player2Name };
      podium.secondPlace = { player1: runnerUp.player1Name, player2: runnerUp.player2Name };

      confetti({
        particleCount: 160,
        spread: 80,
        origin: { y: 0.5 },
      });
    }

    if (r3.matches[1].score.completed) {
      const thirdPlace = r3.matches[1].score.winner === 'teamA' ? r3.matches[1].teamA : r3.matches[1].teamB;
      const fourthPlace = r3.matches[1].score.winner === 'teamA' ? r3.matches[1].teamB : r3.matches[1].teamA;
      podium.thirdPlace = { player1: thirdPlace.player1Name, player2: thirdPlace.player2Name };
      podium.fourthPlace = { player1: fourthPlace.player1Name, player2: fourthPlace.player2Name };
    }

    const updatedBracket: GrandFinaleBracket = {
      ...bracket,
      rounds: updatedRounds,
      podium,
    };

    onSaveBracket(updatedBracket);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
              <Award className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-white">
                Día de la Gran Final G20 (Playoffs)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Formato de 3 partidos: Lugares 1 al 12 pelean por el Campeonato (1º) y el lugar 16 puede subir al Podio (3º) si gana sus 2 primeros partidos.
              </p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleCreateBracket}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm shadow-gold-glow flex items-center transition-all"
          >
            <Play className="w-4 h-4 mr-1.5" />
            {bracket ? 'Regenerar Cuadro de Gran Final' : 'Generar Cuadro de Gran Final'}
          </button>
        )}
      </div>

      {/* Podium Display if Tournament Finished */}
      {bracket?.podium?.firstPlace && (
        <div className="glass-panel-neon p-6 rounded-3xl border-2 border-amber-500/50 text-center space-y-4 shadow-gold-glow animate-slide-up bg-slate-950/90">
          <div className="flex items-center justify-center space-x-2 text-amber-400 font-black uppercase tracking-wider text-xs sm:text-sm">
            <Sparkles className="w-4 h-4" /> 🏆 PODIO DE CAMPEONES G20 BY PETER INC. 🏆 <Sparkles className="w-4 h-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* 2nd Place */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 md:order-1 order-2 flex flex-col justify-end">
              <div className="text-2xl sm:text-3xl font-black text-slate-300 font-display">🥈 2º PUESTO</div>
              <div className="text-xs text-slate-400 font-bold mb-2">Subcampeones</div>
              <div className="text-base sm:text-lg font-bold text-white">
                {bracket.podium.secondPlace?.player1}
              </div>
              <div className="text-sm font-semibold text-slate-300">
                {bracket.podium.secondPlace?.player2}
              </div>
            </div>

            {/* 1st Place */}
            <div className="bg-gradient-to-b from-amber-500/20 to-slate-900 p-5 rounded-2xl border-2 border-amber-400 md:order-2 order-1 shadow-gold-glow flex flex-col justify-end">
              <div className="text-3xl sm:text-4xl font-black text-amber-300 font-display glow-text-gold">👑 CAMPEONES</div>
              <div className="text-xs text-amber-400 font-extrabold mb-2">1º Lugar Absoluto</div>
              <div className="text-lg sm:text-xl font-black text-white">
                {bracket.podium.firstPlace.player1}
              </div>
              <div className="text-base font-bold text-amber-200">
                {bracket.podium.firstPlace.player2}
              </div>
            </div>

            {/* 3rd Place */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 md:order-3 order-3 flex flex-col justify-end">
              <div className="text-2xl sm:text-3xl font-black text-amber-600 font-display">🥉 3º PUESTO</div>
              <div className="text-xs text-amber-500 font-bold mb-2">Medalla de Bronce</div>
              <div className="text-base sm:text-lg font-bold text-white">
                {bracket.podium.thirdPlace?.player1 || 'Por definir'}
              </div>
              <div className="text-sm font-semibold text-slate-300">
                {bracket.podium.thirdPlace?.player2 || ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3-Round Bracket Display */}
      {bracket ? (
        <div className="space-y-8">
          {bracket.rounds.map((round) => (
            <div key={round.roundNumber} className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400"></span>
                <h3 className="text-lg font-black text-white">{round.name}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {round.matches.map((m) => {
                  const isDone = m.score.completed;
                  const winA = isDone && m.score.winner === 'teamA';
                  const winB = isDone && m.score.winner === 'teamB';

                  return (
                    <div
                      key={m.id}
                      className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 bg-[#121826]"
                    >
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                        <span className="font-extrabold text-amber-400">{m.courtName}</span>
                        {isDone ? (
                          <span className="text-emerald-400 font-black flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Terminado
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">Pendiente de juego</span>
                        )}
                      </div>

                      {/* Team A - EQUAL SIZES */}
                      <div className={`flex items-center justify-between p-3 rounded-xl ${
                        winA ? 'bg-emerald-500/20 border-2 border-emerald-500/50 text-white font-bold' : 'bg-slate-900 border border-slate-800 text-slate-200'
                      }`}>
                        <div className="text-sm sm:text-base font-bold flex items-center flex-wrap gap-x-2">
                          <span>{m.teamA.player1Name}</span>
                          {m.teamA.player2Name && <span className="text-emerald-400 font-black">&</span>}
                          <span>{m.teamA.player2Name}</span>
                        </div>
                        <span className="font-mono text-2xl font-black text-emerald-400 pl-2">
                          {isDone ? m.score.scoreA : '-'}
                        </span>
                      </div>

                      {/* Team B - EQUAL SIZES */}
                      <div className={`flex items-center justify-between p-3 rounded-xl ${
                        winB ? 'bg-emerald-500/20 border-2 border-emerald-500/50 text-white font-bold' : 'bg-slate-900 border border-slate-800 text-slate-200'
                      }`}>
                        <div className="text-sm sm:text-base font-bold flex items-center flex-wrap gap-x-2">
                          <span>{m.teamB.player1Name}</span>
                          {m.teamB.player2Name && <span className="text-blue-400 font-black">&</span>}
                          <span>{m.teamB.player2Name}</span>
                        </div>
                        <span className="font-mono text-2xl font-black text-emerald-400 pl-2">
                          {isDone ? m.score.scoreB : '-'}
                        </span>
                      </div>

                      {/* Score Button */}
                      {isAdmin && (
                        <button
                          onClick={() => setActiveScoreMatch(m)}
                          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs sm:text-sm font-extrabold transition-colors flex items-center justify-center border border-slate-700"
                        >
                          <Edit3 className="w-4 h-4 mr-2 text-amber-400" />
                          {isDone ? 'Modificar Marcador' : 'Cargar Marcador'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 space-y-4">
          <Award className="w-14 h-14 text-amber-400 mx-auto opacity-70" />
          <h3 className="text-xl font-black text-white">Cuadro de Gran Final No Iniciado</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Cuando concluyan las fechas regulares, el administrador generará el cuadro definitivo donde los lugares 1 al 12 tienen ruta directa al título y el lugar 16 puede alcanzar el 3er lugar.
          </p>
          {isAdmin && (
            <button
              onClick={handleCreateBracket}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm shadow-gold-glow inline-flex items-center transition-all"
            >
              <Play className="w-5 h-5 mr-2" />
              Generar Bracket de la Gran Final
            </button>
          )}
        </div>
      )}

      {/* Score Modal */}
      <ScoreModal
        match={activeScoreMatch}
        isOpen={!!activeScoreMatch}
        onClose={() => setActiveScoreMatch(null)}
        onSaveScore={handleSaveScore}
      />
    </div>
  );
};
