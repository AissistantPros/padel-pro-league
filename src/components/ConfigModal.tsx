import React, { useState } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  Sparkles,
  Check,
  Trash2,
  Image as ImageIcon,
  KeyRound,
  Lock,
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
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Super Admin PIN Unlock Form State
  const [superPinInput, setSuperPinInput] = useState('');
  const [superPinError, setSuperPinError] = useState(false);
  const [showSuperAdminSection, setShowSuperAdminSection] = useState(isSuperAdmin);

  // Supabase state
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
      ...config,
      tournamentName,
      editionNumber,
      editionName,
      tournamentLogoUrl,
      courtNames: [court1, court2, court3, court4, court5],
      adminPin,
      superAdminPin,
    };
    onSaveConfig(updated);
    alert('Ajustes guardados correctamente.');
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
      setSupabaseMessage('⚠️ Ingresa la URL y Anon Key.');
      return;
    }

    setSupabaseStatus('testing');
    setSupabaseMessage('Verificando conexión...');

    try {
      saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
      const client = getSupabase();
      if (!client) throw new Error('Credenciales inválidas.');

      const { error } = await client.from('tournament_settings').select('*').limit(1);
      if (error && error.code !== 'PGRST116') {
        setSupabaseStatus('connected');
        setSupabaseMessage('Conectado.');
      } else {
        setSupabaseStatus('connected');
        setSupabaseMessage('✅ ¡Conexión con Supabase verificada!');
      }
    } catch (err: any) {
      setSupabaseStatus('disconnected');
      setSupabaseMessage(`❌ Error: ${err.message || 'Error de conexión'}`);
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
        setImportStatus('✅ Respaldo restaurado.');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setImportStatus('❌ Error al procesar archivo.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-20 md:pb-6 select-none">
      {/* Header */}
      <div className="pt-1 pb-1">
        <span className="text-xs font-semibold text-[#8E8E93]">Panel de Control</span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
          Ajustes
        </h1>
      </div>

      {/* Main Settings Form (Apple Grouped Style) */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Logo Card */}
        <div className="ios-card p-5 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] block">
            Logo Oficial del Torneo
          </span>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-[#2C2C2E] border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {tournamentLogoUrl ? (
                <img src={tournamentLogoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-6 h-6 text-[#8E8E93]" />
              )}
            </div>
            <label className="px-3.5 py-2 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-semibold text-white cursor-pointer ios-touch inline-flex items-center">
              <Upload className="w-3.5 h-3.5 mr-1 text-[#30D158]" />
              {tournamentLogoUrl ? 'Cambiar Logo' : 'Subir Logo'}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* General Info Grouped List */}
        <div className="ios-grouped-list divide-y divide-white/5">
          <div className="p-3.5 flex items-center justify-between">
            <label className="text-xs text-[#8E8E93] w-32 flex-shrink-0">Nombre del Torneo</label>
            <input
              type="text"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              className="w-full bg-transparent text-right text-sm text-white font-medium focus:outline-none"
            />
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <label className="text-xs text-[#8E8E93] w-32 flex-shrink-0">Edición Actual</label>
            <input
              type="text"
              value={editionName}
              onChange={(e) => setEditionName(e.target.value)}
              className="w-full bg-transparent text-right text-sm text-white font-medium focus:outline-none"
            />
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <label className="text-xs text-[#8E8E93] w-32 flex-shrink-0">PIN Administrador</label>
            <input
              type="password"
              maxLength={6}
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              className="w-full bg-transparent text-right text-sm text-[#30D158] font-mono font-bold focus:outline-none"
            />
          </div>
        </div>

        {/* Court Names Grouped List */}
        <div className="ios-grouped-list divide-y divide-white/5">
          <div className="p-3 bg-[#2C2C2E]/40 text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
            Nombres de Canchas
          </div>
          {[
            { val: court1, set: setCourt1, label: 'Cancha 1' },
            { val: court2, set: setCourt2, label: 'Cancha 2' },
            { val: court3, set: setCourt3, label: 'Cancha 3' },
            { val: court4, set: setCourt4, label: 'Cancha 4' },
            { val: court5, set: setCourt5, label: 'Cancha 5' },
          ].map((c, i) => (
            <div key={i} className="p-3 flex items-center justify-between">
              <label className="text-xs text-[#8E8E93] w-24 flex-shrink-0">{c.label}</label>
              <input
                type="text"
                value={c.val}
                onChange={(e) => c.set(e.target.value)}
                className="w-full bg-transparent text-right text-sm text-white font-medium focus:outline-none"
              />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-1">
          <button
            type="button"
            onClick={onExportData}
            className="w-1/3 py-3 rounded-xl bg-[#2C2C2E] text-xs font-semibold text-white ios-touch flex items-center justify-center"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Descargar JSON
          </button>
          <button
            type="submit"
            className="w-2/3 py-3 rounded-xl bg-[#30D158] active:bg-[#28B84B] text-black font-bold text-sm ios-touch flex items-center justify-center"
          >
            <Save className="w-4 h-4 mr-1.5" />
            Guardar Ajustes
          </button>
        </div>
      </form>

      {/* Super Admin Section */}
      <div className="ios-card p-4 space-y-3 border border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
            Opciones Avanzadas (Super Admin)
          </span>
          {!isSuperAdmin && (
            <button
              onClick={() => setShowSuperAdminSection(!showSuperAdminSection)}
              className="text-xs text-[#0A84FF] font-semibold"
            >
              {showSuperAdminSection ? 'Ocultar' : 'Acceder'}
            </button>
          )}
        </div>

        {!isSuperAdmin && showSuperAdminSection && (
          <form onSubmit={handleUnlockSuperAdmin} className="space-y-2 pt-1">
            <div className="flex items-center space-x-2">
              <input
                type="password"
                maxLength={6}
                value={superPinInput}
                onChange={(e) => setSuperPinInput(e.target.value)}
                placeholder="PIN Super Admin (9999)"
                className="bg-[#2C2C2E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white flex-1"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-[#0A84FF] text-white font-bold text-xs rounded-xl ios-touch"
              >
                Entrar
              </button>
            </div>
            {superPinError && (
              <p className="text-xs text-[#FF453A]">PIN incorrecto (9999)</p>
            )}
          </form>
        )}

        {isSuperAdmin && (
          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1.5">
              <label className="text-[#8E8E93] block">Supabase URL</label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl p-2 font-mono text-white text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[#8E8E93] block">Supabase Anon Key</label>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl p-2 font-mono text-white text-xs"
              />
            </div>

            {supabaseMessage && (
              <p className="text-xs text-white p-2 bg-[#2C2C2E] rounded-lg">{supabaseMessage}</p>
            )}

            <button
              onClick={handleTestSupabase}
              className="w-full py-2 bg-[#0A84FF] text-white font-bold rounded-xl ios-touch"
            >
              Guardar y Probar Conexión
            </button>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <label className="px-3 py-1.5 bg-[#2C2C2E] text-white rounded-lg cursor-pointer inline-flex items-center">
                <Upload className="w-3 h-3 mr-1" /> Restaurar JSON
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                onClick={() => {
                  if (confirm('⚠️ ¿Borrar todos los datos y reiniciar el torneo?')) {
                    onResetData();
                    setTimeout(() => window.location.reload(), 500);
                  }
                }}
                className="text-[#FF453A] font-semibold"
              >
                Borrado de Fábrica
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
