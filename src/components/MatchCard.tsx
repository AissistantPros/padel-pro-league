import React from 'react';
import { Clock, Zap, Edit3, Flame, CheckCircle2 } from 'lucide-react';
import type { Match, PlayerIntelligenceStats } from '../types/index.ts';
import { predictMatchWinProbability } from '../utils/intelligenceEngine.ts';

interface MatchCardProps {
  match: Match;
  isAdmin: boolean;
  onOpenScoreModal: (match: Match) => void;
  statsList: PlayerIntelligenceStats[];
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  isAdmin,
  onOpenScoreModal,
  statsList,
}) => {
  const isCompleted = match.score.completed;
  const isTeamAWinner = isCompleted && match.score.winner === 'teamA';
  const isTeamBWinner = isCompleted && match.score.winner === 'teamB';

  // Win probability prediction
  const prediction = predictMatchWinProbability(
    [match.teamA.player1Id, match.teamA.player2Id],
    [match.teamB.player1Id, match.teamB.player2Id],
    statsList
  );

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

  const getCategoryBadge = () => {
    switch (match.finalCategory) {
      case 'gold':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFD60A]/15 text-[#FFD60A] border border-[#FFD60A]/30">👑 Final Oro (1º-4º)</span>;
      case 'silver':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E5E5EA]/15 text-[#E5E5EA] border border-[#E5E5EA]/30">🥈 Final Plata (5º-8º)</span>;
      case 'bronze':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30">🥉 Final Bronce (9º-12º)</span>;
      case 'copper':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#AC8E68]/15 text-[#AC8E68] border border-[#AC8E68]/30">🍖 Final Madera (13º-16º)</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2C2C2E] text-[#8E8E93]">Ronda {match.roundNumber}</span>;
    }
  };

  return (
    <div className="ios-card p-4 sm:p-5 space-y-3.5 select-none">
      {/* Court Header & Prediction Pill */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/5">
        <div className="flex items-center space-x-2">
          <span className="text-sm sm:text-base font-bold text-white flex items-center">
            🎾 {match.courtName || `Cancha ${match.courtNumber}`}
          </span>
          {getCategoryBadge()}
        </div>

        {/* Prediction probability pill */}
        {!isCompleted ? (
          <div className="flex items-center space-x-1.5 text-xs font-mono bg-[#2C2C2E] px-2.5 py-1 rounded-full text-[#8E8E93]">
            <Zap className="w-3.5 h-3.5 text-[#64D2FF]" />
            <span className="text-[#30D158] font-bold">{prediction.probTeamA}%</span>
            <span>-</span>
            <span className="text-[#0A84FF] font-bold">{prediction.probTeamB}%</span>
          </div>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-[#30D158] bg-[#30D158]/15">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Finalizado
          </span>
        )}
      </div>

      {/* Teams Score Cards */}
      <div className="space-y-2">
        {/* Team A Card */}
        <div className={`p-3 sm:p-3.5 rounded-2xl transition-all border flex items-center justify-between gap-3 ${
          isTeamAWinner
            ? 'bg-[#30D158]/10 border-[#30D158]/40'
            : 'bg-[#2C2C2E]/60 border-white/5'
        }`}>
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center space-x-2.5 truncate">
              {getAvatar(match.teamA.player1Id, match.teamA.player1Name)}
              <span className={`text-sm sm:text-base truncate ${isTeamAWinner ? 'font-bold text-white' : 'font-medium text-white'}`}>
                {match.teamA.player1Name}
              </span>
            </div>
            <div className="flex items-center space-x-2.5 truncate">
              {getAvatar(match.teamA.player2Id, match.teamA.player2Name)}
              <span className={`text-sm sm:text-base truncate ${isTeamAWinner ? 'font-bold text-white' : 'font-medium text-white'}`}>
                {match.teamA.player2Name}
              </span>
            </div>
          </div>

          {/* Score Box */}
          <div className="text-right pl-2 flex-shrink-0">
            <div className={`font-mono text-3xl font-bold min-w-[40px] text-center ${
              isTeamAWinner ? 'text-[#30D158]' : 'text-white/80'
            }`}>
              {isCompleted ? match.score.scoreA : '-'}
            </div>
          </div>
        </div>

        {/* Team B Card */}
        <div className={`p-3 sm:p-3.5 rounded-2xl transition-all border flex items-center justify-between gap-3 ${
          isTeamBWinner
            ? 'bg-[#0A84FF]/10 border-[#0A84FF]/40'
            : 'bg-[#2C2C2E]/60 border-white/5'
        }`}>
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center space-x-2.5 truncate">
              {getAvatar(match.teamB.player1Id, match.teamB.player1Name)}
              <span className={`text-sm sm:text-base truncate ${isTeamBWinner ? 'font-bold text-white' : 'font-medium text-white'}`}>
                {match.teamB.player1Name}
              </span>
            </div>
            <div className="flex items-center space-x-2.5 truncate">
              {getAvatar(match.teamB.player2Id, match.teamB.player2Name)}
              <span className={`text-sm sm:text-base truncate ${isTeamBWinner ? 'font-bold text-white' : 'font-medium text-white'}`}>
                {match.teamB.player2Name}
              </span>
            </div>
          </div>

          {/* Score Box */}
          <div className="text-right pl-2 flex-shrink-0">
            <div className={`font-mono text-3xl font-bold min-w-[40px] text-center ${
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
