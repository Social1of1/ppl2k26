'use client';
// src/components/team/TeamLayout.tsx
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { signOut } from '@/lib/auth';
import { LayoutDashboard, Upload, Calendar, Users, LogOut, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const teamNav = [
  { href: '/team/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/team/schedule', label: 'My Schedule', icon: Calendar },
  { href: '/team/upload', label: 'Upload Box Score', icon: Upload },
  { href: '/teams', label: 'All Teams', icon: Users },
];

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 flex-shrink-0 border-r border-ppl-black-border bg-ppl-black-soft flex flex-col fixed h-full z-40">
        <div className="p-5 border-b border-ppl-black-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-ppl-purple flex items-center justify-center">
              <Trophy size={16} className="text-white" />
            </div>
            <div>
              <p className="ppl-heading text-base text-white leading-none">{user?.teamName || 'Team'}</p>
              <p className="text-[10px] text-ppl-gray uppercase tracking-widest mt-0.5">PPL Season 1</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {teamNav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all',
                pathname === href
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
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ppl-gray hover:text-ppl-red hover:bg-ppl-red/10 transition-all"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-56 min-h-screen bg-ppl-black">
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
