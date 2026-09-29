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
  DELETED_PLAYER_IDS: 'padel_deleted_player_ids_v1',
  LAST_SYNC: 'padel_last_sync_v1',
};

/**
 * Cryptographically secure, unambiguous uppercase alphanumeric random PIN generator.
 * Excludes easily confused characters (O, 0, I, 1, L).
 */
export const generateSecurePin = (length: number = 5): string => {
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let pin = '';
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < length; i++) {
      pin += charset[randomBytes[i] % charset.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      pin += charset.charAt(Math.floor(Math.random() * charset.length));
    }
  }
  return pin;
};

export const generateShortPin = generateSecurePin;

export const DEFAULT_CONFIG: TournamentConfig = {
  tournamentName: 'Torneo de Pádel G20 🎾',
  editionNumber: 3,
  editionName: '3ra Edición Torneo G20',
  tournamentLogoUrl: '',
  courtNames: ['Pista 1', 'Pista 2', 'Pista 3', 'Pista 4', 'Pista 5', 'Pista 6'],
  adminPin: 'G20AD', // Secure 5-char Master Tournament Admin PIN
  superAdminPin: 'EST99', // Secure 5-char Master Super Admin PIN
  telegramUsername: 'Estebanri', // Esteban's Telegram username
  telegramBotToken: '8990462672:AAFx0KenD6TUHDwHTHtU_3XP96xZazWhl9g', // Padelg20adminbot Token
  telegramChatId: '1575757414', // Esteban's Telegram Chat ID
  rankingSystem: 'total_points',
  bayesianFactorK: 4,
  attendanceBonusPoints: 0.5,
  tieBreakMaxPoints: 10,
};

/**
 * Sends real-time Telegram Bot Notification if botToken and chatId are configured
 */
export async function sendTelegramNotification(
  config: TournamentConfig,
  text: string
): Promise<boolean> {
  if (!config.telegramBotToken || !config.telegramChatId) {
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.telegramChatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Telegram notification fetch error:', err);
    return false;
  }
}

export const INITIAL_PLAYERS: Player[] = [
  { id: 'p_1', name: 'Esteban Reyna', nickname: 'El Arquitecto', phone: '+52 998 123 4567', email: 'esteban@padelg20.com', role: 'superadmin', pin: 'EST99', registeredAt: '2026-08-01', isActive: true, loginCount: 0, activeClicks: 0 },
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

  // Deleted Player Tombstones & Blacklist
  getDeletedPlayerIds(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DELETED_PLAYER_IDS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading deleted player IDs:', e);
    }
    return [];
  },

  addDeletedPlayerId(playerId: string): void {
    if (!playerId) return;
    const current = this.getDeletedPlayerIds();
    if (!current.includes(playerId)) {
      const updated = [...current, playerId];
      try {
        localStorage.setItem(STORAGE_KEYS.DELETED_PLAYER_IDS, JSON.stringify(updated));
      } catch (e) {}

      const supabase = getSupabase();
      if (supabase) {
        supabase
          .from('tournament_settings')
          .upsert({ id: 'deleted_player_ids', data: updated, updated_at: new Date().toISOString() })
          .then();
      }
    }
  },

  // Players
  getPlayers(): Player[] {
    const deletedIds = new Set(this.getDeletedPlayerIds());
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PLAYERS);
      if (stored !== null) {
        const parsed: Player[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(p => p && p.id && !deletedIds.has(p.id));
        }
      }
    } catch (e) {
      console.error('Error reading players from localStorage', e);
    }
    return INITIAL_PLAYERS.filter(p => !deletedIds.has(p.id));
  },

  savePlayers(players: Player[]): void {
    const deletedIds = new Set(this.getDeletedPlayerIds());
    const cleanPlayers = players.filter(p => p && p.id && !deletedIds.has(p.id));

    try {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(cleanPlayers));
    } catch (e) {
      console.error('Error saving players to localStorage', e);
    }

    const supabase = getSupabase();
    if (supabase && cleanPlayers.length > 0) {
      // Safe Supabase Sync: Upsert active non-deleted players
      const rows = cleanPlayers.map(p => ({
        id: p.id,
        data: p,
        updated_at: new Date().toISOString(),
      }));
      supabase.from('players').upsert(rows).then(({ error: upErr }) => {
        if (upErr) console.warn('Supabase upsert players error:', upErr.message);
      });
    }
  },

  /**
   * Explicitly and permanently eradicate a player from database, cache, and local storage.
   * Called only on user confirmation from PlayersManager.
   */
  async deletePlayer(playerId: string, currentPlayers?: Player[]): Promise<Player[]> {
    if (!playerId) return currentPlayers || this.getPlayers();

    // 1. Mark in permanent blacklist/tombstone
    this.addDeletedPlayerId(playerId);

    // 2. Filter out of local list
    const active = currentPlayers && currentPlayers.length > 0 ? currentPlayers : this.getPlayers();
    const updated = active.filter(p => p.id !== playerId);
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving players locally:', e);
    }

    // 3. Clear auth if deleted player is the active session
    const curPlayerId = this.getCurrentPlayerId();
    if (curPlayerId === playerId) {
      this.setCurrentPlayerId(null);
    }

    // 4. Permanent Supabase cloud eradication
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('players').delete().eq('id', playerId);
        if (error) {
          console.error(`Supabase deletePlayer error for ${playerId}:`, error.message);
        } else {
          console.log(`Player ${playerId} permanently eradicated from Supabase`);
        }

        // Clean matching registration requests
        const targetPlayer = active.find(p => p.id === playerId);
        const reqs = this.getRegistrationRequests();
        const updatedReqs = reqs.filter(r => 
          r.name?.trim().toLowerCase() !== targetPlayer?.name?.trim().toLowerCase() &&
          r.phone?.trim() !== targetPlayer?.phone?.trim()
        );
        if (updatedReqs.length !== reqs.length) {
          this.saveRegistrationRequests(updatedReqs);
          await supabase.from('tournament_settings').upsert({
            id: 'registration_requests',
            data: updatedReqs,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Error deleting player from Supabase:', err);
      }
    }
    return updated;
  },

  // Regenerate random security codes for all players
  regenerateAllPlayerPins(players: Player[]): Player[] {
    const usedPins = new Set<string>();
    const updated = players.map(p => {
      let pin = generateSecurePin();
      while (usedPins.has(pin)) {
        pin = generateSecurePin();
      }
      usedPins.add(pin);
      return { ...p, pin };
    });
    this.savePlayers(updated);
    return updated;
  },

  // Telemetry: Logins & Click Engagement (Uses .update to NEVER re-create a deleted player)
  recordUserLogin(playerId: string): void {
    if (!playerId) return;
    const deletedIds = this.getDeletedPlayerIds();
    if (deletedIds.includes(playerId)) {
      if (this.getCurrentPlayerId() === playerId) this.setCurrentPlayerId(null);
      return;
    }

    const players = this.getPlayers();
    let updatedPlayer: Player | null = null;
    const updated = players.map(p => {
      if (p.id === playerId) {
        updatedPlayer = {
          ...p,
          loginCount: (p.loginCount || 0) + 1,
          lastLoginAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        };
        return updatedPlayer;
      }
      return p;
    });

    if (!updatedPlayer) return;

    try {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving login telemetry locally:', e);
    }

    const supabase = getSupabase();
    if (supabase && updatedPlayer) {
      // Use UPDATE (never upsert) so a deleted row is NEVER resurrected
      supabase
        .from('players')
        .update({
          data: updatedPlayer,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (updatedPlayer as Player).id)
        .then();
    }
  },

  recordUserClicks(playerId: string, clicksCount: number): void {
    if (!playerId || clicksCount <= 0) return;
    const deletedIds = this.getDeletedPlayerIds();
    if (deletedIds.includes(playerId)) {
      if (this.getCurrentPlayerId() === playerId) this.setCurrentPlayerId(null);
      return;
    }

    const players = this.getPlayers();
    let updatedPlayer: Player | null = null;
    const updated = players.map(p => {
      if (p.id === playerId) {
        updatedPlayer = {
          ...p,
          activeClicks: (p.activeClicks || 0) + clicksCount,
          lastActiveAt: new Date().toISOString(),
        };
        return updatedPlayer;
      }
      return p;
    });

    if (!updatedPlayer) return;

    try {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving click telemetry locally:', e);
    }

    const supabase = getSupabase();
    if (supabase && updatedPlayer) {
      // Use UPDATE (never upsert) so a deleted row is NEVER resurrected
      supabase
        .from('players')
        .update({
          data: updatedPlayer,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (updatedPlayer as Player).id)
        .then();
    }
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

  async addRegistrationRequest(data: {
    name: string;
    nickname?: string;
    phone: string;
    email: string;
    avatar: string;
    notes?: string;
  }): Promise<PlayerRegistrationRequest> {
    const supabase = getSupabase();
    let currentRequests: PlayerRegistrationRequest[] = [];
    if (supabase) {
      try {
        const { data: dbData } = await supabase
          .from('tournament_settings')
          .select('data')
          .eq('id', 'registration_requests')
          .maybeSingle();
        if (dbData?.data && Array.isArray(dbData.data)) {
          currentRequests = dbData.data;
        }
      } catch (err) {
        console.warn('Error fetching current requests before add:', err);
      }
    }
    if (currentRequests.length === 0) {
      currentRequests = this.getRegistrationRequests();
    }

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

    const updated = [newReq, ...currentRequests.filter(r => r.id !== newReq.id)];

    try {
      localStorage.setItem(STORAGE_KEYS.REGISTRATION_REQUESTS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving requests locally:', e);
    }

    if (supabase) {
      try {
        await supabase
          .from('tournament_settings')
          .upsert({ id: 'registration_requests', data: updated, updated_at: new Date().toISOString() });
      } catch (err) {
        console.error('Error saving registration request to Supabase:', err);
      }
    }

    return newReq;
  },

  async approveRegistrationRequest(
    requestOrId: string | PlayerRegistrationRequest,
    currentPlayers?: Player[],
    currentRequests?: PlayerRegistrationRequest[],
    customPin?: string
  ): Promise<{
    player: Player;
    pin: string;
    welcomeMessage: string;
    updatedPlayers: Player[];
    updatedRequests: PlayerRegistrationRequest[];
  } | null> {
    const activeRequests = currentRequests && currentRequests.length > 0 
      ? currentRequests 
      : this.getRegistrationRequests();

    const req = typeof requestOrId === 'string'
      ? activeRequests.find(r => r.id === requestOrId)
      : requestOrId;

    if (!req) return null;

    const activePlayers = currentPlayers && currentPlayers.length > 0
      ? currentPlayers
      : this.getPlayers();

    const existingPins = new Set(activePlayers.map(p => (p.pin || '').trim().toUpperCase()));
    
    let pin = (customPin || generateSecurePin()).trim().toUpperCase();
    while (!customPin && existingPins.has(pin)) {
      pin = generateSecurePin().trim().toUpperCase();
    }

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

    const updatedPlayers = [...activePlayers.filter(p => p.id !== newPlayer.id), newPlayer];
    // Keep request in DB history marked as approved with its generated PIN
    const updatedRequests = activeRequests.map(r =>
      r.id === req.id
        ? {
            ...r,
            status: 'approved' as const,
            notes: (r.notes ? r.notes + ' | ' : '') + `Aprobado con clave ${pin}`,
          }
        : r
    );

    // Save to LocalStorage
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(updatedPlayers));
      localStorage.setItem(STORAGE_KEYS.REGISTRATION_REQUESTS, JSON.stringify(updatedRequests));
    } catch (e) {
      console.warn('Error saving to localStorage:', e);
    }

    // Save to Supabase Cloud atomically
    const supabase = getSupabase();
    if (supabase) {
      try {
        const [playerRes, reqRes] = await Promise.all([
          supabase.from('players').upsert({
            id: newPlayer.id,
            data: newPlayer,
            updated_at: new Date().toISOString(),
          }),
          supabase.from('tournament_settings').upsert({
            id: 'registration_requests',
            data: updatedRequests,
            updated_at: new Date().toISOString(),
          }),
        ]);

        if (playerRes.error) {
          console.error('CRITICAL: Supabase player upsert error:', playerRes.error);
          throw new Error(`Error guardando jugador en base de datos: ${playerRes.error.message}`);
        }
        if (reqRes.error) {
          console.warn('Supabase requests update warning:', reqRes.error);
        }
      } catch (err) {
        console.error('Error persisting approved player to Supabase:', err);
        throw err;
      }
    }

    const displayName = newPlayer.nickname || newPlayer.name;
    const welcomeMessage = `¡Bienvenido ${displayName}! Has sido aceptado al Torneo de Pádel G20. Puedes ingresar a la webapp en https://padel-tournament-app-gamma.vercel.app/ con tu código de jugador: ${pin}`;

    return { player: newPlayer, pin, welcomeMessage, updatedPlayers, updatedRequests };
  },

  async rejectRegistrationRequest(
    requestId: string,
    currentRequests?: PlayerRegistrationRequest[]
  ): Promise<PlayerRegistrationRequest[]> {
    const activeRequests = currentRequests && currentRequests.length > 0
      ? currentRequests
      : this.getRegistrationRequests();

    // Keep request in DB history marked as rejected
    const updatedRequests = activeRequests.map(r =>
      r.id === requestId
        ? {
            ...r,
            status: 'rejected' as const,
          }
        : r
    );

    try {
      localStorage.setItem(STORAGE_KEYS.REGISTRATION_REQUESTS, JSON.stringify(updatedRequests));
    } catch (e) {
      console.warn('Error saving requests locally:', e);
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('tournament_settings').upsert({
          id: 'registration_requests',
          data: updatedRequests,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error rejecting registration request in Supabase:', err);
      }
    }

    return updatedRequests;
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
      if (days && days.length > 0) {
        localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(days));
      } else {
        localStorage.removeItem(STORAGE_KEYS.DAYS);
      }
    } catch (e) {
      console.error('Error saving days to localStorage', e);
    }

    const supabase = getSupabase();
    if (supabase) {
      if (!days || days.length === 0) {
        supabase.from('tournament_days').delete().neq('id', '___none___').then();
      } else {
        supabase
          .from('tournament_days')
          .select('id')
          .then(({ data: existingRows, error }) => {
            if (error) {
              console.warn('Supabase saveTournamentDays fetch error:', error.message);
              return;
            }

            const existingIds: string[] = (existingRows || []).map((r: any) => r.id);
            const currentIds = new Set(days.map(d => d.id));
            const toDelete = existingIds.filter(id => !currentIds.has(id));

            if (toDelete.length > 0) {
              supabase.from('tournament_days').delete().in('id', toDelete).then();
            }

            if (days.length > 0) {
              const rows = days.map(d => ({
                id: d.id,
                data: d,
                updated_at: new Date().toISOString(),
              }));
              supabase.from('tournament_days').upsert(rows).then();
            }
          });
      }
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
      const [confRes, playersRes, daysRes, finaleRes, reqRes, delRes] = await Promise.all([
        supabase.from('tournament_settings').select('data').eq('id', 'main_config').maybeSingle(),
        supabase.from('players').select('data'),
        supabase.from('tournament_days').select('data'),
        supabase.from('grand_finale').select('data').eq('id', 'main_bracket').maybeSingle(),
        supabase.from('tournament_settings').select('data').eq('id', 'registration_requests').maybeSingle(),
        supabase.from('tournament_settings').select('data').eq('id', 'deleted_player_ids').maybeSingle(),
      ]);

      const config: TournamentConfig = confRes.data?.data || this.getConfig();

      // Synchronize deleted player tombstones
      const cloudDeletedIds: string[] = Array.isArray(delRes.data?.data) ? delRes.data.data : [];
      const localDeletedIds = this.getDeletedPlayerIds();
      const allDeletedIds = Array.from(new Set([...cloudDeletedIds, ...localDeletedIds]));
      if (allDeletedIds.length > 0) {
        try {
          localStorage.setItem(STORAGE_KEYS.DELETED_PLAYER_IDS, JSON.stringify(allDeletedIds));
        } catch (e) {}
      }
      const deletedSet = new Set(allDeletedIds);
      
      let players: Player[] = [];
      if (playersRes.data && Array.isArray(playersRes.data) && playersRes.data.length > 0) {
        players = playersRes.data
          .map((r: any) => r.data)
          .filter(Boolean)
          .filter((p: Player) => p && p.id && !deletedSet.has(p.id));

        // Purge any ghost deleted players that may linger in Supabase
        const ghosts = playersRes.data
          .map((r: any) => r.data?.id)
          .filter((id: string) => id && deletedSet.has(id));
        if (ghosts.length > 0) {
          supabase.from('players').delete().in('id', ghosts).then();
        }
      } else {
        players = this.getPlayers().filter(p => !deletedSet.has(p.id));
        if (players.length > 0) {
          const rows = players.map(p => ({
            id: p.id,
            data: p,
            updated_at: new Date().toISOString(),
          }));
          supabase.from('players').upsert(rows).then(({ error }) => {
            if (error) console.warn('Supabase auto-seed players error:', error.message);
          });
        }
      }

      let days: TournamentDay[] = [];
      if (daysRes.data && Array.isArray(daysRes.data) && daysRes.data.length > 0) {
        days = daysRes.data.map((r: any) => r.data).filter(Boolean);
      } else {
        // Cloud has 0 tournament days: tournament has not started yet!
        days = [];
        try {
          localStorage.removeItem(STORAGE_KEYS.DAYS);
        } catch (e) {}
      }

      const bracket: GrandFinaleBracket | null = finaleRes.data?.data || this.getGrandFinaleBracket();
      const requests: PlayerRegistrationRequest[] = reqRes.data?.data ?? this.getRegistrationRequests();

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

      // Upsert players safely without deleting unselected ones
      if (players.length > 0) {
        const pRows = players.map(p => ({ id: p.id, data: p, updated_at: new Date().toISOString() }));
        await supabase.from('players').upsert(pRows);
      }

      // Upsert tournament days safely
      if (days.length > 0) {
        const dRows = days.map(d => ({ id: d.id, data: d, updated_at: new Date().toISOString() }));
        await supabase.from('tournament_days').upsert(dRows);
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
    localStorage.removeItem(STORAGE_KEYS.DELETED_PLAYER_IDS);

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
      await supabase.from('tournament_settings').delete().eq('id', 'deleted_player_ids');
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
