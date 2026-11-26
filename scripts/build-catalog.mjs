import { writeFileSync } from "node:fs";

const prices = JSON.parse(
  (await import("node:fs")).readFileSync("/tmp/free_prices.json", "utf8"),
);
const bymykel = JSON.parse(
  (await import("node:fs")).readFileSync("/tmp/skins.json", "utf8"),
);

const USD_UAH = 45.272;
const UAH_PER_DP = 0.5;
const CENTS_PER_USD = (USD_UAH / UAH_PER_DP) * 100;

const priceByName = new Map();
for (const item of prices.data.items) {
  if (item.type !== "skin") continue;
  const p = item.prices?.[0]?.price;
  if (typeof p !== "number" || p <= 0) continue;
  priceByName.set(item.market_hash_name, {
    usd: p,
    icon: item.icon_url,
    liquidity: item.liquidity ?? 0,
  });
}

const ICON = (icon) =>
  `https://community.cloudflare.steamstatic.com/economy/image/${icon}/256fx128f`;

function slug(s) {
  return s
    .toLowerCase()
    .replace(/★/g, "")
    .replace(/™/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const FORCE = [
  "P250 | Sand Dune (Field-Tested)",
  "Nova | Sand Dune (Field-Tested)",
  "AK-47 | Redline (Field-Tested)",
  "AK-47 | Redline (Minimal Wear)",
  "StatTrak™ AK-47 | Redline (Field-Tested)",
  "AK-47 | Asiimov (Field-Tested)",
  "AK-47 | Vulcan (Field-Tested)",
  "AK-47 | Fire Serpent (Field-Tested)",
  "AK-47 | Bloodsport (Field-Tested)",
  "AK-47 | Neon Revolution (Field-Tested)",
  "AK-47 | Slate (Field-Tested)",
  "AK-47 | Nightwish (Field-Tested)",
  "AK-47 | Gold Arabesque (Field-Tested)",
  "AK-47 | X-Ray (Field-Tested)",
  "AWP | Asiimov (Field-Tested)",
  "AWP | Hyper Beast (Field-Tested)",
  "AWP | Neo-Noir (Field-Tested)",
  "AWP | Wildfire (Field-Tested)",
  "AWP | Containment Breach (Field-Tested)",
  "AWP | Fade (Factory New)",
  "AWP | Lightning Strike (Factory New)",
  "AWP | Graphite (Minimal Wear)",
  "M4A4 | Asiimov (Field-Tested)",
  "M4A4 | The Emperor (Field-Tested)",
  "M4A4 | Neo-Noir (Factory New)",
  "M4A4 | X-Ray (Factory New)",
  "M4A1-S | Printstream (Field-Tested)",
  "M4A1-S | Hyper Beast (Field-Tested)",
  "M4A1-S | Player Two (Field-Tested)",
  "M4A1-S | Decimator (Field-Tested)",
  "Desert Eagle | Printstream (Field-Tested)",
  "Desert Eagle | Blaze (Factory New)",
  "Glock-18 | Water Elemental (Field-Tested)",
  "USP-S | Kill Confirmed (Field-Tested)",
  "USP-S | Printstream (Field-Tested)",
  "P90 | Asiimov (Field-Tested)",
  "MAC-10 | Neon Rider (Field-Tested)",
  "FAMAS | Mecha Industries (Field-Tested)",
  "Galil AR | Cerberus (Field-Tested)",
  "SSG 08 | Bloodshot (Field-Tested)",
  "Tec-9 | Fuel Injector (Field-Tested)",
  "CZ75-Auto | Victoria (Field-Tested)",
  "Five-SeveN | Fairy Tale (Field-Tested)",
  "Sawed-Off | The Kraken (Field-Tested)",
  "XM1014 | Tranquility (Field-Tested)",
  "UMP-45 | Primal Saber (Field-Tested)",
  "MP9 | Hydra (Field-Tested)",
  "Dual Berettas | Melondrama (Field-Tested)",
  "MAG-7 | Justice (Field-Tested)",
  "P2000 | Fire Elemental (Field-Tested)",
  "★ Karambit | Doppler (Factory New)",
  "★ Karambit | Marble Fade (Factory New)",
  "★ Karambit | Slaughter (Field-Tested)",
  "★ Karambit | Case Hardened (Field-Tested)",
  "★ Karambit | Tiger Tooth (Factory New)",
  "★ Karambit | Lore (Factory New)",
  "★ M9 Bayonet | Doppler (Factory New)",
  "★ M9 Bayonet | Gamma Doppler (Factory New)",
  "★ M9 Bayonet | Marble Fade (Factory New)",
  "★ M9 Bayonet | Tiger Tooth (Factory New)",
  "★ Bayonet | Doppler (Factory New)",
  "★ Flip Knife | Doppler (Factory New)",
  "★ Talon Knife | Doppler (Factory New)",
  "★ Butterfly Knife | Marble Fade (Factory New)",
  "★ Butterfly Knife | Tiger Tooth (Factory New)",
  "★ Butterfly Knife | Slaughter (Field-Tested)",
  "★ Butterfly Knife | Lore (Minimal Wear)",
  "★ Classic Knife | Fade (Factory New)",
  "★ Skeleton Knife | Fade (Factory New)",
  "★ Nomad Knife | Doppler (Factory New)",
  "★ Paracord Knife | Marble Fade (Factory New)",
  "★ Specialist Gloves | Fade (Field-Tested)",
  "★ Driver Gloves | King Snake (Field-Tested)",
  "★ Hand Wraps | Cobalt Skulls (Field-Tested)",
  "★ Bloodhound Gloves | Charred (Field-Tested)",
  "★ Moto Gloves | Spearmint (Battle-Scarred)",
  "★ Sport Gloves | Vice (Minimal Wear)",
  "★ Moto Gloves | Cool Mint (Field-Tested)",
  "★ Sport Gloves | Superconductor (Battle-Scarred)",
  "★ Specialist Gloves | Emerald Web (Well-Worn)",
];

const rows = [];
const seen = new Set();

function categoryOf(catName, market) {
  if (catName === "Knives" || market.includes("Knife")) return "knife";
  if (catName === "Gloves" || /Gloves|Hand Wraps/.test(market)) return "gloves";
  return "weapon";
}

function add(market, meta, rarity, catName, collection) {
  const hit = priceByName.get(market);
  if (!hit || seen.has(market)) return;
  seen.add(market);
  const stattrak = market.startsWith("StatTrak™ ");
  let rest = stattrak ? market.slice("StatTrak™ ".length) : market;
  const star = rest.startsWith("★ ");
  if (star) rest = rest.slice(2);
  const m = rest.match(/^(.*) \| (.*) \(([^)]+)\)$/);
  if (!m) return;
  rows.push({
    id: slug(market),
    marketHash: market,
    weapon: (star ? "★ " : "") + m[1],
    skin: m[2],
    wear: m[3],
    rarity,
    category: categoryOf(catName, market),
    stattrak,
    usd: Math.round(hit.usd * 100) / 100,
    price: Math.max(1, Math.round(hit.usd * CENTS_PER_USD)),
    image: ICON(hit.icon),
    collection: collection || "",
    liquidity: hit.liquidity,
  });
}

for (const name of FORCE) {
  const base = name
    .replace(/^StatTrak™ /, "")
    .replace(/ \([^)]+\)$/, "");
  const skin = bymykel.find((s) => s.name === base);
  add(
    name,
    null,
    skin?.rarity?.name ?? "Covert",
    skin?.category?.name ?? "",
    skin?.collections?.[0]?.name ?? "",
  );
}

const candidates = [];
for (const skin of bymykel) {
  if (skin.category?.name === "Equipment") continue;
  if (String(skin.name).startsWith("Souvenir ")) continue;
  let best = null;
  for (const wear of skin.wears ?? []) {
    const market = `${skin.name} (${wear.name})`;
    if (market.startsWith("Souvenir ") || market.startsWith("StatTrak")) continue;
    const hit = priceByName.get(market);
    if (!hit || seen.has(market)) continue;
    const prefer = wear.name === "Field-Tested" ? -1 : 0;
    if (!best || prefer < best.prefer || (prefer === best.prefer && hit.usd < best.hit.usd)) {
      best = { skin, wear: wear.name, market, hit, prefer };
    }
  }
  if (best) candidates.push(best);
}

function takeBand(min, max, n, pred = () => true) {
  const pool = candidates
    .filter((c) => c.hit.usd >= min && c.hit.usd < max && pred(c) && !seen.has(c.market))
    .sort((a, b) => b.hit.liquidity - a.hit.liquidity || a.hit.usd - b.hit.usd);
  const usedWeapons = new Set();
  let got = 0;
  for (const c of pool) {
    const w = c.skin.weapon?.name;
    if (usedWeapons.has(w) && pool.length > n * 2) continue;
    add(c.market, null, c.skin.rarity.name, c.skin.category.name, c.skin.collections?.[0]?.name ?? "");
    usedWeapons.add(w);
    got++;
    if (got >= n) break;
  }
}

takeBand(0.03, 0.25, 14, (c) => c.skin.category.name !== "Knives" && c.skin.category.name !== "Gloves");
takeBand(0.25, 1.2, 12, (c) => c.skin.category.name !== "Knives");
takeBand(1.2, 6, 14, (c) => c.skin.category.name !== "Knives");
takeBand(6, 25, 16, (c) => c.skin.category.name !== "Knives" && c.skin.category.name !== "Gloves");
takeBand(25, 80, 16, (c) => c.skin.category.name !== "Knives");
takeBand(80, 220, 14, (c) => c.skin.category.name !== "Gloves");
takeBand(220, 700, 12);
takeBand(700, 5000, 10);

rows.sort((a, b) => a.price - b.price);

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const skinTs = rows
  .map(
    (r) =>
      `  { id: '${esc(r.id)}', marketHash: '${esc(r.marketHash)}', weapon: '${esc(r.weapon)}', skin: '${esc(r.skin)}', wear: '${esc(r.wear)}', rarity: '${esc(r.rarity)}', category: '${r.category}', stattrak: ${r.stattrak}, usd: ${r.usd}, price: ${r.price}, image: '${r.image}', collection: '${esc(r.collection)}' },`,
  )
  .join("\n");

function byId(id) {
  return rows.find((r) => r.id === id);
}

function pickCase(id, name, blurb, hue, filter, count, jackpotFilter) {
  let pool = rows.filter(filter).sort((a, b) => a.price - b.price);
  if (pool.length < 4) return null;
  const step = Math.max(1, Math.floor(pool.length / count));
  const drops = [];
  for (let i = 0; i < count; i++) {
    const item = pool[Math.min(pool.length - 1, i * step)];
    if (!drops.some((d) => d.id === item.id)) drops.push(item);
  }
  if (jackpotFilter) {
    const jack = rows.filter(jackpotFilter).sort((a, b) => a.price - b.price)[0];
    if (jack && !drops.some((d) => d.id === jack.id) && jack.price > drops[drops.length - 1].price) {
      drops.push(jack);
    }
  }
  drops.sort((a, b) => a.price - b.price);
  const weights = drops.map((_, i) => Math.pow(2.15, drops.length - 1 - i));
  const sum = weights.reduce((a, b) => a + b, 0);
  let chances = weights.map((w) => Math.round((w / sum) * 10000) / 100);
  const drift = Math.round((100 - chances.reduce((a, b) => a + b, 0)) * 100) / 100;
  chances[0] = Math.round((chances[0] + drift) * 100) / 100;
  const ev = drops.reduce((s, d, i) => s + (d.price * chances[i]) / 100, 0);
  const price = Math.max(drops[0].price + 1, Math.round(ev / 0.84));
  return {
    id,
    name,
    blurb,
    hue,
    price,
    drops: drops.map((d, i) => ({ itemId: d.id, chance: chances[i] })),
  };
}

const cases = [
  pickCase("dust", "Пыль", "Самые дешёвые скины с рынка", 90, (s) => s.usd < 0.4 && s.category === "weapon", 7),
  pickCase("street", "Улица", "Мил-спек и крепкий ширпотреб", 200, (s) => s.usd >= 0.35 && s.usd < 8 && s.category === "weapon", 7),
  pickCase("phoenix", "Феникс", "Редлайн, азимовы и ходовые винтовки", 18, (s) => /Redline|Asiimov|Frontside|Aquamarine|Cartel|Neon Revolution/.test(s.skin) || (s.usd > 8 && s.usd < 80 && s.category === "weapon" && s.rarity !== "Covert"), 7, (s) => s.id === "awp-asiimov-field-tested"),
  pickCase("printstream", "Принтстрим", "Белые принты и классика", 210, (s) => /Printstream|Player Two|Decimator|Mecha|Neo-Noir|Kill Confirmed/.test(s.skin) || (s.rarity === "Classified" && s.usd < 90), 7),
  pickCase("hyper", "Гипер", "Яркие обложки и звери", 280, (s) => /Hyper Beast|Neon Rider|Water Elemental|Fuel Injector|Bloodsport|Nightwish|Wildfire/.test(s.skin), 6, (s) => s.category === "knife" && s.usd > 300 && s.usd < 700),
  pickCase("covert", "Тайный", "Только красные обложки", 350, (s) => s.rarity === "Covert" && s.category === "weapon" && s.usd < 250, 7, (s) => s.id === "ak-47-fire-serpent-field-tested"),
  pickCase("asiimov", "Азимов", "Вся линейка Asiimov", 28, (s) => /Asiimov/.test(s.skin), 5, (s) => s.id === "awp-fade-factory-new"),
  pickCase("emperor", "Император", "Дорогие винтовки", 45, (s) => s.category === "weapon" && s.usd >= 40 && s.usd < 300 && !s.stattrak, 7),
  pickCase("knives", "Ножи", "Допплеры, фейды и мрамор", 265, (s) => s.category === "knife" && s.usd < 1200, 7, (s) => s.id === "butterfly-knife-marble-fade-factory-new"),
  pickCase("gloves", "Перчатки", "Перчатки с живого Steam", 48, (s) => s.category === "gloves", 7),
  pickCase("premium", "Премиум", "Самые дорогие позиции каталога", 40, (s) => s.usd >= 400, 7),
  pickCase("night", "Ночь", "Тёмные и неоновые скины", 250, (s) => /Nightwish|Neo-Noir|Slate|Graphite|Containment|X-Ray|Black|Night/.test(s.marketHash) || (s.usd > 4 && s.usd < 90 && s.category === "weapon"), 7),
].filter(Boolean);

const caseTs = cases
  .map((c) => {
    const drops = c.drops.map((d) => `      { itemId: '${d.itemId}', chance: ${d.chance} }`).join(",\n");
    return `  {\n    id: '${c.id}',\n    name: '${esc(c.name)}',\n    blurb: '${esc(c.blurb)}',\n    hue: ${c.hue},\n    price: ${c.price},\n    drops: [\n${drops},\n    ],\n  },`;
  })
  .join("\n");

const out = `/* Generated from Steam price snapshot 2026-10-29 and NBU USD/UAH 45.2720 on 2026-11-26. 1 DP = 0.50 UAH. */\nexport interface Skin {\n  id: string\n  marketHash: string\n  weapon: string\n  skin: string\n  wear: string\n  rarity: string\n  category: 'weapon' | 'knife' | 'gloves'\n  stattrak: boolean\n  usd: number\n  price: number\n  image: string\n  collection: string\n}\n\nexport interface CaseDrop {\n  itemId: string\n  chance: number\n}\n\nexport interface GameCase {\n  id: string\n  name: string\n  blurb: string\n  hue: number\n  price: number\n  drops: CaseDrop[]\n}\n\nexport const USD_UAH = 45.272\nexport const UAH_PER_DP = 0.5\nexport const PRICE_AS_OF = '29.10.2026'\nexport const RATE_AS_OF = '26.11.2026'\n\nexport const SKINS: Skin[] = [\n${skinTs}\n]\n\nexport const SKIN_BY_ID: Record<string, Skin> = Object.fromEntries(SKINS.map((s) => [s.id, s]))\n\nexport const CASES: GameCase[] = [\n${caseTs}\n]\n`;

writeFileSync("/workspace/src/data/catalog.ts", out);
console.log("skins", rows.length, "cases", cases.length);
for (const c of cases) {
  const ev = c.drops.reduce((s, d) => s + (byId(d.itemId).price * d.chance) / 100, 0);
  console.log(
    c.id,
    "priceDP",
    (c.price / 100).toFixed(2),
    "ev",
    (ev / 100).toFixed(2),
    "edge",
    (((c.price - ev) / c.price) * 100).toFixed(1) + "%",
    "drops",
    c.drops.length,
    "sum",
    c.drops.reduce((s, d) => s + d.chance, 0).toFixed(2),
  );
}
const missed = FORCE.filter((n) => !seen.has(n));
console.log("missed force", missed);
