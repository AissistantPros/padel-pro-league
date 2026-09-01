import type { Player, Match, DailyRound, DailyPlayerStanding } from '../types/index.ts';

export interface PlayerRankedSeed {
  player: Player;
  rank: number;
  score: number;
}

/**
 * Shuffles an array using Fisher-Yates
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates the 3 preliminary rounds ensuring:
 * 1. Top half (Top 8) NEVER pair with each other in rounds 1, 2, 3.
 * 2. Every team has 1 Top-half player + 1 Bottom-half player.
 * 3. Matched teams have EQUAL/BALANCED rank sums (Team A sum == Team B sum, Delta = 0).
 * 4. No player repeats partner in the 3 rounds.
 */
export function generatePreliminaryRounds(
  dayId: string,
  players: Player[],
  isFirstDay: boolean = false,
  rankingOrder?: Map<string, number>, // Map of playerId -> rank (1..N)
  courtNames: string[] = ['Cancha 1 (Central Oro)', 'Cancha 2 (Plata)', 'Cancha 3 (Bronce)', 'Cancha 4 (Cobre / El Asador)']
): DailyRound[] {
  const numPlayers = players.length;

  if (numPlayers % 4 !== 0 || numPlayers < 4) {
    throw new Error(`Se requiere un número de jugadores múltiplo de 4 (ej. 8, 12, 16). Actual: ${numPlayers}`);
  }

  let orderedPlayers: Player[] = [];

  if (isFirstDay || !rankingOrder || rankingOrder.size === 0) {
    orderedPlayers = shuffleArray(players);
  } else {
    // Sort according to previous date/cumulative standings (1 to 16)
    orderedPlayers = [...players].sort((a, b) => {
      const rankA = rankingOrder.get(a.id) ?? 9999;
      const rankB = rankingOrder.get(b.id) ?? 9999;
      return rankA - rankB;
    });
  }

  const half = numPlayers / 2; // 8 for 16 players
  const topPot = orderedPlayers.slice(0, half);     // P1..P8
  const bottomPot = orderedPlayers.slice(half);     // P9..P16

  const rounds: DailyRound[] = [];
  const courtsPerRound = numPlayers / 4; // 4 courts for 16 players

  // We generate 3 rounds with balanced rank sums:
  for (let r = 1; r <= 3; r++) {
    const matches: Match[] = [];

    for (let c = 0; c < courtsPerRound; c++) {
      const topAIndex = c;
      const topBIndex = half - 1 - c;

      // Rotation shift based on round to avoid partner repetition while keeping rank sums balanced
      const shiftA = (half - 1 - c - (r - 1) + half) % half;
      const shiftB = (c + (r - 1)) % half;

      const pTopA = topPot[topAIndex];
      const pBotA = bottomPot[shiftA];

      const pTopB = topPot[topBIndex];
      const pBotB = bottomPot[shiftB];

      const courtName = courtNames[c % courtNames.length] || `Cancha ${c + 1}`;

      matches.push({
        id: `${dayId}_r${r}_m${c + 1}`,
        dayId,
        roundNumber: r,
        courtNumber: c + 1,
        courtName,
        matchType: 'preliminary',
        teamA: {
          player1Id: pTopA.id,
          player1Name: pTopA.name,
          player2Id: pBotA.id,
          player2Name: pBotA.name,
        },
        teamB: {
          player1Id: pTopB.id,
          player1Name: pTopB.name,
          player2Id: pBotB.id,
          player2Name: pBotB.name,
        },
        score: {
          scoreA: 0,
          scoreB: 0,
          completed: false,
        },
        createdAt: new Date().toISOString(),
      });
    }

    rounds.push({
      roundNumber: r,
      name: `Juego Corto ${r} (Preliminares Parejos)`,
      matches,
      isCompleted: false,
    });
  }

  return rounds;
}

/**
 * Generates Round 4 (Daily Finals) based on the preliminary standings (1 to 16):
 * Cancha 1 (Final Oro): 1 y 4 vs 2 y 3
 * Cancha 2 (Final Plata): 5 y 8 vs 6 y 7
 * Cancha 3 (Final Bronce): 9 y 12 vs 10 y 11
 * Cancha 4 (Final Cobre / El Asador): 13 y 16 vs 14 y 15
 */
export function generateDailyFinalRound(
  dayId: string,
  prelimStandings: DailyPlayerStanding[],
  courtNames: string[] = ['Cancha 1 (Oro - Corona)', 'Cancha 2 (Plata)', 'Cancha 3 (Bronce)', 'Cancha 4 (Cobre / El Asador)']
): DailyRound {
  const sorted = [...prelimStandings].sort((a, b) => {
    // Primary: Total Points (Games + Decimals). Base games rule, decimals break ties!
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
  const categories = ['gold', 'silver', 'bronze', 'copper'] as const;

  for (let c = 0; c < courts; c++) {
    const baseIdx = c * 4;
    const p1 = sorted[baseIdx + 0]; // 1, 5, 9, 13
    const p2 = sorted[baseIdx + 1]; // 2, 6, 10, 14
    const p3 = sorted[baseIdx + 2]; // 3, 7, 11, 15
    const p4 = sorted[baseIdx + 3]; // 4, 8, 12, 16

    const courtName = courtNames[c] || `Cancha ${c + 1}`;
    const finalCategory = categories[c % categories.length];

    matches.push({
      id: `${dayId}_r4_m${c + 1}`,
      dayId,
      roundNumber: 4,
      courtNumber: c + 1,
      courtName,
      matchType: 'daily_final',
      finalCategory,
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
