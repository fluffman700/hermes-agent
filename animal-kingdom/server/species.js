/**
 * Lifechain species — top 5 playable titans + prey wildlife.
 */

function derivePower({ massKg, biteForce, speed, armor, weaponBonus = 1 }) {
  const base =
    Math.pow(massKg, 0.45) *
    biteForce *
    (1 + armor * 0.35) *
    (0.7 + speed * 0.3) *
    weaponBonus;
  return Math.round(base * 150) / 10;
}

/**
 * @typedef {'herbivore'|'omnivore'|'carnivore'} Diet
 * @typedef {'prey'|'apex'|'megaherbivore'} Guild
 * @typedef {'pride'|'herd'|'solitary'} Social
 */

/** @type {Record<string, any>} */
export const SPECIES = {
  crocodile: {
    id: "crocodile",
    name: "Nile Crocodile",
    scientific: "Crocodylus niloticus",
    diet: "carnivore",
    guild: "apex",
    social: "solitary",
    playable: true,
    trophic: 4.0,
    massKg: 400,
    biteForce: 1.7,
    speed: 0.45,
    armor: 0.85,
    stamina: 0.7,
    hungerRate: 0.55,
    thirstRate: 0.35,
    attackRange: 52,
    attackCooldown: 0.85,
    packBonus: 0.06,
    territoryMul: 1.35,
    forageYield: 0,
    favoredBiomes: ["wetland", "floodplain", "riverine"],
    color: "#3f5a3a",
    accent: "#1e2a1a",
    silhouette: "croc",
    description: "Waterline ambush titan. Slow on land, absolute at the bank.",
    preyHint: "Claim river banks. Death-roll drinkers.",
    packLabel: "Bask",
    weaponBonus: 1.35,
  },
  elephant: {
    id: "elephant",
    name: "African Elephant",
    scientific: "Loxodonta africana",
    diet: "herbivore",
    guild: "megaherbivore",
    social: "herd",
    playable: true,
    trophic: 2.0,
    massKg: 4500,
    biteForce: 0.5,
    speed: 0.4,
    armor: 0.95,
    stamina: 0.9,
    hungerRate: 1.35,
    thirstRate: 1.25,
    attackRange: 60,
    attackCooldown: 0.9,
    packBonus: 0.18,
    territoryMul: 1.15,
    forageYield: 1.55,
    favoredBiomes: ["woodland", "savanna", "floodplain"],
    color: "#6e6e6e",
    accent: "#3a3a3a",
    silhouette: "elephant",
    description: "Keystone megafauna. Herd memory and mass rewrite the map.",
    preyHint: "Browse constantly. Defend with the herd.",
    packLabel: "Herd",
    weaponBonus: 1.1,
  },
  bear: {
    id: "bear",
    name: "Brown Bear",
    scientific: "Ursus arctos",
    diet: "omnivore",
    guild: "apex",
    social: "solitary",
    playable: true,
    trophic: 3.9,
    massKg: 270,
    biteForce: 1.45,
    speed: 0.7,
    armor: 0.55,
    stamina: 0.95,
    hungerRate: 1.15,
    thirstRate: 0.9,
    attackRange: 48,
    attackCooldown: 0.58,
    packBonus: 0.04,
    territoryMul: 1.4,
    forageYield: 0.9,
    favoredBiomes: ["forest", "ridge", "riverine"],
    color: "#5c4033",
    accent: "#1a1008",
    silhouette: "bear",
    description: "Solitary powerhouse. Berries, fish, and contested carcasses.",
    preyHint: "Own a forest range. Bully mid-tier off kills.",
    packLabel: "Range",
    weaponBonus: 1.3,
  },
  lion: {
    id: "lion",
    name: "Lion",
    scientific: "Panthera leo",
    diet: "carnivore",
    guild: "apex",
    social: "pride",
    playable: true,
    trophic: 4.2,
    massKg: 190,
    biteForce: 1.6,
    speed: 0.82,
    armor: 0.4,
    stamina: 0.85,
    hungerRate: 0.9,
    thirstRate: 0.85,
    attackRange: 50,
    attackCooldown: 0.52,
    packBonus: 0.32,
    territoryMul: 1.2,
    forageYield: 0,
    favoredBiomes: ["savanna", "scrub", "floodplain"],
    color: "#d4a017",
    accent: "#5c4033",
    silhouette: "felid",
    description: "Pride apex of the plains. Territory and cooperation are the weapons.",
    preyHint: "Hunt with the pride. Hold open country.",
    packLabel: "Pride",
    weaponBonus: 1.35,
  },
  buffalo: {
    id: "buffalo",
    name: "Cape Buffalo",
    scientific: "Syncerus caffer",
    diet: "herbivore",
    guild: "megaherbivore",
    social: "herd",
    playable: true,
    trophic: 2.2,
    massKg: 700,
    biteForce: 0.7,
    speed: 0.55,
    armor: 0.75,
    stamina: 1.0,
    hungerRate: 1.2,
    thirstRate: 1.1,
    attackRange: 48,
    attackCooldown: 0.7,
    packBonus: 0.28,
    territoryMul: 1.1,
    forageYield: 1.35,
    favoredBiomes: ["savanna", "floodplain", "scrub"],
    color: "#2f2f2f",
    accent: "#8b0000",
    silhouette: "buffalo",
    description: "Horned fortress. In a herd, nearly untouchable.",
    preyHint: "Graze the flats. Form a wall when threatened.",
    packLabel: "Herd",
    weaponBonus: 1.2,
  },

  // Prey NPCs
  rabbit: {
    id: "rabbit",
    name: "European Rabbit",
    scientific: "Oryctolagus cuniculus",
    diet: "herbivore",
    guild: "prey",
    social: "herd",
    playable: false,
    trophic: 2.0,
    massKg: 2,
    biteForce: 0.35,
    speed: 0.92,
    armor: 0.05,
    stamina: 1.15,
    hungerRate: 1.4,
    thirstRate: 1.2,
    attackRange: 28,
    attackCooldown: 0.45,
    packBonus: 0.08,
    territoryMul: 0.8,
    forageYield: 1.0,
    favoredBiomes: ["scrub", "savanna"],
    color: "#c4a574",
    accent: "#8b6914",
    silhouette: "rabbit",
    description: "Prey.",
    preyHint: "Graze and flee.",
    packLabel: "Warren",
    weaponBonus: 0.6,
  },
  impala: {
    id: "impala",
    name: "Impala",
    scientific: "Aepyceros melampus",
    diet: "herbivore",
    guild: "prey",
    social: "herd",
    playable: false,
    trophic: 2.1,
    massKg: 50,
    biteForce: 0.55,
    speed: 0.95,
    armor: 0.15,
    stamina: 1.2,
    hungerRate: 1.1,
    thirstRate: 1.15,
    attackRange: 36,
    attackCooldown: 0.55,
    packBonus: 0.12,
    territoryMul: 0.9,
    forageYield: 1.15,
    favoredBiomes: ["savanna", "woodland", "scrub"],
    color: "#b87333",
    accent: "#5c3317",
    silhouette: "antelope",
    description: "Ungulate prey.",
    preyHint: "Browse and flee.",
    packLabel: "Herd",
    weaponBonus: 0.85,
  },
  warthog: {
    id: "warthog",
    name: "Warthog",
    scientific: "Phacochoerus africanus",
    diet: "omnivore",
    guild: "prey",
    social: "herd",
    playable: false,
    trophic: 2.3,
    massKg: 80,
    biteForce: 0.9,
    speed: 0.72,
    armor: 0.4,
    stamina: 0.95,
    hungerRate: 1.05,
    thirstRate: 1.0,
    attackRange: 40,
    attackCooldown: 0.6,
    packBonus: 0.1,
    territoryMul: 0.95,
    forageYield: 0.95,
    favoredBiomes: ["savanna", "scrub", "floodplain"],
    color: "#6b5344",
    accent: "#3d2b1f",
    silhouette: "boar",
    description: "Tusky mid-prey.",
    preyHint: "Root and flee.",
    packLabel: "Sounder",
    weaponBonus: 1.15,
  },
  zebra: {
    id: "zebra",
    name: "Plains Zebra",
    scientific: "Equus quagga",
    diet: "herbivore",
    guild: "prey",
    social: "herd",
    playable: false,
    trophic: 2.15,
    massKg: 300,
    biteForce: 0.6,
    speed: 0.88,
    armor: 0.3,
    stamina: 1.15,
    hungerRate: 1.15,
    thirstRate: 1.1,
    attackRange: 40,
    attackCooldown: 0.6,
    packBonus: 0.2,
    territoryMul: 0.95,
    forageYield: 1.2,
    favoredBiomes: ["savanna", "floodplain", "scrub"],
    color: "#e8e4dc",
    accent: "#1a1a1a",
    silhouette: "antelope",
    description: "Harder ungulate prey.",
    preyHint: "Graze in numbers.",
    packLabel: "Herd",
    weaponBonus: 0.9,
  },
};

for (const sp of Object.values(SPECIES)) {
  sp.combatPower = derivePower(sp);
}

export function canHunt(attacker, defender) {
  if (!attacker || !defender || attacker.id === defender.id) return false;
  if (defender.guild === "megaherbivore" && attacker.guild !== "apex") {
    return attacker.combatPower * 1.8 >= defender.combatPower;
  }
  if (attacker.diet === "herbivore") return false;
  const ratio = attacker.combatPower / Math.max(1, defender.combatPower);
  if (defender.trophic < attacker.trophic - 0.4) return ratio >= 0.55;
  if (defender.trophic <= attacker.trophic) return ratio >= 0.85;
  return ratio >= 1.25;
}

export function canScavenge(s) {
  return s.diet === "carnivore" || s.diet === "omnivore";
}

export function canForage(s) {
  return s.diet === "herbivore" || s.diet === "omnivore";
}

export function strikeDamage(attacker, staminaFrac = 1, packCount = 1) {
  const pack = 1 + attacker.packBonus * Math.max(0, packCount - 1);
  const staminaMod = 0.55 + 0.45 * Math.max(0.15, staminaFrac);
  return attacker.combatPower * 0.048 * pack * staminaMod;
}

export const SPECIES_LIST = Object.values(SPECIES).sort(
  (a, b) => a.combatPower - b.combatPower
);

export const PLAYABLE = SPECIES_LIST.filter((s) => s.playable).sort(
  (a, b) => b.combatPower - a.combatPower
);

export const WORLD = {
  width: 5600,
  height: 3800,
  tickMs: 50,
  dayLengthSec: 480,
};
