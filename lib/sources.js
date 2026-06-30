const KBEAUTY = [
  "laneige", "innisfree", "cosrx", "some by mi", "anua", "round lab",
  "beauty of joseon", "isntree", "skin1004", "klairs", "dr.jart",
  "etude", "sulwhasoo", "missha", "the saem", "skinfood", "tonymoly",
  "mediheal", "banila co", "rom&nd", "peripera", "3ce", "mac",
  "espoir", "hera", "su:m37", "ohui", "whoo", "iope", "amorepacific",
];

function isKBeauty(title) {
  const lower = title.toLowerCase();
  return KBEAUTY.some((k) => lower.includes(k));
}

// ── Music ───────────────────────────────────────────────────
const MUSIC_DEMO = [
  { name: "Espresso", sub: "Sabrina Carpenter", genre: "Pop" },
  { name: "Beautiful Things", sub: "Benson Boone", genre: "Pop" },
  { name: "Texas Hold 'Em", sub: "Beyoncé", genre: "Country" },
  { name: "Fortnight", sub: "Taylor Swift ft. Post Malone", genre: "Pop" },
  { name: "Lose Control", sub: "Teddy Swims", genre: "R&B" },
  { name: "Slow It Down", sub: "Benson Boone", genre: "Pop" },
  { name: "Saturn", sub: "SZA", genre: "R&B" },
  { name: "I Had Some Help", sub: "Post Malone ft. Morgan Wallen", genre: "Country" },
  { name: "Good Luck, Babe!", sub: "Chappell Roan", genre: "Pop" },
  { name: "Birds of a Feather", sub: "Billie Eilish", genre: "Pop" },
  { name: "A Bar Song (Tipsy)", sub: "Shaboozey", genre: "Country" },
  { name: "Please Please Please", sub: "Sabrina Carpenter", genre: "Pop" },
  { name: "Not Like Us", sub: "Kendrick Lamar", genre: "Hip-Hop/Rap" },
  { name: "Too Sweet", sub: "Hozier", genre: "Alternative" },
  { name: "Million Dollar Baby", sub: "Tommy Richman", genre: "R&B" },
  { name: "I Don't Wanna Wait", sub: "David Guetta & OneRepublic", genre: "Dance" },
  { name: "Stargazing", sub: "Myles Smith", genre: "Pop" },
  { name: "Die With A Smile", sub: "Lady Gaga & Bruno Mars", genre: "Pop" },
  { name: "Espresso (Remix)", sub: "Sabrina Carpenter", genre: "Pop" },
  { name: "we can't be friends", sub: "Ariana Grande", genre: "Pop" },
];

export async function fetchMusic() {
  try {
    const res = await fetch(
      "https://rss.applemarketingtools.com/api/v2/us/music/most-played/20/songs.json",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`Apple RSS ${res.status}`);
    const json = await res.json();
    return json.feed.results.map((r) => ({
      name: r.name,
      sub: r.artistName,
      genre: r.genres?.[0]?.name ?? "—",
    }));
  } catch {
    return MUSIC_DEMO;
  }
}

// ── Artists ─────────────────────────────────────────────────
// Apple RSS にアーティスト単体ランキングが無いので、人気曲100件を
// アーティスト単位で集計（チャート登場数 = バズ度）して TOP20 を作る。
// "Drake, Future & Molly Santana feat. X" → ["Drake","Future","Molly Santana","X"]
function splitArtists(raw) {
  return raw
    .split(/\s*(?:,|&|feat\.|ft\.|featuring|with)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function aggregateArtists(songs) {
  const map = new Map();
  songs.forEach((s, i) => {
    const raw = s.artistName ?? s.sub;
    if (!raw) return;
    const score = songs.length - i; // 上位曲ほど高スコア
    const genre = s.genres?.[0]?.name ?? s.genre ?? "—";
    // コラボ曲は各アーティストに加点（重複登場は1曲としてカウント）
    new Set(splitArtists(raw)).forEach((artist) => {
      const cur = map.get(artist) ?? { count: 0, score: 0, genre };
      cur.count += 1;
      cur.score += score;
      map.set(artist, cur);
    });
  });

  return [...map.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 20)
    .map(([artist, v]) => ({
      name: artist,
      sub: `${v.count}曲ランクイン · ${v.genre}`,
    }));
}

export async function fetchArtists() {
  try {
    const res = await fetch(
      "https://rss.applemarketingtools.com/api/v2/us/music/most-played/100/songs.json",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`Apple RSS ${res.status}`);
    const json = await res.json();
    return aggregateArtists(json.feed.results);
  } catch {
    return aggregateArtists(MUSIC_DEMO);
  }
}

// ── Beauty ──────────────────────────────────────────────────
const BEAUTY_DEMO = [
  { name: "COSRX Snail Mucin 96% Power Essence", sub: "Serum", kbeauty: true },
  { name: "CeraVe Moisturizing Cream", sub: "Moisturizer", kbeauty: false },
  { name: "Laneige Lip Sleeping Mask", sub: "Lip Care", kbeauty: true },
  { name: "La Roche-Posay Sunscreen SPF 60", sub: "Sunscreen", kbeauty: false },
  { name: "Some By Mi AHA BHA PHA Toner", sub: "Toner", kbeauty: true },
  { name: "Neutrogena Hydro Boost", sub: "Moisturizer", kbeauty: false },
  { name: "Beauty of Joseon Glow Serum", sub: "Serum", kbeauty: true },
  { name: "Anua Heartleaf Toner Pad", sub: "Toner Pad", kbeauty: true },
  { name: "EltaMD UV Clear SPF 46", sub: "Sunscreen", kbeauty: false },
  { name: "Round Lab Birch Juice Moisturizer", sub: "Moisturizer", kbeauty: true },
  { name: "Medicube Zero Pore Pad 2.0", sub: "Toner Pad", kbeauty: true },
  { name: "The Ordinary Niacinamide 10%", sub: "Serum", kbeauty: false },
  { name: "Skin1004 Centella Ampoule", sub: "Ampoule", kbeauty: true },
  { name: "CeraVe Foaming Cleanser", sub: "Cleanser", kbeauty: false },
  { name: "Isntree Hyaluronic Acid Toner", sub: "Toner", kbeauty: true },
  { name: "Paula's Choice 2% BHA Liquid", sub: "Exfoliant", kbeauty: false },
  { name: "Tirtir Mask Fit Cushion", sub: "Foundation", kbeauty: true },
  { name: "Mighty Patch Hydrocolloid", sub: "Acne Care", kbeauty: false },
  { name: "Klairs Freshly Juiced Vitamin C", sub: "Serum", kbeauty: true },
  { name: "Aquaphor Healing Ointment", sub: "Balm", kbeauty: false },
];

export async function fetchBeauty() {
  const token = process.env.APIFY_TOKEN;
  const actor = process.env.APIFY_BEAUTY_ACTOR;
  if (!token || !actor) return BEAUTY_DEMO;

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxItems: 20 }),
        signal: AbortSignal.timeout(60_000),
      }
    );
    if (!res.ok) throw new Error(`Apify beauty ${res.status}`);
    const items = await res.json();
    return items.slice(0, 20).map((item) => ({
      name: item.title ?? item.name ?? "—",
      sub: item.category ?? "—",
      kbeauty: isKBeauty(item.title ?? item.name ?? ""),
    }));
  } catch {
    return BEAUTY_DEMO;
  }
}

// ── Hashtags ─────────────────────────────────────────────────
const HASHTAG_DEMO = [
  { name: "skincare", sub: "9.8B views" },
  { name: "makeup", sub: "8.2B views" },
  { name: "kbeauty", sub: "4.1B views" },
  { name: "glowup", sub: "3.7B views" },
  { name: "beautyofjoeson", sub: "2.9B views" },
  { name: "grwm", sub: "2.5B views" },
  { name: "sunscreen", sub: "1.8B views" },
  { name: "skintok", sub: "1.6B views" },
  { name: "haul", sub: "1.4B views" },
  { name: "antiaging", sub: "1.1B views" },
  { name: "glasskin", sub: "980M views" },
  { name: "koreanskincare", sub: "870M views" },
  { name: "makeuptutorial", sub: "760M views" },
  { name: "cleangirl", sub: "690M views" },
  { name: "skincareroutine", sub: "610M views" },
  { name: "blush", sub: "540M views" },
  { name: "lipcombo", sub: "480M views" },
  { name: "fragrance", sub: "420M views" },
  { name: "dewymakeup", sub: "360M views" },
  { name: "snailmucin", sub: "310M views" },
];

export async function fetchHashtags() {
  const token = process.env.APIFY_TOKEN;
  const actor = process.env.APIFY_HASHTAG_ACTOR;
  if (!token || !actor) return HASHTAG_DEMO;

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: "US", industry: "beauty", maxItems: 20 }),
        signal: AbortSignal.timeout(60_000),
      }
    );
    if (!res.ok) throw new Error(`Apify hashtag ${res.status}`);
    const items = await res.json();
    return items.slice(0, 20).map((item) => ({
      name: item.hashtag ?? item.name ?? "—",
      sub: item.views
        ? `${(item.views / 1e9).toFixed(1)}B views`
        : item.postCount
        ? `${item.postCount.toLocaleString()} posts`
        : "—",
    }));
  } catch {
    return HASHTAG_DEMO;
  }
}
