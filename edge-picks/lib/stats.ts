import type { Pick, PickResult } from './types';

export interface TipsterStats {
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
  settled: number;
  winPct: number | null;
  unitsNet: number;
  streak: string;
}

function americanToProfit(odds: number, units: number, result: PickResult): number {
  if (result === 'push' || result === 'pending') return 0;
  if (result === 'loss') return -units;
  if (odds > 0) return units * (odds / 100);
  return units * (100 / Math.abs(odds));
}

export function computeStats(picks: Pick[]): TipsterStats {
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let pending = 0;
  let unitsNet = 0;

  const settledOrdered = [...picks]
    .filter((p) => p.result !== 'pending')
    .sort((a, b) => (a.settledAt || a.createdAt).localeCompare(b.settledAt || b.createdAt));

  for (const p of picks) {
    if (p.result === 'win') wins += 1;
    else if (p.result === 'loss') losses += 1;
    else if (p.result === 'push') pushes += 1;
    else pending += 1;
    unitsNet += americanToProfit(p.oddsAmerican, p.units, p.result);
  }

  const decided = wins + losses;
  const winPct = decided === 0 ? null : (wins / decided) * 100;

  // Streak from most recent settled non-push
  let streak = '—';
  const recent = [...settledOrdered].reverse().filter((p) => p.result === 'win' || p.result === 'loss');
  if (recent.length) {
    const kind = recent[0].result;
    let count = 0;
    for (const p of recent) {
      if (p.result !== kind) break;
      count += 1;
    }
    streak = `${count}${kind === 'win' ? 'W' : 'L'}`;
  }

  return {
    wins,
    losses,
    pushes,
    pending,
    settled: wins + losses + pushes,
    winPct,
    unitsNet: Math.round(unitsNet * 100) / 100,
    streak,
  };
}

export function formatOdds(american: number): string {
  return american > 0 ? `+${american}` : `${american}`;
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatWinPct(pct: number | null): string {
  if (pct === null) return '—';
  return `${pct.toFixed(1)}%`;
}

export function formatUnits(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}u`;
}

export function platformFeeRate(): number {
  return 0.2;
}

export function creatorTakeHomeCents(grossCents: number): number {
  return Math.round(grossCents * (1 - platformFeeRate()));
}
