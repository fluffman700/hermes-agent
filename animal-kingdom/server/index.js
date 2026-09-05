import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import { SPECIES_LIST, SPECIES, WORLD } from "./species.js";
import { LifechainWorld } from "./world.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.LIFECHAIN_PORT || 3847);

const app = express();
app.use(express.static(path.join(__dirname, "../client")));

app.get("/api/species", (_req, res) => {
  res.json(
    SPECIES_LIST.map((s) => ({
      id: s.id,
      name: s.name,
      scientific: s.scientific,
      diet: s.diet,
      guild: s.guild,
      trophic: s.trophic,
      massKg: s.massKg,
      combatPower: s.combatPower,
      speed: s.speed,
      armor: s.armor,
      biteForce: s.biteForce,
      color: s.color,
      accent: s.accent,
      description: s.description,
      preyHint: s.preyHint,
      silhouette: s.silhouette,
    }))
  );
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
const world = new LifechainWorld();

const sockets = new Map();

wss.on("connection", (ws) => {
  const id = `player_${Math.random().toString(36).slice(2, 10)}`;
  sockets.set(id, ws);
  ws.send(JSON.stringify({ type: "welcome", id, species: SPECIES_LIST.map((s) => s.id) }));

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (msg.type === "join") {
      const sid = SPECIES[msg.speciesId] ? msg.speciesId : "impala";
      world.spawnPlayer(id, sid, msg.name || "Wanderer");
      ws.send(JSON.stringify({ type: "joined", id, speciesId: sid }));
      return;
    }
    if (msg.type === "input") {
      world.setInput(id, msg.input || {});
      return;
    }
    if (msg.type === "respawn") {
      world.respawnPlayer(id);
    }
  });

  ws.on("close", () => {
    world.removePlayer(id);
    sockets.delete(id);
  });
});

let last = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  world.tick(dt);

  for (const [id, ws] of sockets) {
    if (ws.readyState !== 1) continue;
    if (!world.players.has(id)) continue;
    const snap = world.snapshotFor(id);
    ws.send(JSON.stringify({ type: "state", state: snap }));
  }
}, WORLD.tickMs);

server.listen(PORT, () => {
  console.log(`Lifechain running at http://localhost:${PORT}`);
});
