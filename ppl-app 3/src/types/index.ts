// src/types/index.ts

export type Group = 'A' | 'B';

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl?: string;
  group: Group;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  createdAt: string;
}

export interface Player {
  id: string;
  teamId: string;
  teamName: string;
  name: string;
  number: string;
  position: string;
  avatarUrl?: string;
  // Career averages (auto-computed)
  gamesPlayed: number;
  totalPoints: number;
  totalRebounds: number;
  totalAssists: number;
  totalSteals: number;
  totalBlocks: number;
  totalFouls: number;
  totalTurnovers: number;
  totalFgm: number;
  totalFga: number;
  total3pm: number;
  total3pa: number;
  totalFtm: number;
  totalFta: number;
}

export interface PlayerAverages {
  playerId: string;
  playerName: string;
  teamName: string;
  gamesPlayed: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  tpg: number;
  fpg: number;
  fgPct: number;
  threePct: number;
  ftPct: number;
}

export interface Game {
  id: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  group: Group;
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  homeScore?: number;
  awayScore?: number;
  boxScoreUrl?: string;
  boxScoreStatus?: 'pending' | 'processing' | 'processed' | 'failed';
  uploadedBy?: string;
  uploadedAt?: string;
  week: number;
}

export interface BoxScorePlayerStat {
  playerName: string;
  number: string;
  position: string;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  fouls: number;
  turnovers: number;
  fgm: number;
  fga: number;
  fgPct?: number;
  threePm: number;
  threePa: number;
  threePct?: number;
  ftm: number;
  fta: number;
  ftPct?: number;
  plusMinus?: number;
}

export interface BoxScore {
  id: string;
  gameId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  homePlayerStats: BoxScorePlayerStat[];
  awayPlayerStats: BoxScorePlayerStat[];
  processedAt: string;
  rawExtraction?: string;
}

export interface StandingsEntry {
  teamId: string;
  teamName: string;
  abbreviation: string;
  group: Group;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
}

export interface LeagueLeader {
  rank: number;
  playerId: string;
  playerName: string;
  teamName: string;
  value: number;
  gamesPlayed: number;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'team';
  teamId?: string;
  teamName?: string;
}
