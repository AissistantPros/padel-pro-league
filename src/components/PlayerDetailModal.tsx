import React from 'react';
import { X, Trophy, Zap, ArrowRight, TrendingUp, CheckCircle, Percent, Shield } from 'lucide-react';
import type { PlayerIntelligenceStats } from '../types/index.ts';
import { formatScoreDisplay } from '../utils/tieBreakerEngine.ts';

interface PlayerDetailModalProps {
  player: PlayerIntelligenceStats | null;
  onClose: () => void;
  onOpenRadar: (playerId: string) => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ player, onClose, onOpenRadar }) => {
  if (!player) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* iOS Sheet Content */}
      <div className="relative w-full max-w-lg bg-[#1C1C1E] border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-[28px] p-6 text-white shadow-2xl z-10 max-h-[85vh] overflow-y-auto animate-slide-up">
        {/* iOS Drag Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header with Close Button */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            {player.avatar ? (
              <img
                src={player.avatar}
                alt={player.playerName}
                className="w-16 h-16 rounded-full object-cover border-2 border-white/20 bg-[#2C2C2E] flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#2C2C2E] text-[#30D158] font-bold text-xl flex items-center justify-center flex-shrink-0 border-2 border-white/10">
                {player.playerName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold tracking-tight text-white">{player.playerName}</h3>
              </div>
              <p className="text-sm font-medium text-[#8E8E93]">
                {player.nickname ? `"${player.nickname}"` : 'Jugador Oficial'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2C2C2E] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors ios-touch"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Apple Fitness / Health Style KPI Cards */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {/* Puntos Totales */}
          <div className="bg-[#2C2C2E] p-4 rounded-2xl border border-white/5">
            <span className="text-xs font-semibold text-[#8E8E93] block uppercase tracking-wider">
              Puntos Oficiales
            </span>
            <div className="text-2xl font-bold text-[#30D158] mt-1 font-mono">
              {formatScoreDisplay(player.totalChampionshipPoints)}
            </div>
            <div className="text-[11px] text-[#8E8E93] mt-0.5 font-medium">
              {player.totalBasePoints} pts base
            </div>
          </div>

          {/* Récord Victoria */}
          <div className="bg-[#2C2C2E] p-4 rounded-2xl border border-white/5">
            <span className="text-xs font-semibold text-[#8E8E93] block uppercase tracking-wider">
              Efectividad
            </span>
            <div className="text-2xl font-bold text-white mt-1">
              {player.winRatePercentage}%
            </div>
            <div className="text-[11px] text-[#8E8E93] mt-0.5 font-medium">
              {player.totalMatchesWon}V - {player.totalMatchesLost}D ({player.totalMatchesPlayed} PJ)
            </div>
          </div>

          {/* Sinergia Top */}
          <div className="bg-[#2C2C2E] p-4 rounded-2xl border border-white/5">
            <span className="text-xs font-semibold text-[#8E8E93] block uppercase tracking-wider">
              Mejor Pareja
            </span>
            <div className="text-base font-bold text-[#64D2FF] mt-1 truncate">
              {player.bestPartner ? player.bestPartner.partnerName : 'Sin historial'}
            </div>
            <div className="text-[11px] text-[#8E8E93] mt-0.5 font-medium">
              {player.bestPartner ? `${player.bestPartner.winRate}% de victorias` : 'Pendiente'}
            </div>
          </div>

          {/* Rating Global PI */}
          <div className="bg-[#2C2C2E] p-4 rounded-2xl border border-white/5">
            <span className="text-xs font-semibold text-[#8E8E93] block uppercase tracking-wider">
              Rating PI
            </span>
            <div className="text-2xl font-bold text-[#FFD60A] mt-1 font-mono">
              {player.bayesianRating.toFixed(2)}
            </div>
            <div className="text-[11px] text-[#8E8E93] mt-0.5 font-medium">
              Nivel de juego global
            </div>
          </div>
        </div>

        {/* Desglose de Desempate (Inset Grouped Section) */}
        <div className="mt-5 bg-[#2C2C2E] rounded-2xl p-4 border border-white/5 space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] block">
            Criterios de Desempate
          </span>
          <div className="flex items-center justify-between text-sm py-1 border-b border-white/5">
            <span className="text-white">Games Ganados (Base)</span>
            <span className="font-mono font-bold text-white">{player.totalBasePoints} pts</span>
          </div>
          <div className="flex items-center justify-between text-sm py-1 border-b border-white/5">
            <span className="text-white">Margen y Palizas</span>
            <span className="font-mono font-bold text-[#30D158]">
              {player.totalDecimalBonus >= 0 ? `+${player.totalDecimalBonus.toFixed(3)}` : player.totalDecimalBonus.toFixed(3)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm py-1">
            <span className="text-white">Fechas Jugadas</span>
            <span className="font-mono font-bold text-white">{player.daysAttended} de asistencia</span>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => {
            onClose();
            onOpenRadar(player.playerId);
          }}
          className="w-full mt-6 py-3.5 px-4 bg-[#30D158] active:bg-[#28B84B] text-black font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all ios-touch"
        >
          <Zap className="w-4 h-4 text-black fill-black" />
          <span>Ver Análisis Completo en Radar PI</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
