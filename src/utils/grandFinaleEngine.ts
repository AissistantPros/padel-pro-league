import type {
  PlayerIntelligenceStats,
  GrandFinaleBracket,
  GrandFinaleSeed,
  DailyRound,
  Match
} from '../types/index.ts';

/**
 * Creates the Grand Finale 3-Round Playoff Bracket:
 * - Seeds 1-12 can reach the 1st/2nd place Championship Final.
 * - Seeds 13-16 can reach the 3rd/4th place Podium Final if they win their first 2 matches!
 */
export function generateGrandFinaleBracket(
  statsList: PlayerIntelligenceStats[],
  courtNames: string[] = ['Pista 1', 'Pista 2', 'Pista 3', 'Pista 4']
): GrandFinaleBracket {
  const sorted = [...statsList].sort((a, b) => b.totalChampionshipPoints - a.totalChampionshipPoints);

  const seeds: GrandFinaleSeed[] = sorted.slice(0, 16).map((s, idx) => ({
    seed: idx + 1,
    playerId: s.playerId,
    playerName: s.playerName,
    championshipPoints: s.totalChampionshipPoints,
    rating: s.bayesianRating,
  }));

  const getSeed = (seedNum: number): GrandFinaleSeed => {
    return seeds.find(s => s.seed === seedNum) || {
      seed: seedNum,
      playerId: `p_${seedNum}`,
      playerName: `Jugador #${seedNum}`,
      championshipPoints: 0,
      rating: 4.0,
    };
  };

  const dayId = 'grand_finale';

  // Round 1: Cuartos / Fase Clasificatoria (4 Pistas simultáneas)
  // Pista 1: #1 & #12 vs #6 & #7 (Llave Oro A)
  // Pista 2: #2 & #11 vs #5 & #8 (Llave Oro B)
  // Pista 3: #3 & #10 vs #4 & #9 (Llave Oro C)
  // Pista 4: #13 & #16 vs #14 & #15 (Llave Ascenso Bronce / Repechaje)
  const round1Matches: Match[] = [
    {
      id: `${dayId}_r1_m1`,
      dayId,
      roundNumber: 101,
      courtNumber: 1,
      courtName: courtNames[0] || 'Pista 1',
      matchType: 'grand_final',
      finalCategory: 'qf',
      teamA: {
        player1Id: getSeed(1).playerId,
        player1Name: `#1 ${getSeed(1).playerName}`,
        player2Id: getSeed(12).playerId,
        player2Name: `#12 ${getSeed(12).playerName}`,
      },
      teamB: {
        player1Id: getSeed(6).playerId,
        player1Name: `#6 ${getSeed(6).playerName}`,
        player2Id: getSeed(7).playerId,
        player2Name: `#7 ${getSeed(7).playerName}`,
      },
      score: { scoreA: 0, scoreB: 0, completed: false },
      createdAt: new Date().toISOString(),
    },
    {
      id: `${dayId}_r1_m2`,
      dayId,
      roundNumber: 101,
      courtNumber: 2,
      courtName: courtNames[1],
      matchType: 'grand_final',
      finalCategory: 'qf',
      teamA: {
        player1Id: getSeed(2).playerId,
        player1Name: `#2 ${getSeed(2).playerName}`,
        player2Id: getSeed(11).playerId,
        player2Name: `#11 ${getSeed(11).playerName}`,
      },
      teamB: {
        player1Id: getSeed(5).playerId,
        player1Name: `#5 ${getSeed(5).playerName}`,
        player2Id: getSeed(8).playerId,
        player2Name: `#8 ${getSeed(8).playerName}`,
      },
      score: { scoreA: 0, scoreB: 0, completed: false },
      createdAt: new Date().toISOString(),
    },
    {
      id: `${dayId}_r1_m3`,
      dayId,
      roundNumber: 101,
      courtNumber: 3,
      courtName: courtNames[2],
      matchType: 'grand_final',
      finalCategory: 'qf',
      teamA: {
        player1Id: getSeed(3).playerId,
        player1Name: `#3 ${getSeed(3).playerName}`,
        player2Id: getSeed(10).playerId,
        player2Name: `#10 ${getSeed(10).playerName}`,
      },
      teamB: {
        player1Id: getSeed(4).playerId,
        player1Name: `#4 ${getSeed(4).playerName}`,
        player2Id: getSeed(9).playerId,
        player2Name: `#9 ${getSeed(9).playerName}`,
      },
      score: { scoreA: 0, scoreB: 0, completed: false },
      createdAt: new Date().toISOString(),
    },
    {
      id: `${dayId}_r1_m4`,
      dayId,
      roundNumber: 101,
      courtNumber: 4,
      courtName: courtNames[3],
      matchType: 'grand_final',
      finalCategory: 'copper',
      teamA: {
        player1Id: getSeed(13).playerId,
        player1Name: `#13 ${getSeed(13).playerName}`,
        player2Id: getSeed(16).playerId,
        player2Name: `#16 ${getSeed(16).playerName}`,
      },
      teamB: {
        player1Id: getSeed(14).playerId,
        player1Name: `#14 ${getSeed(14).playerName}`,
        player2Id: getSeed(15).playerId,
        player2Name: `#15 ${getSeed(15).playerName}`,
      },
      score: { scoreA: 0, scoreB: 0, completed: false },
      createdAt: new Date().toISOString(),
    },
  ];

  // Round 2: Semifinales y Cruces de Ascenso
  const round2Matches: Match[] = [
    {
      id: `${dayId}_r2_m1`,
      dayId,
      roundNumber: 102,
      courtNumber: 1,
      courtName: courtNames[0] || 'Pista 1',
      matchType: 'grand_final',
      finalCategory: 'sf',
      teamA: {
        player1Id: '',
        player1Name: 'Ganador Pista 1',
        player2Id: '',
        player2Name: '',
      },
      teamB: {
        player1Id: '',
        player1Name: 'Ganador Pista 2',
        player2Id: '',
        player2Name: '',
      },
      score: { scoreA: 0, scoreB: 0, completed: false },
      createdAt: new Date().toISOString(),
    },
    {
      id: `${dayId}_r2_m2`,
      dayId,
      roundNumber: 102,
      courtNumber: 2,
      courtName: courtNames[1] || 'Pista 2',
      matchType: 'grand_final',
      finalCategory: 'sf',
      teamA: {
        player1Id: '',
        player1Name: 'Ganador Pista 3',
        player2Id: '',
        player2Name: '',
      },
      teamB: {
        player1Id: '',
        player1Name: 'Mejor Perdedor Cuartos Oro',
        player2Id: '',
        player2Name: '',
      },
      score: { scoreA: 0, scoreB: 0, completed: false },
      createdAt: new Date().toISOString(),
    },
    {
      id: `${dayId}_r2_m3`,
      dayId,
      roundNumber: 102,
      courtNumber: 3,
      courtName: courtNames[2] || 'Pista 3',
      matchType: 'grand_final',
      finalCategory: 'bronze',
      teamA: {
        player1Id: '',
        player1Name: 'Ganador Pista 4 (Ascenso)',
        player2Id: '',
        player2Name: '',
      },
      teamB: {
        player1Id: '',
        player1Name: 'Perdedor Cuartos Oro',
        player2Id: '',
        player2Name: '',
      },
      score: { scoreA: 0, scoreB: 0, completed: false },
      createdAt: new Date().toISOString(),
    },
    {
      id: `${dayId}_r2_m4`,
      dayId,
      roundNumber: 102,
      courtNumber: 4,
      courtName: courtNames[3] || 'Pista 4',
      matchType: 'grand_final',
      finalCategory: 'copper',
      teamA: {
        player1Id: '',
        player1Name: 'Perdedor Pista 4',
        player2Id: '',
        player2Name: '',
      },
      teamB: {
        player1Id: '',
        player1Name: 'Perdedor Cuartos Oro',
        player2Id: '',
        player2Name: '',
      },
      score: { scoreA: 0, scoreB: 0, completed: false },
      createdAt: new Date().toISOString(),
    },
  ];

  // Round 3: Finales de Posición Definitivas
  const round3Matches: Match[] = [
    {
      id: `${dayId}_r3_m1`,
      dayId,
      roundNumber: 103,
      courtNumber: 1,
      courtName: courtNames[0] || 'Pista 1',
      matchType: 'grand_final',
      finalCategory: 'final_1st',
      teamA: {
        player1Id: '',
        player1Name: 'Finalista Oro 1',
        player2Id: '',
        player2Name: '',
      },
      teamB: {
        player1Id: '',
        player1Name: 'Finalista Oro 2',
        player2Id: '',
        player2Name: '',
      },
      score: { scoreA: 0, scoreB: 0, completed: false },
      createdAt: new Date().toISOString(),
    },
    {
      id: `${dayId}_r3_m2`,
      dayId,
      roundNumber: 103,
      courtNumber: 2,
      courtName: courtNames[1] || 'Pista 2',
      matchType: 'grand_final',
      finalCategory: 'final_3rd',
      teamA: {
        player1Id: '',
        player1Name: 'Perdedor Semi Oro',
        player2Id: '',
        player2Name: '',
      },
      teamB: {
        player1Id: '',
        player1Name: 'Ganador Semi Bronce',
        player2Id: '',
        player2Name: '',
      },
      score: { scoreA: 0, scoreB: 0, completed: false },
      createdAt: new Date().toISOString(),
    },
    {
      id: `${dayId}_r3_m3`,
      dayId,
      roundNumber: 103,
      courtNumber: 3,
      courtName: courtNames[2] || 'Pista 3',
      matchType: 'grand_final',
      finalCategory: 'final_5th',
      teamA: { player1Id: '', player1Name: 'Clasificado 5/6', player2Id: '', player2Name: '' },
      teamB: { player1Id: '', player1Name: 'Clasificado 7/8', player2Id: '', player2Name: '' },
      score: { scoreA: 0, scoreB: 0, completed: false },
      createdAt: new Date().toISOString(),
    },
    {
      id: `${dayId}_r3_m4`,
      dayId,
      roundNumber: 103,
      courtNumber: 4,
      courtName: courtNames[3] || 'Pista 4',
      matchType: 'grand_final',
      finalCategory: 'final_9th',
      teamA: { player1Id: '', player1Name: 'Clasificado 9/10', player2Id: '', player2Name: '' },
      teamB: { player1Id: '', player1Name: 'Clasificado 11/12', player2Id: '', player2Name: '' },
      score: { scoreA: 0, scoreB: 0, completed: false },
      createdAt: new Date().toISOString(),
    },
  ];

  const rounds: DailyRound[] = [
    {
      roundNumber: 1,
      name: 'Ronda 1: Cuartos de Final & Llave Ascenso',
      matches: round1Matches,
      isCompleted: false,
    },
    {
      roundNumber: 2,
      name: 'Ronda 2: Semifinales de Campeonato y Bronce',
      matches: round2Matches,
      isCompleted: false,
    },
    {
      roundNumber: 3,
      name: 'Ronda 3: 🏆 GRAN FINAL & Finales de Posición',
      matches: round3Matches,
      isCompleted: false,
    },
  ];

  return {
    id: 'grand_finale_bracket',
    name: 'Día de la Gran Final del Torneo',
    status: 'in_progress',
    seeds,
    rounds,
    podium: {},
  };
}
