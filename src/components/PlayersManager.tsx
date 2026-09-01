import React, { useState } from 'react';
import { Users, UserPlus, Edit2, Trash2, Check, X, Shield, Phone, Mail, FileText, Sparkles } from 'lucide-react';
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
  const [newName, setNewName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: newName.trim(),
      nickname: newNickname.trim() || undefined,
      phone: newPhone.trim() || undefined,
      registeredAt: new Date().toISOString().split('T')[0],
      isActive: true,
    };

    onSavePlayers([...players, newPlayer]);
    setNewName('');
    setNewNickname('');
    setNewPhone('');
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
      // Support format "Nombre (Apodo)" or "Nombre"
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
  };

  const handleSaveEdit = (playerId: string) => {
    const updated = players.map(p =>
      p.id === playerId ? { ...p, name: editName.trim(), nickname: editNickname.trim() || undefined } : p
    );
    onSavePlayers(updated);
    setEditingPlayerId(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2.5 rounded-2xl bg-slate-800 text-slate-200">
              <Users className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black font-display text-white">
                  Roster de Jugadores
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  players.length === 16
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {players.length} / 16 Jugadores
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Inscribe a los participantes del G20. Puedes agregarlos de a uno o pegar la lista completa.
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
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-extrabold text-xs sm:text-sm border border-slate-700 flex items-center transition-all"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Pegar Lista Rápida
            </button>

            <button
              onClick={() => {
                setIsAddingPlayer(!isAddingPlayer);
                setIsBulkAdding(false);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm shadow-neon flex items-center transition-all"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Inscribir 1 por 1
            </button>
          </div>
        )}
      </div>

      {/* Bulk Import Modal / Form */}
      {isBulkAdding && (
        <form onSubmit={handleBulkImport} className="glass-panel-neon p-5 sm:p-6 rounded-3xl space-y-4 animate-fade-in border-2 border-cyan-500/40">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-black text-cyan-300 flex items-center">
              <FileText className="w-4 h-4 mr-1.5" /> Pegar Lista de Nombres (1 por línea)
            </h3>
            <button
              type="button"
              onClick={() => setIsBulkAdding(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg font-bold"
            >
              Cancelar
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Pega aquí los nombres copiados de WhatsApp, Excel o Notas (un nombre por renglón). Opcional: puedes poner apodos entre paréntesis como <code>Juan Pérez (El Rayo)</code>.
          </p>

          <textarea
            rows={8}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`Alejandro Galán (Ale)\nJuan Lebrón (El Lobo)\nAgustín Tapia (El Mozart)\nArturo Coello\n...`}
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3.5 text-sm text-white font-mono focus:border-cyan-400 focus:outline-none"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs sm:text-sm shadow-blue-glow flex items-center"
            >
              <Sparkles className="w-4 h-4 mr-1.5" /> Importar Jugadores a la Lista
            </button>
          </div>
        </form>
      )}

      {/* Add Single Player Form */}
      {isAddingPlayer && (
        <form onSubmit={handleAddPlayer} className="glass-panel-neon p-5 rounded-3xl space-y-4 animate-fade-in border-2 border-emerald-500/40">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-black text-white flex items-center">
              <UserPlus className="w-4 h-4 mr-1.5 text-emerald-400" /> Nuevo Jugador
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingPlayer(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg font-bold"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Apodo / Nickname</label>
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="Ej. El Rayo"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Teléfono / WhatsApp</label>
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Ej. +52 55 1234 5678"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm shadow-neon flex items-center"
            >
              <Check className="w-4 h-4 mr-1.5" /> Guardar Jugador
            </button>
          </div>
        </form>
      )}

      {/* Zero State if Empty */}
      {players.length === 0 && (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 space-y-4">
          <Users className="w-16 h-16 text-slate-600 mx-auto" />
          <h3 className="text-xl font-black text-white">No hay jugadores inscritos todavía</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Comienza inscribiendo a los 16 jugadores de tu torneo G20. Puedes escribir uno por uno o usar el botón de <strong>"Pegar Lista Rápida"</strong> para cargarlos todos de un solo golpe.
          </p>
          {isAdmin && (
            <button
              onClick={() => setIsBulkAdding(true)}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-neon inline-flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" /> Pegar Lista de 16 Jugadores
            </button>
          )}
        </div>
      )}

      {/* Players List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {players.map((player) => {
          const stats = statsList.find(s => s.playerId === player.id);
          const isEditing = editingPlayerId === player.id;

          return (
            <div
              key={player.id}
              className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 bg-[#121826]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-sm text-emerald-400">
                      {player.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white font-bold"
                          />
                          <input
                            type="text"
                            value={editNickname}
                            onChange={(e) => setEditNickname(e.target.value)}
                            placeholder="Apodo"
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-400"
                          />
                        </div>
                      ) : (
                        <>
                          <h4
                            onClick={() => onSelectPlayerForIntelligence(player.id)}
                            className="text-sm font-extrabold text-white hover:text-emerald-400 transition-colors cursor-pointer"
                          >
                            {player.name}
                          </h4>
                          {player.nickname && (
                            <span className="text-xs text-slate-400 italic font-medium">"{player.nickname}"</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    player.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {player.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Mini Stats snapshot if played */}
                {stats && stats.totalMatchesPlayed > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">Ranking</span>
                      <span className="font-black text-white font-mono">#{stats.currentRank}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">Efectividad</span>
                      <span className="font-black text-emerald-400 font-mono">{stats.winRatePercentage}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">Puntos</span>
                      <span className="font-black text-blue-400 font-mono">{stats.totalChampionshipPoints.toFixed(3)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  {isEditing ? (
                    <div className="flex space-x-1.5 w-full">
                      <button
                        onClick={() => handleSaveEdit(player.id)}
                        className="flex-1 py-1 bg-emerald-500 text-black font-bold rounded text-xs"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingPlayerId(null)}
                        className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartEdit(player)}
                        className="text-slate-400 hover:text-white flex items-center font-bold"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
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
                        <Trash2 className="w-3.5 h-3.5" />
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
