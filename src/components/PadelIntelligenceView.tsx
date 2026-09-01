import React, { useState } from 'react';
import {
  Zap,
  Users,
  Swords,
  TrendingUp,
  Award,
  ShieldAlert,
  Flame,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  Search
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
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
  players,
  selectedPlayerId,
  onSelectPlayer,
}) => {
  const [activePlayerId, setActivePlayerId] = useState<string>(
    selectedPlayerId || (statsList.length > 0 ? statsList[0].playerId : '')
  );

  // Comparator mode
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

  // Head-to-Head between A and B
  const h2hRecordForA = pA?.opponents.find(o => o.opponentId === pB?.playerId);

  // Radar data for player
  const radarData = playerStats
    ? [
        { metric: 'Efectividad %', val: playerStats.winRatePercentage },
        { metric: 'Rating PI', val: Math.min(100, playerStats.bayesianRating * 12) },
        { metric: 'Promedio Games', val: Math.min(100, (playerStats.avgPointsPerMatch / 7) * 100) },
        { metric: 'Puntos Acum.', val: Math.min(100, (playerStats.totalChampionshipPoints / 40) * 100) },
        { metric: 'Asistencia', val: Math.min(100, (playerStats.daysAttended / 3) * 100) },
      ]
    : [];

  // Match history chart data
  const historyChartData = playerStats?.matchHistory.map((m, idx) => ({
    partido: `#${idx + 1}`,
    puntos: m.pointsEarned,
    decimal: m.decimalEarned,
    resultado: m.result,
    label: `${m.dayName} - R${m.roundNumber}`,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Toggle */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-blue-500/20 text-cyan-400">
              <Zap className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center">
                Padel Intelligence & Analytics
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Sinergias de pareja, némesis, rivales directos y probabilidades predictivas de victoria.
              </p>
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center">
          <button
            onClick={() => setViewMode('profile')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'profile'
                ? 'bg-blue-600 text-white shadow-blue-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Perfil & Sinergias
          </button>
          <button
            onClick={() => setViewMode('compare')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'compare'
                ? 'bg-emerald-500 text-black shadow-neon'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Comparador Cara a Cara (H2H)
          </button>
        </div>
      </div>

      {viewMode === 'profile' && playerStats && (
        <div className="space-y-6">
          {/* Player Selector Bar */}
          <div className="glass-panel p-3 sm:p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 overflow-x-auto scrollbar-none">
            <span className="text-xs font-bold text-slate-400 flex items-center flex-shrink-0">
              <Search className="w-3.5 h-3.5 mr-1" /> Seleccionar Jugador:
            </span>
            <div className="flex space-x-1.5">
              {statsList.map((st) => (
                <button
                  key={st.playerId}
                  onClick={() => {
                    setActivePlayerId(st.playerId);
                    onSelectPlayer(st.playerId);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    st.playerId === activePlayerId
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-blue-glow'
                      : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  #{st.currentRank} {st.playerName.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Player KPI Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Rank & Rating */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Ranking & Rating</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-display text-white">
                #{playerStats.currentRank}
              </div>
              <div className="text-xs text-emerald-400 font-mono font-bold">
                Rating PI: {playerStats.bayesianRating.toFixed(3)}
              </div>
            </div>

            {/* Win Rate */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Efectividad de Victoria</span>
                <Flame className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-display text-emerald-400">
                {playerStats.winRatePercentage}%
              </div>
              <div className="text-xs text-slate-400">
                {playerStats.totalMatchesWon}V - {playerStats.totalMatchesLost}D ({playerStats.totalMatchesPlayed} PJ)
              </div>
            </div>

            {/* Total Points */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Puntos Totales Acum.</span>
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-display text-blue-400 font-mono">
                {formatScoreDisplay(playerStats.totalChampionshipPoints)}
              </div>
              <div className="text-xs text-slate-400">
                Base: {playerStats.totalBasePoints} | Bonos: {playerStats.totalDecimalBonus >= 0 ? `+${playerStats.totalDecimalBonus.toFixed(3)}` : playerStats.totalDecimalBonus.toFixed(3)}
              </div>
            </div>

            {/* Games & Diff */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Games Ganados / Dif</span>
                <BarChart3 className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-display text-cyan-300">
                {playerStats.totalGamesWon}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Dif: {playerStats.gameDifference > 0 ? `+${playerStats.gameDifference}` : playerStats.gameDifference} ({playerStats.avgPointsPerMatch.toFixed(2)} pts/partido)
              </div>
            </div>
          </div>

          {/* Synergies & Rivalries Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Sinergia de Parejas (Best & Worst Partner) */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Sinergias de Pareja (Compañeros)</h3>
                </div>
                <span className="text-xs text-slate-400">{playerStats.partners.length} Duplas jugadas</span>
              </div>

              {/* Best & Worst Highlight Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" /> Pareja de Oro
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {playerStats.bestPartner ? playerStats.bestPartner.partnerName : 'Sin datos'}
                  </div>
                  <div className="text-xs text-emerald-300 font-bold font-mono mt-0.5">
                    {playerStats.bestPartner ? `${playerStats.bestPartner.winRate}% Vic (${playerStats.bestPartner.winsTogether}V de ${playerStats.bestPartner.matchesTogether})` : '-'}
                  </div>
                </div>

                <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl">
                  <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center">
                    <ShieldAlert className="w-3 h-3 mr-1" /> Menor Rendimiento
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {playerStats.worstPartner ? playerStats.worstPartner.partnerName : 'Sin datos'}
                  </div>
                  <div className="text-xs text-rose-300 font-bold font-mono mt-0.5">
                    {playerStats.worstPartner ? `${playerStats.worstPartner.winRate}% Vic (${playerStats.worstPartner.lossesTogether}D de ${playerStats.worstPartner.matchesTogether})` : '-'}
                  </div>
                </div>
              </div>

              {/* Full Partners List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {playerStats.partners.map((pt) => (
                  <div key={pt.partnerId} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 text-xs border border-slate-800/80">
                    <div>
                      <span className="font-bold text-white block">{pt.partnerName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {pt.winsTogether} Victorias - {pt.lossesTogether} Derrotas
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                        pt.winRate >= 60 ? 'bg-emerald-500/20 text-emerald-400' : pt.winRate <= 35 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {pt.winRate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rivalidades Directas (Nemesis & Favorite Rival) */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Swords className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Rivalidades Directas (H2H)</h3>
                </div>
                <span className="text-xs text-slate-400">{playerStats.opponents.length} Rivales enfrentados</span>
              </div>

              {/* Nemesis & Favorite Highlight Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl">
                  <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center">
                    <ShieldAlert className="w-3 h-3 mr-1" /> Némesis (Más derrotas)
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {playerStats.nemesisOpponent ? playerStats.nemesisOpponent.opponentName : 'Sin datos'}
                  </div>
                  <div className="text-xs text-rose-300 font-bold font-mono mt-0.5">
                    {playerStats.nemesisOpponent ? `${playerStats.nemesisOpponent.lossesAgainst} Derrotas vs ${playerStats.nemesisOpponent.winsAgainst}V` : '-'}
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" /> Rival Favorito
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {playerStats.favoriteOpponent ? playerStats.favoriteOpponent.opponentName : 'Sin datos'}
                  </div>
                  <div className="text-xs text-emerald-300 font-bold font-mono mt-0.5">
                    {playerStats.favoriteOpponent ? `${playerStats.favoriteOpponent.winsAgainst} Victorias (${playerStats.favoriteOpponent.winRateAgainst}%)` : '-'}
                  </div>
                </div>
              </div>

              {/* Full Opponents List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {playerStats.opponents.map((op) => (
                  <div key={op.opponentId} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 text-xs border border-slate-800/80">
                    <div>
                      <span className="font-bold text-white block">{op.opponentName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {op.winsAgainst}V - {op.lossesAgainst}D ({op.matchesAgainst} cruces)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                        op.winRateAgainst >= 60 ? 'bg-emerald-500/20 text-emerald-400' : op.winRateAgainst <= 35 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {op.winRateAgainst}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Radar & Match History Log */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Radar Chart */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-cyan-400" />
                Radar de Atributos & Rendimiento
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="metric" stroke="#94A3B8" tick={{ fontSize: 11, fill: '#CBD5E1' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#334155" />
                    <Radar name={playerStats.playerName} dataKey="val" stroke="#10B981" fill="#10B981" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Match History Timeline */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-emerald-400" />
                Historial de Partidos y Bonos
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {playerStats.matchHistory.map((m, idx) => (
                  <div key={m.matchId + idx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                          m.result === 'W' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {m.result === 'W' ? 'Victoria' : 'Derrota'}
                        </span>
                        <span className="font-bold text-white">{m.scoreText}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Pareja: <span className="text-slate-200">{m.partnerName}</span> vs {m.opponentNames.join(' & ')}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-emerald-400 font-bold block">{m.pointsEarned} pts</span>
                      <span className="text-[10px] text-slate-500">{m.decimalEarned >= 0 ? `+${m.decimalEarned.toFixed(3)}` : m.decimalEarned.toFixed(3)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Head to Head Comparator Mode */}
      {viewMode === 'compare' && pA && pB && (
        <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Jugador A</label>
              <select
                value={comparatorPlayerIdA}
                onChange={(e) => setComparatorPlayerIdA(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold"
              >
                {statsList.map((s) => (
                  <option key={s.playerId} value={s.playerId}>
                    #{s.currentRank} {s.playerName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Jugador B</label>
              <select
                value={comparatorPlayerIdB}
                onChange={(e) => setComparatorPlayerIdB(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-blue-400 font-bold"
              >
                {statsList.map((s) => (
                  <option key={s.playerId} value={s.playerId}>
                    #{s.currentRank} {s.playerName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* H2H Faceoff Box */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 text-center">
            <div className="space-y-1 flex-1">
              <div className="text-xl sm:text-2xl font-black text-emerald-400">{pA.playerName}</div>
              <div className="text-xs text-slate-400">Ranking #{pA.currentRank} • Rating PI: {pA.bayesianRating.toFixed(3)}</div>
              <div className="text-3xl font-black font-display text-white mt-2">
                {h2hRecordForA ? h2hRecordForA.winsAgainst : 0}
              </div>
              <div className="text-xs text-emerald-400 font-bold">Victorias Directas</div>
            </div>

            <div className="px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 font-display font-black text-slate-400 text-lg">
              VS
              <div className="text-[10px] font-mono text-slate-500 font-normal mt-0.5">
                {h2hRecordForA ? `${h2hRecordForA.matchesAgainst} enfrentamientos` : 'Sin partidos cruzados'}
              </div>
            </div>

            <div className="space-y-1 flex-1">
              <div className="text-xl sm:text-2xl font-black text-blue-400">{pB.playerName}</div>
              <div className="text-xs text-slate-400">Ranking #{pB.currentRank} • Rating PI: {pB.bayesianRating.toFixed(3)}</div>
              <div className="text-3xl font-black font-display text-white mt-2">
                {h2hRecordForA ? h2hRecordForA.lossesAgainst : 0}
              </div>
              <div className="text-xs text-blue-400 font-bold">Victorias Directas</div>
            </div>
          </div>

          {/* Metric Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-900 text-slate-400 uppercase font-semibold">
                  <th className="py-2.5 px-4 text-emerald-400 text-left">{pA.playerName}</th>
                  <th className="py-2.5 px-4 text-slate-300">Métrica de Rendimiento</th>
                  <th className="py-2.5 px-4 text-blue-400 text-right">{pB.playerName}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="py-3 px-4 text-left font-bold text-white">{pA.winRatePercentage}%</td>
                  <td className="py-3 px-4 text-slate-400">% de Efectividad de Victoria</td>
                  <td className="py-3 px-4 text-right font-bold text-white">{pB.winRatePercentage}%</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-left font-bold text-white">{pA.totalChampionshipPoints.toFixed(3)}</td>
                  <td className="py-3 px-4 text-slate-400">Puntos Totales de Campeonato</td>
                  <td className="py-3 px-4 text-right font-bold text-white">{pB.totalChampionshipPoints.toFixed(3)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-left font-bold text-white">{pA.avgPointsPerMatch.toFixed(2)}</td>
                  <td className="py-3 px-4 text-slate-400">Promedio de Games / Partido</td>
                  <td className="py-3 px-4 text-right font-bold text-white">{pB.avgPointsPerMatch.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-left font-bold text-white">{pA.gameDifference > 0 ? `+${pA.gameDifference}` : pA.gameDifference}</td>
                  <td className="py-3 px-4 text-slate-400">Diferencia Neta de Games</td>
                  <td className="py-3 px-4 text-right font-bold text-white">{pB.gameDifference > 0 ? `+${pB.gameDifference}` : pB.gameDifference}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
