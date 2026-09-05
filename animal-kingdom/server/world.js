import {
  SPECIES,
  WORLD,
  canForage,
  canHunt,
  canScavenge,
  strikeDamage,
} from "./species.js";

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const BIOMES = [
  { id: "savanna", color: "#c2a66a", forage: 1.1, cover: 0.25, water: 0.15 },
  { id: "woodland", color: "#3d5c3a", forage: 1.0, cover: 0.7, water: 0.2 },
  { id: "wetland", color: "#2f5e4e", forage: 0.85, cover: 0.4, water: 0.9 },
  { id: "ridge", color: "#6b6358", forage: 0.55, cover: 0.35, water: 0.05 },
];

function biomeAt(x, y) {
  const nx = x / WORLD.width;
  const ny = y / WORLD.height;
  const n =
    Math.sin(nx * 6.2 + ny * 2.1) * 0.45 +
    Math.sin(nx * 14.0 - ny * 9.0) * 0.25 +
    Math.sin((nx + ny) * 3.5) * 0.3;
  if (ny > 0.72 && n > -0.1) return BIOMES[2];
  if (n > 0.35) return BIOMES[1];
  if (n < -0.35) return BIOMES[3];
  return BIOMES[0];
}

let nextId = 1;
const nid = (prefix) => `${prefix}_${nextId++}`;

export class LifechainWorld {
  constructor() {
    this.players = new Map();
    this.npcs = new Map();
    this.plants = [];
    this.waters = [];
    this.carcasses = [];
    this.timeOfDay = 0.28; // dawn-ish
    this.events = [];
    this._seedTerrain();
    this._seedWildlife();
  }

  _seedTerrain() {
    for (let i = 0; i < 220; i++) {
      const x = rand(80, WORLD.width - 80);
      const y = rand(80, WORLD.height - 80);
      const b = biomeAt(x, y);
      this.plants.push({
        id: nid("plant"),
        x,
        y,
        biomass: rand(40, 100) * b.forage,
        maxBiomass: 100 * b.forage,
        regen: 4 * b.forage,
      });
    }
    // Water holes / river-ish bands
    for (let i = 0; i < 18; i++) {
      this.waters.push({
        id: nid("water"),
        x: rand(200, WORLD.width - 200),
        y: WORLD.height * (0.68 + rand(0, 0.22)),
        r: rand(70, 140),
      });
    }
    for (let i = 0; i < 8; i++) {
      this.waters.push({
        id: nid("water"),
        x: rand(150, WORLD.width - 150),
        y: rand(150, WORLD.height * 0.55),
        r: rand(45, 90),
      });
    }
  }

  _seedWildlife() {
    const roster = [
      ["rabbit", 28],
      ["impala", 18],
      ["warthog", 10],
      ["jackal", 10],
      ["hyena", 8],
      ["leopard", 5],
      ["wolf", 8],
      ["crocodile", 6],
      ["lion", 5],
      ["buffalo", 8],
      ["elephant", 3],
      ["bear", 4],
    ];
    for (const [sid, count] of roster) {
      for (let i = 0; i < count; i++) this._spawnNpc(sid);
    }
  }

  _spawnNpc(speciesId, near = null) {
    const sp = SPECIES[speciesId];
    let x = rand(100, WORLD.width - 100);
    let y = rand(100, WORLD.height - 100);
    if (near) {
      x = clamp(near.x + rand(-220, 220), 80, WORLD.width - 80);
      y = clamp(near.y + rand(-220, 220), 80, WORLD.height - 80);
    }
    if (speciesId === "crocodile") {
      const w = pick(this.waters);
      x = w.x + rand(-w.r, w.r);
      y = w.y + rand(-w.r * 0.4, w.r * 0.4);
    }
    const ent = this._makeCreature(nid("npc"), sp, x, y, false);
    ent.ai = {
      state: "wander",
      targetId: null,
      timer: rand(1, 4),
      homeX: x,
      homeY: y,
    };
    this.npcs.set(ent.id, ent);
    return ent;
  }

  _makeCreature(id, sp, x, y, isPlayer) {
    return {
      id,
      speciesId: sp.id,
      name: isPlayer ? "Wanderer" : sp.name,
      isPlayer,
      x,
      y,
      vx: 0,
      vy: 0,
      angle: rand(0, Math.PI * 2),
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      hunger: 55 + rand(0, 25),
      thirst: 50 + rand(0, 25),
      alive: true,
      attackCd: 0,
      sprint: false,
      killCount: 0,
      ageSec: 0,
      lastHitBy: null,
      protectUntil: 0,
    };
  }

  spawnPlayer(wsId, speciesId, displayName) {
    const sp = SPECIES[speciesId] || SPECIES.impala;
    // Spawn on open savanna away from the wetland crocodile belt
    const x = rand(WORLD.width * 0.25, WORLD.width * 0.75);
    const y = rand(WORLD.height * 0.18, WORLD.height * 0.48);
    const p = this._makeCreature(wsId, sp, x, y, true);
    p.name = (displayName || "Wanderer").slice(0, 18);
    p.hunger = 70;
    p.thirst = 70;
    p.protectUntil = Date.now() + 20000;
    this._clearThreatsNear(p, 280);
    this.players.set(wsId, p);
    this.events.push({
      t: Date.now(),
      text: `${p.name} entered the wild as ${sp.name}.`,
    });
    return p;
  }

  removePlayer(wsId) {
    this.players.delete(wsId);
  }

  setInput(wsId, input) {
    const p = this.players.get(wsId);
    if (!p || !p.alive) return;
    p.input = input;
  }

  allCreatures() {
    return [...this.players.values(), ...this.npcs.values()];
  }

  getCreature(id) {
    return this.players.get(id) || this.npcs.get(id);
  }

  tick(dt) {
    this.timeOfDay = (this.timeOfDay + dt / WORLD.dayLengthSec) % 1;
    this._regenPlants(dt);
    this._ageCarcasses(dt);

    for (const p of this.players.values()) {
      if (p.alive) this._updatePlayer(p, dt);
      else p.respawnTimer = (p.respawnTimer || 0) - dt;
    }
    for (const n of this.npcs.values()) {
      if (n.alive) this._updateNpc(n, dt);
    }

    // Respawn NPCs slowly
    if (this.npcs.size < 100 && Math.random() < dt * 0.15) {
      const sid = pick([
        "rabbit",
        "rabbit",
        "impala",
        "impala",
        "warthog",
        "jackal",
        "hyena",
        "wolf",
      ]);
      this._spawnNpc(sid);
    }

    if (this.events.length > 40) this.events.splice(0, this.events.length - 40);
  }

  _regenPlants(dt) {
    for (const pl of this.plants) {
      if (pl.biomass < pl.maxBiomass) {
        pl.biomass = Math.min(pl.maxBiomass, pl.biomass + pl.regen * dt);
      }
    }
  }

  _ageCarcasses(dt) {
    for (const c of this.carcasses) {
      c.meat = Math.max(0, c.meat - dt * 1.5);
      c.age += dt;
    }
    this.carcasses = this.carcasses.filter((c) => c.meat > 1 && c.age < 180);
  }

  _survivalDrain(ent, sp, dt) {
    ent.ageSec += dt;
    ent.hunger = clamp(ent.hunger - sp.hungerRate * 1.8 * dt, 0, 100);
    ent.thirst = clamp(ent.thirst - sp.thirstRate * 2.0 * dt, 0, 100);
    if (ent.hunger < 12) ent.health -= 4 * dt;
    if (ent.thirst < 10) ent.health -= 6 * dt;
    if (!ent.sprint) {
      ent.stamina = Math.min(ent.maxStamina, ent.stamina + 12 * sp.stamina * dt);
    }
    ent.attackCd = Math.max(0, ent.attackCd - dt);
    if (ent.health <= 0) this._kill(ent, ent.lastHitBy);
  }

  _moveCreature(ent, sp, dirX, dirY, sprint, dt) {
    const len = Math.hypot(dirX, dirY) || 1;
    const nx = dirX / len;
    const ny = dirY / len;
    if (dirX || dirY) ent.angle = Math.atan2(ny, nx);

    const night = this.timeOfDay < 0.2 || this.timeOfDay > 0.8;
    const nightMod = night && sp.guild !== "apex" ? 0.92 : 1;
    let speed = 95 + sp.speed * 140;
    if (sprint && ent.stamina > 2) {
      speed *= 1.55;
      ent.stamina = Math.max(0, ent.stamina - 22 * dt);
      ent.sprint = true;
    } else {
      ent.sprint = false;
    }
    // Crocs are sluggish far from water
    if (sp.id === "crocodile") {
      const nearWater = this.waters.some((w) => dist(ent, w) < w.r + 80);
      if (!nearWater) speed *= 0.45;
      else speed *= 1.15;
    }

    ent.x = clamp(ent.x + nx * speed * nightMod * dt, 40, WORLD.width - 40);
    ent.y = clamp(ent.y + ny * speed * nightMod * dt, 40, WORLD.height - 40);
  }

  _updatePlayer(p, dt) {
    const sp = SPECIES[p.speciesId];
    const input = p.input || {};
    let dx = 0;
    let dy = 0;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (typeof input.aimX === "number" && typeof input.aimY === "number") {
      // soft facing toward aim when idle-ish
      if (!dx && !dy) p.angle = Math.atan2(input.aimY - p.y, input.aimX - p.x);
    }
    if (dx || dy) this._moveCreature(p, sp, dx, dy, !!input.sprint, dt);
    this._survivalDrain(p, sp, dt);

    if (input.attack) this._tryAttack(p);
    if (input.eat) this._tryEat(p);
    if (input.drink) this._tryDrink(p);

    // clear one-shot actions
    if (p.input) {
      p.input.attack = false;
      p.input.eat = false;
      p.input.drink = false;
    }
  }

  _updateNpc(n, dt) {
    const sp = SPECIES[n.speciesId];
    this._survivalDrain(n, sp, dt);
    if (!n.alive) return;

    const ai = n.ai;
    ai.timer -= dt;

    // Hunger drives hunting / foraging
    if (n.hunger < 45 && ai.state === "wander") {
      if (canForage(sp) && Math.random() < 0.6) ai.state = "forage";
      else if (sp.diet !== "herbivore") ai.state = "hunt";
    }
    if (n.thirst < 35) ai.state = "drink";

    if (ai.state === "wander") {
      if (ai.timer <= 0) {
        ai.wx = clamp(ai.homeX + rand(-400, 400), 60, WORLD.width - 60);
        ai.wy = clamp(ai.homeY + rand(-400, 400), 60, WORLD.height - 60);
        ai.timer = rand(2, 6);
      }
      this._steerToward(n, sp, ai.wx, ai.wy, false, dt);
    } else if (ai.state === "forage") {
      const plant = this._nearestPlant(n, 500);
      if (!plant) {
        ai.state = "wander";
      } else if (dist(n, plant) < 36) {
        this._forage(n, plant);
        if (n.hunger > 80) ai.state = "wander";
      } else this._steerToward(n, sp, plant.x, plant.y, false, dt);
    } else if (ai.state === "drink") {
      const w = this._nearestWater(n);
      if (!w) ai.state = "wander";
      else if (dist(n, w) < w.r + 10) {
        n.thirst = Math.min(100, n.thirst + 35 * dt);
        if (n.thirst > 85) ai.state = "wander";
      } else this._steerToward(n, sp, w.x, w.y, false, dt);
    } else if (ai.state === "hunt") {
      let prey = ai.targetId ? this.getCreature(ai.targetId) : null;
      if (!prey || !prey.alive) {
        prey = this._findPrey(n, sp);
        ai.targetId = prey ? prey.id : null;
      }
      if (!prey) {
        // scavenge
        const car = this._nearestCarcass(n, 450);
        if (car && canScavenge(sp)) {
          if (dist(n, car) < 40) {
            this._scavenge(n, car);
            if (n.hunger > 75) ai.state = "wander";
          } else this._steerToward(n, sp, car.x, car.y, true, dt);
        } else ai.state = "wander";
      } else if (dist(n, prey) < sp.attackRange) {
        this._tryAttack(n);
        if (n.hunger > 75) ai.state = "wander";
      } else {
        this._steerToward(n, sp, prey.x, prey.y, true, dt);
      }
    }

    // Flee if badly outmatched and hurt
    if (n.health < 40 && sp.guild === "prey") {
      const threat = this._nearestThreat(n, sp);
      if (threat) {
        const ang = Math.atan2(n.y - threat.y, n.x - threat.x);
        this._moveCreature(n, sp, Math.cos(ang), Math.sin(ang), true, dt);
      }
    }
  }

  _steerToward(ent, sp, x, y, sprint, dt) {
    this._moveCreature(ent, sp, x - ent.x, y - ent.y, sprint, dt);
  }

  _nearestPlant(ent, radius) {
    let best = null;
    let bestD = radius;
    for (const pl of this.plants) {
      if (pl.biomass < 8) continue;
      const d = dist(ent, pl);
      if (d < bestD) {
        bestD = d;
        best = pl;
      }
    }
    return best;
  }

  _nearestWater(ent) {
    let best = null;
    let bestD = Infinity;
    for (const w of this.waters) {
      const d = dist(ent, w);
      if (d < bestD) {
        bestD = d;
        best = w;
      }
    }
    return best;
  }

  _nearestCarcass(ent, radius) {
    let best = null;
    let bestD = radius;
    for (const c of this.carcasses) {
      const d = dist(ent, c);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  _nearestThreat(ent, sp) {
    let best = null;
    let bestD = 320;
    for (const o of this.allCreatures()) {
      if (!o.alive || o.id === ent.id) continue;
      const osp = SPECIES[o.speciesId];
      if (osp.diet === "herbivore") continue;
      if (osp.combatPower < sp.combatPower * 0.9) continue;
      const d = dist(ent, o);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    return best;
  }

  _findPrey(hunter, sp) {
    let best = null;
    let bestScore = -Infinity;
    for (const o of this.allCreatures()) {
      if (!o.alive || o.id === hunter.id) continue;
      if (o.protectUntil && Date.now() < o.protectUntil) continue;
      const osp = SPECIES[o.speciesId];
      if (!canHunt(sp, osp) && !(sp.diet !== "herbivore" && osp.combatPower < sp.combatPower * 0.75)) {
        // allow opportunistic attack on weaker targets for carnivores
        if (!(sp.diet !== "herbivore" && osp.trophic < sp.trophic && osp.combatPower < sp.combatPower)) {
          continue;
        }
      }
      if (osp.guild === "megaherbivore" && sp.guild !== "apex") continue;
      const d = dist(hunter, o);
      if (d > 520) continue;
      // Prefer wildlife over players so the MMO doesn't spawn-camp newcomers
      const playerPenalty = o.isPlayer ? 0.55 : 0;
      const score = sp.combatPower / osp.combatPower - d / 800 - playerPenalty;
      if (score > bestScore) {
        bestScore = score;
        best = o;
      }
    }
    return best;
  }

  _packCount(ent) {
    const sp = SPECIES[ent.speciesId];
    let n = 1;
    for (const o of this.allCreatures()) {
      if (!o.alive || o.id === ent.id) continue;
      if (o.speciesId !== ent.speciesId) continue;
      if (dist(ent, o) < 160) n += 1;
    }
    return Math.min(n, 8);
  }

  _tryAttack(ent) {
    if (!ent.alive || ent.attackCd > 0) return;
    const sp = SPECIES[ent.speciesId];
    ent.attackCd = sp.attackCooldown;
    const pack = this._packCount(ent);
    const dmg = strikeDamage(sp, ent.stamina / ent.maxStamina, pack);

    let target = null;
    let bestD = sp.attackRange + 8;
    const fx = Math.cos(ent.angle);
    const fy = Math.sin(ent.angle);
    for (const o of this.allCreatures()) {
      if (!o.alive || o.id === ent.id) continue;
      const d = dist(ent, o);
      if (d > bestD) continue;
      const toX = (o.x - ent.x) / (d || 1);
      const toY = (o.y - ent.y) / (d || 1);
      const dot = fx * toX + fy * toY;
      if (dot < 0.25) continue;
      bestD = d;
      target = o;
    }
    if (!target) return;

    if (target.protectUntil && Date.now() < target.protectUntil) return;

    const tsp = SPECIES[target.speciesId];
    // Defensive gore for herbivores / contested fights always allowed
    const hunting = canHunt(sp, tsp) || sp.diet === "herbivore";
    if (!hunting && tsp.combatPower > sp.combatPower * 1.1) {
      // reckless attack still does reduced damage
    }

    const mitigation = 1 / (1 + tsp.armor * 0.8);
    const dealt = dmg * mitigation;
    target.health -= dealt;
    target.lastHitBy = ent.id;
    ent.stamina = Math.max(0, ent.stamina - 8);

    // Ambush bonus: attacker behind / from cover-ish if target sprinting away
    if (target.health <= 0) {
      this._kill(target, ent.id);
      if (sp.diet !== "herbivore") {
        ent.hunger = Math.min(100, ent.hunger + 28 + tsp.massKg * 0.02);
        ent.killCount += 1;
      }
    }
  }

  _kill(victim, killerId) {
    if (!victim.alive) return;
    victim.alive = false;
    victim.health = 0;
    const sp = SPECIES[victim.speciesId];
    this.carcasses.push({
      id: nid("carcass"),
      x: victim.x,
      y: victim.y,
      speciesId: victim.speciesId,
      meat: 30 + sp.massKg * 0.08,
      maxMeat: 30 + sp.massKg * 0.08,
      age: 0,
    });
    const killer = killerId ? this.getCreature(killerId) : null;
    const kName = killer ? killer.name : "the wild";
    this.events.push({
      t: Date.now(),
      text: `${victim.name} (${sp.name}) fell to ${kName}.`,
    });
    if (!victim.isPlayer) {
      // remove NPC after a beat via map cleanup
      setTimeout(() => this.npcs.delete(victim.id), 50);
    } else {
      victim.respawnTimer = 4;
    }
  }

  respawnPlayer(wsId) {
    const p = this.players.get(wsId);
    if (!p) return;
    if (p.alive) return;
    if ((p.respawnTimer || 0) > 0) return;
    const sp = SPECIES[p.speciesId];
    p.alive = true;
    p.health = 100;
    p.stamina = 100;
    p.hunger = 70;
    p.thirst = 70;
    p.x = rand(WORLD.width * 0.25, WORLD.width * 0.75);
    p.y = rand(WORLD.height * 0.18, WORLD.height * 0.48);
    p.protectUntil = Date.now() + 20000;
    this._clearThreatsNear(p, 280);
    this.events.push({ t: Date.now(), text: `${p.name} returns as ${sp.name}.` });
  }

  /** Nudge dangerous carnivores away from a fresh spawn. */
  _clearThreatsNear(ent, radius) {
    const sp = SPECIES[ent.speciesId];
    for (const o of this.npcs.values()) {
      if (!o.alive || o.isPlayer) continue;
      const osp = SPECIES[o.speciesId];
      if (osp.diet === "herbivore") continue;
      if (osp.combatPower < sp.combatPower * 0.8) continue;
      if (dist(ent, o) > radius) continue;
      const ang = Math.atan2(o.y - ent.y, o.x - ent.x);
      o.x = clamp(ent.x + Math.cos(ang) * (radius + 40), 60, WORLD.width - 60);
      o.y = clamp(ent.y + Math.sin(ang) * (radius + 40), 60, WORLD.height - 60);
      if (o.ai) {
        o.ai.state = "wander";
        o.ai.targetId = null;
      }
    }
  }

  _forage(ent, plant) {
    const sp = SPECIES[ent.speciesId];
    if (!canForage(sp)) return;
    const take = Math.min(plant.biomass, 12 * sp.forageYield);
    plant.biomass -= take;
    ent.hunger = Math.min(100, ent.hunger + take * 0.9);
  }

  _scavenge(ent, carcass) {
    const sp = SPECIES[ent.speciesId];
    if (!canScavenge(sp)) return;
    const take = Math.min(carcass.meat, 14);
    carcass.meat -= take;
    ent.hunger = Math.min(100, ent.hunger + take * 1.1);
  }

  _tryEat(ent) {
    const sp = SPECIES[ent.speciesId];
    if (canForage(sp)) {
      const plant = this._nearestPlant(ent, 48);
      if (plant) {
        this._forage(ent, plant);
        return;
      }
    }
    if (canScavenge(sp)) {
      const car = this._nearestCarcass(ent, 52);
      if (car) this._scavenge(ent, car);
    }
  }

  _tryDrink(ent) {
    const w = this._nearestWater(ent);
    if (w && dist(ent, w) < w.r + 24) {
      ent.thirst = Math.min(100, ent.thirst + 40);
    }
  }

  snapshotFor(viewerId) {
    const viewer = this.players.get(viewerId);
    const vx = viewer?.x ?? WORLD.width / 2;
    const vy = viewer?.y ?? WORLD.height / 2;
    const viewR = 1100;

    const creatures = [];
    for (const c of this.allCreatures()) {
      if (!c.alive && c.isPlayer) {
        // still show dead players briefly
      } else if (!c.alive) continue;
      if (Math.hypot(c.x - vx, c.y - vy) > viewR) continue;
      const sp = SPECIES[c.speciesId];
      creatures.push({
        id: c.id,
        speciesId: c.speciesId,
        name: c.name,
        isPlayer: c.isPlayer,
        x: c.x,
        y: c.y,
        angle: c.angle,
        health: c.health,
        maxHealth: c.maxHealth,
        alive: c.alive,
        combatPower: sp.combatPower,
        trophic: sp.trophic,
        guild: sp.guild,
        color: sp.color,
        accent: sp.accent,
        silhouette: sp.silhouette,
        sprint: !!c.sprint,
      });
    }

    const plants = this.plants
      .filter((p) => Math.hypot(p.x - vx, p.y - vy) < viewR && p.biomass > 5)
      .map((p) => ({ id: p.id, x: p.x, y: p.y, biomass: p.biomass }));

    const waters = this.waters
      .filter((w) => Math.hypot(w.x - vx, w.y - vy) < viewR + w.r)
      .map((w) => ({ id: w.id, x: w.x, y: w.y, r: w.r }));

    const carcasses = this.carcasses
      .filter((c) => Math.hypot(c.x - vx, c.y - vy) < viewR)
      .map((c) => ({
        id: c.id,
        x: c.x,
        y: c.y,
        meat: c.meat,
        speciesId: c.speciesId,
      }));

    let you = null;
    if (viewer) {
      const sp = SPECIES[viewer.speciesId];
      you = {
        id: viewer.id,
        speciesId: viewer.speciesId,
        name: viewer.name,
        x: viewer.x,
        y: viewer.y,
        angle: viewer.angle,
        health: viewer.health,
        stamina: viewer.stamina,
        hunger: viewer.hunger,
        thirst: viewer.thirst,
        alive: viewer.alive,
        respawnTimer: viewer.respawnTimer || 0,
        killCount: viewer.killCount,
        combatPower: sp.combatPower,
        diet: sp.diet,
        guild: sp.guild,
        trophic: sp.trophic,
        speciesName: sp.name,
      };
    }

    return {
      timeOfDay: this.timeOfDay,
      world: { width: WORLD.width, height: WORLD.height },
      you,
      creatures,
      plants,
      waters,
      carcasses,
      events: this.events.slice(-8),
      biome: biomeAt(vx, vy).id,
    };
  }
}

export { biomeAt, BIOMES };
