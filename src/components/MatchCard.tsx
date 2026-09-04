import React from 'react';
import { Clock, Zap, Edit3, Flame, CheckCircle2 } from 'lucide-react';
import type { Match, PlayerIntelligenceStats, TournamentDay } from '../types/index.ts';

interface MatchCardProps {
  match: Match;
  isAdmin: boolean;
  onOpenScoreModal: (match: Match) => void;
  statsList: PlayerIntelligenceStats[];
  currentDay?: TournamentDay | null;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  isAdmin,
  onOpenScoreModal,
  statsList,
  currentDay,
}) => {
  const isCompleted = match.score.completed;
  const isTeamAWinner = isCompleted && match.score.winner === 'teamA';
  const isTeamBWinner = isCompleted && match.score.winner === 'teamB';

  // Calculate Win Probability / Proportion STRICTLY based on the DAY's results as requested:
  const getDailyPercentages = () => {
    if (!currentDay || !currentDay.rounds) {
      return { probTeamA: 50, probTeamB: 50 };
    }

    const playerDailyScores = new Map<string, number>();

    // 1. If prelimStandings already exists for the day, use totalDailyScore
    if (currentDay.prelimStandings && currentDay.prelimStandings.length > 0) {
      currentDay.prelimStandings.forEach(ps => {
        playerDailyScores.set(ps.playerId, ps.totalDailyScore ?? ps.gamesWon ?? 0);
      });
    } else {
      // 2. Otherwise calculate dynamically from all completed matches of this tournament day
      currentDay.rounds.forEach(r => {
        r.matches.forEach(m => {
          if (m.score?.completed) {
            const pA1 = m.teamA.player1Id;
            const pA2 = m.teamA.player2Id;
            const pB1 = m.teamB.player1Id;
            const pB2 = m.teamB.player2Id;

            playerDailyScores.set(pA1, (playerDailyScores.get(pA1) || 0) + m.score.scoreA);
            playerDailyScores.set(pA2, (playerDailyScores.get(pA2) || 0) + m.score.scoreA);
            playerDailyScores.set(pB1, (playerDailyScores.get(pB1) || 0) + m.score.scoreB);
            playerDailyScores.set(pB2, (playerDailyScores.get(pB2) || 0) + m.score.scoreB);
          }
        });
      });
    }

    const scoreA1 = playerDailyScores.get(match.teamA.player1Id) || 0;
    const scoreA2 = playerDailyScores.get(match.teamA.player2Id) || 0;
    const scoreB1 = playerDailyScores.get(match.teamB.player1Id) || 0;
    const scoreB2 = playerDailyScores.get(match.teamB.player2Id) || 0;

    const totalTeamA = scoreA1 + scoreA2;
    const totalTeamB = scoreB1 + scoreB2;
    const totalBase = totalTeamA + totalTeamB;

    if (totalBase <= 0) {
      return { probTeamA: 50, probTeamB: 50 };
    }

    const probTeamA = Math.round((totalTeamA / totalBase) * 100);
    const probTeamB = 100 - probTeamA;

    return { probTeamA, probTeamB };
  };

  const prediction = getDailyPercentages();

  // Clean, single-line title for matches
  const getMatchTitle = () => {
    const court = match.courtNumber ? `Pista ${match.courtNumber}` : (match.courtName?.replace(/Cancha/g, 'Pista') || 'Pista');

    if (match.matchType === 'daily_final') {
      const c = (match.courtNumber || 1) - 1;
      const place1 = c * 2 + 1;
      const place2 = c * 2 + 2;
      return `${court} • ${place1}º y ${place2}º lugar`;
    }

    if (match.matchType === 'grand_final') {
      switch (match.finalCategory) {
        case 'final_1st':
          return `${court} • 🏆 1º y 2º lugar`;
        case 'final_3rd':
          return `${court} • 🥉 3º y 4º lugar`;
        case 'final_5th':
          return `${court} • 5º al 8º lugar`;
        case 'final_9th':
          return `${court} • 9º al 16º lugar`;
        default:
          return court;
      }
    }

    return court;
  };

  // Get player avatar
  const getAvatar = (id: string, name: string) => {
    const pStat = statsList.find(s => s.playerId === id);
    if (pStat?.avatar) {
      return (
        <img
          src={pStat.avatar}
          alt={name}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-white/10 flex-shrink-0 bg-[#2C2C2E]"
        />
      );
    }
    return (
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2C2C2E] text-[#8E8E93] font-bold text-xs flex items-center justify-center flex-shrink-0 border border-white/10">
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  };

  const getPlayerInfo = (id: string, name: string) => {
    const pStat = statsList.find(s => s.playerId === id || s.playerName === name);
    const nickname = pStat?.nickname?.trim() ? pStat.nickname : name.split(' ')[0];
    return { nickname, fullName: name, avatar: pStat?.avatar };
  };

  const pA1 = getPlayerInfo(match.teamA.player1Id, match.teamA.player1Name);
  const pA2 = getPlayerInfo(match.teamA.player2Id, match.teamA.player2Name);
  const pB1 = getPlayerInfo(match.teamB.player1Id, match.teamB.player1Name);
  const pB2 = getPlayerInfo(match.teamB.player2Id, match.teamB.player2Name);

  return (
    <div className="ios-card p-4 sm:p-5 space-y-3 select-none">
      {/* Court Header & Clean Daily Percentage Pill */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/5">
        <span className="text-sm sm:text-base font-bold text-white flex items-center truncate">
          🎾 {getMatchTitle()}
        </span>

        {/* Prediction probability pill based on daily score */}
        {!isCompleted ? (
          <div className="flex items-center space-x-1.5 text-xs font-mono bg-[#2C2C2E] px-2.5 py-1 rounded-full text-[#8E8E93] flex-shrink-0">
            <Zap className="w-3.5 h-3.5 text-[#64D2FF]" />
            <span className="text-[#30D158] font-bold">{prediction.probTeamA}%</span>
            <span>-</span>
            <span className="text-[#0A84FF] font-bold">{prediction.probTeamB}%</span>
          </div>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-[#30D158] bg-[#30D158]/15 flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Finalizado
          </span>
        )}
      </div>

      {/* Teams Score Cards - Clickable by Admin to enter score directly */}
      <div className="space-y-2">
        {/* Team A Card */}
        <div
          onClick={isAdmin ? () => onOpenScoreModal(match) : undefined}
          className={`p-3 sm:p-3.5 rounded-2xl transition-all border flex items-center justify-between gap-3 ${
            isAdmin ? 'cursor-pointer hover:border-white/20 active:scale-[0.99]' : ''
          } ${
            isTeamAWinner
              ? 'bg-[#30D158]/10 border-[#30D158]/40'
              : 'bg-[#2C2C2E]/60 border-white/5'
          }`}
          title={isAdmin ? 'Haz clic para capturar marcador' : undefined}
        >
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center space-x-2.5 min-w-0">
              {getAvatar(match.teamA.player1Id, match.teamA.player1Name)}
              <div className="min-w-0 flex-1 truncate">
                <span className="text-sm sm:text-base font-black text-white">
                  {pA1.nickname}
                </span>
                <span className="text-xs text-[#8E8E93] ml-1.5 font-normal truncate hidden sm:inline">
                  {pA1.fullName}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2.5 min-w-0">
              {getAvatar(match.teamA.player2Id, match.teamA.player2Name)}
              <div className="min-w-0 flex-1 truncate">
                <span className="text-sm sm:text-base font-black text-white">
                  {pA2.nickname}
                </span>
                <span className="text-xs text-[#8E8E93] ml-1.5 font-normal truncate hidden sm:inline">
                  {pA2.fullName}
                </span>
              </div>
            </div>
          </div>

          {/* Score Box */}
          <div className="text-right pl-2 flex-shrink-0">
            <div className={`font-mono text-3xl sm:text-4xl font-black min-w-[40px] text-center ${
              isTeamAWinner ? 'text-[#30D158]' : 'text-white/80'
            }`}>
              {isCompleted ? match.score.scoreA : '-'}
            </div>
          </div>
        </div>

        {/* Team B Card */}
        <div
          onClick={isAdmin ? () => onOpenScoreModal(match) : undefined}
          className={`p-3 sm:p-3.5 rounded-2xl transition-all border flex items-center justify-between gap-3 ${
            isAdmin ? 'cursor-pointer hover:border-white/20 active:scale-[0.99]' : ''
          } ${
            isTeamBWinner
              ? 'bg-[#0A84FF]/10 border-[#0A84FF]/40'
              : 'bg-[#2C2C2E]/60 border-white/5'
          }`}
          title={isAdmin ? 'Haz clic para capturar marcador' : undefined}
        >
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center space-x-2.5 min-w-0">
              {getAvatar(match.teamB.player1Id, match.teamB.player1Name)}
              <div className="min-w-0 flex-1 truncate">
                <span className="text-sm sm:text-base font-black text-white">
                  {pB1.nickname}
                </span>
                <span className="text-xs text-[#8E8E93] ml-1.5 font-normal truncate hidden sm:inline">
                  {pB1.fullName}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2.5 min-w-0">
              {getAvatar(match.teamB.player2Id, match.teamB.player2Name)}
              <div className="min-w-0 flex-1 truncate">
                <span className="text-sm sm:text-base font-black text-white">
                  {pB2.nickname}
                </span>
                <span className="text-xs text-[#8E8E93] ml-1.5 font-normal truncate hidden sm:inline">
                  {pB2.fullName}
                </span>
              </div>
            </div>
          </div>

          {/* Score Box */}
          <div className="text-right pl-2 flex-shrink-0">
            <div className={`font-mono text-3xl sm:text-4xl font-black min-w-[40px] text-center ${
              isTeamBWinner ? 'text-[#0A84FF]' : 'text-white/80'
            }`}>
              {isCompleted ? match.score.scoreB : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Tie Break or Cut-off Notes */}
      {isCompleted && (match.score.tieBreakPointsA !== undefined || match.score.isCutoff) && (
        <div className="text-xs text-[#8E8E93] bg-[#2C2C2E] px-3 py-1.5 rounded-xl flex items-center justify-between">
          {match.score.tieBreakPointsA !== undefined && (
            <span className="text-[#FFD60A] font-semibold flex items-center">
              <Flame className="w-3.5 h-3.5 mr-1" /> Tie-Break: {match.score.tieBreakPointsA} - {match.score.tieBreakPointsB}
            </span>
          )}
          {match.score.isCutoff && (
            <span className="text-white font-medium flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-[#FFD60A]" /> Corte por tiempo
            </span>
          )}
        </div>
      )}

      {/* Score Button */}
      {isAdmin && (
        <button
          onClick={() => onOpenScoreModal(match)}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center transition-all ios-touch ${
            isCompleted
              ? 'bg-[#2C2C2E] text-[#8E8E93] hover:text-white border border-white/5'
              : 'bg-[#30D158] text-black active:bg-[#28B84B]'
          }`}
        >
          <Edit3 className="w-4 h-4 mr-2" />
          {isCompleted ? 'Editar Marcador' : 'Capturar Marcador'}
        </button>
      )}
    </div>
  );
};
