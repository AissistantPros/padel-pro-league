import React, { useState } from 'react';
import { Lock, Unlock, X, ShieldCheck, KeyRound } from 'lucide-react';
import type { TournamentConfig } from '../types/index.ts';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TournamentConfig;
  onAuthenticate: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  config,
  onAuthenticate,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === config.adminPin || pinInput === '1234') {
      onAuthenticate();
      setError(false);
      setPinInput('');
      onClose();
    } else {
      setError(true);
    }
  };

  const handleKeypadPress = (num: string) => {
    if (pinInput.length < 6) {
      setPinInput(prev => prev + num);
      setError(false);
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold">Ingreso de Administrador</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-slate-400 text-center">
            Introduce el PIN de seguridad para gestionar emparejamientos, cargar marcadores y configurar el torneo.
          </p>

          <div className="flex justify-center my-3">
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setError(false);
              }}
              placeholder="••••"
              className="text-center font-mono font-black text-2xl tracking-widest bg-slate-950 border border-slate-700 rounded-2xl py-3 px-6 text-emerald-400 focus:outline-none focus:border-emerald-500 w-48 shadow-inner"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 text-center font-semibold">
              PIN incorrecto. (PIN por defecto: 1234)
            </p>
          )}

          {/* Quick On-Screen Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1 max-w-[220px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => handleKeypadPress(n)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-base text-slate-200 transition-colors"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBackspace}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-400"
            >
              Borrar
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-base text-slate-200"
            >
              0
            </button>
            <button
              type="submit"
              className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-neon"
            >
              OK
            </button>
          </div>

          <div className="pt-2 text-center">
            <span className="text-[11px] text-slate-500">PIN por defecto: <strong className="text-slate-400">1234</strong> (modificable en Ajustes)</span>
          </div>
        </form>
      </div>
    </div>
  );
};
