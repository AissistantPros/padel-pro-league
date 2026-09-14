import React, { useState } from 'react';
import {
  X,
  Trophy,
  Medal,
  Calendar,
  Share2,
  Copy,
  Check,
  Printer,
  Sparkles,
  Flame,
  Award,
  Zap,
  Users,
  ChevronRight,
  TrendingUp,
  Brain,
  ExternalLink,
  Heart,
  Crown,
  Smile,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type {
  TournamentDay,
  Player,
  PlayerIntelligenceStats,
  TournamentConfig,
  Match,
} from '../types/index.ts';
import { formatSpanishDate, getOrdinalDateName } from './MatchdayLive.tsx';
import { formatScoreDisplay } from '../utils/tieBreakerEngine.ts';

interface MatchdayReportModalProps {
  day: TournamentDay;
  players: Player[];
  statsList?: PlayerIntelligenceStats[];
  config?: TournamentConfig;
  isAdmin?: boolean;
  onClose: () => void;
}

export const MatchdayReportModal: React.FC<MatchdayReportModalProps> = ({
  day,
  players,
  statsList = [],
  config,
  isAdmin = false,
  onClose,
}) => {
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // App URL for WhatsApp and UI sharing
  const appUrl = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
    ? window.location.origin
    : 'https://padel-tournament-app-gamma.vercel.app';

  // Helper to get player info (avatar, nickname, full name)
  const getPlayerInfo = (id: string, fallbackName: string) => {
    const p = players.find(x => x.id === id || x.name.toLowerCase() === fallbackName.toLowerCase());
    const stat = statsList.find(s => s.playerId === id || s.playerName.toLowerCase() === fallbackName.toLowerCase());
    const avatar = p?.avatar || stat?.avatar || '';
    const nickname = p?.nickname?.trim() || stat?.nickname?.trim() || fallbackName.split(' ')[0];
    const fullName = p?.name || stat?.playerName || fallbackName;
    return { id, avatar, nickname, fullName };
  };

  // Preliminary rounds (usually rounds 1, 2, 3)
  const prelimRounds = day.rounds.filter(r => r.roundNumber <= 3);
  // Final round (round 4)
  const finalsRound = day.rounds.find(r => r.roundNumber === 4 || r.name.toLowerCase().includes('final'));

  // Standings data for the day
  const prelimStandings = day.prelimStandings || [];
  const finalStandings = day.finalStandings && day.finalStandings.length > 0
    ? day.finalStandings
    : prelimStandings;

  // General accumulated championship standings
  const accumulatedStandings = [...statsList].sort((a, b) => {
    if (b.totalChampionshipPoints !== a.totalChampionshipPoints) {
      return b.totalChampionshipPoints - a.totalChampionshipPoints;
    }
    return b.winRatePercentage - a.winRatePercentage;
  });

  // King of the Day (Player with the highest total points of the day)
  const topScorer = finalStandings.length > 0
    ? [...finalStandings].sort((a, b) => (b.totalDailyScore || 0) - (a.totalDailyScore || 0))[0]
    : null;
  const topScorerInfo = topScorer ? getPlayerInfo(topScorer.playerId, topScorer.playerName) : null;

  // Format finals match title dynamically by court
  const getFinalsCourtLabel = (courtNum: number) => {
    const place1 = (courtNum - 1) * 2 + 1;
    const place2 = (courtNum - 1) * 2 + 2;
    if (courtNum === 1) return { title: '1º y 2º Lugar (Final de Oro)', icon: '🥇', color: '#FFD60A', place1, place2 };
    if (courtNum === 2) return { title: '3º y 4º Lugar (Final de Plata)', icon: '🥈', color: '#E5E5EA', place1, place2 };
    if (courtNum === 3) return { title: '5º y 6º Lugar (Final de Bronce)', icon: '🥉', color: '#FF9F0A', place1, place2 };
    return { title: `${place1}º y ${place2}º Lugar`, icon: '🎾', color: '#64D2FF', place1, place2 };
  };

  // Generate WhatsApp formatted text
  const generateWhatsAppSummary = () => {
    let text = `🎾 *REPORTE OFICIAL DE JORNADA* 🎾\n`;
    text += `🏆 *${config?.editionName || 'Torneo de Pádel'}*\n`;
    text += `📅 *${formatSpanishDate(day.date)}*\n`;
    text += `👥 *${day.checkedInPlayerIds.length} Jugadores Participantes*\n\n`;

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `1️⃣ *RONDAS ELIMINATORIAS (RONDAS 1, 2 Y 3)*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;

    prelimRounds.forEach((round) => {
      text += `\n🎾 *${round.name || `Ronda ${round.roundNumber}`}*\n`;
      round.matches.forEach((m) => {
        const scoreStr = m.score.completed ? `${m.score.scoreA} - ${m.score.scoreB}` : 'Pendiente';
        const court = m.courtNumber ? `Pista ${m.courtNumber}` : 'Pista';
        const teamAName = `${m.teamA.player1Name} & ${m.teamA.player2Name}`;
        const teamBName = `${m.teamB.player1Name} & ${m.teamB.player2Name}`;
        text += `• ${court}: ${teamAName} [${scoreStr}] ${teamBName}\n`;
      });
    });

    if (prelimStandings.length > 0) {
      text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `2️⃣ *TABLA PRELIMINAR (CORTE RONDA 3)*\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      prelimStandings.forEach((ps, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
        text += `${medal} *${ps.playerName}*: ${formatScoreDisplay(ps.prelimTotalScore)} pts (${ps.matchesWon}V-${ps.matchesLost}D, ${ps.gamesWon} games)\n`;
      });
    }

    if (finalsRound && finalsRound.matches.length > 0) {
      text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `3️⃣ *FINALES DEL DÍA & LUGARES*\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━\n`;

      finalsRound.matches.forEach((m, idx) => {
        const court = m.courtNumber || idx + 1;
        const meta = getFinalsCourtLabel(court);
        const pA1 = getPlayerInfo(m.teamA.player1Id, m.teamA.player1Name);
        const pA2 = getPlayerInfo(m.teamA.player2Id, m.teamA.player2Name);
        const pB1 = getPlayerInfo(m.teamB.player1Id, m.teamB.player1Name);
        const pB2 = getPlayerInfo(m.teamB.player2Id, m.teamB.player2Name);

        const scoreA = m.score.scoreA || 0;
        const scoreB = m.score.scoreB || 0;
        const isTeamAWinner = m.score.completed && (m.score.winner === 'teamA' || scoreA > scoreB);
        const isTeamBWinner = m.score.completed && (m.score.winner === 'teamB' || scoreB > scoreA);

        text += `\n${meta.icon} *${meta.title} (Pista ${court})*\n`;
        text += `⚔️ ${pA1.nickname} & ${pA2.nickname} vs ${pB1.nickname} & ${pB2.nickname}\n`;
        text += `🔥 Marcador: ${scoreA} - ${scoreB}\n`;

        if (isTeamAWinner) {
          text += `🏆 *GANADORES (${meta.place1}º Lugar):* ${pA1.nickname} & ${pA2.nickname}\n`;
          text += `🥈 *Subcampeones (${meta.place2}º Lugar):* ${pB1.nickname} & ${pB2.nickname}\n`;
        } else if (isTeamBWinner) {
          text += `🏆 *GANADORES (${meta.place1}º Lugar):* ${pB1.nickname} & ${pB2.nickname}\n`;
          text += `🥈 *Subcampeones (${meta.place2}º Lugar):* ${pA1.nickname} & ${pA2.nickname}\n`;
        } else {
          text += `⏳ Partido por definir.\n`;
        }
      });
    }

    if (topScorerInfo && topScorer) {
      text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `👑 *REY DE LA FECHA (MÁS PUNTOS DEL DÍA)*\n`;
      text += `⭐ *${topScorerInfo.fullName}* ("${topScorerInfo.nickname}")\n`;
      text += `📊 Puntos del Día: *${formatScoreDisplay(topScorer.totalDailyScore)} pts*\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    }

    // 4. Daily Final Standings
    if (finalStandings.length > 0) {
      text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `4️⃣ *TABLA FINAL DEL DÍA (PUNTOS DE LA FECHA)*\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      finalStandings.forEach((ps, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
        const pInfo = getPlayerInfo(ps.playerId, ps.playerName);
        const nickStr = pInfo.nickname && pInfo.nickname !== pInfo.fullName ? ` ("${pInfo.nickname}")` : '';
        text += `${medal} *${ps.playerName}*${nickStr}: ${formatScoreDisplay(ps.totalDailyScore || ps.prelimTotalScore)} pts\n`;
      });
    }

    // 5. Accumulated Championship Standings
    if (accumulatedStandings.length > 0) {
      text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `5️⃣ *TABLA GENERAL ACUMULADA DEL TORNEO*\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      accumulatedStandings.forEach((st, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
        const nickStr = st.nickname ? ` ("${st.nickname}")` : '';
        text += `${medal} *${st.playerName}*${nickStr}: ${formatScoreDisplay(st.totalChampionshipPoints)} pts (${st.totalMatchesWon}V-${st.totalMatchesLost}D, ${st.winRatePercentage}%)\n`;
      });
    }

    // 6. Pádel Intelligence Call to Action
    text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🧠 *PÁDEL INTELLIGENCE & ESTADÍSTICAS* 🧠\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `¿Quieres saber quién es tu padre 👨🏻, tu hijo 👶🏻, tus clientes 💼, tu bolsa de piedras 🪨 o tu Tinder Match ❤️‍🔥?\n\n`;
    text += `👉 Entra a la webapp y analiza todos tus datos y estadísticas:\n`;
    text += `🔗 ${appUrl}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;

    return text;
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppSummary();
    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex flex-col justify-between overflow-y-auto select-none animate-fade-in print:bg-white print:text-black print:p-0">
      {/* Top Action Bar */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-2 print:hidden">
        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-full bg-[#1C1C1E] text-[#8E8E93] hover:text-white text-xs font-semibold border border-white/10 ios-touch"
          >
            Cerrar
          </button>
        </div>

        <div className="text-center">
          <span className="text-[10px] sm:text-xs font-bold text-[#FFD60A] uppercase tracking-wider block">
            {config?.editionName || 'Torneo de Pádel'}
          </span>
          <h2 className="text-sm sm:text-base font-black text-white">
            📄 Reporte Oficial de Jornada
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {isAdmin ? (
            <>
              <button
                onClick={handleCopyWhatsApp}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center ios-touch shadow-md ${
                  copiedWhatsApp
                    ? 'bg-[#30D158] text-black'
                    : 'bg-[#25D366] text-white hover:bg-[#20bd5a]'
                }`}
                title="Copiar texto para WhatsApp"
              >
                {copiedWhatsApp ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" /> ¡Copiado!
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 mr-1" /> WhatsApp
                  </>
                )}
              </button>

              <button
                onClick={handlePrint}
                className="p-1.5 rounded-full bg-[#1C1C1E] text-[#8E8E93] hover:text-white border border-white/10 ios-touch hidden sm:flex items-center justify-center"
                title="Imprimir / PDF"
              >
                <Printer className="w-4 h-4" />
              </button>
            </>
          ) : (
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-[#1C1C1E] border border-white/10 text-[10px] text-[#8E8E93]">
              <Lock className="w-3 h-3 mr-1 text-[#FFD60A]" /> Solo Lectura
            </span>
          )}

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C1C1E] text-[#8E8E93] hover:text-white flex items-center justify-center border border-white/10 ios-touch"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Report Container */}
      <div className="max-w-3xl w-full mx-auto px-4 sm:px-8 py-6 space-y-8 flex-1 print:p-0 print:max-w-none">
        {/* ======================================================== */}
        {/* HEADER HERO BANNER                                       */}
        {/* ======================================================== */}
        <div className="ios-card p-6 text-center space-y-3 bg-gradient-to-b from-[#1C1C1E] to-[#121214] border border-white/10 relative overflow-hidden shadow-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FFD60A]/15 border border-[#FFD60A]/30 text-[#FFD60A] text-xs font-bold">
            <Trophy className="w-3.5 h-3.5" />
            <span>Resumen Ejecutivo Oficial</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {day.name || 'Jornada de Torneo'}
          </h1>

          <div className="flex items-center justify-center space-x-3 text-xs sm:text-sm text-[#8E8E93] flex-wrap gap-y-1">
            <span className="text-[#FFD60A] font-semibold flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              {formatSpanishDate(day.date)}
            </span>
            <span>•</span>
            <span className="text-white font-medium flex items-center">
              <Users className="w-3.5 h-3.5 mr-1 text-[#30D158]" />
              {day.checkedInPlayerIds.length} Jugadores
            </span>
            <span>•</span>
            <span className="text-white font-medium">
              {day.rounds.reduce((acc, r) => acc + r.matches.length, 0)} Partidos Disputados
            </span>
          </div>

          {/* Quick Stats Pill Ribbon / Admin Action */}
          {isAdmin && (
            <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={handleCopyWhatsApp}
                className="px-4 py-2 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] text-xs font-bold flex items-center hover:bg-[#25D366]/30 transition-all ios-touch print:hidden"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                {copiedWhatsApp ? '¡Texto Copiado para WhatsApp!' : 'Copiar Resumen para WhatsApp'}
              </button>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SPOTLIGHT: REY DE LA FECHA (MÁS PUNTOS DEL DÍA)          */}
        {/* ======================================================== */}
        {topScorerInfo && topScorer && (
          <div className="ios-card p-5 border-2 border-[#FFD60A]/40 bg-gradient-to-r from-[#FFD60A]/10 via-[#1C1C1E] to-[#FFD60A]/10 relative overflow-hidden shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4 min-w-0">
                <div className="relative flex-shrink-0">
                  {topScorerInfo.avatar ? (
                    <img
                      src={topScorerInfo.avatar}
                      alt={topScorerInfo.fullName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#FFD60A] shadow-lg bg-[#2C2C2E]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#2C2C2E] text-[#FFD60A] font-black text-xl flex items-center justify-center border-2 border-[#FFD60A] shadow-lg">
                      {topScorerInfo.fullName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -top-2 -right-1 bg-[#FFD60A] text-black text-xs font-bold rounded-full p-1 shadow-md">
                    👑
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FFD60A] bg-[#FFD60A]/20 px-2 py-0.5 rounded-full">
                      👑 Rey de la Fecha
                    </span>
                    <span className="text-xs text-[#8E8E93]">Mayor puntaje del día</span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1 break-words">
                    {topScorerInfo.fullName}
                  </h3>
                  {topScorerInfo.nickname && topScorerInfo.nickname !== topScorerInfo.fullName && (
                    <p className="text-xs text-[#8E8E93] italic">"{topScorerInfo.nickname}"</p>
                  )}
                </div>
              </div>

              <div className="text-center sm:text-right bg-black/40 px-4 py-2.5 rounded-2xl border border-white/10 flex-shrink-0">
                <span className="text-[10px] uppercase font-bold text-[#8E8E93] block">Puntos Conseguidos</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-[#30D158]">
                  {formatScoreDisplay(topScorer.totalDailyScore)}
                </span>
                <span className="text-[10px] text-[#8E8E93] block">
                  {topScorer.matchesWon}V - {topScorer.matchesLost}D ({topScorer.gamesWon} games)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECCIÓN 1: RONDAS DE ELIMINATORIAS (RONDAS 1, 2 Y 3)      */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
            <span className="text-lg font-black text-white flex items-center">
              1️⃣ Rondas de Eliminatorias (Rondas 1, 2 y 3)
            </span>
          </div>

          <div className="space-y-5">
            {prelimRounds.map((round) => (
              <div key={round.roundNumber} className="ios-card p-4 sm:p-5 space-y-3 bg-[#1C1C1E]/90 border border-white/10">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-sm font-bold text-[#30D158] flex items-center">
                    🎾 {round.name || `Ronda ${round.roundNumber}`}
                  </span>
                  <span className="text-xs text-[#8E8E93]">
                    {round.matches.length} partidos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {round.matches.map((m, mIdx) => {
                    const isDone = m.score.completed;
                    const winA = isDone && m.score.winner === 'teamA';
                    const winB = isDone && m.score.winner === 'teamB';
                    const courtName = m.courtNumber ? `Pista ${m.courtNumber}` : `Partido ${mIdx + 1}`;

                    return (
                      <div
                        key={m.id}
                        className="bg-[#2C2C2E]/60 p-3 rounded-2xl border border-white/5 space-y-2 hover:border-white/15 transition-all"
                      >
                        <div className="flex items-center justify-between text-[11px] text-[#8E8E93] pb-1 border-b border-white/5">
                          <span className="font-semibold text-white">🎾 {courtName}</span>
                          <span className={isDone ? 'text-[#30D158] font-bold' : 'text-[#8E8E93]'}>
                            {isDone ? 'Finalizado' : 'Pendiente'}
                          </span>
                        </div>

                        {/* Team A */}
                        <div className={`p-2 rounded-xl flex items-center justify-between text-xs ${
                          winA ? 'bg-[#30D158]/15 text-white font-bold border border-[#30D158]/30' : 'bg-[#1C1C1E] text-white'
                        }`}>
                          <span className="break-words font-semibold pr-2 leading-tight">
                            {m.teamA.player1Name} & {m.teamA.player2Name}
                          </span>
                          <span className="font-mono font-bold text-base pl-2 flex-shrink-0">
                            {isDone ? m.score.scoreA : '-'}
                          </span>
                        </div>

                        {/* Team B */}
                        <div className={`p-2 rounded-xl flex items-center justify-between text-xs ${
                          winB ? 'bg-[#30D158]/15 text-white font-bold border border-[#30D158]/30' : 'bg-[#1C1C1E] text-white'
                        }`}>
                          <span className="break-words font-semibold pr-2 leading-tight">
                            {m.teamB.player1Name} & {m.teamB.player2Name}
                          </span>
                          <span className="font-mono font-bold text-base pl-2 flex-shrink-0">
                            {isDone ? m.score.scoreB : '-'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECCIÓN 2: TABLA PRELIMINAR DE LAS ELIMINATORIAS         */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-lg font-black text-white flex items-center">
              2️⃣ Tabla Preliminar de Eliminatorias (Corte Ronda 3)
            </span>
            <span className="text-xs text-[#8E8E93]">Define cruces de Finales</span>
          </div>

          <div className="ios-card overflow-hidden border border-white/10">
            <div className="ios-grouped-list divide-y divide-white/5">
              {prelimStandings.map((ps, idx) => {
                const rank = idx + 1;
                const pInfo = getPlayerInfo(ps.playerId, ps.playerName);
                
                // Dynamic Court and Places based on rank
                const targetCourt = Math.ceil(rank / 4);
                const p1 = (targetCourt - 1) * 2 + 1;
                const p2 = (targetCourt - 1) * 2 + 2;
                const isGoldTier = targetCourt === 1;
                const isSilverTier = targetCourt === 2;
                const isBronzeTier = targetCourt === 3;

                const tierLabel = `Pista ${targetCourt} • Final ${p1}º y ${p2}º`;
                const tierBg = isGoldTier
                  ? 'bg-[#FFD60A]/10 text-[#FFD60A] border-[#FFD60A]/30'
                  : isSilverTier
                  ? 'bg-[#E5E5EA]/10 text-[#E5E5EA] border-white/20'
                  : isBronzeTier
                  ? 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/30'
                  : 'bg-[#64D2FF]/10 text-[#64D2FF] border-[#64D2FF]/30';

                return (
                  <div key={ps.playerId} className="ios-grouped-row flex items-center justify-between py-3 px-4 gap-3">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <span className="w-6 text-center font-bold text-xs font-mono text-[#8E8E93]">
                        #{rank}
                      </span>

                      {pInfo.avatar ? (
                        <img
                          src={pInfo.avatar}
                          alt={pInfo.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-white/10 flex-shrink-0 bg-[#2C2C2E]"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#2C2C2E] text-[#8E8E93] font-bold text-xs flex items-center justify-center flex-shrink-0 border border-white/10">
                          {pInfo.fullName.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white break-words leading-tight">
                          {pInfo.fullName}
                        </div>
                        <div className="text-xs text-[#8E8E93] flex items-center space-x-1.5 flex-wrap">
                          <span>{ps.matchesWon}V - {ps.matchesLost}D</span>
                          <span>•</span>
                          <span>{ps.gamesWon} games ({ps.gameDiff >= 0 ? `+${ps.gameDiff}` : ps.gameDiff})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 flex-shrink-0 text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border hidden sm:inline-block ${tierBg}`}>
                        {tierLabel}
                      </span>

                      <div>
                        <div className="font-mono text-sm font-bold text-[#30D158]">
                          {formatScoreDisplay(ps.prelimTotalScore)}
                        </div>
                        <div className="text-[10px] text-[#8E8E93]">PTS PRELIM</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECCIÓN 3: FINALES DEL DÍA & CUADRO DE HONOR              */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-lg font-black text-white flex items-center">
              3️⃣ Finales del Día & Lugares (Con Fotos y Apodos)
            </span>
            <span className="text-xs text-[#30D158] font-bold">Juegos de Definición</span>
          </div>

          {finalsRound && finalsRound.matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {finalsRound.matches.map((m, idx) => {
                const court = m.courtNumber || idx + 1;
                const meta = getFinalsCourtLabel(court);

                const pA1 = getPlayerInfo(m.teamA.player1Id, m.teamA.player1Name);
                const pA2 = getPlayerInfo(m.teamA.player2Id, m.teamA.player2Name);
                const pB1 = getPlayerInfo(m.teamB.player1Id, m.teamB.player1Name);
                const pB2 = getPlayerInfo(m.teamB.player2Id, m.teamB.player2Name);

                const scoreA = m.score.scoreA || 0;
                const scoreB = m.score.scoreB || 0;
                const isDone = m.score.completed;
                const isTeamAWinner = isDone && (m.score.winner === 'teamA' || scoreA > scoreB);
                const isTeamBWinner = isDone && (m.score.winner === 'teamB' || scoreB > scoreA);

                // Winning team and runner-up team
                const winningTeam = isTeamAWinner ? [pA1, pA2] : isTeamBWinner ? [pB1, pB2] : null;
                const runnerUpTeam = isTeamAWinner ? [pB1, pB2] : isTeamBWinner ? [pA1, pA2] : null;

                return (
                  <div
                    key={m.id}
                    className="ios-card p-5 space-y-4 border bg-[#1C1C1E] flex flex-col justify-between relative overflow-hidden"
                    style={{ borderColor: `${meta.color}40` }}
                  >
                    {/* Header: Court & Category */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">{meta.icon}</span>
                        <span className="text-sm font-black text-white" style={{ color: meta.color }}>
                          Pista {court}: {meta.title}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold bg-[#2C2C2E] px-2.5 py-0.5 rounded-full text-white">
                        {isDone ? `${scoreA} - ${scoreB}` : 'Pendiente'}
                      </span>
                    </div>

                    {/* Matchup Header: Apodo & Apodo vs Apodo & Apodo */}
                    <div className="text-center bg-[#2C2C2E]/40 p-2.5 rounded-xl border border-white/5">
                      <span className="text-xs text-[#8E8E93] block mb-0.5">Cruce de la Final:</span>
                      <div className="text-xs sm:text-sm font-bold text-white">
                        <span className="text-[#30D158]">{pA1.nickname} & {pA2.nickname}</span>
                        <span className="text-[#8E8E93] mx-2">vs</span>
                        <span className="text-[#0A84FF]">{pB1.nickname} & {pB2.nickname}</span>
                      </div>
                    </div>

                    {/* Winners Podium Showcase (With Photos & Apodos) */}
                    {winningTeam && (
                      <div className="space-y-3 pt-1">
                        {/* 1st Place / Match Winner */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#30D158]/15 to-[#30D158]/5 border border-[#30D158]/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-[#30D158] uppercase tracking-wider flex items-center">
                              🏆 GANADORES ({meta.place1}º LUGAR)
                            </span>
                            <span className="text-[10px] font-bold bg-[#30D158] text-black px-2 py-0.2 rounded-full">
                              ¡VICTORIA!
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            {winningTeam.map((p) => (
                              <div key={p.id} className="flex items-center space-x-2.5 bg-black/40 p-2 rounded-xl border border-white/10">
                                {p.avatar ? (
                                  <img
                                    src={p.avatar}
                                    alt={p.fullName}
                                    className="w-11 h-11 rounded-full object-cover border-2 border-[#30D158] flex-shrink-0 bg-[#2C2C2E]"
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-full bg-[#2C2C2E] text-[#30D158] font-bold text-xs flex items-center justify-center flex-shrink-0 border-2 border-[#30D158]">
                                    {p.fullName.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-black text-white break-words leading-tight">
                                    {p.nickname}
                                  </div>
                                  <div className="text-[10px] text-[#8E8E93] break-words">
                                    {p.fullName}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 2nd Place / Match Runner-up */}
                        {runnerUpTeam && (
                          <div className="p-3 rounded-2xl bg-[#2C2C2E]/40 border border-white/5 space-y-1.5">
                            <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider block">
                              🥈 Subcampeones ({meta.place2}º Lugar)
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {runnerUpTeam.map((p) => (
                                <div key={p.id} className="flex items-center space-x-2 bg-black/20 p-1.5 rounded-xl">
                                  {p.avatar ? (
                                    <img
                                      src={p.avatar}
                                      alt={p.fullName}
                                      className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-[#2C2C2E] text-[#8E8E93] font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                                      {p.fullName.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-bold text-white break-words leading-tight">
                                      {p.nickname}
                                    </div>
                                    <div className="text-[9px] text-[#8E8E93] break-words">
                                      {p.fullName}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="ios-card p-6 text-center text-xs text-[#8E8E93]">
              Las finales de esta fecha aún no han sido generadas.
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SECCIÓN 4: TABLA FINAL DE PUNTOS OFICIALES DE LA FECHA   */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-lg font-black text-white flex items-center">
              4️⃣ Tabla Final Oficial de la Fecha (Puntos Sumados Hoy)
            </span>
            <span className="text-xs text-[#30D158] font-bold">Puntaje Diario</span>
          </div>

          <div className="ios-card overflow-hidden border border-white/10">
            <div className="ios-grouped-list divide-y divide-white/5">
              {finalStandings.map((ps, idx) => {
                const rank = idx + 1;
                const pInfo = getPlayerInfo(ps.playerId, ps.playerName);
                const isGold = rank === 1;
                const isSilver = rank === 2;
                const isBronze = rank === 3;

                return (
                  <div key={ps.playerId} className="ios-grouped-row flex items-center justify-between py-3 px-4 gap-3">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <span className={`w-6 text-center font-black text-xs ${
                        isGold ? 'text-[#FFD60A]' : isSilver ? 'text-[#E5E5EA]' : isBronze ? 'text-[#FF9F0A]' : 'text-[#8E8E93]'
                      }`}>
                        {isGold ? '🥇' : isSilver ? '🥈' : isBronze ? '🥉' : `#${rank}`}
                      </span>

                      {pInfo.avatar ? (
                        <img
                          src={pInfo.avatar}
                          alt={pInfo.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-white/10 flex-shrink-0 bg-[#2C2C2E]"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#2C2C2E] text-[#8E8E93] font-bold text-xs flex items-center justify-center flex-shrink-0 border border-white/10">
                          {pInfo.fullName.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white break-words leading-tight">
                          {pInfo.fullName}
                        </div>
                        <div className="text-xs text-[#8E8E93] flex items-center space-x-1.5 flex-wrap">
                          {pInfo.nickname && <span>"{pInfo.nickname}" • </span>}
                          <span>{ps.matchesWon}V - {ps.matchesLost}D</span>
                          <span>•</span>
                          <span>{ps.gamesWon} games</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="font-mono text-base font-bold text-[#30D158]">
                        {formatScoreDisplay(ps.totalDailyScore || ps.prelimTotalScore)}
                      </div>
                      <div className="text-[10px] text-[#8E8E93] uppercase font-bold">PTS DÍA</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECCIÓN 5: TABLA GENERAL ACUMULADA DEL TORNEO            */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-lg font-black text-white flex items-center">
              5️⃣ Tabla General Acumulada del Torneo
            </span>
            <span className="text-xs text-[#FFD60A] font-bold">Acumulado Global</span>
          </div>

          <div className="ios-card overflow-hidden border border-white/10">
            {accumulatedStandings.length > 0 ? (
              <div className="ios-grouped-list divide-y divide-white/5">
                {accumulatedStandings.map((st, idx) => {
                  const rank = idx + 1;
                  const isGold = rank === 1;
                  const isSilver = rank === 2;
                  const isBronze = rank === 3;

                  return (
                    <div key={st.playerId} className="ios-grouped-row flex items-center justify-between py-3 px-4 gap-3">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <span className={`w-6 text-center font-black text-xs ${
                          isGold ? 'text-[#FFD60A]' : isSilver ? 'text-[#E5E5EA]' : isBronze ? 'text-[#FF9F0A]' : 'text-[#8E8E93]'
                        }`}>
                          {isGold ? '🥇' : isSilver ? '🥈' : isBronze ? '🥉' : `#${rank}`}
                        </span>

                        {st.avatar ? (
                          <img
                            src={st.avatar}
                            alt={st.playerName}
                            className="w-9 h-9 rounded-full object-cover border border-white/10 flex-shrink-0 bg-[#2C2C2E]"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#2C2C2E] text-[#8E8E93] font-bold text-xs flex items-center justify-center flex-shrink-0 border border-white/10">
                            {st.playerName.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-white break-words leading-tight flex items-center">
                            <span>{st.playerName}</span>
                            {isGold && <Crown className="w-3.5 h-3.5 text-[#FFD60A] ml-1.5 flex-shrink-0" />}
                          </div>
                          <div className="text-xs text-[#8E8E93] flex items-center space-x-1.5 flex-wrap">
                            {st.nickname && <span>"{st.nickname}" • </span>}
                            <span>{st.daysAttended} {st.daysAttended === 1 ? 'fecha' : 'fechas'}</span>
                            <span>•</span>
                            <span>{st.totalMatchesWon}V - {st.totalMatchesLost}D ({st.winRatePercentage}%)</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="font-mono text-base font-bold text-[#30D158]">
                          {formatScoreDisplay(st.totalChampionshipPoints)}
                        </div>
                        <div className="text-[10px] text-[#8E8E93] uppercase font-bold">PTS TOTALES</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#8E8E93]">
                Aún no hay puntos acumulados registrados.
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECCIÓN 6: PÁDEL INTELLIGENCE (H2H & ESTADÍSTICAS)       */}
        {/* ======================================================== */}
        <div className="ios-card p-6 border-2 border-[#64D2FF]/40 bg-gradient-to-br from-[#0A84FF]/15 via-[#1C1C1E] to-[#64D2FF]/10 relative overflow-hidden shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0A84FF] to-[#64D2FF] flex items-center justify-center text-black shadow-lg flex-shrink-0">
                <Brain className="w-6 h-6 text-white stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#64D2FF] bg-[#64D2FF]/20 px-2 py-0.5 rounded-full">
                    🧠 PÁDEL INTELLIGENCE
                  </span>
                  <span className="text-xs text-[#FFD60A] font-bold">Head to Head & Parejas</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  ¿Quieres saber quién es tu padre, tu hijo o tus clientes?
                </h3>
                <p className="text-xs text-[#8E8E93] leading-relaxed max-w-xl">
                  Entra a la webapp oficial para analizar tus estadísticas avanzadas: 
                  <strong className="text-white"> Tinder Match ❤️‍🔥</strong> (con quién ganas más), 
                  <strong className="text-white"> Bolsa de Piedras 🪨</strong> (con quién pierdes), 
                  <strong className="text-white"> Tu Padre 👨🏻</strong> (tu mayor rival) y 
                  <strong className="text-white"> Tus Clientes 💼</strong> (la pareja a la que más le ganas).
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 flex items-center sm:flex-col justify-between sm:justify-center gap-2 pt-2 sm:pt-0">
              <a
                href={appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#64D2FF] text-white font-black text-xs flex items-center justify-center shadow-lg hover:opacity-90 transition-all ios-touch"
              >
                <span>Abrir WebApp</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </a>
            </div>
          </div>

          {/* WebApp Link Display */}
          <div className="bg-black/50 p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs">
            <span className="text-[#8E8E93] font-mono truncate text-[11px]">
              🔗 {appUrl}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(appUrl);
                confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
              }}
              className="text-[#64D2FF] hover:text-white font-bold ml-2 text-xs flex items-center flex-shrink-0"
            >
              <Copy className="w-3.5 h-3.5 mr-1" /> Copiar Link
            </button>
          </div>
        </div>

        {/* Bottom Actions for WhatsApp Sharing / Admin Only */}
        <div className="pt-4 pb-8 flex flex-col sm:flex-row items-center justify-center gap-3 print:hidden">
          {isAdmin ? (
            <>
              <button
                onClick={handleCopyWhatsApp}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm flex items-center justify-center ios-touch shadow-xl"
              >
                {copiedWhatsApp ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    ¡Resumen Copiado! Pégalo en WhatsApp
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Copiar Reporte Completo para WhatsApp
                  </>
                )}
              </button>

              <button
                onClick={handlePrint}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white font-bold text-sm flex items-center justify-center border border-white/10 ios-touch"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir / PDF
              </button>
            </>
          ) : (
            <div className="w-full max-w-md p-3 rounded-xl bg-[#1C1C1E] border border-white/10 text-center text-xs text-[#8E8E93] flex items-center justify-center space-x-2">
              <Lock className="w-4 h-4 text-[#FFD60A] flex-shrink-0" />
              <span>La descarga y copia del reporte para WhatsApp está reservada para Administradores.</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[#8E8E93] hover:text-white font-bold text-sm ios-touch"
          >
            Cerrar Reporte
          </button>
        </div>
      </div>
    </div>
  );
};
