import type {
  Player,
  TournamentDay,
  TournamentConfig,
  GrandFinaleBracket
} from '../types/index.ts';
import { generatePreliminaryRounds, generateDailyFinalRound } from '../utils/pairingEngine.ts';
import { calculateDailyPrelimStandings, calculateDailyFinalStandings } from '../utils/intelligenceEngine.ts';
import { getSupabase } from './supabaseClient.ts';

const STORAGE_KEYS = {
  PLAYERS: 'padel_tournament_players_v1',
  DAYS: 'padel_tournament_days_v1',
  CONFIG: 'padel_tournament_config_v1',
  GRAND_FINALE: 'padel_tournament_grand_finale_v1',
  AUTH_ADMIN: 'padel_tournament_is_admin_v1',
};

export const DEFAULT_CONFIG: TournamentConfig = {
  tournamentName: 'Liga Pro Padel Master 🎾',
  courtNames: ['Cancha 1 (Central)', 'Cancha 2', 'Cancha 3', 'Cancha 4'],
  adminPin: '1234', // Default PIN for admin actions
  rankingSystem: 'bayesian',
  bayesianFactorK: 4,
  attendanceBonusPoints: 0.5,
  tieBreakMaxPoints: 10,
};

export const INITIAL_PLAYERS: Player[] = [
  { id: 'p1', name: 'Alejandro Galán', nickname: 'Ale', registeredAt: '2026-08-01', isActive: true },
  { id: 'p2', name: 'Juan Lebrón', nickname: 'El Lobo', registeredAt: '2026-08-01', isActive: true },
  { id: 'p3', name: 'Agustín Tapia', nickname: 'El Mozart', registeredAt: '2026-08-01', isActive: true },
  { id: 'p4', name: 'Arturo Coello', nickname: 'King Arturo', registeredAt: '2026-08-01', isActive: true },
  { id: 'p5', name: 'Franco Stupaczuk', nickname: 'Stupa', registeredAt: '2026-08-01', isActive: true },
  { id: 'p6', name: 'Martín Di Nenno', nickname: 'El Rengo', registeredAt: '2026-08-01', isActive: true },
  { id: 'p7', name: 'Fernando Belasteguín', nickname: 'Bela', registeredAt: '2026-08-01', isActive: true },
  { id: 'p8', name: 'Paquito Navarro', nickname: 'Paquito', registeredAt: '2026-08-01', isActive: true },
  { id: 'p9', name: 'Fede Chingotto', nickname: 'Super Ratón', registeredAt: '2026-08-01', isActive: true },
  { id: 'p10', name: 'Javier Garrido', nickname: 'Metralleta', registeredAt: '2026-08-01', isActive: true },
  { id: 'p11', name: 'Miguel Yanguas', nickname: 'Mike', registeredAt: '2026-08-01', isActive: true },
  { id: 'p12', name: 'Coki Nieto', nickname: 'El Muro', registeredAt: '2026-08-01', isActive: true },
  { id: 'p13', name: 'Jon Sanz', nickname: 'El Rayo', registeredAt: '2026-08-01', isActive: true },
  { id: 'p14', name: 'Lucas Campagnolo', nickname: 'Campa', registeredAt: '2026-08-01', isActive: true },
  { id: 'p15', name: 'Alex Arroyo', nickname: 'El Cañón', registeredAt: '2026-08-01', isActive: true },
  { id: 'p16', name: 'Edu Alonso', nickname: 'Edu', registeredAt: '2026-08-01', isActive: true },
];

/**
 * Creates seed tournament days with realistic padel scores
 */
export function generateSeedTournamentDays(players: Player[]): TournamentDay[] {
  const day1Id = 'jornada_1';
  const playerIds = players.map(p => p.id);
  const day1Rounds = generatePreliminaryRounds(day1Id, players, true, undefined, DEFAULT_CONFIG.courtNames);

  const scoreSamplesDay1 = [
    [{ a: 7, b: 0 }, { a: 6, b: 1 }, { a: 5, b: 2 }, { a: 4, b: 3 }],
    [{ a: 6, b: 1 }, { a: 7, b: 0 }, { a: 4, b: 3 }, { a: 5, b: 2 }],
    [{ a: 5, b: 2 }, { a: 6, b: 1 }, { a: 7, b: 0 }, { a: 4, b: 3 }],
  ];

  day1Rounds.forEach((round, rIdx) => {
    round.matches.forEach((match, mIdx) => {
      const s = scoreSamplesDay1[rIdx][mIdx];
      match.score = {
        scoreA: s.a,
        scoreB: s.b,
        completed: true,
        winner: s.a > s.b ? 'teamA' : 'teamB',
      };
    });
    round.isCompleted = true;
  });

  const allPrelimMatchesDay1 = day1Rounds.flatMap(r => r.matches);
  const day1PrelimStandings = calculateDailyPrelimStandings(players, allPrelimMatchesDay1);

  const day1FinalRound = generateDailyFinalRound(day1Id, day1PrelimStandings, DEFAULT_CONFIG.courtNames);
  const finalScoresDay1 = [{ a: 6, b: 4 }, { a: 7, b: 5 }, { a: 6, b: 3 }, { a: 6, b: 2 }];
  day1FinalRound.matches.forEach((m, idx) => {
    const s = finalScoresDay1[idx];
    m.score = {
      scoreA: s.a,
      scoreB: s.b,
      completed: true,
      winner: s.a > s.b ? 'teamA' : 'teamB',
    };
  });
  day1FinalRound.isCompleted = true;

  day1Rounds.push(day1FinalRound);
  const day1FinalStandings = calculateDailyFinalStandings(day1PrelimStandings, day1FinalRound.matches);

  const day1: TournamentDay = {
    id: day1Id,
    name: 'Jornada 1 - Apertura de Temporada',
    date: '2026-08-15',
    status: 'completed',
    checkedInPlayerIds: playerIds,
    rounds: day1Rounds,
    prelimStandings: day1PrelimStandings,
    finalStandings: day1FinalStandings,
    createdAt: '2026-08-15T18:00:00Z',
    completedAt: '2026-08-15T22:30:00Z',
  };

  const day2Id = 'jornada_2';
  const day1RankMap = new Map<string, number>(day1FinalStandings.map(s => [s.playerId, s.finalDailyRank || 16]));
  const day2Rounds = generatePreliminaryRounds(day2Id, players, false, day1RankMap, DEFAULT_CONFIG.courtNames);

  const scoreSamplesDay2 = [
    [{ a: 6, b: 1 }, { a: 5, b: 2 }, { a: 7, b: 0 }, { a: 4, b: 3 }],
    [{ a: 7, b: 0 }, { a: 4, b: 3 }, { a: 6, b: 1 }, { a: 5, b: 2 }],
    [{ a: 4, b: 3 }, { a: 7, b: 0 }, { a: 5, b: 2 }, { a: 6, b: 1 }],
  ];

  day2Rounds.forEach((round, rIdx) => {
    round.matches.forEach((match, mIdx) => {
      const s = scoreSamplesDay2[rIdx][mIdx];
      match.score = {
        scoreA: s.a,
        scoreB: s.b,
        completed: true,
        winner: s.a > s.b ? 'teamA' : 'teamB',
      };
    });
    round.isCompleted = true;
  });

  const allPrelimMatchesDay2 = day2Rounds.flatMap(r => r.matches);
  const day2PrelimStandings = calculateDailyPrelimStandings(players, allPrelimMatchesDay2);

  const day2FinalRound = generateDailyFinalRound(day2Id, day2PrelimStandings, DEFAULT_CONFIG.courtNames);
  const finalScoresDay2 = [{ a: 7, b: 6 }, { a: 6, b: 4 }, { a: 6, b: 1 }, { a: 6, b: 3 }];
  day2FinalRound.matches.forEach((m, idx) => {
    const s = finalScoresDay2[idx];
    m.score = {
      scoreA: s.a,
      scoreB: s.b,
      completed: true,
      winner: s.a > s.b ? 'teamA' : 'teamB',
    };
  });
  day2FinalRound.isCompleted = true;

  day2Rounds.push(day2FinalRound);
  const day2FinalStandings = calculateDailyFinalStandings(day2PrelimStandings, day2FinalRound.matches);

  const day2: TournamentDay = {
    id: day2Id,
    name: 'Jornada 2 - Torneo Máster',
    date: '2026-08-22',
    status: 'completed',
    checkedInPlayerIds: playerIds,
    rounds: day2Rounds,
    prelimStandings: day2PrelimStandings,
    finalStandings: day2FinalStandings,
    createdAt: '2026-08-22T18:00:00Z',
    completedAt: '2026-08-22T22:30:00Z',
  };

  return [day1, day2];
}

export const StorageService = {
  getPlayers(): Player[] {
    const stored = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (!stored) {
      this.savePlayers(INITIAL_PLAYERS);
      return INITIAL_PLAYERS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_PLAYERS;
    }
  },

  savePlayers(players: Player[]): void {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    // Sync to Supabase in background
    const supabase = getSupabase();
    if (supabase) {
      players.forEach(async (player) => {
        try {
          await supabase.from('players').upsert({ id: player.id, data: player, updated_at: new Date().toISOString() });
        } catch (e) {
          console.error('Error syncing player to Supabase:', e);
        }
      });
    }
  },

  getTournamentDays(): TournamentDay[] {
    const stored = localStorage.getItem(STORAGE_KEYS.DAYS);
    if (!stored) {
      const players = this.getPlayers();
      const seedDays = generateSeedTournamentDays(players);
      this.saveTournamentDays(seedDays);
      return seedDays;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  saveTournamentDays(days: TournamentDay[]): void {
    localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(days));
    // Sync to Supabase in background
    const supabase = getSupabase();
    if (supabase) {
      days.forEach(async (day) => {
        try {
          await supabase.from('tournament_days').upsert({ id: day.id, data: day, updated_at: new Date().toISOString() });
        } catch (e) {
          console.error('Error syncing day to Supabase:', e);
        }
      });
    }
  },

  getConfig(): TournamentConfig {
    const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!stored) {
      this.saveConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  saveConfig(config: TournamentConfig): void {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    // Sync to Supabase
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('tournament_settings').upsert({ id: 'main_config', data: config, updated_at: new Date().toISOString() }).then();
    }
  },

  getGrandFinale(): GrandFinaleBracket | null {
    const stored = localStorage.getItem(STORAGE_KEYS.GRAND_FINALE);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  saveGrandFinale(bracket: GrandFinaleBracket | null): void {
    if (bracket) {
      localStorage.setItem(STORAGE_KEYS.GRAND_FINALE, JSON.stringify(bracket));
      const supabase = getSupabase();
      if (supabase) {
        supabase.from('grand_finale').upsert({ id: 'main_bracket', data: bracket, updated_at: new Date().toISOString() }).then();
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.GRAND_FINALE);
      const supabase = getSupabase();
      if (supabase) {
        supabase.from('grand_finale').delete().eq('id', 'main_bracket').then();
      }
    }
  },

  /**
   * Fetches all cloud data from Supabase and hydrates local storage
   */
  async syncFromSupabase(): Promise<{
    players?: Player[];
    days?: TournamentDay[];
    config?: TournamentConfig;
    grandFinale?: GrandFinaleBracket | null;
  } | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const [pRes, dRes, cRes, gRes] = await Promise.all([
        supabase.from('players').select('*'),
        supabase.from('tournament_days').select('*'),
        supabase.from('tournament_settings').select('*').eq('id', 'main_config').single(),
        supabase.from('grand_finale').select('*').eq('id', 'main_bracket').maybeSingle(),
      ]);

      const result: {
        players?: Player[];
        days?: TournamentDay[];
        config?: TournamentConfig;
        grandFinale?: GrandFinaleBracket | null;
      } = {};

      if (pRes.data && pRes.data.length > 0) {
        const cloudPlayers = pRes.data.map((row: any) => row.data as Player);
        localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(cloudPlayers));
        result.players = cloudPlayers;
      }

      if (dRes.data && dRes.data.length > 0) {
        const cloudDays = dRes.data.map((row: any) => row.data as TournamentDay);
        localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(cloudDays));
        result.days = cloudDays;
      }

      if (cRes.data && cRes.data.data) {
        const cloudConfig = cRes.data.data as TournamentConfig;
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(cloudConfig));
        result.config = cloudConfig;
      }

      if (gRes.data && gRes.data.data) {
        const cloudBracket = gRes.data.data as GrandFinaleBracket;
        localStorage.setItem(STORAGE_KEYS.GRAND_FINALE, JSON.stringify(cloudBracket));
        result.grandFinale = cloudBracket;
      }

      return result;
    } catch (err) {
      console.error('Error syncing from Supabase:', err);
      return null;
    }
  },

  /**
   * Pushes all current local database items to Supabase in one batch
   */
  async pushAllToSupabase(): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const players = this.getPlayers();
      const days = this.getTournamentDays();
      const config = this.getConfig();
      const grandFinale = this.getGrandFinale();

      // Upsert config
      await supabase.from('tournament_settings').upsert({ id: 'main_config', data: config, updated_at: new Date().toISOString() });

      // Upsert players
      for (const p of players) {
        await supabase.from('players').upsert({ id: p.id, data: p, updated_at: new Date().toISOString() });
      }

      // Upsert days
      for (const d of days) {
        await supabase.from('tournament_days').upsert({ id: d.id, data: d, updated_at: new Date().toISOString() });
      }

      // Upsert grand finale
      if (grandFinale) {
        await supabase.from('grand_finale').upsert({ id: 'main_bracket', data: grandFinale, updated_at: new Date().toISOString() });
      }

      return true;
    } catch (err) {
      console.error('Error pushing all data to Supabase:', err);
      return false;
    }
  },

  isAdminAuthenticated(): boolean {
    return localStorage.getItem(STORAGE_KEYS.AUTH_ADMIN) === 'true';
  },

  setAdminAuthenticated(auth: boolean): void {
    localStorage.setItem(STORAGE_KEYS.AUTH_ADMIN, auth ? 'true' : 'false');
  },

  exportDatabase(): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      players: this.getPlayers(),
      days: this.getTournamentDays(),
      config: this.getConfig(),
      grandFinale: this.getGrandFinale(),
    };
    return JSON.stringify(data, null, 2);
  },

  importDatabase(jsonData: string): boolean {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.players && Array.isArray(parsed.players)) {
        this.savePlayers(parsed.players);
      }
      if (parsed.days && Array.isArray(parsed.days)) {
        this.saveTournamentDays(parsed.days);
      }
      if (parsed.config) {
        this.saveConfig(parsed.config);
      }
      if (parsed.grandFinale) {
        this.saveGrandFinale(parsed.grandFinale);
      }
      return true;
    } catch (err) {
      console.error('Error importing data:', err);
      return false;
    }
  },

  resetTournamentData(): void {
    const players = INITIAL_PLAYERS;
    const days = generateSeedTournamentDays(players);
    this.savePlayers(players);
    this.saveTournamentDays(days);
    this.saveConfig(DEFAULT_CONFIG);
    this.saveGrandFinale(null);
  },
};
