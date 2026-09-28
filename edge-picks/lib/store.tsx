import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { initialState } from './seed';
import { computeStats, creatorTakeHomeCents } from './stats';
import type {
  AppState,
  Pick,
  PickMarket,
  PickResult,
  Sport,
  Subscription,
  User,
} from './types';

const STORAGE_KEY = 'edge-picks/v1';

interface CreatePickInput {
  sport: Sport;
  event: string;
  market: PickMarket;
  selection: string;
  oddsAmerican: number;
  units: number;
  notes?: string;
  isPublic: boolean;
}

interface EdgeStore {
  ready: boolean;
  state: AppState;
  currentUser: User;
  myPicks: Pick[];
  myStats: ReturnType<typeof computeStats>;
  mySubscriptions: Subscription[];
  subscribedTipsterIds: Set<string>;
  tipstersRanked: Array<User & { stats: ReturnType<typeof computeStats> }>;
  createPick: (input: CreatePickInput) => void;
  settlePick: (pickId: string, result: Exclude<PickResult, 'pending'>) => void;
  subscribeToTipster: (tipsterId: string) => { ok: boolean; error?: string };
  cancelSubscription: (tipsterId: string) => void;
  updateTipsterPrice: (cents: number) => void;
  canViewPick: (pick: Pick) => boolean;
  picksForTipster: (tipsterId: string) => Pick[];
  statsForTipster: (tipsterId: string) => ReturnType<typeof computeStats>;
  earningsForCurrentUser: () => {
    activeSubscribers: number;
    mrrCents: number;
    takeHomeMrrCents: number;
    priceCents: number;
  };
  resetDemo: () => Promise<void>;
}

const Ctx = createContext<EdgeStore | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function EdgeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled) {
          setState(JSON.parse(raw) as AppState);
        }
      } catch {
        // keep seed
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? state.users[0],
    [state.users, state.currentUserId],
  );

  const myPicks = useMemo(
    () =>
      state.picks
        .filter((p) => p.tipsterId === currentUser.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.picks, currentUser.id],
  );

  const myStats = useMemo(() => computeStats(myPicks), [myPicks]);

  const mySubscriptions = useMemo(
    () =>
      state.subscriptions.filter(
        (s) => s.subscriberId === currentUser.id && s.status === 'active',
      ),
    [state.subscriptions, currentUser.id],
  );

  const subscribedTipsterIds = useMemo(
    () => new Set(mySubscriptions.map((s) => s.tipsterId)),
    [mySubscriptions],
  );

  const tipstersRanked = useMemo(() => {
    return state.users
      .filter((u) => u.isTipster)
      .map((u) => ({
        ...u,
        stats: computeStats(state.picks.filter((p) => p.tipsterId === u.id)),
      }))
      .sort((a, b) => {
        const ap = a.stats.winPct ?? -1;
        const bp = b.stats.winPct ?? -1;
        if (bp !== ap) return bp - ap;
        return b.stats.settled - a.stats.settled;
      });
  }, [state.users, state.picks]);

  const createPick = useCallback((input: CreatePickInput) => {
    setState((prev) => {
      const pick: Pick = {
        id: uid('p'),
        tipsterId: prev.currentUserId,
        sport: input.sport,
        event: input.event,
        market: input.market,
        selection: input.selection,
        oddsAmerican: input.oddsAmerican,
        units: input.units,
        notes: input.notes,
        result: 'pending',
        createdAt: new Date().toISOString(),
        isPublic: input.isPublic,
      };
      return { ...prev, picks: [pick, ...prev.picks] };
    });
  }, []);

  const settlePick = useCallback((pickId: string, result: Exclude<PickResult, 'pending'>) => {
    setState((prev) => ({
      ...prev,
      picks: prev.picks.map((p) =>
        p.id === pickId
          ? { ...p, result, settledAt: new Date().toISOString() }
          : p,
      ),
    }));
  }, []);

  const subscribeToTipster = useCallback(
    (tipsterId: string): { ok: boolean; error?: string } => {
      const tipster = state.users.find((u) => u.id === tipsterId);
      if (!tipster) return { ok: false, error: 'Tipster not found' };
      if (tipster.id === state.currentUserId) {
        return { ok: false, error: "You can't subscribe to yourself" };
      }
      if (subscribedTipsterIds.has(tipsterId)) {
        return { ok: false, error: 'Already subscribed' };
      }

      setState((prev) => {
        const sub: Subscription = {
          id: uid('s'),
          tipsterId,
          subscriberId: prev.currentUserId,
          priceCents: tipster.monthlyPriceCents,
          startedAt: new Date().toISOString(),
          status: 'active',
        };
        return {
          ...prev,
          subscriptions: [...prev.subscriptions, sub],
          users: prev.users.map((u) =>
            u.id === tipsterId
              ? { ...u, subscriberCount: u.subscriberCount + 1 }
              : u,
          ),
        };
      });
      return { ok: true };
    },
    [state.users, state.currentUserId, subscribedTipsterIds],
  );

  const cancelSubscription = useCallback((tipsterId: string) => {
    setState((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.map((s) =>
        s.tipsterId === tipsterId &&
        s.subscriberId === prev.currentUserId &&
        s.status === 'active'
          ? { ...s, status: 'canceled' }
          : s,
      ),
      users: prev.users.map((u) =>
        u.id === tipsterId
          ? { ...u, subscriberCount: Math.max(0, u.subscriberCount - 1) }
          : u,
      ),
    }));
  }, []);

  const updateTipsterPrice = useCallback((cents: number) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === prev.currentUserId
          ? { ...u, monthlyPriceCents: cents, isTipster: true }
          : u,
      ),
    }));
  }, []);

  const canViewPick = useCallback(
    (pick: Pick) => {
      if (pick.isPublic) return true;
      if (pick.tipsterId === currentUser.id) return true;
      return subscribedTipsterIds.has(pick.tipsterId);
    },
    [currentUser.id, subscribedTipsterIds],
  );

  const picksForTipster = useCallback(
    (tipsterId: string) =>
      state.picks
        .filter((p) => p.tipsterId === tipsterId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.picks],
  );

  const statsForTipster = useCallback(
    (tipsterId: string) => computeStats(picksForTipster(tipsterId)),
    [picksForTipster],
  );

  const earningsForCurrentUser = useCallback(() => {
    const active = state.subscriptions.filter(
      (s) => s.tipsterId === currentUser.id && s.status === 'active',
    );
    const mrrCents = active.reduce((sum, s) => sum + s.priceCents, 0);
    // Also reflect subscriberCount for demo fans without full user rows
    const implied =
      Math.max(currentUser.subscriberCount, active.length) * currentUser.monthlyPriceCents;
    const gross = Math.max(mrrCents, implied);
    return {
      activeSubscribers: Math.max(currentUser.subscriberCount, active.length),
      mrrCents: gross,
      takeHomeMrrCents: creatorTakeHomeCents(gross),
      priceCents: currentUser.monthlyPriceCents,
    };
  }, [state.subscriptions, currentUser]);

  const resetDemo = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  }, []);

  const value: EdgeStore = {
    ready,
    state,
    currentUser,
    myPicks,
    myStats,
    mySubscriptions,
    subscribedTipsterIds,
    tipstersRanked,
    createPick,
    settlePick,
    subscribeToTipster,
    cancelSubscription,
    updateTipsterPrice,
    canViewPick,
    picksForTipster,
    statsForTipster,
    earningsForCurrentUser,
    resetDemo,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEdge() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useEdge must be used within EdgeProvider');
  return ctx;
}
