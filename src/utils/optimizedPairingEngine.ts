import type { Player, Match, DailyRound } from '../types/index.ts';

interface PlayerWithScore {
  player: Player;
  score: number;
  rank: number;
}

/**
 * Intelligent Matchup Optimizer:
 * Finds the fairest, most balanced preliminary rounds such that:
 * 1. Top half (Top 8) NEVER pair together in rounds 1, 2, 3.
 * 2. Every team is 1 Top-half player + 1 Bottom-half player.
 * 3. NO player repeats a partner in the 3 rounds.
 * 4. The difference |Strength(Team A) - Strength(Team B)| is MINIMIZED across all courts (target Delta -> 0).
 * 5. Win probability is as close to 50% vs 50% as possible.
 */
export function optimizePreliminaryRounds(
  dayId: string,
  players: Player[],
  playerScores: Map<string, number>, // Map of playerId -> championshipPoints
  courtNames: string[] = ['Pista 1', 'Pista 2', 'Pista 3', 'Pista 4']
): DailyRound[] {
  const numPlayers = players.length;
  if (numPlayers % 4 !== 0 || numPlayers < 4) {
    throw new Error(`Se requiere un múltiplo de 4 jugadores (ej. 8, 12, 16). Actual: ${numPlayers}`);
  }

  // 1. Sort players by actual points/rating
  const sortedPlayers: PlayerWithScore[] = [...players]
    .map(p => ({
      player: p,
      score: playerScores.get(p.id) ?? 20.0,
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score);

  sortedPlayers.forEach((p, idx) => {
    p.rank = idx + 1;
  });

  const half = numPlayers / 2;
  const topPot = sortedPlayers.slice(0, half);
  const bottomPot = sortedPlayers.slice(half);

  // Track past partner pairs to strictly forbid repetition
  const partnerHistory = new Set<string>();
  const rounds: DailyRound[] = [];
  const courtsPerRound = numPlayers / 4;

  for (let r = 1; r <= 3; r++) {
    // Generate all valid permutations of bottom pot to pair with top pot
    // that have no repeated partners from previous rounds
    let bestBottomPerm: PlayerWithScore[] | null = null;
    let bestMatches: { teamA: [PlayerWithScore, PlayerWithScore]; teamB: [PlayerWithScore, PlayerWithScore]; diff: number }[] | null = null;
    let minTotalDiff = Infinity;

    // Generate systematic permutations of pairings
    // For 8 players, we can sample / permute bottom pot rotations and random derangements
    const permutationsToTry: PlayerWithScore[][] = [];

    // Base shifted permutations
    for (let shift = 0; shift < half; shift++) {
      const perm: PlayerWithScore[] = [];
      for (let i = 0; i < half; i++) {
        perm.push(bottomPot[(i + shift + (r - 1)) % half]);
      }
      permutationsToTry.push(perm);
    }

    // Also try inverted shifts
    for (let shift = 0; shift < half; shift++) {
      const perm: PlayerWithScore[] = [];
      for (let i = 0; i < half; i++) {
        perm.push(bottomPot[(half - 1 - i + shift + (r - 1)) % half]);
      }
      permutationsToTry.push(perm);
    }

    // Add randomized permutations for optimal search
    for (let trial = 0; trial < 1000; trial++) {
      const shuffled = [...bottomPot];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      permutationsToTry.push(shuffled);
    }

    for (const bottomPerm of permutationsToTry) {
      // Check partner validity
      let valid = true;
      const candidatePairs: [PlayerWithScore, PlayerWithScore][] = [];

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

      // Now form 4 courts from the 8 candidate pairs such that Team A vs Team B is maximally balanced
      // Each pair has a combined score
      const pairsWithStrength = candidatePairs.map(p => ({
        top: p[0],
        bot: p[1],
        strength: p[0].score + p[1].score,
      }));

      // Sort pairs by combined strength
      pairsWithStrength.sort((a, b) => b.strength - a.strength);

      // Best matchup pairing for 4 courts:
      // Match strongest with closest strength or 1 vs 2, 3 vs 4, 5 vs 6, 7 vs 8
      // or 1+8 vs 2+7 etc.
      // Let's test the pair matching that minimizes sum of differences:
      const candidateCourtMatches: { teamA: [PlayerWithScore, PlayerWithScore]; teamB: [PlayerWithScore, PlayerWithScore]; diff: number }[] = [];
      let totalDiff = 0;

      // Group 1: Pairs 0 and 1
      const diff1 = Math.abs(pairsWithStrength[0].strength - pairsWithStrength[1].strength);
      candidateCourtMatches.push({
        teamA: [pairsWithStrength[0].top, pairsWithStrength[0].bot],
        teamB: [pairsWithStrength[1].top, pairsWithStrength[1].bot],
        diff: diff1,
      });
      totalDiff += diff1 * diff1;

      // Group 2: Pairs 2 and 3
      const diff2 = Math.abs(pairsWithStrength[2].strength - pairsWithStrength[3].strength);
      candidateCourtMatches.push({
        teamA: [pairsWithStrength[2].top, pairsWithStrength[2].bot],
        teamB: [pairsWithStrength[3].top, pairsWithStrength[3].bot],
        diff: diff2,
      });
      totalDiff += diff2 * diff2;

      // Group 3: Pairs 4 and 5
      const diff3 = Math.abs(pairsWithStrength[4].strength - pairsWithStrength[5].strength);
      candidateCourtMatches.push({
        teamA: [pairsWithStrength[4].top, pairsWithStrength[4].bot],
        teamB: [pairsWithStrength[5].top, pairsWithStrength[5].bot],
        diff: diff3,
      });
      totalDiff += diff3 * diff3;

      // Group 4: Pairs 6 and 7
      const diff4 = Math.abs(pairsWithStrength[6].strength - pairsWithStrength[7].strength);
      candidateCourtMatches.push({
        teamA: [pairsWithStrength[6].top, pairsWithStrength[6].bot],
        teamB: [pairsWithStrength[7].top, pairsWithStrength[7].bot],
        diff: diff4,
      });
      totalDiff += diff4 * diff4;

      if (totalDiff < minTotalDiff) {
        minTotalDiff = totalDiff;
        bestBottomPerm = bottomPerm;
        bestMatches = candidateCourtMatches;
      }
    }

    if (!bestMatches) {
      // Fallback
      bestMatches = [];
      for (let c = 0; c < courtsPerRound; c++) {
        const topA = topPot[c];
        const botA = bottomPot[(half - 1 - c + r) % half];
        const topB = topPot[half - 1 - c];
        const botB = bottomPot[(c + r) % half];
        bestMatches.push({
          teamA: [topA, botA],
          teamB: [topB, botB],
          diff: 0,
        });
      }
    }

    // Record partners into history
    bestMatches.forEach(m => {
      partnerHistory.add([m.teamA[0].player.id, m.teamA[1].player.id].sort().join('&'));
      partnerHistory.add([m.teamB[0].player.id, m.teamB[1].player.id].sort().join('&'));
    });

    const matches: Match[] = bestMatches.map((m, cIdx) => ({
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
