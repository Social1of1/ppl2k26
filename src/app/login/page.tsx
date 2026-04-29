'use client';
// src/app/login/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth';
import { Trophy, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await signIn(email, password);
      toast.success(`Welcome back, ${user.role === 'admin' ? 'Admin' : user.teamName}!`);
      router.push(user.role === 'admin' ? '/admin' : '/team/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ppl-black flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(124,58,237,0.1) 0%, #0A0A0F 60%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ppl-purple mb-4"
            style={{ boxShadow: '0 0 40px rgba(124,58,237,0.5)' }}>
            <Trophy size={28} className="text-white" />
          </div>
          <h1 className="ppl-heading text-3xl text-ppl-white">PPL Portal</h1>
          <p className="text-ppl-gray text-sm mt-1">Philippine Pro-Am League</p>
        </div>

        {/* Form */}
        <div className="ppl-card-glow p-7">
          <h2 className="ppl-subheading text-sm text-ppl-gray mb-6">Sign in to your account</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="ppl-label">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="ppl-input"
                placeholder="team@ppl.gg"
              />
            </div>
            <div>
              <label className="ppl-label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="ppl-input pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ppl-gray hover:text-ppl-white transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full ppl-btn-primary py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-ppl-gray/50 mt-6">
          Access is managed by the PPL administrator.
        </p>
      </div>
    </div>
  );
}
