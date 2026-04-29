'use client';
// src/app/admin/users/page.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { getTeams } from '@/lib/db';
import { Team } from '@/types';
import toast from 'react-hot-toast';
import { Plus, Info } from 'lucide-react';

interface CreateUserForm {
  email: string;
  password: string;
  role: 'admin' | 'team';
  teamId: string;
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateUserForm>({ email: '', password: '', role: 'team', teamId: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => { getTeams().then(setTeams); }, []);

  async function handleCreate() {
    if (!form.email || !form.password) return toast.error('Email and password required');
    if (form.role === 'team' && !form.teamId) return toast.error('Select a team');
    setSaving(true);
    try {
      const res = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('User account created');
      setShowModal(false);
      setForm({ email: '', password: '', role: 'team', teamId: '' });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="page-enter">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="ppl-heading text-3xl text-ppl-white">User Accounts</h1>
            <p className="text-ppl-gray text-sm mt-1">Manage team login credentials</p>
          </div>
          <button onClick={() => setShowModal(true)} className="ppl-btn-primary flex items-center gap-2">
            <Plus size={16} /> Create Account
          </button>
        </div>

        <div className="ppl-card p-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-ppl-purple/10 border border-ppl-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info size={16} className="text-ppl-purple-light" />
            </div>
            <div>
              <p className="text-ppl-white font-semibold mb-1">How User Accounts Work</p>
              <div className="text-ppl-gray text-sm space-y-1.5">
                <p>• Create one account per team using their email and a secure password.</p>
                <p>• Team accounts can only upload box scores for their own games and view the schedule.</p>
                <p>• The admin account has full control over teams, players, games, and stats.</p>
                <p>• Passwords are stored securely in Firebase Authentication.</p>
                <p>• Share login credentials directly with team managers.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="ppl-card-glow w-full max-w-sm p-6">
            <h2 className="ppl-heading text-xl text-ppl-white mb-5">Create User Account</h2>
            <div className="space-y-4">
              <div>
                <label className="ppl-label">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })} className="ppl-input">
                  <option value="team">Team Account</option>
                  <option value="admin">Admin Account</option>
                </select>
              </div>
              {form.role === 'team' && (
                <div>
                  <label className="ppl-label">Assign to Team</label>
                  <select value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })} className="ppl-input">
                    <option value="">Select team...</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="ppl-label">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="ppl-input" placeholder="team@ppl.gg" />
              </div>
              <div>
                <label className="ppl-label">Password</label>
                <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="ppl-input" placeholder="Minimum 8 characters" />
                <p className="text-xs text-ppl-gray/60 mt-1">Share this password directly with the team manager.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="ppl-btn-secondary flex-1">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="ppl-btn-primary flex-1 disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
