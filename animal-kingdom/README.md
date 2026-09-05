# Lifechain

Hyper-realistic animal kingdom MMO prototype — **Apex Five** edition.

## Run

```bash
cd animal-kingdom
npm install
npm start
```

Open **http://localhost:3847**

## Apex Five (playable)

| Rank | Species | Social | Role |
|------|---------|--------|------|
| 1 | Nile Crocodile | Solitary | Water apex |
| 2 | African Elephant | Herd | Megaherbivore |
| 3 | Brown Bear | Solitary | Forest apex |
| 4 | Lion | Pride | Plains apex |
| 5 | Cape Buffalo | Herd | Armored megaherbivore |

Prey wildlife (impala, zebra, warthog, rabbit) still fills the food web as NPCs.

## Systems

- **Food chain** — hunt / forage / scavenge by diet and combat power
- **Packs** — pride/herd create-join-leave (`F`); pack damage share + XP share
- **Territories** — claim at Adult+ (`T`); regen + XP inside; rivals can contest
- **Biomes** — savanna, woodland, wetland, ridge, scrub, floodplain, forest, riverine
- **Progression** — Juvenile → Adult → Prime → Legend → Mythic (XP persists on death + local bloodline save)

## Controls

| Key | Action |
|-----|--------|
| WASD / arrows | Move |
| Shift | Sprint |
| Click / Space | Attack / hunt |
| E | Eat / forage / scavenge |
| Q | Drink |
| F | Create / join / leave pack |
| T | Claim territory |
| Tab | Apex ladder |
| Esc | Menu |
