'use client';
// src/app/admin/teams/page.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { getTeams } from '@/lib/db';
import { Team, Group } from '@/types';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatWinPct } from '@/lib/utils';

interface TeamForm {
  name: string;
  abbreviation: string;
  group: Group;
  logoUrl: string;
}

const EMPTY_FORM: TeamForm = { name: '', abbreviation: '', group: 'A', logoUrl: '' };

export default function AdminTeamsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [form, setForm] = useState<TeamForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/login');
  }, [user, authLoading, router]);

  async function loadTeams() {
    const t = await getTeams();
    setTeams(t);
    setLoading(false);
  }

  useEffect(() => { if (user?.role === 'admin') loadTeams(); }, [user]);

  function openAdd() {
    setEditTeam(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(t: Team) {
    setEditTeam(t);
    setForm({ name: t.name, abbreviation: t.abbreviation, group: t.group, logoUrl: t.logoUrl || '' });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.abbreviation) return toast.error('Name and abbreviation required');
    setSaving(true);
    try {
      if (editTeam) {
        await updateDoc(doc(db, 'teams', editTeam.id), { ...form });
        toast.success('Team updated');
      } else {
        await addDoc(collection(db, 'teams'), {
          ...form, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, createdAt: new Date().toISOString(),
        });
        toast.success('Team created');
      }
      setShowModal(false);
      loadTeams();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(team: Team) {
    if (!confirm(`Delete ${team.name}? This cannot be undone.`)) return;
    await deleteDoc(doc(db, 'teams', team.id));
    toast.success('Team deleted');
    loadTeams();
  }

  return (
    <AdminLayout>
      <div className="page-enter">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="ppl-heading text-3xl text-ppl-white">Teams</h1>
            <p className="text-ppl-gray text-sm mt-1">{teams.length} teams registered</p>
          </div>
          <button onClick={openAdd} className="ppl-btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Team
          </button>
        </div>

        {/* Group filter tabs */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {(['A', 'B'] as const).map(group => {
            const groupTeams = teams.filter(t => t.group === group);
            return (
              <div key={group}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={cn('ppl-badge text-sm px-3', group === 'A' ? 'ppl-badge-group-a' : 'ppl-badge-group-b')}>
                    Group {group}
                  </span>
                  <span className="text-ppl-gray text-sm">{groupTeams.length} teams</span>
                </div>
                <div className="ppl-card overflow-hidden">
                  {loading ? (
                    <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 rounded" />)}</div>
                  ) : groupTeams.length === 0 ? (
                    <div className="p-8 text-center text-ppl-gray text-sm">No teams in Group {group}</div>
                  ) : (
                    <table className="ppl-table">
                      <thead>
                        <tr>
                          <th>Team</th>
                          <th>Abbr</th>
                          <th className="text-center">W</th>
                          <th className="text-center">L</th>
                          <th className="text-center">PCT</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupTeams.map(t => (
                          <tr key={t.id}>
                            <td className="font-semibold text-ppl-white">{t.name}</td>
                            <td className="text-ppl-gray font-mono text-xs">{t.abbreviation}</td>
                            <td className="text-center ppl-stat-value text-ppl-green">{t.wins}</td>
                            <td className="text-center ppl-stat-value text-ppl-red">{t.losses}</td>
                            <td className="text-center ppl-stat-value text-xs">{formatWinPct(t.wins, t.losses)}</td>
                            <td className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => openEdit(t)}
                                  className="p-1.5 rounded text-ppl-gray hover:text-ppl-white hover:bg-white/10 transition-colors">
                                  <Pencil size={13} />
                                </button>
                                <button onClick={() => handleDelete(t)}
                                  className="p-1.5 rounded text-ppl-gray hover:text-ppl-red hover:bg-ppl-red/10 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="ppl-card-glow w-full max-w-md p-6">
            <h2 className="ppl-heading text-xl text-ppl-white mb-5">
              {editTeam ? 'Edit Team' : 'Add New Team'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="ppl-label">Team Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="ppl-input" placeholder="e.g. Manila Monarchs" />
              </div>
              <div>
                <label className="ppl-label">Abbreviation</label>
                <input value={form.abbreviation} onChange={e => setForm({ ...form, abbreviation: e.target.value.toUpperCase().slice(0, 4) })}
                  className="ppl-input" placeholder="e.g. MNL" maxLength={4} />
              </div>
              <div>
                <label className="ppl-label">Group</label>
                <select value={form.group} onChange={e => setForm({ ...form, group: e.target.value as Group })}
                  className="ppl-input">
                  <option value="A">Group A</option>
                  <option value="B">Group B</option>
                </select>
              </div>
              <div>
                <label className="ppl-label">Logo URL (optional)</label>
                <input value={form.logoUrl} onChange={e => setForm({ ...form, logoUrl: e.target.value })}
                  className="ppl-input" placeholder="https://..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="ppl-btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="ppl-btn-primary flex-1 disabled:opacity-50">
                {saving ? 'Saving...' : editTeam ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
