'use client';
// src/app/admin/players/page.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { getPlayers, getTeams } from '@/lib/db';
import { Player, Team } from '@/types';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Plus, Trash2, Search } from 'lucide-react';
import { calcAvg } from '@/lib/utils';

interface PlayerForm {
  name: string;
  number: string;
  position: string;
  teamId: string;
}

const EMPTY_FORM: PlayerForm = { name: '', number: '', position: 'PG', teamId: '' };
const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

export default function AdminPlayersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<PlayerForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/login');
  }, [user, authLoading, router]);

  async function load() {
    const [p, t] = await Promise.all([getPlayers(), getTeams()]);
    setPlayers(p); setTeams(t); setLoading(false);
  }

  useEffect(() => { if (user?.role === 'admin') load(); }, [user]);

  async function handleSave() {
    if (!form.name || !form.teamId) return toast.error('Name and team required');
    setSaving(true);
    try {
      const team = teams.find(t => t.id === form.teamId)!;
      await addDoc(collection(db, 'players'), {
        ...form,
        teamName: team.name,
        gamesPlayed: 0,
        totalPoints: 0, totalRebounds: 0, totalAssists: 0,
        totalSteals: 0, totalBlocks: 0, totalFouls: 0, totalTurnovers: 0,
        totalFgm: 0, totalFga: 0, total3pm: 0, total3pa: 0, totalFtm: 0, totalFta: 0,
      });
      toast.success('Player added');
      setShowModal(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Player) {
    if (!confirm(`Remove ${p.name} from roster?`)) return;
    await deleteDoc(doc(db, 'players', p.id));
    toast.success('Player removed');
    load();
  }

  const filtered = players
    .filter(p => teamFilter ? p.teamId === teamFilter : true)
    .filter(p => search ? p.name.toLowerCase().includes(search.toLowerCase()) : true);

  return (
    <AdminLayout>
      <div className="page-enter">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="ppl-heading text-3xl text-ppl-white">Players</h1>
            <p className="text-ppl-gray text-sm mt-1">{players.length} players registered</p>
          </div>
          <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}
            className="ppl-btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Player
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ppl-gray" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="ppl-input pl-9" placeholder="Search players..." />
          </div>
          <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} className="ppl-input sm:w-48">
            <option value="">All Teams</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="ppl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ppl-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Position</th>
                  <th>Team</th>
                  <th className="text-center">GP</th>
                  <th className="text-center">PPG</th>
                  <th className="text-center">RPG</th>
                  <th className="text-center">APG</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-8 text-ppl-gray">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-ppl-gray">No players found</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id}>
                    <td className="text-ppl-gray font-mono text-xs">{p.number}</td>
                    <td className="font-semibold text-ppl-white">{p.name}</td>
                    <td>
                      <span className="ppl-badge bg-ppl-black-border text-ppl-gray border border-ppl-black-border text-xs">
                        {p.position}
                      </span>
                    </td>
                    <td className="text-ppl-gray text-sm">{p.teamName}</td>
                    <td className="text-center ppl-stat-value">{p.gamesPlayed}</td>
                    <td className="text-center ppl-stat-value text-ppl-purple-light">{calcAvg(p.totalPoints, p.gamesPlayed)}</td>
                    <td className="text-center ppl-stat-value">{calcAvg(p.totalRebounds, p.gamesPlayed)}</td>
                    <td className="text-center ppl-stat-value">{calcAvg(p.totalAssists, p.gamesPlayed)}</td>
                    <td>
                      <div className="flex justify-end">
                        <button onClick={() => handleDelete(p)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="ppl-card-glow w-full max-w-sm p-6">
            <h2 className="ppl-heading text-xl text-ppl-white mb-5">Add Player</h2>
            <div className="space-y-4">
              <div>
                <label className="ppl-label">Team</label>
                <select value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })} className="ppl-input">
                  <option value="">Select team...</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="ppl-label">Player Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="ppl-input" placeholder="Full name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ppl-label">Jersey #</label>
                  <input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })}
                    className="ppl-input" placeholder="00" />
                </div>
                <div>
                  <label className="ppl-label">Position</label>
                  <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="ppl-input">
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="ppl-btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="ppl-btn-primary flex-1 disabled:opacity-50">
                {saving ? 'Adding...' : 'Add Player'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
