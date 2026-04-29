'use client';
// src/app/schedule/page.tsx
import { useEffect, useState } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import { getGames } from '@/lib/db';
import { Game } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Calendar, Clock } from 'lucide-react';

export default function SchedulePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'A' | 'B' | 'scheduled' | 'completed'>('all');

  useEffect(() => {
    getGames().then(g => { setGames(g); setLoading(false); });
  }, []);

  const filtered = games.filter(g => {
    if (filter === 'A') return g.group === 'A';
    if (filter === 'B') return g.group === 'B';
    if (filter === 'scheduled') return g.status === 'scheduled';
    if (filter === 'completed') return g.status === 'completed';
    return true;
  });

  // Group by week
  const byWeek: Record<number, Game[]> = {};
  filtered.forEach(g => {
    if (!byWeek[g.week]) byWeek[g.week] = [];
    byWeek[g.week].push(g);
  });

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 page-enter">
        <div className="mb-8">
          <h1 className="ppl-section-title text-4xl">Schedule</h1>
          <p className="text-ppl-gray mt-3">Full season schedule — {games.length} games</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(['all', 'A', 'B', 'scheduled', 'completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all',
                filter === f
                  ? 'bg-ppl-purple text-white'
                  : 'bg-ppl-black-card border border-ppl-black-border text-ppl-gray hover:text-ppl-white'
              )}
              style={{ fontFamily: 'var(--font-display)' }}>
              {f === 'all' ? 'All' : f === 'A' ? 'Group A' : f === 'B' ? 'Group B' : f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(byWeek).sort(([a], [b]) => +a - +b).map(([week, weekGames]) => (
              <div key={week}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-ppl-purple/10 border border-ppl-purple/30 flex items-center justify-center">
                    <Calendar size={14} className="text-ppl-purple-light" />
                  </div>
                  <h3 className="ppl-subheading text-sm text-ppl-white">Week {week}</h3>
                </div>
                <div className="space-y-3">
                  {weekGames.map(game => (
                    <div key={game.id} className="ppl-card-glow p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={cn('ppl-badge', game.group === 'A' ? 'ppl-badge-group-a' : 'ppl-badge-group-b')}>
                            Group {game.group}
                          </span>
                          <div className="flex items-center gap-1.5 text-ppl-gray text-xs">
                            <Clock size={11} />
                            <span>{formatDate(game.scheduledDate)}</span>
                            <span>·</span>
                            <span>{formatTime(game.scheduledTime)}</span>
                          </div>
                        </div>
                        <div className="flex-1 flex items-center gap-4">
                          <span className="font-bold text-ppl-white flex-1 text-right">{game.homeTeamName}</span>
                          {game.status === 'completed' ? (
                            <div className="flex items-center gap-3 px-4">
                              <span className="ppl-stat-value text-2xl text-ppl-white font-bold">{game.homeScore}</span>
                              <span className="text-ppl-gray text-xs font-semibold">FINAL</span>
                              <span className="ppl-stat-value text-2xl text-ppl-white font-bold">{game.awayScore}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 px-4">
                              <span className="text-ppl-gray text-xs ppl-badge ppl-badge-group-a">VS</span>
                            </div>
                          )}
                          <span className="font-bold text-ppl-white flex-1">{game.awayTeamName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {game.status === 'completed'
                            ? <span className="ppl-badge-win">Final</span>
                            : <span className="ppl-badge bg-ppl-black-border text-ppl-gray border border-ppl-black-border">Upcoming</span>
                          }
                          {game.boxScoreStatus && (
                            <span className={cn('ppl-badge text-xs',
                              game.boxScoreStatus === 'processed' ? 'bg-ppl-green/10 text-ppl-green border border-ppl-green/30' :
                              game.boxScoreStatus === 'processing' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' :
                              'bg-ppl-black-border text-ppl-gray border border-ppl-black-border')}>
                              {game.boxScoreStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(byWeek).length === 0 && (
              <div className="ppl-card p-12 text-center text-ppl-gray">
                No games found for this filter.
              </div>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
