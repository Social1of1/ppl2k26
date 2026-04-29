'use client';
// src/app/stats/page.tsx
import { useEffect, useState } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import { getLeagueLeaders, getPlayers } from '@/lib/db';
import { LeagueLeader, Player } from '@/types';
import { calcAvg, formatPct } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Trophy, TrendingUp } from 'lucide-react';

type Category = 'points' | 'rebounds' | 'assists' | 'steals' | 'blocks';

const CATEGORIES: { key: Category; label: string; short: string }[] = [
  { key: 'points', label: 'Points Per Game', short: 'PPG' },
  { key: 'rebounds', label: 'Rebounds Per Game', short: 'RPG' },
  { key: 'assists', label: 'Assists Per Game', short: 'APG' },
  { key: 'steals', label: 'Steals Per Game', short: 'SPG' },
  { key: 'blocks', label: 'Blocks Per Game', short: 'BPG' },
];

function LeaderCard({ category, leaders }: { category: typeof CATEGORIES[0]; leaders: LeagueLeader[] }) {
  return (
    <div className="ppl-card overflow-hidden">
      <div className="px-5 py-4 border-b border-ppl-black-border flex items-center justify-between">
        <div>
          <p className="ppl-subheading text-xs text-ppl-gray">{category.label}</p>
          <p className="ppl-heading text-2xl text-ppl-white">{category.short}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-ppl-purple/10 border border-ppl-purple/20 flex items-center justify-center">
          <Trophy size={16} className="text-ppl-purple-light" />
        </div>
      </div>
      <div className="divide-y divide-ppl-black-border/50">
        {leaders.length === 0 ? (
          <div className="p-6 text-center text-ppl-gray text-sm">No stats yet</div>
        ) : leaders.map(l => (
          <div key={l.playerId} className="flex items-center gap-4 px-5 py-3.5 hover:bg-ppl-purple/5 transition-colors">
            <span className={cn('text-sm font-bold w-6 text-center flex-shrink-0',
              l.rank === 1 ? 'rank-1 text-lg' : l.rank === 2 ? 'rank-2' : l.rank === 3 ? 'rank-3' : 'text-ppl-gray')}>
              {l.rank === 1 ? '🥇' : l.rank === 2 ? '🥈' : l.rank === 3 ? '🥉' : l.rank}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ppl-white text-sm truncate">{l.playerName}</p>
              <p className="text-xs text-ppl-gray truncate">{l.teamName}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="ppl-stat-value text-xl text-ppl-purple-light font-bold">{l.value}</p>
              <p className="text-xs text-ppl-gray">{l.gamesPlayed}GP</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [allLeaders, setAllLeaders] = useState<Record<Category, LeagueLeader[]>>({
    points: [], rebounds: [], assists: [], steals: [], blocks: [],
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaders' | 'players'>('leaders');

  useEffect(() => {
    async function load() {
      const [pts, reb, ast, stl, blk, allPlayers] = await Promise.all([
        getLeagueLeaders('points'),
        getLeagueLeaders('rebounds'),
        getLeagueLeaders('assists'),
        getLeagueLeaders('steals'),
        getLeagueLeaders('blocks'),
        getPlayers(),
      ]);
      setAllLeaders({ points: pts, rebounds: reb, assists: ast, steals: stl, blocks: blk });
      setPlayers(allPlayers.filter(p => p.gamesPlayed > 0));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 page-enter">
        <div className="mb-8">
          <h1 className="ppl-section-title text-4xl">Stats</h1>
          <p className="text-ppl-gray mt-3">Season statistics and league leaders</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { key: 'leaders', label: 'League Leaders', icon: Trophy },
            { key: 'players', label: 'Player Stats', icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key as any)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all',
                activeTab === key
                  ? 'bg-ppl-purple text-white'
                  : 'bg-ppl-black-card border border-ppl-black-border text-ppl-gray hover:text-ppl-white'
              )}
              style={{ fontFamily: 'var(--font-display)' }}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-72 rounded-xl" />)}
          </div>
        ) : activeTab === 'leaders' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {CATEGORIES.map(cat => (
              <LeaderCard key={cat.key} category={cat} leaders={allLeaders[cat.key]} />
            ))}
          </div>
        ) : (
          <div className="ppl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="ppl-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Team</th>
                    <th className="text-center">GP</th>
                    <th className="text-center">PPG</th>
                    <th className="text-center">RPG</th>
                    <th className="text-center">APG</th>
                    <th className="text-center">SPG</th>
                    <th className="text-center">BPG</th>
                    <th className="text-center">TPG</th>
                    <th className="text-center">FPG</th>
                    <th className="text-center">FG%</th>
                    <th className="text-center">3P%</th>
                    <th className="text-center">FT%</th>
                  </tr>
                </thead>
                <tbody>
                  {players.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="text-center py-10 text-ppl-gray">
                        No player stats available yet.
                      </td>
                    </tr>
                  ) : players
                      .sort((a, b) => (b.totalPoints / b.gamesPlayed) - (a.totalPoints / a.gamesPlayed))
                      .map(p => (
                        <tr key={p.id}>
                          <td className="font-semibold text-ppl-white">{p.name}</td>
                          <td className="text-ppl-gray text-sm">{p.teamName}</td>
                          <td className="text-center ppl-stat-value">{p.gamesPlayed}</td>
                          <td className="text-center ppl-stat-value text-ppl-purple-light font-bold">
                            {calcAvg(p.totalPoints, p.gamesPlayed)}
                          </td>
                          <td className="text-center ppl-stat-value">{calcAvg(p.totalRebounds, p.gamesPlayed)}</td>
                          <td className="text-center ppl-stat-value">{calcAvg(p.totalAssists, p.gamesPlayed)}</td>
                          <td className="text-center ppl-stat-value">{calcAvg(p.totalSteals, p.gamesPlayed)}</td>
                          <td className="text-center ppl-stat-value">{calcAvg(p.totalBlocks, p.gamesPlayed)}</td>
                          <td className="text-center ppl-stat-value">{calcAvg(p.totalTurnovers, p.gamesPlayed)}</td>
                          <td className="text-center ppl-stat-value">{calcAvg(p.totalFouls, p.gamesPlayed)}</td>
                          <td className="text-center ppl-stat-value text-xs">{formatPct(p.totalFgm, p.totalFga)}</td>
                          <td className="text-center ppl-stat-value text-xs">{formatPct(p.total3pm, p.total3pa)}</td>
                          <td className="text-center ppl-stat-value text-xs">{formatPct(p.totalFtm, p.totalFta)}</td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
