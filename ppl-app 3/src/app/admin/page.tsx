'use client';
// src/app/admin/page.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { getTeams, getGames, getPlayers } from '@/lib/db';
import { Team, Game, Player } from '@/types';
import { Users, Calendar, TrendingUp, Shield, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      Promise.all([getTeams(), getGames(), getPlayers()]).then(([t, g, p]) => {
        setTeams(t); setGames(g); setPlayers(p); setLoading(false);
      });
    }
  }, [user]);

  if (authLoading || !user) return null;

  const pendingBoxScores = games.filter(g => g.boxScoreStatus === 'pending' || g.boxScoreStatus === 'processing');
  const completedGames = games.filter(g => g.status === 'completed');
  const upcomingGames = games.filter(g => g.status === 'scheduled').slice(0, 5);

  return (
    <AdminLayout>
      <div className="page-enter">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-ppl-purple/10 border border-ppl-purple/30 flex items-center justify-center">
              <Shield size={18} className="text-ppl-purple-light" />
            </div>
            <div>
              <h1 className="ppl-heading text-3xl text-ppl-white">Admin Dashboard</h1>
              <p className="text-ppl-gray text-sm">Philippine Pro-Am League — Season 1</p>
            </div>
          </div>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Teams', value: teams.length, icon: Shield, color: 'ppl-purple-light', href: '/admin/teams' },
            { label: 'Players', value: players.length, icon: Users, color: 'ppl-green', href: '/admin/players' },
            { label: 'Games Played', value: completedGames.length, icon: TrendingUp, color: 'amber-400', href: '/admin/games' },
            { label: 'Pending Scores', value: pendingBoxScores.length, icon: Calendar, color: 'ppl-red', href: '/admin/games' },
          ].map(({ label, value, icon: Icon, color, href }) => (
            <Link key={label} href={href}>
              <div className="ppl-card-glow p-5 cursor-pointer hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center justify-between mb-3">
                  <span className={cn('text-3xl font-bold ppl-stat-value', `text-${color}`)}>{loading ? '—' : value}</span>
                  <Icon size={18} className={`text-${color} opacity-60`} />
                </div>
                <p className="text-xs text-ppl-gray uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>{label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { href: '/admin/teams', label: 'Manage Teams', desc: 'Add, edit, assign to groups', icon: Shield },
            { href: '/admin/players', label: 'Manage Players', desc: 'Roster management per team', icon: Users },
            { href: '/admin/games', label: 'Manage Games', desc: 'Schedule and box scores', icon: Calendar },
            { href: '/admin/users', label: 'User Accounts', desc: 'Create team login accounts', icon: Shield },
          ].map(({ href, label, desc, icon: Icon }) => (
            <Link key={href} href={href}>
              <div className="ppl-card border border-ppl-black-border hover:border-ppl-purple/40 p-5 cursor-pointer transition-all group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-ppl-white mb-1">{label}</p>
                    <p className="text-xs text-ppl-gray">{desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-ppl-gray group-hover:text-ppl-purple-light transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Upcoming Games */}
        <div>
          <h2 className="ppl-subheading text-sm text-ppl-white mb-4">Upcoming Games</h2>
          <div className="ppl-card overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}</div>
            ) : upcomingGames.length === 0 ? (
              <div className="p-8 text-center text-ppl-gray">No upcoming games scheduled.</div>
            ) : (
              <table className="ppl-table">
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Date</th>
                    <th>Home</th>
                    <th className="text-center">VS</th>
                    <th>Away</th>
                    <th>Week</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingGames.map(game => (
                    <tr key={game.id}>
                      <td>
                        <span className={cn('ppl-badge', game.group === 'A' ? 'ppl-badge-group-a' : 'ppl-badge-group-b')}>
                          {game.group}
                        </span>
                      </td>
                      <td className="text-ppl-gray text-xs">{formatDate(game.scheduledDate)}</td>
                      <td className="font-semibold text-ppl-white">{game.homeTeamName}</td>
                      <td className="text-center text-ppl-gray text-xs">vs</td>
                      <td className="font-semibold text-ppl-white">{game.awayTeamName}</td>
                      <td className="text-ppl-gray text-xs">W{game.week}</td>
                      <td>
                        <span className="ppl-badge bg-ppl-black-border text-ppl-gray border border-ppl-black-border">
                          Scheduled
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
