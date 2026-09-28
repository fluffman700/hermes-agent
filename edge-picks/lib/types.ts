export type Sport =
  | 'NFL'
  | 'NBA'
  | 'MLB'
  | 'NHL'
  | 'Soccer'
  | 'NCAAF'
  | 'NCAAB'
  | 'UFC';

export type PickResult = 'pending' | 'win' | 'loss' | 'push';

export type PickMarket =
  | 'moneyline'
  | 'spread'
  | 'total'
  | 'prop';

export interface User {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarColor: string;
  isTipster: boolean;
  monthlyPriceCents: number;
  subscriberCount: number;
  verified: boolean;
}

export interface Pick {
  id: string;
  tipsterId: string;
  sport: Sport;
  event: string;
  market: PickMarket;
  selection: string;
  oddsAmerican: number;
  units: number;
  notes?: string;
  result: PickResult;
  createdAt: string;
  settledAt?: string;
  /** Free picks are visible without a subscription */
  isPublic: boolean;
}

export interface Subscription {
  id: string;
  tipsterId: string;
  subscriberId: string;
  priceCents: number;
  startedAt: string;
  status: 'active' | 'canceled';
}

export interface AppState {
  currentUserId: string;
  users: User[];
  picks: Pick[];
  subscriptions: Subscription[];
}

export const SPORTS: Sport[] = [
  'NFL',
  'NBA',
  'MLB',
  'NHL',
  'Soccer',
  'NCAAF',
  'NCAAB',
  'UFC',
];

export const MARKETS: { id: PickMarket; label: string }[] = [
  { id: 'moneyline', label: 'Moneyline' },
  { id: 'spread', label: 'Spread' },
  { id: 'total', label: 'Total' },
  { id: 'prop', label: 'Prop' },
];
