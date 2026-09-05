const boot = document.getElementById("boot");
const selectEl = document.getElementById("select");
const foodwebEl = document.getElementById("foodweb");
const gameEl = document.getElementById("game");
const speciesGrid = document.getElementById("speciesGrid");
const powerLadder = document.getElementById("powerLadder");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let species = [];
let selectedId = null;
let ws = null;
let myId = null;
let state = null;
let joined = false;

const keys = new Set();
const mouse = { x: 0, y: 0, down: false, worldX: 0, worldY: 0 };
const camera = { x: 0, y: 0 };

async function loadSpecies() {
  const res = await fetch("/api/species");
  species = await res.json();
  renderSpecies();
  renderFoodWeb();
}

function renderSpecies() {
  speciesGrid.innerHTML = "";
  const sorted = [...species].sort((a, b) => a.combatPower - b.combatPower);
  for (const s of sorted) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "species" + (selectedId === s.id ? " selected" : "");
    btn.style.setProperty("--c", s.color);
    btn.style.setProperty("--a", s.accent);
    btn.innerHTML = `
      <div class="swatch"></div>
      <strong>${s.name}</strong>
      <div class="meta">${s.scientific}</div>
      <div class="meta">${s.diet} · ${s.guild} · trophic ${s.trophic.toFixed(1)}</div>
      <div class="meta">${s.description}</div>
      <div class="power">Power ${s.combatPower.toFixed(1)} · ${s.massKg} kg</div>
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
  const sorted = [...species].sort((a, b) => b.combatPower - a.combatPower);
  powerLadder.innerHTML = sorted
    .map(
      (s, i) => `
    <li style="--c:${s.color}">
      <div class="rank">#${i + 1}</div>
      <div class="label">
        <strong>${s.name}</strong>
        <span>${s.diet} · ${s.guild} · T${s.trophic.toFixed(1)} · ${s.preyHint}</span>
      </div>
      <div class="stat">${s.combatPower.toFixed(1)}</div>
    </li>`
    )
    .join("");
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
    ws.send(JSON.stringify({ type: "join", speciesId, name }));
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
    if (msg.type === "state") state = msg.state;
  });
  ws.addEventListener("close", () => {
    if (joined) {
      document.getElementById("feed").innerHTML =
        `<div>Connection lost — refresh to rejoin the wild.</div>`;
    }
  });
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
  if (["Space", "KeyE", "KeyQ"].includes(e.code)) e.preventDefault();
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
  const input = {
    up: keys.has("KeyW") || keys.has("ArrowUp"),
    down: keys.has("KeyS") || keys.has("ArrowDown"),
    left: keys.has("KeyA") || keys.has("ArrowLeft"),
    right: keys.has("KeyD") || keys.has("ArrowRight"),
    sprint: keys.has("ShiftLeft") || keys.has("ShiftRight"),
    attack: mouse.down || keys.has("Space"),
    eat: keys.has("KeyE"),
    drink: keys.has("KeyQ"),
    aimX: mouse.worldX,
    aimY: mouse.worldY,
  };
  return input;
}

function startInputPump() {
  setInterval(() => {
    if (!ws || ws.readyState !== 1 || !joined) return;
    ws.send(JSON.stringify({ type: "input", input: buildInput() }));
    // clear edge-triggered after send — server also clears; keep held attack via mouse
    if (keys.has("KeyE")) keys.delete("KeyE");
    if (keys.has("KeyQ")) keys.delete("KeyQ");
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
  // t 0..1
  if (t < 0.2 || t > 0.85) return { top: "#070b12", mid: "#121a22", bot: "#1a1510", light: 0.35 };
  if (t < 0.3) return { top: "#2a3344", mid: "#8a5a3a", bot: "#3a2a1c", light: 0.7 };
  if (t < 0.55) return { top: "#4a7a9a", mid: "#87a878", bot: "#3d5c3a", light: 1 };
  if (t < 0.72) return { top: "#3a4a6a", mid: "#c47a3a", bot: "#4a3020", light: 0.85 };
  return { top: "#1a2030", mid: "#6a3a2a", bot: "#1a1510", light: 0.5 };
}

function drawSilhouette(ctx, kind, x, y, angle, scale, fill, stroke) {
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
      ctx.moveTo(20, -10);
      ctx.lineTo(26, -22);
      ctx.moveTo(18, -10);
      ctx.lineTo(22, -20);
      break;
    case "boar":
      ctx.ellipse(0, 2, 16, 11, 0, 0, Math.PI * 2);
      ctx.moveTo(12, 0);
      ctx.ellipse(16, 1, 7, 6, 0, 0, Math.PI * 2);
      break;
    case "canid":
      ctx.ellipse(0, 2, 16, 9, 0, 0, Math.PI * 2);
      ctx.moveTo(12, -2);
      ctx.ellipse(18, -3, 8, 5, 0, 0, Math.PI * 2);
      ctx.moveTo(-14, -2);
      ctx.lineTo(-22, -6);
      break;
    case "hyena":
      ctx.ellipse(0, 1, 17, 10, 0, 0, Math.PI * 2);
      ctx.moveTo(12, -4);
      ctx.ellipse(17, -2, 8, 6, 0, 0, Math.PI * 2);
      break;
    case "felid":
      ctx.ellipse(0, 2, 17, 9, 0, 0, Math.PI * 2);
      ctx.moveTo(14, -1);
      ctx.ellipse(20, -2, 8, 5.5, 0, 0, Math.PI * 2);
      ctx.moveTo(-12, 0);
      ctx.lineTo(-20, 4);
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
      ctx.moveTo(18, -12);
      ctx.quadraticCurveTo(8, -20, -2, -10);
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
  // eye
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

  // ground texture tiles
  const tile = 120;
  const x0 = Math.floor((camera.x - w / 2) / tile) * tile;
  const y0 = Math.floor((camera.y - h / 2) / tile) * tile;
  for (let x = x0; x < camera.x + w / 2 + tile; x += tile) {
    for (let y = y0; y < camera.y + h / 2 + tile; y += tile) {
      const n = Math.sin(x * 0.01) * Math.cos(y * 0.013);
      const shade = 28 + n * 10;
      ctx.fillStyle = `rgb(${shade + 20},${shade + 28},${shade + 12})`;
      ctx.globalAlpha = 0.35 * sky.light;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.globalAlpha = 1;

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
    ctx.fillStyle = "rgba(139,46,31,0.5)";
    ctx.fillRect(c.x - 8, c.y - 2, 16 * (c.meat / 40), 3);
  }

  const creatures = [...(state.creatures || [])].sort((a, b) => a.y - b.y);
  for (const c of creatures) {
    const scale = 0.7 + Math.min(1.8, Math.log10((c.combatPower || 10) + 10) * 0.55);
    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + 10 * scale, 16 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    drawSilhouette(
      ctx,
      c.silhouette || "felid",
      c.x,
      c.y,
      c.angle || 0,
      scale,
      c.alive ? c.color : "#3a3030",
      c.accent || "#111"
    );

    // name / hp
    if (c.isPlayer || c.id === state.you.id) {
      ctx.fillStyle = c.id === state.you.id ? "#f0c57a" : "#d8c3a0";
      ctx.font = "600 11px Karla, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(c.name, c.x, c.y - 28 * scale);
    }
    if (c.health < c.maxHealth) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(c.x - 16, c.y - 22 * scale, 32, 3);
      ctx.fillStyle = "#d45a3a";
      ctx.fillRect(c.x - 16, c.y - 22 * scale, 32 * (c.health / c.maxHealth), 3);
    }
    if (c.sprint) {
      ctx.strokeStyle = "rgba(240,197,122,0.35)";
      ctx.beginPath();
      ctx.arc(c.x, c.y, 22 * scale, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();

  // vignette + night overlay
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
  document.getElementById("clock").textContent = dayLabel(state.timeOfDay);
  document.getElementById("biome").textContent = (state.biome || "wild").toUpperCase();
  document.getElementById("youCard").innerHTML = `
    <strong>${y.speciesName}</strong> · ${y.diet} · ${y.guild}<br/>
    Power ${y.combatPower.toFixed(1)} · Trophic ${y.trophic.toFixed(1)} · Kills ${y.killCount}
  `;
  document.getElementById("feed").innerHTML = (state.events || [])
    .slice()
    .reverse()
    .map((e) => `<div>${e.text}</div>`)
    .join("");

  const death = document.getElementById("death");
  if (!y.alive) {
    death.classList.remove("hidden");
    document.getElementById("deathText").textContent =
      y.respawnTimer > 0
        ? `Returning in ${Math.ceil(y.respawnTimer)}s…`
        : "Press return when you are ready.";
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

loadSpecies().catch((err) => {
  console.error(err);
  document.querySelector(".tagline").textContent =
    "Could not load species catalog. Is the server running?";
});

// Demo / automation helper
window.lifechainQuickJoin = (speciesId = "lion", name = "Wanderer") => {
  selectedId = speciesId;
  const input = document.getElementById("playerName");
  if (input) input.value = name;
  connectAndJoin(speciesId, name);
};
