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
  Sparkles,
  Search,
  Beer,
  Skull
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
        { metric: 'Efectividad %', val: playerStats.winRatePercentage },
        { metric: 'Rating PI', val: Math.min(100, playerStats.bayesianRating * 12) },
        { metric: 'Promedio Games', val: Math.min(100, (playerStats.avgPointsPerMatch / 7) * 100) },
        { metric: 'Puntos Acum.', val: Math.min(100, (playerStats.totalChampionshipPoints / 40) * 100) },
        { metric: 'Asistencia', val: Math.min(100, (playerStats.daysAttended / 3) * 100) },
      ]
    : [];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Banner & Mode Toggle */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="p-3 rounded-2xl bg-blue-500/20 text-cyan-400 flex-shrink-0">
              <Zap className="w-7 h-7" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-white flex items-center">
                Padel Intelligence & Sala de Veneno 🐍
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                Sinergias de pareja, tus clientes frecuentes y quién es tu papá en la cancha.
              </p>
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex items-center w-full md:w-auto">
          <button
            onClick={() => setViewMode('profile')}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
              viewMode === 'profile'
                ? 'bg-blue-600 text-white shadow-blue-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Perfil & Sinergias
          </button>
          <button
            onClick={() => setViewMode('compare')}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
              viewMode === 'compare'
                ? 'bg-emerald-500 text-black shadow-neon'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cara a Cara (H2H)
          </button>
        </div>
      </div>

      {viewMode === 'profile' && playerStats && (
        <div className="space-y-6">
          {/* Player Selector Bar */}
          <div className="glass-panel p-3.5 sm:p-4 rounded-3xl border border-slate-800 flex items-center space-x-3 overflow-x-auto scrollbar-none">
            <span className="text-sm font-black text-slate-300 flex items-center flex-shrink-0">
              <Search className="w-4 h-4 mr-1 text-cyan-400" /> Jugador:
            </span>
            <div className="flex space-x-2">
              {statsList.map((st) => (
                <button
                  key={st.playerId}
                  onClick={() => {
                    setActivePlayerId(st.playerId);
                    onSelectPlayer(st.playerId);
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-black whitespace-nowrap transition-all ${
                    st.playerId === activePlayerId
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-blue-glow'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  #{st.currentRank} {st.playerName}
                </button>
              ))}
            </div>
          </div>

          {/* Player KPI Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Rank & Rating */}
            <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400 font-bold">
                <span>Posición Oficial</span>
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-display text-white">
                #{playerStats.currentRank}
              </div>
              <div className="text-sm text-emerald-400 font-mono font-black">
                {formatScoreDisplay(playerStats.totalChampionshipPoints)} pts
              </div>
            </div>

            {/* Win Rate */}
            <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400 font-bold">
                <span>Efectividad V/D</span>
                <Flame className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-display text-emerald-400">
                {playerStats.winRatePercentage}%
              </div>
              <div className="text-xs sm:text-sm text-slate-300 font-bold">
                {playerStats.totalMatchesWon}V - {playerStats.totalMatchesLost}D ({playerStats.totalMatchesPlayed} PJ)
              </div>
            </div>

            {/* Games Base */}
            <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400 font-bold">
                <span>Games Ganados</span>
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-display text-blue-400 font-mono">
                {playerStats.totalBasePoints}
              </div>
              <div className="text-xs sm:text-sm text-slate-400 font-semibold">
                Bonos: {playerStats.totalDecimalBonus >= 0 ? `+${playerStats.totalDecimalBonus.toFixed(3)}` : playerStats.totalDecimalBonus.toFixed(3)}
              </div>
            </div>

            {/* Net Diff */}
            <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400 font-bold">
                <span>Diferencia Games</span>
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-display text-cyan-300">
                {playerStats.gameDifference > 0 ? `+${playerStats.gameDifference}` : playerStats.gameDifference}
              </div>
              <div className="text-xs sm:text-sm text-slate-400 font-mono font-bold">
                {playerStats.avgPointsPerMatch.toFixed(2)} games/partido
              </div>
            </div>
          </div>

          {/* Spicy Synergies & Rivalries Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Sinergia de Parejas (Best & Worst Partner) */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-base sm:text-lg font-black text-white">Sinergias de Pareja (Compañeros)</h3>
                </div>
                <span className="text-xs font-bold text-slate-400">{playerStats.partners.length} Duplas</span>
              </div>

              {/* Best & Worst Highlight Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/15 border border-emerald-500/40 p-4 rounded-3xl">
                  <div className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center">
                    <Sparkles className="w-4 h-4 mr-1" /> Pareja de Oro
                  </div>
                  <div className="text-base sm:text-lg font-black text-white mt-1 truncate">
                    {playerStats.bestPartner ? playerStats.bestPartner.partnerName : 'Sin datos'}
                  </div>
                  <div className="text-xs sm:text-sm text-emerald-300 font-black font-mono mt-0.5">
                    {playerStats.bestPartner ? `${playerStats.bestPartner.winRate}% Vic (${playerStats.bestPartner.winsTogether}V de ${playerStats.bestPartner.matchesTogether})` : '-'}
                  </div>
                </div>

                <div className="bg-rose-500/15 border border-rose-500/40 p-4 rounded-3xl">
                  <div className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center">
                    <Skull className="w-4 h-4 mr-1" /> Pareja Tóxica
                  </div>
                  <div className="text-base sm:text-lg font-black text-white mt-1 truncate">
                    {playerStats.worstPartner ? playerStats.worstPartner.partnerName : 'Sin datos'}
                  </div>
                  <div className="text-xs sm:text-sm text-rose-300 font-black font-mono mt-0.5">
                    {playerStats.worstPartner ? `${playerStats.worstPartner.winRate}% Vic (${playerStats.worstPartner.lossesTogether}D de ${playerStats.worstPartner.matchesTogether})` : '-'}
                  </div>
                </div>
              </div>

              {/* Full Partners List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {playerStats.partners.map((pt) => (
                  <div key={pt.partnerId} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div>
                      <span className="font-black text-white text-base block">{pt.partnerName}</span>
                      <span className="text-xs text-slate-400 font-mono font-bold">
                        {pt.winsTogether} Victorias - {pt.lossesTogether} Derrotas
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full font-black text-xs sm:text-sm ${
                        pt.winRate >= 60 ? 'bg-emerald-500/20 text-emerald-400' : pt.winRate <= 35 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {pt.winRate}% Vic
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rivalidades Directas (Nemesis & Favorite Rival) */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Swords className="w-6 h-6 text-amber-400" />
                  <h3 className="text-base sm:text-lg font-black text-white">Rivalidades Directas (H2H)</h3>
                </div>
                <span className="text-xs font-bold text-slate-400">{playerStats.opponents.length} Rivales</span>
              </div>

              {/* Nemesis & Favorite Highlight Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-rose-500/15 border border-rose-500/40 p-4 rounded-3xl">
                  <div className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center">
                    <ShieldAlert className="w-4 h-4 mr-1" /> Tu Padre / Némesis
                  </div>
                  <div className="text-base sm:text-lg font-black text-white mt-1 truncate">
                    {playerStats.nemesisOpponent ? playerStats.nemesisOpponent.opponentName : 'Sin datos'}
                  </div>
                  <div className="text-xs sm:text-sm text-rose-300 font-black font-mono mt-0.5">
                    {playerStats.nemesisOpponent ? `${playerStats.nemesisOpponent.lossesAgainst} Derrotas sufridas` : '-'}
                  </div>
                </div>

                <div className="bg-emerald-500/15 border border-emerald-500/40 p-4 rounded-3xl">
                  <div className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center">
                    <Beer className="w-4 h-4 mr-1" /> Tu Cliente
                  </div>
                  <div className="text-base sm:text-lg font-black text-white mt-1 truncate">
                    {playerStats.favoriteOpponent ? playerStats.favoriteOpponent.opponentName : 'Sin datos'}
                  </div>
                  <div className="text-xs sm:text-sm text-emerald-300 font-black font-mono mt-0.5">
                    {playerStats.favoriteOpponent ? `${playerStats.favoriteOpponent.winsAgainst} Victorias (${playerStats.favoriteOpponent.winRateAgainst}%)` : '-'}
                  </div>
                </div>
              </div>

              {/* Full Opponents List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {playerStats.opponents.map((op) => (
                  <div key={op.opponentId} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div>
                      <span className="font-black text-white text-base block">{op.opponentName}</span>
                      <span className="text-xs text-slate-400 font-mono font-bold">
                        {op.winsAgainst}V - {op.lossesAgainst}D ({op.matchesAgainst} cruces)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full font-black text-xs sm:text-sm ${
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
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
              <h3 className="text-base sm:text-lg font-black text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-cyan-400" />
                Radar de Paquetismo vs Magia
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="metric" stroke="#94A3B8" tick={{ fontSize: 13, fill: '#CBD5E1', fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#334155" />
                    <Radar name={playerStats.playerName} dataKey="val" stroke="#10B981" fill="#10B981" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Match History Timeline */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
              <h3 className="text-base sm:text-lg font-black text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-emerald-400" />
                Historial de Partidos y Desempates
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {playerStats.matchHistory.map((m, idx) => (
                  <div key={m.matchId + idx} className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                          m.result === 'W' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {m.result === 'W' ? 'Victoria' : 'Derrota'}
                        </span>
                        <span className="font-black text-white text-base">{m.scoreText}</span>
                      </div>
                      <div className="text-xs text-slate-300 font-semibold mt-1">
                        Pareja: <strong className="text-white">{m.partnerName}</strong> vs {m.opponentNames.join(' & ')}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-emerald-400 font-black text-base block">{m.pointsEarned} pts</span>
                      <span className="text-xs text-slate-400 font-bold">{m.decimalEarned >= 0 ? `+${m.decimalEarned.toFixed(3)}` : m.decimalEarned.toFixed(3)}</span>
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
        <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase text-slate-300 block mb-1">Rival A</label>
              <select
                value={comparatorPlayerIdA}
                onChange={(e) => setComparatorPlayerIdA(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-base text-emerald-400 font-black"
              >
                {statsList.map((s) => (
                  <option key={s.playerId} value={s.playerId}>
                    #{s.currentRank} {s.playerName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-black uppercase text-slate-300 block mb-1">Rival B</label>
              <select
                value={comparatorPlayerIdB}
                onChange={(e) => setComparatorPlayerIdB(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-base text-blue-400 font-black"
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
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 text-center">
            <div className="space-y-1 flex-1">
              <div className="text-2xl font-black text-emerald-400">{pA.playerName}</div>
              <div className="text-sm text-slate-300 font-bold">Ranking #{pA.currentRank} • {pA.totalChampionshipPoints.toFixed(3)} Pts</div>
              <div className="text-5xl font-black font-display text-white mt-2">
                {h2hRecordForA ? h2hRecordForA.winsAgainst : 0}
              </div>
              <div className="text-xs sm:text-sm text-emerald-400 font-black">Victorias Directas</div>
            </div>

            <div className="px-6 py-3 bg-slate-900 rounded-2xl border border-slate-800 font-display font-black text-slate-400 text-2xl">
              VS
              <div className="text-xs font-mono text-slate-400 font-bold mt-0.5">
                {h2hRecordForA ? `${h2hRecordForA.matchesAgainst} partidos` : 'Sin duelos'}
              </div>
            </div>

            <div className="space-y-1 flex-1">
              <div className="text-2xl font-black text-blue-400">{pB.playerName}</div>
              <div className="text-sm text-slate-300 font-bold">Ranking #{pB.currentRank} • {pB.totalChampionshipPoints.toFixed(3)} Pts</div>
              <div className="text-5xl font-black font-display text-white mt-2">
                {h2hRecordForA ? h2hRecordForA.lossesAgainst : 0}
              </div>
              <div className="text-xs sm:text-sm text-blue-400 font-black">Victorias Directas</div>
            </div>
          </div>

          {/* Metric Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-sm sm:text-base">
              <thead>
                <tr className="bg-slate-900 text-slate-400 uppercase font-black">
                  <th className="py-3 px-4 text-emerald-400 text-left">{pA.playerName}</th>
                  <th className="py-3 px-4 text-slate-300">Métrica</th>
                  <th className="py-3 px-4 text-blue-400 text-right">{pB.playerName}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-bold">
                <tr>
                  <td className="py-3.5 px-4 text-left font-black text-white">{pA.winRatePercentage}%</td>
                  <td className="py-3.5 px-4 text-slate-300">% Efectividad de Victoria</td>
                  <td className="py-3.5 px-4 text-right font-black text-white">{pB.winRatePercentage}%</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 text-left font-black text-white">{pA.totalChampionshipPoints.toFixed(3)}</td>
                  <td className="py-3.5 px-4 text-slate-300">Puntos Totales</td>
                  <td className="py-3.5 px-4 text-right font-black text-white">{pB.totalChampionshipPoints.toFixed(3)}</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 text-left font-black text-white">{pA.totalBasePoints} pts</td>
                  <td className="py-3.5 px-4 text-slate-300">Games Ganados Base</td>
                  <td className="py-3.5 px-4 text-right font-black text-white">{pB.totalBasePoints} pts</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 text-left font-black text-white">{pA.gameDifference > 0 ? `+${pA.gameDifference}` : pA.gameDifference}</td>
                  <td className="py-3.5 px-4 text-slate-300">Diferencia Neta de Games</td>
                  <td className="py-3.5 px-4 text-right font-black text-white">{pB.gameDifference > 0 ? `+${pB.gameDifference}` : pB.gameDifference}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
