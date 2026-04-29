// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'PPL — Philippine Pro-Am League | NBA 2K26',
  description: 'The official platform for the Philippine Pro-Am League — NBA 2K26 esports competition.',
  keywords: ['NBA 2K26', 'esports', 'Philippines', 'Pro-Am League', 'basketball'],
  openGraph: {
    title: 'PPL — Philippine Pro-Am League',
    description: 'Official NBA 2K26 esports league platform',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1A1A24',
                color: '#F8F8FF',
                border: '1px solid #2A2A38',
                borderRadius: '8px',
                fontFamily: 'Barlow, sans-serif',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
