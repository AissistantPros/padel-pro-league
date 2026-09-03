import React, { useState, useEffect } from 'react';
import { X, Check, Clock, Flame } from 'lucide-react';
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

  const quickShortScores = [
    { label: '7 - 0', sub: '+0.004', a: 7, b: 0 },
    { label: '6 - 1', sub: '+0.003', a: 6, b: 1 },
    { label: '5 - 2', sub: '+0.002', a: 5, b: 2 },
    { label: '4 - 3', sub: '0.000', a: 4, b: 3 },
    { label: '0 - 7', sub: '-0.004', a: 0, b: 7 },
    { label: '1 - 6', sub: '-0.003', a: 1, b: 6 },
    { label: '2 - 5', sub: '-0.003', a: 2, b: 5 },
    { label: '3 - 4', sub: '-0.002', a: 3, b: 4 },
  ];

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* iOS Modal Sheet */}
      <div className="relative w-full max-w-lg bg-[#1C1C1E] border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-[28px] p-6 text-white shadow-2xl z-10 max-h-[90vh] overflow-y-auto animate-slide-up space-y-4">
        {/* iOS Drag Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-[#FFD60A]">
                🎾 {match.courtName || `Cancha ${match.courtNumber}`}
              </span>
              <span className="text-xs text-[#8E8E93]">
                {isShortGame ? `Ronda ${match.roundNumber}` : 'Final'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">Capturar Marcador</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2C2C2E] text-[#8E8E93] hover:text-white flex items-center justify-center ios-touch"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Touch Score Steppers */}
        <div className="grid grid-cols-2 gap-3 bg-[#2C2C2E] p-4 rounded-2xl border border-white/5">
          {/* Team A */}
          <div className="space-y-2 text-center">
            <span className="text-xs font-semibold text-[#30D158] uppercase tracking-wider block">PAREJA A</span>
            <div className="text-xs font-semibold text-white truncate">
              {match.teamA.player1Name} & {match.teamA.player2Name}
            </div>

            {/* Stepper Buttons */}
            <div className="flex items-center justify-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                className="w-11 h-11 rounded-xl bg-[#3A3A3C] active:bg-[#48484A] font-bold text-white text-xl flex items-center justify-center ios-touch"
              >
                -
              </button>
              <span className="text-3xl font-bold font-mono text-white w-10 text-center">
                {scoreA}
              </span>
              <button
                type="button"
                onClick={() => setScoreA(scoreA + 1)}
                className="w-11 h-11 rounded-xl bg-[#30D158] text-black font-bold text-xl flex items-center justify-center ios-touch"
              >
                +
              </button>
            </div>
          </div>

          {/* Team B */}
          <div className="space-y-2 text-center border-l border-white/10 pl-3">
            <span className="text-xs font-semibold text-[#0A84FF] uppercase tracking-wider block">PAREJA B</span>
            <div className="text-xs font-semibold text-white truncate">
              {match.teamB.player1Name} & {match.teamB.player2Name}
            </div>

            {/* Stepper Buttons */}
            <div className="flex items-center justify-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                className="w-11 h-11 rounded-xl bg-[#3A3A3C] active:bg-[#48484A] font-bold text-white text-xl flex items-center justify-center ios-touch"
              >
                -
              </button>
              <span className="text-3xl font-bold font-mono text-white w-10 text-center">
                {scoreB}
              </span>
              <button
                type="button"
                onClick={() => setScoreB(scoreB + 1)}
                className="w-11 h-11 rounded-xl bg-[#0A84FF] text-white font-bold text-xl flex items-center justify-center ios-touch"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Tie Break Section */}
        {isTieBreak && (
          <div className="p-3 bg-[#FFD60A]/10 border border-[#FFD60A]/30 rounded-xl space-y-2">
            <div className="flex items-center text-xs font-semibold text-[#FFD60A]">
              <Flame className="w-4 h-4 mr-1" />
              Empate 3-3: Puntos Tie-Break
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <label className="text-[11px] text-[#8E8E93] block mb-1">Pts Pareja A</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={tieBreakPointsA ?? ''}
                  onChange={(e) => setTieBreakPointsA(parseInt(e.target.value) || 0)}
                  placeholder="Ej: 10"
                  className="w-full bg-[#1C1C1E] border border-white/15 rounded-xl py-2 px-3 text-center text-lg font-bold font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#8E8E93] block mb-1">Pts Pareja B</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={tieBreakPointsB ?? ''}
                  onChange={(e) => setTieBreakPointsB(parseInt(e.target.value) || 0)}
                  placeholder="Ej: 8"
                  className="w-full bg-[#1C1C1E] border border-white/15 rounded-xl py-2 px-3 text-center text-lg font-bold font-mono text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 1-Tap Quick Presets */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block">
            Marcadores Frecuentes:
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {isShortGame
              ? quickShortScores.map((qs) => (
                  <button
                    key={qs.label}
                    type="button"
                    onClick={() => handleApplyPreset(qs.a, qs.b)}
                    className={`py-2 px-1 rounded-xl text-center transition-all ios-touch border ${
                      scoreA === qs.a && scoreB === qs.b && !isCutoff
                        ? 'bg-[#30D158] text-black font-bold border-[#30D158]'
                        : 'bg-[#2C2C2E] border-white/5 text-white hover:bg-[#3A3A3C]'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">{qs.label}</div>
                  </button>
                ))
              : quickFinalScores.map((qs) => (
                  <button
                    key={qs.label}
                    type="button"
                    onClick={() => handleApplyPreset(qs.a, qs.b)}
                    className={`py-2 px-1 rounded-xl text-center transition-all ios-touch border ${
                      scoreA === qs.a && scoreB === qs.b && !isCutoff
                        ? 'bg-[#30D158] text-black font-bold border-[#30D158]'
                        : 'bg-[#2C2C2E] border-white/5 text-white hover:bg-[#3A3A3C]'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">{qs.label}</div>
                  </button>
                ))}
          </div>
        </div>

        {/* Cut-off checkbox */}
        <div className="p-3 bg-[#2C2C2E] rounded-xl flex items-center space-x-2.5">
          <input
            type="checkbox"
            id="isCutoff"
            checked={isCutoff}
            onChange={(e) => setIsCutoff(e.target.checked)}
            className="w-4 h-4 rounded text-[#30D158] bg-[#1C1C1E] border-white/20"
          />
          <label htmlFor="isCutoff" className="text-xs text-[#8E8E93] font-medium flex items-center cursor-pointer">
            <Clock className="w-3.5 h-3.5 mr-1 text-[#FFD60A]" />
            Corte por tiempo reglamentario
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-3 rounded-xl bg-[#2C2C2E] text-[#8E8E93] hover:text-white font-semibold text-sm ios-touch"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="w-2/3 py-3 rounded-xl bg-[#30D158] active:bg-[#28B84B] text-black font-bold text-sm flex items-center justify-center ios-touch"
          >
            <Check className="w-4 h-4 mr-1.5" />
            Guardar Marcador
          </button>
        </div>
      </div>
    </div>
  );
};
