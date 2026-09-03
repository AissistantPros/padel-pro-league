import React, { useState, useEffect } from 'react';
import { X, Check, Flame, Trophy, Frown, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Match, MatchScore } from '../types/index.ts';

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
  const [scoreA, setScoreA] = useState<number | null>(match.score?.completed ? match.score.scoreA : null);
  const [scoreB, setScoreB] = useState<number | null>(match.score?.completed ? match.score.scoreB : null);
  const [activeSide, setActiveSide] = useState<'A' | 'B'>('A');
  const [tieBreakPointsA, setTieBreakPointsA] = useState<number | undefined>(match.score?.tieBreakPointsA);
  const [tieBreakPointsB, setTieBreakPointsB] = useState<number | undefined>(match.score?.tieBreakPointsB);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [celebrating, setCelebrating] = useState<boolean>(false);

  useEffect(() => {
    if (match) {
      if (match.score?.completed) {
        setScoreA(match.score.scoreA);
        setScoreB(match.score.scoreB);
        setTieBreakPointsA(match.score.tieBreakPointsA);
        setTieBreakPointsB(match.score.tieBreakPointsB);
        setActiveSide('A');
      } else {
        setScoreA(null);
        setScoreB(null);
        setTieBreakPointsA(undefined);
        setTieBreakPointsB(undefined);
        setActiveSide('A');
      }
      setIsClosing(false);
      setCelebrating(false);
    }
  }, [match]);

  const isTieBreak = isShortGame && scoreA === 3 && scoreB === 3;
  const isBothSelected = scoreA !== null && scoreB !== null;

  const isTeamAWinner = isBothSelected && (
    (scoreA !== null && scoreB !== null && scoreA > scoreB) ||
    (isTieBreak && (tieBreakPointsA || 0) > (tieBreakPointsB || 0))
  );

  const isTeamBWinner = isBothSelected && (
    (scoreA !== null && scoreB !== null && scoreB > scoreA) ||
    (isTieBreak && (tieBreakPointsB || 0) > (tieBreakPointsA || 0))
  );

  const triggerCelebration = () => {
    setCelebrating(true);
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#30D158', '#FFD60A', '#FFFFFF', '#64D2FF'],
    });
  };

  const handleSelectScoreA = (val: number) => {
    setScoreA(val);
    if (scoreB === null) {
      setActiveSide('B');
    } else {
      checkAndCelebrate(val, scoreB);
    }
  };

  const handleSelectScoreB = (val: number) => {
    setScoreB(val);
    if (scoreA !== null) {
      checkAndCelebrate(scoreA, val);
    }
  };

  const checkAndCelebrate = (a: number, b: number) => {
    if (a !== b || !isShortGame || a !== 3) {
      triggerCelebration();
    }
  };

  const handleSave = () => {
    if (scoreA === null || scoreB === null) return;

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
      completed: true,
      winner,
    };

    setIsClosing(true);
    setTimeout(() => {
      onSaveScore(match.id, finalScore);
      onClose();
    }, 250);
  };

  const numbers = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md select-none transition-opacity duration-200 ${
      isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100 animate-fade-in'
    }`}>
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* iOS Modal Sheet */}
      <div className={`relative w-full max-w-lg bg-[#1C1C1E] border-t sm:border border-white/15 rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 text-white shadow-2xl z-10 max-h-[92vh] overflow-y-auto space-y-4 transition-transform duration-200 ${
        isClosing ? 'translate-y-12 scale-95 opacity-0' : 'translate-y-0 scale-100 animate-slide-up'
      }`}>
        {/* iOS Drag Handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-1 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#FFD60A]">
                🎾 {match.courtName || `Cancha ${match.courtNumber}`}
              </span>
              <span className="text-xs text-[#8E8E93]">
                {isShortGame ? `Ronda ${match.roundNumber}` : 'Final del Día'}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
              Ingresar Marcador
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2C2C2E] text-[#8E8E93] hover:text-white flex items-center justify-center ios-touch"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score Comparison Display */}
        <div className="grid grid-cols-2 gap-3">
          {/* Team A Card */}
          <div
            onClick={() => setActiveSide('A')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ios-touch ${
              isTeamAWinner
                ? 'bg-[#30D158]/20 border-[#30D158] ring-2 ring-[#30D158]/50 shadow-[0_0_20px_rgba(48,209,88,0.25)]'
                : isTeamBWinner
                ? 'bg-[#FF453A]/15 border-[#FF453A]/50 opacity-90'
                : activeSide === 'A'
                ? 'bg-[#2C2C2E] border-[#30D158] ring-1 ring-[#30D158]'
                : 'bg-[#2C2C2E]/70 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#30D158]">
                PAREJA A
              </span>
              {isTeamAWinner && (
                <span className="text-xs font-bold text-[#30D158] flex items-center animate-bounce">
                  🏆 GANAN
                </span>
              )}
              {isTeamBWinner && (
                <span className="text-xs font-bold text-[#FF453A] flex items-center animate-pulse">
                  😢 DERROTA
                </span>
              )}
            </div>

            <div className="text-xs font-semibold text-white truncate mt-1">
              {match.teamA.player1Name} & {match.teamA.player2Name}
            </div>

            <div className="mt-3 text-center">
              <div className={`font-mono text-5xl font-black transition-all ${
                scoreA !== null
                  ? isTeamAWinner
                    ? 'text-[#30D158] scale-105'
                    : isTeamBWinner
                    ? 'text-[#FF453A]'
                    : 'text-white'
                  : 'text-[#8E8E93]/40'
              }`}>
                {scoreA !== null ? scoreA : '-'}
              </div>
              <span className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-wider">
                Games A
              </span>
            </div>
          </div>

          {/* Team B Card */}
          <div
            onClick={() => setActiveSide('B')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ios-touch ${
              isTeamBWinner
                ? 'bg-[#30D158]/20 border-[#30D158] ring-2 ring-[#30D158]/50 shadow-[0_0_20px_rgba(48,209,88,0.25)]'
                : isTeamAWinner
                ? 'bg-[#FF453A]/15 border-[#FF453A]/50 opacity-90'
                : activeSide === 'B'
                ? 'bg-[#2C2C2E] border-[#0A84FF] ring-1 ring-[#0A84FF]'
                : 'bg-[#2C2C2E]/70 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A84FF]">
                PAREJA B
              </span>
              {isTeamBWinner && (
                <span className="text-xs font-bold text-[#30D158] flex items-center animate-bounce">
                  🏆 GANAN
                </span>
              )}
              {isTeamAWinner && (
                <span className="text-xs font-bold text-[#FF453A] flex items-center animate-pulse">
                  😢 DERROTA
                </span>
              )}
            </div>

            <div className="text-xs font-semibold text-white truncate mt-1">
              {match.teamB.player1Name} & {match.teamB.player2Name}
            </div>

            <div className="mt-3 text-center">
              <div className={`font-mono text-5xl font-black transition-all ${
                scoreB !== null
                  ? isTeamBWinner
                    ? 'text-[#30D158] scale-105'
                    : isTeamAWinner
                    ? 'text-[#FF453A]'
                    : 'text-white'
                  : 'text-[#8E8E93]/40'
              }`}>
                {scoreB !== null ? scoreB : '-'}
              </div>
              <span className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-wider">
                Games B
              </span>
            </div>
          </div>
        </div>

        {/* Big Number Selector Keypad (0 to 7) */}
        <div className="bg-[#2C2C2E] p-4 rounded-2xl border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
              Selecciona los games de{' '}
              <strong className={`ml-1 ${activeSide === 'A' ? 'text-[#30D158]' : 'text-[#0A84FF]'}`}>
                {activeSide === 'A' ? 'PAREJA A' : 'PAREJA B'}:
              </strong>
            </span>
            <span className="text-[11px] text-[#8E8E93] font-medium">Toca un número</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {numbers.map((num) => {
              const currentVal = activeSide === 'A' ? scoreA : scoreB;
              const isSelected = currentVal === num;

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (activeSide === 'A') {
                      handleSelectScoreA(num);
                    } else {
                      handleSelectScoreB(num);
                    }
                  }}
                  className={`h-14 sm:h-16 rounded-2xl font-mono text-2xl sm:text-3xl font-black transition-all transform active:scale-95 flex items-center justify-center ios-touch border ${
                    isSelected
                      ? activeSide === 'A'
                        ? 'bg-[#30D158] text-black border-[#30D158] shadow-[0_0_15px_rgba(48,209,88,0.4)] scale-105'
                        : 'bg-[#0A84FF] text-white border-[#0A84FF] shadow-[0_0_15px_rgba(10,132,255,0.4)] scale-105'
                      : 'bg-[#1C1C1E] text-white border-white/10 hover:bg-[#3A3A3C] hover:border-white/20'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tie Break Section for 3-3 */}
        {isTieBreak && (
          <div className="p-4 bg-[#FFD60A]/15 border border-[#FFD60A]/40 rounded-2xl space-y-3 animate-fade-in">
            <div className="flex items-center text-xs font-bold text-[#FFD60A]">
              <Flame className="w-4 h-4 mr-1.5" />
              Empate 3-3: Define los Puntos del Tie-Break
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <label className="text-xs text-white font-semibold block mb-1">Pts Pareja A</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={tieBreakPointsA ?? ''}
                  onChange={(e) => setTieBreakPointsA(parseInt(e.target.value) || 0)}
                  placeholder="Ej: 10"
                  className="w-full bg-[#1C1C1E] border border-white/20 rounded-xl py-2.5 px-3 text-center text-xl font-bold font-mono text-white focus:border-[#FFD60A]"
                />
              </div>
              <div>
                <label className="text-xs text-white font-semibold block mb-1">Pts Pareja B</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={tieBreakPointsB ?? ''}
                  onChange={(e) => setTieBreakPointsB(parseInt(e.target.value) || 0)}
                  placeholder="Ej: 8"
                  className="w-full bg-[#1C1C1E] border border-white/20 rounded-xl py-2.5 px-3 text-center text-xl font-bold font-mono text-white focus:border-[#FFD60A]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isBothSelected}
            className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center transition-all ios-touch ${
              isBothSelected
                ? 'bg-[#30D158] text-black shadow-lg shadow-[#30D158]/30 active:scale-95'
                : 'bg-[#2C2C2E] text-[#8E8E93] cursor-not-allowed'
            }`}
          >
            <Check className="w-5 h-5 mr-2" />
            {isBothSelected ? 'Guardar Marcador Oficial' : 'Selecciona ambos marcadores'}
          </button>
        </div>
      </div>
    </div>
  );
};
