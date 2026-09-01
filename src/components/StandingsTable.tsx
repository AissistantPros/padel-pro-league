import React, { useState } from 'react';
import { Trophy, ChevronDown, ChevronUp, Zap, HelpCircle, ArrowUpRight, Sparkles, Globe, Shield } from 'lucide-react';
import type { PlayerIntelligenceStats, TournamentConfig } from '../types/index.ts';
import { formatScoreDisplay } from '../utils/tieBreakerEngine.ts';

interface StandingsTableProps {
  stats: PlayerIntelligenceStats[];
  config: TournamentConfig;
  onSelectPlayerForIntelligence: (playerId: string) => void;
  onChangeRankingSystem: (system: 'bayesian' | 'total_points' | 'avg_points') => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  stats,
  config,
  onSelectPlayerForIntelligence,
}) => {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [viewScope, setViewScope] = useState<'current' | 'all_time'>('current');

  const toggleExpand = (playerId: string) => {
    setExpandedPlayerId(expandedPlayerId === playerId ? null : playerId);
  };

  // Sort based on view scope
  const sortedStats = [...stats].sort((a, b) => {
    if (viewScope === 'current') {
      if (b.totalChampionshipPoints !== a.totalChampionshipPoints) {
        return b.totalChampionshipPoints - a.totalChampionshipPoints;
      }
      return b.winRatePercentage - a.winRatePercentage;
    } else {
      if (b.bayesianRating !== a.bayesianRating) {
        return b.bayesianRating - a.bayesianRating;
      }
      return b.totalChampionshipPoints - a.totalChampionshipPoints;
    }
  });

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      {/* Top Edition & Scope Banner */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center shadow-gold-glow">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
                {config.editionName || `${config.editionNumber || 3}er Torneo G20`}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
                {stats.length} Jugadores
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-display text-white mt-1.5 flex items-center">
              <Trophy className="w-6 h-6 mr-2 text-amber-400 flex-shrink-0" />
              {viewScope === 'current' ? 'Tabla Oficial de Clasificación' : 'Histórico Global (Todos los Torneos)'}
            </h2>
          </div>

          {/* View Scope Toggle & Criteria */}
          <div className="flex items-center space-x-2">
            <div className="bg-slate-900 p-1 rounded-2xl border border-slate-800 flex items-center w-full sm:w-auto">
              <button
                onClick={() => setViewScope('current')}
                className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                  viewScope === 'current'
                    ? 'bg-emerald-500 text-black shadow-neon'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🏆 Torneo Actual
              </button>
              <button
                onClick={() => setViewScope('all_time')}
                className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                  viewScope === 'all_time'
                    ? 'bg-blue-600 text-white shadow-blue-glow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5 inline mr-1" />
                Histórico
              </button>
            </div>

            <button
              onClick={() => setShowFormulaModal(!showFormulaModal)}
              className="px-3 py-2 rounded-xl bg-slate-800 active:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold border border-slate-700 flex items-center flex-shrink-0"
            >
              <HelpCircle className="w-4 h-4 mr-1 text-amber-400" />
              Criterios
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300">
          {viewScope === 'current'
            ? 'Los Puntos Totales (games ganados en las fechas) mandan la tabla. Los decimales desempatan.'
            : 'Ranking permanente y nivel de juego de los jugadores a través de múltiples torneos.'}
        </p>
      </div>

      {/* Spicy Formula & Tie Breaker Modal Box */}
      {showFormulaModal && (
        <div className="glass-panel-neon p-5 rounded-3xl text-sm text-slate-300 space-y-3 animate-fade-in border-2 border-emerald-500/40">
          <div className="flex items-center justify-between font-black text-emerald-400 text-sm">
            <span className="flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-emerald-300" />
              Reglamento de Desempates y Puntos Extra ({config.editionName || 'G20'})
            </span>
            <button
              onClick={() => setShowFormulaModal(false)}
              className="text-slate-400 hover:text-white text-xs px-2.5 py-1 bg-slate-800 rounded-lg font-bold"
            >
              Cerrar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
              <span className="font-extrabold text-white block mb-1 text-xs sm:text-sm">1. Puntos Base (Mandan)</span>
              <p className="text-slate-400 text-xs">
                Cada game ganado suma 1 punto base a tu cuenta. Quien tiene más games ganados siempre está arriba.
              </p>
            </div>
            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
              <span className="font-extrabold text-white block mb-1 text-xs sm:text-sm">2. Margen de Paliza (Desempate)</span>
              <ul className="space-y-0.5 text-slate-400 text-xs">
                <li><span className="text-emerald-400 font-mono font-bold">+0.004</span> / <span className="text-rose-400 font-mono font-bold">-0.004</span> (7-0 ó 0-7)</li>
                <li><span className="text-emerald-400 font-mono font-bold">+0.003</span> / <span className="text-rose-400 font-mono font-bold">-0.003</span> (6-1 ó 1-6)</li>
                <li><span className="text-emerald-400 font-mono font-bold">+0.002</span> / <span className="text-rose-400 font-mono font-bold">-0.003</span> (5-2 ó 2-5)</li>
                <li><span className="text-slate-300 font-mono font-bold"> 0.000</span> / <span className="text-rose-400 font-mono font-bold">-0.002</span> (4-3 ó 3-4)</li>
              </ul>
            </div>
            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
              <span className="font-extrabold text-white block mb-1 text-xs sm:text-sm">3. Bonos de Racha y Final</span>
              <ul className="space-y-0.5 text-slate-400 text-xs">
                <li><span className="text-emerald-400 font-mono font-bold">+0.003</span> Ganar 3 de 3 preliminares</li>
                <li><span className="text-emerald-400 font-mono font-bold">+0.002</span> Ganar 2 de 3 | <span className="text-emerald-400 font-mono font-bold">+0.001</span> Ganar 1</li>
                <li><span className="text-rose-400 font-mono font-bold">-0.003</span> Perder los 3 (Pagar botana)</li>
                <li><span className="text-amber-400 font-mono font-bold">+0.001</span> Ganar tu Final / <span className="text-amber-400 font-mono font-bold">+0.001</span> Pleno 4/4</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {sortedStats.length === 0 ? (
        <div className="glass-panel p-10 text-center rounded-3xl border border-slate-800 space-y-4">
          <Trophy className="w-16 h-16 text-slate-600 mx-auto" />
          <h3 className="text-xl font-black text-white">Tabla Vacía - El Torneo Aún No Comienza</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Ve a la pestaña <strong>Jugadores</strong> para registrar participantes, y luego arranca la <strong>Fecha #1</strong> en Jornada en Vivo.
          </p>
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* 1. MOBILE NATIVE CARD VIEW (block md:hidden) - NO SCROLL */}
          {/* ======================================================== */}
          <div className="block md:hidden space-y-3">
            {sortedStats.map((player, idx) => {
              const displayRank = idx + 1;
              const isExpanded = expandedPlayerId === player.playerId;
              const isPodium1 = displayRank === 1 && player.totalMatchesPlayed > 0;
              const isPodium2 = displayRank === 2 && player.totalMatchesPlayed > 0;
              const isPodium3 = displayRank === 3 && player.totalMatchesPlayed > 0;
              const isTop8 = displayRank <= 8;

              return (
                <div
                  key={player.playerId}
                  className={`glass-panel rounded-3xl p-4 border transition-all space-y-3 ${
                    isPodium1
                      ? 'border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-slate-950 shadow-gold-glow'
                      : isPodium2
                      ? 'border-slate-400/40 bg-slate-950'
                      : isPodium3
                      ? 'border-amber-700/40 bg-slate-950'
                      : 'border-slate-800 bg-[#101626]'
                  }`}
                >
                  {/* Top Row: Rank, Avatar, Name & Total Points */}
                  <div
                    className="flex items-center justify-between gap-3 cursor-pointer"
                    onClick={() => toggleExpand(player.playerId)}
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {/* Rank Position Badge */}
                      <div className="flex-shrink-0">
                        {isPodium1 ? (
                          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black font-black text-sm flex items-center justify-center shadow-gold-glow">
                            👑 1
                          </div>
                        ) : isPodium2 ? (
                          <div className="w-10 h-10 rounded-2xl bg-slate-300 text-black font-black text-sm flex items-center justify-center">
                            🥈 2
                          </div>
                        ) : isPodium3 ? (
                          <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white font-black text-sm flex items-center justify-center">
                            🥉 3
                          </div>
                        ) : (
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-sm ${
                            isTop8 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                          }`}>
                            #{displayRank}
                          </div>
                        )}
                      </div>

                      {/* Avatar Photo */}
                      {player.avatar ? (
                        <img
                          src={player.avatar}
                          alt={player.playerName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-emerald-400 shadow-neon flex-shrink-0 bg-slate-900"
                        />
                      ) : (
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm uppercase flex-shrink-0 ${
                          isTop8 ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/40' : 'bg-slate-800 text-slate-300 border-2 border-slate-700'
                        }`}>
                          {player.playerName.slice(0, 2)}
                        </div>
                      )}

                      {/* Name & Quick Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="text-base sm:text-lg font-black text-white truncate">
                          {player.playerName}
                        </div>
                        <div className="text-xs text-slate-400 font-semibold flex items-center space-x-2 mt-0.5">
                          <span>{player.totalMatchesWon}V - {player.totalMatchesLost}D ({player.winRatePercentage}%)</span>
                          <span>•</span>
                          <span className="text-slate-300 font-bold">{player.daysAttended} {player.daysAttended === 1 ? 'Fecha' : 'Fechas'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Score High-Contrast Box */}
                    <div className="text-right flex-shrink-0 pl-1">
                      <div className="font-mono text-xl sm:text-2xl font-black text-emerald-400 glow-text-neon">
                        {formatScoreDisplay(player.totalChampionshipPoints)}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                        PUNTOS
                      </div>
                    </div>
                  </div>

                  {/* Quick Bottom Badges Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center space-x-3 text-slate-300 font-bold">
                      <span>Games: <strong className="text-white font-mono">{player.totalBasePoints} pts</strong></span>
                      <span>Desempate: <strong className={`font-mono ${player.totalDecimalBonus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {player.totalDecimalBonus >= 0 ? `+${player.totalDecimalBonus.toFixed(3)}` : player.totalDecimalBonus.toFixed(3)}
                      </strong></span>
                    </div>

                    <button
                      onClick={() => onSelectPlayerForIntelligence(player.playerId)}
                      className="text-cyan-400 hover:text-cyan-300 font-extrabold flex items-center"
                    >
                      Radar PI <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                  </div>

                  {/* Expandable Drilldown Card */}
                  {isExpanded && (
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs animate-fade-in">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block font-bold">Pareja Top</span>
                          <span className="font-black text-cyan-300 text-sm">{player.bestPartner ? player.bestPartner.partnerName : 'Sin registros'}</span>
                          <div className="text-[10px] text-slate-400">{player.bestPartner ? `${player.bestPartner.winRate}% Vic` : ''}</div>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block font-bold">Rating Bayesiano PI</span>
                          <span className="font-black text-amber-400 text-sm font-mono">{player.bayesianRating.toFixed(3)}</span>
                          <div className="text-[10px] text-slate-400">Poder de juego global</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ======================================================== */}
          {/* 2. DESKTOP FULL DATA TABLE (hidden md:block) */}
          {/* ======================================================== */}
          <div className="hidden md:block glass-panel rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider font-extrabold border-b border-slate-800">
                  <th className="py-4 px-4 text-center w-16">Pos</th>
                  <th className="py-4 px-4">Jugador</th>
                  <th className="py-4 px-3 text-center">Fechas</th>
                  <th className="py-4 px-3 text-center">PJ (V-D)</th>
                  <th className="py-4 px-3 text-center">% Vic</th>
                  <th className="py-4 px-3 text-center">Games Base</th>
                  <th className="py-4 px-3 text-center">Bono Desempate</th>
                  <th className="py-4 px-5 text-right">🏆 PUNTOS TOTALES</th>
                  <th className="py-4 px-4 text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {sortedStats.map((player, idx) => {
                  const displayRank = idx + 1;
                  const isExpanded = expandedPlayerId === player.playerId;
                  const isPodium1 = displayRank === 1 && player.totalMatchesPlayed > 0;
                  const isPodium2 = displayRank === 2 && player.totalMatchesPlayed > 0;
                  const isPodium3 = displayRank === 3 && player.totalMatchesPlayed > 0;
                  const isTop8 = displayRank <= 8;

                  return (
                    <React.Fragment key={player.playerId}>
                      <tr
                        className={`hover:bg-slate-800/50 transition-colors ${
                          isPodium1 ? 'bg-amber-500/10' : isPodium2 ? 'bg-slate-400/10' : isPodium3 ? 'bg-amber-700/10' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-4 px-4 text-center font-display font-black text-lg">
                          {isPodium1 ? (
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-amber-400 text-black font-black text-sm shadow-gold-glow">
                              👑 1
                            </span>
                          ) : isPodium2 ? (
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-slate-300 text-black font-black text-sm">
                              🥈 2
                            </span>
                          ) : isPodium3 ? (
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-amber-600 text-white font-black text-sm">
                              🥉 3
                            </span>
                          ) : (
                            <span className={`font-mono ${isTop8 ? 'text-emerald-400 font-extrabold' : 'text-slate-400'}`}>
                              #{displayRank}
                            </span>
                          )}
                        </td>

                        {/* Player Info with Large Avatar */}
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            {player.avatar ? (
                              <img
                                src={player.avatar}
                                alt={player.playerName}
                                className="w-11 h-11 rounded-full object-cover border-2 border-emerald-400 shadow-neon flex-shrink-0 bg-slate-900"
                              />
                            ) : (
                              <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm uppercase flex-shrink-0 ${
                                isTop8 ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/40' : 'bg-slate-800 text-slate-300 border-2 border-slate-700'
                              }`}>
                                {player.playerName.slice(0, 2)}
                              </div>
                            )}

                            <div>
                              <div className="flex items-center space-x-2">
                                <span
                                  className="font-extrabold text-white text-base hover:text-emerald-400 transition-colors cursor-pointer"
                                  onClick={() => onSelectPlayerForIntelligence(player.playerId)}
                                >
                                  {player.playerName}
                                </span>
                                {isTop8 ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Top 8
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                                    Bombo 2
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 font-medium">
                                {player.bestPartner ? `Sinergia Top: ${player.bestPartner.partnerName}` : 'G20 Master'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Days Attended */}
                        <td className="py-4 px-3 text-center text-slate-200 font-bold text-sm">
                          {player.daysAttended}
                        </td>

                        {/* Matches Played */}
                        <td className="py-4 px-3 text-center text-sm font-semibold">
                          <span className="text-white font-mono font-bold">{player.totalMatchesWon}V - {player.totalMatchesLost}D</span>
                          <div className="text-xs text-slate-500">({player.totalMatchesPlayed} PJ)</div>
                        </td>

                        {/* Win Rate */}
                        <td className="py-4 px-3 text-center font-bold">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${
                            player.winRatePercentage >= 65
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : player.winRatePercentage >= 45
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {player.winRatePercentage}%
                          </span>
                        </td>

                        {/* Base Games */}
                        <td className="py-4 px-3 text-center text-sm font-extrabold text-slate-200 font-mono">
                          {player.totalBasePoints} pts
                        </td>

                        {/* Desempate Decimals */}
                        <td className="py-4 px-3 text-center font-mono text-xs font-bold">
                          <span className={player.totalDecimalBonus >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {player.totalDecimalBonus >= 0 ? `+${player.totalDecimalBonus.toFixed(3)}` : player.totalDecimalBonus.toFixed(3)}
                          </span>
                        </td>

                        {/* PUNTOS TOTALES */}
                        <td className="py-4 px-5 text-right">
                          <div className="font-mono font-black text-xl text-emerald-400 tracking-tight glow-text-neon">
                            {formatScoreDisplay(player.totalChampionshipPoints)}
                          </div>
                        </td>

                        {/* Drilldown button */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => onSelectPlayerForIntelligence(player.playerId)}
                              className="p-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/30 text-cyan-400"
                              title="Ver Padel Intelligence"
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleExpand(player.playerId)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Drilldown Row */}
                      {isExpanded && (
                        <tr className="bg-slate-950/90 border-y border-slate-800 animate-fade-in">
                          <td colSpan={9} className="py-4 px-6">
                            <div className="grid grid-cols-4 gap-3 text-xs">
                              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                                <span className="text-slate-400 font-bold block mb-1">🎮 Games Ganados (Base)</span>
                                <div className="text-xl font-black text-white font-mono">{player.totalBasePoints} pts</div>
                                <div className="text-[11px] text-slate-500">Games acumulados en el torneo</div>
                              </div>
                              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                                <span className="text-slate-400 font-bold block mb-1">🔢 Decimales de Desempate</span>
                                <div className="text-xl font-black text-emerald-400 font-mono">
                                  {player.totalDecimalBonus >= 0 ? `+${player.totalDecimalBonus.toFixed(3)}` : player.totalDecimalBonus.toFixed(3)}
                                </div>
                                <div className="text-[11px] text-slate-500">Margen + Récord 3-0 + Finales</div>
                              </div>
                              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                                <span className="text-slate-400 font-bold block mb-1">🤝 Pareja de Oro</span>
                                <div className="text-sm font-black text-cyan-300">
                                  {player.bestPartner ? `${player.bestPartner.partnerName}` : 'Sin registros'}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {player.bestPartner ? `${player.bestPartner.winRate}% Vic` : ''}
                                </div>
                              </div>
                              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                                <div>
                                  <span className="text-slate-400 font-bold block mb-1">⚡ Rating Global PI</span>
                                  <div className="text-xl font-black text-amber-400 font-mono">{player.bayesianRating.toFixed(3)}</div>
                                </div>
                                <button
                                  onClick={() => onSelectPlayerForIntelligence(player.playerId)}
                                  className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-neon flex items-center"
                                >
                                  Ver Radar <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
