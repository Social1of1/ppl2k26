'use client';
// src/components/admin/AdminLayout.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Shield, Users, Calendar, BarChart3, LogOut, Trophy, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/teams', label: 'Teams', icon: Shield },
  { href: '/admin/players', label: 'Players', icon: Users },
  { href: '/admin/games', label: 'Games', icon: Calendar },
  { href: '/admin/users', label: 'User Accounts', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-ppl-black-border bg-ppl-black-soft flex flex-col fixed h-full z-40">
        <div className="p-5 border-b border-ppl-black-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-ppl-purple flex items-center justify-center"
              style={{ boxShadow: '0 0 12px rgba(124,58,237,0.4)' }}>
              <Trophy size={16} className="text-white" />
            </div>
            <div>
              <p className="ppl-heading text-base text-white">PPL Admin</p>
              <p className="text-[10px] text-ppl-gray uppercase tracking-widest">Control Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {adminNav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all',
                (pathname === href || (href !== '/admin' && pathname.startsWith(href)))
                  ? 'bg-ppl-purple/20 text-ppl-purple-light'
                  : 'text-ppl-gray hover:text-ppl-white hover:bg-white/5'
              )}
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-ppl-black-border">
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-ppl-purple/20 border border-ppl-purple/30 flex items-center justify-center">
              <Shield size={12} className="text-ppl-purple-light" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ppl-white truncate">{user?.email}</p>
              <p className="text-[10px] text-ppl-gray uppercase tracking-wider">Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ppl-gray hover:text-ppl-red hover:bg-ppl-red/10 transition-all"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen bg-ppl-black">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
