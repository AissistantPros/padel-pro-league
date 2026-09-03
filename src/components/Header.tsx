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
    <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-2xl border-b border-white/10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main App Top Bar */}
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Tournament Name */}
          <div
            className="flex items-center space-x-3 cursor-pointer ios-touch"
            onClick={() => setActiveTab('standings')}
          >
            {config.tournamentLogoUrl ? (
              <img
                src={config.tournamentLogoUrl}
                alt="Logo Oficial"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border border-white/15 bg-[#1C1C1E] flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#1C1C1E] border border-white/10 flex items-center justify-center text-xl flex-shrink-0">
                🎾
              </div>
            )}

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate leading-tight">
                {config.tournamentName || 'G20 by Peter Inc. 🎾'}
              </h1>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[11px] font-semibold text-[#8E8E93]">
                  {config.editionName || `${config.editionNumber || 3}er Torneo`}
                </span>
              </div>
            </div>
          </div>

          {/* Right Area: Player Identity & Admin Toggle */}
          <div className="flex items-center space-x-2">
            {/* Current Player Indicator */}
            {currentPlayer ? (
              <button
                onClick={() => setActiveTab('my_profile')}
                className="flex items-center space-x-2 p-1 sm:px-3 sm:py-1.5 rounded-full bg-[#1C1C1E] border border-white/10 hover:border-white/20 transition-all ios-touch"
                title="Mi perfil"
              >
                {currentPlayer.avatar ? (
                  <img src={currentPlayer.avatar} alt={currentPlayer.name} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#2C2C2E] text-[#30D158] font-bold text-xs flex items-center justify-center">
                    {currentPlayer.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-white hidden sm:inline max-w-[90px] truncate">
                  {currentPlayer.name.split(' ')[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('my_profile')}
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full bg-[#1C1C1E] text-[#8E8E93] hover:text-white text-xs font-semibold border border-white/10 ios-touch"
              >
                <User className="w-3.5 h-3.5 mr-1 text-[#30D158]" /> Mi Perfil
              </button>
            )}

            {/* Admin Control Button */}
            {isAdmin ? (
              <div className="flex items-center space-x-2">
                <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFD60A]/15 text-[#FFD60A] border border-[#FFD60A]/30">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Admin
                </span>
                <button
                  onClick={onLogoutAdmin}
                  className="px-3 py-1.5 rounded-full bg-[#2C2C2E] text-white text-xs font-semibold border border-white/10 ios-touch"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="px-3 py-1.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-[#0A84FF] text-xs font-semibold border border-white/10 ios-touch flex items-center"
              >
                <Lock className="w-3.5 h-3.5 mr-1 text-[#0A84FF]" /> Admin
              </button>
            )}
          </div>
        </div>

        {/* Desktop Navigation Segmented Control */}
        <div className="hidden md:flex py-2 border-t border-white/5">
          <div className="ios-segmented-control w-full">
            <button
              onClick={() => setActiveTab('standings')}
              className={`ios-segmented-item ${activeTab === 'standings' ? 'active' : ''}`}
            >
              🏆 Clasificación
            </button>
            <button
              onClick={() => setActiveTab('matchday')}
              className={`ios-segmented-item ${activeTab === 'matchday' ? 'active' : ''}`}
            >
              🎾 Jornada en Vivo
            </button>
            <button
              onClick={() => setActiveTab('players')}
              className={`ios-segmented-item ${activeTab === 'players' ? 'active' : ''}`}
            >
              👥 Jugadores
            </button>
            <button
              onClick={() => setActiveTab('intelligence')}
              className={`ios-segmented-item ${activeTab === 'intelligence' ? 'active' : ''}`}
            >
              ⚡ Radar PI
            </button>
            <button
              onClick={() => setActiveTab('grand_finale')}
              className={`ios-segmented-item ${activeTab === 'grand_finale' ? 'active' : ''}`}
            >
              👑 Finales
            </button>
            <button
              onClick={() => setActiveTab('my_profile')}
              className={`ios-segmented-item ${activeTab === 'my_profile' ? 'active' : ''}`}
            >
              👤 Mi Perfil
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`ios-segmented-item ${activeTab === 'settings' ? 'active' : ''}`}
              >
                ⚙️ Ajustes
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
