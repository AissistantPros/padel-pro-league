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

          {/* Synergies & Nemesis (Inset Grouped) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Best Partner */}
            <div className="ios-card p-4 space-y-2">
              <span className="text-xs font-semibold text-[#64D2FF] uppercase tracking-wider block">
                🤝 Pareja de Oro (Mayor Sinergia)
              </span>
              {playerStats.bestPartner ? (
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="font-bold text-white text-base">{playerStats.bestPartner.partnerName}</div>
                    <div className="text-xs text-[#8E8E93]">{playerStats.bestPartner.matchesTogether} partidos juntos</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#30D158] text-base">{playerStats.bestPartner.winRate}% Vic</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#8E8E93] pt-1">Aún no hay suficientes partidos registrados.</p>
              )}
            </div>

            {/* Worst Partner or Nemesis */}
            <div className="ios-card p-4 space-y-2">
              <span className="text-xs font-semibold text-[#FF9F0A] uppercase tracking-wider block">
                ⚔️ Mayor Rival (Más enfrentamientos)
              </span>
              {playerStats.nemesisOpponent ? (
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="font-bold text-white text-base">{playerStats.nemesisOpponent.opponentName}</div>
                    <div className="text-xs text-[#8E8E93]">{playerStats.nemesisOpponent.matchesAgainst} duelos</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#FF453A] text-base">{playerStats.nemesisOpponent.lossesAgainst}D</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#8E8E93] pt-1">Sin historial de rivalidad registrado.</p>
              )}
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
