# Lifechain

A hyper-realistic animal kingdom MMO prototype. Pick a species, survive the food web, and climb (or fall) the power scale.

## Run

```bash
cd animal-kingdom
npm install
npm start
```

Open **http://localhost:3847**

## Systems

- **Food chain** — herbivores forage plants; carnivores hunt; omnivores do both. You can only consume prey your trophic role and power allow.
- **Power scaling** — combat score from mass, bite force, speed, armor, and pack bonus. Ambush and stamina matter.
- **Biomes** — savanna, woodland, wetland, and ridgeline with different forage density and cover.
- **Multiplayer** — WebSocket world; other players and AI wildlife share the same map.
- **Survival** — hunger, thirst, stamina, health, day/night, and carcass scavenging.

## Controls

| Key | Action |
|-----|--------|
| WASD / arrows | Move |
| Mouse | Aim facing |
| Left click / Space | Attack / hunt |
| E | Eat / forage / scavenge |
| Q | Drink (near water) |
| Shift | Sprint |
| Tab | Species / food-web panel |
| Esc | Menu |
