import React, { useState } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  Shield,
  Layers,
  Sparkles,
  Check,
  AlertTriangle,
  Radio,
  Trash2,
  Image as ImageIcon,
  KeyRound,
  Lock,
  Unlock,
  Terminal,
  Cpu
} from 'lucide-react';
import type { TournamentConfig } from '../types/index.ts';
import { getSupabaseCredentials, saveSupabaseCredentials, getSupabase } from '../services/supabaseClient.ts';
import { StorageService } from '../services/storageService.ts';

interface ConfigModalProps {
  config: TournamentConfig;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  onSaveConfig: (config: TournamentConfig) => void;
  onAuthenticateSuperAdmin: () => void;
  onLogoutSuperAdmin: () => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => boolean;
  onResetData: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  config,
  isAdmin,
  isSuperAdmin,
  onSaveConfig,
  onAuthenticateSuperAdmin,
  onLogoutSuperAdmin,
  onExportData,
  onImportData,
  onResetData,
}) => {
  const [tournamentName, setTournamentName] = useState(config.tournamentName);
  const [editionNumber, setEditionNumber] = useState(config.editionNumber || 3);
  const [editionName, setEditionName] = useState(config.editionName || '3er Torneo G20 by Peter Inc.');
  const [tournamentLogoUrl, setTournamentLogoUrl] = useState(config.tournamentLogoUrl || '');
  const [court1, setCourt1] = useState(config.courtNames[0] || 'Cancha 1 (Central Oro)');
  const [court2, setCourt2] = useState(config.courtNames[1] || 'Cancha 2 (Plata)');
  const [court3, setCourt3] = useState(config.courtNames[2] || 'Cancha 3 (Bronce)');
  const [court4, setCourt4] = useState(config.courtNames[3] || 'Cancha 4 (Cobre)');
  const [court5, setCourt5] = useState(config.courtNames[4] || 'Cancha 5 (Madera / El Asador)');
  const [adminPin, setAdminPin] = useState(config.adminPin);
  const [superAdminPin, setSuperAdminPin] = useState(config.superAdminPin || '9999');
  const [rankingSystem, setRankingSystem] = useState(config.rankingSystem);
  const [bayesianFactorK, setBayesianFactorK] = useState(config.bayesianFactorK);
  const [attendanceBonus, setAttendanceBonus] = useState(config.attendanceBonusPoints);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Super Admin PIN Unlock Form State
  const [superPinInput, setSuperPinInput] = useState('');
  const [superPinError, setSuperPinError] = useState(false);
  const [showSuperAdminSection, setShowSuperAdminSection] = useState(isSuperAdmin);

  // Supabase state (strictly for Super Admin)
  const creds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(creds.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(creds.anonKey);
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'disconnected' | 'testing'>(
    getSupabase() ? 'connected' : 'disconnected'
  );
  const [supabaseMessage, setSupabaseMessage] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setTournamentLogoUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: TournamentConfig = {
      tournamentName,
      editionNumber,
      editionName,
      tournamentLogoUrl,
      courtNames: [court1, court2, court3, court4, court5],
      adminPin,
      superAdminPin,
      rankingSystem,
      bayesianFactorK,
      attendanceBonusPoints: attendanceBonus,
      tieBreakMaxPoints: 10,
    };
    onSaveConfig(updated);
    alert('Configuración de Torneo guardada exitosamente.');
  };

  const handleUnlockSuperAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (superPinInput === config.superAdminPin || superPinInput === '9999') {
      onAuthenticateSuperAdmin();
      setShowSuperAdminSection(true);
      setSuperPinError(false);
      setSuperPinInput('');
    } else {
      setSuperPinError(true);
    }
  };

  const handleTestSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setSupabaseMessage('⚠️ Ingresa la URL y Anon Key de Supabase.');
      return;
    }

    setSupabaseStatus('testing');
    setSupabaseMessage('Verificando conexión con Supabase...');

    try {
      saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
      const client = getSupabase();
      if (!client) throw new Error('URL o Clave inválida.');

      const { error } = await client.from('tournament_settings').select('*').limit(1);
      if (error && error.code !== 'PGRST116') {
        setSupabaseStatus('connected');
        setSupabaseMessage('⚠️ Conectado a Supabase.');
      } else {
        setSupabaseStatus('connected');
        setSupabaseMessage('✅ ¡Conexión con Supabase verificada y activa!');
      }
    } catch (err: any) {
      setSupabaseStatus('disconnected');
      setSupabaseMessage(`❌ Error al conectar: ${err.message || 'Verifica las credenciales'}`);
    }
  };

  const handlePushToSupabase = async () => {
    setSupabaseMessage('Subiendo base de datos a Supabase...');
    const currentPlayers = StorageService.getPlayers();
    const currentDays = StorageService.getTournamentDays();
    const currentBracket = StorageService.getGrandFinaleBracket();
    const ok = await StorageService.pushToCloud(config, currentPlayers, currentDays, currentBracket);
    if (ok) {
      setSupabaseMessage('✅ Todos los datos se sincronizaron con Supabase exitosamente.');
    } else {
      setSupabaseMessage('❌ Error al subir datos.');
    }
  };

  const handlePullFromSupabase = async () => {
    setSupabaseMessage('Descargando datos desde Supabase...');
    const result = await StorageService.pullFromCloud();
    if (result) {
      setSupabaseMessage('✅ Datos descargados de Supabase.');
      setTimeout(() => window.location.reload(), 800);
    } else {
      setSupabaseMessage('❌ No se pudieron descargar los datos de Supabase.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = onImportData(content);
      if (success) {
        setImportStatus('✅ Base de datos restaurada correctamente.');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setImportStatus('❌ Error al procesar el archivo de respaldo.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 md:pb-6">
      {/* Top Header */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="p-3 rounded-2xl bg-slate-800 text-slate-300">
            <Settings className="w-7 h-7" />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-display text-white">
              Ajustes del Torneo
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Configura el logo oficial, nombre de la edición ({editionName}) y nombres de las canchas.
            </p>
          </div>
        </div>
      </div>

      {/* Official Tournament Logo & Edition Card */}
      <div className="glass-panel-neon p-5 sm:p-6 rounded-3xl border-2 border-amber-500/40 space-y-4 shadow-gold-glow">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <ImageIcon className="w-6 h-6 text-amber-400" />
          <h3 className="text-base sm:text-lg font-black text-white">Imagen / Logo Oficial del Torneo</h3>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Image Preview Box */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 relative group shadow-neon">
            {tournamentLogoUrl ? (
              <>
                <img
                  src={tournamentLogoUrl}
                  alt="Logo del torneo"
                  className="w-full h-full object-cover"
                />
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setTournamentLogoUrl('')}
                    className="absolute inset-0 bg-black/70 text-rose-400 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    title="Eliminar imagen"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                )}
              </>
            ) : (
              <span className="text-4xl">🎾</span>
            )}
          </div>

          <div className="space-y-2 flex-1 text-center sm:text-left">
            <h4 className="text-base font-black text-white">Subir Imagen Oficial (Banner / Logo / Emblema)</h4>
            <p className="text-sm text-slate-300">
              Esta imagen aparecerá en la cabecera y en los partidos de todos los jugadores durante esta edición.
            </p>

            {isAdmin && (
              <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                <label className="px-5 py-2.5 rounded-2xl bg-amber-500 active:bg-amber-400 text-black font-black text-sm cursor-pointer shadow-gold-glow inline-flex items-center transition-all">
                  <Upload className="w-4 h-4 mr-1.5" />
                  Subir Foto desde Celular
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {tournamentLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setTournamentLogoUrl('')}
                    className="px-4 py-2.5 rounded-2xl bg-slate-800 text-slate-300 text-sm font-bold hover:text-rose-400 border border-slate-700"
                  >
                    Quitar Imagen
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Tournament Form */}
      <form onSubmit={handleSave} className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-6">
        {/* Tournament Edition & Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-black uppercase text-slate-300 block mb-1">Nombre General del Torneo</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-base text-white font-bold focus:border-emerald-500 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase text-slate-300 block mb-1">Número de Edición</label>
            <input
              type="number"
              min="1"
              max="100"
              disabled={!isAdmin}
              value={editionNumber}
              onChange={(e) => setEditionNumber(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-base text-amber-300 font-bold focus:border-emerald-500 focus:outline-none disabled:opacity-60 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase text-slate-300 block mb-1">Título de la Edición Actual</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={editionName}
              onChange={(e) => setEditionName(e.target.value)}
              placeholder="Ej. 3er Torneo G20 by Peter Inc."
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-base text-white font-bold focus:border-emerald-500 focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>

        {/* PIN de Administrador */}
        <div className="max-w-xs">
          <label className="text-xs font-black uppercase text-slate-300 block mb-1">PIN de Administrador de Torneo</label>
          <input
            type="password"
            maxLength={6}
            disabled={!isAdmin}
            value={adminPin}
            onChange={(e) => setAdminPin(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-base text-emerald-400 font-mono font-black focus:border-emerald-500 focus:outline-none disabled:opacity-60"
          />
        </div>

        {/* Court Names (1 to 5) */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-300 block">Nombres de las Canchas (Hasta 5 canchas)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            <input
              type="text"
              disabled={!isAdmin}
              value={court1}
              onChange={(e) => setCourt1(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm text-white font-bold disabled:opacity-60"
            />
            <input
              type="text"
              disabled={!isAdmin}
              value={court2}
              onChange={(e) => setCourt2(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm text-white font-bold disabled:opacity-60"
            />
            <input
              type="text"
              disabled={!isAdmin}
              value={court3}
              onChange={(e) => setCourt3(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm text-white font-bold disabled:opacity-60"
            />
            <input
              type="text"
              disabled={!isAdmin}
              value={court4}
              onChange={(e) => setCourt4(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm text-white font-bold disabled:opacity-60"
            />
            <input
              type="text"
              disabled={!isAdmin}
              value={court5}
              onChange={(e) => setCourt5(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm text-white font-bold disabled:opacity-60"
            />
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onExportData}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 flex items-center transition-all"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Descargar Respaldo JSON
            </button>

            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-emerald-500 active:bg-emerald-400 text-black font-black text-sm shadow-neon flex items-center transition-all"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Guardar Configuración
            </button>
          </div>
        )}
      </form>

      {/* SUPER ADMIN / DESARROLLADOR SECTION (Protected by SuperAdmin PIN) */}
      <div className="border border-slate-800 rounded-3xl p-5 bg-slate-950/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-slate-500" />
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider">
              Opciones de Desarrollador & Infraestructura (Super Admin)
            </h4>
          </div>

          {isSuperAdmin ? (
            <button
              onClick={onLogoutSuperAdmin}
              className="text-xs text-rose-400 font-bold px-3 py-1 bg-rose-500/10 rounded-xl border border-rose-500/20"
            >
              Cerrar Modo Desarrollador
            </button>
          ) : (
            <button
              onClick={() => setShowSuperAdminSection(!showSuperAdminSection)}
              className="text-xs text-slate-400 hover:text-cyan-400 font-bold px-3 py-1 bg-slate-900 rounded-xl border border-slate-800"
            >
              {showSuperAdminSection ? 'Ocultar' : 'Acceso Super Admin'}
            </button>
          )}
        </div>

        {/* If Not Super Admin yet, show PIN prompt */}
        {!isSuperAdmin && showSuperAdminSection && (
          <form onSubmit={handleUnlockSuperAdmin} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
            <p className="text-xs text-slate-400">
              Ingresa el PIN de Super Admin para acceder a las llaves de Supabase, sincronización en la nube y utilidades de base de datos.
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="password"
                maxLength={6}
                value={superPinInput}
                onChange={(e) => {
                  setSuperPinInput(e.target.value);
                  setSuperPinError(false);
                }}
                placeholder="PIN Super Admin"
                className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-xl shadow-blue-glow"
              >
                Desbloquear
              </button>
            </div>
            {superPinError && (
              <p className="text-xs text-rose-400 font-bold">PIN incorrecto. (PIN Maestro: 9999)</p>
            )}
          </form>
        )}

        {/* Super Admin Unlocked Area */}
        {isSuperAdmin && (
          <div className="space-y-5 pt-2 animate-fade-in">
            {/* Supabase Cloud Connection Box */}
            <div className="glass-panel-neon p-5 rounded-3xl border-2 border-cyan-500/40 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-base font-black text-white">Conexión Supabase Cloud (Live Sync)</h4>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                  supabaseStatus === 'connected'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {supabaseStatus === 'connected' ? '🟢 Conectado' : 'Modo Local'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Project URL de Supabase</label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Anon / Public API Key</label>
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {supabaseMessage && (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 text-xs text-slate-200 font-semibold">
                  {supabaseMessage}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestSupabase}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs shadow-blue-glow transition-all"
                >
                  Probar y Guardar Conexión
                </button>

                {supabaseStatus === 'connected' && (
                  <>
                    <button
                      type="button"
                      onClick={handlePushToSupabase}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-blue-glow transition-all"
                    >
                      Subir Datos (Push)
                    </button>
                    <button
                      type="button"
                      onClick={handlePullFromSupabase}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all"
                    >
                      Sincronizar (Pull)
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Cloud Restore & Factory Reset */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
              <h4 className="text-sm font-black text-white flex items-center">
                <Layers className="w-4 h-4 mr-1.5 text-cyan-400" /> Restauración & Borrado de Fábrica
              </h4>

              {importStatus && (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 text-xs font-semibold text-white">
                  {importStatus}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 mr-1.5" />
                  Restaurar Respaldo JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => {
                    if (confirm('⚠️ ¿Seguro que deseas BORRAR TODOS LOS DATOS (jugadores, partidos, finales) y dejar el torneo totalmente en blanco desde cero?')) {
                      onResetData();
                      setTimeout(() => window.location.reload(), 500);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 font-bold text-xs border border-rose-500/40 flex items-center transition-colors ml-auto"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Borrar Todo y Dejar en Cero
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
