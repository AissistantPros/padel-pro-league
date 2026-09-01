import type {
  Player,
  TournamentDay,
  GrandFinaleBracket,
  TournamentConfig,
} from '../types/index.ts';
import { getSupabase } from './supabaseClient.ts';

const STORAGE_KEYS = {
  PLAYERS: 'padel_players_v1',
  DAYS: 'padel_days_v1',
  GRAND_FINALE: 'padel_grand_finale_v1',
  CONFIG: 'padel_config_v1',
  ADMIN_AUTH: 'padel_admin_auth_v1',
  LAST_SYNC: 'padel_last_sync_v1',
};

export const DEFAULT_CONFIG: TournamentConfig = {
  tournamentName: 'G20 by Peter Inc. 🎾',
  courtNames: ['Cancha 1 (Central Oro)', 'Cancha 2 (Plata)', 'Cancha 3 (Bronce)', 'Cancha 4 (Cobre / El Asador)'],
  adminPin: '1234', // Default PIN for admin actions
  rankingSystem: 'total_points',
  bayesianFactorK: 4,
  attendanceBonusPoints: 0.5,
  tieBreakMaxPoints: 10,
};

export const INITIAL_PLAYERS: Player[] = [];

export const StorageService = {
  // Config
  getConfig(): TournamentConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error reading config from localStorage', e);
    }
    return DEFAULT_CONFIG;
  },

  saveConfig(config: TournamentConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Error saving config to localStorage', e);
    }

    const supabase = getSupabase();
    if (supabase) {
      supabase
        .from('tournament_settings')
        .upsert({ id: 'main_config', data: config, updated_at: new Date().toISOString() })
        .then(({ error }: { error: any }) => {
          if (error) console.warn('Supabase saveConfig error:', error.message);
        });
    }
  },

  // Players
  getPlayers(): Player[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PLAYERS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading players from localStorage', e);
    }
    return [];
  },

  savePlayers(players: Player[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    } catch (e) {
      console.error('Error saving players to localStorage', e);
    }

    const supabase = getSupabase();
    if (supabase) {
      supabase
        .from('players')
        .delete()
        .neq('id', '___all___')
        .then(() => {
          if (players.length > 0) {
            const rows = players.map(p => ({
              id: p.id,
              data: p,
              updated_at: new Date().toISOString()
            }));
            supabase.from('players').insert(rows).then(({ error }: { error: any }) => {
              if (error) console.warn('Supabase savePlayers error:', error.message);
            });
          }
        });
    }
  },

  // Tournament Days
  getTournamentDays(): TournamentDay[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DAYS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading days from localStorage', e);
    }
    return [];
  },

  saveTournamentDays(days: TournamentDay[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(days));
    } catch (e) {
      console.error('Error saving days to localStorage', e);
    }

    const supabase = getSupabase();
    if (supabase) {
      supabase
        .from('tournament_days')
        .delete()
        .neq('id', '___all___')
        .then(() => {
          if (days.length > 0) {
            const rows = days.map(d => ({
              id: d.id,
              data: d,
              updated_at: new Date().toISOString()
            }));
            supabase.from('tournament_days').insert(rows).then(({ error }: { error: any }) => {
              if (error) console.warn('Supabase saveTournamentDays error:', error.message);
            });
          }
        });
    }
  },

  // Grand Finale Bracket
  getGrandFinaleBracket(): GrandFinaleBracket | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GRAND_FINALE);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading grand finale bracket from localStorage', e);
    }
    return null;
  },

  saveGrandFinaleBracket(bracket: GrandFinaleBracket | null): void {
    try {
      if (bracket) {
        localStorage.setItem(STORAGE_KEYS.GRAND_FINALE, JSON.stringify(bracket));
      } else {
        localStorage.removeItem(STORAGE_KEYS.GRAND_FINALE);
      }
    } catch (e) {
      console.error('Error saving grand finale bracket to localStorage', e);
    }

    const supabase = getSupabase();
    if (supabase) {
      if (bracket) {
        supabase
          .from('grand_finale')
          .upsert({ id: 'main_bracket', data: bracket, updated_at: new Date().toISOString() })
          .then(({ error }: { error: any }) => {
            if (error) console.warn('Supabase saveGrandFinaleBracket error:', error.message);
          });
      } else {
        supabase.from('grand_finale').delete().eq('id', 'main_bracket').then();
      }
    }
  },

  // Pull whole state from Cloud
  async pullFromCloud(): Promise<{
    config: TournamentConfig;
    players: Player[];
    days: TournamentDay[];
    bracket: GrandFinaleBracket | null;
  } | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const [confRes, playersRes, daysRes, finaleRes] = await Promise.all([
        supabase.from('tournament_settings').select('data').eq('id', 'main_config').maybeSingle(),
        supabase.from('players').select('data'),
        supabase.from('tournament_days').select('data'),
        supabase.from('grand_finale').select('data').eq('id', 'main_bracket').maybeSingle(),
      ]);

      const config: TournamentConfig = confRes.data?.data || DEFAULT_CONFIG;
      const players: Player[] = playersRes.data?.map((r: any) => r.data) || [];
      const days: TournamentDay[] = daysRes.data?.map((r: any) => r.data) || [];
      const bracket: GrandFinaleBracket | null = finaleRes.data?.data || null;

      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
      localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(days));
      if (bracket) localStorage.setItem(STORAGE_KEYS.GRAND_FINALE, JSON.stringify(bracket));
      else localStorage.removeItem(STORAGE_KEYS.GRAND_FINALE);

      return { config, players, days, bracket };
    } catch (e) {
      console.error('Error pulling state from Supabase:', e);
      return null;
    }
  },

  // Push whole state to Cloud
  async pushToCloud(
    config: TournamentConfig,
    players: Player[],
    days: TournamentDay[],
    bracket: GrandFinaleBracket | null
  ): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      await supabase.from('tournament_settings').upsert({
        id: 'main_config',
        data: config,
        updated_at: new Date().toISOString()
      });

      await supabase.from('players').delete().neq('id', '___all___');
      if (players.length > 0) {
        const pRows = players.map(p => ({ id: p.id, data: p, updated_at: new Date().toISOString() }));
        await supabase.from('players').insert(pRows);
      }

      await supabase.from('tournament_days').delete().neq('id', '___all___');
      if (days.length > 0) {
        const dRows = days.map(d => ({ id: d.id, data: d, updated_at: new Date().toISOString() }));
        await supabase.from('tournament_days').insert(dRows);
      }

      if (bracket) {
        await supabase.from('grand_finale').upsert({
          id: 'main_bracket',
          data: bracket,
          updated_at: new Date().toISOString()
        });
      } else {
        await supabase.from('grand_finale').delete().eq('id', 'main_bracket');
      }

      return true;
    } catch (e) {
      console.error('Error pushing state to Supabase:', e);
      return false;
    }
  },

  // Reset all local and cloud data to zero
  async resetAllData(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.PLAYERS);
    localStorage.removeItem(STORAGE_KEYS.DAYS);
    localStorage.removeItem(STORAGE_KEYS.GRAND_FINALE);
    localStorage.removeItem(STORAGE_KEYS.CONFIG);

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('players').delete().neq('id', '___all___');
      await supabase.from('tournament_days').delete().neq('id', '___all___');
      await supabase.from('grand_finale').delete().neq('id', '___all___');
      await supabase.from('tournament_settings').upsert({
        id: 'main_config',
        data: DEFAULT_CONFIG,
        updated_at: new Date().toISOString()
      });
    }
  },

  // Admin Session Auth
  getIsAdminAuthenticated(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  },

  setAdminAuthenticated(auth: boolean): void {
    if (auth) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    }
  },
};
