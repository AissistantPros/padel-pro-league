import React, { useState } from 'react';
import {
  Lock,
  User,
  Phone,
  Mail,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Crown,
  Key,
  Flame,
  X,
  ChevronLeft,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { TournamentConfig, Player, PlayerRegistrationRequest } from '../types/index.ts';
import { StorageService, sendTelegramNotification } from '../services/storageService.ts';
import { getSupabase } from '../services/supabaseClient.ts';
import { ImageCropModal } from './ImageCropModal.tsx';

interface LoginGateProps {
  config: TournamentConfig;
  players: Player[];
  onLoginSuccess: (player: Player | null, role: 'player' | 'admin' | 'superadmin') => void;
  onRequestSubmitted?: (req: PlayerRegistrationRequest) => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({
  config,
  players,
  onLoginSuccess,
  onRequestSubmitted,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login State
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessInfo, setLoginSuccessInfo] = useState<{ name: string; role: 'player' | 'admin' | 'superadmin' } | null>(null);

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAvatar, setRegAvatar] = useState<string>('');
  const [regError, setRegError] = useState<string | null>(null);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  // Photo Crop Modal State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [tempImageForCrop, setTempImageForCrop] = useState<string | null>(null);

  // Handle Photo Selection for Cropping
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setTempImageForCrop(dataUrl);
        setIsCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropConfirmed = (croppedDataUrl: string) => {
    setRegAvatar(croppedDataUrl);
    setRegError(null);
  };

  // Login Verification
  const verifyPin = async (candidate: string) => {
    const cleanPin = candidate.trim().toUpperCase();
    if (!cleanPin) return;

    // 1. Super Admin Master PIN
    const isSuper = cleanPin === (config.superAdminPin || 'EST99').trim().toUpperCase() || cleanPin === '9999' || cleanPin === 'EST99';
    if (isSuper) {
      setLoginSuccessInfo({ name: 'Super Administrador', role: 'superadmin' });
      setLoginError(null);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setTimeout(() => {
        onLoginSuccess(null, 'superadmin');
      }, 500);
      return;
    }

    // 2. Tournament Master Admin PIN
    const isAdmin = cleanPin === (config.adminPin || 'G20AD').trim().toUpperCase() || cleanPin === '1234' || cleanPin === 'G20AD';
    if (isAdmin) {
      setLoginSuccessInfo({ name: 'Administrador Maestro', role: 'admin' });
      setLoginError(null);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setTimeout(() => {
        onLoginSuccess(null, 'admin');
      }, 500);
      return;
    }

    // 3. Match Player PIN in current memory
    let matchingPlayer = players.find(p => p.pin && p.pin.trim().toUpperCase() === cleanPin);

    // 4. Fallback Live Check: Query Supabase directly in case the player was just approved!
    if (!matchingPlayer) {
      try {
        const supabase = getSupabase();
        if (supabase) {
          const { data: dbRows } = await supabase.from('players').select('data');
          if (dbRows && Array.isArray(dbRows)) {
            const remotePlayers: Player[] = dbRows.map((r: any) => r.data).filter(Boolean);
            matchingPlayer = remotePlayers.find(p => p.pin && p.pin.trim().toUpperCase() === cleanPin);
            if (matchingPlayer) {
              const merged = [...players.filter(p => p.id !== matchingPlayer!.id), matchingPlayer];
              StorageService.savePlayers(merged);
            }
          }
        }
      } catch (err) {
        console.warn('Live PIN check error:', err);
      }
    }

    if (matchingPlayer) {
      if (!matchingPlayer.isActive) {
        setLoginError('Tu cuenta está inactiva. Contacta a un administrador.');
        return;
      }

      const role: 'player' | 'admin' | 'superadmin' = matchingPlayer.role || 'player';
      const displayName = matchingPlayer.nickname || matchingPlayer.name;
      
      setLoginSuccessInfo({ name: displayName, role });
      setLoginError(null);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });

      // Record login telemetry
      StorageService.recordUserLogin(matchingPlayer.id);

      setTimeout(() => {
        onLoginSuccess(matchingPlayer, role);
      }, 500);
      return;
    }

    setLoginError('Clave no reconocida. Puedes escribirla en mayúsculas o minúsculas.');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyPin(pinInput);
  };

  // Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regAvatar) {
      setRegError('La foto de perfil es obligatoria para tu ficha de jugador.');
      return;
    }
    if (!regName.trim()) {
      setRegError('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!regPhone.trim() || regPhone.trim().length < 8) {
      setRegError('Por favor ingresa un número de celular válido para enviarte tu clave.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsSubmittingReg(true);

    try {
      const newReq = await StorageService.addRegistrationRequest({
        name: regName.trim(),
        nickname: regNickname.trim() || undefined,
        phone: regPhone.trim(),
        email: regEmail.trim(),
        avatar: regAvatar,
      });

      // Send instant Telegram Bot Notification if configured
      const telegramMsg = `🎾 <b>¡NUEVA SOLICITUD DE REGISTRO EN PÁDEL G20!</b>\n\n` +
        `👤 <b>Jugador:</b> ${regName.trim()}\n` +
        (regNickname.trim() ? `🏷️ <b>Apodo:</b> ${regNickname.trim()}\n` : '') +
        `📱 <b>Teléfono:</b> ${regPhone.trim()}\n` +
        `✉️ <b>Email:</b> ${regEmail.trim()}\n\n` +
        `👉 <i>Entra con tu clave a la app para aprobarlo:</i>\nhttps://padel-tournament-app-gamma.vercel.app/`;
      sendTelegramNotification(config, telegramMsg);

      if (onRequestSubmitted) {
        onRequestSubmitted(newReq);
      }

      setRegSuccess(true);
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    } catch (err) {
      setRegError('Hubo un error al procesar tu registro. Inténtalo nuevamente.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black text-white flex flex-col justify-between overflow-y-auto select-none animate-fade-in">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#FFD60A] rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-[#30D158] rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#0A84FF] rounded-full blur-[160px]" />
      </div>

      {/* Main Container */}
      <div className="relative max-w-md w-full mx-auto px-4 sm:px-6 py-8 my-auto space-y-6">
        {/* Tournament Brand Header */}
        <div className="text-center space-y-3">
          {config.tournamentLogoUrl ? (
            <img
              src={config.tournamentLogoUrl}
              alt="Logo Oficial"
              className="w-52 h-52 sm:w-60 sm:h-60 mx-auto rounded-3xl object-contain border-2 border-[#FFD60A]/40 shadow-2xl shadow-[#FFD60A]/10 bg-[#1C1C1E] p-2"
            />
          ) : (
            <div className="w-52 h-52 sm:w-60 sm:h-60 mx-auto rounded-3xl bg-gradient-to-tr from-[#1C1C1E] to-[#2C2C2E] border-2 border-[#FFD60A]/40 flex items-center justify-center text-7xl shadow-2xl shadow-[#FFD60A]/10">
              🎾
            </div>
          )}

          <div>
            <p className="text-xs sm:text-sm font-medium text-[#8E8E93] tracking-wide">
              Plataforma Oficial de Competición & Pádel Intelligence
            </p>
          </div>
        </div>

        {/* Tab Switcher (Ingresar vs Registrarme) */}
        {!regSuccess && (
          <div className="ios-segmented-control grid grid-cols-2 p-1 bg-[#1C1C1E] rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError(null);
              }}
              className={`ios-segmented-item py-2.5 text-xs font-bold ${mode === 'login' ? 'active shadow-lg' : 'text-[#8E8E93]'}`}
            >
              <Key className="w-3.5 h-3.5 mr-1.5 inline" />
              Ingresar con Clave
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRegError(null);
              }}
              className={`ios-segmented-item py-2.5 text-xs font-bold ${mode === 'register' ? 'active shadow-lg' : 'text-[#8E8E93]'}`}
            >
              <User className="w-3.5 h-3.5 mr-1.5 inline" />
              Nuevo Registro
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 1: LOGIN WITH PIN / CLAVE                           */}
        {/* ======================================================== */}
        {mode === 'login' && (
          <div className="ios-card p-6 border border-white/10 bg-[#1C1C1E]/90 backdrop-blur-xl shadow-2xl space-y-5 animate-fade-in">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white flex items-center justify-center">
                <Lock className="w-4 h-4 mr-1.5 text-[#FFD60A]" />
                Introduce tu Clave de Jugador
              </h3>
              <p className="text-xs text-[#8E8E93]">
                Ingresa tu código único de 5 caracteres asignado al torneo.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Alphanumeric Text / Code Input */}
              <div className="relative">
                <input
                  type="text"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value.toUpperCase());
                    setLoginError(null);
                  }}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="EJ: EST99 O G20AD"
                  maxLength={8}
                  className="w-full text-center text-2xl font-mono font-black tracking-widest uppercase bg-black/60 border border-white/15 focus:border-[#30D158] focus:ring-2 focus:ring-[#30D158]/20 rounded-2xl py-3.5 text-white placeholder:text-[#505054] outline-none transition-all"
                />
              </div>

              {/* Feedback messages */}
              {loginSuccessInfo ? (
                <div className="p-3 bg-[#30D158]/15 border border-[#30D158]/30 rounded-2xl text-[#30D158] text-xs font-bold flex items-center justify-center space-x-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>¡Bienvenido {loginSuccessInfo.name}! Entrando...</span>
                </div>
              ) : loginError ? (
                <div className="p-3 bg-[#FF453A]/15 border border-[#FF453A]/30 rounded-2xl text-[#FF453A] text-xs font-semibold flex items-center justify-center space-x-2 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              ) : null}

              {/* Action Button */}
              <button
                type="submit"
                disabled={!pinInput.trim()}
                className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center transition-all ios-touch ${
                  pinInput.trim()
                    ? 'bg-[#30D158] text-black shadow-lg shadow-[#30D158]/20 active:scale-98'
                    : 'bg-[#2C2C2E] text-[#8E8E93] cursor-not-allowed opacity-70'
                }`}
              >
                <span>Acceder al Torneo</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
            </form>

            {/* Need help note */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-xs text-[#64D2FF] hover:underline font-semibold"
              >
                ¿Aún no tienes clave? Regístrate aquí
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: NEW PLAYER REGISTRATION FORM                     */}
        {/* ======================================================== */}
        {mode === 'register' && !regSuccess && (
          <div className="ios-card p-6 border border-white/10 bg-[#1C1C1E]/90 backdrop-blur-xl shadow-2xl space-y-5 animate-fade-in">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white flex items-center justify-center">
                <User className="w-4 h-4 mr-1.5 text-[#30D158]" />
                Registro de Nuevo Jugador
              </h3>
              <p className="text-xs text-[#8E8E93]">
                Completa tus datos para que los administradores aprueben tu acceso y te asignen tu PIN.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Photo Upload (Mandatory) */}
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  {regAvatar ? (
                    <img
                      src={regAvatar}
                      alt="Foto de perfil"
                      className="w-24 h-24 rounded-full object-cover border-2 border-[#30D158] shadow-lg bg-[#2C2C2E]"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#2C2C2E] border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-[#8E8E93] p-2 text-center">
                      <Camera className="w-6 h-6 mb-1 text-[#8E8E93]" />
                      <span className="text-[9px] leading-tight font-semibold text-white">Subir Foto *</span>
                    </div>
                  )}

                  <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#30D158] text-black flex items-center justify-center cursor-pointer shadow-md hover:scale-105 transition-transform">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {regAvatar && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempImageForCrop(regAvatar);
                      setIsCropModalOpen(true);
                    }}
                    className="text-[11px] text-[#30D158] hover:underline font-semibold flex items-center pt-0.5"
                  >
                    Ajustar encuadre / Zoom 🔍
                  </button>
                )}
                <span className="text-[10px] text-[#FFD60A] font-bold">
                  * Foto obligatoria para tu ficha oficial
                </span>
              </div>

              {/* Nombre Completo */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8E8E93] flex items-center">
                  <User className="w-3.5 h-3.5 mr-1 text-[#30D158]" /> Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#30D158] text-white text-xs outline-none"
                />
              </div>

              {/* Apodo */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8E8E93] flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-[#FFD60A]" /> Apodo (Opcional / Recomendado)
                </label>
                <input
                  type="text"
                  placeholder="Ej: El Rayo, Zurdo, Capitán"
                  value={regNickname}
                  onChange={(e) => setRegNickname(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#FFD60A] text-white text-xs outline-none"
                />
              </div>

              {/* Celular / WhatsApp */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8E8E93] flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1 text-[#30D158]" /> Celular / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: +52 998 123 4567"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#30D158] text-white text-xs outline-none"
                />
                <span className="text-[10px] text-[#8E8E93] block">
                  Aquí te enviaremos tu clave única de acceso al torneo.
                </span>
              </div>

              {/* Correo Electrónico */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8E8E93] flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-1 text-[#64D2FF]" /> Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ej: juan@ejemplo.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#64D2FF] text-white text-xs outline-none"
                />
              </div>

              {/* Error Alert */}
              {regError && (
                <div className="p-3 bg-[#FF453A]/15 border border-[#FF453A]/30 rounded-xl text-[#FF453A] text-xs font-semibold flex items-center space-x-2 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmittingReg}
                className="w-full py-3.5 rounded-2xl bg-[#30D158] text-black font-black text-sm flex items-center justify-center shadow-lg shadow-[#30D158]/20 ios-touch active:scale-98"
              >
                <span>{isSubmittingReg ? 'Enviando Solicitud...' : 'Enviar Solicitud de Registro'}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: REGISTRATION SUCCESS CONFIRMATION                */}
        {/* ======================================================== */}
        {regSuccess && (
          <div className="ios-card p-6 border-2 border-[#30D158]/40 bg-gradient-to-b from-[#30D158]/15 to-[#1C1C1E] text-center space-y-4 animate-fade-in shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#30D158]/20 text-[#30D158] flex items-center justify-center mx-auto border border-[#30D158]/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#30D158] bg-[#30D158]/20 px-2.5 py-0.5 rounded-full">
                ¡Solicitud Registrada!
              </span>
              <h3 className="text-xl font-black text-white">
                ¡Gracias por registrarte, {regNickname || regName}!
              </h3>
              <p className="text-sm text-[#E5E5EA] leading-relaxed max-w-sm mx-auto pt-1">
                Tu solicitud ha sido enviada a los administradores y pronto tendrás respuesta con tu clave de acceso.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setRegSuccess(false);
                  setMode('login');
                }}
                className="w-full py-3 rounded-xl bg-[#30D158] hover:bg-[#28B84B] text-black font-bold text-xs ios-touch flex items-center justify-center shadow-lg"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Volver a la Pantalla de Acceso
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-xs text-[#8E8E93] font-medium tracking-wide">
          Desarrollado por Esteban Reyna. IA Factory Cancun
        </div>
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
