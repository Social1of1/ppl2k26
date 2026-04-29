'use client';
// src/app/team/dashboard/page.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import TeamLayout from '@/components/team/TeamLayout';
import { getGames, getPlayers } from '@/lib/db';
import { Game, Player } from '@/types';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Upload, Calendar, Users, ChevronRight } from 'lucide-react';

export default function TeamDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [myGames, setMyGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'team')) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.teamId) {
      Promise.all([getGames({ teamId: user.teamId }), getPlayers(user.teamId)])
        .then(([g, p]) => { setMyGames(g); setPlayers(p); setLoading(false); });
    }
  }, [user]);

  const upcoming = myGames.filter(g => g.status === 'scheduled').slice(0, 5);
  const recent = myGames.filter(g => g.status === 'completed').slice(-3).reverse();
  const pendingUpload = myGames.filter(g => g.status === 'completed' && !g.boxScoreUrl);

  return (
    <TeamLayout>
      <div className="page-enter">
        <div className="mb-8">
          <h1 className="ppl-heading text-3xl text-ppl-white">{user?.teamName}</h1>
          <p className="text-ppl-gray text-sm mt-1">Team Dashboard — Season 1</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Players', value: players.length, icon: Users, color: 'text-ppl-purple-light' },
            { label: 'Games Played', value: myGames.filter(g => g.status === 'completed').length, icon: Calendar, color: 'text-ppl-green' },
            { label: 'Upcoming', value: upcoming.length, icon: Calendar, color: 'text-amber-400' },
            { label: 'Pending Upload', value: pendingUpload.length, icon: Upload, color: 'text-ppl-red' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="ppl-card-glow p-5">
              <div className="flex items-center justify-between mb-2">
                <span className={cn('text-3xl font-bold ppl-stat-value', color)}>{loading ? '—' : value}</span>
                <Icon size={18} className={cn(color, 'opacity-50')} />
              </div>
              <p className="text-xs text-ppl-gray uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>{label}</p>
            </div>
          ))}
        </div>
        {pendingUpload.length > 0 && (
          <div className="ppl-card border border-ppl-red/30 bg-ppl-red/5 p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Upload size={16} className="text-ppl-red flex-shrink-0" />
              <p className="text-sm text-ppl-white">
                You have <span className="font-bold text-ppl-red">{pendingUpload.length}</span> game{pendingUpload.length > 1 ? 's' : ''} awaiting box score upload.
              </p>
            </div>
            <Link href="/team/upload" className="ppl-btn-primary text-xs py-1.5 px-4 flex-shrink-0">Upload Now</Link>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="ppl-subheading text-sm text-ppl-white">Upcoming Games</h2>
              <Link href="/team/schedule" className="text-xs text-ppl-purple-light hover:text-ppl-white flex items-center gap-1">
                View All <ChevronRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? <div className="skeleton h-40 rounded-xl" /> : upcoming.length === 0 ? (
                <div className="ppl-card p-6 text-center text-ppl-gray text-sm">No upcoming games scheduled.</div>
              ) : upcoming.map(g => (
                <div key={g.id} className="ppl-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-ppl-gray mb-1">{formatDate(g.scheduledDate)} · Week {g.week}</p>
                      <p className="font-semibold text-ppl-white text-sm">
                        {g.homeTeamId === user?.teamId
                          ? <><span className="text-ppl-purple-light">Home</span> vs {g.awayTeamName}</>
                          : <>Away @ {g.homeTeamName}</>}
                      </p>
                    </div>
                    <span className={cn('ppl-badge', g.group === 'A' ? 'ppl-badge-group-a' : 'ppl-badge-group-b')}>Grp {g.group}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="ppl-subheading text-sm text-ppl-white mb-4">Recent Results</h2>
            <div className="space-y-3">
              {loading ? <div className="skeleton h-40 rounded-xl" /> : recent.length === 0 ? (
                <div className="ppl-card p-6 text-center text-ppl-gray text-sm">No completed games yet.</div>
              ) : recent.map(g => {
                const isHome = g.homeTeamId === user?.teamId;
                const myScore = isHome ? g.homeScore! : g.awayScore!;
                const oppScore = isHome ? g.awayScore! : g.homeScore!;
                const won = myScore > oppScore;
                return (
                  <div key={g.id} className="ppl-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-ppl-gray mb-1">{formatDate(g.scheduledDate)}</p>
                        <p className="font-semibold text-ppl-white text-sm">vs {isHome ? g.awayTeamName : g.homeTeamName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="ppl-stat-value text-xl text-ppl-white font-bold">{myScore} — {oppScore}</span>
                        <span className={cn('ppl-badge', won ? 'ppl-badge-win' : 'ppl-badge-loss')}>{won ? 'W' : 'L'}</span>
                      </div>
                    </div>
                    {!g.boxScoreUrl && (
                      <div className="mt-2 pt-2 border-t border-ppl-black-border flex items-center justify-between">
                        <p className="text-xs text-ppl-red/80">Box score not uploaded</p>
                        <Link href={`/team/upload?gameId=${g.id}`} className="text-xs text-ppl-purple-light hover:text-ppl-white">Upload →</Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </TeamLayout>
  );
}
