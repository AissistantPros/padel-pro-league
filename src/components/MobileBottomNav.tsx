import React from 'react';
import { Trophy, Activity, Zap, Award, Users, Settings, User } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'standings' | 'matchday' | 'intelligence' | 'grand_finale' | 'players' | 'settings' | 'my_profile';
  setActiveTab: (tab: 'standings' | 'matchday' | 'intelligence' | 'grand_finale' | 'players' | 'settings' | 'my_profile') => void;
  isAdmin: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab, isAdmin }) => {
  const tabs = isAdmin
    ? ([
        { id: 'standings', label: 'Tabla', icon: Trophy },
        { id: 'matchday', label: 'Jornada', icon: Activity },
        { id: 'players', label: 'Roster', icon: Users },
        { id: 'intelligence', label: 'Radar', icon: Zap },
        { id: 'grand_finale', label: 'Finales', icon: Award },
        { id: 'settings', label: 'Ajustes', icon: Settings },
      ] as const)
    : ([
        { id: 'standings', label: 'Tabla', icon: Trophy },
        { id: 'matchday', label: 'Jornada', icon: Activity },
        { id: 'players', label: 'Roster', icon: Users },
        { id: 'intelligence', label: 'Radar', icon: Zap },
        { id: 'my_profile', label: 'Mi Perfil', icon: User },
      ] as const);

  const gridColsClass = isAdmin ? 'grid-cols-6' : 'grid-cols-5';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-black/85 backdrop-blur-2xl border-t border-white/10 pb-safe shadow-2xl select-none">
      <div className={`grid ${gridColsClass} h-16 items-center px-1`}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex flex-col items-center justify-center h-full w-full py-1 ios-touch transition-colors"
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'text-[#30D158] scale-110 stroke-[2.2]' : 'text-[#8E8E93] stroke-[1.8]'
                }`}
              />
              <span
                className={`text-[11px] leading-tight mt-1 tracking-tight ${
                  isActive ? 'font-bold text-[#30D158]' : 'font-medium text-[#8E8E93]'
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
