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
  SUPER_ADMIN_AUTH: 'padel_super_admin_auth_v1',
  CURRENT_PLAYER_ID: 'padel_current_player_id_v1',
  LAST_SYNC: 'padel_last_sync_v1',
};

export const DEFAULT_CONFIG: TournamentConfig = {
  tournamentName: 'G20 by Peter Inc. 🎾',
  editionNumber: 3,
  editionName: '3er Torneo G20 by Peter Inc.',
  tournamentLogoUrl: '',
  courtNames: ['Cancha 1 (Central Oro)', 'Cancha 2 (Plata)', 'Cancha 3 (Bronce)', 'Cancha 4 (Cobre)', 'Cancha 5 (Madera / El Asador)'],
  adminPin: '1234', // Tournament Admin PIN for tournament operations
  superAdminPin: '9999', // Super Admin PIN for developer keys and cloud infra
  rankingSystem: 'total_points',
  bayesianFactorK: 4,
  attendanceBonusPoints: 0.5,
  tieBreakMaxPoints: 10,
};

export const INITIAL_PLAYERS: Player[] = [
  { id: 'p_1', name: 'Esteban Reyna', nickname: 'El Arquitecto', phone: '+52 998 123 4567', role: 'admin', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_2', name: 'Pedro Alatorre', nickname: 'Peter Inc', phone: '+52 998 234 5678', role: 'admin', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_3', name: 'Rodrigo Zepeda', nickname: 'El Zurdo', phone: '+52 998 345 6789', role: 'player', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_4', name: 'Mauricio Garza', nickname: 'El Maza', phone: '+52 998 456 7890', role: 'player', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_5', name: 'Santiago Medina', nickname: 'El Flaco', phone: '+52 998 567 8901', role: 'player', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_6', name: 'Carlos Benítez', nickname: 'El Tanque', phone: '+52 998 678 9012', role: 'player', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_7', name: 'Javier Escandón', nickname: 'El Profe', phone: '+52 998 789 0123', role: 'player', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_8', name: 'Diego Villarreal', nickname: 'El Rayo', phone: '+52 998 890 1234', role: 'player', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_9', name: 'Fernando Cárdenas', nickname: 'El Puma', phone: '+52 998 901 2345', role: 'player', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_10', name: 'Andrés Morales', nickname: 'El Cirujano', phone: '+52 998 012 3456', role: 'player', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_11', name: 'Emilio Treviño', nickname: 'El Mágico', phone: '+52 998 111 2233', role: 'player', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_12', name: 'Guillermo Lozano', nickname: 'Memo', phone: '+52 998 222 3344', role: 'player', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_13', name: 'Ricardo Salgado', nickname: 'Richie', phone: '+52 998 333 4455', role: 'player', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_14', name: 'Alejandro Ponce', nickname: 'Alex', phone: '+52 998 444 5566', role: 'player', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_15', name: 'Jorge Vales', nickname: 'El Capitán', phone: '+52 998 555 6677', role: 'player', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_16', name: 'Gabriel Cantú', nickname: 'Gabo', phone: '+52 998 666 7788', role: 'player', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_17', name: 'Luis Eduardo Silva', nickname: 'Lalo', phone: '+52 998 777 8899', role: 'player', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_18', name: 'Pablo Fontcuberta', nickname: 'Pablito', phone: '+52 998 888 9900', role: 'player', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_19', name: 'Mateo Domínguez', nickname: 'El Tornado', phone: '+52 998 999 0011', role: 'player', registeredAt: '2026-08-01', isActive: true },
  { id: 'p_20', name: 'Héctor Navarro', nickname: 'El Halcón', phone: '+52 998 123 9876', role: 'player', registeredAt: '2026-08-01', isActive: true },
];

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
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading players from localStorage', e);
    }
    return INITIAL_PLAYERS;
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
      const players: Player[] = (playersRes.data && playersRes.data.length > 0)
        ? playersRes.data.map((r: any) => r.data)
        : INITIAL_PLAYERS;
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

  // Current Player Session ID
  getCurrentPlayerId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_PLAYER_ID);
  },

  setCurrentPlayerId(playerId: string | null): void {
    if (playerId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PLAYER_ID, playerId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PLAYER_ID);
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

  // Super Admin Session Auth
  getIsSuperAdminAuthenticated(): boolean {
    return localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_AUTH) === 'true';
  },

  setSuperAdminAuthenticated(auth: boolean): void {
    if (auth) {
      localStorage.setItem(STORAGE_KEYS.SUPER_ADMIN_AUTH, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_AUTH);
    }
  },
};
