// src/components/layout/Footer.tsx
import Link from 'next/link';
import { Trophy } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-ppl-black-border bg-ppl-black-soft mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-ppl-purple flex items-center justify-center">
                <Trophy size={16} className="text-white" />
              </div>
              <span className="ppl-heading text-lg text-white">PPL</span>
            </div>
            <p className="text-ppl-gray text-sm leading-relaxed">
              The Philippine Pro-Am League is the premier NBA 2K26 esports competition in the Philippines.
            </p>
          </div>
          <div>
            <h4 className="ppl-subheading text-sm text-ppl-white mb-4">Navigate</h4>
            <div className="space-y-2">
              {[['/', 'Home'], ['/standings', 'Standings'], ['/teams', 'Teams'], ['/schedule', 'Schedule'], ['/stats', 'Stats']].map(([href, label]) => (
                <Link key={href} href={href} className="block text-sm text-ppl-gray hover:text-ppl-white transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="ppl-subheading text-sm text-ppl-white mb-4">League</h4>
            <div className="space-y-2 text-sm text-ppl-gray">
              <p>Season 1 — NBA 2K26</p>
              <p>Group A &amp; Group B Format</p>
              <p>Philippines</p>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-ppl-black-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-ppl-gray/60">
            © {new Date().getFullYear()} Philippine Pro-Am League. All rights reserved.
          </p>
          <p className="text-xs text-ppl-gray/40">NBA 2K26 esports platform</p>
        </div>
      </div>
    </footer>
  );
}
