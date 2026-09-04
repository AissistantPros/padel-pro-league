import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Flame, Trophy, Frown, Sparkles, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Match, MatchScore, Player, PlayerIntelligenceStats } from '../types/index.ts';

interface ScoreModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveScore: (matchId: string, score: MatchScore) => void;
  players?: Player[];
  statsList?: PlayerIntelligenceStats[];
}

export const ScoreModal: React.FC<ScoreModalProps> = ({
  match,
  isOpen,
  onClose,
  onSaveScore,
  players = [],
  statsList = [],
}) => {
  if (!isOpen || !match) return null;

  const isShortGame = match.matchType === 'preliminary';
  const [scoreA, setScoreA] = useState<number | null>(match.score?.completed ? match.score.scoreA : null);
  const [scoreB, setScoreB] = useState<number | null>(match.score?.completed ? match.score.scoreB : null);
  const [activeSide, setActiveSide] = useState<'A' | 'B'>('A');
  const [tieBreakPointsA, setTieBreakPointsA] = useState<number | undefined>(match.score?.tieBreakPointsA);
  const [tieBreakPointsB, setTieBreakPointsB] = useState<number | undefined>(match.score?.tieBreakPointsB);
  const [isClosing, setIsClosing] = useState<boolean>(false);

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

  const triggerLocalizedCelebration = (side: 'A' | 'B') => {
    // Localized confetti explosion originating exactly over the winning pair's card
    const yPos = side === 'A' ? 0.30 : 0.70;
    confetti({
      particleCount: 100,
      spread: 60,
      origin: { x: 0.5, y: yPos },
      colors: ['#30D158', '#FFD60A', '#FFFFFF', '#64D2FF'],
      disableForReducedMotion: true,
    });
  };

  const handleSelectScore = (val: number) => {
    if (activeSide === 'A') {
      setScoreA(val);
      if (scoreB === null) {
        setActiveSide('B');
      } else {
        if (val > scoreB) triggerLocalizedCelebration('A');
        else if (scoreB > val) triggerLocalizedCelebration('B');
      }
    } else {
      setScoreB(val);
      if (scoreA !== null) {
        if (scoreA > val) triggerLocalizedCelebration('A');
        else if (val > scoreA) triggerLocalizedCelebration('B');
      }
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
    }, 200);
  };

  // Helper to resolve player display info: BIG Nickname, Full Name, Avatar
  const getPlayerDisplay = (id: string, fallbackName: string) => {
    const pl = players.find(p => p.id === id || p.name === fallbackName);
    const sl = statsList.find(s => s.playerId === id || s.playerName === fallbackName);

    const fullName = pl?.name || sl?.playerName || fallbackName;
    const nickname = pl?.nickname?.trim() || sl?.nickname?.trim() || fullName.split(' ')[0] || fullName;
    const avatar = pl?.avatar || sl?.avatar;

    return { fullName, nickname, avatar };
  };

  const pA1 = getPlayerDisplay(match.teamA.player1Id, match.teamA.player1Name);
  const pA2 = getPlayerDisplay(match.teamA.player2Id, match.teamA.player2Name);
  const pB1 = getPlayerDisplay(match.teamB.player1Id, match.teamB.player1Name);
  const pB2 = getPlayerDisplay(match.teamB.player2Id, match.teamB.player2Name);

  const numbers = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div className={`fixed inset-0 z-50 bg-[#000000] text-white flex flex-col justify-between overflow-y-auto select-none transition-opacity duration-200 ${
      isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100 animate-fade-in'
    }`}>
      {/* 1. Fullscreen Top Navigation Bar */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <button
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-full bg-[#1C1C1E] text-[#8E8E93] hover:text-white text-xs font-semibold border border-white/10 ios-touch"
        >
          Cancelar
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center space-x-1.5">
            <span className="text-xs font-bold text-[#FFD60A]">
              🎾 {match.courtName || `Cancha ${match.courtNumber}`}
            </span>
          </div>
          <h2 className="text-sm font-bold text-white">
            {isShortGame ? `Ronda ${match.roundNumber} Preliminar` : 'Final de Posición'}
          </h2>
        </div>

        <button
          onClick={handleSave}
          disabled={!isBothSelected}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ios-touch ${
            isBothSelected
              ? 'bg-[#30D158] text-black shadow-md shadow-[#30D158]/30'
              : 'bg-[#2C2C2E] text-[#8E8E93] opacity-40 cursor-not-allowed'
          }`}
        >
          Guardar
        </button>
      </div>

      {/* 2. Main Content Area */}
      <div className="max-w-lg w-full mx-auto px-4 sm:px-6 py-4 space-y-4 flex-1 flex flex-col justify-center">
        {/* Instruction Header */}
        <div className="text-center">
          <p className="text-xs font-medium text-[#8E8E93]">
            Toca una pareja para seleccionarla e ingresa sus games con los botones grandes:
          </p>
        </div>

        {/* ======================================================== */}
        {/* PAREJA A CARD (ARRIBA)                                   */}
        {/* ======================================================== */}
        <div
          onClick={() => setActiveSide('A')}
          className={`p-4 sm:p-5 rounded-3xl border transition-all duration-300 cursor-pointer relative overflow-hidden ios-touch ${
            isTeamAWinner
              ? 'bg-[#30D158]/20 border-[#30D158] ring-4 ring-[#30D158]/40 shadow-[0_0_35px_rgba(48,209,88,0.5)]'
              : isTeamBWinner
              ? 'bg-[#FF453A]/15 border-[#FF453A]/40 opacity-90'
              : activeSide === 'A'
              ? 'bg-[#1C1C1E] border-[#30D158] ring-4 ring-[#30D158]/40 shadow-[0_0_30px_rgba(48,209,88,0.4)]'
              : 'bg-[#1C1C1E]/80 border-white/10 hover:border-white/20'
          }`}
        >
          {/* Pair Status / Selection Tag */}
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#30D158]">
                PAREJA A
              </span>
              {activeSide === 'A' && !isBothSelected && (
                <span className="text-[10px] font-bold text-black bg-[#30D158] px-2 py-0.5 rounded-full animate-pulse">
                  SELECCIONADA
                </span>
              )}
            </div>

            {isTeamAWinner && (
              <span className="text-xs font-extrabold text-[#30D158] flex items-center animate-bounce">
                <Trophy className="w-3.5 h-3.5 mr-1 text-[#FFD60A]" /> ¡GANADORES! 🎉
              </span>
            )}

            {isTeamBWinner && (
              <span className="text-xs font-bold text-[#FF453A] flex items-center">
                😢 DERROTA
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-3">
            {/* Players List with Big Nicknames & Full Names */}
            <div className="space-y-3 min-w-0 flex-1">
              {/* Player 1 */}
              <div className="flex items-center space-x-3">
                {pA1.avatar ? (
                  <img src={pA1.avatar} alt={pA1.fullName} className="w-12 h-12 rounded-full object-cover border-2 border-white/15 bg-[#2C2C2E] flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#2C2C2E] text-[#30D158] font-black text-sm flex items-center justify-center border-2 border-white/10 flex-shrink-0">
                    {pA1.fullName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight truncate">
                    {pA1.nickname}
                  </div>
                  <div className="text-xs text-[#8E8E93] truncate font-medium mt-0.5">
                    {pA1.fullName}
                  </div>
                </div>
              </div>

              {/* Player 2 */}
              <div className="flex items-center space-x-3">
                {pA2.avatar ? (
                  <img src={pA2.avatar} alt={pA2.fullName} className="w-12 h-12 rounded-full object-cover border-2 border-white/15 bg-[#2C2C2E] flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#2C2C2E] text-[#30D158] font-black text-sm flex items-center justify-center border-2 border-white/10 flex-shrink-0">
                    {pA2.fullName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight truncate">
                    {pA2.nickname}
                  </div>
                  <div className="text-xs text-[#8E8E93] truncate font-medium mt-0.5">
                    {pA2.fullName}
                  </div>
                </div>
              </div>
            </div>

            {/* Big Score Display Box (Right Column spanning full height) */}
            <div className="text-center pl-3 pr-1 flex-shrink-0 border-l border-white/10 flex flex-col items-center justify-center min-w-[75px]">
              <div className={`font-mono text-5xl sm:text-6xl font-black transition-all ${
                scoreA !== null
                  ? isTeamAWinner
                    ? 'text-[#30D158] scale-110'
                    : isTeamBWinner
                    ? 'text-[#FF453A]'
                    : 'text-white'
                  : 'text-[#8E8E93]/40'
              }`}>
                {scoreA !== null ? scoreA : '0'}
              </div>
              <span className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-wider mt-1">
                GAMES A
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BIG NUMERIC KEYPAD (0 to 7)                              */}
        {/* ======================================================== */}
        <div className="bg-[#1C1C1E] p-4 rounded-3xl border border-white/10 space-y-2.5 shadow-xl">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center">
              Games para{' '}
              <strong className={`ml-1.5 px-2 py-0.5 rounded-lg text-black font-black ${
                activeSide === 'A' ? 'bg-[#30D158]' : 'bg-[#0A84FF] text-white'
              }`}>
                {activeSide === 'A' ? 'PAREJA A' : 'PAREJA B'}
              </strong>
            </span>
            <span className="text-[11px] text-[#8E8E93] font-medium">Toca para asignar</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {numbers.map((num) => {
              const currentVal = activeSide === 'A' ? scoreA : scoreB;
              const isSelected = currentVal === num;

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleSelectScore(num)}
                  className={`h-14 sm:h-16 rounded-2xl font-mono text-2xl sm:text-3xl font-black transition-all transform active:scale-95 flex items-center justify-center ios-touch border ${
                    isSelected
                      ? activeSide === 'A'
                        ? 'bg-[#30D158] text-black border-[#30D158] shadow-[0_0_15px_rgba(48,209,88,0.5)] scale-105'
                        : 'bg-[#0A84FF] text-white border-[#0A84FF] shadow-[0_0_15px_rgba(10,132,255,0.5)] scale-105'
                      : 'bg-[#2C2C2E] text-white border-white/10 hover:bg-[#3A3A3C] hover:border-white/20'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* PAREJA B CARD (ABAJO)                                    */}
        {/* ======================================================== */}
        <div
          onClick={() => setActiveSide('B')}
          className={`p-4 sm:p-5 rounded-3xl border transition-all duration-300 cursor-pointer relative overflow-hidden ios-touch ${
            isTeamBWinner
              ? 'bg-[#30D158]/20 border-[#30D158] ring-4 ring-[#30D158]/40 shadow-[0_0_35px_rgba(48,209,88,0.5)]'
              : isTeamAWinner
              ? 'bg-[#FF453A]/15 border-[#FF453A]/40 opacity-90'
              : activeSide === 'B'
              ? 'bg-[#1C1C1E] border-[#0A84FF] ring-4 ring-[#0A84FF]/40 shadow-[0_0_30px_rgba(10,132,255,0.4)]'
              : 'bg-[#1C1C1E]/80 border-white/10 hover:border-white/20'
          }`}
        >
          {/* Pair Status / Selection Tag */}
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#0A84FF]">
                PAREJA B
              </span>
              {activeSide === 'B' && !isBothSelected && (
                <span className="text-[10px] font-bold text-white bg-[#0A84FF] px-2 py-0.5 rounded-full animate-pulse">
                  SELECCIONADA
                </span>
              )}
            </div>

            {isTeamBWinner && (
              <span className="text-xs font-extrabold text-[#30D158] flex items-center animate-bounce">
                <Trophy className="w-3.5 h-3.5 mr-1 text-[#FFD60A]" /> ¡GANADORES! 🎉
              </span>
            )}

            {isTeamAWinner && (
              <span className="text-xs font-bold text-[#FF453A] flex items-center">
                😢 DERROTA
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-3">
            {/* Players List with Big Nicknames & Full Names */}
            <div className="space-y-3 min-w-0 flex-1">
              {/* Player 1 */}
              <div className="flex items-center space-x-3">
                {pB1.avatar ? (
                  <img src={pB1.avatar} alt={pB1.fullName} className="w-12 h-12 rounded-full object-cover border-2 border-white/15 bg-[#2C2C2E] flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#2C2C2E] text-[#0A84FF] font-black text-sm flex items-center justify-center border-2 border-white/10 flex-shrink-0">
                    {pB1.fullName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight truncate">
                    {pB1.nickname}
                  </div>
                  <div className="text-xs text-[#8E8E93] truncate font-medium mt-0.5">
                    {pB1.fullName}
                  </div>
                </div>
              </div>

              {/* Player 2 */}
              <div className="flex items-center space-x-3">
                {pB2.avatar ? (
                  <img src={pB2.avatar} alt={pB2.fullName} className="w-12 h-12 rounded-full object-cover border-2 border-white/15 bg-[#2C2C2E] flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#2C2C2E] text-[#0A84FF] font-black text-sm flex items-center justify-center border-2 border-white/10 flex-shrink-0">
                    {pB2.fullName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight truncate">
                    {pB2.nickname}
                  </div>
                  <div className="text-xs text-[#8E8E93] truncate font-medium mt-0.5">
                    {pB2.fullName}
                  </div>
                </div>
              </div>
            </div>

            {/* Big Score Display Box (Right Column) */}
            <div className="text-center pl-3 pr-1 flex-shrink-0 border-l border-white/10 flex flex-col items-center justify-center min-w-[75px]">
              <div className={`font-mono text-5xl sm:text-6xl font-black transition-all ${
                scoreB !== null
                  ? isTeamBWinner
                    ? 'text-[#30D158] scale-110'
                    : isTeamAWinner
                    ? 'text-[#FF453A]'
                    : 'text-white'
                  : 'text-[#8E8E93]/40'
              }`}>
                {scoreB !== null ? scoreB : '0'}
              </div>
              <span className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-wider mt-1">
                GAMES B
              </span>
            </div>
          </div>
        </div>

        {/* Tie-Break (If 3-3) */}
        {isTieBreak && (
          <div className="p-4 bg-[#FFD60A]/15 border border-[#FFD60A]/40 rounded-3xl space-y-2.5 animate-fade-in">
            <div className="flex items-center text-xs font-bold text-[#FFD60A]">
              <Flame className="w-4 h-4 mr-1.5" />
              Empate 3-3: Define los Puntos del Tie-Break
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <label className="text-xs text-white font-semibold block mb-1">Tie-Break Pareja A</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={tieBreakPointsA ?? ''}
                  onChange={(e) => setTieBreakPointsA(parseInt(e.target.value) || 0)}
                  placeholder="Ej: 10"
                  className="w-full bg-[#1C1C1E] border border-white/20 rounded-2xl py-2.5 px-3 text-center text-xl font-bold font-mono text-white focus:border-[#FFD60A]"
                />
              </div>
              <div>
                <label className="text-xs text-white font-semibold block mb-1">Tie-Break Pareja B</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={tieBreakPointsB ?? ''}
                  onChange={(e) => setTieBreakPointsB(parseInt(e.target.value) || 0)}
                  placeholder="Ej: 8"
                  className="w-full bg-[#1C1C1E] border border-white/20 rounded-2xl py-2.5 px-3 text-center text-xl font-bold font-mono text-white focus:border-[#FFD60A]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Action Bar */}
      <div className="sticky bottom-0 z-20 bg-black/95 backdrop-blur-xl border-t border-white/10 px-4 sm:px-6 py-4">
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isBothSelected}
            className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center transition-all ios-touch ${
              isBothSelected
                ? 'bg-[#30D158] text-black shadow-lg shadow-[#30D158]/30 active:scale-95'
                : 'bg-[#2C2C2E] text-[#8E8E93] cursor-not-allowed'
            }`}
          >
            <Check className="w-5 h-5 mr-2" />
            {isBothSelected ? 'Guardar Marcador Oficial' : 'Selecciona ambos marcadores (0 al 7)'}
          </button>
        </div>
      </div>
    </div>
  );
};

