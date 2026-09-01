import React from 'react';
import { Trophy, Activity, Zap, Award, Users, Settings } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'standings' | 'matchday' | 'intelligence' | 'grand_finale' | 'players' | 'settings';
  setActiveTab: (tab: 'standings' | 'matchday' | 'intelligence' | 'grand_finale' | 'players' | 'settings') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'standings', label: 'Tabla', icon: Trophy },
    { id: 'matchday', label: 'Jornada', icon: Activity },
    { id: 'intelligence', label: 'Radar PI', icon: Zap },
    { id: 'grand_finale', label: 'Finales', icon: Award },
    { id: 'players', label: 'Roster', icon: Users },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-slate-800/90 bg-[#0B0F19]/95 backdrop-blur-xl pb-safe">
      <div className="grid grid-cols-6 h-16 items-center px-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex flex-col items-center justify-center h-full w-full py-1 transition-all ${
                isActive
                  ? 'text-emerald-400 font-black'
                  : 'text-slate-400 font-bold hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-emerald-500/20 text-emerald-400 scale-110 shadow-neon' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[11px] leading-tight mt-0.5 tracking-tight ${
                isActive ? 'font-black text-emerald-400' : 'font-semibold text-slate-400'
              }`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
