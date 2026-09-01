import React from 'react';
import { Trophy, Clock, Zap, Edit3, Flame, CheckCircle2, Swords } from 'lucide-react';
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

  // Get player avatars
  const getAvatar = (id: string, name: string) => {
    const pStat = statsList.find(s => s.playerId === id);
    if (pStat?.avatar) {
      return (
        <img
          src={pStat.avatar}
          alt={name}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-emerald-400/80 shadow-neon flex-shrink-0 bg-slate-900"
        />
      );
    }
    return (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-black text-[10px] sm:text-xs text-emerald-400 flex-shrink-0">
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  };

  const getCategoryBadge = () => {
    switch (match.finalCategory) {
      case 'gold':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">👑 FINAL ORO (1º-4º)</span>;
      case 'silver':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-400/20 text-slate-300 border border-slate-400/40">🥈 FINAL PLATA (5º-8º)</span>;
      case 'bronze':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-700/20 text-amber-400 border border-amber-700/40">🥉 FINAL BRONCE (9º-12º)</span>;
      case 'copper':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-orange-600/20 text-orange-300 border border-orange-600/40">🍖 FINAL COBRE (13º-16º)</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">Juego Corto {match.roundNumber}</span>;
    }
  };

  return (
    <div className={`glass-panel rounded-2xl p-4 sm:p-5 border transition-all duration-200 ${
      isCompleted ? 'border-slate-800 bg-slate-950/80' : 'border-slate-700 hover:border-emerald-500/50 bg-[#121826]'
    }`}>
      {/* Top Court & Prediction Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-extrabold text-white flex items-center">
            🎾 {match.courtName || `Cancha ${match.courtNumber}`}
          </span>
          {getCategoryBadge()}
        </div>

        {/* Prediction probability pill */}
        {!isCompleted && (
          <div className="flex items-center space-x-1.5 text-xs font-mono bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-emerald-400 font-extrabold">{prediction.probTeamA}%</span>
            <span className="text-slate-500 font-bold">vs</span>
            <span className="text-blue-400 font-extrabold">{prediction.probTeamB}%</span>
          </div>
        )}

        {isCompleted && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Terminado
          </span>
        )}
      </div>

      {/* Matchup Teams - With Professional Cropped Avatar Photos */}
      <div className="py-3.5 space-y-3">
        {/* Team A */}
        <div className={`flex items-center justify-between p-3 sm:p-3.5 rounded-xl transition-colors ${
          isTeamAWinner ? 'bg-emerald-500/20 border-2 border-emerald-500/50' : 'bg-slate-900/90 border border-slate-800'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
              isTeamAWinner ? 'bg-emerald-500 text-black shadow-neon' : 'bg-slate-800 text-slate-300'
            }`}>
              A
            </div>

            {/* Players with Avatars */}
            <div className="flex items-center space-x-3 flex-wrap gap-y-1">
              <div className="flex items-center space-x-1.5">
                {getAvatar(match.teamA.player1Id, match.teamA.player1Name)}
                <span className="text-sm sm:text-base font-bold text-white">{match.teamA.player1Name}</span>
              </div>
              <span className="text-emerald-400 font-black text-xs">&</span>
              <div className="flex items-center space-x-1.5">
                {getAvatar(match.teamA.player2Id, match.teamA.player2Name)}
                <span className="text-sm sm:text-base font-bold text-white">{match.teamA.player2Name}</span>
              </div>
            </div>
          </div>

          <div className="text-right pl-2">
            <span className={`font-mono text-2xl sm:text-3xl font-black ${
              isTeamAWinner ? 'text-emerald-400 glow-text-neon' : 'text-slate-400'
            }`}>
              {isCompleted ? match.score.scoreA : '-'}
            </span>
          </div>
        </div>

        {/* Team B */}
        <div className={`flex items-center justify-between p-3 sm:p-3.5 rounded-xl transition-colors ${
          isTeamBWinner ? 'bg-emerald-500/20 border-2 border-emerald-500/50' : 'bg-slate-900/90 border border-slate-800'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
              isTeamBWinner ? 'bg-emerald-500 text-black shadow-neon' : 'bg-slate-800 text-slate-300'
            }`}>
              B
            </div>

            {/* Players with Avatars */}
            <div className="flex items-center space-x-3 flex-wrap gap-y-1">
              <div className="flex items-center space-x-1.5">
                {getAvatar(match.teamB.player1Id, match.teamB.player1Name)}
                <span className="text-sm sm:text-base font-bold text-white">{match.teamB.player1Name}</span>
              </div>
              <span className="text-blue-400 font-black text-xs">&</span>
              <div className="flex items-center space-x-1.5">
                {getAvatar(match.teamB.player2Id, match.teamB.player2Name)}
                <span className="text-sm sm:text-base font-bold text-white">{match.teamB.player2Name}</span>
              </div>
            </div>
          </div>

          <div className="text-right pl-2">
            <span className={`font-mono text-2xl sm:text-3xl font-black ${
              isTeamBWinner ? 'text-emerald-400 glow-text-neon' : 'text-slate-400'
            }`}>
              {isCompleted ? match.score.scoreB : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Tie Break or Cut-off Notes */}
      {isCompleted && (match.score.tieBreakPointsA !== undefined || match.score.isCutoff) && (
        <div className="text-xs text-slate-300 bg-slate-900 px-3.5 py-1.5 rounded-xl flex items-center justify-between mb-3 border border-slate-800">
          {match.score.tieBreakPointsA !== undefined && (
            <span className="text-amber-400 font-bold flex items-center">
              <Flame className="w-3.5 h-3.5 mr-1 text-amber-400" /> Tie-Break: {match.score.tieBreakPointsA} - {match.score.tieBreakPointsB}
            </span>
          )}
          {match.score.isCutoff && (
            <span className="text-slate-300 font-medium flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" /> Corte por tiempo (Validado)
            </span>
          )}
        </div>
      )}

      {/* Score Button - Extra Large for phone screens */}
      {isAdmin ? (
        <button
          onClick={() => onOpenScoreModal(match)}
          className={`w-full py-3 px-4 rounded-xl font-black text-sm sm:text-base flex items-center justify-center transition-all ${
            isCompleted
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-neon'
          }`}
        >
          <Edit3 className="w-4 h-4 mr-2" />
          {isCompleted ? 'Editar Marcador' : 'Cargar Marcador'}
        </button>
      ) : (
        !isCompleted && (
          <div className="text-center text-xs sm:text-sm text-slate-400 italic py-1 font-medium">
            ⏳ Partido en juego en cancha...
          </div>
        )
      )}
    </div>
  );
};
