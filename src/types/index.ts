export type MatchType = 'preliminary' | 'daily_final' | 'grand_final';
export type FinalCategory = 'gold' | 'silver' | 'bronze' | 'copper' | 'wood' | 'qf' | 'sf' | 'final_1st' | 'final_3rd' | 'final_5th' | 'final_7th' | 'final_9th' | 'final_11th' | 'final_13th' | 'final_15th';

export type UserRole = 'player' | 'admin' | 'superadmin';

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  registeredAt: string;
  isActive: boolean;
  role?: 'player' | 'admin'; // Tournament admin permission
  pin?: string; // Optional player pin
  notes?: string;
}

export interface Team {
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
}

export interface MatchScore {
  scoreA: number; // games won by Team A (0 to 7)
  scoreB: number; // games won by Team B (0 to 7)
  tieBreakPointsA?: number; // if 3-3 tie-break
  tieBreakPointsB?: number;
  isCutoff?: boolean; // true if stopped early e.g. 3-1 for time/injury
  completed: boolean;
  winner?: 'teamA' | 'teamB' | 'draw';
}

export interface Match {
  id: string;
  dayId: string;
  roundNumber: number; // 1, 2, 3 for prelims, 4 for daily final, or 100+ for grand final
  courtNumber: number; // 1 to 5
  courtName?: string;
  matchType: MatchType;
  finalCategory?: FinalCategory;
  teamA: Team;
  teamB: Team;
  score: MatchScore;
  createdAt: string;
  completedAt?: string;
}

export interface DailyRound {
  roundNumber: number;
  name: string;
  matches: Match[];
  isCompleted: boolean;
}

export interface DailyPlayerStanding {
  playerId: string;
  playerName: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  gamesWon: number;
  gamesLost: number;
  gameDiff: number;
  
  // Base points (sum of games won in 3 prelims, e.g. 7+6+5 = 18)
  basePoints: number;
  
  // Margin Bonus decimals from games (+0.004, -0.004, +0.003, etc.)
  marginBonus: number;
  
  // Round Record Bonus decimals (+0.003 for 3 wins, +0.002 for 2 wins, etc.)
  roundRecordBonus: number;
  
  // Daily Final Match Bonus (+0.001 for winning final game 4)
  finalMatchBonus: number;
  
  // Clean Sweep Bonus (+0.001 for winning all 4 matches of the day)
  cleanSweepBonus: number;
  
  // Total score with all decimals (for exact sorting and historical accumulation)
  prelimTotalScore: number;
  totalDailyScore: number;
  
  prelimRank: number; // 1 to 20 after round 3
  finalDailyRank?: number; // 1 to 20 after round 4
}

export interface TournamentDay {
  id: string;
  date: string;
  name: string; // e.g. "Fecha G20 #1"
  status: 'draft' | 'checkin' | 'preliminaries' | 'finals' | 'completed';
  checkedInPlayerIds: string[];
  rounds: DailyRound[]; // Round 1, 2, 3 (prelims) & Round 4 (finals)
  prelimStandings: DailyPlayerStanding[];
  finalStandings: DailyPlayerStanding[];
  createdAt: string;
  completedAt?: string;
}

export interface PartnerSynergy {
  partnerId: string;
  partnerName: string;
  matchesTogether: number;
  winsTogether: number;
  lossesTogether: number;
  winRate: number; // percentage 0-100
  gamesWonTogether: number;
  gamesLostTogether: number;
}

export interface OpponentRivalry {
  opponentId: string;
  opponentName: string;
  matchesAgainst: number;
  winsAgainst: number;
  lossesAgainst: number;
  winRateAgainst: number; // percentage 0-100
  gamesWonAgainst: number;
  gamesLostAgainst: number;
}

export interface DuoMatchup {
  partnerId: string;
  partnerName: string;
  opponent1Id: string;
  opponent1Name: string;
  opponent2Id: string;
  opponent2Name: string;
  matches: number;
  wins: number;
  losses: number;
}

export interface PlayerIntelligenceStats {
  playerId: string;
  playerName: string;
  nickname?: string;
  avatar?: string;
  
  // Participation
  daysAttended: number;
  totalMatchesPlayed: number;
  totalMatchesWon: number;
  totalMatchesLost: number;
  winRatePercentage: number;
  
  // Games
  totalGamesWon: number;
  totalGamesLost: number;
  gameDifference: number;
  
  // Scoring
  totalBasePoints: number;
  totalDecimalBonus: number;
  totalChampionshipPoints: number;
  
  // Advanced Ratings
  bayesianRating: number; // Weighted rating factoring in volume and global avg
  avgPointsPerMatch: number;
  avgPointsPerDay: number;
  
  // Rankings
  currentRank: number;
  previousRank?: number;
  rankChange?: number;
  
  // Synergies & Analytics
  partners: PartnerSynergy[];
  bestPartner?: PartnerSynergy;
  worstPartner?: PartnerSynergy;
  
  opponents: OpponentRivalry[];
  favoriteOpponent?: OpponentRivalry; // highest win rate
  nemesisOpponent?: OpponentRivalry;  // most losses / lowest win rate
  
  duoMatchups: DuoMatchup[];
  
  // Match history log for this player
  matchHistory: {
    matchId: string;
    dayId: string;
    dayName: string;
    date: string;
    roundNumber: number;
    partnerName: string;
    opponentNames: string[];
    result: 'W' | 'L' | 'D';
    scoreText: string;
    pointsEarned: number;
    decimalEarned: number;
  }[];
}

export interface TournamentConfig {
  tournamentName: string;
  editionNumber: number; // e.g. 3 for "3er Torneo"
  editionName: string; // e.g. "3er Torneo G20 by Peter Inc."
  tournamentLogoUrl?: string; // Base64 dataURL or image URL
  courtNames: string[];
  adminPin: string; // Tournament Admin PIN
  superAdminPin: string; // Super Admin PIN (Developer & Cloud keys)
  rankingSystem: 'bayesian' | 'total_points' | 'avg_points';
  bayesianFactorK: number; // Default 4
  attendanceBonusPoints: number; // Default 0.5
  tieBreakMaxPoints: number; // Default 10
}

export interface GrandFinaleSeed {
  seed: number; // 1 to 20 based on overall championship ranking
  playerId: string;
  playerName: string;
  championshipPoints: number;
  rating: number;
}

export interface GrandFinaleBracket {
  id: string;
  name: string;
  status: 'draft' | 'in_progress' | 'completed';
  seeds: GrandFinaleSeed[];
  rounds: DailyRound[];
  podium: {
    firstPlace?: { player1: string; player2: string };
    secondPlace?: { player1: string; player2: string };
    thirdPlace?: { player1: string; player2: string };
    fourthPlace?: { player1: string; player2: string };
  };
}
