import React, { useState, useEffect, useMemo } from 'react';
import type {
  Player,
  TournamentDay,
  TournamentConfig,
  GrandFinaleBracket,
} from './types/index.ts';
import { StorageService } from './services/storageService.ts';
import { getSupabase } from './services/supabaseClient.ts';
import { buildChampionshipIntelligence } from './utils/intelligenceEngine.ts';
import { Header } from './components/Header.tsx';
import { StandingsTable } from './components/StandingsTable.tsx';
import { MatchdayLive } from './components/MatchdayLive.tsx';
import { PadelIntelligenceView } from './components/PadelIntelligenceView.tsx';
import { GrandFinaleBracketView } from './components/GrandFinaleBracketView.tsx';
import { PlayersManager } from './components/PlayersManager.tsx';
import { ConfigModal } from './components/ConfigModal.tsx';
import { AdminModal } from './components/AdminModal.tsx';

export function App() {
  const [players, setPlayers] = useState<Player[]>(() => StorageService.getPlayers());
  const [days, setDays] = useState<TournamentDay[]>(() => StorageService.getTournamentDays());
  const [config, setConfig] = useState<TournamentConfig>(() => StorageService.getConfig());
  const [grandFinale, setGrandFinale] = useState<GrandFinaleBracket | null>(() => StorageService.getGrandFinale());
  const [isAdmin, setIsAdmin] = useState<boolean>(() => StorageService.isAdminAuthenticated());
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  // Automatic Supabase initial hydration and Realtime live subscription
  useEffect(() => {
    const hydrateAndSubscribe = async () => {
      const supabase = getSupabase();
      if (!supabase) return;

      // 1. Initial Pull from cloud
      const cloudData = await StorageService.syncFromSupabase();
      if (cloudData) {
        if (cloudData.players) setPlayers(cloudData.players);
        if (cloudData.days) setDays(cloudData.days);
        if (cloudData.config) setConfig(cloudData.config);
        if (cloudData.grandFinale !== undefined) setGrandFinale(cloudData.grandFinale);
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

  const [activeTab, setActiveTab] = useState<'standings' | 'matchday' | 'intelligence' | 'grand_finale' | 'players' | 'settings'>('standings');
  const [selectedPlayerForIntelligence, setSelectedPlayerForIntelligence] = useState<string>('');

  // Recompute Padel Intelligence whenever players, matchdays, or formula configs change
  const statsList = useMemo(() => {
    return buildChampionshipIntelligence(players, days, config);
  }, [players, days, config]);

  const handleSavePlayers = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    StorageService.savePlayers(newPlayers);
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
    StorageService.saveGrandFinale(bracket);
  };

  const handleAuthenticateAdmin = () => {
    setIsAdmin(true);
    StorageService.setAdminAuthenticated(true);
  };

  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    StorageService.setAdminAuthenticated(false);
  };

  const handleExportData = () => {
    const jsonStr = StorageService.exportDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `padel_torneo_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonStr: string): boolean => {
    const success = StorageService.importDatabase(jsonStr);
    if (success) {
      setPlayers(StorageService.getPlayers());
      setDays(StorageService.getTournamentDays());
      setConfig(StorageService.getConfig());
      setGrandFinale(StorageService.getGrandFinale());
    }
    return success;
  };

  const handleResetData = () => {
    StorageService.resetTournamentData();
    setPlayers(StorageService.getPlayers());
    setDays(StorageService.getTournamentDays());
    setConfig(StorageService.getConfig());
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
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        setIsAdminModalOpen={setIsAdminModalOpen}
        config={config}
        onLogoutAdmin={handleLogoutAdmin}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
            isAdmin={isAdmin}
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
            isAdmin={isAdmin}
            onSaveBracket={handleSaveGrandFinale}
          />
        )}

        {activeTab === 'players' && (
          <PlayersManager
            players={players}
            statsList={statsList}
            isAdmin={isAdmin}
            onSavePlayers={handleSavePlayers}
            onSelectPlayerForIntelligence={handleSelectPlayerForIntelligence}
          />
        )}

        {activeTab === 'settings' && (
          <ConfigModal
            config={config}
            isAdmin={isAdmin}
            onSaveConfig={handleSaveConfig}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 glass-panel">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>🎾 Padel Pro Tournament Manager & Intelligence Engine</span>
          <span className="font-mono text-slate-600">v1.0.0 • React + TypeScript + Tailwind</span>
        </div>
      </footer>

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
