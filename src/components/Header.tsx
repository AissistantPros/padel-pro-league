import React from 'react';
import { Trophy, Activity, Users, Award, Settings, Lock, Unlock, Zap, ShieldCheck, Flame, Sparkles } from 'lucide-react';
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
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 bg-[#0B0F19]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Tournament Name & Edition Badge */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('standings')}>
            {config.tournamentLogoUrl ? (
              <img
                src={config.tournamentLogoUrl}
                alt="Logo Oficial del Torneo"
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-emerald-400 shadow-neon bg-slate-900"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center shadow-neon font-display text-xl sm:text-2xl font-black text-black">
                🎾
              </div>
            )}

            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-extrabold font-display text-white tracking-tight">
                  {config.tournamentName || 'G20 by Peter Inc. 🎾'}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {config.editionName || `${config.editionNumber || 3}er Torneo Oficial`}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate max-w-[260px] sm:max-w-none">
                Edición Oficial Activa • Clasificación de Temporada & Histórico Global
              </p>
            </div>
          </div>

          {/* Admin Switcher & Status */}
          <div className="flex items-center space-x-2">
            {isAdmin ? (
              <div className="flex items-center space-x-2">
                <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Admin Activo
                </span>
                <button
                  onClick={onLogoutAdmin}
                  title="Cerrar sesión de Administrador"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors flex items-center"
                >
                  <Unlock className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Salir Admin
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold border border-slate-700/80 transition-all flex items-center hover:border-emerald-500/50 hover:text-emerald-300"
              >
                <Lock className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Acceso Admin
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1.5 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none border-t border-slate-800/60">
          <button
            onClick={() => setActiveTab('standings')}
            className={`flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'standings'
                ? 'bg-emerald-500 text-black shadow-neon'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 mr-1.5 text-amber-950 sm:text-inherit" />
            Tabla General
          </button>

          <button
            onClick={() => setActiveTab('matchday')}
            className={`flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'matchday'
                ? 'bg-emerald-500 text-black shadow-neon'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 mr-1.5" />
            Jornada en Vivo
          </button>

          <button
            onClick={() => setActiveTab('intelligence')}
            className={`flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'intelligence'
                ? 'bg-blue-600 text-white shadow-blue-glow'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 mr-1.5 text-cyan-300" />
            Padel Intelligence (Sinergias & Némesis)
          </button>

          <button
            onClick={() => setActiveTab('grand_finale')}
            className={`flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'grand_finale'
                ? 'bg-amber-500 text-black shadow-gold-glow'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4 mr-1.5" />
            Gran Final (Playoffs)
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'players'
                ? 'bg-slate-700 text-white'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 mr-1.5" />
            Jugadores & Fotos
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'settings'
                ? 'bg-slate-700 text-white'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 mr-1.5" />
            Ajustes & Imagen
          </button>
        </div>
      </div>
    </header>
  );
};
