import React from 'react';
import { Trophy, Activity, Users, Award, Settings, Lock, Unlock, Zap, ShieldCheck, Sparkles, User } from 'lucide-react';
import type { TournamentConfig, Player } from '../types/index.ts';

interface HeaderProps {
  activeTab: 'standings' | 'matchday' | 'intelligence' | 'grand_finale' | 'players' | 'settings' | 'my_profile';
  setActiveTab: (tab: 'standings' | 'matchday' | 'intelligence' | 'grand_finale' | 'players' | 'settings' | 'my_profile') => void;
  isAdmin: boolean;
  currentPlayer: Player | null;
  setIsAdminModalOpen: (open: boolean) => void;
  config: TournamentConfig;
  onLogoutAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isAdmin,
  currentPlayer,
  setIsAdminModalOpen,
  config,
  onLogoutAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 bg-[#0B0F19]/95 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main App Top Bar */}
        <div className="flex items-center justify-between h-18 sm:h-20">
          {/* Logo & Tournament Name */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => setActiveTab('standings')}
          >
            {config.tournamentLogoUrl ? (
              <img
                src={config.tournamentLogoUrl}
                alt="Logo Oficial"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-emerald-400 shadow-neon bg-slate-900 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center shadow-neon font-display text-2xl font-black text-black flex-shrink-0">
                🎾
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-xl font-black font-display text-white tracking-tight truncate">
                  {config.tournamentName || 'G20 by Peter Inc. 🎾'}
                </h1>
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Sparkles className="w-3 h-3 mr-1 text-amber-400" />
                  {config.editionName || `${config.editionNumber || 3}er Torneo`}
                </span>
              </div>
            </div>
          </div>

          {/* Right Area: Player Identity & Admin Toggle */}
          <div className="flex items-center space-x-2">
            {/* Current Player quick indicator */}
            {currentPlayer ? (
              <button
                onClick={() => setActiveTab('my_profile')}
                className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-emerald-500/60 transition-colors"
                title="Ver y editar mi perfil"
              >
                {currentPlayer.avatar ? (
                  <img src={currentPlayer.avatar} alt={currentPlayer.name} className="w-8 h-8 rounded-full object-cover border border-emerald-400" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-emerald-400 font-black text-xs flex items-center justify-center">
                    {currentPlayer.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-black text-white hidden sm:inline max-w-[100px] truncate">
                  {currentPlayer.name.split(' ')[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('my_profile')}
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800"
              >
                <User className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Mi Perfil
              </button>
            )}

            {/* Admin Control */}
            {isAdmin ? (
              <div className="flex items-center space-x-2">
                <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <ShieldCheck className="w-4 h-4 mr-1 text-amber-400" /> Admin
                </span>
                <button
                  onClick={onLogoutAdmin}
                  className="px-3.5 py-2 rounded-2xl bg-slate-800 active:bg-slate-700 text-slate-200 text-xs sm:text-sm font-black border border-slate-700 transition-all flex items-center"
                >
                  <Unlock className="w-4 h-4 mr-1 text-emerald-400" /> Salir Admin
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="px-3.5 py-2 rounded-2xl bg-slate-800 active:bg-slate-700 text-slate-200 text-xs sm:text-sm font-black border border-slate-700 transition-all flex items-center hover:border-emerald-500"
              >
                <Lock className="w-4 h-4 mr-1.5 text-slate-400" /> Soy Admin
              </button>
            )}
          </div>
        </div>

        {/* Desktop Tab Navigation */}
        <div className="hidden md:flex space-x-2 overflow-x-auto py-2.5 border-t border-slate-800/60">
          <button
            onClick={() => setActiveTab('standings')}
            className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === 'standings'
                ? 'bg-emerald-500 text-black shadow-neon'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 mr-2" />
            Tabla General
          </button>

          <button
            onClick={() => setActiveTab('matchday')}
            className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === 'matchday'
                ? 'bg-emerald-500 text-black shadow-neon'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 mr-2" />
            Jornada en Vivo
          </button>

          <button
            onClick={() => setActiveTab('intelligence')}
            className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === 'intelligence'
                ? 'bg-blue-600 text-white shadow-blue-glow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 mr-2 text-cyan-300" />
            Padel Intelligence
          </button>

          <button
            onClick={() => setActiveTab('grand_finale')}
            className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === 'grand_finale'
                ? 'bg-amber-500 text-black shadow-gold-glow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4 mr-2" />
            Gran Final (Playoffs)
          </button>

          {isAdmin ? (
            <>
              <button
                onClick={() => setActiveTab('players')}
                className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === 'players'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Roster & Admins
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === 'settings'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Ajustes Torneo
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab('my_profile')}
              className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeTab === 'my_profile'
                  ? 'bg-emerald-500 text-black shadow-neon'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Mi Perfil
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
