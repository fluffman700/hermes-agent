/**
 * Lifechain species catalog — trophic roles, diets, and power scaling.
 *
 * combatPower is derived from:
 *   mass^0.45 * bite * (1 + armor*0.35) * (0.7 + speed*0.3) * weaponBonus
 * so heavier apex hunters dominate, but speed/weaponry still matter.
 */

function derivePower({ massKg, biteForce, speed, armor, weaponBonus = 1 }) {
  const base =
    Math.pow(massKg, 0.45) *
    biteForce *
    (1 + armor * 0.35) *
    (0.7 + speed * 0.3) *
    weaponBonus;
  // Scale into readable MMO combat ratings (rabbit ~4, lion ~280, elephant ~300+)
  return Math.round(base * 150) / 10;
}

/** @typedef {'herbivore'|'omnivore'|'carnivore'} Diet */
/** @typedef {'prey'|'mesopredator'|'apex'|'megaherbivore'} Guild */

/**
 * @type {Record<string, {
 *   id: string, name: string, scientific: string, diet: Diet, guild: Guild,
 *   trophic: number, massKg: number, biteForce: number, speed: number,
 *   armor: number, stamina: number, hungerRate: number, thirstRate: number,
 *   attackRange: number, attackCooldown: number, packBonus: number,
 *   forageYield: number, color: string, accent: string, silhouette: string,
 *   description: string, preyHint: string, combatPower: number, weaponBonus?: number
 * }>}
 */
export const SPECIES = {
  rabbit: {
    id: "rabbit",
    name: "European Rabbit",
    scientific: "Oryctolagus cuniculus",
    diet: "herbivore",
    guild: "prey",
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
    forageYield: 1.0,
    color: "#c4a574",
    accent: "#8b6914",
    silhouette: "rabbit",
    description: "Fast, fragile, and always hungry. Survive by vigilance and cover.",
    preyHint: "Graze grasses. Flee everything with teeth.",
    weaponBonus: 0.6,
  },
  impala: {
    id: "impala",
    name: "Impala",
    scientific: "Aepyceros melampus",
    diet: "herbivore",
    guild: "prey",
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
    forageYield: 1.15,
    color: "#b87333",
    accent: "#5c3317",
    silhouette: "antelope",
    description: "Agile browser of the open veld. Safety is in the herd.",
    preyHint: "Browse shrubs. Kick only as a last resort.",
    weaponBonus: 0.85,
  },
  warthog: {
    id: "warthog",
    name: "Warthog",
    scientific: "Phacochoerus africanus",
    diet: "omnivore",
    guild: "prey",
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
    forageYield: 0.95,
    color: "#6b5344",
    accent: "#3d2b1f",
    silhouette: "boar",
    description: "Tusks and stubbornness. Roots for tubers, scavenges when desperate.",
    preyHint: "Root and scavenge. Charge when cornered.",
    weaponBonus: 1.15,
  },
  jackal: {
    id: "jackal",
    name: "Black-backed Jackal",
    scientific: "Lupulella mesomelas",
    diet: "omnivore",
    guild: "mesopredator",
    trophic: 3.2,
    massKg: 10,
    biteForce: 1.05,
    speed: 0.88,
    armor: 0.2,
    stamina: 1.1,
    hungerRate: 1.2,
    thirstRate: 1.05,
    attackRange: 38,
    attackCooldown: 0.5,
    packBonus: 0.22,
    forageYield: 0.45,
    color: "#8a7a5c",
    accent: "#2a2a2a",
    silhouette: "canid",
    description: "Opportunist of the margins — hunt small game, steal kills, forage fruit.",
    preyHint: "Rabbits and carcasses. Avoid lions.",
    weaponBonus: 1.0,
  },
  hyena: {
    id: "hyena",
    name: "Spotted Hyena",
    scientific: "Crocuta crocuta",
    diet: "carnivore",
    guild: "mesopredator",
    trophic: 3.6,
    massKg: 65,
    biteForce: 1.55,
    speed: 0.78,
    armor: 0.45,
    stamina: 1.25,
    hungerRate: 1.0,
    thirstRate: 0.95,
    attackRange: 44,
    attackCooldown: 0.55,
    packBonus: 0.35,
    forageYield: 0,
    color: "#a89070",
    accent: "#4a3728",
    silhouette: "hyena",
    description: "Bone-crushing endurance hunter. Clan power rewrites the food web.",
    preyHint: "Hunt ungulates. Contest carcasses. Respect lions in numbers.",
    weaponBonus: 1.25,
  },
  leopard: {
    id: "leopard",
    name: "Leopard",
    scientific: "Panthera pardus",
    diet: "carnivore",
    guild: "mesopredator",
    trophic: 3.8,
    massKg: 55,
    biteForce: 1.35,
    speed: 0.9,
    armor: 0.3,
    stamina: 0.9,
    hungerRate: 0.95,
    thirstRate: 0.9,
    attackRange: 46,
    attackCooldown: 0.48,
    packBonus: 0.05,
    forageYield: 0,
    color: "#c47a3a",
    accent: "#1a120c",
    silhouette: "felid",
    description: "Ambush specialist. Power spikes from stealth and a killing bite.",
    preyHint: "Ambush impala and warthog. Drag kills into cover.",
    weaponBonus: 1.4,
  },
  wolf: {
    id: "wolf",
    name: "Gray Wolf",
    scientific: "Canis lupus",
    diet: "carnivore",
    guild: "mesopredator",
    trophic: 3.7,
    massKg: 40,
    biteForce: 1.25,
    speed: 0.85,
    armor: 0.28,
    stamina: 1.3,
    hungerRate: 1.05,
    thirstRate: 1.0,
    attackRange: 42,
    attackCooldown: 0.5,
    packBonus: 0.4,
    forageYield: 0,
    color: "#7a7a7a",
    accent: "#2c2c2c",
    silhouette: "canid",
    description: "Coordinated pursuit predator. Alone you are mid-tier; as a pack, apex-adjacent.",
    preyHint: "Relay-chase deer-sized prey. Share the kill.",
    weaponBonus: 1.1,
  },
  crocodile: {
    id: "crocodile",
    name: "Nile Crocodile",
    scientific: "Crocodylus niloticus",
    diet: "carnivore",
    guild: "apex",
    trophic: 4.0,
    massKg: 400,
    biteForce: 1.7,
    speed: 0.45,
    armor: 0.85,
    stamina: 0.7,
    hungerRate: 0.55,
    thirstRate: 0.4,
    attackRange: 52,
    attackCooldown: 0.85,
    packBonus: 0.08,
    forageYield: 0,
    color: "#3f5a3a",
    accent: "#1e2a1a",
    silhouette: "croc",
    description: "Ambush titan of the waterline. Slow on land, absolute near the bank.",
    preyHint: "Hold the water's edge. Death roll anything that drinks.",
    weaponBonus: 1.35,
  },
  lion: {
    id: "lion",
    name: "Lion",
    scientific: "Panthera leo",
    diet: "carnivore",
    guild: "apex",
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
    packBonus: 0.3,
    forageYield: 0,
    color: "#d4a017",
    accent: "#5c4033",
    silhouette: "felid",
    description: "Pride apex of the savanna. Territory, cooperation, and raw force.",
    preyHint: "Take ungulates and contest hyenas. Avoid crocs at the bank.",
    weaponBonus: 1.35,
  },
  buffalo: {
    id: "buffalo",
    name: "Cape Buffalo",
    scientific: "Syncerus caffer",
    diet: "herbivore",
    guild: "megaherbivore",
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
    packBonus: 0.25,
    forageYield: 1.3,
    color: "#2f2f2f",
    accent: "#8b0000",
    silhouette: "buffalo",
    description: "Horned fortress. Not a predator — but few predators want the fight.",
    preyHint: "Graze openly. Form a wall when threatened.",
    weaponBonus: 1.2,
  },
  elephant: {
    id: "elephant",
    name: "African Elephant",
    scientific: "Loxodonta africana",
    diet: "herbivore",
    guild: "megaherbivore",
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
    packBonus: 0.15,
    forageYield: 1.5,
    color: "#6e6e6e",
    accent: "#3a3a3a",
    silhouette: "elephant",
    description: "Keystone megafauna. Nearly unkillable alone; reshape the landscape by eating.",
    preyHint: "Browse constantly. Charge only when calves or self are threatened.",
    weaponBonus: 1.1,
  },
  bear: {
    id: "bear",
    name: "Brown Bear",
    scientific: "Ursus arctos",
    diet: "omnivore",
    guild: "apex",
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
    packBonus: 0.05,
    forageYield: 0.85,
    color: "#5c4033",
    accent: "#1a1008",
    silhouette: "bear",
    description: "Solitary powerhouse. Berries one hour, contested carcass the next.",
    preyHint: "Forage, fish the banks, and bully mid-tier predators off kills.",
    weaponBonus: 1.3,
  },
};

for (const sp of Object.values(SPECIES)) {
  sp.combatPower = derivePower(sp);
}

/** Who can typically kill whom solo (approximate ecological realism). */
export function canHunt(attacker, defender) {
  if (!attacker || !defender) return false;
  if (attacker.id === defender.id) return false;

  // Megaherbivores are almost never prey for solo mesopredators
  if (defender.guild === "megaherbivore" && attacker.guild !== "apex") {
    return attacker.combatPower * 1.8 >= defender.combatPower;
  }

  // Herbivores don't "hunt" for food, but can gore in defense (handled as attack)
  if (attacker.diet === "herbivore") return false;

  const ratio = attacker.combatPower / Math.max(1, defender.combatPower);
  // Need clear advantage unless ambushing a lower trophic level
  if (defender.trophic < attacker.trophic - 0.4) return ratio >= 0.55;
  if (defender.trophic <= attacker.trophic) return ratio >= 0.85;
  return ratio >= 1.25;
}

export function canScavenge(species) {
  return species.diet === "carnivore" || species.diet === "omnivore";
}

export function canForage(species) {
  return species.diet === "herbivore" || species.diet === "omnivore";
}

/** Damage dealt in one strike, modified by stamina fraction and pack nearby. */
export function strikeDamage(attacker, staminaFrac = 1, packCount = 1) {
  const pack = 1 + attacker.packBonus * Math.max(0, packCount - 1);
  const staminaMod = 0.55 + 0.45 * Math.max(0.15, staminaFrac);
  // Tuned so equal-power duels last several strikes after armor mitigation
  return attacker.combatPower * 0.048 * pack * staminaMod;
}

export const SPECIES_LIST = Object.values(SPECIES).sort(
  (a, b) => a.combatPower - b.combatPower
);

export const WORLD = {
  width: 4800,
  height: 3200,
  tickMs: 50,
  dayLengthSec: 480,
};
