import React, { useState, useEffect } from 'react';
import { X, Check, Clock, Award, Flame, AlertCircle } from 'lucide-react';
import type { Match, MatchScore } from '../types/index.ts';
import { calculateMarginBonus } from '../utils/tieBreakerEngine.ts';

interface ScoreModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveScore: (matchId: string, score: MatchScore) => void;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({
  match,
  isOpen,
  onClose,
  onSaveScore,
}) => {
  if (!isOpen || !match) return null;

  const isShortGame = match.matchType === 'preliminary';
  const [scoreA, setScoreA] = useState<number>(match.score?.scoreA ?? 0);
  const [scoreB, setScoreB] = useState<number>(match.score?.scoreB ?? 0);
  const [tieBreakPointsA, setTieBreakPointsA] = useState<number | undefined>(match.score?.tieBreakPointsA);
  const [tieBreakPointsB, setTieBreakPointsB] = useState<number | undefined>(match.score?.tieBreakPointsB);
  const [isCutoff, setIsCutoff] = useState<boolean>(match.score?.isCutoff ?? false);

  useEffect(() => {
    if (match) {
      setScoreA(match.score?.scoreA ?? 0);
      setScoreB(match.score?.scoreB ?? 0);
      setTieBreakPointsA(match.score?.tieBreakPointsA);
      setTieBreakPointsB(match.score?.tieBreakPointsB);
      setIsCutoff(match.score?.isCutoff ?? false);
    }
  }, [match]);

  const isTieBreak = isShortGame && scoreA === 3 && scoreB === 3;

  // Preset short scores
  const quickShortScores = [
    { label: '7 - 0', a: 7, b: 0 },
    { label: '0 - 7', a: 0, b: 7 },
    { label: '6 - 1', a: 6, b: 1 },
    { label: '1 - 6', a: 1, b: 6 },
    { label: '5 - 2', a: 5, b: 2 },
    { label: '2 - 5', a: 2, b: 5 },
    { label: '4 - 3', a: 4, b: 3 },
    { label: '3 - 4', a: 3, b: 4 },
  ];

  // Preset full finals scores
  const quickFinalScores = [
    { label: '6 - 0', a: 6, b: 0 },
    { label: '6 - 1', a: 6, b: 1 },
    { label: '6 - 2', a: 6, b: 2 },
    { label: '6 - 3', a: 6, b: 3 },
    { label: '6 - 4', a: 6, b: 4 },
    { label: '7 - 5', a: 7, b: 5 },
    { label: '7 - 6', a: 7, b: 6 },
  ];

  const handleApplyPreset = (a: number, b: number) => {
    setScoreA(a);
    setScoreB(b);
    setIsCutoff(false);
  };

  const handleSave = () => {
    let winner: 'teamA' | 'teamB' | 'draw' = 'draw';
    if (scoreA > scoreB) winner = 'teamA';
    else if (scoreB > scoreA) winner = 'teamB';
    else if (isTieBreak && tieBreakPointsA !== undefined && tieBreakPointsB !== undefined) {
      winner = tieBreakPointsA > tieBreakPointsB ? 'teamA' : 'teamB';
    }

    const finalScore: MatchScore = {
      scoreA,
      scoreB,
      tieBreakPointsA: isTieBreak ? tieBreakPointsA : undefined,
      tieBreakPointsB: isTieBreak ? tieBreakPointsB : undefined,
      isCutoff,
      completed: true,
      winner,
    };

    onSaveScore(match.id, finalScore);
    onClose();
  };

  const marginBonusA = calculateMarginBonus(scoreA, scoreB, isCutoff);
  const marginBonusB = calculateMarginBonus(scoreB, scoreA, isCutoff);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {match.courtName || `Cancha ${match.courtNumber}`}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {isShortGame ? `Juego Corto #${match.roundNumber}` : 'Final del Día'}
              </span>
            </div>
            <h3 className="text-lg font-bold font-display text-white mt-1">Registrar Marcador</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Teams Matchup & Score Inputs */}
        <div className="grid grid-cols-2 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
          {/* Team A */}
          <div className="space-y-3 text-center">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Pareja A</div>
            <div className="text-sm font-semibold text-white leading-tight min-h-[38px] flex flex-col justify-center">
              <span>{match.teamA.player1Name}</span>
              <span className="text-slate-400 text-xs">& {match.teamA.player2Name}</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 font-black text-slate-300 text-base"
              >
                -
              </button>
              <span className="text-3xl font-black font-display text-white w-12 text-center">{scoreA}</span>
              <button
                type="button"
                onClick={() => setScoreA(scoreA + 1)}
                className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-black text-black text-base"
              >
                +
              </button>
            </div>
            {isShortGame && (
              <div className="text-[11px] font-mono">
                Bono:{' '}
                <span className={marginBonusA >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {marginBonusA >= 0 ? `+${marginBonusA.toFixed(3)}` : marginBonusA.toFixed(3)}
                </span>
              </div>
            )}
          </div>

          {/* Team B */}
          <div className="space-y-3 text-center border-l border-slate-800/80 pl-4">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">Pareja B</div>
            <div className="text-sm font-semibold text-white leading-tight min-h-[38px] flex flex-col justify-center">
              <span>{match.teamB.player1Name}</span>
              <span className="text-slate-400 text-xs">& {match.teamB.player2Name}</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 font-black text-slate-300 text-base"
              >
                -
              </button>
              <span className="text-3xl font-black font-display text-white w-12 text-center">{scoreB}</span>
              <button
                type="button"
                onClick={() => setScoreB(scoreB + 1)}
                className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 font-black text-white text-base"
              >
                +
              </button>
            </div>
            {isShortGame && (
              <div className="text-[11px] font-mono">
                Bono:{' '}
                <span className={marginBonusB >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {marginBonusB >= 0 ? `+${marginBonusB.toFixed(3)}` : marginBonusB.toFixed(3)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tie Break Section (if 3-3 in short games) */}
        {isTieBreak && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
            <div className="flex items-center text-xs font-bold text-amber-400">
              <Flame className="w-4 h-4 mr-1.5" />
              Empate 3-3: Tie-Break a 10 puntos máx.
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Pts Tie-Break Pareja A</label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={tieBreakPointsA ?? ''}
                  onChange={(e) => setTieBreakPointsA(parseInt(e.target.value) || 0)}
                  placeholder="Ej: 10"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-3 text-center font-bold text-amber-300"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Pts Tie-Break Pareja B</label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={tieBreakPointsB ?? ''}
                  onChange={(e) => setTieBreakPointsB(parseInt(e.target.value) || 0)}
                  placeholder="Ej: 8"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-3 text-center font-bold text-amber-300"
                />
              </div>
            </div>
          </div>
        )}

        {/* Quick Selection Buttons */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400">Marcadores Rápidos (1 Toque):</label>
          <div className="grid grid-cols-4 gap-1.5">
            {isShortGame
              ? quickShortScores.map((qs) => (
                  <button
                    key={qs.label}
                    type="button"
                    onClick={() => handleApplyPreset(qs.a, qs.b)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all ${
                      scoreA === qs.a && scoreB === qs.b && !isCutoff
                        ? 'bg-emerald-500 text-black shadow-neon'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {qs.label}
                  </button>
                ))
              : quickFinalScores.map((qs) => (
                  <button
                    key={qs.label}
                    type="button"
                    onClick={() => handleApplyPreset(qs.a, qs.b)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all ${
                      scoreA === qs.a && scoreB === qs.b && !isCutoff
                        ? 'bg-emerald-500 text-black shadow-neon'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {qs.label}
                  </button>
                ))}
          </div>
        </div>

        {/* Cut-off checkbox */}
        <div className="flex items-center space-x-2 pt-1">
          <input
            type="checkbox"
            id="isCutoff"
            checked={isCutoff}
            onChange={(e) => setIsCutoff(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500"
          />
          <label htmlFor="isCutoff" className="text-xs text-slate-300 flex items-center cursor-pointer">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" />
            Corte por tiempo / incompleto (ej. 3-1, 2-0, gana quien va adelante)
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm shadow-neon flex items-center justify-center transition-all"
          >
            <Check className="w-4 h-4 mr-1.5" />
            Guardar Marcador
          </button>
        </div>
      </div>
    </div>
  );
};
