import React, { useState } from 'react';
import {
  User,
  Camera,
  Upload,
  Check,
  Phone,
  Trophy,
  ShieldCheck,
  Search,
  LogOut,
  ChevronRight
} from 'lucide-react';
import type { Player, PlayerIntelligenceStats } from '../types/index.ts';
import { formatScoreDisplay } from '../utils/tieBreakerEngine.ts';

interface MyProfileViewProps {
  players: Player[];
  currentPlayerId: string | null;
  statsList: PlayerIntelligenceStats[];
  onSelectCurrentPlayer: (playerId: string | null) => void;
  onUpdatePlayer: (updatedPlayer: Player) => void;
  onRequestAdmin: () => void;
}

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  players,
  currentPlayerId,
  statsList,
  onSelectCurrentPlayer,
  onUpdatePlayer,
}) => {
  const currentPlayer = players.find(p => p.id === currentPlayerId) || null;
  const currentStats = currentPlayer ? statsList.find(s => s.playerId === currentPlayer.id) : null;

  const [name, setName] = useState(currentPlayer?.name || '');
  const [nickname, setNickname] = useState(currentPlayer?.nickname || '');
  const [phone, setPhone] = useState(currentPlayer?.phone || '');
  const [avatar, setAvatar] = useState(currentPlayer?.avatar || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  React.useEffect(() => {
    if (currentPlayer) {
      setName(currentPlayer.name);
      setNickname(currentPlayer.nickname || '');
      setPhone(currentPlayer.phone || '');
      setAvatar(currentPlayer.avatar || '');
      setIsSavedNotice(false);
    }
  }, [currentPlayer?.id]);

  const handleCompressAndSetImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 350;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatar(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlayer || !name.trim()) return;

    const updated: Player = {
      ...currentPlayer,
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      phone: phone.trim() || undefined,
      avatar: avatar || undefined,
    };

    onUpdatePlayer(updated);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  // If no player profile is chosen yet
  if (!currentPlayer) {
    const filtered = players.filter(p => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.nickname && p.nickname.toLowerCase().includes(q));
    });

    return (
      <div className="max-w-xl mx-auto space-y-4 pb-20 md:pb-6 select-none">
        <div className="pt-2 pb-1 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Mi Perfil
          </h1>
          <p className="text-xs sm:text-sm text-[#8E8E93] mt-1">
            Selecciona tu nombre para personalizar tu foto, apodo y ver tus estadísticas.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar mi nombre..."
            className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#30D158]"
          />
        </div>

        <div className="ios-grouped-list divide-y divide-white/5">
          {filtered.map((p) => {
            return (
              <button
                key={p.id}
                onClick={() => onSelectCurrentPlayer(p.id)}
                className="w-full ios-grouped-row py-3 px-4 flex items-center justify-between text-left ios-touch"
              >
                <div className="flex items-center space-x-3 truncate">
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#2C2C2E] text-[#30D158] font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="truncate">
                    <span className="block font-semibold text-sm sm:text-base text-white truncate">
                      {p.name}
                    </span>
                    {p.nickname && <span className="text-xs text-[#8E8E93] italic">"{p.nickname}"</span>}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-[#8E8E93]" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-20 md:pb-6 select-none">
      {/* Apple ID Style Hero Card */}
      <div className="ios-card p-6 text-center space-y-4">
        <div className="relative inline-block mx-auto">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-20 h-20 rounded-full object-cover border-2 border-white/20 mx-auto bg-[#2C2C2E]"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#2C2C2E] text-[#30D158] text-2xl font-bold flex items-center justify-center mx-auto border-2 border-white/10">
              {name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <label className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#30D158] text-black cursor-pointer shadow-lg ios-touch">
            <Camera className="w-3.5 h-3.5" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleCompressAndSetImage(f);
              }}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-xl font-bold text-white">{currentPlayer.name}</h2>
            {currentPlayer.role === 'admin' && (
              <span className="text-[10px] font-bold text-[#FFD60A] bg-[#FFD60A]/15 px-2 py-0.5 rounded-full border border-[#FFD60A]/30 flex items-center">
                <ShieldCheck className="w-3 h-3 mr-1" /> Admin
              </span>
            )}
          </div>
          {currentPlayer.nickname && (
            <p className="text-xs text-[#8E8E93] mt-0.5">"{currentPlayer.nickname}"</p>
          )}
        </div>

        <button
          onClick={() => onSelectCurrentPlayer(null)}
          className="text-xs text-[#0A84FF] font-semibold hover:underline"
        >
          Elegir otro jugador
        </button>
      </div>

      {/* Inset Grouped Settings Form */}
      <form onSubmit={handleSaveProfile} className="space-y-4">
        <div className="ios-grouped-list divide-y divide-white/5">
          <div className="p-3.5 flex items-center justify-between">
            <label className="text-xs text-[#8E8E93] w-24 flex-shrink-0">Nombre</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent text-right text-sm text-white font-medium focus:outline-none"
            />
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <label className="text-xs text-[#8E8E93] w-24 flex-shrink-0">Apodo</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Opcional"
              className="w-full bg-transparent text-right text-sm text-white font-medium focus:outline-none placeholder-[#8E8E93]/50"
            />
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <label className="text-xs text-[#8E8E93] w-24 flex-shrink-0">WhatsApp</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Teléfono"
              className="w-full bg-transparent text-right text-sm text-white font-medium focus:outline-none placeholder-[#8E8E93]/50"
            />
          </div>
        </div>

        {isSavedNotice && (
          <div className="p-3 bg-[#30D158]/15 border border-[#30D158]/30 rounded-xl text-[#30D158] text-xs font-bold text-center animate-fade-in flex items-center justify-center">
            <Check className="w-4 h-4 mr-1.5" /> Cambios guardados correctamente
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-[#30D158] active:bg-[#28B84B] text-black font-bold text-sm ios-touch flex items-center justify-center"
        >
          <Check className="w-4 h-4 mr-1.5" />
          Guardar Cambios
        </button>
      </form>

      {/* Personal KPIs Snapshot */}
      {currentStats && currentStats.totalMatchesPlayed > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[#1C1C1E] p-3.5 rounded-2xl border border-white/5 text-center">
            <span className="text-[11px] font-semibold text-[#8E8E93] block uppercase tracking-wider">Posición</span>
            <div className="text-xl font-bold text-white mt-0.5">#{currentStats.currentRank}</div>
          </div>

          <div className="bg-[#1C1C1E] p-3.5 rounded-2xl border border-white/5 text-center">
            <span className="text-[11px] font-semibold text-[#8E8E93] block uppercase tracking-wider">Puntos Totales</span>
            <div className="text-xl font-bold text-[#30D158] mt-0.5 font-mono">
              {formatScoreDisplay(currentStats.totalChampionshipPoints)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
