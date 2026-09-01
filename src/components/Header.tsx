import React from 'react';
import { Trophy, Activity, Users, Award, Settings, Lock, Unlock, Zap, ShieldCheck } from 'lucide-react';
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
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Tournament Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('standings')}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-neon font-display text-2xl font-black text-black">
              🎾
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-xl font-bold font-display text-white tracking-wide">
                  {config.tournamentName}
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Zap className="w-3 h-3 mr-1" /> INTELLIGENCE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Puntuación Individual • Rotación Dinámica • Desempates Pro
              </p>
            </div>
          </div>

          {/* Admin Switcher & Status */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {isAdmin ? (
              <div className="flex items-center space-x-2">
                <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Modo Administrador
                </span>
                <button
                  onClick={onLogoutAdmin}
                  title="Cerrar sesión de Administrador"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center"
                >
                  <Unlock className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Salir Admin
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 text-xs font-medium border border-slate-700/80 transition-all flex items-center hover:border-emerald-500/50 hover:text-emerald-300"
              >
                <Lock className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Acceso Admin
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none border-t border-slate-800/60">
          <button
            onClick={() => setActiveTab('standings')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'standings'
                ? 'bg-emerald-500 text-black shadow-neon font-bold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 mr-2" />
            Tabla General
          </button>

          <button
            onClick={() => setActiveTab('matchday')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'matchday'
                ? 'bg-emerald-500 text-black shadow-neon font-bold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 mr-2" />
            Jornada en Vivo
          </button>

          <button
            onClick={() => setActiveTab('intelligence')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'intelligence'
                ? 'bg-blue-600 text-white shadow-blue-glow font-bold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 mr-2 text-cyan-300" />
            Padel Intelligence (H2H)
          </button>

          <button
            onClick={() => setActiveTab('grand_finale')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'grand_finale'
                ? 'bg-amber-500 text-black shadow-gold-glow font-bold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4 mr-2" />
            Gran Final (Playoffs)
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'players'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Jugadores
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'settings'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Ajustes
          </button>
        </div>
      </div>
    </header>
  );
};
