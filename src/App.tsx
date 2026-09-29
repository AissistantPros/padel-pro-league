import React, { useState, useEffect, useMemo } from 'react';
import type {
  Player,
  TournamentDay,
  TournamentConfig,
  GrandFinaleBracket,
  PlayerRegistrationRequest,
} from './types/index.ts';
import { StorageService, INITIAL_PLAYERS } from './services/storageService.ts';
import { getSupabase } from './services/supabaseClient.ts';
import { buildChampionshipIntelligence } from './utils/intelligenceEngine.ts';
import { Header } from './components/Header.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { StandingsTable } from './components/StandingsTable.tsx';
import { MatchdayLive } from './components/MatchdayLive.tsx';
import { PadelIntelligenceView } from './components/PadelIntelligenceView.tsx';
import { GrandFinaleBracketView } from './components/GrandFinaleBracketView.tsx';
import { PlayersManager } from './components/PlayersManager.tsx';
import { MyProfileView } from './components/MyProfileView.tsx';
import { ConfigModal } from './components/ConfigModal.tsx';
import { AdminModal } from './components/AdminModal.tsx';
import { LoginGate } from './components/LoginGate.tsx';
import { PendingRegistrationsModal } from './components/PendingRegistrationsModal.tsx';

export function App() {
  const [players, setPlayers] = useState<Player[]>(() => StorageService.getPlayers());
  const [days, setDays] = useState<TournamentDay[]>(() => StorageService.getTournamentDays());
  const [config, setConfig] = useState<TournamentConfig>(() => StorageService.getConfig());
  const [grandFinale, setGrandFinale] = useState<GrandFinaleBracket | null>(() => StorageService.getGrandFinaleBracket());
  const [registrationRequests, setRegistrationRequests] = useState<PlayerRegistrationRequest[]>(() => StorageService.getRegistrationRequests());
  const [isPendingRequestsModalOpen, setIsPendingRequestsModalOpen] = useState<boolean>(false);
  
  // Auth state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => StorageService.getIsAdminAuthenticated());
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(() => StorageService.getIsSuperAdminAuthenticated());
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(() => StorageService.getCurrentPlayerId());

  // Automatic Supabase initial hydration and Realtime live subscription
  useEffect(() => {
    const hydrateAndSubscribe = async () => {
      const supabase = getSupabase();
      if (!supabase) return;

      // 1. Initial Pull from cloud
      const cloudData = await StorageService.pullFromCloud();
      if (cloudData) {
        if (cloudData.players !== undefined) {
          setPlayers(cloudData.players);
        }
        if (cloudData.days !== undefined) setDays(cloudData.days);
        if (cloudData.config !== undefined) setConfig(cloudData.config);
        if (cloudData.bracket !== undefined) setGrandFinale(cloudData.bracket);
        if (cloudData.requests !== undefined) setRegistrationRequests(cloudData.requests);
      }

      // 2. Realtime listener for live updates
      const channel = supabase
        .channel('padel_live_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_days' }, (payload: any) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setDays(prevDays => prevDays.filter(d => d.id !== deletedId));
            }
          } else if (payload.new && payload.new.data) {
            const updatedDay = payload.new.data as TournamentDay;
            setDays(prevDays => {
              const idx = prevDays.findIndex(d => d.id === updatedDay.id);
              if (idx !== -1) {
                const copy = [...prevDays];
                copy[idx] = updatedDay;
                return copy;
              }
              return [...prevDays, updatedDay];
            });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload: any) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              StorageService.addDeletedPlayerId(deletedId);
              setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== deletedId));
              if (currentPlayerId === deletedId) {
                handleLogout();
              }
            }
          } else if (payload.new && payload.new.data) {
            const updatedPlayer = payload.new.data as Player;
            const deletedIds = StorageService.getDeletedPlayerIds();
            if (deletedIds.includes(updatedPlayer.id)) {
              // Rogue or stale insertion of an already deleted player! Eradicate immediately
              const sb = getSupabase();
              if (sb) {
                sb.from('players').delete().eq('id', updatedPlayer.id).then();
              }
              setPlayers(prev => prev.filter(p => p.id !== updatedPlayer.id));
              return;
            }
            setPlayers(prev => {
              const idx = prev.findIndex(p => p.id === updatedPlayer.id);
              if (idx !== -1) {
                const copy = [...prev];
                copy[idx] = updatedPlayer;
                return copy;
              }
              return [...prev, updatedPlayer];
            });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_settings' }, (payload: any) => {
          if (payload.new && payload.new.id === 'registration_requests' && payload.new.data) {
            setRegistrationRequests(payload.new.data);
          }
          if (payload.new && payload.new.id === 'main_config' && payload.new.data) {
            setConfig(payload.new.data);
          }
          if (payload.new && payload.new.id === 'deleted_player_ids' && payload.new.data) {
            const deletedIds: string[] = payload.new.data;
            if (Array.isArray(deletedIds)) {
              deletedIds.forEach(id => StorageService.addDeletedPlayerId(id));
              setPlayers(prev => prev.filter(p => !deletedIds.includes(p.id)));
              if (currentPlayerId && deletedIds.includes(currentPlayerId)) {
                handleLogout();
              }
            }
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    hydrateAndSubscribe();
  }, []);

  // Track player click engagement telemetry
  useEffect(() => {
    if (!currentPlayerId) return;

    let clicksBuffer = 0;
    const handleClick = () => {
      clicksBuffer += 1;
    };

    window.addEventListener('click', handleClick);

    const interval = setInterval(() => {
      if (clicksBuffer > 0) {
        StorageService.recordUserClicks(currentPlayerId, clicksBuffer);
        clicksBuffer = 0;
      }
    }, 10000);

    return () => {
      window.removeEventListener('click', handleClick);
      clearInterval(interval);
      if (clicksBuffer > 0) {
        StorageService.recordUserClicks(currentPlayerId, clicksBuffer);
      }
    };
  }, [currentPlayerId]);

  const [activeTab, setActiveTab] = useState<'standings' | 'matchday' | 'intelligence' | 'grand_finale' | 'players' | 'settings' | 'my_profile'>('standings');
  const [selectedPlayerForIntelligence, setSelectedPlayerForIntelligence] = useState<string>('');

  const currentPlayer = useMemo(() => {
    return players.find(p => p.id === currentPlayerId) || null;
  }, [players, currentPlayerId]);

  const effectiveIsAdmin = isAdmin || isSuperAdmin || currentPlayer?.role === 'admin' || currentPlayer?.role === 'superadmin';
  const effectiveIsSuperAdmin = isSuperAdmin || currentPlayer?.role === 'superadmin';

  const pendingRequestsOnly = useMemo(() => {
    return registrationRequests.filter(r => !r.status || r.status === 'pending');
  }, [registrationRequests]);

  const statsList = useMemo(() => {
    return buildChampionshipIntelligence(players, days, config);
  }, [players, days, config]);

  const handleSavePlayers = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    StorageService.savePlayers(newPlayers);
  };

  const handleUpdateSinglePlayer = (updatedPlayer: Player) => {
    const updated = players.map(p => (p.id === updatedPlayer.id ? updatedPlayer : p));
    handleSavePlayers(updated);
  };

  const handleSelectCurrentPlayer = (playerId: string | null) => {
    setCurrentPlayerId(playerId);
    StorageService.setCurrentPlayerId(playerId);
  };

  const handleSaveDays = (newDays: TournamentDay[]) => {
    setDays(newDays);
    StorageService.saveTournamentDays(newDays);
  };

  const handleSaveConfig = (newConfig: TournamentConfig) => {
    setConfig(newConfig);
    StorageService.saveConfig(newConfig);
  };

  const handleSaveGrandFinale = (bracket: GrandFinaleBracket | null) => {
    setGrandFinale(bracket);
    StorageService.saveGrandFinaleBracket(bracket);
  };

  const handleAuthenticateAdmin = () => {
    setIsAdmin(true);
    StorageService.setAdminAuthenticated(true);
  };

  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    StorageService.setAdminAuthenticated(false);
  };

  const handleAuthenticateSuperAdmin = () => {
    setIsSuperAdmin(true);
    StorageService.setSuperAdminAuthenticated(true);
  };

  const handleLogoutSuperAdmin = () => {
    setIsSuperAdmin(false);
    StorageService.setSuperAdminAuthenticated(false);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setCurrentPlayerId(null);
    StorageService.setAdminAuthenticated(false);
    StorageService.setSuperAdminAuthenticated(false);
    StorageService.setCurrentPlayerId(null);
    setActiveTab('standings');
  };

  const handleLoginSuccess = (player: Player | null, role: 'player' | 'admin' | 'superadmin') => {
    if (player) {
      handleSelectCurrentPlayer(player.id);
      if (player.role === 'admin') {
        setIsAdmin(true);
        StorageService.setAdminAuthenticated(true);
      } else if (player.role === 'superadmin') {
        setIsAdmin(true);
        setIsSuperAdmin(true);
        StorageService.setAdminAuthenticated(true);
        StorageService.setSuperAdminAuthenticated(true);
      }
    } else {
      if (role === 'superadmin') {
        setIsAdmin(true);
        setIsSuperAdmin(true);
        StorageService.setAdminAuthenticated(true);
        StorageService.setSuperAdminAuthenticated(true);
        // Link to superadmin player (Esteban) or clear test IDs
        const adminPlayer = players.find(p => p.role === 'superadmin' || p.pin === 'EST99');
        handleSelectCurrentPlayer(adminPlayer ? adminPlayer.id : 'p_1');
      } else if (role === 'admin') {
        setIsAdmin(true);
        StorageService.setAdminAuthenticated(true);
        handleSelectCurrentPlayer(null);
      }
    }
  };

  const handleExportData = () => {
    const backup = {
      config,
      players,
      days,
      grandFinale,
      registrationRequests,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `g20_torneo_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.players) handleSavePlayers(data.players);
      if (data.days) handleSaveDays(data.days);
      if (data.config) handleSaveConfig(data.config);
      if (data.grandFinale !== undefined) handleSaveGrandFinale(data.grandFinale);
      if (data.registrationRequests) {
        setRegistrationRequests(data.registrationRequests);
        StorageService.saveRegistrationRequests(data.registrationRequests);
      }
      return true;
    } catch (e) {
      console.error('Error importing backup:', e);
      return false;
    }
  };

  const handleResetData = async () => {
    await StorageService.resetAllData();
    setPlayers(INITIAL_PLAYERS);
    StorageService.savePlayers(INITIAL_PLAYERS);
    setDays([]);
    setGrandFinale(null);
    setRegistrationRequests([]);
  };

  const handleSelectPlayerForIntelligence = (playerId: string) => {
    setSelectedPlayerForIntelligence(playerId);
    setActiveTab('intelligence');
  };

  const handleChangeRankingSystem = (system: 'bayesian' | 'total_points' | 'avg_points') => {
    const updated = { ...config, rankingSystem: system };
    handleSaveConfig(updated);
  };

  // STRICT ACCESS GATE: If user has not authenticated with their Player PIN or Admin/SuperAdmin PIN, render LoginGate
  const isAuthenticated = Boolean(currentPlayer || isAdmin || isSuperAdmin);

  if (!isAuthenticated) {
    return (
      <LoginGate
        config={config}
        players={players}
        onLoginSuccess={handleLoginSuccess}
        onRequestSubmitted={(newReq) => {
          setRegistrationRequests(prev => [newReq, ...prev]);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col selection:bg-[#30D158] selection:text-black overflow-x-hidden max-w-[100vw]">
      {/* Top Header (iOS Navigation Bar) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={effectiveIsAdmin}
        isSuperAdmin={effectiveIsSuperAdmin}
        currentPlayer={currentPlayer}
        pendingRequestsCount={pendingRequestsOnly.length}
        onOpenPendingRequests={() => setIsPendingRequestsModalOpen(true)}
        config={config}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-28 md:pb-12">
        {activeTab === 'standings' && (
          <StandingsTable
            stats={statsList}
            days={days}
            players={players}
            config={config}
            isAdmin={effectiveIsAdmin}
            onSelectPlayerForIntelligence={handleSelectPlayerForIntelligence}
            onChangeRankingSystem={handleChangeRankingSystem}
          />
        )}

        {activeTab === 'matchday' && (
          <MatchdayLive
            days={days}
            players={players}
            statsList={statsList}
            config={config}
            isAdmin={effectiveIsAdmin}
            onSaveDays={handleSaveDays}
            onRequestAdmin={() => setIsAdminModalOpen(true)}
            onSavePlayers={handleSavePlayers}
          />
        )}

        {activeTab === 'players' && (
          <PlayersManager
            players={players}
            statsList={statsList}
            isAdmin={effectiveIsAdmin}
            isSuperAdmin={effectiveIsSuperAdmin}
            pendingRequests={pendingRequestsOnly}
            onOpenPendingRequests={() => setIsPendingRequestsModalOpen(true)}
            onSavePlayers={handleSavePlayers}
            onSelectPlayerForIntelligence={handleSelectPlayerForIntelligence}
          />
        )}

        {activeTab === 'intelligence' && (
          <PadelIntelligenceView
            statsList={statsList}
            players={players}
            selectedPlayerId={selectedPlayerForIntelligence}
            onSelectPlayer={(id) => setSelectedPlayerForIntelligence(id)}
          />
        )}

        {activeTab === 'grand_finale' && (
          <GrandFinaleBracketView
            bracket={grandFinale}
            statsList={statsList}
            config={config}
            isAdmin={effectiveIsAdmin}
            onSaveBracket={handleSaveGrandFinale}
          />
        )}

        {activeTab === 'my_profile' && (
          <MyProfileView
            players={players}
            currentPlayerId={currentPlayerId}
            statsList={statsList}
            onSelectCurrentPlayer={handleSelectCurrentPlayer}
            onUpdatePlayer={handleUpdateSinglePlayer}
            onRequestAdmin={() => setIsAdminModalOpen(true)}
          />
        )}

        {activeTab === 'settings' && effectiveIsAdmin && (
          <ConfigModal
            config={config}
            players={players}
            isAdmin={effectiveIsAdmin}
            isSuperAdmin={effectiveIsSuperAdmin}
            onSaveConfig={handleSaveConfig}
            onSavePlayers={handleSavePlayers}
            onAuthenticateSuperAdmin={handleAuthenticateSuperAdmin}
            onLogoutSuperAdmin={handleLogoutSuperAdmin}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Apple Style Minimalist Credits Footer */}
      <footer className="w-full border-t border-white/5 bg-[#000000] pt-10 pb-12 px-6 text-center text-xs text-[#8E8E93] space-y-2 select-none mb-32 md:mb-0">
        <div className="flex items-center justify-center space-x-2 flex-wrap">
          <span className="font-semibold text-white">🎾 {config.tournamentName}</span>
          <span>•</span>
          <span className="text-[#FFD60A] font-medium">{config.editionName}</span>
        </div>
        <div className="text-xs text-[#8E8E93] max-w-md mx-auto leading-relaxed">
          Desarrollado por <strong className="text-white font-semibold">Esteban Reyna</strong> • <span className="font-mono text-[#8E8E93]">v2.5.0</span> • <strong className="text-white font-semibold">IA Factory Cancún</strong> en colaboración con <strong className="text-white font-semibold">Marketing 101 Cancún</strong>
        </div>
      </footer>

      {/* Native iOS Bottom Tab Bar */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={effectiveIsAdmin} />

      {/* Admin Unlock Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        config={config}
        players={players}
        onAuthenticate={handleAuthenticateAdmin}
        onAuthenticateSuperAdmin={handleAuthenticateSuperAdmin}
        onSelectCurrentPlayer={handleSelectCurrentPlayer}
      />

      {/* Pending Player Registrations Review Modal (Admins only) */}
      <PendingRegistrationsModal
        isOpen={isPendingRequestsModalOpen}
        onClose={() => setIsPendingRequestsModalOpen(false)}
        requests={registrationRequests}
        players={players}
        onApproveRequest={(newPlayer, remainingRequests) => {
          setPlayers(prev => [...prev.filter(p => p.id !== newPlayer.id), newPlayer]);
          setRegistrationRequests(remainingRequests);
        }}
        onRejectRequest={(remainingRequests) => {
          setRegistrationRequests(remainingRequests);
        }}
      />
    </div>
  );
}

export default App;
