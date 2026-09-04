import React, { useState } from 'react';
import { Award, Trophy, Play, CheckCircle2, Flame, Edit3 } from 'lucide-react';
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

  const getAvatar = (id: string, name: string) => {
    const pStat = statsList.find(s => s.playerId === id || s.playerName === name);
    if (pStat?.avatar) {
      return (
        <img
          src={pStat.avatar}
          alt={name}
          className="w-6 h-6 rounded-full object-cover border border-white/10 flex-shrink-0 bg-[#2C2C2E]"
        />
      );
    }
    return (
      <div className="w-6 h-6 rounded-full bg-[#2C2C2E] text-[#FFD60A] font-bold text-[10px] flex items-center justify-center flex-shrink-0">
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  };

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
      const loseSemi2 = r2.matches[1].score.winner === 'teamA' ? r2.matches[1].teamB : r2.matches[1].teamA;

      r3.matches[0].teamA = { ...winSemi1 };
      r3.matches[0].teamB = { ...winSemi2 };

      r3.matches[1].teamA = { ...loseSemi1 };
      r3.matches[1].teamB = { ...loseSemi2 };
    }

    let isFinished = false;
    let champions: { player1Name: string; player2Name: string } | undefined;

    if (r3 && r3.matches[0].score.completed) {
      isFinished = true;
      const finalWinner = r3.matches[0].score.winner === 'teamA' ? r3.matches[0].teamA : r3.matches[0].teamB;
      champions = {
        player1Name: finalWinner.player1Name,
        player2Name: finalWinner.player2Name,
      };

      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
      });
    }

    const updatedBracket: GrandFinaleBracket = {
      ...bracket,
      rounds: updatedRounds,
      status: isFinished ? 'completed' : 'in_progress',
      podium: isFinished && champions ? {
        firstPlace: { player1: champions.player1Name, player2: champions.player2Name }
      } : bracket.podium,
    };

    onSaveBracket(updatedBracket);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6 select-none">
      {/* Header */}
      <div className="pt-1 pb-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#FFD60A]">
              Playoffs de Fin de Temporada
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
              Gran Final
            </h1>
          </div>

          {isAdmin && (
            <button
              onClick={handleCreateBracket}
              className="px-3.5 py-2 rounded-xl bg-[#FFD60A] text-black font-bold text-xs ios-touch flex items-center"
            >
              <Play className="w-3.5 h-3.5 mr-1" />
              {bracket ? 'Regenerar Llave' : 'Crear Cuadro Final'}
            </button>
          )}
        </div>
      </div>

      {/* Champions Banner */}
      {bracket?.status === 'completed' && bracket.podium?.firstPlace && (
        <div className="ios-card p-6 text-center space-y-2 border border-[#FFD60A]/40 bg-[#FFD60A]/10">
          <Trophy className="w-12 h-12 text-[#FFD60A] mx-auto animate-bounce" />
          <h2 className="text-xl font-bold text-[#FFD60A]">¡Campeones Oficiales del Torneo!</h2>
          <div className="text-2xl font-bold text-white">
            {bracket.podium.firstPlace.player1} & {bracket.podium.firstPlace.player2}
          </div>
          <p className="text-xs text-[#8E8E93]">¡Gloria eterna en el Torneo G20!</p>
        </div>
      )}

      {/* Bracket Rounds Container */}
      {bracket ? (
        <div className="space-y-6">
          {bracket.rounds.map((round) => (
            <div key={round.name} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-bold text-white">{round.name}</span>
                <span className="text-xs text-[#8E8E93]">{round.matches.length} partidos</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {round.matches.map((match) => {
                  const isDone = match.score.completed;
                  const winA = isDone && match.score.winner === 'teamA';
                  const winB = isDone && match.score.winner === 'teamB';

                  return (
                    <div
                      key={match.id}
                      className="ios-card p-4 space-y-2.5 border border-white/10"
                    >
                      <div className="flex items-center justify-between text-xs text-[#8E8E93] pb-1 border-b border-white/5">
                        <span>🎾 {match.courtName || `Cancha ${match.courtNumber}`}</span>
                        {isDone ? (
                          <span className="text-[#30D158] font-semibold flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Terminado
                          </span>
                        ) : (
                          <span className="text-[#8E8E93]">Por jugar</span>
                        )}
                      </div>

                      {/* Team A */}
                      <div className={`p-2.5 rounded-xl flex items-center justify-between text-xs ${
                        winA ? 'bg-[#30D158]/15 font-bold text-white' : 'bg-[#2C2C2E] text-white'
                      }`}>
                        <div className="flex items-center space-x-2 truncate">
                          {getAvatar(match.teamA.player1Id, match.teamA.player1Name)}
                          <span className="truncate">{match.teamA.player1Name} & {match.teamA.player2Name}</span>
                        </div>
                        <span className="font-mono text-base font-bold pl-2">{isDone ? match.score.scoreA : '-'}</span>
                      </div>

                      {/* Team B */}
                      <div className={`p-2.5 rounded-xl flex items-center justify-between text-xs ${
                        winB ? 'bg-[#30D158]/15 font-bold text-white' : 'bg-[#2C2C2E] text-white'
                      }`}>
                        <div className="flex items-center space-x-2 truncate">
                          {getAvatar(match.teamB.player1Id, match.teamB.player1Name)}
                          <span className="truncate">{match.teamB.player1Name} & {match.teamB.player2Name}</span>
                        </div>
                        <span className="font-mono text-base font-bold pl-2">{isDone ? match.score.scoreB : '-'}</span>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => setActiveScoreMatch(match)}
                          className="w-full py-2 bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-semibold text-white rounded-lg ios-touch flex items-center justify-center"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1 text-[#30D158]" />
                          {isDone ? 'Editar Score' : 'Capturar Score'}
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
        <div className="ios-card p-10 text-center space-y-3">
          <Award className="w-12 h-12 text-[#FFD60A] mx-auto opacity-70" />
          <h3 className="text-lg font-bold text-white">Cuadro de Finales Pendiente</h3>
          <p className="text-xs text-[#8E8E93] max-w-xs mx-auto">
            La Gran Final con sistema de Bombos (Top 8 + Bombo 2) se habilita al final de la temporada.
          </p>
        </div>
      )}

      <ScoreModal
        match={activeScoreMatch}
        isOpen={Boolean(activeScoreMatch)}
        onClose={() => setActiveScoreMatch(null)}
        onSaveScore={handleSaveScore}
        statsList={statsList}
      />
    </div>
  );
};
