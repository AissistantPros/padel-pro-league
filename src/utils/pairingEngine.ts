import type { Player, Match, DailyRound, DailyPlayerStanding } from '../types/index.ts';
import { roundDecimal } from './tieBreakerEngine.ts';

/**
 * EMPAREJAMIENTO POR ORDEN DE LLEGADA (16 jugadores / 4 pistas)
 * ============================================================
 * Ya no se usa el azar ni el ranking histórico ni la optimización de fuerzas.
 * El orden de llegada al check-in define el número de cada jugador (1..16)
 * y ese número determina las parejas de los 3 juegos cortos.
 *
 * Cada cuarteto son los índices (0-based) dentro del orden de llegada:
 * [pareja A jugador 1, pareja A jugador 2, pareja B jugador 1, pareja B jugador 2]
 */

export const ARRIVAL_DAY_PLAYERS = 16;
export const ARRIVAL_DAY_COURTS = 4;

/**
 * JUEGO 1 — parejas consecutivas:
 *   1/2 vs 3/4 | 5/6 vs 7/8 | 9/10 vs 11/12 | 13/14 vs 15/16
 */
const ROUND_1_PATTERN: number[][] = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
];

/**
 * JUEGO 2 — bloques de 8 con desplazamiento de 4:
 *   1/5 vs 9/13 | 2/6 vs 10/14 | 3/7 vs 11/15 | 4/8 vs 12/16
 */
const ROUND_2_PATTERN: number[][] = [
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
];

/**
 * JUEGO 3 — rotación interna:
 *   1/6 vs 11/16 | 2/5 vs 12/15 | 3/8 vs 9/14 | 4/7 vs 10/13
 */
const ROUND_3_PATTERN: number[][] = [
  [0, 5, 10, 15],
  [1, 4, 11, 14],
  [2, 7, 8, 13],
  [3, 6, 9, 12],
];

const ROUND_PATTERNS: number[][][] = [ROUND_1_PATTERN, ROUND_2_PATTERN, ROUND_3_PATTERN];

const ROUND_LABELS = [
  'Juego Corto 1 · Orden de llegada',
  'Juego Corto 2 · Orden de llegada',
  'Juego Corto 3 · Orden de llegada',
];

const DEFAULT_COURT_NAMES = ['Pista 1', 'Pista 2', 'Pista 3', 'Pista 4'];

export interface ArrivalRoundsResult {
  rounds: DailyRound[];
  /** Map playerId -> posición de llegada (1..16) */
  arrivalPositions: Map<string, number>;
}

/**
 * Genera los 3 juegos cortos a partir del ORDEN DE LLEGADA.
 * @param dayId id de la jornada
 * @param arrivalOrderedPlayers jugadores en el orden exacto en que llegaron (16)
 * @param courtNames nombres de las 4 pistas
 */
export function generateArrivalRounds(
  dayId: string,
  arrivalOrderedPlayers: Player[],
  courtNames: string[] = DEFAULT_COURT_NAMES
): DailyRound[] {
  const total = arrivalOrderedPlayers.length;

  if (total !== ARRIVAL_DAY_PLAYERS) {
    throw new Error(
      `Este formato requiere exactamente ${ARRIVAL_DAY_PLAYERS} jugadores (4 pistas). Recibidos: ${total}.`
    );
  }

  const courts = courtNames.length >= ARRIVAL_DAY_COURTS ? courtNames : DEFAULT_COURT_NAMES;
  const rounds: DailyRound[] = [];

  ROUND_PATTERNS.forEach((pattern, roundIndex) => {
    const roundNumber = roundIndex + 1;

    const matches: Match[] = pattern.map((quad, courtIdx) => {
      const [a1, a2, b1, b2] = quad;
      const pA1 = arrivalOrderedPlayers[a1];
      const pA2 = arrivalOrderedPlayers[a2];
      const pB1 = arrivalOrderedPlayers[b1];
      const pB2 = arrivalOrderedPlayers[b2];

      return {
        id: `${dayId}_r${roundNumber}_m${courtIdx + 1}`,
        dayId,
        roundNumber,
        courtNumber: courtIdx + 1,
        courtName: courts[courtIdx] || `Pista ${courtIdx + 1}`,
        matchType: 'preliminary' as const,
        teamA: {
          player1Id: pA1.id,
          player1Name: pA1.name,
          player2Id: pA2.id,
          player2Name: pA2.name,
        },
        teamB: {
          player1Id: pB1.id,
          player1Name: pB1.name,
          player2Id: pB2.id,
          player2Name: pB2.name,
        },
        score: {
          scoreA: 0,
          scoreB: 0,
          completed: false,
        },
        createdAt: new Date().toISOString(),
      };
    });

    rounds.push({
      roundNumber,
      name: ROUND_LABELS[roundIndex],
      matches,
      isCompleted: false,
    });
  });

  return rounds;
}

/**
 * Construye el mapa playerId -> posición de llegada (1..16).
 */
export function buildArrivalPositions(arrivalOrderedPlayers: Player[]): Map<string, number> {
  const positions = new Map<string, number>();
  arrivalOrderedPlayers.forEach((player, idx) => positions.set(player.id, idx + 1));
  return positions;
}

/**
 * Ordena el ranking previo a la final (tras los 3 juegos cortos).
 * El total ya incluye el decimal de llegada, así que los empates de games
 * quedan resueltos por quién llegó primero.
 */
export function sortPrelimStandings(standings: DailyPlayerStanding[]): DailyPlayerStanding[] {
  return [...standings].sort((a, b) => {
    if (b.prelimTotalScore !== a.prelimTotalScore) {
      return b.prelimTotalScore - a.prelimTotalScore;
    }
    if (b.basePoints !== a.basePoints) {
      return b.basePoints - a.basePoints;
    }
    if (b.gameDiff !== a.gameDiff) {
      return b.gameDiff - a.gameDiff;
    }
    return a.arrivalPosition - b.arrivalPosition;
  });
}

/**
 * FINAL DE LA JORNADA — set completo tradicional.
 *
 * El ranking previo se corta en bloques de 4 posiciones y se cruzan
 * el 1º con el 4º contra el 2º con el 3º, y así sucesivamente:
 *
 *   Pista 1: 1 y 4  vs  2 y 3
 *   Pista 2: 5 y 8  vs  6 y 7
 *   Pista 3: 9 y 12 vs 10 y 11
 *   Pista 4: 13 y 16 vs 14 y 15
 */
export function generateDailyFinalRound(
  dayId: string,
  prelimStandings: DailyPlayerStanding[],
  courtNames: string[] = DEFAULT_COURT_NAMES
): DailyRound {
  const sorted = sortPrelimStandings(prelimStandings);
  const numPlayers = sorted.length;
  const courts = Math.floor(numPlayers / 4);

  const matches: Match[] = [];
  const categories = ['gold', 'silver', 'bronze', 'copper', 'wood'] as const;

  for (let c = 0; c < courts; c++) {
    const baseIdx = c * 4;
    const p1 = sorted[baseIdx + 0];
    const p2 = sorted[baseIdx + 1];
    const p3 = sorted[baseIdx + 2];
    const p4 = sorted[baseIdx + 3];

    const courtName = courtNames[c] || `Pista ${c + 1}`;

    matches.push({
      id: `${dayId}_r4_m${c + 1}`,
      dayId,
      roundNumber: 4,
      courtNumber: c + 1,
      courtName,
      matchType: 'daily_final',
      finalCategory: categories[c % categories.length] as any,
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
    name: 'Final de la Jornada (Set completo)',
    matches,
    isCompleted: false,
  };
}

/**
 * Redondeo seguro re-exportado para conveniencia de los componentes.
 */
export { roundDecimal };
