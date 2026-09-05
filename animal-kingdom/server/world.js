import {
  SPECIES,
  WORLD,
  PLAYABLE,
  canForage,
  canHunt,
  canScavenge,
  strikeDamage,
} from "./species.js";
import { BIOMES, biomeAt, rankForXp, xpProgress } from "./meta.js";

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

let nextId = 1;
const nid = (prefix) => `${prefix}_${nextId++}`;

export class LifechainWorld {
  constructor() {
    this.players = new Map();
    this.npcs = new Map();
    this.packs = new Map();
    this.territories = new Map();
    this.plants = [];
    this.waters = [];
    this.carcasses = [];
    this.timeOfDay = 0.28;
    this.events = [];
    this._seedTerrain();
    this._seedWildlife();
  }

  _seedTerrain() {
    for (let i = 0; i < 300; i++) {
      const x = rand(80, WORLD.width - 80);
      const y = rand(80, WORLD.height - 80);
      const b = biomeAt(x, y, WORLD.width, WORLD.height);
      this.plants.push({
        id: nid("plant"),
        x,
        y,
        biomass: rand(35, 100) * b.forage,
        maxBiomass: 100 * b.forage,
        regen: 3.5 * b.forage,
      });
    }
    // Wetland / river belt
    for (let i = 0; i < 12; i++) {
      this.waters.push({
        id: nid("water"),
        x: rand(200, WORLD.width - 200),
        y: WORLD.height * (0.7 + rand(0, 0.22)),
        r: rand(80, 160),
      });
    }
    // Inland pans
    for (let i = 0; i < 12; i++) {
      this.waters.push({
        id: nid("water"),
        x: rand(180, WORLD.width - 180),
        y: rand(180, WORLD.height * 0.65),
        r: rand(50, 110),
      });
    }
    // Floodplain lakes
    for (let i = 0; i < 6; i++) {
      this.waters.push({
        id: nid("water"),
        x: WORLD.width * (0.7 + rand(0, 0.22)),
        y: WORLD.height * (0.4 + rand(0, 0.25)),
        r: rand(90, 150),
      });
    }
  }

  _seedWildlife() {
    const roster = [
      ["rabbit", 36],
      ["impala", 28],
      ["warthog", 14],
      ["zebra", 16],
      ["crocodile", 7],
      ["lion", 8],
      ["buffalo", 10],
      ["elephant", 5],
      ["bear", 5],
    ];
    for (const [sid, count] of roster) {
      for (let i = 0; i < count; i++) this._spawnNpc(sid);
    }
    this._seedNpcPacks();
  }

  _seedNpcPacks() {
    const candidates = [
      ["lion", 3],
      ["buffalo", 4],
      ["elephant", 3],
    ];
    const packCount = Math.random() < 0.5 ? 1 : 2;
    const shuffled = candidates.sort(() => Math.random() - 0.5).slice(0, packCount);
    for (const [sid, size] of shuffled) {
      const members = [...this.npcs.values()].filter(
        (n) => n.alive && n.speciesId === sid && !n.packId
      );
      if (members.length < size) continue;
      const leader = members[0];
      const label = SPECIES[sid].packLabel || "Pack";
      const pack = this._createPack(leader, `${label} of the wild`);
      for (let i = 1; i < size && i < members.length; i++) {
        this._joinPack(members[i], pack.id);
      }
    }
  }

  _spawnNpc(speciesId, near = null) {
    const sp = SPECIES[speciesId];
    if (!sp) return null;
    let x = rand(100, WORLD.width - 100);
    let y = rand(100, WORLD.height - 100);
    if (near) {
      x = clamp(near.x + rand(-220, 220), 80, WORLD.width - 80);
      y = clamp(near.y + rand(-220, 220), 80, WORLD.height - 80);
    } else if (sp.favoredBiomes?.length) {
      for (let tries = 0; tries < 12; tries++) {
        const tx = rand(100, WORLD.width - 100);
        const ty = rand(100, WORLD.height - 100);
        const b = biomeAt(tx, ty, WORLD.width, WORLD.height);
        if (sp.favoredBiomes.includes(b.id)) {
          x = tx;
          y = ty;
          break;
        }
      }
    }
    if (speciesId === "crocodile" && this.waters.length) {
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
      wx: x,
      wy: y,
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
      angle: rand(0, Math.PI * 2),
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      hunger: isPlayer ? 70 : 55 + rand(0, 25),
      thirst: isPlayer ? 70 : 50 + rand(0, 25),
      alive: true,
      attackCd: 0,
      sprint: false,
      killCount: 0,
      ageSec: 0,
      lastHitBy: null,
      protectUntil: 0,
      xp: isPlayer ? 0 : rand(40, 400),
      lifetimeXp: 0,
      packId: null,
      territoryId: null,
    };
  }

  _favoredSpawn(sp) {
    let x = rand(WORLD.width * 0.25, WORLD.width * 0.75);
    let y = rand(WORLD.height * 0.2, WORLD.height * 0.5);
    for (let tries = 0; tries < 16; tries++) {
      const tx = rand(WORLD.width * 0.15, WORLD.width * 0.85);
      const ty = rand(WORLD.height * 0.15, WORLD.height * 0.6);
      const b = biomeAt(tx, ty, WORLD.width, WORLD.height);
      if (sp.favoredBiomes.includes(b.id)) {
        return { x: tx, y: ty };
      }
    }
    return { x, y };
  }

  spawnPlayer(wsId, speciesId, displayName, savedXp = 0) {
    const playableIds = PLAYABLE.map((s) => s.id);
    const sid = playableIds.includes(speciesId) ? speciesId : "lion";
    const sp = SPECIES[sid];
    const { x, y } = this._favoredSpawn(sp);
    const p = this._makeCreature(wsId, sp, x, y, true);
    p.name = (displayName || "Wanderer").slice(0, 18);
    p.hunger = 70;
    p.thirst = 70;
    const xp = Math.max(0, Number(savedXp) || 0);
    p.xp = xp;
    p.lifetimeXp = xp;
    p.protectUntil = Date.now() + 20000;
    this._clearThreatsNear(p, 280);
    this.players.set(wsId, p);
    this._pushEvent(`${p.name} entered the wild as ${sp.name}.`);
    return p;
  }

  removePlayer(wsId) {
    const p = this.players.get(wsId);
    if (p) {
      if (p.packId) this._leavePack(p);
      if (p.territoryId) this._abandonTerritory(p);
    }
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

  _pushEvent(text) {
    this.events.push({ t: Date.now(), text });
    if (this.events.length > 50) this.events.splice(0, this.events.length - 50);
  }

  tick(dt) {
    this.timeOfDay = (this.timeOfDay + dt / WORLD.dayLengthSec) % 1;
    this._regenPlants(dt);
    this._ageCarcasses(dt);
    this._tickTerritories(dt);

    for (const p of this.players.values()) {
      if (p.alive) this._updatePlayer(p, dt);
      else p.respawnTimer = (p.respawnTimer || 0) - dt;
    }
    for (const n of this.npcs.values()) {
      if (n.alive) this._updateNpc(n, dt);
    }

    // Slow NPC replenishment
    if (this.npcs.size < 110 && Math.random() < dt * 0.2) {
      const sid = pick([
        "rabbit",
        "rabbit",
        "impala",
        "impala",
        "zebra",
        "warthog",
        "lion",
        "buffalo",
      ]);
      this._spawnNpc(sid);
    }

    if (this.events.length > 50) this.events.splice(0, this.events.length - 50);
  }

  // —— Packs ——
  _createPack(leader, name) {
    const sp = SPECIES[leader.speciesId];
    const pack = {
      id: nid("pack"),
      speciesId: leader.speciesId,
      name: name || `${leader.name}'s ${sp.packLabel}`,
      leaderId: leader.id,
      memberIds: [leader.id],
    };
    this.packs.set(pack.id, pack);
    leader.packId = pack.id;
    return pack;
  }

  _joinPack(ent, packId) {
    const pack = this.packs.get(packId);
    if (!pack || !ent.alive) return false;
    if (ent.speciesId !== pack.speciesId) return false;
    if (ent.packId) this._leavePack(ent);
    const leader = this.getCreature(pack.leaderId);
    const leaderRank = rankForXp(leader?.xp || 0);
    if (pack.memberIds.length >= leaderRank.packSlots) return false;
    pack.memberIds.push(ent.id);
    ent.packId = pack.id;
    return true;
  }

  _leavePack(ent) {
    const pack = this.packs.get(ent.packId);
    if (!pack) {
      ent.packId = null;
      return;
    }
    pack.memberIds = pack.memberIds.filter((id) => id !== ent.id);
    ent.packId = null;
    if (pack.leaderId === ent.id) {
      if (pack.memberIds.length) {
        pack.leaderId = pack.memberIds[0];
        const next = this.getCreature(pack.leaderId);
        if (next) this._pushEvent(`${next.name} now leads ${pack.name}.`);
      } else {
        this.packs.delete(pack.id);
      }
    }
  }

  tryCreatePack(wsId) {
    const p = this.players.get(wsId);
    if (!p?.alive) return;
    const sp = SPECIES[p.speciesId];
    if (sp.social === "solitary") {
      this._pushEvent(`${sp.name}s are solitary — claim territory instead (T).`);
      return;
    }
    if (p.packId) {
      this._pushEvent(`Already in ${this.packs.get(p.packId)?.name}.`);
      return;
    }
    const pack = this._createPack(p);
    this._grantXp(p, 25, "founded a pack");
    this._pushEvent(`${p.name} founded ${pack.name}.`);
  }

  tryJoinNearbyPack(wsId) {
    const p = this.players.get(wsId);
    if (!p?.alive) return;
    const sp = SPECIES[p.speciesId];
    if (sp.social === "solitary") return;
    if (p.packId) return;

    let best = null;
    let bestD = 220;
    for (const o of this.allCreatures()) {
      if (!o.alive || o.id === p.id) continue;
      if (o.speciesId !== p.speciesId) continue;
      if (!o.packId) continue;
      const d = dist(p, o);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    if (best) {
      if (this._joinPack(p, best.packId)) {
        const pack = this.packs.get(best.packId);
        this._grantXp(p, 15, "joined a pack");
        this._pushEvent(`${p.name} joined ${pack.name}.`);
      }
      return;
    }

    const loner = this.allCreatures().find(
      (o) =>
        o.alive &&
        o.id !== p.id &&
        o.speciesId === p.speciesId &&
        !o.packId &&
        dist(p, o) < 200
    );
    if (loner) {
      const pack = this._createPack(p);
      this._joinPack(loner, pack.id);
      this._grantXp(p, 20, "recruited packmate");
      this._pushEvent(`${p.name} formed ${pack.name} with ${loner.name}.`);
    }
  }

  tryLeavePack(wsId) {
    const p = this.players.get(wsId);
    if (!p?.packId) return;
    const name = this.packs.get(p.packId)?.name || "the pack";
    this._leavePack(p);
    this._pushEvent(`${p.name} left ${name}.`);
  }

  // —— Territories ——
  tryClaimTerritory(wsId) {
    const p = this.players.get(wsId);
    if (!p?.alive) return;
    const sp = SPECIES[p.speciesId];
    const rank = rankForXp(p.xp || 0);
    if (rank.id === "juvenile") {
      this._pushEvent(`Reach Adult rank before claiming territory.`);
      return;
    }
    if (p.territoryId) {
      this._pushEvent(`You already hold a territory.`);
      return;
    }
    for (const t of this.territories.values()) {
      if (dist(p, t) < t.radius * 0.85) {
        this._pushEvent(`Too close to another claim — move farther.`);
        return;
      }
    }
    const biome = biomeAt(p.x, p.y, WORLD.width, WORLD.height);
    const favored = sp.favoredBiomes.includes(biome.id);
    const radius = rank.territoryR * (favored ? sp.territoryMul : 0.85);
    const terr = {
      id: nid("terr"),
      ownerId: p.id,
      packId: p.packId || null,
      speciesId: p.speciesId,
      x: p.x,
      y: p.y,
      radius,
      biomeId: biome.id,
      control: 100,
      contestedBy: null,
    };
    this.territories.set(terr.id, terr);
    p.territoryId = terr.id;
    const xp = favored ? 40 : 25;
    this._grantXp(p, xp, "claimed territory");
    this._pushEvent(
      `${p.name} claimed ${biome.name} territory (${Math.round(radius)}m).`
    );
  }

  _abandonTerritory(ent) {
    if (!ent.territoryId) return;
    this.territories.delete(ent.territoryId);
    ent.territoryId = null;
  }

  _tickTerritories(dt) {
    for (const t of [...this.territories.values()]) {
      const owner = this.getCreature(t.ownerId);
      if (!owner || !owner.alive) {
        this.territories.delete(t.id);
        continue;
      }
      let contest = null;
      for (const o of this.allCreatures()) {
        if (!o.alive || o.id === owner.id) continue;
        if (dist(o, t) > t.radius) continue;
        const osp = SPECIES[o.speciesId];
        const samePack =
          (o.packId && o.packId === t.packId) ||
          (o.packId && owner.packId && o.packId === owner.packId);
        if (samePack) continue;
        if (osp.guild === "prey") continue;
        if (
          osp.id === owner.speciesId ||
          osp.guild === "apex" ||
          osp.guild === "megaherbivore"
        ) {
          contest = o;
          break;
        }
      }
      if (contest) {
        t.contestedBy = contest.id;
        t.control = Math.max(0, t.control - 12 * dt);
        if (t.control <= 0) {
          this.territories.delete(t.id);
          owner.territoryId = null;
          if (contest.isPlayer) {
            this._grantXp(contest, 50, "seized territory");
          }
          this._pushEvent(`${contest.name} seized territory from ${owner.name}!`);
        }
      } else {
        t.contestedBy = null;
        t.control = Math.min(100, t.control + 8 * dt);
        if (owner.isPlayer && dist(owner, t) < t.radius) {
          owner._terrXpAcc = (owner._terrXpAcc || 0) + dt;
          if (owner._terrXpAcc >= 8) {
            owner._terrXpAcc = 0;
            this._grantXp(owner, 3, null);
          }
          owner.health = Math.min(owner.maxHealth, owner.health + 1.5 * dt);
          owner.stamina = Math.min(owner.maxStamina, owner.stamina + 2 * dt);
        }
      }
      if (owner.packId) t.packId = owner.packId;
    }
  }

  // —— Progression ——
  _grantXp(ent, amount, reason) {
    if (!ent || !amount) return;
    const before = rankForXp(ent.xp || 0);
    ent.xp = (ent.xp || 0) + amount;
    ent.lifetimeXp = (ent.lifetimeXp || 0) + amount;
    const after = rankForXp(ent.xp);
    if (after.id !== before.id && ent.isPlayer) {
      this._pushEvent(`${ent.name} ascended to ${after.name}!`);
    } else if (reason && ent.isPlayer && amount >= 15) {
      this._pushEvent(`${ent.name} +${amount} XP (${reason}).`);
    }
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
    const rank = rankForXp(ent.xp || 0);
    ent.hunger = clamp(ent.hunger - sp.hungerRate * 1.8 * dt, 0, 100);
    ent.thirst = clamp(ent.thirst - sp.thirstRate * 2.0 * dt, 0, 100);
    if (ent.hunger < 12) ent.health -= 4 * dt;
    if (ent.thirst < 10) ent.health -= 6 * dt;
    if (!ent.sprint) {
      ent.stamina = Math.min(ent.maxStamina, ent.stamina + 12 * sp.stamina * dt);
    }
    ent.attackCd = Math.max(0, ent.attackCd - dt);
    if (ent.isPlayer) {
      ent._liveXpAcc = (ent._liveXpAcc || 0) + dt;
      if (ent._liveXpAcc >= 20) {
        ent._liveXpAcc = 0;
        this._grantXp(ent, 2, null);
      }
    }
    ent._powerMul = rank.powerMul;
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
      if (!dx && !dy) p.angle = Math.atan2(input.aimY - p.y, input.aimX - p.x);
    }
    if (dx || dy) this._moveCreature(p, sp, dx, dy, !!input.sprint, dt);
    this._survivalDrain(p, sp, dt);

    if (input.attack) this._tryAttack(p);
    if (input.eat) this._tryEat(p);
    if (input.drink) this._tryDrink(p);
    if (input.pack) {
      if (p.packId) this.tryLeavePack(p.id);
      else {
        this.tryJoinNearbyPack(p.id);
        if (!p.packId) this.tryCreatePack(p.id);
      }
    }
    if (input.territory) this.tryClaimTerritory(p.id);

    if (p.input) {
      p.input.attack = false;
      p.input.eat = false;
      p.input.drink = false;
      p.input.pack = false;
      p.input.territory = false;
    }
  }

  _updateNpc(n, dt) {
    const sp = SPECIES[n.speciesId];
    this._survivalDrain(n, sp, dt);
    if (!n.alive) return;

    const ai = n.ai;
    ai.timer -= dt;

    // Pack members follow leader when not hungry/thirsty
    if (n.packId) {
      const pack = this.packs.get(n.packId);
      if (pack && pack.leaderId !== n.id) {
        const leader = this.getCreature(pack.leaderId);
        if (leader?.alive && dist(n, leader) > 90) {
          this._steerToward(n, sp, leader.x, leader.y, dist(n, leader) > 180, dt);
          if (n.hunger > 40 && n.thirst > 40) return;
        }
      }
    }

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
      if (!plant) ai.state = "wander";
      else if (dist(n, plant) < 36) {
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

    // Prey flee when hurt
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
      if (hunter.packId && o.packId === hunter.packId) continue;
      const osp = SPECIES[o.speciesId];
      if (!canHunt(sp, osp)) {
        if (
          !(
            sp.diet !== "herbivore" &&
            osp.trophic < sp.trophic &&
            osp.combatPower < sp.combatPower
          )
        ) {
          continue;
        }
      }
      if (osp.guild === "megaherbivore" && sp.guild !== "apex") continue;
      const d = dist(hunter, o);
      if (d > 520) continue;
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
    if (!ent.packId) return 1;
    const pack = this.packs.get(ent.packId);
    if (!pack) return 1;
    let n = 0;
    for (const id of pack.memberIds) {
      const m = this.getCreature(id);
      if (m?.alive && dist(ent, m) < 220) n += 1;
    }
    return Math.min(Math.max(1, n), 10);
  }

  _tryAttack(ent) {
    if (!ent.alive || ent.attackCd > 0) return;
    const sp = SPECIES[ent.speciesId];
    ent.attackCd = sp.attackCooldown;
    const pack = this._packCount(ent);
    const powerMul = ent._powerMul || rankForXp(ent.xp || 0).powerMul;
    const dmg = strikeDamage(sp, ent.stamina / ent.maxStamina, pack) * powerMul;

    let target = null;
    let bestD = sp.attackRange + 8;
    const fx = Math.cos(ent.angle);
    const fy = Math.sin(ent.angle);
    for (const o of this.allCreatures()) {
      if (!o.alive || o.id === ent.id) continue;
      if (ent.packId && o.packId === ent.packId) continue;
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
    // Herbivores may attack defensively; carnivores/omnivores respect canHunt when hunting
    const hunting = sp.diet !== "herbivore";
    if (hunting && !canHunt(sp, tsp) && tsp.combatPower >= sp.combatPower) {
      // Still allow strikes on weaker targets / defensive scraps
      if (tsp.combatPower > sp.combatPower * 1.15) return;
    }

    const mitigation = 1 / (1 + tsp.armor * 0.8);
    const dealt = dmg * mitigation;
    target.health -= dealt;
    target.lastHitBy = ent.id;
    ent.stamina = Math.max(0, ent.stamina - 8);

    if (target.health <= 0) {
      this._kill(target, ent.id);
      if (sp.diet !== "herbivore") {
        ent.hunger = Math.min(100, ent.hunger + 28 + tsp.massKg * 0.02);
        ent.killCount += 1;
        const xpGain = Math.round(8 + tsp.combatPower * 0.08);
        this._grantXp(ent, xpGain, `slew ${tsp.name}`);
        if (ent.packId) {
          const pck = this.packs.get(ent.packId);
          if (pck) {
            for (const id of pck.memberIds) {
              if (id === ent.id) continue;
              const m = this.getCreature(id);
              if (m?.alive && dist(ent, m) < 280) {
                this._grantXp(m, Math.round(xpGain * 0.35), null);
              }
            }
          }
        }
      } else {
        this._grantXp(ent, 12, "defended with force");
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
    this._pushEvent(`${victim.name} (${sp.name}) fell to ${kName}.`);
    if (victim.packId) this._leavePack(victim);
    if (victim.territoryId) this._abandonTerritory(victim);
    if (!victim.isPlayer) {
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
    // Keep XP on death — progression persists
    const pos = this._favoredSpawn(sp);
    p.x = pos.x;
    p.y = pos.y;
    p.protectUntil = Date.now() + 20000;
    this._clearThreatsNear(p, 280);
    this._pushEvent(`${p.name} returns as ${sp.name}.`);
  }

  _clearThreatsNear(ent, radius) {
    const sp = SPECIES[ent.speciesId];
    for (const o of this.npcs.values()) {
      if (!o.alive) continue;
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
    if (ent.isPlayer) {
      ent._forageXpAcc = (ent._forageXpAcc || 0) + take;
      if (ent._forageXpAcc >= 40) {
        ent._forageXpAcc = 0;
        this._grantXp(ent, 5, null);
      }
    }
  }

  _scavenge(ent, carcass) {
    const sp = SPECIES[ent.speciesId];
    if (!canScavenge(sp)) return;
    const take = Math.min(carcass.meat, 14);
    carcass.meat -= take;
    ent.hunger = Math.min(100, ent.hunger + take * 1.1);
    if (ent.isPlayer) this._grantXp(ent, 2, null);
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
    const viewR = 1200;
    const biome = biomeAt(vx, vy, WORLD.width, WORLD.height);

    const creatures = [];
    for (const c of this.allCreatures()) {
      if (!c.alive && !c.isPlayer) continue;
      if (Math.hypot(c.x - vx, c.y - vy) > viewR) continue;
      const sp = SPECIES[c.speciesId];
      const rank = rankForXp(c.xp || 0);
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
        combatPower: Math.round(sp.combatPower * rank.powerMul * 10) / 10,
        trophic: sp.trophic,
        guild: sp.guild,
        color: sp.color,
        accent: sp.accent,
        silhouette: sp.silhouette,
        sprint: !!c.sprint,
        packId: c.packId,
        territoryId: c.territoryId,
        rankId: rank.id,
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

    const territories = [...this.territories.values()]
      .filter((t) => Math.hypot(t.x - vx, t.y - vy) < viewR + t.radius)
      .map((t) => ({
        id: t.id,
        x: t.x,
        y: t.y,
        radius: t.radius,
        speciesId: t.speciesId,
        ownerId: t.ownerId,
        packId: t.packId,
        control: t.control,
        contested: !!t.contestedBy,
        color: SPECIES[t.speciesId]?.color || "#aaa",
        mine:
          t.ownerId === viewerId ||
          (viewer?.packId && t.packId === viewer.packId),
      }));

    let you = null;
    if (viewer) {
      const sp = SPECIES[viewer.speciesId];
      const prog = xpProgress(viewer.xp || 0);
      const pack = viewer.packId ? this.packs.get(viewer.packId) : null;
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
        combatPower: Math.round(sp.combatPower * prog.cur.powerMul * 10) / 10,
        diet: sp.diet,
        guild: sp.guild,
        trophic: sp.trophic,
        speciesName: sp.name,
        social: sp.social,
        packLabel: sp.packLabel,
        xp: viewer.xp || 0,
        lifetimeXp: viewer.lifetimeXp || 0,
        rankId: prog.cur.id,
        rankName: prog.cur.name,
        rankLabel: prog.cur.label,
        rankPct: prog.pct,
        nextRankName: prog.nxt?.name || null,
        xpInto: prog.into,
        xpNeed: prog.need,
        packId: viewer.packId,
        packTitle: pack?.name || null,
        packSize: pack?.memberIds.length || 0,
        isPackLeader: pack?.leaderId === viewer.id,
        territoryId: viewer.territoryId,
        canClaimTerritory: prog.cur.id !== "juvenile" && !viewer.territoryId,
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
      territories,
      events: this.events.slice(-10),
      biome: biome.id,
      biomeName: biome.name,
      biomes: BIOMES.map((b) => ({ id: b.id, name: b.name, color: b.color })),
    };
  }
}

export { biomeAt, BIOMES };
