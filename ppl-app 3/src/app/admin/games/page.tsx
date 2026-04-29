'use client';
// src/app/admin/games/page.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { getGames, getTeams } from '@/lib/db';
import { Game, Team, Group } from '@/types';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ExternalLink, Eye } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface GameForm {
  homeTeamId: string;
  awayTeamId: string;
  group: Group;
  scheduledDate: string;
  scheduledTime: string;
  week: number;
}

const EMPTY_FORM: GameForm = {
  homeTeamId: '', awayTeamId: '', group: 'A',
  scheduledDate: '', scheduledTime: '20:00', week: 1,
};

export default function AdminGamesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<GameForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [viewBoxScore, setViewBoxScore] = useState<Game | null>(null);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/login');
  }, [user, authLoading, router]);

  async function load() {
    const [g, t] = await Promise.all([getGames(), getTeams()]);
    setGames(g); setTeams(t); setLoading(false);
  }

  useEffect(() => { if (user?.role === 'admin') load(); }, [user]);

  async function handleSave() {
    if (!form.homeTeamId || !form.awayTeamId || !form.scheduledDate) {
      return toast.error('Fill in all required fields');
    }
    if (form.homeTeamId === form.awayTeamId) return toast.error('Teams must be different');
    setSaving(true);
    try {
      const home = teams.find(t => t.id === form.homeTeamId)!;
      const away = teams.find(t => t.id === form.awayTeamId)!;
      await addDoc(collection(db, 'games'), {
        ...form,
        homeTeamName: home.name,
        awayTeamName: away.name,
        status: 'scheduled',
        boxScoreStatus: null,
      });
      toast.success('Game scheduled');
      setShowModal(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(game: Game) {
    if (!confirm(`Delete game ${game.homeTeamName} vs ${game.awayTeamName}?`)) return;
    await deleteDoc(doc(db, 'games', game.id));
    toast.success('Game deleted');
    load();
  }

  async function handleDeleteBoxScore(game: Game) {
    if (!confirm('Delete this box score submission? Stats will NOT be reverted.')) return;
    await updateDoc(doc(db, 'games', game.id), { boxScoreUrl: null, boxScoreStatus: null });
    toast.success('Box score removed');
    setViewBoxScore(null);
    load();
  }

  const filtered = games.filter(g => {
    if (filter === 'scheduled') return g.status === 'scheduled';
    if (filter === 'completed') return g.status === 'completed';
    return true;
  });

  return (
    <AdminLayout>
      <div className="page-enter">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="ppl-heading text-3xl text-ppl-white">Games & Schedule</h1>
            <p className="text-ppl-gray text-sm mt-1">{games.length} total games</p>
          </div>
          <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}
            className="ppl-btn-primary flex items-center gap-2">
            <Plus size={16} /> Schedule Game
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'scheduled', 'completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all',
                filter === f ? 'bg-ppl-purple text-white' : 'bg-ppl-black-card border border-ppl-black-border text-ppl-gray hover:text-ppl-white'
              )}
              style={{ fontFamily: 'var(--font-display)' }}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        <div className="ppl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ppl-table">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Date</th>
                  <th>Week</th>
                  <th>Home</th>
                  <th className="text-center">Score</th>
                  <th>Away</th>
                  <th>Status</th>
                  <th>Box Score</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-8 text-ppl-gray">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-ppl-gray">No games found</td></tr>
                ) : filtered.map(game => (
                  <tr key={game.id}>
                    <td>
                      <span className={cn('ppl-badge', game.group === 'A' ? 'ppl-badge-group-a' : 'ppl-badge-group-b')}>
                        {game.group}
                      </span>
                    </td>
                    <td className="text-ppl-gray text-xs whitespace-nowrap">{formatDate(game.scheduledDate)}</td>
                    <td className="text-ppl-gray text-xs">W{game.week}</td>
                    <td className="font-semibold text-ppl-white text-sm">{game.homeTeamName}</td>
                    <td className="text-center ppl-stat-value text-sm">
                      {game.status === 'completed' ? `${game.homeScore} — ${game.awayScore}` : '—'}
                    </td>
                    <td className="font-semibold text-ppl-white text-sm">{game.awayTeamName}</td>
                    <td>
                      <span className={cn('ppl-badge text-xs',
                        game.status === 'completed' ? 'ppl-badge-win' : 'bg-ppl-black-border text-ppl-gray border border-ppl-black-border')}>
                        {game.status}
                      </span>
                    </td>
                    <td>
                      {game.boxScoreUrl ? (
                        <div className="flex items-center gap-1.5">
                          <span className={cn('ppl-badge text-xs',
                            game.boxScoreStatus === 'processed' ? 'bg-ppl-green/10 text-ppl-green border border-ppl-green/30' :
                            game.boxScoreStatus === 'processing' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' :
                            'bg-ppl-black-border text-ppl-gray border border-ppl-black-border')}>
                            {game.boxScoreStatus}
                          </span>
                          <button onClick={() => setViewBoxScore(game)}
                            className="p-1 text-ppl-gray hover:text-ppl-white transition-colors">
                            <Eye size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-ppl-gray/40 text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleDelete(game)}
                          className="p-1.5 rounded text-ppl-gray hover:text-ppl-red hover:bg-ppl-red/10 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Schedule Game Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="ppl-card-glow w-full max-w-md p-6">
            <h2 className="ppl-heading text-xl text-ppl-white mb-5">Schedule Game</h2>
            <div className="space-y-4">
              <div>
                <label className="ppl-label">Group</label>
                <select value={form.group} onChange={e => setForm({ ...form, group: e.target.value as Group })}
                  className="ppl-input">
                  <option value="A">Group A</option>
                  <option value="B">Group B</option>
                </select>
              </div>
              <div>
                <label className="ppl-label">Home Team</label>
                <select value={form.homeTeamId} onChange={e => setForm({ ...form, homeTeamId: e.target.value })}
                  className="ppl-input">
                  <option value="">Select team...</option>
                  {teams.filter(t => t.group === form.group).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ppl-label">Away Team</label>
                <select value={form.awayTeamId} onChange={e => setForm({ ...form, awayTeamId: e.target.value })}
                  className="ppl-input">
                  <option value="">Select team...</option>
                  {teams.filter(t => t.group === form.group && t.id !== form.homeTeamId).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ppl-label">Date</label>
                  <input type="date" value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                    className="ppl-input" />
                </div>
                <div>
                  <label className="ppl-label">Time</label>
                  <input type="time" value={form.scheduledTime} onChange={e => setForm({ ...form, scheduledTime: e.target.value })}
                    className="ppl-input" />
                </div>
              </div>
              <div>
                <label className="ppl-label">Week #</label>
                <input type="number" min={1} value={form.week} onChange={e => setForm({ ...form, week: +e.target.value })}
                  className="ppl-input" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="ppl-btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="ppl-btn-primary flex-1 disabled:opacity-50">
                {saving ? 'Saving...' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Box Score Modal */}
      {viewBoxScore && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="ppl-card-glow w-full max-w-sm p-6">
            <h2 className="ppl-heading text-xl text-ppl-white mb-2">Box Score Submission</h2>
            <p className="text-ppl-gray text-sm mb-4">
              {viewBoxScore.homeTeamName} vs {viewBoxScore.awayTeamName}
            </p>
            <div className="flex flex-col gap-3">
              <a href={viewBoxScore.boxScoreUrl} target="_blank" rel="noreferrer"
                className="ppl-btn-secondary flex items-center justify-center gap-2">
                <ExternalLink size={14} /> View File
              </a>
              <button onClick={() => handleDeleteBoxScore(viewBoxScore)} className="ppl-btn-danger">
                Delete Submission
              </button>
              <button onClick={() => setViewBoxScore(null)} className="ppl-btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
