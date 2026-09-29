import React, { useState } from 'react';
import {
  X,
  UserCheck,
  UserX,
  Copy,
  Check,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Key,
  Share2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { PlayerRegistrationRequest, Player } from '../types/index.ts';
import { StorageService } from '../services/storageService.ts';

interface PendingRegistrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: PlayerRegistrationRequest[];
  players?: Player[];
  onApproveRequest: (player: Player, remainingRequests: PlayerRegistrationRequest[]) => void;
  onRejectRequest: (remainingRequests: PlayerRegistrationRequest[]) => void;
}

export const PendingRegistrationsModal: React.FC<PendingRegistrationsModalProps> = ({
  isOpen,
  onClose,
  requests,
  players = [],
  onApproveRequest,
  onRejectRequest,
}) => {
  const [viewTab, setViewTab] = useState<'pending' | 'history'>('pending');
  const [approvedResult, setApprovedResult] = useState<{
    player: Player;
    pin: string;
    welcomeMessage: string;
  } | null>(null);
  const [copiedWelcome, setCopiedWelcome] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const pendingRequests = requests.filter(r => !r.status || r.status === 'pending');
  const historyRequests = requests.filter(r => r.status === 'approved' || r.status === 'rejected');

  const handleApprove = async (req: PlayerRegistrationRequest) => {
    try {
      setApprovingId(req.id);
      const result = await StorageService.approveRegistrationRequest(req, players, requests);
      if (result) {
        setApprovedResult(result);
        onApproveRequest(result.player, result.updatedRequests);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Error al autorizar el jugador en la base de datos.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (reqId: string) => {
    if (confirm('¿Rechazar esta solicitud de registro?')) {
      const remaining = await StorageService.rejectRegistrationRequest(reqId, requests);
      onRejectRequest(remaining);
    }
  };

  const handleCopyWelcome = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWelcome(true);
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
    setTimeout(() => setCopiedWelcome(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-[#1C1C1E] border border-white/15 rounded-3xl p-6 text-white shadow-2xl z-10 space-y-5 animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFD60A]/15 text-[#FFD60A] flex items-center justify-center border border-[#FFD60A]/30">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Solicitudes de Registro</h3>
              <p className="text-xs text-[#8E8E93]">
                {pendingRequests.length} {pendingRequests.length === 1 ? 'pendiente' : 'pendientes'} • {historyRequests.length} en historial
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2C2C2E] text-[#8E8E93] hover:text-white flex items-center justify-center ios-touch"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch: Pendientes vs Historial */}
        <div className="ios-segmented-control grid grid-cols-2 p-1 bg-black/40 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setViewTab('pending')}
            className={`ios-segmented-item py-2 text-xs font-bold ${viewTab === 'pending' ? 'active shadow-lg' : 'text-[#8E8E93]'}`}
          >
            Pendientes ({pendingRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setViewTab('history')}
            className={`ios-segmented-item py-2 text-xs font-bold ${viewTab === 'history' ? 'active shadow-lg' : 'text-[#8E8E93]'}`}
          >
            Historial ({historyRequests.length})
          </button>
        </div>

        {/* Modal Body / List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {viewTab === 'pending' ? (
            pendingRequests.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <UserCheck className="w-12 h-12 text-[#30D158] mx-auto opacity-70" />
                <h4 className="text-base font-bold text-white">No hay solicitudes pendientes</h4>
                <p className="text-xs text-[#8E8E93] max-w-xs mx-auto">
                  Todos los registros de jugadores han sido procesados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-[#2C2C2E]/60 border border-white/10 rounded-2xl p-4 space-y-3 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        {req.avatar ? (
                          <img
                            src={req.avatar}
                            alt={req.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-[#30D158] flex-shrink-0 bg-black"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-black text-white font-bold flex items-center justify-center border-2 border-[#30D158] flex-shrink-0">
                            {req.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-white truncate">{req.name}</h4>
                            {req.nickname && (
                              <span className="text-[10px] font-semibold text-[#FFD60A] bg-[#FFD60A]/15 px-2 py-0.5 rounded-full border border-[#FFD60A]/30">
                                "{req.nickname}"
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-[#8E8E93] space-y-0.5 mt-1">
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-[#30D158]" />
                              <span>{req.phone}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Mail className="w-3 h-3 text-[#64D2FF]" />
                              <span className="truncate">{req.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] text-[#8E8E93] whitespace-nowrap">
                        {new Date(req.requestedAt).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => handleReject(req.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#FF453A]/15 text-[#FF453A] hover:bg-[#FF453A]/25 border border-[#FF453A]/30 text-xs font-bold flex items-center ios-touch"
                      >
                        <UserX className="w-3.5 h-3.5 mr-1" /> Rechazar
                      </button>

                      <button
                        type="button"
                        disabled={approvingId === req.id}
                        onClick={() => handleApprove(req)}
                        className="px-4 py-1.5 rounded-xl bg-[#30D158] text-black font-black text-xs flex items-center ios-touch shadow-md hover:bg-[#28B84B] disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
                        {approvingId === req.id ? 'Autorizando...' : 'Aceptar Jugador'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            historyRequests.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Clock className="w-12 h-12 text-[#8E8E93] mx-auto opacity-50" />
                <h4 className="text-base font-bold text-white">Historial vacío</h4>
                <p className="text-xs text-[#8E8E93] max-w-xs mx-auto">
                  Aquí aparecerán las solicitudes aprobadas y rechazadas.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-[#2C2C2E]/40 border border-white/10 rounded-2xl p-4 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        {req.avatar ? (
                          <img
                            src={req.avatar}
                            alt={req.name}
                            className="w-12 h-12 rounded-full object-cover border border-white/20 flex-shrink-0 bg-black"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-black text-white font-bold flex items-center justify-center border border-white/20 flex-shrink-0">
                            {req.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-white truncate">{req.name}</h4>
                            {req.nickname && (
                              <span className="text-[10px] text-[#8E8E93]">
                                "{req.nickname}"
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#8E8E93]">
                            {req.phone} • {req.email}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        {req.status === 'approved' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30">
                            <ShieldCheck className="w-3 h-3 mr-1" /> Aprobado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30">
                            <UserX className="w-3 h-3 mr-1" /> Rechazado
                          </span>
                        )}
                        <p className="text-[10px] text-[#8E8E93] mt-1">
                          {new Date(req.requestedAt).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {req.notes && (
                      <div className="text-[11px] text-[#8E8E93] bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 font-mono">
                        {req.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Approval Success Modal Overlay with Ready WhatsApp Welcome Copy */}
        {approvedResult && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="bg-[#1C1C1E] border-2 border-[#30D158]/50 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-slide-up">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#30D158]/20 text-[#30D158] flex items-center justify-center mx-auto border border-[#30D158]/40">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h3 className="text-lg font-black text-white">
                  ¡Jugador Aprobado con Éxito!
                </h3>
                <p className="text-xs text-[#8E8E93]">
                  Se ha generado la clave única de 5 caracteres para <strong>{approvedResult.player.name}</strong>.
                </p>
              </div>

              {/* PIN Pill */}
              <div className="bg-black/60 p-4 rounded-2xl border border-white/15 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#8E8E93]">Clave Única Asignada</span>
                <div className="text-3xl font-mono font-black text-[#FFD60A] tracking-widest">
                  {approvedResult.pin}
                </div>
              </div>

              {/* Welcome Message Preview */}
              <div className="bg-[#2C2C2E]/60 p-3.5 rounded-2xl border border-white/10 space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#64D2FF] block">Mensaje de Bienvenida para el Jugador:</span>
                <p className="text-xs text-[#E5E5EA] leading-relaxed italic bg-black/40 p-2.5 rounded-xl">
                  "{approvedResult.welcomeMessage}"
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                {/* Send via WhatsApp directly to player's number */}
                {approvedResult.player.phone && (
                  <a
                    href={`https://wa.me/${approvedResult.player.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(approvedResult.welcomeMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-2xl bg-[#25D366] hover:bg-[#20BA5C] text-black font-black text-xs flex items-center justify-center shadow-lg shadow-[#25D366]/20 ios-touch"
                  >
                    <Phone className="w-4 h-4 mr-1.5" /> Enviar Clave por WhatsApp
                  </a>
                )}

                {/* Copy Text */}
                <button
                  type="button"
                  onClick={() => handleCopyWelcome(approvedResult.welcomeMessage)}
                  className={`w-full py-3 rounded-2xl font-black text-xs flex items-center justify-center shadow-lg ios-touch ${
                    copiedWelcome ? 'bg-[#30D158] text-black' : 'bg-[#2C2C2E] border border-white/15 text-white hover:bg-[#3A3A3C]'
                  }`}
                >
                  {copiedWelcome ? (
                    <>
                      <Check className="w-4 h-4 mr-1.5" /> ¡Copiado al Portapapeles!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1.5" /> Copiar Clave y Mensaje
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setApprovedResult(null)}
                  className="w-full py-2.5 rounded-xl bg-transparent hover:bg-white/5 text-[#8E8E93] hover:text-white font-medium text-xs ios-touch"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-white/10 pt-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#2C2C2E] text-white text-xs font-bold ios-touch hover:bg-[#3A3A3C]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
