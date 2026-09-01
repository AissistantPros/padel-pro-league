import React, { useState } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  RotateCcw,
  Shield,
  Layers,
  Sparkles,
  Check,
  AlertTriangle,
  Radio,
  Trash2
} from 'lucide-react';
import type { TournamentConfig } from '../types/index.ts';
import { getSupabaseCredentials, saveSupabaseCredentials, getSupabase } from '../services/supabaseClient.ts';
import { StorageService } from '../services/storageService.ts';

interface ConfigModalProps {
  config: TournamentConfig;
  isAdmin: boolean;
  onSaveConfig: (config: TournamentConfig) => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => boolean;
  onResetData: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  config,
  isAdmin,
  onSaveConfig,
  onExportData,
  onImportData,
  onResetData,
}) => {
  const [tournamentName, setTournamentName] = useState(config.tournamentName);
  const [court1, setCourt1] = useState(config.courtNames[0] || 'Cancha 1 (Central Oro)');
  const [court2, setCourt2] = useState(config.courtNames[1] || 'Cancha 2 (Plata)');
  const [court3, setCourt3] = useState(config.courtNames[2] || 'Cancha 3 (Bronce)');
  const [court4, setCourt4] = useState(config.courtNames[3] || 'Cancha 4 (Cobre / El Asador)');
  const [adminPin, setAdminPin] = useState(config.adminPin);
  const [rankingSystem, setRankingSystem] = useState(config.rankingSystem);
  const [bayesianFactorK, setBayesianFactorK] = useState(config.bayesianFactorK);
  const [attendanceBonus, setAttendanceBonus] = useState(config.attendanceBonusPoints);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Supabase state
  const creds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(creds.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(creds.anonKey);
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'disconnected' | 'testing'>(
    getSupabase() ? 'connected' : 'disconnected'
  );
  const [supabaseMessage, setSupabaseMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: TournamentConfig = {
      tournamentName,
      courtNames: [court1, court2, court3, court4],
      adminPin,
      rankingSystem,
      bayesianFactorK,
      attendanceBonusPoints: attendanceBonus,
      tieBreakMaxPoints: 10,
    };
    onSaveConfig(updated);
    alert('Configuración guardada exitosamente.');
  };

  const handleTestSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setSupabaseMessage('⚠️ Por favor ingresa tanto la URL como la Anon Key de Supabase.');
      return;
    }

    setSupabaseStatus('testing');
    setSupabaseMessage('Verificando conexión con Supabase...');

    try {
      saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
      const client = getSupabase();
      if (!client) {
        throw new Error('URL o Clave inválida.');
      }

      const { error } = await client.from('tournament_settings').select('*').limit(1);
      if (error && error.code !== 'PGRST116') {
        setSupabaseStatus('connected');
        setSupabaseMessage('⚠️ Conectado a Supabase.');
      } else {
        setSupabaseStatus('connected');
        setSupabaseMessage('✅ ¡Conexión con Supabase exitosa y en tiempo real!');
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
      setSupabaseMessage('✅ Datos descargados de Supabase y cargados en memoria.');
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="p-2.5 rounded-2xl bg-slate-800 text-slate-300">
            <Settings className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-display text-white">
              Configuración del Torneo & Nube
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Conexión en tiempo real con Supabase, nombres de canchas, PIN de seguridad y respaldos.
            </p>
          </div>
        </div>
      </div>

      {/* Supabase Cloud Connection Box */}
      <div className="glass-panel-neon p-5 sm:p-6 rounded-3xl border-2 border-emerald-500/40 space-y-4 shadow-neon">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center">
                Conexión Cloud con Supabase (Realtime Sync)
              </h3>
              <span className="text-xs text-slate-400">
                Permite que todos los jugadores vean marcadores en vivo en sus celulares.
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center ${
              supabaseStatus === 'connected'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              <Radio className="w-3 h-3 mr-1.5 animate-pulse" />
              {supabaseStatus === 'connected' ? '🟢 Supabase Conectado' : 'Modo Local'}
            </span>
          </div>
        </div>

        {/* Credentials Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Project URL de Supabase
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzabcdefg.supabase.co"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Anon / Public API Key
            </label>
            <input
              type="password"
              disabled={!isAdmin}
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>

        {supabaseMessage && (
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700 text-xs text-slate-200 font-semibold">
            {supabaseMessage}
          </div>
        )}

        {/* Supabase Actions */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleTestSupabase}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-neon transition-all"
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
                  Subir Datos Actuales a la Nube (Push)
                </button>
                <button
                  type="button"
                  onClick={handlePullFromSupabase}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all"
                >
                  Sincronizar desde la Nube (Pull)
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-6">
        {/* Tournament Name & PIN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Nombre del Torneo</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:border-emerald-500 focus:outline-none disabled:opacity-60"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">PIN de Administrador</label>
            <input
              type="password"
              maxLength={6}
              disabled={!isAdmin}
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:border-emerald-500 focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>

        {/* Court Names */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">Nombres de las 4 Canchas</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="text"
              disabled={!isAdmin}
              value={court1}
              onChange={(e) => setCourt1(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-bold disabled:opacity-60"
            />
            <input
              type="text"
              disabled={!isAdmin}
              value={court2}
              onChange={(e) => setCourt2(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-bold disabled:opacity-60"
            />
            <input
              type="text"
              disabled={!isAdmin}
              value={court3}
              onChange={(e) => setCourt3(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-bold disabled:opacity-60"
            />
            <input
              type="text"
              disabled={!isAdmin}
              value={court4}
              onChange={(e) => setCourt4(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-bold disabled:opacity-60"
            />
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm shadow-neon flex items-center transition-all"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Guardar Configuración
            </button>
          </div>
        )}
      </form>

      {/* Backup & Hard Reset Data Management Card */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-black text-white">Copia de Seguridad & Limpieza</h3>
        </div>
        <p className="text-xs text-slate-300">
          Descarga un archivo JSON con toda la base de datos para respaldar, o limpia todo para iniciar de cero.
        </p>

        {importStatus && (
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 text-xs font-semibold text-white">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onExportData}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-blue-glow flex items-center transition-all"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Descargar Respaldo JSON
          </button>

          {isAdmin && (
            <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 flex items-center cursor-pointer transition-colors">
              <Upload className="w-4 h-4 mr-1.5" />
              Restaurar Respaldo
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                if (confirm('⚠️ ¿Seguro que deseas BORRAR TODOS LOS DATOS (jugadores, partidos, finales) y dejar el torneo totalmente en blanco desde cero?')) {
                  onResetData();
                  setTimeout(() => window.location.reload(), 500);
                }
              }}
              className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 font-bold text-xs sm:text-sm border border-rose-500/40 flex items-center transition-colors ml-auto"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Borrar Todo y Dejar en Cero
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
