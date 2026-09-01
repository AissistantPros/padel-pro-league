import type {
  Player,
  TournamentDay,
  DailyPlayerStanding,
  PlayerIntelligenceStats,
  PartnerSynergy,
  OpponentRivalry,
  DuoMatchup,
  Match,
  TournamentConfig
} from '../types/index.ts';
import {
  calculateMarginBonus,
  calculateRoundRecordBonus,
  calculateFinalBonuses,
  roundDecimal
} from './tieBreakerEngine.ts';

/**
 * Calculates preliminary standings for a matchday after the 3 short games
 */
export function calculateDailyPrelimStandings(
  players: Player[],
  preliminaryMatches: Match[]
): DailyPlayerStanding[] {
  // Map of playerId -> stats
  const statsMap = new Map<string, {
    playerName: string;
    matchesPlayed: number;
    matchesWon: number;
    matchesLost: number;
    gamesWon: number;
    gamesLost: number;
    basePoints: number;
    marginBonus: number;
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
      basePoints: 0,
      marginBonus: 0,
    });
  });

  // Process completed matches in rounds 1, 2, 3
  preliminaryMatches.filter(m => m.score.completed).forEach(match => {
    const { teamA, teamB, score } = match;
    const gA = score.scoreA;
    const gB = score.scoreB;
    const isCutoff = score.isCutoff || false;

    // Team A players
    [teamA.player1Id, teamA.player2Id].forEach(pId => {
      const stat = statsMap.get(pId);
      if (stat) {
        stat.matchesPlayed += 1;
        stat.gamesWon += gA;
        stat.gamesLost += gB;
        stat.basePoints += gA;
        if (gA > gB) stat.matchesWon += 1;
        else if (gA < gB) stat.matchesLost += 1;
        stat.marginBonus += calculateMarginBonus(gA, gB, isCutoff);
      }
    });

    // Team B players
    [teamB.player1Id, teamB.player2Id].forEach(pId => {
      const stat = statsMap.get(pId);
      if (stat) {
        stat.matchesPlayed += 1;
        stat.gamesWon += gB;
        stat.gamesLost += gA;
        stat.basePoints += gB;
        if (gB > gA) stat.matchesWon += 1;
        else if (gB < gA) stat.matchesLost += 1;
        stat.marginBonus += calculateMarginBonus(gB, gA, isCutoff);
      }
    });
  });

  // Convert to DailyPlayerStanding array and add record bonus
  const standings: DailyPlayerStanding[] = Array.from(statsMap.entries()).map(([playerId, stat]) => {
    const marginBonus = roundDecimal(stat.marginBonus);
    const roundRecordBonus = calculateRoundRecordBonus(stat.matchesWon, stat.matchesPlayed);
    const prelimTotalScore = roundDecimal(stat.basePoints + marginBonus + roundRecordBonus);

    return {
      playerId,
      playerName: stat.playerName,
      matchesPlayed: stat.matchesPlayed,
      matchesWon: stat.matchesWon,
      matchesLost: stat.matchesLost,
      gamesWon: stat.gamesWon,
      gamesLost: stat.gamesLost,
      gameDiff: stat.gamesWon - stat.gamesLost,
      basePoints: stat.basePoints,
      marginBonus,
      roundRecordBonus,
      finalMatchBonus: 0,
      cleanSweepBonus: 0,
      prelimTotalScore,
      totalDailyScore: prelimTotalScore,
      prelimRank: 0,
    };
  });

  // Sort by prelimTotalScore descending, then by games won, then by game diff
  standings.sort((a, b) => {
    if (b.prelimTotalScore !== a.prelimTotalScore) {
      return b.prelimTotalScore - a.prelimTotalScore;
    }
    if (b.gamesWon !== a.gamesWon) {
      return b.gamesWon - a.gamesWon;
    }
    return b.gameDiff - a.gameDiff;
  });

  // Assign prelimRank (1 to N)
  standings.forEach((s, idx) => {
    s.prelimRank = idx + 1;
  });

  return standings;
}

/**
 * Calculates final day standings after Round 4 (Daily Finals) is completed
 */
export function calculateDailyFinalStandings(
  prelimStandings: DailyPlayerStanding[],
  finalMatches: Match[]
): DailyPlayerStanding[] {
  const standingsMap = new Map<string, DailyPlayerStanding>(
    prelimStandings.map(s => [s.playerId, { ...s }])
  );

  finalMatches.filter(m => m.score.completed).forEach(match => {
    const { teamA, teamB, score } = match;
    const wonA = score.scoreA > score.scoreB;
    const wonB = score.scoreB > score.scoreA;

    // Team A
    [teamA.player1Id, teamA.player2Id].forEach(pId => {
      const st = standingsMap.get(pId);
      if (st) {
        st.matchesPlayed += 1;
        st.gamesWon += score.scoreA;
        st.gamesLost += score.scoreB;
        st.gameDiff = st.gamesWon - st.gamesLost;
        if (wonA) {
          st.matchesWon += 1;
        } else {
          st.matchesLost += 1;
        }
        const { finalMatchBonus, cleanSweepBonus } = calculateFinalBonuses(
          wonA,
          st.matchesWon,
          st.matchesPlayed
        );
        st.finalMatchBonus = finalMatchBonus;
        st.cleanSweepBonus = cleanSweepBonus;
        st.totalDailyScore = roundDecimal(st.prelimTotalScore + finalMatchBonus + cleanSweepBonus);
      }
    });

    // Team B
    [teamB.player1Id, teamB.player2Id].forEach(pId => {
      const st = standingsMap.get(pId);
      if (st) {
        st.matchesPlayed += 1;
        st.gamesWon += score.scoreB;
        st.gamesLost += score.scoreA;
        st.gameDiff = st.gamesWon - st.gamesLost;
        if (wonB) {
          st.matchesWon += 1;
        } else {
          st.matchesLost += 1;
        }
        const { finalMatchBonus, cleanSweepBonus } = calculateFinalBonuses(
          wonB,
          st.matchesWon,
          st.matchesPlayed
        );
        st.finalMatchBonus = finalMatchBonus;
        st.cleanSweepBonus = cleanSweepBonus;
        st.totalDailyScore = roundDecimal(st.prelimTotalScore + finalMatchBonus + cleanSweepBonus);
      }
    });
  });

  const finalStandings = Array.from(standingsMap.values());
  
  // Sort final standings
  finalStandings.sort((a, b) => {
    if (b.totalDailyScore !== a.totalDailyScore) {
      return b.totalDailyScore - a.totalDailyScore;
    }
    return b.gameDiff - a.gameDiff;
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

    const matchHistory: PlayerIntelligenceStats['matchHistory'] = [];

    completedDays.forEach(day => {
      const isPresent = day.checkedInPlayerIds.includes(player.id);
      if (isPresent) daysAttended += 1;

      day.rounds.forEach(round => {
        round.matches.filter(m => m.score.completed).forEach(match => {
          const isTeamA = match.teamA.player1Id === player.id || match.teamA.player2Id === player.id;
          const isTeamB = match.teamB.player1Id === player.id || match.teamB.player2Id === player.id;

          if (!isTeamA && !isTeamB) return; // Player was not in this match

          totalMatchesPlayed += 1;
          const myTeam = isTeamA ? match.teamA : match.teamB;
          const oppTeam = isTeamA ? match.teamB : match.teamA;
          const myScore = isTeamA ? match.score.scoreA : match.score.scoreB;
          const oppScore = isTeamA ? match.score.scoreB : match.score.scoreA;

          totalGamesWon += myScore;
          totalGamesLost += oppScore;
          totalBasePoints += myScore;

          const won = myScore > oppScore;
          const draw = myScore === oppScore;
          if (won) totalMatchesWon += 1;
          else if (!draw) totalMatchesLost += 1;

          // Margin bonus
          const margin = calculateMarginBonus(myScore, oppScore, match.score.isCutoff);
          totalDecimalBonus += margin;

          // Partner Synergy tracking
          const partnerId = myTeam.player1Id === player.id ? myTeam.player2Id : myTeam.player1Id;
          const partnerName = myTeam.player1Id === player.id ? myTeam.player2Name : myTeam.player1Name;

          if (partnerId) {
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

          // Opponent tracking (both opponents)
          [
            { id: oppTeam.player1Id, name: oppTeam.player1Name },
            { id: oppTeam.player2Id, name: oppTeam.player2Name }
          ].forEach(opp => {
            if (!opp.id) return;
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

          // Duo vs Duo key
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
            decimalEarned: roundDecimal(margin),
          });
        });
      });

      // Add daily record bonuses and final bonuses from completed day standings
      const dayFinalStanding = day.finalStandings?.find(s => s.playerId === player.id) || day.prelimStandings?.find(s => s.playerId === player.id);
      if (dayFinalStanding) {
        totalDecimalBonus += (dayFinalStanding.roundRecordBonus || 0);
        totalDecimalBonus += (dayFinalStanding.finalMatchBonus || 0);
        totalDecimalBonus += (dayFinalStanding.cleanSweepBonus || 0);
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
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.matchesTogether - a.matchesTogether;
    });

    const bestPartner = partners.length > 0 ? partners[0] : undefined;
    const worstPartner = partners.length > 0 ? [...partners].reverse().find(p => p.matchesTogether >= 1) : undefined;

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
      if (b.matchesAgainst !== a.matchesAgainst) return b.matchesAgainst - a.matchesAgainst;
      return a.winRateAgainst - b.winRateAgainst;
    });

    const nemesisOpponent = opponents.length > 0
      ? [...opponents].sort((a, b) => b.lossesAgainst - a.lossesAgainst || a.winRateAgainst - b.winRateAgainst)[0]
      : undefined;

    const favoriteOpponent = opponents.length > 0
      ? [...opponents].sort((a, b) => b.winsAgainst - a.winsAgainst || b.winRateAgainst - a.winRateAgainst)[0]
      : undefined;

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
