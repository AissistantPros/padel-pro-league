import React, { useState } from 'react';
import {
  User,
  Camera,
  Upload,
  Check,
  Phone,
  Sparkles,
  Trophy,
  Flame,
  Award,
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
  onRequestAdmin,
}) => {
  const currentPlayer = players.find(p => p.id === currentPlayerId) || null;
  const currentStats = currentPlayer ? statsList.find(s => s.playerId === currentPlayer.id) : null;

  const [name, setName] = useState(currentPlayer?.name || '');
  const [nickname, setNickname] = useState(currentPlayer?.nickname || '');
  const [phone, setPhone] = useState(currentPlayer?.phone || '');
  const [avatar, setAvatar] = useState(currentPlayer?.avatar || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Sync state when switching player
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
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  // If no player profile is chosen yet
  if (!currentPlayer) {
    const filtered = players.filter(p => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.nickname && p.nickname.toLowerCase().includes(q));
    });

    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-6">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-neon">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black font-display text-white">¿Quién eres en el Torneo?</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
              Selecciona tu nombre de la lista para subir tu foto de perfil, cambiar tu apodo y celular.
            </p>
          </div>

          <div className="relative max-w-md mx-auto">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar mi nombre..."
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-base text-white focus:border-emerald-500 focus:outline-none font-bold"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pt-2 text-left">
            {filtered.map((p) => {
              const st = statsList.find(s => s.playerId === p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectCurrentPlayer(p.id)}
                  className="w-full p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center space-x-3 truncate">
                    {p.avatar ? (
                      <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 font-black text-sm flex items-center justify-center flex-shrink-0">
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="truncate">
                      <span className="block font-black text-base text-white group-hover:text-emerald-400 transition-colors truncate">
                        {p.name}
                      </span>
                      {p.nickname && <span className="text-xs text-slate-400 italic">"{p.nickname}"</span>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {st && st.currentRank && (
                      <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        #{st.currentRank}
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-6">
      {/* Profile Header & Card */}
      <div className="glass-panel p-5 sm:p-7 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-3 border-emerald-400 shadow-neon bg-slate-900 flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl font-black text-emerald-400 flex-shrink-0">
                  {name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <label className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white">
                <Camera className="w-6 h-6" />
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
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black font-display text-white">{currentPlayer.name}</h2>
                {currentPlayer.role === 'admin' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Admin de Torneo
                  </span>
                )}
              </div>
              {currentPlayer.nickname && (
                <span className="text-sm text-emerald-400 italic font-bold">"{currentPlayer.nickname}"</span>
              )}
              <div className="text-xs text-slate-400 mt-0.5">Mi Perfil de Jugador • G20 League</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSelectCurrentPlayer(null)}
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center transition-colors"
            >
              <LogOut className="w-4 h-4 mr-1.5" /> Cambiar Perfil
            </button>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <h3 className="text-base font-black text-white flex items-center">
            <User className="w-5 h-5 mr-2 text-emerald-400" />
            Editar Mis Datos Personales
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label className="px-4 py-2.5 rounded-2xl bg-slate-800 active:bg-slate-700 text-emerald-400 font-black text-xs sm:text-sm border border-slate-700 cursor-pointer inline-flex items-center transition-colors">
              <Upload className="w-4 h-4 mr-1.5" />
              {avatar ? 'Cambiar Mi Foto de Perfil' : 'Subir Mi Foto de Perfil'}
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
            <span className="text-xs text-slate-400">Foto tipo transmisión para mostrar en las canchas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="text-xs font-black uppercase text-slate-300 block mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-base text-white font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-300 block mb-1">Apodo / Nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ej. El Rayo"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-base text-white font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-300 block mb-1">Teléfono / WhatsApp</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. +52 55 1234 5678"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-base text-white font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {isSavedNotice && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400 text-sm font-bold flex items-center justify-center animate-fade-in">
              <Check className="w-5 h-5 mr-2" /> ¡Tus datos han sido actualizados con éxito!
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3.5 rounded-2xl bg-emerald-500 active:bg-emerald-400 text-black font-black text-base shadow-neon flex items-center transition-all"
            >
              <Check className="w-5 h-5 mr-1.5" /> Guardar Mis Cambios
            </button>
          </div>
        </form>
      </div>

      {/* Personal Snapshot KPIs */}
      {currentStats && currentStats.totalMatchesPlayed > 0 && (
        <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-amber-400" />
            Mi Rendimiento en la Liga G20
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 font-bold block">Mi Posición</span>
              <span className="text-2xl sm:text-3xl font-black text-white font-display">#{currentStats.currentRank}</span>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 font-bold block">Efectividad</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-display">{currentStats.winRatePercentage}%</span>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 font-bold block">Puntos Totales</span>
              <span className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">{formatScoreDisplay(currentStats.totalChampionshipPoints)}</span>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 font-bold block">Games Ganados</span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">{currentStats.totalBasePoints}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
