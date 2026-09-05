const boot = document.getElementById("boot");
const selectEl = document.getElementById("select");
const foodwebEl = document.getElementById("foodweb");
const gameEl = document.getElementById("game");
const speciesGrid = document.getElementById("speciesGrid");
const powerLadder = document.getElementById("powerLadder");
const rankGuide = document.getElementById("rankGuide");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let species = [];
let ranks = [];
let selectedId = null;
let ws = null;
let myId = null;
let state = null;
let joined = false;

const keys = new Set();
const mouse = { x: 0, y: 0, down: false, worldX: 0, worldY: 0 };
const camera = { x: 0, y: 0 };

async function loadCatalog() {
  const [spRes, metaRes] = await Promise.all([
    fetch("/api/species"),
    fetch("/api/meta"),
  ]);
  species = await spRes.json();
  const meta = await metaRes.json();
  ranks = meta.ranks || [];
  renderSpecies();
  renderFoodWeb();
  renderRanks();
}

function renderSpecies() {
  speciesGrid.innerHTML = "";
  for (const s of species) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "species" + (selectedId === s.id ? " selected" : "");
    btn.style.setProperty("--c", s.color);
    btn.style.setProperty("--a", s.accent);
    btn.innerHTML = `
      <div class="swatch"></div>
      <strong>${s.name}</strong>
      <div class="meta">${s.scientific}</div>
      <div class="meta">${s.diet} · ${s.guild} · ${s.social} · T${s.trophic.toFixed(1)}</div>
      <div class="meta">${s.description}</div>
      <div class="power">Power ${s.combatPower.toFixed(1)} · ${s.packLabel} · ${s.massKg} kg</div>
    `;
    btn.addEventListener("click", () => {
      selectedId = s.id;
      renderSpecies();
      document.getElementById("joinBtn").disabled = false;
    });
    speciesGrid.appendChild(btn);
  }
}

function renderFoodWeb() {
  powerLadder.innerHTML = species
    .map(
      (s, i) => `
    <li style="--c:${s.color}">
      <div class="rank">#${i + 1}</div>
      <div class="label">
        <strong>${s.name}</strong>
        <span>${s.diet} · ${s.social} · ${s.preyHint}</span>
      </div>
      <div class="stat">${s.combatPower.toFixed(1)}</div>
    </li>`
    )
    .join("");
}

function renderRanks() {
  rankGuide.innerHTML = `
    <h3>Bloodline ranks</h3>
    <ul>${ranks
      .map(
        (r) =>
          `<li><strong>${r.name}</strong> — ${r.xp} XP · ${r.label}</li>`
      )
      .join("")}</ul>`;
}

function show(el) {
  boot.classList.add("hidden");
  selectEl.classList.add("hidden");
  foodwebEl.classList.add("hidden");
  gameEl.classList.add("hidden");
  el.classList.remove("hidden");
}

document.getElementById("enterBtn").addEventListener("click", () => show(selectEl));
document.getElementById("webBtn").addEventListener("click", () => show(foodwebEl));
document.getElementById("closeWeb").addEventListener("click", () => show(boot));
document.getElementById("backBoot").addEventListener("click", () => show(boot));

document.getElementById("joinBtn").addEventListener("click", () => {
  if (!selectedId) return;
  const name = document.getElementById("playerName").value.trim() || "Wanderer";
  connectAndJoin(selectedId, name);
});

document.getElementById("respawnBtn").addEventListener("click", () => {
  ws?.send(JSON.stringify({ type: "respawn" }));
});

function connectAndJoin(speciesId, name) {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${proto}://${location.host}/ws`);
  ws.addEventListener("open", () => {
    // Restore lifetime XP from localStorage bloodline
    let bloodline = {};
    try {
      bloodline = JSON.parse(localStorage.getItem("lifechain_bloodline") || "{}");
    } catch {
      bloodline = {};
    }
    ws.send(
      JSON.stringify({
        type: "join",
        speciesId,
        name,
        savedXp: bloodline[speciesId] || 0,
      })
    );
  });
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.type === "welcome") myId = msg.id;
    if (msg.type === "joined") {
      joined = true;
      show(gameEl);
      resize();
      loop();
      startInputPump();
    }
    if (msg.type === "state") {
      state = msg.state;
      persistBloodline();
    }
  });
  ws.addEventListener("close", () => {
    if (joined) {
      document.getElementById("feed").innerHTML =
        `<div>Connection lost — refresh to rejoin the wild.</div>`;
    }
  });
}

function persistBloodline() {
  if (!state?.you) return;
  try {
    const bloodline = JSON.parse(localStorage.getItem("lifechain_bloodline") || "{}");
    const sid = state.you.speciesId;
    const xp = state.you.lifetimeXp || state.you.xp || 0;
    if (!bloodline[sid] || xp > bloodline[sid]) {
      bloodline[sid] = xp;
      localStorage.setItem("lifechain_bloodline", JSON.stringify(bloodline));
    }
  } catch {
    /* ignore */
  }
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);

window.addEventListener("keydown", (e) => {
  keys.add(e.code);
  if (e.code === "Tab") {
    e.preventDefault();
    if (!gameEl.classList.contains("hidden")) show(foodwebEl);
    else if (!foodwebEl.classList.contains("hidden") && joined) show(gameEl);
  }
  if (e.code === "Escape") {
    if (!foodwebEl.classList.contains("hidden") && joined) show(gameEl);
    else if (!selectEl.classList.contains("hidden")) show(boot);
  }
  if (["Space", "KeyE", "KeyQ", "KeyF", "KeyT"].includes(e.code)) e.preventDefault();
});
window.addEventListener("keyup", (e) => keys.delete(e.code));

canvas.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
canvas.addEventListener("mousedown", () => {
  mouse.down = true;
});
window.addEventListener("mouseup", () => {
  mouse.down = false;
});

function buildInput() {
  return {
    up: keys.has("KeyW") || keys.has("ArrowUp"),
    down: keys.has("KeyS") || keys.has("ArrowDown"),
    left: keys.has("KeyA") || keys.has("ArrowLeft"),
    right: keys.has("KeyD") || keys.has("ArrowRight"),
    sprint: keys.has("ShiftLeft") || keys.has("ShiftRight"),
    attack: mouse.down || keys.has("Space"),
    eat: keys.has("KeyE"),
    drink: keys.has("KeyQ"),
    pack: keys.has("KeyF"),
    territory: keys.has("KeyT"),
    aimX: mouse.worldX,
    aimY: mouse.worldY,
  };
}

function startInputPump() {
  setInterval(() => {
    if (!ws || ws.readyState !== 1 || !joined) return;
    ws.send(JSON.stringify({ type: "input", input: buildInput() }));
    if (keys.has("KeyE")) keys.delete("KeyE");
    if (keys.has("KeyQ")) keys.delete("KeyQ");
    if (keys.has("KeyF")) keys.delete("KeyF");
    if (keys.has("KeyT")) keys.delete("KeyT");
  }, 50);
}

function dayLabel(t) {
  if (t < 0.2) return "Night";
  if (t < 0.28) return "Dawn";
  if (t < 0.55) return "Day";
  if (t < 0.7) return "Golden hour";
  if (t < 0.8) return "Dusk";
  return "Night";
}

function skyColors(t) {
  if (t < 0.2 || t > 0.85) return { top: "#070b12", mid: "#121a22", bot: "#1a1510", light: 0.35 };
  if (t < 0.3) return { top: "#2a3344", mid: "#8a5a3a", bot: "#3a2a1c", light: 0.7 };
  if (t < 0.55) return { top: "#4a7a9a", mid: "#87a878", bot: "#3d5c3a", light: 1 };
  if (t < 0.72) return { top: "#3a4a6a", mid: "#c47a3a", bot: "#4a3020", light: 0.85 };
  return { top: "#1a2030", mid: "#6a3a2a", bot: "#1a1510", light: 0.5 };
}

function biomeTint(id) {
  const map = {
    savanna: [194, 166, 106],
    woodland: [61, 92, 58],
    wetland: [47, 94, 78],
    ridge: [107, 99, 88],
    scrub: [168, 144, 96],
    floodplain: [106, 138, 74],
    forest: [31, 61, 42],
    riverine: [58, 106, 90],
  };
  return map[id] || [80, 90, 60];
}

function drawSilhouette(kind, x, y, angle, scale, fill, stroke) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5 / scale;
  ctx.beginPath();
  switch (kind) {
    case "rabbit":
      ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);
      ctx.moveTo(4, -6);
      ctx.ellipse(6, -14, 3, 8, 0.2, 0, Math.PI * 2);
      break;
    case "antelope":
      ctx.ellipse(0, 2, 18, 10, 0, 0, Math.PI * 2);
      ctx.moveTo(14, -2);
      ctx.ellipse(18, -4, 7, 5, 0, 0, Math.PI * 2);
      break;
    case "boar":
      ctx.ellipse(0, 2, 16, 11, 0, 0, Math.PI * 2);
      ctx.moveTo(12, 0);
      ctx.ellipse(16, 1, 7, 6, 0, 0, Math.PI * 2);
      break;
    case "felid":
      ctx.ellipse(0, 2, 17, 9, 0, 0, Math.PI * 2);
      ctx.moveTo(14, -1);
      ctx.ellipse(20, -2, 8, 5.5, 0, 0, Math.PI * 2);
      break;
    case "croc":
      ctx.ellipse(0, 0, 28, 8, 0, 0, Math.PI * 2);
      ctx.moveTo(24, 0);
      ctx.ellipse(34, 0, 12, 4, 0, 0, Math.PI * 2);
      break;
    case "buffalo":
      ctx.ellipse(0, 2, 22, 13, 0, 0, Math.PI * 2);
      ctx.moveTo(16, -2);
      ctx.ellipse(22, -2, 9, 7, 0, 0, Math.PI * 2);
      break;
    case "elephant":
      ctx.ellipse(0, 2, 28, 16, 0, 0, Math.PI * 2);
      ctx.moveTo(20, 0);
      ctx.ellipse(28, -2, 12, 10, 0, 0, Math.PI * 2);
      ctx.moveTo(30, 6);
      ctx.quadraticCurveTo(40, 18, 34, 24);
      break;
    case "bear":
      ctx.ellipse(0, 2, 20, 13, 0, 0, Math.PI * 2);
      ctx.moveTo(14, -2);
      ctx.ellipse(20, -2, 9, 8, 0, 0, Math.PI * 2);
      break;
    default:
      ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f3ead8";
  ctx.beginPath();
  ctx.arc(kind === "croc" ? 30 : 16, -2, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWorld() {
  const w = innerWidth;
  const h = innerHeight;
  const sky = skyColors(state?.timeOfDay ?? 0.3);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, sky.top);
  g.addColorStop(0.45, sky.mid);
  g.addColorStop(1, sky.bot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  if (!state?.you) return;

  camera.x += (state.you.x - camera.x) * 0.12;
  camera.y += (state.you.y - camera.y) * 0.12;
  mouse.worldX = mouse.x + camera.x - w / 2;
  mouse.worldY = mouse.y + camera.y - h / 2;

  ctx.save();
  ctx.translate(w / 2 - camera.x, h / 2 - camera.y);

  const tint = biomeTint(state.biome);
  const tile = 120;
  const x0 = Math.floor((camera.x - w / 2) / tile) * tile;
  const y0 = Math.floor((camera.y - h / 2) / tile) * tile;
  for (let x = x0; x < camera.x + w / 2 + tile; x += tile) {
    for (let y = y0; y < camera.y + h / 2 + tile; y += tile) {
      const n = Math.sin(x * 0.01) * Math.cos(y * 0.013);
      ctx.fillStyle = `rgba(${tint[0] + n * 12},${tint[1] + n * 10},${tint[2] + n * 8},${0.28 * sky.light})`;
      ctx.fillRect(x, y, tile, tile);
    }
  }

  // Territories
  for (const t of state.territories || []) {
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
    ctx.fillStyle = t.mine
      ? "rgba(224,160,69,0.12)"
      : t.contested
        ? "rgba(180,40,30,0.14)"
        : "rgba(255,255,255,0.05)";
    ctx.fill();
    ctx.strokeStyle = t.mine
      ? "rgba(224,160,69,0.55)"
      : t.contested
        ? "rgba(200,60,40,0.5)"
        : "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.setLineDash(t.contested ? [8, 6] : []);
    ctx.stroke();
    ctx.setLineDash([]);
    if (t.mine || t.contested) {
      ctx.fillStyle = t.mine ? "#f0c57a" : "#e08070";
      ctx.font = "600 11px Karla, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        t.contested ? `Contested ${Math.round(t.control)}%` : "Your territory",
        t.x,
        t.y - t.radius - 8
      );
    }
  }

  for (const water of state.waters || []) {
    const grd = ctx.createRadialGradient(water.x, water.y, 4, water.x, water.y, water.r);
    grd.addColorStop(0, "rgba(80,180,190,0.55)");
    grd.addColorStop(0.7, "rgba(30,90,100,0.45)");
    grd.addColorStop(1, "rgba(20,50,55,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(water.x, water.y, water.r, water.r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const p of state.plants || []) {
    const s = 4 + p.biomass * 0.08;
    ctx.fillStyle = `rgba(${40 + p.biomass},${90 + p.biomass * 0.4},40,0.85)`;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - s);
    ctx.lineTo(p.x + s * 0.6, p.y + s * 0.4);
    ctx.lineTo(p.x - s * 0.6, p.y + s * 0.4);
    ctx.fill();
  }

  for (const c of state.carcasses || []) {
    ctx.fillStyle = "rgba(60,30,20,0.85)";
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 14, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  const creatures = [...(state.creatures || [])].sort((a, b) => a.y - b.y);
  for (const c of creatures) {
    const scale = 0.7 + Math.min(1.8, Math.log10((c.combatPower || 10) + 10) * 0.55);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + 10 * scale, 16 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    drawSilhouette(
      c.silhouette || "felid",
      c.x,
      c.y,
      c.angle || 0,
      scale,
      c.alive ? c.color : "#3a3030",
      c.accent || "#111"
    );

    // Pack ring
    if (c.packId && state.you?.packId && c.packId === state.you.packId) {
      ctx.strokeStyle = "rgba(224,160,69,0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 20 * scale, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (c.isPlayer || c.id === state.you.id) {
      ctx.fillStyle = c.id === state.you.id ? "#f0c57a" : "#d8c3a0";
      ctx.font = "600 11px Karla, sans-serif";
      ctx.textAlign = "center";
      const label = c.rankId && c.rankId !== "juvenile" ? `${c.name} · ${c.rankId}` : c.name;
      ctx.fillText(label, c.x, c.y - 28 * scale);
    }
    if (c.health < c.maxHealth) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(c.x - 16, c.y - 22 * scale, 32, 3);
      ctx.fillStyle = "#d45a3a";
      ctx.fillRect(c.x - 16, c.y - 22 * scale, 32 * (c.health / c.maxHealth), 3);
    }
  }

  ctx.restore();

  const night = state.timeOfDay < 0.2 || state.timeOfDay > 0.8;
  if (night) {
    ctx.fillStyle = "rgba(4,8,16,0.35)";
    ctx.fillRect(0, 0, w, h);
  }
  const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

function updateHud() {
  if (!state?.you) return;
  const y = state.you;
  document.getElementById("hpBar").style.width = `${clamp(y.health)}%`;
  document.getElementById("stBar").style.width = `${clamp(y.stamina)}%`;
  document.getElementById("huBar").style.width = `${clamp(y.hunger)}%`;
  document.getElementById("thBar").style.width = `${clamp(y.thirst)}%`;
  document.getElementById("xpBar").style.width = `${Math.round((y.rankPct || 0) * 100)}%`;
  document.getElementById("rankName").textContent = y.rankName || "Juvenile";
  document.getElementById("xpLabel").textContent = y.nextRankName
    ? `${Math.round(y.xpInto || 0)}/${Math.round(y.xpNeed || 1)} → ${y.nextRankName}`
    : `${Math.round(y.xp || 0)} XP · Max rank`;
  document.getElementById("rankHint").textContent = y.rankLabel || "";
  document.getElementById("clock").textContent = dayLabel(state.timeOfDay);
  document.getElementById("biome").textContent = (state.biomeName || state.biome || "wild").toUpperCase();

  document.getElementById("youCard").innerHTML = `
    <strong>${y.speciesName}</strong> · ${y.diet} · ${y.guild}<br/>
    Power ${Number(y.combatPower).toFixed(1)} · Trophic ${Number(y.trophic).toFixed(1)} · Kills ${y.killCount || 0}
  `;

  const packLine = y.packTitle
    ? `${y.isPackLeader ? "Leading" : "In"} ${y.packTitle} (${y.packSize})`
    : y.social === "solitary"
      ? "Solitary — press T to claim territory"
      : `No ${y.packLabel || "pack"} — press F near kin`;
  const terrLine = y.territoryId
    ? "Holding territory"
    : y.canClaimTerritory
      ? "Press T to claim this ground"
      : "Reach Adult to claim territory";
  document.getElementById("socialCard").innerHTML = `${packLine}<br/>${terrLine}`;

  document.getElementById("feed").innerHTML = (state.events || [])
    .slice()
    .reverse()
    .map((e) => `<div>${e.text || e}</div>`)
    .join("");

  const death = document.getElementById("death");
  if (!y.alive) {
    death.classList.remove("hidden");
    document.getElementById("deathText").textContent =
      y.respawnTimer > 0
        ? `Bloodline intact. Returning in ${Math.ceil(y.respawnTimer)}s…`
        : "Bloodline XP endures. Return when ready.";
    document.getElementById("respawnBtn").disabled = y.respawnTimer > 0;
  } else {
    death.classList.add("hidden");
  }
}

function clamp(v) {
  return Math.max(0, Math.min(100, v));
}

function loop() {
  drawWorld();
  updateHud();
  requestAnimationFrame(loop);
}

loadCatalog().catch((err) => {
  console.error(err);
  document.querySelector(".tagline").textContent =
    "Could not load catalog. Is the server running?";
});

window.lifechainQuickJoin = (speciesId = "lion", name = "Wanderer") => {
  selectedId = speciesId;
  const input = document.getElementById("playerName");
  if (input) input.value = name;
  connectAndJoin(speciesId, name);
};
