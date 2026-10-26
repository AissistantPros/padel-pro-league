/**
 * SISTEMA DE PUNTOS — REGLA ÚNICA DE DECIMALES
 * ============================================
 * El único decimal que existe en todo el torneo es el de ORDEN DE LLEGADA.
 * Ya no hay decimales por margen de games, por récord de juegos, por ganar
 * la final ni por "clean sweep". Todos esos bonuses fueron eliminados.
 *
 * Al llegar a la jornada, cada jugador acumula:
 *   1er jugador en llegar  -> +0.016
 *   2do jugador en llegar  -> +0.015
 *   3er jugador en llegar  -> +0.014
 *   ...
 *   16vo jugador en llegar -> +0.001
 *
 * Ese decimal sólo sirve como criterio de desempate: dos jugadores empatados
 * en puntos de games quedan ordenados por quién llegó primero.
 */

/** Decimal del primer jugador en llegar (1er lugar). */
export const ARRIVAL_FIRST_DECIMAL = 0.016;

/** Cada posición adicional resta 0.001 al decimal de llegada. */
export const ARRIVAL_DECIMAL_STEP = 0.001;

/** Tope de posiciones con decimal (16 jugadores = 4 pistas). */
export const ARRIVAL_MAX_PLAYERS = 16;

/** Bonus para los ganadores del partido estelar de la final (1º+4º vs 2º+3º). */
export const TOP_COURT_FINAL_BONUS = 3;

/** Bonus para los ganadores del resto de los partidos de la final. */
export const OTHER_COURT_FINAL_BONUS = 1;

/**
 * Decimal de desempate por orden de llegada.
 * position 1 -> 0.016 | position 16 -> 0.001 | position >= 17 -> 0
 */
export function calculateArrivalBonus(position: number): number {
  if (!Number.isFinite(position) || position < 1) return 0;
  const decimal = ARRIVAL_FIRST_DECIMAL - (position - 1) * ARRIVAL_DECIMAL_STEP;
  if (decimal <= 0) return 0;
  return roundDecimal(decimal);
}

/**
 * Construye el mapa playerId -> decimal de llegada a partir del arreglo
 * de check-in respetando el orden exacto en que se registraron.
 */
export function buildArrivalBonusMap(arrivalOrder: string[]): Map<string, number> {
  const map = new Map<string, number>();
  arrivalOrder.forEach((playerId, index) => {
    map.set(playerId, calculateArrivalBonus(index + 1));
  });
  return map;
}

/**
 * Posición de llegada (1-based) de un jugador dentro del orden registrado.
 * Devuelve ARRIVAL_MAX_PLAYERS si no aparece (no debería ocurrir).
 */
export function getArrivalPosition(arrivalOrder: string[], playerId: string): number {
  const index = arrivalOrder.indexOf(playerId);
  return index === -1 ? ARRIVAL_MAX_PLAYERS : index + 1;
}

/**
 * High-precision rounding to 6 decimal places to avoid floating point math anomalies
 */
export function roundDecimal(num: number): number {
  return Math.round((num + Number.EPSILON) * 1000000) / 1000000;
}

/**
 * Formats a score with games and decimals for clear presentation
 * e.g. "18.007" (18 games + 0.007 decimal por orden de llegada)
 */
export function formatScoreDisplay(score: number): string {
  const parts = (score || 0).toFixed(3).split('.');
  const base = parts[0];
  const decimals = parts[1];
  if (decimals === '000') return base;
  return `${base}.${decimals}`;
}

/**
 * Formats the arrival decimal with explicit sign: "+0.016", "+0.001"
 */
export function formatArrivalBonus(bonus: number): string {
  if (!bonus) return '—';
  return `+${bonus.toFixed(3)}`;
}
