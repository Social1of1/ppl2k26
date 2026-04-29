// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPct(made: number, att: number): string {
  if (att === 0) return '0.0%';
  return ((made / att) * 100).toFixed(1) + '%';
}

export function calcAvg(total: number, games: number): string {
  if (games === 0) return '0.0';
  return (total / games).toFixed(1);
}

export function calcWinPct(wins: number, losses: number): number {
  const gp = wins + losses;
  if (gp === 0) return 0;
  return wins / gp;
}

export function formatWinPct(wins: number, losses: number): string {
  return calcWinPct(wins, losses).toFixed(3).replace(/^0/, '');
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':');
  const date = new Date();
  date.setHours(+h, +m);
  return date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}
