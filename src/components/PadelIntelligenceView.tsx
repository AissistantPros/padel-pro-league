import React, { useState } from 'react';
import {
  Zap,
  Users,
  Swords,
  Award,
  Flame,
  Search,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import type { PlayerIntelligenceStats, Player } from '../types/index.ts';
import { formatScoreDisplay } from '../utils/tieBreakerEngine.ts';

interface PadelIntelligenceViewProps {
  statsList: PlayerIntelligenceStats[];
  players: Player[];
  selectedPlayerId?: string;
  onSelectPlayer: (id: string) => void;
}

export const PadelIntelligenceView: React.FC<PadelIntelligenceViewProps> = ({
  statsList,
  selectedPlayerId,
  onSelectPlayer,
}) => {
  const [activePlayerId, setActivePlayerId] = useState<string>(
    selectedPlayerId || (statsList.length > 0 ? statsList[0].playerId : '')
  );

  const [comparatorPlayerIdA, setComparatorPlayerIdA] = useState<string>(
    statsList.length > 0 ? statsList[0].playerId : ''
  );
  const [comparatorPlayerIdB, setComparatorPlayerIdB] = useState<string>(
    statsList.length > 1 ? statsList[1].playerId : ''
  );
  const [viewMode, setViewMode] = useState<'profile' | 'compare'>('profile');

  const playerStats = statsList.find(s => s.playerId === activePlayerId) || statsList[0];
  const pA = statsList.find(s => s.playerId === comparatorPlayerIdA) || statsList[0];
  const pB = statsList.find(s => s.playerId === comparatorPlayerIdB) || statsList[1] || statsList[0];

  const h2hRecordForA = pA?.opponents.find(o => o.opponentId === pB?.playerId);

  const radarData = playerStats
    ? [
        { metric: 'Efectividad', val: playerStats.winRatePercentage },
        { metric: 'Rating PI', val: Math.min(100, playerStats.bayesianRating * 12) },
        { metric: 'Promedio', val: Math.min(100, (playerStats.avgPointsPerMatch / 7) * 100) },
        { metric: 'Puntos', val: Math.min(100, (playerStats.totalChampionshipPoints / 40) * 100) },
        { metric: 'Asistencia', val: Math.min(100, (playerStats.daysAttended / 3) * 100) },
      ]
    : [];

  return (
    <div className="space-y-4 pb-20 md:pb-6 select-none">
      {/* iOS Large Title */}
      <div className="pt-1 pb-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64D2FF]">
              Inteligencia Artificial
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
              Radar PI
            </h1>
          </div>

          <div className="ios-segmented-control w-auto">
            <button
              onClick={() => setViewMode('profile')}
              className={`ios-segmented-item ${viewMode === 'profile' ? 'active' : ''}`}
            >
              Perfil
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`ios-segmented-item ${viewMode === 'compare' ? 'active' : ''}`}
            >
              H2H
            </button>
          </div>
        </div>

        {/* Player Selector Bar */}
        {viewMode === 'profile' && (
          <div className="flex space-x-2 overflow-x-auto py-3 scrollbar-none">
            {statsList.map((st) => {
              const isSelected = st.playerId === activePlayerId;
              return (
                <button
                  key={st.playerId}
                  onClick={() => {
                    setActivePlayerId(st.playerId);
                    onSelectPlayer(st.playerId);
                  }}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-semibold transition-all ios-touch border ${
                    isSelected
                      ? 'bg-[#30D158] text-black border-[#30D158] font-bold'
                      : 'bg-[#1C1C1E] border-white/10 text-[#8E8E93] hover:text-white'
                  }`}
                >
                  <span>{st.playerName.split(' ')[0]}</span>
                  {st.currentRank && <span className="opacity-75 font-mono">#{st.currentRank}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {viewMode === 'profile' && playerStats && (
        <div className="space-y-4">
          {/* Main Player Profile Summary */}
          <div className="ios-card p-5 space-y-4">
            <div className="flex items-center space-x-3.5">
              {playerStats.avatar ? (
                <img
                  src={playerStats.avatar}
                  alt={playerStats.playerName}
                  className="w-14 h-14 rounded-full object-cover border border-white/15 bg-[#2C2C2E]"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#2C2C2E] text-[#30D158] font-bold text-lg flex items-center justify-center border border-white/10">
                  {playerStats.playerName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">{playerStats.playerName}</h2>
                <p className="text-xs text-[#8E8E93]">
                  {playerStats.nickname ? `"${playerStats.nickname}"` : 'Participante'} • Posición #{playerStats.currentRank}
                </p>
              </div>
            </div>

            {/* Apple Activity 4-Tile Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-[#2C2C2E] p-3 rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-[#8E8E93] block">Rating PI</span>
                <span className="text-xl font-bold text-[#FFD60A] font-mono">{playerStats.bayesianRating.toFixed(2)}</span>
              </div>
              <div className="bg-[#2C2C2E] p-3 rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-[#8E8E93] block">Efectividad</span>
                <span className="text-xl font-bold text-[#30D158]">{playerStats.winRatePercentage}%</span>
              </div>
              <div className="bg-[#2C2C2E] p-3 rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-[#8E8E93] block">Puntos Totales</span>
                <span className="text-xl font-bold text-white font-mono">{formatScoreDisplay(playerStats.totalChampionshipPoints)}</span>
              </div>
              <div className="bg-[#2C2C2E] p-3 rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-[#8E8E93] block">Partidos</span>
                <span className="text-xl font-bold text-white font-mono">{playerStats.totalMatchesWon}V - {playerStats.totalMatchesLost}D</span>
              </div>
            </div>
          </div>

          {/* Radar Chart SVG */}
          <div className="ios-card p-5 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] block">
              Equilibrio de Juego
            </span>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#8E8E93', fontSize: 11, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Nivel"
                    dataKey="val"
                    stroke="#30D158"
                    fill="#30D158"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* The 6 Funny Intelligence Categories Grid */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white tracking-tight">
                🎭 Radiografía de Rivales & Dinámicas de Pista
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* 1. Tinder Match */}
              <div className="ios-card p-4 space-y-2 border border-[#30D158]/20 bg-[#1C1C1E] relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#30D158] uppercase tracking-wider flex items-center">
                    🔥 Tinder Match
                  </span>
                  <span className="text-[10px] text-[#8E8E93] bg-white/5 px-2 py-0.5 rounded-full">
                    Mejor Pareja
                  </span>
                </div>
                <p className="text-[11px] text-[#8E8E93] leading-tight">
                  Con quien más partidos has ganado jugando juntos:
                </p>
                {playerStats.bestPartner ? (
                  <div className="pt-1">
                    <div className="font-bold text-white text-base truncate">
                      {playerStats.bestPartner.partnerName}
                    </div>
                    <div className="text-xs text-[#30D158] font-semibold mt-0.5">
                      {playerStats.bestPartner.winsTogether} victorias juntos • {playerStats.bestPartner.winRate}% efectividad
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#8E8E93]/70 pt-1 italic">Sin victorias en pareja registradas aún.</p>
                )}
              </div>

              {/* 2. Tu Bolsa de Piedras */}
              <div className="ios-card p-4 space-y-2 border border-white/10 bg-[#1C1C1E] relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#E5E5EA] uppercase tracking-wider flex items-center">
                    🪨 Tu Bolsa de Piedras
                  </span>
                  <span className="text-[10px] text-[#8E8E93] bg-white/5 px-2 py-0.5 rounded-full">
                    El Ancla
                  </span>
                </div>
                <p className="text-[11px] text-[#8E8E93] leading-tight">
                  Con quien más partidos has perdido jugando juntos:
                </p>
                {playerStats.worstPartner ? (
                  <div className="pt-1">
                    <div className="font-bold text-white text-base truncate">
                      {playerStats.worstPartner.partnerName}
                    </div>
                    <div className="text-xs text-[#FF453A] font-semibold mt-0.5">
                      {playerStats.worstPartner.lossesTogether} derrotas juntos • {100 - playerStats.worstPartner.winRate}% derrotas
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#30D158]/80 pt-1 font-medium">¡Sin bolsa de piedras! (0 derrotas en pareja)</p>
                )}
              </div>

              {/* 3. Tu Padre */}
              <div className="ios-card p-4 space-y-2 border border-[#FF453A]/20 bg-[#1C1C1E] relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#FF453A] uppercase tracking-wider flex items-center">
                    👑 Tu Padre
                  </span>
                  <span className="text-[10px] text-[#FF453A] bg-[#FF453A]/10 px-2 py-0.5 rounded-full">
                    Verdugo
                  </span>
                </div>
                <p className="text-[11px] text-[#8E8E93] leading-tight">
                  Jugador rival contra el que más has perdido:
                </p>
                {playerStats.nemesisOpponent ? (
                  <div className="pt-1">
                    <div className="font-bold text-white text-base truncate">
                      {playerStats.nemesisOpponent.opponentName}
                    </div>
                    <div className="text-xs text-[#FF453A] font-semibold mt-0.5">
                      {playerStats.nemesisOpponent.lossesAgainst} derrotas sufridas contra él ({playerStats.nemesisOpponent.matchesAgainst} duelos)
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#30D158]/80 pt-1 font-medium">Nadie te tiene de hijo todavía 😎</p>
                )}
              </div>

              {/* 4. Papi y Mami */}
              <div className="ios-card p-4 space-y-2 border border-[#BF5AF2]/20 bg-[#1C1C1E] relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#BF5AF2] uppercase tracking-wider flex items-center">
                    👨‍👩‍👧 Papi y Mami
                  </span>
                  <span className="text-[10px] text-[#BF5AF2] bg-[#BF5AF2]/10 px-2 py-0.5 rounded-full">
                    Dupla Rival Pesada
                  </span>
                </div>
                <p className="text-[11px] text-[#8E8E93] leading-tight">
                  Pareja rival contra la que más has perdido (sin importar tu partner):
                </p>
                {playerStats.worstRivalPair ? (
                  <div className="pt-1">
                    <div className="font-bold text-white text-base truncate">
                      {playerStats.worstRivalPair.player1Name} & {playerStats.worstRivalPair.player2Name}
                    </div>
                    <div className="text-xs text-[#BF5AF2] font-semibold mt-0.5">
                      {playerStats.worstRivalPair.lossesAgainst} derrotas ante esta dupla
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#8E8E93]/70 pt-1 italic">Ninguna pareja rival te ha derrotado más de una vez.</p>
                )}
              </div>

              {/* 5. Tu Hijo */}
              <div className="ios-card p-4 space-y-2 border border-[#0A84FF]/20 bg-[#1C1C1E] relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0A84FF] uppercase tracking-wider flex items-center">
                    👶 Tu Hijo
                  </span>
                  <span className="text-[10px] text-[#0A84FF] bg-[#0A84FF]/10 px-2 py-0.5 rounded-full">
                    Cliente Frecuente
                  </span>
                </div>
                <p className="text-[11px] text-[#8E8E93] leading-tight">
                  Jugador rival al que más veces le has ganado:
                </p>
                {playerStats.favoriteOpponent ? (
                  <div className="pt-1">
                    <div className="font-bold text-white text-base truncate">
                      {playerStats.favoriteOpponent.opponentName}
                    </div>
                    <div className="text-xs text-[#0A84FF] font-semibold mt-0.5">
                      {playerStats.favoriteOpponent.winsAgainst} victorias sobre él ({playerStats.favoriteOpponent.winRateAgainst}% efectividad)
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#8E8E93]/70 pt-1 italic">Sin victorias directas aún.</p>
                )}
              </div>

              {/* 6. Tus Clientes */}
              <div className="ios-card p-4 space-y-2 border border-[#FFD60A]/20 bg-[#1C1C1E] relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#FFD60A] uppercase tracking-wider flex items-center">
                    💼 Tus Clientes
                  </span>
                  <span className="text-[10px] text-[#FFD60A] bg-[#FFD60A]/10 px-2 py-0.5 rounded-full">
                    Dupla Vencida
                  </span>
                </div>
                <p className="text-[11px] text-[#8E8E93] leading-tight">
                  Pareja rival a la que más has ganado (sin importar tu partner):
                </p>
                {playerStats.bestRivalPair ? (
                  <div className="pt-1">
                    <div className="font-bold text-white text-base truncate">
                      {playerStats.bestRivalPair.player1Name} & {playerStats.bestRivalPair.player2Name}
                    </div>
                    <div className="text-xs text-[#FFD60A] font-semibold mt-0.5">
                      {playerStats.bestRivalPair.winsAgainst} victorias sobre esta dupla ({playerStats.bestRivalPair.winRateAgainst}% efectividad)
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#8E8E93]/70 pt-1 italic">Aún no tienes una dupla cliente registrada.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare / H2H View */}
      {viewMode === 'compare' && (
        <div className="space-y-4">
          <div className="ios-card p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#8E8E93] block mb-1">Jugador A</label>
                <select
                  value={comparatorPlayerIdA}
                  onChange={(e) => setComparatorPlayerIdA(e.target.value)}
                  className="w-full bg-[#2C2C2E] border border-white/10 text-white rounded-xl p-2.5 text-xs font-semibold"
                >
                  {statsList.map(s => (
                    <option key={s.playerId} value={s.playerId}>{s.playerName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#8E8E93] block mb-1">Jugador B</label>
                <select
                  value={comparatorPlayerIdB}
                  onChange={(e) => setComparatorPlayerIdB(e.target.value)}
                  className="w-full bg-[#2C2C2E] border border-white/10 text-white rounded-xl p-2.5 text-xs font-semibold"
                >
                  {statsList.map(s => (
                    <option key={s.playerId} value={s.playerId}>{s.playerName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Direct H2H Comparison */}
            <div className="pt-2 border-t border-white/5 space-y-2 text-center">
              <div className="text-xs font-semibold text-[#8E8E93]">Historial Directo</div>
              <div className="text-lg font-bold text-white">
                {pA.playerName} vs {pB.playerName}
              </div>
              <div className="text-sm font-mono text-[#30D158]">
                {h2hRecordForA ? `${h2hRecordForA.winsAgainst} Victorias - ${h2hRecordForA.lossesAgainst} Derrotas` : '0 enfrentamientos previos'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
