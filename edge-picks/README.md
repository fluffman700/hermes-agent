# EdgePicks

Mobile app for logging sports picks, tracking win rate, and monetizing a verified track record with tipster subscriptions.

> Demo product living under `edge-picks/` in this fork. It is **not** part of Hermes Agent core.

## What it does

- **Log picks** — sport, market, selection, American odds, units, optional notes
- **Settle results** — win / loss / push updates your win % and unit profit
- **Public vs private** — free picks prove the record; subscriber picks stay locked
- **Tipster leaderboard** — ranked by win %, subscriber count, or price
- **Subscriptions** — pay tipsters monthly to unlock their private card
- **Creator earnings** — MRR dashboard with an 80/20 creator/platform split (demo)

## Run it

```bash
cd edge-picks
npm install
npm run web      # browser (phone-width works great)
npm start       # Expo Go on a real phone
```

Requires Node 20+.

## Demo identity

You are **Alex Rivera** (`@alexedge`). Seed data includes other tipsters (Maya, Devon, Sofia, Kai) with different win rates and subscription prices. You already subscribe to Maya so you can see locked vs unlocked picks.

Use **Earn → Reset demo data** to restore the seed.

## Monetization model (product intent)

1. Tipsters post an honest, settleable track record
2. Some picks stay public for trust
3. Followers subscribe monthly for the private slate
4. Platform keeps 20%; tipster keeps 80%
5. Production next step: Stripe Billing + Connect (or RevenueCat) for real charges and payouts

This app does **not** place bets with sportsbooks. It is a pick-tracking and tipster marketplace.

## Stack

Expo (SDK 57) · React Native · Expo Router · TypeScript · AsyncStorage · Google Fonts (Bebas Neue, DM Sans)
