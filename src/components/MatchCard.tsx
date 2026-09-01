import React from 'react';
import { Trophy, Clock, Zap, Edit3, Flame, CheckCircle2 } from 'lucide-react';
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

  const getCategoryBadge = () => {
    switch (match.finalCategory) {
      case 'gold':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">FINAL ORO (1º-4º)</span>;
      case 'silver':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-400/20 text-slate-300 border border-slate-400/40">FINAL PLATA (5º-8º)</span>;
      case 'bronze':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-700/20 text-amber-500 border border-amber-700/40">FINAL BRONCE (9º-12º)</span>;
      case 'copper':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-orange-600/20 text-orange-400 border border-orange-600/40">FINAL COBRE (13º-16º)</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">Juego {match.roundNumber}</span>;
    }
  };

  return (
    <div className={`glass-panel rounded-2xl p-4 sm:p-5 border transition-all duration-200 ${
      isCompleted ? 'border-slate-800' : 'border-slate-700/80 hover:border-emerald-500/40'
    }`}>
      {/* Top Court & Prediction Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-white flex items-center">
            🎾 {match.courtName || `Cancha ${match.courtNumber}`}
          </span>
          {getCategoryBadge()}
        </div>

        {/* Prediction probability pill */}
        {!isCompleted && (
          <div className="flex items-center space-x-1.5 text-[11px] font-mono bg-slate-900/90 px-2.5 py-1 rounded-full border border-slate-800">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span className="text-emerald-400 font-bold">{prediction.probTeamA}%</span>
            <span className="text-slate-500">vs</span>
            <span className="text-blue-400 font-bold">{prediction.probTeamB}%</span>
          </div>
        )}

        {isCompleted && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Finalizado
          </span>
        )}
      </div>

      {/* Matchup Teams */}
      <div className="py-3.5 space-y-2.5">
        {/* Team A */}
        <div className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
          isTeamAWinner ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-slate-900/60'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
              isTeamAWinner ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-300'
            }`}>
              A
            </div>
            <div>
              <div className={`text-xs sm:text-sm font-bold ${isTeamAWinner ? 'text-white' : 'text-slate-200'}`}>
                {match.teamA.player1Name}
              </div>
              <div className="text-[11px] text-slate-400">
                {match.teamA.player2Name}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className={`font-mono text-xl sm:text-2xl font-black ${
              isTeamAWinner ? 'text-emerald-400' : 'text-slate-400'
            }`}>
              {isCompleted ? match.score.scoreA : '-'}
            </span>
          </div>
        </div>

        {/* Team B */}
        <div className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
          isTeamBWinner ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-slate-900/60'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
              isTeamBWinner ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-300'
            }`}>
              B
            </div>
            <div>
              <div className={`text-xs sm:text-sm font-bold ${isTeamBWinner ? 'text-white' : 'text-slate-200'}`}>
                {match.teamB.player1Name}
              </div>
              <div className="text-[11px] text-slate-400">
                {match.teamB.player2Name}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className={`font-mono text-xl sm:text-2xl font-black ${
              isTeamBWinner ? 'text-emerald-400' : 'text-slate-400'
            }`}>
              {isCompleted ? match.score.scoreB : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Tie Break or Cut-off Notes */}
      {isCompleted && (match.score.tieBreakPointsA !== undefined || match.score.isCutoff) && (
        <div className="text-[11px] text-slate-400 bg-slate-900/70 px-3 py-1 rounded-lg flex items-center justify-between mb-3">
          {match.score.tieBreakPointsA !== undefined && (
            <span className="text-amber-400 flex items-center">
              <Flame className="w-3 h-3 mr-1" /> Tie-Break: {match.score.tieBreakPointsA} - {match.score.tieBreakPointsB}
            </span>
          )}
          {match.score.isCutoff && (
            <span className="text-slate-400 flex items-center">
              <Clock className="w-3 h-3 mr-1 text-amber-400" /> Corte por tiempo
            </span>
          )}
        </div>
      )}

      {/* Score Button */}
      {isAdmin ? (
        <button
          onClick={() => onOpenScoreModal(match)}
          className={`w-full py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center transition-all ${
            isCompleted
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-neon'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5 mr-1.5" />
          {isCompleted ? 'Editar Marcador' : 'Cargar Marcador'}
        </button>
      ) : (
        !isCompleted && (
          <div className="text-center text-xs text-slate-500 italic py-1">
            Esperando resultado en cancha...
          </div>
        )
      )}
    </div>
  );
};
