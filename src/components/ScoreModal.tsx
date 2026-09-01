import React, { useState, useEffect } from 'react';
import { X, Check, Clock, Award, Flame, AlertCircle, Sparkles } from 'lucide-react';
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

  // Spicy preset scores with clear visual buttons for fast 1-tap entry in the dark/sweaty court
  const quickShortScores = [
    { label: '7 - 0 (Zapatero / Paliza)', a: 7, b: 0, spice: '💀 +0.004 desempate' },
    { label: '0 - 7 (Humillación Total)', a: 0, b: 7, spice: '😭 -0.004 desempate' },
    { label: '6 - 1 (Paseo Militar)', a: 6, b: 1, spice: '🔥 +0.003 desempate' },
    { label: '1 - 6 (A pagar las chelas)', a: 1, b: 6, spice: '🍺 -0.003 desempate' },
    { label: '5 - 2 (Victoria Sólida)', a: 5, b: 2, spice: '⚡ +0.002 desempate' },
    { label: '2 - 5 (Se peleó pero no dio)', a: 2, b: 5, spice: '📉 -0.003 desempate' },
    { label: '4 - 3 (De milagro en Tie-break)', a: 4, b: 3, spice: '😅 0.000 desempate' },
    { label: '3 - 4 (Por la mínima)', a: 3, b: 4, spice: '💔 -0.002 desempate' },
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

  const marginBonusA = calculateMarginBonus(scoreA, scoreB, isCutoff);
  const marginBonusB = calculateMarginBonus(scoreB, scoreA, isCutoff);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#101624] border-2 border-slate-700 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 text-white my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                {match.courtName || `Cancha ${match.courtNumber}`}
              </span>
              <span className="text-xs font-bold text-slate-300">
                {isShortGame ? `Juego Corto ${match.roundNumber}` : 'Final del Día'}
              </span>
            </div>
            <h3 className="text-xl font-extrabold font-display text-white mt-1">
              Cargar Marcador en Vivo
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Teams Matchup & Ultra-Large Score Inputs */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          {/* Team A - EQUAL FONT SIZES */}
          <div className="space-y-3 text-center">
            <div className="text-xs font-black text-emerald-400 uppercase tracking-wider">PAREJA A</div>
            <div className="text-sm sm:text-base font-bold text-white min-h-[44px] flex flex-col justify-center leading-tight">
              <span>{match.teamA.player1Name}</span>
              <span className="text-slate-300">& {match.teamA.player2Name}</span>
            </div>

            {/* Stepper with Huge Buttons (56px) for mobile fingers */}
            <div className="flex items-center justify-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-800 active:bg-slate-700 font-black text-slate-200 text-2xl border border-slate-700 flex items-center justify-center"
              >
                -
              </button>
              <span className="text-4xl sm:text-5xl font-black font-display text-white w-14 text-center">
                {scoreA}
              </span>
              <button
                type="button"
                onClick={() => setScoreA(scoreA + 1)}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500 active:bg-emerald-400 font-black text-black text-2xl shadow-neon flex items-center justify-center"
              >
                +
              </button>
            </div>

            {isShortGame && (
              <div className="text-xs font-mono font-bold pt-1">
                Desempate:{' '}
                <span className={marginBonusA >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {marginBonusA >= 0 ? `+${marginBonusA.toFixed(3)}` : marginBonusA.toFixed(3)}
                </span>
              </div>
            )}
          </div>

          {/* Team B - EQUAL FONT SIZES */}
          <div className="space-y-3 text-center border-l border-slate-800 pl-3 sm:pl-4">
            <div className="text-xs font-black text-blue-400 uppercase tracking-wider">PAREJA B</div>
            <div className="text-sm sm:text-base font-bold text-white min-h-[44px] flex flex-col justify-center leading-tight">
              <span>{match.teamB.player1Name}</span>
              <span className="text-slate-300">& {match.teamB.player2Name}</span>
            </div>

            {/* Stepper with Huge Buttons (56px) for mobile fingers */}
            <div className="flex items-center justify-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-800 active:bg-slate-700 font-black text-slate-200 text-2xl border border-slate-700 flex items-center justify-center"
              >
                -
              </button>
              <span className="text-4xl sm:text-5xl font-black font-display text-white w-14 text-center">
                {scoreB}
              </span>
              <button
                type="button"
                onClick={() => setScoreB(scoreB + 1)}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 active:bg-blue-500 font-black text-white text-2xl shadow-blue-glow flex items-center justify-center"
              >
                +
              </button>
            </div>

            {isShortGame && (
              <div className="text-xs font-mono font-bold pt-1">
                Desempate:{' '}
                <span className={marginBonusB >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {marginBonusB >= 0 ? `+${marginBonusB.toFixed(3)}` : marginBonusB.toFixed(3)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tie Break Section (if 3-3 in short games) */}
        {isTieBreak && (
          <div className="p-4 bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl space-y-2">
            <div className="flex items-center text-sm font-black text-amber-300">
              <Flame className="w-5 h-5 mr-1.5 text-amber-400" />
              Empate 3-3: Tie-Break a 10 puntos máx.
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Pts Tie-Break Pareja A</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={tieBreakPointsA ?? ''}
                  onChange={(e) => setTieBreakPointsA(parseInt(e.target.value) || 0)}
                  placeholder="Ej: 10"
                  className="w-full bg-slate-950 border-2 border-amber-500/50 rounded-xl py-2.5 px-3 text-center text-xl font-black text-amber-300"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Pts Tie-Break Pareja B</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={tieBreakPointsB ?? ''}
                  onChange={(e) => setTieBreakPointsB(parseInt(e.target.value) || 0)}
                  placeholder="Ej: 8"
                  className="w-full bg-slate-950 border-2 border-amber-500/50 rounded-xl py-2.5 px-3 text-center text-xl font-black text-amber-300"
                />
              </div>
            </div>
          </div>
        )}

        {/* 1-Tap Quick Preset Selectors for Tired Players */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">
            ⚡ Marcadores Rápidos (Toca 1 solo botón):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {isShortGame
              ? quickShortScores.map((qs) => (
                  <button
                    key={qs.label}
                    type="button"
                    onClick={() => handleApplyPreset(qs.a, qs.b)}
                    className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all border ${
                      scoreA === qs.a && scoreB === qs.b && !isCutoff
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-neon'
                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-extrabold text-sm">{qs.a} - {qs.b}</div>
                    <div className="text-[10px] opacity-80 leading-tight">{qs.spice}</div>
                  </button>
                ))
              : quickFinalScores.map((qs) => (
                  <button
                    key={qs.label}
                    type="button"
                    onClick={() => handleApplyPreset(qs.a, qs.b)}
                    className={`py-3 px-2 rounded-xl text-sm font-black font-mono transition-all border ${
                      scoreA === qs.a && scoreB === qs.b && !isCutoff
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-neon'
                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {qs.label}
                  </button>
                ))}
          </div>
        </div>

        {/* Cut-off checkbox */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center space-x-3">
          <input
            type="checkbox"
            id="isCutoff"
            checked={isCutoff}
            onChange={(e) => setIsCutoff(e.target.checked)}
            className="w-5 h-5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500"
          />
          <label htmlFor="isCutoff" className="text-xs text-slate-300 font-bold flex items-center cursor-pointer">
            <Clock className="w-4 h-4 mr-1.5 text-amber-400 flex-shrink-0" />
            Corte por tiempo / partido incompleto (gana el que lleva más games)
          </label>
        </div>

        {/* Giant Action Buttons for Mobile */}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="w-2/3 py-4 rounded-2xl bg-emerald-500 active:bg-emerald-400 text-black font-black text-base shadow-neon flex items-center justify-center"
          >
            <Check className="w-5 h-5 mr-2" />
            GUARDAR RESULTADO
          </button>
        </div>
      </div>
    </div>
  );
};
