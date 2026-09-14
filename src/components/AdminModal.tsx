import React, { useState } from 'react';
import { Lock, X, CheckCircle2, ShieldCheck, Crown } from 'lucide-react';
import type { TournamentConfig, Player } from '../types/index.ts';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TournamentConfig;
  players: Player[];
  onAuthenticate: () => void;
  onAuthenticateSuperAdmin?: () => void;
  onSelectCurrentPlayer?: (playerId: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  config,
  players,
  onAuthenticate,
  onAuthenticateSuperAdmin,
  onSelectCurrentPlayer,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ title: string; type: 'super' | 'admin' | 'player' } | null>(null);

  if (!isOpen) return null;

  const verifyAndLogin = (candidatePin: string) => {
    // 1. Check Super Admin Master PIN (e.g. 9999)
    if (candidatePin === (config.superAdminPin || '9999')) {
      setSuccessInfo({ title: '👑 Acceso concedido: Super Administrador', type: 'super' });
      setError(false);
      setTimeout(() => {
        if (onAuthenticateSuperAdmin) onAuthenticateSuperAdmin();
        onAuthenticate();
        setPinInput('');
        setSuccessInfo(null);
        onClose();
      }, 500);
      return true;
    }

    // 2. Check Master Tournament Admin PIN (e.g. 1234)
    if (candidatePin === (config.adminPin || '1234')) {
      setSuccessInfo({ title: '🛡️ Acceso concedido: Administrador Maestro', type: 'admin' });
      setError(false);
      setTimeout(() => {
        onAuthenticate();
        setPinInput('');
        setSuccessInfo(null);
        onClose();
      }, 500);
      return true;
    }

    // 3. Check Individual Admin Player PIN (e.g. personal PIN assigned in database)
    const matchingAdmin = players.find(p => p.role === 'admin' && p.pin && p.pin === candidatePin);
    if (matchingAdmin) {
      setSuccessInfo({ title: `🎾 ¡Bienvenido ${matchingAdmin.name}!`, type: 'player' });
      setError(false);
      setTimeout(() => {
        onAuthenticate();
        if (onSelectCurrentPlayer) onSelectCurrentPlayer(matchingAdmin.id);
        setPinInput('');
        setSuccessInfo(null);
        onClose();
      }, 500);
      return true;
    }

    return false;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verifyAndLogin(pinInput)) {
      setError(true);
    }
  };

  const handleKeypadPress = (num: string) => {
    if (successInfo) return;
    if (pinInput.length < 6) {
      const next = pinInput + num;
      setPinInput(next);
      setError(false);
      verifyAndLogin(next);
    }
  };

  const handleBackspace = () => {
    if (successInfo) return;
    setPinInput(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-[#1C1C1E] border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-[28px] p-6 text-white shadow-2xl z-10 space-y-4 animate-slide-up">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2 sm:hidden" />

        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-[#FFD60A]" />
            <h3 className="text-base font-bold">Modo Administrador</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#2C2C2E] text-[#8E8E93] hover:text-white flex items-center justify-center ios-touch">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-center">
          <p className="text-xs text-[#8E8E93]">
            Introduce tu PIN personal de administrador o la clave del torneo.
          </p>

          {/* Passcode Dots / Digits */}
          <div className="flex justify-center items-center space-x-3 py-1">
            {[0, 1, 2, 3].map((idx) => {
              const filled = pinInput.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    filled ? 'bg-white scale-110' : 'border border-white/30'
                  }`}
                />
              );
            })}
          </div>

          {successInfo ? (
            <div className="p-2.5 bg-[#30D158]/15 border border-[#30D158]/30 rounded-xl text-[#30D158] text-xs font-bold animate-fade-in flex items-center justify-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successInfo.title}</span>
            </div>
          ) : error ? (
            <p className="text-xs text-[#FF453A] font-medium animate-shake">
              PIN incorrecto
            </p>
          ) : (
            <div className="h-4" />
          )}

          {/* iOS Passcode Keypad */}
          <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => handleKeypadPress(n)}
                className="w-16 h-16 rounded-full bg-[#2C2C2E] active:bg-[#3A3A3C] font-semibold text-xl text-white mx-auto flex items-center justify-center ios-touch border border-white/5"
              >
                {n}
              </button>
            ))}
            <div />
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="w-16 h-16 rounded-full bg-[#2C2C2E] active:bg-[#3A3A3C] font-semibold text-xl text-white mx-auto flex items-center justify-center ios-touch border border-white/5"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="w-16 h-16 rounded-full font-medium text-xs text-[#8E8E93] hover:text-white mx-auto flex items-center justify-center ios-touch"
            >
              Borrar
            </button>
          </div>

          <div className="pt-2 border-t border-white/5 space-y-1">
            <span className="text-[11px] text-[#8E8E93] block">
              PIN Maestro Torneo: <code className="text-[#30D158] font-bold">{config.adminPin || '1234'}</code>
            </span>
            <span className="text-[10px] text-[#8E8E93]/70 block">
              El Super Admin puede ver y configurar los PINs en Ajustes y Jugadores.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

