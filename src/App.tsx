import React, { useState, useEffect, useMemo } from 'react';
import type {
  Player,
  TournamentDay,
  TournamentConfig,
  GrandFinaleBracket,
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

export function App() {
  const [players, setPlayers] = useState<Player[]>(() => {
    const loaded = StorageService.getPlayers();
    return loaded.length > 0 ? loaded : INITIAL_PLAYERS;
  });
  const [days, setDays] = useState<TournamentDay[]>(() => StorageService.getTournamentDays());
  const [config, setConfig] = useState<TournamentConfig>(() => StorageService.getConfig());
  const [grandFinale, setGrandFinale] = useState<GrandFinaleBracket | null>(() => StorageService.getGrandFinaleBracket());
  
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
        if (cloudData.players && cloudData.players.length > 0) {
          setPlayers(cloudData.players);
        } else {
          setPlayers(INITIAL_PLAYERS);
          StorageService.savePlayers(INITIAL_PLAYERS);
        }
        if (cloudData.days) setDays(cloudData.days);
        if (cloudData.config) setConfig(cloudData.config);
        if (cloudData.bracket !== undefined) setGrandFinale(cloudData.bracket);
      }

      // 2. Realtime listener for live score updates on courts
      const channel = supabase
        .channel('padel_live_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_days' }, (payload: any) => {
          if (payload.new && payload.new.data) {
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
          if (payload.new && payload.new.data) {
            const updatedPlayer = payload.new.data as Player;
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
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    hydrateAndSubscribe();
  }, []);

  const [activeTab, setActiveTab] = useState<'standings' | 'matchday' | 'intelligence' | 'grand_finale' | 'players' | 'settings' | 'my_profile'>('standings');
  const [selectedPlayerForIntelligence, setSelectedPlayerForIntelligence] = useState<string>('');

  const currentPlayer = useMemo(() => {
    return players.find(p => p.id === currentPlayerId) || null;
  }, [players, currentPlayerId]);

  // If active player is marked as admin, they also get admin permissions
  const effectiveIsAdmin = isAdmin || currentPlayer?.role === 'admin';

  // Recompute Padel Intelligence whenever players, matchdays, or formula configs change
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

  const handleExportData = () => {
    const backup = {
      config,
      players,
      days,
      grandFinale,
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
  };

  const handleSelectPlayerForIntelligence = (playerId: string) => {
    setSelectedPlayerForIntelligence(playerId);
    setActiveTab('intelligence');
  };

  const handleChangeRankingSystem = (system: 'bayesian' | 'total_points' | 'avg_points') => {
    const updated = { ...config, rankingSystem: system };
    handleSaveConfig(updated);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black overflow-x-hidden max-w-[100vw]">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={effectiveIsAdmin}
        currentPlayer={currentPlayer}
        setIsAdminModalOpen={setIsAdminModalOpen}
        config={config}
        onLogoutAdmin={handleLogoutAdmin}
      />

      {/* Main Content Area with Bottom Bar Safe Margin */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 pb-28 md:pb-12">
        {activeTab === 'standings' && (
          <StandingsTable
            stats={statsList}
            config={config}
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

        {activeTab === 'players' && effectiveIsAdmin && (
          <PlayersManager
            players={players}
            statsList={statsList}
            isAdmin={effectiveIsAdmin}
            onSavePlayers={handleSavePlayers}
            onSelectPlayerForIntelligence={handleSelectPlayerForIntelligence}
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
            isAdmin={effectiveIsAdmin}
            isSuperAdmin={isSuperAdmin}
            onSaveConfig={handleSaveConfig}
            onAuthenticateSuperAdmin={handleAuthenticateSuperAdmin}
            onLogoutSuperAdmin={handleLogoutSuperAdmin}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Official App Credits Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-[#070A12] py-8 px-4 text-center text-xs text-slate-400 space-y-2 select-none mb-16 md:mb-0">
        <div className="flex items-center justify-center space-x-2 flex-wrap">
          <span className="font-extrabold text-slate-300">🎾 {config.tournamentName}</span>
          <span>•</span>
          <span className="text-amber-400 font-bold">{config.editionName}</span>
        </div>
        <div className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          Desarrollado por <strong className="text-emerald-400 font-black">Esteban Reyna</strong> • <span className="font-mono text-slate-300 font-bold">v2.4.0</span> • <strong className="text-cyan-400 font-bold">IA Factory Cancún</strong> en colaboración con <strong className="text-amber-400 font-bold">Marketing 101 Cancún</strong>
        </div>
      </footer>

      {/* Native Mobile App Bottom Navigation Bar */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={effectiveIsAdmin} />

      {/* Admin Unlock Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        config={config}
        onAuthenticate={handleAuthenticateAdmin}
      />
    </div>
  );
}

export default App;
