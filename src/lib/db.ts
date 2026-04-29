// src/lib/db.ts
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, writeBatch, serverTimestamp,
  DocumentData, QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import { Team, Player, Game, StandingsEntry, LeagueLeader } from '@/types';
import { calcWinPct } from './utils';

// ─── Teams ───────────────────────────────────────────────────────────────────

export async function getTeams(): Promise<Team[]> {
  const snap = await getDocs(collection(db, 'teams'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Team);
}

export async function getTeam(id: string): Promise<Team | null> {
  const snap = await getDoc(doc(db, 'teams', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Team;
}

// ─── Players ─────────────────────────────────────────────────────────────────

export async function getPlayers(teamId?: string): Promise<Player[]> {
  const constraints: QueryConstraint[] = teamId
    ? [where('teamId', '==', teamId)]
    : [];
  const snap = await getDocs(query(collection(db, 'players'), ...constraints));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Player);
}

export async function getPlayer(id: string): Promise<Player | null> {
  const snap = await getDoc(doc(db, 'players', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Player;
}

// ─── Games ───────────────────────────────────────────────────────────────────

export async function getGames(filters?: { group?: string; teamId?: string; status?: string }): Promise<Game[]> {
  const constraints: QueryConstraint[] = [orderBy('scheduledDate', 'asc')];
  if (filters?.status) constraints.push(where('status', '==', filters.status));
  const snap = await getDocs(query(collection(db, 'games'), ...constraints));
  let games = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Game);
  if (filters?.group) games = games.filter(g => g.group === filters.group);
  if (filters?.teamId) {
    games = games.filter(g => g.homeTeamId === filters.teamId || g.awayTeamId === filters.teamId);
  }
  return games;
}

export async function getGame(id: string): Promise<Game | null> {
  const snap = await getDoc(doc(db, 'games', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Game;
}

// ─── Standings ────────────────────────────────────────────────────────────────

export async function getStandings(group?: 'A' | 'B'): Promise<StandingsEntry[]> {
  const teams = await getTeams();
  const filtered = group ? teams.filter(t => t.group === group) : teams;
  const standings: StandingsEntry[] = filtered.map(t => ({
    teamId: t.id,
    teamName: t.name,
    abbreviation: t.abbreviation,
    group: t.group,
    wins: t.wins,
    losses: t.losses,
    gamesPlayed: t.wins + t.losses,
    winPct: calcWinPct(t.wins, t.losses),
    pointsFor: t.pointsFor,
    pointsAgainst: t.pointsAgainst,
    pointDiff: t.pointsFor - t.pointsAgainst,
  }));
  return standings.sort((a, b) => b.winPct - a.winPct || b.pointDiff - a.pointDiff);
}

// ─── League Leaders ───────────────────────────────────────────────────────────

type StatCategory = 'points' | 'rebounds' | 'assists' | 'steals' | 'blocks';

export async function getLeagueLeaders(category: StatCategory): Promise<LeagueLeader[]> {
  const players = await getPlayers();
  const statMap: Record<StatCategory, keyof Player> = {
    points: 'totalPoints',
    rebounds: 'totalRebounds',
    assists: 'totalAssists',
    steals: 'totalSteals',
    blocks: 'totalBlocks',
  };
  const key = statMap[category];

  const withAvg = players
    .filter(p => p.gamesPlayed > 0)
    .map(p => ({
      playerId: p.id,
      playerName: p.name,
      teamName: p.teamName,
      gamesPlayed: p.gamesPlayed,
      value: +(Number(p[key]) / p.gamesPlayed).toFixed(1),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  return withAvg;
}

// ─── Recent Results ────────────────────────────────────────────────────────────

export async function getRecentResults(count = 5): Promise<Game[]> {
  const snap = await getDocs(
    query(collection(db, 'games'), where('status', '==', 'completed'), orderBy('scheduledDate', 'desc'), limit(count))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Game);
}
