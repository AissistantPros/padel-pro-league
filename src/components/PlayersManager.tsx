import React, { useState } from 'react';
import { Users, UserPlus, Edit2, Trash2, Check, X, Search, FileText, Sparkles, Camera, Upload, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import type { Player, PlayerIntelligenceStats } from '../types/index.ts';

interface PlayersManagerProps {
  players: Player[];
  statsList: PlayerIntelligenceStats[];
  isAdmin: boolean;
  onSavePlayers: (players: Player[]) => void;
  onSelectPlayerForIntelligence: (playerId: string) => void;
}

export const PlayersManager: React.FC<PlayersManagerProps> = ({
  players,
  statsList,
  isAdmin,
  onSavePlayers,
  onSelectPlayerForIntelligence,
}) => {
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAvatar, setNewAvatar] = useState<string>('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState<string>('');

  const handleCompressAndSetImage = (file: File, callback: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 250;
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
        callback(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: newName.trim(),
      nickname: newNickname.trim() || undefined,
      phone: newPhone.trim() || undefined,
      avatar: newAvatar || undefined,
      role: newIsAdmin ? 'admin' : 'player',
      registeredAt: new Date().toISOString().split('T')[0],
      isActive: true,
    };

    onSavePlayers([...players, newPlayer]);
    setNewName('');
    setNewNickname('');
    setNewPhone('');
    setNewAvatar('');
    setNewIsAdmin(false);
    setIsAddingPlayer(false);
  };

  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) return;

    const createdPlayers: Player[] = lines.map((line, idx) => {
      let name = line;
      let nickname: string | undefined = undefined;

      const match = line.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        name = match[1].trim();
        nickname = match[2].trim();
      }

      return {
        id: `player_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
        name,
        nickname,
        role: 'player',
        registeredAt: new Date().toISOString().split('T')[0],
        isActive: true,
      };
    });

    onSavePlayers([...players, ...createdPlayers]);
    setBulkText('');
    setIsBulkAdding(false);
  };

  const handleStartEdit = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditName(player.name);
    setEditNickname(player.nickname || '');
    setEditPhone(player.phone || '');
    setEditAvatar(player.avatar || '');
  };

  const handleSaveEdit = (playerId: string) => {
    const updated = players.map(p =>
      p.id === playerId
        ? {
            ...p,
            name: editName.trim(),
            nickname: editNickname.trim() || undefined,
            phone: editPhone.trim() || undefined,
            avatar: editAvatar || undefined,
          }
        : p
    );
    onSavePlayers(updated);
    setEditingPlayerId(null);
  };

  const handleToggleAdminRole = (player: Player) => {
    const newRole: 'player' | 'admin' = player.role === 'admin' ? 'player' : 'admin';
    const confirmMsg = newRole === 'admin'
      ? `¿Deseas nombrar a "${player.name}" como Administrador del Torneo? Podrá cargar marcadores, programar fechas y gestionar jugadores.`
      : `¿Deseas revocar los permisos de Administrador a "${player.name}"?`;

    if (confirm(confirmMsg)) {
      const updated = players.map(p => (p.id === player.id ? { ...p, role: newRole } : p));
      onSavePlayers(updated);
    }
  };

  const handleQuickAvatarUpload = (playerId: string, file: File) => {
    handleCompressAndSetImage(file, (dataUrl) => {
      const updated = players.map(p => (p.id === playerId ? { ...p, avatar: dataUrl } : p));
      onSavePlayers(updated);
    });
  };

  const handleToggleActive = (playerId: string) => {
    const updated = players.map(p => (p.id === playerId ? { ...p, isActive: !p.isActive } : p));
    onSavePlayers(updated);
  };

  const handleDeletePlayer = (playerId: string) => {
    if (confirm('¿Seguro que deseas eliminar este jugador de la lista?')) {
      onSavePlayers(players.filter(p => p.id !== playerId));
    }
  };

  const filteredPlayers = players.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.nickname && p.nickname.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="p-3 rounded-2xl bg-slate-800 text-slate-200">
              <Users className="w-7 h-7" />
            </span>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black font-display text-white">
                  Roster General & Administradores
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  {players.length} Registrados
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                Administra los jugadores del torneo y nombra a otros jugadores como administradores.
              </p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setIsBulkAdding(!isBulkAdding);
                setIsAddingPlayer(false);
              }}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 active:bg-slate-700 text-cyan-400 font-black text-sm border border-slate-700 flex items-center transition-all"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Pegar Lista
            </button>

            <button
              onClick={() => {
                setIsAddingPlayer(!isAddingPlayer);
                setIsBulkAdding(false);
              }}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 active:bg-emerald-400 text-black font-black text-sm shadow-neon flex items-center transition-all"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Inscribir con Foto
            </button>
          </div>
        )}
      </div>

      {/* Search Filter Bar */}
      {players.length > 0 && (
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Buscar entre los ${players.length} jugadores inscritos...`}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-base text-white focus:border-cyan-400 focus:outline-none font-bold"
          />
        </div>
      )}

      {/* Bulk Import Form */}
      {isBulkAdding && (
        <form onSubmit={handleBulkImport} className="glass-panel-neon p-5 sm:p-6 rounded-3xl space-y-4 animate-fade-in border-2 border-cyan-500/40">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-base font-black text-cyan-300 flex items-center">
              <FileText className="w-5 h-5 mr-1.5" /> Pegar Lista de Nombres
            </h3>
            <button
              type="button"
              onClick={() => setIsBulkAdding(false)}
              className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
          </div>

          <p className="text-sm text-slate-300">
            Pega los nombres copiados de WhatsApp, Excel o Notas (un nombre por renglón). Opcional con apodo: <code>Juan Pérez (El Rayo)</code>.
          </p>

          <textarea
            rows={8}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`Alejandro Galán (Ale)\nJuan Lebrón (El Lobo)\nAgustín Tapia (El Mozart)\nArturo Coello\n...`}
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-base text-white font-mono focus:border-cyan-400 focus:outline-none"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3.5 rounded-2xl bg-cyan-500 active:bg-cyan-400 text-black font-black text-sm shadow-blue-glow flex items-center"
            >
              <Sparkles className="w-4 h-4 mr-1.5" /> Importar Jugadores a la Lista
            </button>
          </div>
        </form>
      )}

      {/* Add Single Player Form */}
      {isAddingPlayer && (
        <form onSubmit={handleAddPlayer} className="glass-panel-neon p-5 sm:p-6 rounded-3xl space-y-4 animate-fade-in border-2 border-emerald-500/40">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-base font-black text-white flex items-center">
              <UserPlus className="w-5 h-5 mr-1.5 text-emerald-400" /> Inscribir Jugador y Subir Foto
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingPlayer(false)}
              className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pb-2">
            <div className="w-20 h-20 rounded-full border-2 border-emerald-400 bg-slate-900 overflow-hidden flex items-center justify-center relative group flex-shrink-0">
              {newAvatar ? (
                <img src={newAvatar} alt="Foto jugador" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-slate-500" />
              )}
            </div>

            <div className="space-y-1.5 text-center sm:text-left">
              <label className="px-4 py-2 rounded-2xl bg-emerald-500 active:bg-emerald-400 text-black font-black text-sm shadow-neon cursor-pointer inline-flex items-center">
                <Upload className="w-4 h-4 mr-1.5" />
                {newAvatar ? 'Cambiar Foto' : 'Cargar Foto de Perfil'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCompressAndSetImage(f, setNewAvatar);
                  }}
                  className="hidden"
                />
              </label>
              <div className="text-xs text-slate-400">Foto recortada profesional para cancha</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-black uppercase text-slate-300 block mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-base text-white font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase text-slate-300 block mb-1">Apodo / Nickname</label>
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="Ej. El Rayo"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-base text-white font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase text-slate-300 block mb-1">Teléfono / WhatsApp</label>
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Ej. +52 55 1234 5678"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-base text-white font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="newIsAdmin"
              checked={newIsAdmin}
              onChange={(e) => setNewIsAdmin(e.target.checked)}
              className="w-5 h-5 rounded accent-emerald-500 cursor-pointer"
            />
            <label htmlFor="newIsAdmin" className="text-sm font-bold text-amber-300 cursor-pointer flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1 text-amber-400" />
              Nombrar también como Administrador del Torneo
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3.5 rounded-2xl bg-emerald-500 active:bg-emerald-400 text-black font-black text-base shadow-neon flex items-center"
            >
              <Check className="w-5 h-5 mr-1.5" /> Guardar Jugador
            </button>
          </div>
        </form>
      )}

      {/* Empty Zero State */}
      {players.length === 0 && (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 space-y-4">
          <Users className="w-16 h-16 text-slate-600 mx-auto" />
          <h3 className="text-xl font-black text-white">No hay jugadores inscritos todavía</h3>
          <p className="text-base text-slate-400 max-w-md mx-auto">
            Inscribe a los jugadores de tu torneo G20. Puedes agregar cuantos quieras (8, 16, 50+) y subir sus fotos para los partidos.
          </p>
          {isAdmin && (
            <button
              onClick={() => setIsBulkAdding(true)}
              className="px-6 py-3.5 rounded-2xl bg-emerald-500 active:bg-emerald-400 text-black font-black text-base shadow-neon inline-flex items-center"
            >
              <FileText className="w-5 h-5 mr-2" /> Pegar Lista de Jugadores
            </button>
          )}
        </div>
      )}

      {/* Players List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredPlayers.map((player) => {
          const stats = statsList.find(s => s.playerId === player.id);
          const isEditing = editingPlayerId === player.id;
          const isPlayerAdmin = player.role === 'admin';

          return (
            <div
              key={player.id}
              className={`glass-panel p-4 sm:p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-3 bg-[#121829] ${
                isPlayerAdmin ? 'border-amber-500/50 shadow-gold-glow' : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {/* Player Cropped Photo or Initials */}
                    <div className="relative group flex-shrink-0">
                      {player.avatar ? (
                        <img
                          src={player.avatar}
                          alt={player.name}
                          className="w-13 h-13 rounded-full object-cover border-2 border-emerald-400 shadow-neon bg-slate-900"
                        />
                      ) : (
                        <div className="w-13 h-13 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-black text-base text-emerald-400">
                          {player.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      {/* Quick upload overlay for admin */}
                      {isAdmin && (
                        <label className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white">
                          <Camera className="w-5 h-5" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleQuickAvatarUpload(player.id, f);
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-sm text-white font-bold"
                          />
                          <input
                            type="text"
                            value={editNickname}
                            onChange={(e) => setEditNickname(e.target.value)}
                            placeholder="Apodo"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-400"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-1.5">
                            <h4
                              onClick={() => onSelectPlayerForIntelligence(player.id)}
                              className="text-base sm:text-lg font-black text-white hover:text-emerald-400 transition-colors cursor-pointer truncate"
                            >
                              {player.name}
                            </h4>
                          </div>
                          {player.nickname && (
                            <span className="text-xs sm:text-sm text-slate-400 italic font-semibold block truncate">"{player.nickname}"</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                    {isPlayerAdmin && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Admin
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      player.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {player.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                {/* Mini Stats snapshot if played */}
                {stats && stats.totalMatchesPlayed > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-center text-xs">
                    <div>
                      <span className="text-xs text-slate-400 block font-bold">Ranking</span>
                      <span className="font-black text-white font-mono text-sm">#{stats.currentRank}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-bold">Efectividad</span>
                      <span className="font-black text-emerald-400 font-mono text-sm">{stats.winRatePercentage}%</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-bold">Puntos</span>
                      <span className="font-black text-blue-400 font-mono text-sm">{stats.totalChampionshipPoints.toFixed(3)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="space-y-2 pt-2 border-t border-slate-800/60 text-xs sm:text-sm">
                  {isEditing ? (
                    <div className="flex space-x-2 w-full">
                      <button
                        onClick={() => handleSaveEdit(player.id)}
                        className="flex-1 py-1.5 bg-emerald-500 text-black font-black rounded-xl text-xs"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingPlayerId(null)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleStartEdit(player)}
                          className="text-slate-400 hover:text-white flex items-center font-bold"
                        >
                          <Edit2 className="w-4 h-4 mr-1" /> Editar
                        </button>
                        <button
                          onClick={() => handleToggleActive(player.id)}
                          className="text-slate-400 hover:text-amber-400 font-bold"
                        >
                          {player.isActive ? 'Pausar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(player.id)}
                          className="text-slate-500 hover:text-rose-400"
                          title="Eliminar jugador"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Promote/Demote Admin Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleAdminRole(player)}
                        className={`w-full py-1.5 rounded-xl font-black text-xs flex items-center justify-center transition-all ${
                          isPlayerAdmin
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5 mr-1" />
                        {isPlayerAdmin ? 'Quitar Rol de Admin' : '👑 Nombrar Administrador'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
