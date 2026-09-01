import type { MatchScore, DailyPlayerStanding } from '../types/index.ts';

/**
 * Calculates the exact margin bonus/penalty decimal for a short game result:
 * Win 7-0: +0.004 | Loss 7-0: -0.004
 * Win 6-1: +0.003 | Loss 6-1: -0.003
 * Win 5-2: +0.002 | Loss 5-2: -0.003
 * Win 4-3: +0.000 | Loss 4-3: -0.002
 * Handles early cut-off games (e.g. 3-1, 4-2) by proportional mapping
 */
export function calculateMarginBonus(myGames: number, oppGames: number, isCutoff: boolean = false): number {
  if (myGames > oppGames) {
    // Win
    if (oppGames === 0) return 0.004; // 7-0 (or cutoff with 0)
    if (oppGames === 1) return 0.003; // 6-1
    if (oppGames === 2) return 0.002; // 5-2
    return 0.000; // 4-3 or close win
  } else if (myGames < oppGames) {
    // Loss
    if (myGames === 0) return -0.004; // 0-7
    if (myGames === 1) return -0.003; // 1-6
    if (myGames === 2) return -0.003; // 2-5
    return -0.002; // 3-4 or close loss
  }
  return 0.000; // Draw (if cutoff tied e.g. 2-2)
}

/**
 * Calculates the bonus/penalty for the preliminary 3-match record:
 * 3 Wins (3-0): +0.003
 * 2 Wins (2-1): +0.002
 * 1 Win  (1-2): +0.001
 * 0 Wins (0-3): -0.003
 */
export function calculateRoundRecordBonus(wins: number, totalPlayed: number): number {
  if (totalPlayed === 0) return 0;
  if (wins === 3) return 0.003;
  if (wins === 2) return 0.002;
  if (wins === 1) return 0.001;
  if (wins === 0) return -0.003;
  return 0;
}

/**
 * Daily Final bonuses added to the player's total cumulative score:
 * - Won final match: +0.001
 * - Clean sweep (won all preliminary matches + final match): +0.001 extra
 */
export function calculateFinalBonuses(wonFinal: boolean, totalDailyWins: number, totalDailyMatches: number): {
  finalMatchBonus: number;
  cleanSweepBonus: number;
} {
  const finalMatchBonus = wonFinal ? 0.001 : 0.000;
  const cleanSweepBonus = (wonFinal && totalDailyWins === totalDailyMatches && totalDailyMatches >= 4) ? 0.001 : 0.000;
  return { finalMatchBonus, cleanSweepBonus };
}

/**
 * High-precision rounding to 6 decimal places to avoid floating point math anomalies
 */
export function roundDecimal(num: number): number {
  return Math.round((num + Number.EPSILON) * 1000000) / 1000000;
}

/**
 * Formats a score with games and decimals for clear presentation
 * e.g. "18.007" (18 games + 0.007 decimal tie-breakers)
 */
export function formatScoreDisplay(score: number): string {
  const parts = score.toFixed(4).split('.');
  const base = parts[0];
  const decimals = parts[1];
  if (decimals === '0000') return base;
  return `${base}.${decimals}`;
}
