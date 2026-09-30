import React from 'react';
import {
  Trophy,
  Activity,
  Users,
  Award,
  Settings,
  Lock,
  Unlock,
  Zap,
  ShieldCheck,
  Sparkles,
  User,
  Crown,
  LogOut,
  Bell,
  Smartphone,
} from 'lucide-react';
import type { TournamentConfig, Player } from '../types/index.ts';

interface HeaderProps {
  activeTab: 'standings' | 'matchday' | 'intelligence' | 'grand_finale' | 'players' | 'settings' | 'my_profile';
  setActiveTab: (tab: 'standings' | 'matchday' | 'intelligence' | 'grand_finale' | 'players' | 'settings' | 'my_profile') => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  currentPlayer: Player | null;
  pendingRequestsCount?: number;
  onOpenPendingRequests?: () => void;
  onOpenInstallApp?: () => void;
  config: TournamentConfig;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isAdmin,
  isSuperAdmin,
  currentPlayer,
  pendingRequestsCount = 0,
  onOpenPendingRequests,
  onOpenInstallApp,
  config,
  onLogout,
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
                <span className="text-xs sm:text-sm font-semibold text-[#FFD60A]">
                  {config.editionName || 'Tercera Edición'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Area: Roles Badges, Notifications & Logout */}
          <div className="flex items-center space-x-2">
            {/* Pending Requests Bell Notification */}
            {(isAdmin || isSuperAdmin) && pendingRequestsCount > 0 && onOpenPendingRequests && (
              <button
                type="button"
                onClick={onOpenPendingRequests}
                className="relative p-2 rounded-full bg-[#FFD60A]/15 border border-[#FFD60A]/40 text-[#FFD60A] ios-touch animate-pulse"
                title={`${pendingRequestsCount} solicitudes pendientes`}
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF453A] text-white text-[9px] font-black flex items-center justify-center shadow-md">
                  {pendingRequestsCount}
                </span>
              </button>
            )}

            {/* Role Badges */}
            {isSuperAdmin ? (
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-[#FFD60A]/20 via-[#FF9F0A]/20 to-[#FFD60A]/20 text-[#FFD60A] border border-[#FFD60A]/40 shadow-sm shadow-[#FFD60A]/10 hover:brightness-110 ios-touch"
                title="Abrir Panel Super Admin"
              >
                <Crown className="w-3.5 h-3.5 mr-1 text-[#FFD60A]" />
                <span>SA</span>
              </button>
            ) : isAdmin ? (
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#0A84FF]/15 text-[#64D2FF] border border-[#0A84FF]/30 hover:brightness-110 ios-touch"
                title="Ajustes del Torneo"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">Administrador</span>
                <span className="sm:hidden">Admin</span>
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30">
                🎾 Jugador
              </span>
            )}

            {/* Current Player Indicator */}
            {currentPlayer && (
              <button
                onClick={() => setActiveTab('my_profile')}
                className="flex items-center space-x-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full bg-[#1C1C1E] border border-white/10 hover:border-white/20 transition-all ios-touch"
                title="Mi perfil"
              >
                {currentPlayer.avatar ? (
                  <img src={currentPlayer.avatar} alt={currentPlayer.name} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#2C2C2E] text-[#30D158] font-bold text-[10px] flex items-center justify-center">
                    {currentPlayer.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-white hidden md:inline max-w-[85px] truncate">
                  {currentPlayer.nickname || currentPlayer.name.split(' ')[0]}
                </span>
              </button>
            )}

            {/* Install App Button */}
            {onOpenInstallApp && (
              <button
                type="button"
                onClick={onOpenInstallApp}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-full bg-[#30D158]/10 hover:bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30 ios-touch flex items-center space-x-1"
                title="Instalar App en tu Celular"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="text-xs font-bold hidden sm:inline">Instalar App</span>
              </button>
            )}

            {/* Exit / Logout Button */}
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[#8E8E93] hover:text-white text-xs font-semibold border border-white/10 ios-touch flex items-center"
              title="Cerrar Sesión"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              <span>Salir</span>
            </button>
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
            {(isAdmin || isSuperAdmin) && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`ios-segmented-item ${activeTab === 'settings' ? 'active' : ''}`}
              >
                ⚙️ Ajustes {isSuperAdmin ? '(Super)' : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
