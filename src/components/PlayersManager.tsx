import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  FileText,
  Camera,
  Upload,
  ShieldCheck,
  Shield,
  ChevronRight,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  Crown,
  Bell,
  Activity,
  MousePointer,
  Mail,
  Phone,
} from 'lucide-react';
import type { Player, PlayerIntelligenceStats, PlayerRegistrationRequest } from '../types/index.ts';
import { StorageService, generateShortPin, generateSecurePin } from '../services/storageService.ts';
import { ImageCropModal } from './ImageCropModal.tsx';

interface PlayersManagerProps {
  players: Player[];
  statsList: PlayerIntelligenceStats[];
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  pendingRequests?: PlayerRegistrationRequest[];
  onOpenPendingRequests?: () => void;
  onSavePlayers: (players: Player[]) => void;
  onSelectPlayerForIntelligence: (playerId: string) => void;
}

export const PlayersManager: React.FC<PlayersManagerProps> = ({
  players,
  statsList,
  isAdmin,
  isSuperAdmin = false,
  pendingRequests = [],
  onOpenPendingRequests,
  onSavePlayers,
  onSelectPlayerForIntelligence,
}) => {
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Player Form State
  const [newName, setNewName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAvatar, setNewAvatar] = useState<string>('');
  const [newRole, setNewRole] = useState<'player' | 'admin' | 'superadmin'>('player');
  const [newPin, setNewPin] = useState(generateShortPin());
  
  // Full Edit Player Modal State
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatar, setEditAvatar] = useState<string>('');
  const [editRole, setEditRole] = useState<'player' | 'admin' | 'superadmin'>('player');
  const [editPin, setEditPin] = useState('');
  const [showEditPin, setShowEditPin] = useState(false);

  // Photo Crop Modal State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [tempImageForCrop, setTempImageForCrop] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<'new' | 'edit'>('new');

  const handleSelectPhotoForCrop = (file: File, target: 'new' | 'edit') => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setTempImageForCrop(dataUrl);
        setCropTarget(target);
        setIsCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirmed = (croppedDataUrl: string) => {
    if (cropTarget === 'new') {
      setNewAvatar(croppedDataUrl);
    } else {
      setEditAvatar(croppedDataUrl);
    }
  };

  const isSuperAdminPlayer = (p: Player | null | undefined): boolean => {
    if (!p) return false;
    return p.role === 'superadmin' || p.name.trim().toLowerCase().includes('esteban');
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    if (newRole === 'superadmin' && !isSuperAdmin) {
      alert('🤨 ¿Creando Super Admins por tus pistolas? Jajaja ni lo pienses, tendrías que ser un máster como mi jefe Esteban para hacer eso.');
      return;
    }

    const newPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: newName.trim(),
      nickname: newNickname.trim() || undefined,
      phone: newPhone.trim() || undefined,
      email: newEmail.trim() || undefined,
      avatar: newAvatar || undefined,
      role: newRole,
      pin: (newPin.trim() || generateShortPin()).toUpperCase(),
      registeredAt: new Date().toISOString().split('T')[0],
      isActive: true,
      loginCount: 0,
      activeClicks: 0,
    };

    onSavePlayers([...players, newPlayer]);
    setNewName('');
    setNewNickname('');
    setNewPhone('');
    setNewEmail('');
    setNewAvatar('');
    setNewRole('player');
    setNewPin(generateShortPin());
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
        pin: generateShortPin(),
        registeredAt: new Date().toISOString().split('T')[0],
        isActive: true,
        loginCount: 0,
        activeClicks: 0,
      };
    });

    onSavePlayers([...players, ...createdPlayers]);
    setBulkText('');
    setIsBulkAdding(false);
  };

  const handleStartEdit = (player: Player) => {
    if (isSuperAdminPlayer(player) && !isSuperAdmin) {
      alert('👀 ¿Queriendo editar a mi jefe Esteban? ¡Imposible mi chavo! Eres un simple administrador, a él nadie lo toca.');
      return;
    }
    setEditingPlayer(player);
    setEditName(player.name);
    setEditNickname(player.nickname || '');
    setEditPhone(player.phone || '');
    setEditEmail(player.email || '');
    setEditAvatar(player.avatar || '');
    setEditRole(player.role || 'player');
    setEditPin(player.pin || generateShortPin());
    setShowEditPin(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer || !editName.trim()) return;

    if (isSuperAdminPlayer(editingPlayer) && !isSuperAdmin) {
      alert('✋ Jajaja ¡bájale dos rayitas! No puedes modificar al mero mero. Esteban es intocable.');
      return;
    }

    if (editRole === 'superadmin' && !isSuperAdmin) {
      alert('👑 ¿Subiéndote el rango tú solito? Jajaja ni lo pienses, tendrías que ser un máster como mi jefe Esteban para hacer eso.');
      return;
    }

    const updated = players.map(p =>
      p.id === editingPlayer.id
        ? {
            ...p,
            name: editName.trim(),
            nickname: editNickname.trim() || undefined,
            phone: editPhone.trim() || undefined,
            email: editEmail.trim() || undefined,
            avatar: editAvatar || undefined,
            role: editRole,
            pin: editPin.trim().toUpperCase() || p.pin || generateShortPin(),
          }
        : p
    );
    onSavePlayers(updated);
    setEditingPlayer(null);
  };

  const handleDeletePlayer = async (playerId: string) => {
    const targetPlayer = players.find(p => p.id === playerId);
    if (!targetPlayer) return;

    if (isSuperAdminPlayer(targetPlayer) && !isSuperAdmin) {
      alert('💀 ¿¿¿Quieres borrar a mi jefe??? Imposible compadre, estás chavo. ¡Esteban vivirá por siempre en esta app!');
      return;
    }

    const name = targetPlayer.name || 'este participante';
    if (confirm(`¿Eliminar definitivamente a "${name}" de la lista oficial del torneo?\n\nEsta acción borrará al participante de la base de datos de forma permanente.`)) {
      // 1. Instant optimistic UI removal so there is no flicker or hesitation
      const remaining = players.filter(p => p.id !== playerId);
      onSavePlayers(remaining);

      // 2. Permanent eradication from Supabase & tombstone blacklist
      await StorageService.deletePlayer(playerId, remaining);
    }
  };

  const filteredPlayers = players.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.nickname && p.nickname.toLowerCase().includes(q)) ||
      (p.pin && p.pin.toLowerCase().includes(q))
    );
  });

  const handleRegeneratePlayerPin = (player: Player) => {
    if (isSuperAdminPlayer(player) && !isSuperAdmin) {
      alert('🕵️‍♂️ ¿Queriendo cambiarle la clave al patrón? Ni lo sueñes, esa clave es nivel FBI.');
      return;
    }

    const confirmMsg = `¿Regenerar clave de acceso para "${player.name}"?\n\nSe creará un nuevo PIN único de 5 caracteres y se guardará de inmediato en la base de datos.`;
    if (confirm(confirmMsg)) {
      const newPin = generateSecurePin();
      const updated = players.map(p => (p.id === player.id ? { ...p, pin: newPin } : p));
      onSavePlayers(updated);
      alert(`✅ Nuevo PIN para ${player.name}: ${newPin}\n\nCompártele esta clave al jugador.`);
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6 select-none">
      {/* Header */}
      <div className="pt-1 pb-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-[#8E8E93]">
              {players.length} jugadores en base de datos
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
              Jugadores & Accesos
            </h1>
          </div>

          {(isAdmin || isSuperAdmin) && (
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
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
                className="px-3.5 py-1.5 rounded-xl bg-[#30D158] text-black font-bold text-xs ios-touch flex items-center shadow-md hover:bg-[#28B84B]"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
                Inscribir
              </button>
            </div>
          )}
        </div>

        {/* Pending Registration Requests Banner Alert */}
        {(isAdmin || isSuperAdmin) && pendingRequests.length > 0 && onOpenPendingRequests && (
          <div className="mt-3 p-3.5 bg-gradient-to-r from-[#FFD60A]/15 via-[#1C1C1E] to-[#FFD60A]/10 border border-[#FFD60A]/30 rounded-2xl flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#FFD60A]/20 text-[#FFD60A] flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white">
                  {pendingRequests.length} {pendingRequests.length === 1 ? 'solicitud de registro pendiente' : 'solicitudes de registro pendientes'}
                </h4>
                <p className="text-[11px] text-[#8E8E93] truncate">
                  Aprueba los accesos y genera sus claves de jugador.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenPendingRequests}
              className="px-3 py-1.5 rounded-xl bg-[#FFD60A] text-black font-black text-xs ios-touch flex-shrink-0 shadow-md"
            >
              Revisar
            </button>
          </div>
        )}

        {/* iOS Native Search Bar */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, apodo o clave..."
            className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#30D158]"
          />
        </div>
      </div>

      {/* Add Single Player Modal Sheet */}
      {isAddingPlayer && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <form onSubmit={handleAddPlayer} className="relative w-full max-w-lg bg-[#1C1C1E] border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-[28px] p-6 text-white shadow-2xl z-10 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white flex items-center">
                <UserPlus className="w-4 h-4 mr-1.5 text-[#30D158]" /> Inscribir Nuevo Jugador
              </h3>
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
              <div className="flex flex-col space-y-1">
                <label className="px-3.5 py-2 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-semibold text-white cursor-pointer ios-touch inline-flex items-center">
                  <Upload className="w-3.5 h-3.5 mr-1 text-[#30D158]" />
                  {newAvatar ? 'Cambiar Foto' : 'Subir Foto'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleSelectPhotoForCrop(f, 'new');
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
                {newAvatar && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempImageForCrop(newAvatar);
                      setCropTarget('new');
                      setIsCropModalOpen(true);
                    }}
                    className="text-[11px] text-[#30D158] hover:underline font-semibold text-left"
                  >
                    Ajustar encuadre / Zoom 🔍
                  </button>
                )}
              </div>
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
                  <label className="text-xs text-[#8E8E93] block mb-1">Apodo</label>
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
                    placeholder="+52 998..."
                    className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#30D158]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#8E8E93] block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#30D158]"
                />
              </div>
            </div>

            {/* Role & PIN */}
            <div className="p-3.5 bg-[#2C2C2E] border border-white/10 rounded-2xl space-y-3">
              <div>
                <label className="text-xs text-[#FFD60A] font-semibold block mb-1">
                  Rol y Permisos en el Sistema
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-[#1C1C1E] border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                >
                  <option value="player">🎾 Jugador Regular</option>
                  <option value="admin">🛡️ Administrador del Torneo</option>
                  {isSuperAdmin && <option value="superadmin">👑 Super Administrador</option>}
                </select>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[#8E8E93] font-medium flex items-center">
                    <Key className="w-3.5 h-3.5 mr-1 text-[#30D158]" /> Clave / PIN Único (Máx 5 Caracteres)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPin(generateShortPin())}
                    className="text-[11px] text-[#0A84FF] hover:underline flex items-center font-medium"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Generar PIN
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={8}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.toUpperCase())}
                  placeholder="G20X9"
                  className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2 text-base text-[#30D158] font-mono font-bold uppercase focus:outline-none focus:border-[#30D158]"
                />
              </div>
            </div>

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
          <form onSubmit={handleSaveEdit} className="relative w-full max-w-lg bg-[#1C1C1E] border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-[28px] p-6 text-white shadow-2xl z-10 space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
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
              <div className="flex flex-col space-y-1">
                <label className="px-3.5 py-2 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-semibold text-white cursor-pointer ios-touch inline-flex items-center">
                  <Upload className="w-3.5 h-3.5 mr-1 text-[#30D158]" />
                  {editAvatar ? 'Cambiar Foto' : 'Subir Foto'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleSelectPhotoForCrop(f, 'edit');
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
                {editAvatar && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempImageForCrop(editAvatar);
                      setCropTarget('edit');
                      setIsCropModalOpen(true);
                    }}
                    className="text-[11px] text-[#30D158] hover:underline font-semibold text-left"
                  >
                    Ajustar encuadre / Zoom 🔍
                  </button>
                )}
              </div>
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
                  <label className="text-xs text-[#8E8E93] block mb-1">Apodo</label>
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

              <div>
                <label className="text-xs text-[#8E8E93] block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#30D158]"
                />
              </div>
            </div>

            {/* Role & Personal PIN */}
            <div className="p-3.5 bg-[#2C2C2E]/70 border border-white/10 rounded-2xl space-y-3">
              <div>
                <label className="text-xs text-[#FFD60A] font-semibold block mb-1">
                  Rol del Usuario
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full bg-[#1C1C1E] border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                >
                  <option value="player">🎾 Jugador Regular</option>
                  <option value="admin">🛡️ Administrador del Torneo</option>
                  {isSuperAdmin && <option value="superadmin">👑 Super Administrador</option>}
                </select>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[#8E8E93] font-medium flex items-center">
                    <Key className="w-3.5 h-3.5 mr-1 text-[#30D158]" /> Clave de Acceso Única (PIN)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditPin(generateShortPin())}
                    className="text-[11px] text-[#0A84FF] hover:underline flex items-center font-medium"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Generar PIN
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showEditPin ? 'text' : 'password'}
                    maxLength={8}
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value.toUpperCase())}
                    placeholder="G20X9"
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl pl-3 pr-10 py-2.5 text-sm text-[#30D158] font-mono font-bold uppercase focus:outline-none focus:border-[#30D158]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPin(!showEditPin)}
                    className="absolute right-3 top-2.5 text-[#8E8E93] hover:text-white"
                  >
                    {showEditPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
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
          const isSuper = player.role === 'superadmin';
          const isPlayerAdmin = player.role === 'admin';

          return (
            <div key={player.id} className="ios-grouped-row py-3.5 px-4 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {/* Photo */}
                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-11 h-11 rounded-full object-cover border border-white/10 flex-shrink-0 bg-[#2C2C2E]"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#2C2C2E] text-[#8E8E93] font-bold text-xs flex items-center justify-center flex-shrink-0 border border-white/10">
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                {/* Name & Metadata */}
                <div className="min-w-0 flex-1 pr-2">
                  <div
                    onClick={() => onSelectPlayerForIntelligence(player.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className="text-sm sm:text-base font-semibold text-white break-words leading-tight">
                        {player.name}
                      </span>
                      {isSuper ? (
                        <span className="text-[10px] font-black text-[#FFD60A] bg-[#FFD60A]/15 px-2 py-0.5 rounded-full flex items-center border border-[#FFD60A]/30">
                          <Crown className="w-2.5 h-2.5 mr-1 text-[#FFD60A]" /> Super Admin
                        </span>
                      ) : isPlayerAdmin ? (
                        <span className="text-[10px] font-bold text-[#64D2FF] bg-[#0A84FF]/15 px-2 py-0.5 rounded-full flex items-center border border-[#0A84FF]/30">
                          <ShieldCheck className="w-2.5 h-2.5 mr-0.5 text-[#64D2FF]" /> Admin
                        </span>
                      ) : null}
                    </div>

                    <div className="text-xs text-[#8E8E93] flex items-center space-x-2 flex-wrap mt-1">
                      <span>{player.nickname ? `"${player.nickname}"` : 'Participante'}</span>
                      
                      {/* Telemetry Activity Indicator for Admins */}
                      {(isAdmin || isSuperAdmin) && (
                        <>
                          <span>•</span>
                          {isSuperAdminPlayer(player) ? (
                            isSuperAdmin ? (
                              <span className="text-[#FFD60A] font-mono font-bold bg-[#FFD60A]/15 px-1.5 py-0.5 rounded text-[11px] border border-[#FFD60A]/30">
                                👑 TU PIN, PATRÓN: {player.pin || '-'}
                              </span>
                            ) : (
                              <span className="text-[#FFD60A] font-bold bg-[#FFD60A]/10 px-1.5 py-0.5 rounded text-[11px] border border-[#FFD60A]/20" title="¿Querías ver el PIN de Esteban? Jajaja ni lo pienses, eres un simple administrador">
                                🔒 PIN de mi Jefe (Top Secret)
                              </span>
                            )
                          ) : (
                            <span className="text-[#30D158] font-mono font-bold bg-[#30D158]/10 px-1.5 py-0.5 rounded text-[11px]">
                              🔑 PIN: {player.pin || '-'}
                            </span>
                          )}
                          <span>•</span>
                          <span className="text-[#64D2FF] text-[11px] flex items-center">
                            <MousePointer className="w-3 h-3 mr-0.5" />
                            {player.activeClicks || 0} clicks
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Admin */}
              {(isAdmin || isSuperAdmin) && (
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {isSuperAdminPlayer(player) && !isSuperAdmin ? (
                    <span
                      className="text-[11px] font-black text-[#FFD60A] bg-[#FFD60A]/15 border border-[#FFD60A]/40 px-2.5 py-1 rounded-xl flex items-center shadow-sm cursor-help"
                      title="¿Quieres borrar a mi jefe? Imposible compadre, estás chavo."
                    >
                      <Crown className="w-3.5 h-3.5 mr-1 text-[#FFD60A]" /> El Jefe (Intocable)
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRegeneratePlayerPin(player)}
                        className="p-2 text-[#FFD60A] hover:text-white bg-[#1C1C1E] rounded-xl border border-white/5 ios-touch"
                        title={`Regenerar clave única de ${player.name}`}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(player)}
                        className="p-2 text-[#8E8E93] hover:text-white bg-[#1C1C1E] rounded-xl border border-white/5 ios-touch"
                        title="Editar datos y PIN"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePlayer(player.id)}
                        className="p-2 text-[#8E8E93] hover:text-[#FF453A] bg-[#1C1C1E] rounded-xl border border-white/5 ios-touch"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              )}

              {!(isAdmin || isSuperAdmin) && (
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

      {/* Image Crop & Framing Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        imageSrc={tempImageForCrop}
        onClose={() => setIsCropModalOpen(false)}
        onConfirmCrop={handleCropConfirmed}
        cropShape="round"
        aspectRatio={1}
      />
    </div>
  );
};
