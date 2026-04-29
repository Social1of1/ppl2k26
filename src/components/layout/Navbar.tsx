'use client';
// src/components/layout/Navbar.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { signOut } from '@/lib/auth';
import { Menu, X, Trophy, LogOut, Settings, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/standings', label: 'Standings' },
  { href: '/teams', label: 'Teams' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/stats', label: 'Stats' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    window.location.href = '/login';
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-ppl-black-border"
      style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-ppl-purple flex items-center justify-center"
              style={{ boxShadow: '0 0 16px rgba(124,58,237,0.5)' }}>
              <Trophy size={18} className="text-white" />
            </div>
            <div>
              <span className="ppl-heading text-xl text-white">PPL</span>
              <span className="hidden sm:block text-[10px] text-ppl-gray tracking-widest uppercase font-semibold -mt-0.5">
                Pro-Am League
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200',
                  'font-display uppercase',
                  pathname === link.href
                    ? 'bg-ppl-purple/20 text-ppl-purple-light'
                    : 'text-ppl-gray hover:text-ppl-white hover:bg-white/5'
                )}
                style={{ fontFamily: 'var(--font-display)' }}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link href={user.role === 'admin' ? '/admin' : '/team/dashboard'}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ppl-black-card border border-ppl-black-border hover:border-ppl-purple/50 transition-all text-sm">
                  {user.role === 'admin'
                    ? <Shield size={14} className="text-ppl-purple-light" />
                    : <Settings size={14} className="text-ppl-gray" />}
                  <span className="text-ppl-white text-xs font-semibold" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {user.role === 'admin' ? 'Admin' : user.teamName}
                  </span>
                </Link>
                <button onClick={handleSignOut}
                  className="p-2 rounded-lg text-ppl-gray hover:text-ppl-red transition-colors">
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link href="/login" className="ppl-btn-primary text-sm py-2 px-5">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-ppl-gray" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-ppl-black-border bg-ppl-black-soft px-4 py-3 space-y-1">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'block px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all',
                pathname === link.href
                  ? 'bg-ppl-purple/20 text-ppl-purple-light'
                  : 'text-ppl-gray hover:text-ppl-white'
              )}
              style={{ fontFamily: 'var(--font-display)' }}>
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-ppl-black-border">
            {user ? (
              <div className="space-y-1">
                <Link href={user.role === 'admin' ? '/admin' : '/team/dashboard'}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm text-ppl-gray hover:text-ppl-white">
                  Dashboard
                </Link>
                <button onClick={handleSignOut}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-ppl-red">
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="block ppl-btn-primary text-center text-sm py-2">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
