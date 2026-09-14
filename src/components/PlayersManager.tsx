import React, { useState } from 'react';
import { Users, UserPlus, Edit2, Trash2, Check, X, Search, FileText, Camera, Upload, ShieldCheck, Shield, ChevronRight, Key, Eye, EyeOff, RefreshCw } from 'lucide-react';
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
  const [newPin, setNewPin] = useState('1234');
  
  // Full Edit Player Modal State
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState<string>('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editPin, setEditPin] = useState('');
  const [showEditPin, setShowEditPin] = useState(false);

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

  const generateRandomPin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
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
      pin: newIsAdmin ? (newPin.trim() || '1234') : undefined,
      registeredAt: new Date().toISOString().split('T')[0],
      isActive: true,
    };

    onSavePlayers([...players, newPlayer]);
    setNewName('');
    setNewNickname('');
    setNewPhone('');
    setNewAvatar('');
    setNewIsAdmin(false);
    setNewPin('1234');
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
    setEditingPlayer(player);
    setEditName(player.name);
    setEditNickname(player.nickname || '');
    setEditPhone(player.phone || '');
    setEditAvatar(player.avatar || '');
    setEditIsAdmin(player.role === 'admin');
    setEditPin(player.pin || (player.role === 'admin' ? '1234' : ''));
    setShowEditPin(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer || !editName.trim()) return;

    const updated = players.map(p =>
      p.id === editingPlayer.id
        ? {
            ...p,
            name: editName.trim(),
            nickname: editNickname.trim() || undefined,
            phone: editPhone.trim() || undefined,
            avatar: editAvatar || undefined,
            role: (editIsAdmin ? 'admin' : 'player') as 'player' | 'admin',
            pin: editIsAdmin ? (editPin.trim() || '1234') : undefined,
          }
        : p
    );
    onSavePlayers(updated);
    setEditingPlayer(null);
  };

  const handleToggleAdminRole = (player: Player) => {
    const willBeAdmin = player.role !== 'admin';
    const assignedPin = player.pin || '1234';
    const confirmMsg = willBeAdmin
      ? `¿Nombrar a "${player.name}" como Administrador del Torneo?\nSu PIN inicial será "${assignedPin}".`
      : `¿Revocar los permisos de Administrador a "${player.name}"?`;

    if (confirm(confirmMsg)) {
      const updated = players.map(p =>
        p.id === player.id
          ? {
              ...p,
              role: willBeAdmin ? ('admin' as const) : ('player' as const),
              pin: willBeAdmin ? assignedPin : p.pin,
            }
          : p
      );
      onSavePlayers(updated);
    }
  };

  const handleDeletePlayer = (playerId: string) => {
    if (confirm('¿Eliminar este participante de la lista?')) {
      onSavePlayers(players.filter(p => p.id !== playerId));
    }
  };

  const filteredPlayers = players.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.nickname && p.nickname.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-4 pb-20 md:pb-6 select-none">
      {/* Header */}
      <div className="pt-1 pb-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#8E8E93]">
              {players.length} registrados
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
              Jugadores
            </h1>
          </div>

          {isAdmin && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setIsBulkAdding(!isBulkAdding);
                  setIsAddingPlayer(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#1C1C1E] border border-white/10 text-xs font-semibold text-[#8E8E93] hover:text-white ios-touch"
              >
                Pegar Lista
              </button>
              <button
                onClick={() => {
                  setIsAddingPlayer(!isAddingPlayer);
                  setIsBulkAdding(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#30D158] text-black font-bold text-xs ios-touch flex items-center"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                Inscribir
              </button>
            </div>
          )}
        </div>

        {/* iOS Native Search Bar */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar jugador o apodo..."
            className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#30D158]"
          />
        </div>
      </div>

      {/* Add Single Player Modal Sheet */}
      {isAddingPlayer && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <form onSubmit={handleAddPlayer} className="relative w-full max-w-lg bg-[#1C1C1E] border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-[28px] p-6 text-white shadow-2xl z-10 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white">Inscribir Nuevo Jugador</h3>
              <button
                type="button"
                onClick={() => setIsAddingPlayer(false)}
                className="text-xs text-[#8E8E93] hover:text-white px-2.5 py-1 bg-[#2C2C2E] rounded-lg"
              >
                Cancelar
              </button>
            </div>

            {/* Photo Picker */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-[#2C2C2E] border border-white/15 overflow-hidden flex items-center justify-center flex-shrink-0">
                {newAvatar ? (
                  <img src={newAvatar} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-[#8E8E93]" />
                )}
              </div>
              <label className="px-3.5 py-2 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-semibold text-white cursor-pointer ios-touch inline-flex items-center">
                <Upload className="w-3.5 h-3.5 mr-1 text-[#30D158]" />
                {newAvatar ? 'Cambiar Foto' : 'Subir Foto'}
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
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-xs text-[#8E8E93] block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#30D158]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#8E8E93] block mb-1">Apodo (Opcional)</label>
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    placeholder="Ej. El Rayo"
                    className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#30D158]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#8E8E93] block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="WhatsApp"
                    className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#30D158]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="newIsAdmin"
                checked={newIsAdmin}
                onChange={(e) => setNewIsAdmin(e.target.checked)}
                className="w-4 h-4 rounded text-[#30D158] bg-[#2C2C2E]"
              />
              <label htmlFor="newIsAdmin" className="text-xs text-[#FFD60A] font-semibold cursor-pointer flex items-center">
                <Shield className="w-3.5 h-3.5 mr-1" /> Nombrar como Administrador del Torneo
              </label>
            </div>

            {newIsAdmin && (
              <div className="p-3.5 bg-[#2C2C2E] border border-white/10 rounded-2xl space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[#FFD60A] font-semibold flex items-center">
                    <Key className="w-3.5 h-3.5 mr-1" /> PIN de Acceso Administrador
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPin(generateRandomPin())}
                    className="text-[11px] text-[#0A84FF] hover:underline flex items-center font-medium"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Generar PIN
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="1234"
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#30D158] font-mono font-bold focus:outline-none focus:border-[#30D158]"
                />
                <span className="text-[11px] text-[#8E8E93] block">
                  Con este PIN, el nuevo administrador podrá ingresar al panel y cargar marcadores.
                </span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#30D158] text-black font-bold text-sm ios-touch"
            >
              Guardar Participante
            </button>
          </form>
        </div>
      )}

      {/* Edit Player Modal Sheet */}
      {editingPlayer && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <form onSubmit={handleSaveEdit} className="relative w-full max-w-lg bg-[#1C1C1E] border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-[28px] p-6 text-white shadow-2xl z-10 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white flex items-center">
                <Edit2 className="w-4 h-4 mr-1.5 text-[#30D158]" /> Editar Jugador
              </h3>
              <button
                type="button"
                onClick={() => setEditingPlayer(null)}
                className="text-xs text-[#8E8E93] hover:text-white px-2.5 py-1 bg-[#2C2C2E] rounded-lg"
              >
                Cancelar
              </button>
            </div>

            {/* Photo Picker */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-[#2C2C2E] border border-white/15 overflow-hidden flex items-center justify-center flex-shrink-0">
                {editAvatar ? (
                  <img src={editAvatar} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-[#8E8E93]" />
                )}
              </div>
              <label className="px-3.5 py-2 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-semibold text-white cursor-pointer ios-touch inline-flex items-center">
                <Upload className="w-3.5 h-3.5 mr-1 text-[#30D158]" />
                {editAvatar ? 'Cambiar Foto' : 'Subir Foto'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCompressAndSetImage(f, setEditAvatar);
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-xs text-[#8E8E93] block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#30D158]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#8E8E93] block mb-1">Apodo (Opcional)</label>
                  <input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    placeholder="Ej. El Rayo"
                    className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#30D158]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#8E8E93] block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="WhatsApp"
                    className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#30D158]"
                  />
                </div>
              </div>
            </div>

            {/* Admin Role & PIN Management */}
            <div className="p-3.5 bg-[#2C2C2E]/70 border border-white/10 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="editIsAdmin" className="text-xs text-[#FFD60A] font-semibold cursor-pointer flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1 text-[#FFD60A]" /> Rol: Administrador del Torneo
                </label>
                <input
                  type="checkbox"
                  id="editIsAdmin"
                  checked={editIsAdmin}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setEditIsAdmin(checked);
                    if (checked && !editPin) setEditPin('1234');
                  }}
                  className="w-4 h-4 rounded text-[#30D158] bg-[#1C1C1E]"
                />
              </div>

              {editIsAdmin && (
                <div className="space-y-2 pt-2 border-t border-white/5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-[#8E8E93] font-medium flex items-center">
                      <Key className="w-3.5 h-3.5 mr-1 text-[#30D158]" /> PIN de Acceso Personal
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditPin(generateRandomPin())}
                      className="text-[11px] text-[#0A84FF] hover:underline flex items-center font-medium"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> Generar PIN
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showEditPin ? 'text' : 'password'}
                      maxLength={6}
                      value={editPin}
                      onChange={(e) => setEditPin(e.target.value)}
                      placeholder="1234"
                      className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl pl-3 pr-10 py-2.5 text-sm text-[#30D158] font-mono font-bold focus:outline-none focus:border-[#30D158]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPin(!showEditPin)}
                      className="absolute right-3 top-2.5 text-[#8E8E93] hover:text-white"
                    >
                      {showEditPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                    El Super Admin puede ver y modificar este PIN en cualquier momento.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#30D158] text-black font-bold text-sm ios-touch"
            >
              Guardar Cambios
            </button>
          </form>
        </div>
      )}

      {/* Bulk Import Modal Sheet */}
      {isBulkAdding && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <form onSubmit={handleBulkImport} className="relative w-full max-w-lg bg-[#1C1C1E] border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-[28px] p-6 text-white shadow-2xl z-10 space-y-3 animate-slide-up">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white">Pegar Lista de Jugadores</h3>
              <button
                type="button"
                onClick={() => setIsBulkAdding(false)}
                className="text-xs text-[#8E8E93] hover:text-white px-2.5 py-1 bg-[#2C2C2E] rounded-lg"
              >
                Cancelar
              </button>
            </div>
            <p className="text-xs text-[#8E8E93]">
              Pega un nombre por línea. Formato opcional: <code>Juan Pérez (El Rayo)</code>
            </p>
            <textarea
              rows={6}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Juan Pérez (El Rayo)&#10;Carlos Benítez&#10;..."
              className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl p-3 text-sm text-white font-mono"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#30D158] text-black font-bold text-sm ios-touch"
            >
              Importar Participantes
            </button>
          </form>
        </div>
      )}

      {/* iOS Grouped Contacts List */}
      <div className="ios-grouped-list divide-y divide-white/5">
        {filteredPlayers.map((player) => {
          const stats = statsList.find(s => s.playerId === player.id);
          const isPlayerAdmin = player.role === 'admin';

          return (
            <div key={player.id} className="ios-grouped-row py-3 px-4 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {/* Photo */}
                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0 bg-[#2C2C2E]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#2C2C2E] text-[#8E8E93] font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                {/* Name & Metadata */}
                <div className="min-w-0 flex-1 pr-2">
                  <div
                    onClick={() => onSelectPlayerForIntelligence(player.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="text-sm sm:text-base font-semibold text-white truncate">
                        {player.name}
                      </span>
                      {isPlayerAdmin && (
                        <span className="text-[10px] font-bold text-[#FFD60A] bg-[#FFD60A]/15 px-1.5 py-0.5 rounded-full flex items-center">
                          <ShieldCheck className="w-2.5 h-2.5 mr-0.5 text-[#FFD60A]" /> Admin
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#8E8E93] truncate flex items-center space-x-1.5 flex-wrap">
                      <span>{player.nickname ? `"${player.nickname}"` : 'Participante Oficial'}</span>
                      {isPlayerAdmin && isAdmin && (
                        <span className="text-[#30D158] font-mono font-semibold bg-[#30D158]/10 px-1.5 py-0.2 rounded">
                          PIN: {player.pin || '1234'}
                        </span>
                      )}
                      {stats && stats.totalMatchesPlayed > 0 && (
                        <span>• {stats.totalChampionshipPoints.toFixed(1)} pts</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Admin */}
              {isAdmin && (
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggleAdminRole(player)}
                    className={`p-1.5 rounded-lg text-xs font-semibold ${
                      isPlayerAdmin ? 'text-[#FFD60A] hover:text-[#FF9F0A]' : 'text-[#8E8E93] hover:text-white'
                    }`}
                    title={isPlayerAdmin ? 'Quitar rol admin' : 'Nombrar admin'}
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStartEdit(player)}
                    className="p-1.5 text-[#8E8E93] hover:text-white"
                    title="Editar y gestionar PIN"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePlayer(player.id)}
                    className="p-1.5 text-[#8E8E93] hover:text-[#FF453A]"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {!isAdmin && (
                <button
                  onClick={() => onSelectPlayerForIntelligence(player.id)}
                  className="text-[#8E8E93]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
