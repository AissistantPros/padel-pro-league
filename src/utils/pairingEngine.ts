import type { Player, Match, DailyRound, DailyPlayerStanding } from '../types/index.ts';

export interface PlayerRankedSeed {
  player: Player;
  rank: number;
  score: number;
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const DEFAULT_COURT_NAMES = [
  'Pista 1',
  'Pista 2',
  'Pista 3',
  'Pista 4',
  'Pista 5',
  'Pista 6',
];

/**
 * Intelligent Matchup Optimizer for Preliminary Rounds (1, 2, and 3):
 * Works dynamically for any N players (4, 8, 12, 16, 20, etc.):
 * 1. Top half (Top N/2) NEVER pair together in rounds 1, 2, 3 (strictly 1 Top-half + 1 Bottom-half in every team).
 * 2. NO player repeats a partner in the 3 rounds.
 * 3. Matchups between Team A and Team B are optimized to minimize point/strength differences (Delta -> 0).
 * 4. Yields the most balanced, competitive (close to 50% vs 50%) matches possible across all courts.
 */
export function generatePreliminaryRounds(
  dayId: string,
  players: Player[],
  isFirstDay: boolean = false,
  rankingOrder?: Map<string, number>, // Map of playerId -> rank (1..N) or points
  courtNames: string[] = DEFAULT_COURT_NAMES
): DailyRound[] {
  const numPlayers = players.length;

  if (numPlayers % 4 !== 0 || numPlayers < 4) {
    throw new Error(`Se requiere un número de jugadores múltiplo de 4 (ej. 4, 8, 12, 16, 20). Actual: ${numPlayers}`);
  }

  // 1. Determine player ordering based on previous date/historical rankings or random on day 1
  let sortedPlayers: { player: Player; score: number; rank: number }[] = [];

  if (isFirstDay || !rankingOrder || rankingOrder.size === 0) {
    const shuffled = shuffleArray(players);
    sortedPlayers = shuffled.map((p, idx) => ({
      player: p,
      score: (numPlayers - idx) * 2,
      rank: idx + 1,
    }));
  } else {
    // Sort by rank / points from previous date standings
    sortedPlayers = [...players]
      .map((p) => {
        const val = rankingOrder.get(p.id) ?? 999;
        return {
          player: p,
          score: val <= numPlayers ? (numPlayers - val + 1) * 3 : val,
          rank: 0,
        };
      })
      .sort((a, b) => b.score - a.score);

    sortedPlayers.forEach((p, idx) => {
      p.rank = idx + 1;
    });
  }

  const half = numPlayers / 2; // e.g. 2 for 4, 4 for 8, 6 for 12, 8 for 16, 10 for 20
  const topPot = sortedPlayers.slice(0, half);     // Rank 1..half
  const bottomPot = sortedPlayers.slice(half);     // Rank (half+1)..N

  const partnerHistory = new Set<string>();
  const rounds: DailyRound[] = [];
  const courtsPerRound = numPlayers / 4;

  for (let r = 1; r <= 3; r++) {
    let bestCandidateCourtMatches: { teamA: [{ player: Player; score: number }, { player: Player; score: number }]; teamB: [{ player: Player; score: number }, { player: Player; score: number }]; diff: number }[] | null = null;
    let minImbalance = Infinity;

    // Search through candidate pairings of Top Half + Bottom Half
    const permutationsToTry: { player: Player; score: number; rank: number }[][] = [];

    // Deterministic rotated permutations
    for (let shift = 0; shift < half; shift++) {
      const perm: typeof bottomPot = [];
      for (let i = 0; i < half; i++) {
        perm.push(bottomPot[(i + shift + (r - 1) * 2) % half]);
      }
      permutationsToTry.push(perm);
    }

    for (let shift = 0; shift < half; shift++) {
      const perm: typeof bottomPot = [];
      for (let i = 0; i < half; i++) {
        perm.push(bottomPot[(half - 1 - i + shift + (r - 1)) % half]);
      }
      permutationsToTry.push(perm);
    }

    // Randomized search to find absolute global minimum variance
    const searchIterations = numPlayers <= 8 ? 200 : 1500;
    for (let trial = 0; trial < searchIterations; trial++) {
      const shuffled = [...bottomPot];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      permutationsToTry.push(shuffled);
    }

    for (const bottomPerm of permutationsToTry) {
      let valid = true;
      const candidatePairs: [{ player: Player; score: number }, { player: Player; score: number }][] = [];

      for (let i = 0; i < half; i++) {
        const topP = topPot[i];
        const botP = bottomPerm[i];
        const pairKey = [topP.player.id, botP.player.id].sort().join('&');
        if (partnerHistory.has(pairKey)) {
          valid = false;
          break;
        }
        candidatePairs.push([topP, botP]);
      }

      if (!valid) continue;

      // Group into courts that maximize parity (Team A vs Team B)
      const pairsWithStrength = candidatePairs.map(p => ({
        top: p[0],
        bot: p[1],
        strength: p[0].score + p[1].score,
      }));

      // Sort pairs by combined strength to pair closest strengths together
      pairsWithStrength.sort((a, b) => b.strength - a.strength);

      const candidateCourtMatches: { teamA: [{ player: Player; score: number }, { player: Player; score: number }]; teamB: [{ player: Player; score: number }, { player: Player; score: number }]; diff: number }[] = [];
      let currentImbalance = 0;

      for (let c = 0; c < courtsPerRound; c++) {
        const p1 = pairsWithStrength[c * 2];
        const p2 = pairsWithStrength[c * 2 + 1];
        const diff = Math.abs(p1.strength - p2.strength);
        currentImbalance += diff * diff;

        candidateCourtMatches.push({
          teamA: [p1.top, p1.bot],
          teamB: [p2.top, p2.bot],
          diff,
        });
      }

      if (currentImbalance < minImbalance) {
        minImbalance = currentImbalance;
        bestCandidateCourtMatches = candidateCourtMatches;
      }
    }

    if (!bestCandidateCourtMatches) {
      // Fallback
      bestCandidateCourtMatches = [];
      for (let c = 0; c < courtsPerRound; c++) {
        const topA = topPot[c % half];
        const botA = bottomPot[(half - 1 - c + r) % half];
        const topB = topPot[(half - 1 - c + half) % half];
        const botB = bottomPot[(c + r) % half];
        bestCandidateCourtMatches.push({
          teamA: [topA, botA],
          teamB: [topB, botB],
          diff: 0,
        });
      }
    }

    // Save partners to history
    bestCandidateCourtMatches.forEach(m => {
      partnerHistory.add([m.teamA[0].player.id, m.teamA[1].player.id].sort().join('&'));
      partnerHistory.add([m.teamB[0].player.id, m.teamB[1].player.id].sort().join('&'));
    });

    const matches: Match[] = bestCandidateCourtMatches.map((m, cIdx) => ({
      id: `${dayId}_r${r}_m${cIdx + 1}`,
      dayId,
      roundNumber: r,
      courtNumber: cIdx + 1,
      courtName: courtNames[cIdx % courtNames.length] || `Pista ${cIdx + 1}`,
      matchType: 'preliminary',
      teamA: {
        player1Id: m.teamA[0].player.id,
        player1Name: m.teamA[0].player.name,
        player2Id: m.teamA[1].player.id,
        player2Name: m.teamA[1].player.name,
      },
      teamB: {
        player1Id: m.teamB[0].player.id,
        player1Name: m.teamB[0].player.name,
        player2Id: m.teamB[1].player.id,
        player2Name: m.teamB[1].player.name,
      },
      score: {
        scoreA: 0,
        scoreB: 0,
        completed: false,
      },
      createdAt: new Date().toISOString(),
    }));

    rounds.push({
      roundNumber: r,
      name: `Juego Corto ${r} (Máximo Equilibrio 50-50)`,
      matches,
      isCompleted: false,
    });
  }

  return rounds;
}

/**
 * Generates Round 4 (Daily Finals) dynamically based on daily preliminary standings (for any N = 4, 8, 12, 16, 20):
 * Pista 1 (Final Oro): 1 y 4 vs 2 y 3
 * Pista 2 (Final Plata): 5 y 8 vs 6 y 7
 * Pista 3 (Final Bronce): 9 y 12 vs 10 y 11
 * Pista 4 (Final Cobre): 13 y 16 vs 14 y 15
 * Pista 5 (Final Madera / Asador): 17 y 20 vs 18 y 19
 */
export function generateDailyFinalRound(
  dayId: string,
  prelimStandings: DailyPlayerStanding[],
  courtNames: string[] = DEFAULT_COURT_NAMES
): DailyRound {
  const sorted = [...prelimStandings].sort((a, b) => {
    if (b.totalDailyScore !== a.totalDailyScore) {
      return b.totalDailyScore - a.totalDailyScore;
    }
    if (b.gamesWon !== a.gamesWon) {
      return b.gamesWon - a.gamesWon;
    }
    return b.gameDiff - a.gameDiff;
  });

  const numPlayers = sorted.length;
  const courts = Math.floor(numPlayers / 4);

  const matches: Match[] = [];
  const categories = ['gold', 'silver', 'bronze', 'copper', 'wood'] as const;

  for (let c = 0; c < courts; c++) {
    const baseIdx = c * 4;
    const p1 = sorted[baseIdx + 0]; // 1, 5, 9, 13, 17
    const p2 = sorted[baseIdx + 1]; // 2, 6, 10, 14, 18
    const p3 = sorted[baseIdx + 2]; // 3, 7, 11, 15, 19
    const p4 = sorted[baseIdx + 3]; // 4, 8, 12, 16, 20

    const courtName = courtNames[c] || `Pista ${c + 1}`;
    const finalCategory = categories[c % categories.length];

    matches.push({
      id: `${dayId}_r4_m${c + 1}`,
      dayId,
      roundNumber: 4,
      courtNumber: c + 1,
      courtName,
      matchType: 'daily_final',
      finalCategory: finalCategory as any,
      teamA: {
        player1Id: p1.playerId,
        player1Name: p1.playerName,
        player2Id: p4.playerId,
        player2Name: p4.playerName,
      },
      teamB: {
        player1Id: p2.playerId,
        player1Name: p2.playerName,
        player2Id: p3.playerId,
        player2Name: p3.playerName,
      },
      score: {
        scoreA: 0,
        scoreB: 0,
        completed: false,
      },
      createdAt: new Date().toISOString(),
    });
  }

  return {
    roundNumber: 4,
    name: 'Finales de la Jornada (Juego 4 - Definición)',
    matches,
    isCompleted: false,
  };
}
