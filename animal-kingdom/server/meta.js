/** Biomes + progression ranks. */

export const BIOMES = [
  { id: "savanna", name: "Savanna", color: "#c2a66a", forage: 1.15, cover: 0.2, water: 0.15 },
  { id: "woodland", name: "Woodland", color: "#3d5c3a", forage: 1.05, cover: 0.7, water: 0.2 },
  { id: "wetland", name: "Wetland", color: "#2f5e4e", forage: 0.85, cover: 0.4, water: 0.95 },
  { id: "ridge", name: "Ridge", color: "#6b6358", forage: 0.5, cover: 0.35, water: 0.05 },
  { id: "scrub", name: "Scrub", color: "#a89060", forage: 0.75, cover: 0.45, water: 0.1 },
  { id: "floodplain", name: "Floodplain", color: "#6a8a4a", forage: 1.25, cover: 0.3, water: 0.55 },
  { id: "forest", name: "Forest", color: "#1f3d2a", forage: 0.95, cover: 0.85, water: 0.25 },
  { id: "riverine", name: "Riverine", color: "#3a6a5a", forage: 0.9, cover: 0.5, water: 0.85 },
];

const BY_ID = Object.fromEntries(BIOMES.map((b) => [b.id, b]));

export function biomeAt(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;
  const n =
    Math.sin(nx * 5.8 + ny * 2.4) * 0.4 +
    Math.sin(nx * 13.0 - ny * 8.5) * 0.25 +
    Math.sin((nx + ny) * 3.2) * 0.2 +
    Math.sin(nx * 22.0 + ny * 17.0) * 0.15;

  if (ny > 0.78) return BY_ID.wetland;
  if (ny > 0.68 && n > -0.15) return BY_ID.riverine;
  if (nx > 0.72 && ny > 0.35 && ny < 0.7) return BY_ID.floodplain;
  if (ny < 0.22 && n > -0.1) return BY_ID.forest;
  if (n > 0.45) return BY_ID.ridge;
  if (n > 0.2) return BY_ID.woodland;
  if (n < -0.35) return BY_ID.scrub;
  return BY_ID.savanna;
}

export const RANKS = [
  { id: "juvenile", name: "Juvenile", xp: 0, powerMul: 0.85, territoryR: 140, packSlots: 2, label: "Learning the range" },
  { id: "adult", name: "Adult", xp: 120, powerMul: 1.0, territoryR: 200, packSlots: 4, label: "Established hunter" },
  { id: "prime", name: "Prime", xp: 350, powerMul: 1.12, territoryR: 280, packSlots: 6, label: "Peak of the bloodline" },
  { id: "legend", name: "Legend", xp: 800, powerMul: 1.25, territoryR: 360, packSlots: 8, label: "Spoken of across biomes" },
  { id: "mythic", name: "Mythic", xp: 1600, powerMul: 1.4, territoryR: 450, packSlots: 10, label: "Apex of the age" },
];

export function rankForXp(xp) {
  let rank = RANKS[0];
  for (const r of RANKS) if (xp >= r.xp) rank = r;
  return rank;
}

export function nextRank(xp) {
  for (const r of RANKS) if (xp < r.xp) return r;
  return null;
}

export function xpProgress(xp) {
  const cur = rankForXp(xp);
  const nxt = nextRank(xp);
  if (!nxt) return { cur, nxt: null, pct: 1, into: 0, need: 0 };
  const into = xp - cur.xp;
  const need = nxt.xp - cur.xp;
  return { cur, nxt, pct: into / need, into, need };
}
