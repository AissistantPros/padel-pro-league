import React from 'react';
import { Trophy, Activity, Users, Award, Settings, Lock, Unlock, Zap, ShieldCheck, Sparkles } from 'lucide-react';
import type { TournamentConfig } from '../types/index.ts';

interface HeaderProps {
  activeTab: 'standings' | 'matchday' | 'intelligence' | 'grand_finale' | 'players' | 'settings';
  setActiveTab: (tab: 'standings' | 'matchday' | 'intelligence' | 'grand_finale' | 'players' | 'settings') => void;
  isAdmin: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  config: TournamentConfig;
  onLogoutAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isAdmin,
  setIsAdminModalOpen,
  config,
  onLogoutAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 bg-[#0B0F19]/95 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main App Top Bar */}
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Tournament Name */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => setActiveTab('standings')}
          >
            {config.tournamentLogoUrl ? (
              <img
                src={config.tournamentLogoUrl}
                alt="Logo Oficial"
                className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-emerald-400 shadow-neon bg-slate-900 flex-shrink-0"
              />
            ) : (
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center shadow-neon font-display text-2xl font-black text-black flex-shrink-0">
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
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Sparkles className="w-3 h-3 mr-1 text-amber-400" />
                  {config.editionName || `${config.editionNumber || 3}er Torneo`}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 font-bold hidden sm:inline">
                  • En Vivo
                </span>
              </div>
            </div>
          </div>

          {/* Admin Control */}
          <div className="flex items-center space-x-2">
            {isAdmin ? (
              <div className="flex items-center space-x-2">
                <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <ShieldCheck className="w-4 h-4 mr-1 text-emerald-400" /> Admin
                </span>
                <button
                  onClick={onLogoutAdmin}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 active:bg-slate-700 text-slate-200 text-xs sm:text-sm font-black border border-slate-700 transition-all flex items-center"
                >
                  <Unlock className="w-4 h-4 mr-1.5 text-emerald-400" /> Salir
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 active:bg-slate-700 text-slate-200 text-xs sm:text-sm font-black border border-slate-700 transition-all flex items-center hover:border-emerald-500"
              >
                <Lock className="w-4 h-4 mr-1.5 text-slate-400" /> Admin
              </button>
            )}
          </div>
        </div>

        {/* Desktop Tab Navigation (Hidden on Mobile, replaced by Native Bottom Bar) */}
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

          <button
            onClick={() => setActiveTab('players')}
            className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === 'players'
                ? 'bg-slate-700 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Jugadores & Fotos
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
            Ajustes & Imagen
          </button>
        </div>
      </div>
    </header>
  );
};
