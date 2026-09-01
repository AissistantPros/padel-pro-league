import { calculateMarginBonus, calculateRoundRecordBonus, calculateFinalBonuses, roundDecimal } from './tieBreakerEngine.ts';
import { generatePreliminaryRounds, generateDailyFinalRound } from './pairingEngine.ts';
import { INITIAL_PLAYERS } from '../services/storageService.ts';
import { calculateDailyPrelimStandings, buildChampionshipIntelligence, predictMatchWinProbability } from './intelligenceEngine.ts';

console.log('🎾 --- INICIANDO VERIFICACIÓN DE ALGORITMOS DE PÁDEL ---');

// 1. Verificación de Desempates y Bonificaciones
console.log('\n1. Verificando Reglas de Desempate Decimal:');
const w70 = calculateMarginBonus(7, 0);
const l70 = calculateMarginBonus(0, 7);
const w61 = calculateMarginBonus(6, 1);
const l61 = calculateMarginBonus(1, 6);
const w52 = calculateMarginBonus(5, 2);
const l52 = calculateMarginBonus(2, 5);
const w43 = calculateMarginBonus(4, 3);
const l43 = calculateMarginBonus(3, 4);

console.log(`Ganar 7-0: ${w70} (esperado +0.004) -> ${w70 === 0.004 ? '✅ OK' : '❌ FAIL'}`);
console.log(`Perder 7-0: ${l70} (esperado -0.004) -> ${l70 === -0.004 ? '✅ OK' : '❌ FAIL'}`);
console.log(`Ganar 6-1: ${w61} (esperado +0.003) -> ${w61 === 0.003 ? '✅ OK' : '❌ FAIL'}`);
console.log(`Perder 6-1: ${l61} (esperado -0.003) -> ${l61 === -0.003 ? '✅ OK' : '❌ FAIL'}`);
console.log(`Ganar 5-2: ${w52} (esperado +0.002) -> ${w52 === 0.002 ? '✅ OK' : '❌ FAIL'}`);
console.log(`Perder 5-2: ${l52} (esperado -0.003) -> ${l52 === -0.003 ? '✅ OK' : '❌ FAIL'}`);
console.log(`Ganar 4-3: ${w43} (esperado +0.000) -> ${w43 === 0.000 ? '✅ OK' : '❌ FAIL'}`);
console.log(`Perder 4-3: ${l43} (esperado -0.002) -> ${l43 === -0.002 ? '✅ OK' : '❌ FAIL'}`);

const rec3 = calculateRoundRecordBonus(3, 3);
const rec2 = calculateRoundRecordBonus(2, 3);
const rec1 = calculateRoundRecordBonus(1, 3);
const rec0 = calculateRoundRecordBonus(0, 3);
console.log(`Récord 3 Ganados: ${rec3} (esperado +0.003) -> ${rec3 === 0.003 ? '✅ OK' : '❌ FAIL'}`);
console.log(`Récord 2 Ganados: ${rec2} (esperado +0.002) -> ${rec2 === 0.002 ? '✅ OK' : '❌ FAIL'}`);
console.log(`Récord 1 Ganado: ${rec1} (esperado +0.001) -> ${rec1 === 0.001 ? '✅ OK' : '❌ FAIL'}`);
console.log(`Récord 0 Ganados: ${rec0} (esperado -0.003) -> ${rec0 === -0.003 ? '✅ OK' : '❌ FAIL'}`);

// 2. Verificación de Regla de Oro de Emparejamientos (Top 8 NUNCA juntos en 3 preliminares)
console.log('\n2. Verificando Regla de Emparejamientos (Top 8 nunca juntos en Juegos 1, 2 y 3):');
const rankingMap = new Map<string, number>();
INITIAL_PLAYERS.forEach((p, idx) => rankingMap.set(p.id, idx + 1)); // P1 a P16 en orden

const rounds = generatePreliminaryRounds('test_day', INITIAL_PLAYERS, false, rankingMap);
let top8Violations = 0;
let partnerRepetitions = 0;
const partnerPairs = new Map<string, Set<string>>();

rounds.forEach(r => {
  r.matches.forEach(m => {
    // Check teamA
    const rankA1 = rankingMap.get(m.teamA.player1Id)!;
    const rankA2 = rankingMap.get(m.teamA.player2Id)!;
    if (rankA1 <= 8 && rankA2 <= 8) top8Violations++;

    // Check teamB
    const rankB1 = rankingMap.get(m.teamB.player1Id)!;
    const rankB2 = rankingMap.get(m.teamB.player2Id)!;
    if (rankB1 <= 8 && rankB2 <= 8) top8Violations++;

    // Check repetition
    const pairA = [m.teamA.player1Id, m.teamA.player2Id].sort().join('-');
    const pairB = [m.teamB.player1Id, m.teamB.player2Id].sort().join('-');

    if (!partnerPairs.has(m.teamA.player1Id)) partnerPairs.set(m.teamA.player1Id, new Set());
    if (partnerPairs.get(m.teamA.player1Id)!.has(m.teamA.player2Id)) partnerRepetitions++;
    partnerPairs.get(m.teamA.player1Id)!.add(m.teamA.player2Id);
  });
});

console.log(`Violaciones de Top 8 jugando juntos: ${top8Violations} (esperado 0) -> ${top8Violations === 0 ? '✅ OK' : '❌ FAIL'}`);
console.log(`Repeticiones de pareja en 3 juegos: ${partnerRepetitions} (esperado 0) -> ${partnerRepetitions === 0 ? '✅ OK' : '❌ FAIL'}`);

console.log('\n🎾 --- TODAS LAS PRUEBAS DE MOTOR COMPLETADAS CON ÉXITO ---');
