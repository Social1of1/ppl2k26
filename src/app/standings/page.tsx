'use client';
// src/app/standings/page.tsx
import { useEffect, useState } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import { getStandings } from '@/lib/db';
import { StandingsEntry } from '@/types';
import { formatWinPct } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

function StandingsTable({ group, entries, loading }: {
  group: 'A' | 'B'; entries: StandingsEntry[]; loading: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className={cn('ppl-badge text-base px-3 py-1',
          group === 'A' ? 'ppl-badge-group-a' : 'ppl-badge-group-b')}>
          Group {group}
        </div>
      </div>
      <div className="ppl-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="ppl-table">
              <thead>
                <tr>
                  <th className="w-10">#</th>
                  <th>Team</th>
                  <th className="text-center">GP</th>
                  <th className="text-center">W</th>
                  <th className="text-center">L</th>
                  <th className="text-center">PCT</th>
                  <th className="text-center">PF</th>
                  <th className="text-center">PA</th>
                  <th className="text-center">DIFF</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-ppl-gray">
                      No teams assigned to Group {group} yet.
                    </td>
                  </tr>
                ) : entries.map((s, i) => (
                  <tr key={s.teamId} className={i === 0 ? 'bg-ppl-purple/5' : ''}>
                    <td>
                      <div className="flex items-center justify-center">
                        {i === 0
                          ? <Trophy size={14} className="text-ppl-gold" />
                          : <span className={cn('text-sm font-bold',
                              i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-ppl-gray')}>
                              {i + 1}
                            </span>
                        }
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-bold text-ppl-white">{s.teamName}</p>
                        <p className="text-xs text-ppl-gray">{s.abbreviation}</p>
                      </div>
                    </td>
                    <td className="text-center ppl-stat-value text-ppl-gray">{s.gamesPlayed}</td>
                    <td className="text-center ppl-stat-value text-ppl-green font-bold">{s.wins}</td>
                    <td className="text-center ppl-stat-value text-ppl-red">{s.losses}</td>
                    <td className="text-center ppl-stat-value text-ppl-white font-semibold">
                      {formatWinPct(s.wins, s.losses)}
                    </td>
                    <td className="text-center ppl-stat-value">{s.pointsFor}</td>
                    <td className="text-center ppl-stat-value">{s.pointsAgainst}</td>
                    <td className={cn('text-center ppl-stat-value font-semibold',
                      s.pointDiff > 0 ? 'text-ppl-green' : s.pointDiff < 0 ? 'text-ppl-red' : 'text-ppl-gray')}>
                      {s.pointDiff > 0 ? '+' : ''}{s.pointDiff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StandingsPage() {
  const [groupA, setGroupA] = useState<StandingsEntry[]>([]);
  const [groupB, setGroupB] = useState<StandingsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [a, b] = await Promise.all([getStandings('A'), getStandings('B')]);
      setGroupA(a);
      setGroupB(b);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 page-enter">
        <div className="mb-10">
          <h1 className="ppl-section-title text-4xl">Standings</h1>
          <p className="text-ppl-gray mt-3">Current season standings for both groups</p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          <StandingsTable group="A" entries={groupA} loading={loading} />
          <StandingsTable group="B" entries={groupB} loading={loading} />
        </div>
      </div>
    </PublicLayout>
  );
}
