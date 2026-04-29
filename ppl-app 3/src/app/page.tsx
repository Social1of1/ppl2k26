'use client';
// src/app/page.tsx
import { useEffect, useState } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import { getRecentResults, getStandings, getLeagueLeaders } from '@/lib/db';
import { Game, StandingsEntry, LeagueLeader } from '@/types';
import Link from 'next/link';
import { Trophy, ChevronRight, TrendingUp, Users, Calendar, Zap } from 'lucide-react';
import { formatDate, formatWinPct } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [leaders, setLeaders] = useState<LeagueLeader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [games, standA, pts] = await Promise.all([
        getRecentResults(6),
        getStandings('A'),
        getLeagueLeaders('points'),
      ]);
      setRecentGames(games);
      setStandings(standA);
      setLeaders(pts);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative ppl-court-bg min-h-[520px] flex items-center overflow-hidden">
        <div className="absolute inset-0 ppl-court-bg" />
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-[600px] h-[600px] opacity-5"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/4 w-px h-32 bg-gradient-to-t from-ppl-purple/40 to-transparent" />
        <div className="absolute top-20 right-1/3 w-px h-24 bg-gradient-to-b from-ppl-purple/30 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-ppl-purple/10 border border-ppl-purple/30 rounded-full px-4 py-1.5 mb-6">
              <Zap size={12} className="text-ppl-purple-light" />
              <span className="text-xs font-semibold text-ppl-purple-light uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>
                Season 1 — Now Live
              </span>
            </div>
            <h1 className="ppl-heading text-5xl sm:text-6xl lg:text-7xl text-white mb-4 leading-none">
              Philippine<br />
              <span className="text-ppl-purple-light">Pro-Am</span> League
            </h1>
            <p className="text-ppl-gray text-lg max-w-lg mb-8 leading-relaxed">
              The premier NBA 2K26 esports competition in the Philippines. Two groups. One champion.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/standings" className="ppl-btn-primary text-sm">
                View Standings
              </Link>
              <Link href="/stats" className="ppl-btn-secondary text-sm">
                Player Stats
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-ppl-black to-transparent" />
      </section>

      {/* Quick Stats Bar */}
      <section className="bg-ppl-black-soft border-y border-ppl-black-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-ppl-black-border">
            {[
              { icon: Trophy, label: 'Season', value: '1' },
              { icon: Users, label: 'Teams', value: '16' },
              { icon: Calendar, label: 'Groups', value: '2' },
              { icon: TrendingUp, label: 'NBA 2K', value: '26' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 px-6 py-5">
                <div className="w-10 h-10 rounded-lg bg-ppl-purple/10 border border-ppl-purple/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-ppl-purple-light" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-ppl-white" style={{ fontFamily: 'var(--font-mono)' }}>{value}</p>
                  <p className="text-xs text-ppl-gray uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Results */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="ppl-section-title text-2xl">Recent Results</h2>
              <Link href="/schedule" className="text-sm text-ppl-purple-light hover:text-ppl-white transition-colors flex items-center gap-1">
                Full Schedule <ChevronRight size={14} />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton h-20 rounded-xl" />
                ))}
              </div>
            ) : recentGames.length === 0 ? (
              <div className="ppl-card p-8 text-center text-ppl-gray">
                No results yet. Games are coming soon!
              </div>
            ) : (
              <div className="space-y-3">
                {recentGames.map(game => (
                  <div key={game.id} className="ppl-card-glow p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('ppl-badge', game.group === 'A' ? 'ppl-badge-group-a' : 'ppl-badge-group-b')}>
                          Group {game.group}
                        </span>
                        <span className="text-xs text-ppl-gray">{formatDate(game.scheduledDate)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-ppl-white">{game.homeTeamName}</span>
                        <div className="flex items-center gap-3">
                          <span className="ppl-stat-value text-2xl text-ppl-white">{game.homeScore}</span>
                          <span className="text-ppl-gray text-sm">—</span>
                          <span className="ppl-stat-value text-2xl text-ppl-white">{game.awayScore}</span>
                        </div>
                        <span className="font-semibold text-ppl-white">{game.awayTeamName}</span>
                      </div>
                    </div>
                    <span className="ppl-badge-win ml-4">Final</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Group A Standings preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="ppl-subheading text-sm text-ppl-white">Group A Standings</h3>
                <Link href="/standings" className="text-xs text-ppl-purple-light hover:text-ppl-white transition-colors">
                  View All
                </Link>
              </div>
              <div className="ppl-card overflow-hidden">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-8 rounded" />)}
                  </div>
                ) : standings.length === 0 ? (
                  <div className="p-6 text-center text-ppl-gray text-sm">No teams yet</div>
                ) : (
                  <table className="ppl-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Team</th>
                        <th className="text-center">W</th>
                        <th className="text-center">L</th>
                        <th className="text-center">PCT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.slice(0, 5).map((s, i) => (
                        <tr key={s.teamId}>
                          <td className={cn('text-xs font-bold', i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'text-ppl-gray')}>
                            {i + 1}
                          </td>
                          <td className="font-semibold text-ppl-white text-xs">{s.abbreviation}</td>
                          <td className="text-center ppl-stat-value text-ppl-green">{s.wins}</td>
                          <td className="text-center ppl-stat-value text-ppl-red">{s.losses}</td>
                          <td className="text-center ppl-stat-value text-xs">{formatWinPct(s.wins, s.losses)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Points Leaders */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="ppl-subheading text-sm text-ppl-white">Points Leaders</h3>
                <Link href="/stats" className="text-xs text-ppl-purple-light hover:text-ppl-white transition-colors">
                  View All
                </Link>
              </div>
              <div className="ppl-card overflow-hidden">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-8 rounded" />)}
                  </div>
                ) : leaders.length === 0 ? (
                  <div className="p-6 text-center text-ppl-gray text-sm">No stats yet</div>
                ) : (
                  <div className="divide-y divide-ppl-black-border/50">
                    {leaders.map(l => (
                      <div key={l.playerId} className="flex items-center justify-between px-4 py-3 hover:bg-ppl-purple/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={cn('text-sm font-bold w-5 text-center',
                            l.rank === 1 ? 'rank-1' : l.rank === 2 ? 'rank-2' : l.rank === 3 ? 'rank-3' : 'text-ppl-gray')}>
                            {l.rank}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-ppl-white">{l.playerName}</p>
                            <p className="text-xs text-ppl-gray">{l.teamName}</p>
                          </div>
                        </div>
                        <span className="ppl-stat-value text-xl text-ppl-purple-light">{l.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
