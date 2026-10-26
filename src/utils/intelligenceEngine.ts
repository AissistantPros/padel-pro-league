import type {
  Player,
  TournamentDay,
  DailyPlayerStanding,
  PlayerIntelligenceStats,
  PartnerSynergy,
  OpponentRivalry,
  DuoMatchup,
  RivalPairStat,
  Match,
  TournamentConfig
} from '../types/index.ts';
import {
  calculateArrivalBonus,
  buildArrivalBonusMap,
  getArrivalPosition,
  roundDecimal,
  TOP_COURT_FINAL_BONUS,
  OTHER_COURT_FINAL_BONUS,
} from './tieBreakerEngine.ts';
import { sortPrelimStandings } from './pairingEngine.ts';

/**
 * Calculates preliminary standings for a matchday after the 3 short games
 */
export function calculateDailyPrelimStandings(
  players: Player[],
  preliminaryMatches: Match[],
  arrivalOrder: string[] = []
): DailyPlayerStanding[] {
  // El orden de llegada es la UNICA fuente de decimales del sistema.
  const orderedIds = arrivalOrder.length > 0 ? arrivalOrder : players.map(p => p.id);
  const arrivalBonusMap = buildArrivalBonusMap(orderedIds);

  const statsMap = new Map<string, {
    playerName: string;
    matchesPlayed: number;
    matchesWon: number;
    matchesLost: number;
    gamesWon: number;
    gamesLost: number;
  }>();

  // Initialize for all checked-in players
  players.forEach(p => {
    statsMap.set(p.id, {
      playerName: p.name,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      gamesWon: 0,
      gamesLost: 0,
    });
  });

  // Process completed matches in rounds 1, 2, 3
  preliminaryMatches.filter(m => m.score.completed).forEach(match => {
    const { teamA, teamB, score } = match;
    const gA = score.scoreA;
    const gB = score.scoreB;

    // Team A players
    [teamA.player1Id, teamA.player2Id].forEach(pId => {
      const stat = statsMap.get(pId);
      if (!stat) return;
      stat.matchesPlayed += 1;
      stat.gamesWon += gA;
      stat.gamesLost += gB;
      if (gA > gB) stat.matchesWon += 1;
      else if (gA < gB) stat.matchesLost += 1;
    });

    // Team B players
    [teamB.player1Id, teamB.player2Id].forEach(pId => {
      const stat = statsMap.get(pId);
      if (!stat) return;
      stat.matchesPlayed += 1;
      stat.gamesWon += gB;
      stat.gamesLost += gA;
      if (gB > gA) stat.matchesWon += 1;
      else if (gB < gA) stat.matchesLost += 1;
    });
  });

  const standings: DailyPlayerStanding[] = Array.from(statsMap.entries()).map(([playerId, stat]) => {
    const arrivalPosition = getArrivalPosition(orderedIds, playerId);
    const arrivalBonus = arrivalBonusMap.get(playerId) ?? calculateArrivalBonus(arrivalPosition);
    const basePoints = stat.gamesWon;
    const prelimTotalScore = roundDecimal(basePoints + arrivalBonus);

    return {
      playerId,
      playerName: stat.playerName,
      matchesPlayed: stat.matchesPlayed,
      matchesWon: stat.matchesWon,
      matchesLost: stat.matchesLost,
      gamesWon: stat.gamesWon,
      gamesLost: stat.gamesLost,
      gameDiff: stat.gamesWon - stat.gamesLost,
      arrivalPosition,
      arrivalBonus,
      basePoints,
      finalGamesWon: 0,
      finalBonus: 0,
      prelimTotalScore,
      totalDailyScore: prelimTotalScore,
      prelimRank: 0,
    };
  });

  // Ranking tras los 3 juegos cortos: puntos + decimal de llegada como desempate
  const sorted = sortPrelimStandings(standings);
  sorted.forEach((s, idx) => {
    s.prelimRank = idx + 1;
  });

  return sorted;
}

/**
 * Calculates final day standings after Round 4 (Daily Finals) is completed
 */
export function calculateDailyFinalStandings(
  prelimStandings: DailyPlayerStanding[],
  finalMatches: Match[]
): DailyPlayerStanding[] {
  const standingsMap = new Map<string, DailyPlayerStanding>(
    prelimStandings.map(s => [s.playerId, {
      ...s,
      finalGamesWon: 0,
      finalBonus: 0,
      totalDailyScore: roundDecimal(s.prelimTotalScore),
    }])
  );

  finalMatches.filter(m => m.score.completed).forEach(match => {
    const { teamA, teamB, score } = match;
    const gA = score.scoreA;
    const gB = score.scoreB;
    const wonA = gA > gB;
    const wonB = gB > gA;

    // Bonus: 3 puntos al ganador de la Pista 1 (1+4 vs 2+3), 1 punto a los demas ganadores
    const courtBonus = match.courtNumber === 1 ? TOP_COURT_FINAL_BONUS : OTHER_COURT_FINAL_BONUS;

    const applySide = (ids: string[], myGames: number, oppGames: number, won: boolean) => {
      ids.forEach(pId => {
        const st = standingsMap.get(pId);
        if (!st) return;
        st.matchesPlayed += 1;
        st.gamesWon += myGames;
        st.gamesLost += oppGames;
        st.gameDiff = st.gamesWon - st.gamesLost;
        st.finalGamesWon += myGames;
        if (won) {
          st.matchesWon += 1;
          st.finalBonus = courtBonus;
        } else if (myGames < oppGames) {
          st.matchesLost += 1;
          st.finalBonus = 0;
        }
        st.totalDailyScore = roundDecimal(st.prelimTotalScore + st.finalGamesWon + st.finalBonus);
      });
    };

    applySide([teamA.player1Id, teamA.player2Id], gA, gB, wonA);
    applySide([teamB.player1Id, teamB.player2Id], gB, gA, wonB);
  });

  const finalStandings = Array.from(standingsMap.values());

  // Ranking final del dia: todos los puntos del dia + decimal de llegada
  finalStandings.sort((a, b) => {
    if (b.totalDailyScore !== a.totalDailyScore) {
      return b.totalDailyScore - a.totalDailyScore;
    }
    if (b.basePoints !== a.basePoints) {
      return b.basePoints - a.basePoints;
    }
    if (b.gameDiff !== a.gameDiff) {
      return b.gameDiff - a.gameDiff;
    }
    return a.arrivalPosition - b.arrivalPosition;
  });

  finalStandings.forEach((s, idx) => {
    s.finalDailyRank = idx + 1;
  });

  return finalStandings;
}

/**
 * Aggregates all completed days and builds deep "Padel Intelligence" stats for every player
 */
export function buildChampionshipIntelligence(
  players: Player[],
  days: TournamentDay[],
  config: TournamentConfig
): PlayerIntelligenceStats[] {
  const completedDays = days.filter(d => d.status === 'completed' || d.rounds.some(r => r.matches.some(m => m.score.completed)));

  // Calculate global averages across all played matches for Bayesian weighting
  let globalTotalPoints = 0;
  let globalTotalMatches = 0;

  completedDays.forEach(day => {
    day.rounds.forEach(round => {
      round.matches.filter(m => m.score.completed).forEach(m => {
        globalTotalPoints += (m.score.scoreA + m.score.scoreB);
        globalTotalMatches += 2; // two sides
      });
    });
  });

  const globalAvgPointsPerMatch = globalTotalMatches > 0 ? (globalTotalPoints / globalTotalMatches) : 4.0;
  const K = config.bayesianFactorK || 4; // Bayesian damping parameter
  const attendanceBonus = config.attendanceBonusPoints || 0.5;

  const activePlayerIds = new Set(players.map(p => p.id));

  const playerStatsList: PlayerIntelligenceStats[] = players.map(player => {
    let daysAttended = 0;
    let totalMatchesPlayed = 0;
    let totalMatchesWon = 0;
    let totalMatchesLost = 0;
    let totalGamesWon = 0;
    let totalGamesLost = 0;
    let totalBasePoints = 0;
    let totalDecimalBonus = 0;
    let totalChampionshipPoints = 0;

    const partnerMap = new Map<string, {
      name: string;
      played: number;
      won: number;
      lost: number;
      gamesWon: number;
      gamesLost: number;
    }>();

    const opponentMap = new Map<string, {
      name: string;
      played: number;
      won: number;
      lost: number;
      gamesWon: number;
      gamesLost: number;
    }>();

    const duoMap = new Map<string, {
      partnerId: string;
      partnerName: string;
      opp1Id: string;
      opp1Name: string;
      opp2Id: string;
      opp2Name: string;
      wins: number;
      losses: number;
    }>();

    const rivalPairMap = new Map<string, {
      pairKey: string;
      p1Id: string;
      p1Name: string;
      p2Id: string;
      p2Name: string;
      matches: number;
      wins: number;
      losses: number;
    }>();

    const matchHistory: PlayerIntelligenceStats['matchHistory'] = [];

    completedDays.forEach(day => {
      const isPresent = day.checkedInPlayerIds.includes(player.id);
      if (isPresent) daysAttended += 1;

      day.rounds.forEach(round => {
        round.matches.filter(m => m.score.completed).forEach(match => {
          const isTeamA = match.teamA.player1Id === player.id || match.teamA.player2Id === player.id;
          const isTeamB = match.teamB.player1Id === player.id || match.teamB.player2Id === player.id;

          if (!isTeamA && !isTeamB) return; // Player was not in this match

          const myTeam = isTeamA ? match.teamA : match.teamB;
          const oppTeam = isTeamA ? match.teamB : match.teamA;
          const partnerId = myTeam.player1Id === player.id ? myTeam.player2Id : myTeam.player1Id;
          const partnerName = myTeam.player1Id === player.id ? myTeam.player2Name : myTeam.player1Name;

          // STRICT CHECK: Discard match if partner or opponents are ghost / deleted players
          if (partnerId && !activePlayerIds.has(partnerId)) return;
          if (oppTeam.player1Id && !activePlayerIds.has(oppTeam.player1Id)) return;
          if (oppTeam.player2Id && !activePlayerIds.has(oppTeam.player2Id)) return;

          totalMatchesPlayed += 1;
          const myScore = isTeamA ? match.score.scoreA : match.score.scoreB;
          const oppScore = isTeamA ? match.score.scoreB : match.score.scoreA;

          totalGamesWon += myScore;
          totalGamesLost += oppScore;
          totalBasePoints += myScore;

          const won = myScore > oppScore;
          const draw = myScore === oppScore;
          if (won) totalMatchesWon += 1;
          else if (!draw) totalMatchesLost += 1;

          // Sin decimales por margen: el unico decimal es el de llegada (a nivel dia)

          // Partner Synergy tracking (active players only)
          if (partnerId && activePlayerIds.has(partnerId)) {
            const pStat = partnerMap.get(partnerId) || {
              name: partnerName,
              played: 0,
              won: 0,
              lost: 0,
              gamesWon: 0,
              gamesLost: 0,
            };
            pStat.played += 1;
            pStat.gamesWon += myScore;
            pStat.gamesLost += oppScore;
            if (won) pStat.won += 1;
            else if (!draw) pStat.lost += 1;
            partnerMap.set(partnerId, pStat);
          }

          // Opponent tracking (both individual active opponents)
          [
            { id: oppTeam.player1Id, name: oppTeam.player1Name },
            { id: oppTeam.player2Id, name: oppTeam.player2Name }
          ].forEach(opp => {
            if (!opp.id || !activePlayerIds.has(opp.id)) return;
            const oStat = opponentMap.get(opp.id) || {
              name: opp.name,
              played: 0,
              won: 0,
              lost: 0,
              gamesWon: 0,
              gamesLost: 0,
            };
            oStat.played += 1;
            oStat.gamesWon += myScore;
            oStat.gamesLost += oppScore;
            if (won) oStat.won += 1;
            else if (!draw) oStat.lost += 1;
            opponentMap.set(opp.id, oStat);
          });

          // Rival Pair tracking (regardless of my partner)
          const [rp1, rp2] = [
            { id: oppTeam.player1Id, name: oppTeam.player1Name },
            { id: oppTeam.player2Id, name: oppTeam.player2Name }
          ].sort((a, b) => a.id.localeCompare(b.id));

          if (rp1.id && rp2.id && activePlayerIds.has(rp1.id) && activePlayerIds.has(rp2.id)) {
            const pairKey = `${rp1.id}&${rp2.id}`;
            const rStat = rivalPairMap.get(pairKey) || {
              pairKey,
              p1Id: rp1.id,
              p1Name: rp1.name,
              p2Id: rp2.id,
              p2Name: rp2.name,
              matches: 0,
              wins: 0,
              losses: 0,
            };
            rStat.matches += 1;
            if (won) rStat.wins += 1;
            else if (!draw) rStat.losses += 1;
            rivalPairMap.set(pairKey, rStat);
          }

          // Duo vs Duo key
          if (partnerId && activePlayerIds.has(partnerId) && activePlayerIds.has(oppTeam.player1Id) && activePlayerIds.has(oppTeam.player2Id)) {
            const oppKey = [oppTeam.player1Id, oppTeam.player2Id].sort().join('&');
            const duoKey = `${partnerId}_vs_${oppKey}`;
            const dStat = duoMap.get(duoKey) || {
              partnerId,
              partnerName,
              opp1Id: oppTeam.player1Id,
              opp1Name: oppTeam.player1Name,
              opp2Id: oppTeam.player2Id,
              opp2Name: oppTeam.player2Name,
              wins: 0,
              losses: 0,
            };
            if (won) dStat.wins += 1;
            else if (!draw) dStat.losses += 1;
            duoMap.set(duoKey, dStat);
          }

          // Add to player's match history log
          matchHistory.push({
            matchId: match.id,
            dayId: day.id,
            dayName: day.name,
            date: day.date,
            roundNumber: round.roundNumber,
            partnerName,
            opponentNames: [oppTeam.player1Name, oppTeam.player2Name],
            result: won ? 'W' : (draw ? 'D' : 'L'),
            scoreText: `${myScore} - ${oppScore}${match.score.isCutoff ? ' (Corte)' : ''}`,
            pointsEarned: myScore,
            decimalEarned: 0,
          });
        });
      });

      // Decimal de llegada + bonus de la final del dia
      const dayFinalStanding = day.finalStandings?.find(s => s.playerId === player.id) || day.prelimStandings?.find(s => s.playerId === player.id);
      if (dayFinalStanding) {
        const legacy: any = dayFinalStanding;
        if (typeof dayFinalStanding.arrivalBonus === 'number') {
          totalDecimalBonus += dayFinalStanding.arrivalBonus;
          totalDecimalBonus += dayFinalStanding.finalBonus || 0;
        } else {
          // Compatibilidad con jornadas jugadas bajo el sistema anterior
          totalDecimalBonus += (legacy.marginBonus || 0);
          totalDecimalBonus += (legacy.roundRecordBonus || 0);
          totalDecimalBonus += (legacy.finalMatchBonus || 0);
          totalDecimalBonus += (legacy.cleanSweepBonus || 0);
        }
      }
    });

    totalDecimalBonus = roundDecimal(totalDecimalBonus);
    totalChampionshipPoints = roundDecimal(totalBasePoints + totalDecimalBonus);

    const winRatePercentage = totalMatchesPlayed > 0
      ? Math.round((totalMatchesWon / totalMatchesPlayed) * 1000) / 10
      : 0;

    const avgPointsPerMatch = totalMatchesPlayed > 0
      ? roundDecimal(totalBasePoints / totalMatchesPlayed)
      : 0;

    const avgPointsPerDay = daysAttended > 0
      ? roundDecimal(totalChampionshipPoints / daysAttended)
      : 0;

    // Bayesian Rating Formula:
    // Rating = (TotalBasePoints + K * GlobalAvg) / (MatchesPlayed + K) + (DaysAttended * AttendanceBonus) + Decimals
    const bayesianRating = roundDecimal(
      ((totalBasePoints + K * globalAvgPointsPerMatch) / (totalMatchesPlayed + K)) +
      (daysAttended * attendanceBonus) +
      totalDecimalBonus
    );

    // Format Partners list
    const partners: PartnerSynergy[] = Array.from(partnerMap.entries()).map(([pId, st]) => ({
      partnerId: pId,
      partnerName: st.name,
      matchesTogether: st.played,
      winsTogether: st.won,
      lossesTogether: st.lost,
      winRate: st.played > 0 ? Math.round((st.won / st.played) * 100) : 0,
      gamesWonTogether: st.gamesWon,
      gamesLostTogether: st.gamesLost,
    })).sort((a, b) => {
      if (b.winsTogether !== a.winsTogether) return b.winsTogether - a.winsTogether;
      return b.winRate - a.winRate;
    });

    // 1. Tinder Match: Pareja con la que más partidos ha ganado
    const bestPartner = partners.filter(p => p.winsTogether > 0)[0];

    // 2. Tu Bolsa de Piedras: Pareja con la que más partidos ha perdido
    const worstPartner = [...partners].filter(p => p.lossesTogether > 0).sort((a, b) => {
      if (b.lossesTogether !== a.lossesTogether) return b.lossesTogether - a.lossesTogether;
      return a.winRate - b.winRate;
    })[0];

    // Format Opponents list
    const opponents: OpponentRivalry[] = Array.from(opponentMap.entries()).map(([oId, st]) => ({
      opponentId: oId,
      opponentName: st.name,
      matchesAgainst: st.played,
      winsAgainst: st.won,
      lossesAgainst: st.lost,
      winRateAgainst: st.played > 0 ? Math.round((st.won / st.played) * 100) : 0,
      gamesWonAgainst: st.gamesWon,
      gamesLostAgainst: st.gamesLost,
    })).sort((a, b) => {
      if (b.lossesAgainst !== a.lossesAgainst) return b.lossesAgainst - a.lossesAgainst;
      return a.winRateAgainst - b.winRateAgainst;
    });

    // 3. Tu Padre: Jugador contra el que más has perdido como rival
    const nemesisOpponent = opponents.filter(o => o.lossesAgainst > 0)[0];

    // 5. Tu Hijo: Jugador contra el que más has ganado como rival
    const favoriteOpponent = [...opponents].filter(o => o.winsAgainst > 0).sort((a, b) => {
      if (b.winsAgainst !== a.winsAgainst) return b.winsAgainst - a.winsAgainst;
      return b.winRateAgainst - a.winRateAgainst;
    })[0];

    // Format Rival Pairs list
    const rivalPairs: RivalPairStat[] = Array.from(rivalPairMap.values()).map(r => ({
      pairKey: r.pairKey,
      player1Id: r.p1Id,
      player1Name: r.p1Name,
      player2Id: r.p2Id,
      player2Name: r.p2Name,
      matchesAgainst: r.matches,
      winsAgainst: r.wins,
      lossesAgainst: r.losses,
      winRateAgainst: r.matches > 0 ? Math.round((r.wins / r.matches) * 100) : 0,
    }));

    // 4. Papi y Mami: Pareja contra la que más has perdido como rivales
    const worstRivalPair = rivalPairs.filter(r => r.lossesAgainst > 0).sort((a, b) => {
      if (b.lossesAgainst !== a.lossesAgainst) return b.lossesAgainst - a.lossesAgainst;
      return a.winRateAgainst - b.winRateAgainst;
    })[0];

    // 6. Tus Clientes: Pareja contra la que más has ganado como rivales
    const bestRivalPair = rivalPairs.filter(r => r.winsAgainst > 0).sort((a, b) => {
      if (b.winsAgainst !== a.winsAgainst) return b.winsAgainst - a.winsAgainst;
      return b.winRateAgainst - a.winRateAgainst;
    })[0];

    const duoMatchups: DuoMatchup[] = Array.from(duoMap.values()).map(d => ({
      partnerId: d.partnerId,
      partnerName: d.partnerName,
      opponent1Id: d.opp1Id,
      opponent1Name: d.opp1Name,
      opponent2Id: d.opp2Id,
      opponent2Name: d.opp2Name,
      matches: d.wins + d.losses,
      wins: d.wins,
      losses: d.losses,
    }));

    return {
      playerId: player.id,
      playerName: player.name,
      nickname: player.nickname,
      avatar: player.avatar,
      daysAttended,
      totalMatchesPlayed,
      totalMatchesWon,
      totalMatchesLost,
      winRatePercentage,
      totalGamesWon,
      totalGamesLost,
      gameDifference: totalGamesWon - totalGamesLost,
      totalBasePoints,
      totalDecimalBonus,
      totalChampionshipPoints,
      bayesianRating,
      avgPointsPerMatch,
      avgPointsPerDay,
      currentRank: 0,
      partners,
      bestPartner,
      worstPartner,
      opponents,
      favoriteOpponent,
      nemesisOpponent,
      worstRivalPair,
      bestRivalPair,
      duoMatchups,
      matchHistory,
    };
  });

  // Sort overall standings based on chosen system
  playerStatsList.sort((a, b) => {
    if (config.rankingSystem === 'bayesian') {
      return b.bayesianRating - a.bayesianRating;
    } else if (config.rankingSystem === 'avg_points') {
      if (b.avgPointsPerMatch !== a.avgPointsPerMatch) {
        return b.avgPointsPerMatch - a.avgPointsPerMatch;
      }
      return b.totalChampionshipPoints - a.totalChampionshipPoints;
    } else {
      // Default: total championship points + decimals
      if (b.totalChampionshipPoints !== a.totalChampionshipPoints) {
        return b.totalChampionshipPoints - a.totalChampionshipPoints;
      }
      return b.gameDifference - a.gameDifference;
    }
  });

  // Assign ranks
  playerStatsList.forEach((stat, idx) => {
    stat.currentRank = idx + 1;
  });

  return playerStatsList;
}

/**
 * Predicts the win probability for Team A vs Team B using Padel Intelligence Ratings and Synergies
 */
export function predictMatchWinProbability(
  teamAPlayerIds: [string, string],
  teamBPlayerIds: [string, string],
  statsList: PlayerIntelligenceStats[]
): {
  probTeamA: number;
  probTeamB: number;
  strengthA: number;
  strengthB: number;
  insight: string;
} {
  const getPlayerRating = (id: string) => {
    const s = statsList.find(item => item.playerId === id);
    return s ? (s.bayesianRating || 4.0) : 4.0;
  };

  const getPlayer = (id: string) => statsList.find(item => item.playerId === id);

  const rA1 = getPlayerRating(teamAPlayerIds[0]);
  const rA2 = getPlayerRating(teamAPlayerIds[1]);
  const rB1 = getPlayerRating(teamBPlayerIds[0]);
  const rB2 = getPlayerRating(teamBPlayerIds[1]);

  let strengthA = (rA1 + rA2) / 2;
  let strengthB = (rB1 + rB2) / 2;

  // Synergy adjustments
  const pA1 = getPlayer(teamAPlayerIds[0]);
  const pB1 = getPlayer(teamBPlayerIds[0]);

  if (pA1) {
    const synergyA = pA1.partners.find(p => p.partnerId === teamAPlayerIds[1]);
    if (synergyA && synergyA.matchesTogether >= 2) {
      const synergyBonus = (synergyA.winRate - 50) / 100 * 0.4;
      strengthA += synergyBonus;
    }
  }

  if (pB1) {
    const synergyB = pB1.partners.find(p => p.partnerId === teamBPlayerIds[1]);
    if (synergyB && synergyB.matchesTogether >= 2) {
      const synergyBonus = (synergyB.winRate - 50) / 100 * 0.4;
      strengthB += synergyBonus;
    }
  }

  // Logistic win probability function
  const diff = strengthA - strengthB;
  const probTeamA = Math.round((1 / (1 + Math.exp(-diff * 0.8))) * 100);
  const probTeamB = 100 - probTeamA;

  let insight = 'Duelo sumamente equilibrado.';
  if (probTeamA >= 65) {
    insight = 'Pareja A parte como favorita según ratings y rendimiento previo.';
  } else if (probTeamB >= 65) {
    insight = 'Pareja B parte con ventaja estadística en este cruce.';
  } else if (Math.abs(probTeamA - 50) <= 5) {
    insight = 'Partido de pronóstico reservado, alta probabilidad de tie-break.';
  }

  return {
    probTeamA,
    probTeamB,
    strengthA: Math.round(strengthA * 100) / 100,
    strengthB: Math.round(strengthB * 100) / 100,
    insight,
  };
}
