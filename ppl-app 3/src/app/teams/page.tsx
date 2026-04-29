'use client';
// src/app/teams/page.tsx
import { useEffect, useState } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import { getTeams } from '@/lib/db';
import { Team } from '@/types';
import Link from 'next/link';
import { Users, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatWinPct } from '@/lib/utils';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<'all' | 'A' | 'B'>('all');

  useEffect(() => {
    getTeams().then(t => { setTeams(t); setLoading(false); });
  }, []);

  const filtered = activeGroup === 'all' ? teams : teams.filter(t => t.group === activeGroup);

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 page-enter">
        <div className="mb-8">
          <h1 className="ppl-section-title text-4xl">Teams</h1>
          <p className="text-ppl-gray mt-3">All {teams.length} teams competing in Season 1</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-8">
          {(['all', 'A', 'B'] as const).map(g => (
            <button key={g} onClick={() => setActiveGroup(g)}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all',
                activeGroup === g
                  ? 'bg-ppl-purple text-white'
                  : 'bg-ppl-black-card border border-ppl-black-border text-ppl-gray hover:text-ppl-white'
              )}
              style={{ fontFamily: 'var(--font-display)' }}>
              {g === 'all' ? 'All Teams' : `Group ${g}`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(team => (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <div className="ppl-card-glow p-5 h-full cursor-pointer transition-all duration-200 hover:-translate-y-1">
                  {/* Team avatar */}
                  <div className="w-16 h-16 rounded-xl bg-ppl-purple/10 border border-ppl-purple/20 flex items-center justify-center mb-4">
                    {team.logoUrl
                      ? <img src={team.logoUrl} alt={team.name} className="w-12 h-12 object-contain" />
                      : <span className="ppl-heading text-2xl text-ppl-purple-light">{team.abbreviation}</span>
                    }
                  </div>
                  <div className="mb-3">
                    <p className="font-bold text-ppl-white text-lg leading-tight">{team.name}</p>
                    <span className={cn('ppl-badge mt-1', team.group === 'A' ? 'ppl-badge-group-a' : 'ppl-badge-group-b')}>
                      Group {team.group}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 pt-3 border-t border-ppl-black-border">
                    <div className="text-center">
                      <p className="ppl-stat-value text-lg text-ppl-green">{team.wins}</p>
                      <p className="text-xs text-ppl-gray uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>W</p>
                    </div>
                    <div className="text-center">
                      <p className="ppl-stat-value text-lg text-ppl-red">{team.losses}</p>
                      <p className="text-xs text-ppl-gray uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>L</p>
                    </div>
                    <div className="text-center ml-auto">
                      <p className="ppl-stat-value text-sm text-ppl-white">{formatWinPct(team.wins, team.losses)}</p>
                      <p className="text-xs text-ppl-gray uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>PCT</p>
                    </div>
                    <ChevronRight size={16} className="text-ppl-gray/50" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
