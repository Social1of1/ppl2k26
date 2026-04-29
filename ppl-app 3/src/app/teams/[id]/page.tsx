'use client';
// src/app/teams/[id]/page.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { getTeam, getPlayers } from '@/lib/db';
import { Team, Player } from '@/types';
import { formatWinPct, calcAvg, formatPct } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

export default function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [t, p] = await Promise.all([getTeam(id), getPlayers(id)]);
      setTeam(t);
      setPlayers(p);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="skeleton h-48 rounded-2xl mb-8" />
        <div className="skeleton h-96 rounded-xl" />
      </div>
    </PublicLayout>
  );

  if (!team) return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-ppl-gray">
        Team not found.
      </div>
    </PublicLayout>
  );

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 page-enter">
        <Link href="/teams" className="inline-flex items-center gap-2 text-ppl-gray hover:text-ppl-white text-sm mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to Teams
        </Link>

        {/* Team Header */}
        <div className="ppl-card-glow p-8 mb-8"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, transparent 60%), #1A1A24' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-ppl-purple/10 border border-ppl-purple/30 flex items-center justify-center flex-shrink-0">
              {team.logoUrl
                ? <img src={team.logoUrl} alt={team.name} className="w-20 h-20 object-contain" />
                : <span className="ppl-heading text-4xl text-ppl-purple-light">{team.abbreviation}</span>
              }
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="ppl-heading text-4xl text-ppl-white">{team.name}</h1>
                <span className={cn('ppl-badge', team.group === 'A' ? 'ppl-badge-group-a' : 'ppl-badge-group-b')}>
                  Group {team.group}
                </span>
              </div>
              <div className="flex flex-wrap gap-6 mt-4">
                {[
                  { label: 'Wins', value: team.wins, color: 'text-ppl-green' },
                  { label: 'Losses', value: team.losses, color: 'text-ppl-red' },
                  { label: 'Win%', value: formatWinPct(team.wins, team.losses), color: 'text-ppl-white' },
                  { label: 'PF', value: team.pointsFor, color: 'text-ppl-gray' },
                  { label: 'PA', value: team.pointsAgainst, color: 'text-ppl-gray' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <p className={cn('ppl-stat-value text-2xl font-bold', color)}>{value}</p>
                    <p className="text-xs text-ppl-gray uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Roster */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Users size={18} className="text-ppl-purple-light" />
            <h2 className="ppl-subheading text-lg text-ppl-white">Roster</h2>
            <span className="ppl-badge bg-ppl-black-border text-ppl-gray">{players.length} Players</span>
          </div>
          <div className="ppl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="ppl-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>POS</th>
                    <th className="text-center">GP</th>
                    <th className="text-center">PPG</th>
                    <th className="text-center">RPG</th>
                    <th className="text-center">APG</th>
                    <th className="text-center">SPG</th>
                    <th className="text-center">BPG</th>
                    <th className="text-center">FG%</th>
                    <th className="text-center">3P%</th>
                    <th className="text-center">FT%</th>
                  </tr>
                </thead>
                <tbody>
                  {players.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-10 text-ppl-gray">
                        No players on this roster yet.
                      </td>
                    </tr>
                  ) : players.map(p => (
                    <tr key={p.id}>
                      <td className="ppl-stat-value text-ppl-gray">{p.number}</td>
                      <td className="font-semibold text-ppl-white">{p.name}</td>
                      <td className="text-ppl-gray text-xs">{p.position}</td>
                      <td className="text-center ppl-stat-value">{p.gamesPlayed}</td>
                      <td className="text-center ppl-stat-value text-ppl-purple-light">{calcAvg(p.totalPoints, p.gamesPlayed)}</td>
                      <td className="text-center ppl-stat-value">{calcAvg(p.totalRebounds, p.gamesPlayed)}</td>
                      <td className="text-center ppl-stat-value">{calcAvg(p.totalAssists, p.gamesPlayed)}</td>
                      <td className="text-center ppl-stat-value">{calcAvg(p.totalSteals, p.gamesPlayed)}</td>
                      <td className="text-center ppl-stat-value">{calcAvg(p.totalBlocks, p.gamesPlayed)}</td>
                      <td className="text-center ppl-stat-value text-xs">{formatPct(p.totalFgm, p.totalFga)}</td>
                      <td className="text-center ppl-stat-value text-xs">{formatPct(p.total3pm, p.total3pa)}</td>
                      <td className="text-center ppl-stat-value text-xs">{formatPct(p.totalFtm, p.totalFta)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
