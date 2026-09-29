import type {
  Player,
  TournamentDay,
  GrandFinaleBracket,
  TournamentConfig,
  PlayerRegistrationRequest,
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
  REGISTRATION_REQUESTS: 'padel_registration_requests_v1',
  LAST_SYNC: 'padel_last_sync_v1',
};

export const generateShortPin = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pin = '';
  for (let i = 0; i < 5; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
};

export const DEFAULT_CONFIG: TournamentConfig = {
  tournamentName: 'G20 by Peter Inc. 🎾',
  editionNumber: 3,
  editionName: '3er Torneo G20 by Peter Inc.',
  tournamentLogoUrl: '',
  courtNames: ['Pista 1', 'Pista 2', 'Pista 3', 'Pista 4', 'Pista 5', 'Pista 6'],
  adminPin: '1234', // Tournament Admin PIN for tournament operations
  superAdminPin: '9999', // Super Admin PIN for developer keys and cloud infra
  rankingSystem: 'total_points',
  bayesianFactorK: 4,
  attendanceBonusPoints: 0.5,
  tieBreakMaxPoints: 10,
};

export const INITIAL_PLAYERS: Player[] = [
  { id: 'p_1', name: 'Esteban Reyna', nickname: 'El Arquitecto', phone: '+52 998 123 4567', email: 'esteban@padelg20.com', role: 'superadmin', pin: '9999', registeredAt: '2026-08-01', isActive: true, loginCount: 1, activeClicks: 10 },
  { id: 'p_2', name: 'Pedro Alatorre', nickname: 'Peter Inc', phone: '+52 998 234 5678', email: 'pedro@padelg20.com', role: 'admin', pin: '1234', registeredAt: '2026-08-01', isActive: true, loginCount: 1, activeClicks: 10 },
  { id: 'p_3', name: 'Rodrigo Zepeda', nickname: 'El Zurdo', phone: '+52 998 345 6789', email: 'rodrigo@padelg20.com', role: 'player', pin: 'G2003', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
  { id: 'p_4', name: 'Mauricio Garza', nickname: 'El Maza', phone: '+52 998 456 7890', email: 'mauricio@padelg20.com', role: 'player', pin: 'G2004', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
  { id: 'p_5', name: 'Santiago Medina', nickname: 'El Flaco', phone: '+52 998 567 8901', email: 'santiago@padelg20.com', role: 'player', pin: 'G2005', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
  { id: 'p_6', name: 'Carlos Benítez', nickname: 'El Tanque', phone: '+52 998 678 9012', email: 'carlos@padelg20.com', role: 'player', pin: 'G2006', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
  { id: 'p_7', name: 'Javier Escandón', nickname: 'El Profe', phone: '+52 998 789 0123', email: 'javier@padelg20.com', role: 'player', pin: 'G2007', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
  { id: 'p_8', name: 'Diego Villarreal', nickname: 'El Rayo', phone: '+52 998 890 1234', email: 'diego@padelg20.com', role: 'player', pin: 'G2008', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
  { id: 'p_9', name: 'Fernando Cárdenas', nickname: 'El Puma', phone: '+52 998 901 2345', email: 'fernando@padelg20.com', role: 'player', pin: 'G2009', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
  { id: 'p_10', name: 'Andrés Morales', nickname: 'El Cirujano', phone: '+52 998 012 3456', email: 'andres@padelg20.com', role: 'player', pin: 'G2010', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
  { id: 'p_11', name: 'Emilio Treviño', nickname: 'El Mágico', phone: '+52 998 111 2233', email: 'emilio@padelg20.com', role: 'player', pin: 'G2011', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
  { id: 'p_12', name: 'Guillermo Lozano', nickname: 'Memo', phone: '+52 998 222 3344', email: 'memo@padelg20.com', role: 'player', pin: 'G2012', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
  { id: 'p_13', name: 'Ricardo Salgado', nickname: 'Richie', phone: '+52 998 333 4455', email: 'richie@padelg20.com', role: 'player', pin: 'G2013', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
  { id: 'p_14', name: 'Alejandro Ponce', nickname: 'Alex', phone: '+52 998 444 5566', email: 'alex@padelg20.com', role: 'player', pin: 'G2014', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
  { id: 'p_15', name: 'Jorge Vales', nickname: 'El Capitán', phone: '+52 998 555 6677', email: 'jorge@padelg20.com', role: 'player', pin: 'G2015', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
  { id: 'p_16', name: 'Gabriel Cantú', nickname: 'Gabo', phone: '+52 998 666 7788', email: 'gabo@padelg20.com', role: 'player', pin: 'G2016', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
  { id: 'p_17', name: 'Luis Eduardo Silva', nickname: 'Lalo', phone: '+52 998 777 8899', email: 'lalo@padelg20.com', role: 'player', pin: 'G2017', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
  { id: 'p_18', name: 'Pablo Fontcuberta', nickname: 'Pablito', phone: '+52 998 888 9900', email: 'pablo@padelg20.com', role: 'player', pin: 'G2018', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
  { id: 'p_19', name: 'Mateo Domínguez', nickname: 'El Tornado', phone: '+52 998 999 0011', email: 'mateo@padelg20.com', role: 'player', pin: 'G2019', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
  { id: 'p_20', name: 'Héctor Navarro', nickname: 'El Halcón', phone: '+52 998 123 9876', email: 'hector@padelg20.com', role: 'player', pin: 'G2020', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
];

export const StorageService = {
  // Config
  getConfig(): TournamentConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored);
        const config = { ...DEFAULT_CONFIG, ...parsed };
        if (config.courtNames && config.courtNames.some((c: string) => c.includes('Cancha') || c.includes('('))) {
          config.courtNames = DEFAULT_CONFIG.courtNames;
        }
        return config;
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
        const parsed: Player[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all players have a pin assigned
          let needsUpdate = false;
          const validated = parsed.map((p, idx) => {
            if (!p.pin) {
              needsUpdate = true;
              return { ...p, pin: `G20${(idx + 1).toString().padStart(2, '0')}` };
            }
            return p;
          });
          if (needsUpdate) {
            localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(validated));
          }
          return validated;
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

  // Telemetry: Logins & Click Engagement
  recordUserLogin(playerId: string): void {
    const players = this.getPlayers();
    const updated = players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          loginCount: (p.loginCount || 0) + 1,
          lastLoginAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        };
      }
      return p;
    });
    this.savePlayers(updated);
  },

  recordUserClicks(playerId: string, clicksCount: number): void {
    const players = this.getPlayers();
    const updated = players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          activeClicks: (p.activeClicks || 0) + clicksCount,
          lastActiveAt: new Date().toISOString(),
        };
      }
      return p;
    });
    this.savePlayers(updated);
  },

  // Registration Requests
  getRegistrationRequests(): PlayerRegistrationRequest[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REGISTRATION_REQUESTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading registration requests', e);
    }
    return [];
  },

  saveRegistrationRequests(requests: PlayerRegistrationRequest[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REGISTRATION_REQUESTS, JSON.stringify(requests));
    } catch (e) {
      console.error('Error saving registration requests', e);
    }

    const supabase = getSupabase();
    if (supabase) {
      supabase
        .from('tournament_settings')
        .upsert({ id: 'registration_requests', data: requests, updated_at: new Date().toISOString() })
        .then(({ error }: { error: any }) => {
          if (error) console.warn('Supabase saveRegistrationRequests error:', error.message);
        });
    }
  },

  addRegistrationRequest(data: {
    name: string;
    nickname?: string;
    phone: string;
    email: string;
    avatar: string;
    notes?: string;
  }): PlayerRegistrationRequest {
    const requests = this.getRegistrationRequests();
    const newReq: PlayerRegistrationRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: data.name.trim(),
      nickname: data.nickname?.trim() || undefined,
      phone: data.phone.trim(),
      email: data.email.trim(),
      avatar: data.avatar,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      notes: data.notes?.trim() || undefined,
    };

    const updated = [newReq, ...requests];
    this.saveRegistrationRequests(updated);
    return newReq;
  },

  approveRegistrationRequest(
    requestId: string,
    customPin?: string
  ): { player: Player; pin: string; welcomeMessage: string } | null {
    const requests = this.getRegistrationRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return null;

    const players = this.getPlayers();
    const pin = (customPin || generateShortPin()).toUpperCase();

    const newPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: req.name.trim(),
      nickname: req.nickname?.trim() || undefined,
      phone: req.phone.trim(),
      email: req.email.trim(),
      avatar: req.avatar,
      role: 'player',
      pin: pin,
      registeredAt: new Date().toISOString().split('T')[0],
      isActive: true,
      loginCount: 0,
      activeClicks: 0,
      notes: req.notes,
    };

    const updatedPlayers = [...players, newPlayer];
    this.savePlayers(updatedPlayers);

    // Remove or mark approved
    const updatedRequests = requests.filter(r => r.id !== requestId);
    this.saveRegistrationRequests(updatedRequests);

    const displayName = newPlayer.nickname || newPlayer.name;
    const welcomeMessage = `Bienvenido ${displayName} Haz sido aceptado al torneo G20 by Pedro Castillo, puedes entrar a la webapp en https://padel-tournament-app-gamma.vercel.app/ y tu código unico de jugador para entrar a la app es ${pin}.`;

    return { player: newPlayer, pin, welcomeMessage };
  },

  rejectRegistrationRequest(requestId: string): void {
    const requests = this.getRegistrationRequests();
    const updated = requests.filter(r => r.id !== requestId);
    this.saveRegistrationRequests(updated);
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
    requests: PlayerRegistrationRequest[];
  } | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const [confRes, playersRes, daysRes, finaleRes, reqRes] = await Promise.all([
        supabase.from('tournament_settings').select('data').eq('id', 'main_config').maybeSingle(),
        supabase.from('players').select('data'),
        supabase.from('tournament_days').select('data'),
        supabase.from('grand_finale').select('data').eq('id', 'main_bracket').maybeSingle(),
        supabase.from('tournament_settings').select('data').eq('id', 'registration_requests').maybeSingle(),
      ]);

      const config: TournamentConfig = confRes.data?.data || DEFAULT_CONFIG;
      let players: Player[] = (playersRes.data && playersRes.data.length > 0)
        ? playersRes.data.map((r: any) => r.data)
        : INITIAL_PLAYERS;
      
      if (players.length === 0) {
        players = INITIAL_PLAYERS;
        const pRows = INITIAL_PLAYERS.map(p => ({ id: p.id, data: p, updated_at: new Date().toISOString() }));
        supabase.from('players').insert(pRows).then();
      }

      const days: TournamentDay[] = daysRes.data?.map((r: any) => r.data) || [];
      const bracket: GrandFinaleBracket | null = finaleRes.data?.data || null;
      const requests: PlayerRegistrationRequest[] = reqRes.data?.data || [];

      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
      localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(days));
      if (bracket) localStorage.setItem(STORAGE_KEYS.GRAND_FINALE, JSON.stringify(bracket));
      else localStorage.removeItem(STORAGE_KEYS.GRAND_FINALE);
      localStorage.setItem(STORAGE_KEYS.REGISTRATION_REQUESTS, JSON.stringify(requests));

      return { config, players, days, bracket, requests };
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
    bracket: GrandFinaleBracket | null,
    requests?: PlayerRegistrationRequest[]
  ): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      await supabase.from('tournament_settings').upsert({
        id: 'main_config',
        data: config,
        updated_at: new Date().toISOString()
      });

      if (requests !== undefined) {
        await supabase.from('tournament_settings').upsert({
          id: 'registration_requests',
          data: requests,
          updated_at: new Date().toISOString()
        });
      }

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
    localStorage.removeItem(STORAGE_KEYS.REGISTRATION_REQUESTS);

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
      await supabase.from('tournament_settings').delete().eq('id', 'registration_requests');
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
