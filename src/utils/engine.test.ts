/**
 * PRUEBAS DEL NUEVO SISTEMA (Orden de llegada + Final a set completo)
 * Ejecutar con:  node src/utils/engine.test.ts
 */
import {
  calculateArrivalBonus,
  roundDecimal,
  TOP_COURT_FINAL_BONUS,
  OTHER_COURT_FINAL_BONUS,
} from './tieBreakerEngine.ts';
import { generateArrivalRounds, generateDailyFinalRound } from './pairingEngine.ts';
import { calculateDailyPrelimStandings, calculateDailyFinalStandings } from './intelligenceEngine.ts';
import type { Player, Match, MatchScore } from '../types/index.ts';

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  const ok = a === e;
  if (!ok) failures++;
  console.log(`${ok ? '✅' : '❌'} ${label}${ok ? '' : `\n     esperado: ${e}\n     recibido: ${a}`}`);
}

// 16 jugadores, "J1".."J16" en el ORDEN DE LLEGADA
const ARRIVAL: Player[] = Array.from({ length: 16 }, (_, i) => ({
  id: `p${i + 1}`,
  name: `J${i + 1}`,
  role: 'player' as const,
  registeredAt: '2026-10-26',
  isActive: true,
}));

const nameOf = (id: string) => ARRIVAL.find(p => p.id === id)?.name ?? id;
const matchLabel = (m: Match) =>
  `${nameOf(m.teamA.player1Id)}/${nameOf(m.teamA.player2Id)} vs ${nameOf(m.teamB.player1Id)}/${nameOf(m.teamB.player2Id)}`;

console.log('🎾 --- VERIFICACIÓN DEL SISTEMA DE LLEGADA ---\n');

// ---------------------------------------------------------------- 1. Decimales
console.log('1. Decimal por orden de llegada');
check('1er lugar', calculateArrivalBonus(1), 0.016);
check('2do lugar', calculateArrivalBonus(2), 0.015);
check('3er lugar', calculateArrivalBonus(3), 0.014);
check('16vo lugar', calculateArrivalBonus(16), 0.001);
check('17vo lugar (sin decimal)', calculateArrivalBonus(17), 0);

// ------------------------------------------------------- 2. Emparejamientos
console.log('\n2. Emparejamientos por orden de llegada (captura del Excel)');
const rounds = generateArrivalRounds('test_day', ARRIVAL);
check('Se generan 3 juegos', rounds.length, 3);
check('4 partidos por juego', rounds.map(r => r.matches.length), [4, 4, 4]);

check('Juego 1', rounds[0].matches.map(matchLabel), [
  'J1/J2 vs J3/J4',
  'J5/J6 vs J7/J8',
  'J9/J10 vs J11/J12',
  'J13/J14 vs J15/J16',
]);

check('Juego 2', rounds[1].matches.map(matchLabel), [
  'J1/J5 vs J9/J13',
  'J2/J6 vs J10/J14',
  'J3/J7 vs J11/J15',
  'J4/J8 vs J12/J16',
]);

check('Juego 3', rounds[2].matches.map(matchLabel), [
  'J1/J6 vs J11/J16',
  'J2/J5 vs J12/J15',
  'J3/J8 vs J9/J14',
  'J4/J7 vs J10/J13',
]);

let threw = false;
try {
  generateArrivalRounds('bad', ARRIVAL.slice(0, 15));
} catch {
  threw = true;
}
check('Rechaza jornadas que no sean de 16', threw, true);

// ---------------------------------------------- 3. Puntos y desempate llegada
console.log('\n3. Puntos de los 3 juegos cortos y desempate por llegada');

// En los 12 partidos gana siempre la Pareja A por 4-3
const score = (a: number, b: number): MatchScore => ({
  scoreA: a,
  scoreB: b,
  completed: true,
  winner: a > b ? 'teamA' : 'teamB',
});
const playedRounds = rounds.map(r => ({
  ...r,
  matches: r.matches.map(m => ({ ...m, score: score(4, 3) })),
  isCompleted: true,
}));
const prelimMatches = playedRounds.flatMap(r => r.matches);

const prelim = calculateDailyPrelimStandings(ARRIVAL, prelimMatches, ARRIVAL.map(p => p.id));

// Ojo: el arreglo viene YA ordenado por ranking, por eso los puntos bajan de forma monotona
check('Puntos base en orden de ranking', prelim.map(s => s.basePoints), [12, 12, 12, 12, 11, 11, 11, 11, 10, 10, 10, 10, 9, 9, 9, 9]);
check(
  'Orden tras desempate (todos los empates resueltos por llegada)',
  prelim.map(s => s.playerName),
  ['J1', 'J2', 'J5', 'J6', 'J3', 'J4', 'J7', 'J8', 'J9', 'J10', 'J13', 'J14', 'J11', 'J12', 'J15', 'J16']
);
check('J1 = 12 games + 0.016', prelim[0].prelimTotalScore, 12.016);
check('J16 = 9 games + 0.001', prelim[15].prelimTotalScore, 9.001);
check('prelimRank asignado 1..16', prelim.map(s => s.prelimRank), Array.from({ length: 16 }, (_, i) => i + 1));

// ------------------------------------------------------------ 4. La final
console.log('\n4. Final: 1º+4º vs 2º+3º por pista');
const finalRound = generateDailyFinalRound('test_day', prelim);
check('Juego 4 creado', finalRound.roundNumber, 4);
check('Final Pista 1', matchLabel(finalRound.matches[0]), 'J1/J6 vs J2/J5');
check('Final Pista 2', matchLabel(finalRound.matches[1]), 'J3/J8 vs J4/J7');
check('Final Pista 3', matchLabel(finalRound.matches[2]), 'J9/J14 vs J10/J13');
check('Final Pista 4', matchLabel(finalRound.matches[3]), 'J11/J16 vs J12/J15');

// --------------------------------------------------- 5. Bonus 3 / 1 y total
console.log('\n5. Bonus de la final (3 puntos Pista 1, 1 punto resto)');
// En la final gana siempre la Pareja A: Pista 1 6-4, Pista 2 6-2, Pista 3 7-5, Pista 4 6-0
const finalScores = [
  { a: 6, b: 4 },
  { a: 6, b: 2 },
  { a: 7, b: 5 },
  { a: 6, b: 0 },
];
const playedFinal = {
  ...finalRound,
  matches: finalRound.matches.map((m, i) => ({ ...m, score: score(finalScores[i].a, finalScores[i].b) })),
  isCompleted: true,
};

const finalStandings = calculateDailyFinalStandings(prelim, playedFinal.matches);
const byName = new Map(finalStandings.map(s => [s.playerName, s]));

check('Bonus ganador Pista 1', byName.get('J1')?.finalBonus, TOP_COURT_FINAL_BONUS);
check('Bonus ganador Pista 2', byName.get('J3')?.finalBonus, OTHER_COURT_FINAL_BONUS);
check('Bonus perdedor Pista 1', byName.get('J2')?.finalBonus, 0);
check('J1 total = 12 + 0.016 + 6 + 3', byName.get('J1')?.totalDailyScore, roundDecimal(12 + 0.016 + 6 + 3));
check('J2 total = 12 + 0.015 + 4 + 0', byName.get('J2')?.totalDailyScore, roundDecimal(12 + 0.015 + 4));
check('J3 total = 11 + 0.014 + 6 + 1', byName.get('J3')?.totalDailyScore, roundDecimal(11 + 0.014 + 6 + 1));
// J16 gana 6-0 la final de la Pista 4 (Pareja A) -> 9 games + 0.001 + 6 + 1
check('J16 total = 9 + 0.001 + 6 + 1', byName.get('J16')?.totalDailyScore, roundDecimal(9 + 0.001 + 6 + 1));
check('Ranking final 1..16', finalStandings.map(s => s.finalDailyRank), Array.from({ length: 16 }, (_, i) => i + 1));
check('Todos los jugadores en el ranking final', finalStandings.length, 16);

console.log(`\n${failures === 0 ? '🎾 --- TODO OK ---' : `❌ ${failures} PRUEBA(S) FALLARON`}`);
if (failures > 0) process.exit(1);
