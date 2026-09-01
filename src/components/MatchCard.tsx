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
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-emerald-400/80 shadow-neon flex-shrink-0 bg-slate-900"
        />
      );
    }
    return (
      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-black text-xs sm:text-sm text-emerald-400 flex-shrink-0">
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  };

  const getCategoryBadge = () => {
    switch (match.finalCategory) {
      case 'gold':
        return <span className="px-3 py-1 rounded-xl text-xs sm:text-sm font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">👑 FINAL ORO (1º-4º)</span>;
      case 'silver':
        return <span className="px-3 py-1 rounded-xl text-xs sm:text-sm font-black bg-slate-400/20 text-slate-300 border border-slate-400/40">🥈 FINAL PLATA (5º-8º)</span>;
      case 'bronze':
        return <span className="px-3 py-1 rounded-xl text-xs sm:text-sm font-black bg-amber-700/20 text-amber-400 border border-amber-700/40">🥉 FINAL BRONCE (9º-12º)</span>;
      case 'copper':
        return <span className="px-3 py-1 rounded-xl text-xs sm:text-sm font-black bg-orange-600/20 text-orange-300 border border-orange-600/40">🍖 FINAL COBRE (13º-16º)</span>;
      default:
        return <span className="px-3 py-1 rounded-xl text-xs sm:text-sm font-black bg-slate-800 text-slate-200 border border-slate-700">Juego Corto {match.roundNumber}</span>;
    }
  };

  return (
    <div className={`glass-panel rounded-3xl p-4 sm:p-5 border space-y-4 transition-all ${
      isCompleted ? 'border-slate-800 bg-[#0E1422]' : 'border-slate-700/80 bg-[#121829] shadow-lg'
    }`}>
      {/* Court Header & Prediction Pill */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800 flex-wrap">
        <div className="flex items-center space-x-2">
          <span className="text-base sm:text-lg font-black text-white flex items-center">
            🎾 {match.courtName || `Cancha ${match.courtNumber}`}
          </span>
          {getCategoryBadge()}
        </div>

        {/* Prediction probability pill */}
        {!isCompleted && (
          <div className="flex items-center space-x-2 text-xs sm:text-sm font-mono bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-emerald-400 font-black">{prediction.probTeamA}%</span>
            <span className="text-slate-500 font-bold">vs</span>
            <span className="text-blue-400 font-black">{prediction.probTeamB}%</span>
          </div>
        )}

        {isCompleted && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Terminado
          </span>
        )}
      </div>

      {/* Teams Container - Stacked Professional Broadcast Cards */}
      <div className="space-y-3">
        {/* Team A Card */}
        <div className={`p-3.5 sm:p-4 rounded-2xl transition-all border flex items-center justify-between gap-3 ${
          isTeamAWinner
            ? 'bg-emerald-500/15 border-2 border-emerald-500/60 shadow-neon'
            : 'bg-slate-950/90 border-slate-800'
        }`}>
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm flex-shrink-0 ${
              isTeamAWinner ? 'bg-emerald-500 text-black shadow-neon' : 'bg-slate-800 text-emerald-400 border border-slate-700'
            }`}>
              A
            </div>

            {/* Players with Avatars - Clear mobile wrapping with no overlap */}
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center space-x-2 truncate">
                {getAvatar(match.teamA.player1Id, match.teamA.player1Name)}
                <span className="text-base sm:text-lg font-black text-white truncate">
                  {match.teamA.player1Name}
                </span>
              </div>
              <div className="flex items-center space-x-2 truncate">
                {getAvatar(match.teamA.player2Id, match.teamA.player2Name)}
                <span className="text-base sm:text-lg font-black text-white truncate">
                  {match.teamA.player2Name}
                </span>
              </div>
            </div>
          </div>

          {/* Huge Score Box */}
          <div className="text-right pl-2 flex-shrink-0">
            <div className={`font-mono text-3xl sm:text-4xl font-black min-w-[48px] text-center ${
              isTeamAWinner ? 'text-emerald-400 glow-text-neon' : 'text-slate-400'
            }`}>
              {isCompleted ? match.score.scoreA : '-'}
            </div>
          </div>
        </div>

        {/* Team B Card */}
        <div className={`p-3.5 sm:p-4 rounded-2xl transition-all border flex items-center justify-between gap-3 ${
          isTeamBWinner
            ? 'bg-blue-500/15 border-2 border-blue-500/60 shadow-blue-glow'
            : 'bg-slate-950/90 border-slate-800'
        }`}>
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm flex-shrink-0 ${
              isTeamBWinner ? 'bg-blue-600 text-white shadow-blue-glow' : 'bg-slate-800 text-blue-400 border border-slate-700'
            }`}>
              B
            </div>

            {/* Players with Avatars - Clear mobile wrapping with no overlap */}
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center space-x-2 truncate">
                {getAvatar(match.teamB.player1Id, match.teamB.player1Name)}
                <span className="text-base sm:text-lg font-black text-white truncate">
                  {match.teamB.player1Name}
                </span>
              </div>
              <div className="flex items-center space-x-2 truncate">
                {getAvatar(match.teamB.player2Id, match.teamB.player2Name)}
                <span className="text-base sm:text-lg font-black text-white truncate">
                  {match.teamB.player2Name}
                </span>
              </div>
            </div>
          </div>

          {/* Huge Score Box */}
          <div className="text-right pl-2 flex-shrink-0">
            <div className={`font-mono text-3xl sm:text-4xl font-black min-w-[48px] text-center ${
              isTeamBWinner ? 'text-blue-400 glow-text-blue' : 'text-slate-400'
            }`}>
              {isCompleted ? match.score.scoreB : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Tie Break or Cut-off Notes */}
      {isCompleted && (match.score.tieBreakPointsA !== undefined || match.score.isCutoff) && (
        <div className="text-xs sm:text-sm text-slate-300 bg-slate-950 px-4 py-2 rounded-2xl flex items-center justify-between border border-slate-800">
          {match.score.tieBreakPointsA !== undefined && (
            <span className="text-amber-400 font-black flex items-center">
              <Flame className="w-4 h-4 mr-1.5 text-amber-400" /> Tie-Break: {match.score.tieBreakPointsA} - {match.score.tieBreakPointsB}
            </span>
          )}
          {match.score.isCutoff && (
            <span className="text-slate-300 font-bold flex items-center">
              <Clock className="w-4 h-4 mr-1.5 text-amber-400" /> Corte por tiempo
            </span>
          )}
        </div>
      )}

      {/* Score Button - Extra Large for phone screens (54px height) */}
      {isAdmin ? (
        <button
          onClick={() => onOpenScoreModal(match)}
          className={`w-full py-3.5 sm:py-4 px-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center transition-all ${
            isCompleted
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              : 'bg-emerald-500 active:bg-emerald-400 text-black shadow-neon cursor-pointer'
          }`}
        >
          <Edit3 className="w-5 h-5 mr-2" />
          {isCompleted ? 'Modificar Marcador' : 'Cargar Marcador del Partido'}
        </button>
      ) : (
        !isCompleted && (
          <div className="text-center text-sm text-slate-400 italic py-1.5 font-bold">
            ⏳ Partido en juego en cancha...
          </div>
        )
      )}
    </div>
  );
};
