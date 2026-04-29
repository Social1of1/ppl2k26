'use client';
// src/app/team/schedule/page.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import TeamLayout from '@/components/team/TeamLayout';
import { getGames } from '@/lib/db';
import { Game } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Upload } from 'lucide-react';

export default function TeamSchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'team')) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.teamId) {
      getGames({ teamId: user.teamId }).then(g => { setGames(g); setLoading(false); });
    }
  }, [user]);

  return (
    <TeamLayout>
      <div className="page-enter">
        <div className="mb-8">
          <h1 className="ppl-heading text-3xl text-ppl-white">My Schedule</h1>
          <p className="text-ppl-gray text-sm mt-1">{games.length} games this season</p>
        </div>
        <div className="space-y-3">
          {loading ? (
            [...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)
          ) : games.length === 0 ? (
            <div className="ppl-card p-10 text-center text-ppl-gray">No games scheduled yet.</div>
          ) : games.map(g => {
            const isHome = g.homeTeamId === user?.teamId;
            const opponent = isHome ? g.awayTeamName : g.homeTeamName;
            const won = g.status === 'completed' && (isHome ? g.homeScore! > g.awayScore! : g.awayScore! > g.homeScore!);
            return (
              <div key={g.id} className="ppl-card-glow p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('ppl-badge', g.group === 'A' ? 'ppl-badge-group-a' : 'ppl-badge-group-b')}>
                        Group {g.group}
                      </span>
                      <span className="text-xs text-ppl-gray">Week {g.week} · {formatDate(g.scheduledDate)} {formatTime(g.scheduledTime)}</span>
                    </div>
                    <p className="font-semibold text-ppl-white">
                      {isHome ? <><span className="text-ppl-purple-light text-xs font-bold uppercase mr-1">HOME</span>vs {opponent}</> : <>Away @ {opponent}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {g.status === 'completed' ? (
                      <>
                        <span className="ppl-stat-value text-xl text-ppl-white">
                          {isHome ? g.homeScore : g.awayScore} — {isHome ? g.awayScore : g.homeScore}
                        </span>
                        <span className={cn('ppl-badge', won ? 'ppl-badge-win' : 'ppl-badge-loss')}>{won ? 'W' : 'L'}</span>
                        {!g.boxScoreUrl && (
                          <Link href={`/team/upload?gameId=${g.id}`}
                            className="flex items-center gap-1 text-xs text-ppl-purple-light hover:text-ppl-white transition-colors">
                            <Upload size={12} /> Upload
                          </Link>
                        )}
                        {g.boxScoreUrl && (
                          <span className={cn('ppl-badge text-xs',
                            g.boxScoreStatus === 'processed' ? 'bg-ppl-green/10 text-ppl-green border border-ppl-green/30' : 'bg-ppl-black-border text-ppl-gray border border-ppl-black-border')}>
                            {g.boxScoreStatus || 'uploaded'}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="ppl-badge bg-ppl-black-border text-ppl-gray border border-ppl-black-border">Upcoming</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TeamLayout>
  );
}
