const KBEAUTY = [
  "laneige", "innisfree", "cosrx", "some by mi", "anua", "round lab",
  "beauty of joseon", "isntree", "skin1004", "klairs", "dr.jart",
  "etude", "sulwhasoo", "missha", "the saem", "skinfood", "tonymoly",
  "mediheal", "banila co", "rom&nd", "peripera", "3ce",
  "espoir", "hera", "su:m37", "ohui", "whoo", "iope", "amorepacific",
  // US Amazonで上位常連の新興K-beautyブランド
  "medicube", "biodance", "tirtir", "torriden", "mixsoon", "numbuzin",
  "goodal", "abib", "haruharu", "axis-y", "axisy", "dr.ceuracle",
  "d'alba", "dalba", "i'm from", "pyunkang yul", "mary&may", "one thing",
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
      "https://rss.applemarketingtools.com/api/v2/us/music/most-played/10/songs.json",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`Apple RSS ${res.status}`);
    const json = await res.json();
    return json.feed.results.map((r) => ({
      name: r.name,
      sub: r.artistName,
      genre: r.genres?.[0]?.name ?? "—",
      url: r.url ?? null,
    }));
  } catch {
    return MUSIC_DEMO.slice(0, 10);
  }
}

// ── Artists ─────────────────────────────────────────────────
// Apple RSS にアーティスト単体ランキングが無いので、人気曲100件を
// アーティスト単位で集計（チャート登場数 = バズ度）して TOP10 を作る。
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
    [...new Set(splitArtists(raw))].forEach((artist, idx) => {
      const cur = map.get(artist) ?? { count: 0, score: 0, genre, url: null };
      cur.count += 1;
      cur.score += score;
      // 主アーティスト(先頭)ならその曲のartistUrlを採用（一度だけ）
      if (!cur.url && idx === 0 && s.artistUrl) cur.url = s.artistUrl;
      map.set(artist, cur);
    });
  });

  return [...map.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 10)
    .map(([artist, v]) => ({
      name: artist,
      sub: `${v.count}曲ランクイン · ${v.genre}`,
      // 直リンクが無いアーティストはApple Music検索にフォールバック
      url: v.url ?? `https://music.apple.com/us/search?term=${encodeURIComponent(artist)}`,
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

// ── 商品名の短縮 & Amazon検索リンク ─────────────────────────
// 長い商品名から「ブランド＋商品名」の核だけ取り出す（"|"や","以降の説明を捨てる）
function coreName(title) {
  return String(title ?? "")
    .split("|")[0]
    .split(/[,，]/)[0]
    .replace(/[\[\]【】]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
// 表示用に短縮（長い場合は単語境界で切って…）
function shortenName(title, max = 40) {
  let s = coreName(title);
  if (s.length > max) s = s.slice(0, max).replace(/\s+\S*$/, "").trim() + "…";
  return s || "—";
}
// 商品名でAmazon検索するURL
function amazonSearch(title) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(coreName(title))}`;
}

// ── Beauty ──────────────────────────────────────────────────
// "$18.90 · ★4.6 (26.5K)" のように価格・評価・レビュー数を整形
function beautySub(price, rating, reviews) {
  const parts = [];
  if (price) parts.push(typeof price === "string" ? price : `$${price}`);
  if (rating) parts.push(`★${rating}`);
  const r = fmtCount(reviews);
  if (r) parts.push(`(${r})`);
  return parts.length ? parts.join(" · ") : "—";
}

const BEAUTY_DEMO = [
  { name: "COSRX Snail Mucin 96% Power Essence", price: "$16.00", rating: 4.7, reviews: 92000, kbeauty: true },
  { name: "CeraVe Moisturizing Cream", price: "$16.08", rating: 4.8, reviews: 145000, kbeauty: false },
  { name: "Laneige Lip Sleeping Mask", price: "$24.00", rating: 4.7, reviews: 88000, kbeauty: true },
  { name: "La Roche-Posay Sunscreen SPF 60", price: "$33.99", rating: 4.6, reviews: 41000, kbeauty: false },
  { name: "Some By Mi AHA BHA PHA Toner", price: "$18.90", rating: 4.5, reviews: 23000, kbeauty: true },
  { name: "Neutrogena Hydro Boost", price: "$19.97", rating: 4.6, reviews: 67000, kbeauty: false },
  { name: "Beauty of Joseon Glow Serum", price: "$17.00", rating: 4.6, reviews: 35000, kbeauty: true },
  { name: "Anua Heartleaf Toner Pad", price: "$23.00", rating: 4.5, reviews: 19000, kbeauty: true },
  { name: "EltaMD UV Clear SPF 46", price: "$41.00", rating: 4.7, reviews: 58000, kbeauty: false },
  { name: "Round Lab Birch Juice Moisturizer", price: "$22.00", rating: 4.6, reviews: 14000, kbeauty: true },
  { name: "Medicube Zero Pore Pad 2.0", price: "$18.90", rating: 4.6, reviews: 26000, kbeauty: true },
  { name: "The Ordinary Niacinamide 10%", price: "$6.50", rating: 4.5, reviews: 110000, kbeauty: false },
  { name: "Skin1004 Centella Ampoule", price: "$19.00", rating: 4.6, reviews: 21000, kbeauty: true },
  { name: "CeraVe Foaming Cleanser", price: "$15.99", rating: 4.8, reviews: 130000, kbeauty: false },
  { name: "Isntree Hyaluronic Acid Toner", price: "$19.00", rating: 4.6, reviews: 12000, kbeauty: true },
  { name: "Paula's Choice 2% BHA Liquid", price: "$35.00", rating: 4.6, reviews: 49000, kbeauty: false },
  { name: "Tirtir Mask Fit Cushion", price: "$28.00", rating: 4.4, reviews: 17000, kbeauty: true },
  { name: "Mighty Patch Hydrocolloid", price: "$12.99", rating: 4.6, reviews: 184000, kbeauty: false },
  { name: "Klairs Freshly Juiced Vitamin C", price: "$23.00", rating: 4.5, reviews: 16000, kbeauty: true },
  { name: "Aquaphor Healing Ointment", price: "$13.99", rating: 4.8, reviews: 99000, kbeauty: false },
].map((b) => ({ name: b.name, sub: beautySub(b.price, b.rating, b.reviews), kbeauty: b.kbeauty }));

// khadinakbar/amazon-bestsellers-scraper（cookie不要・residential proxy）
// 入力: marketplace / categorySlug / maxItemsPerCategory
export async function fetchBeauty() {
  const token = process.env.APIFY_TOKEN;
  const actor = process.env.APIFY_BEAUTY_ACTOR;
  if (!token || !actor) return BEAUTY_DEMO.slice(0, 10);

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${actor.replace("/", "~")}/run-sync-get-dataset-items?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chartType: "bestsellers",
          marketplace: "US",
          categorySlug: "beauty",
          maxItemsPerCategory: 10,
        }),
        signal: AbortSignal.timeout(120_000),
      }
    );
    if (!res.ok) throw new Error(`Apify beauty ${res.status}`);
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) return BEAUTY_DEMO.slice(0, 10);
    return items.slice(0, 10).map((item) => {
      const title = item.title ?? item.name ?? "—";
      return {
        name: shortenName(title),
        sub: beautySub(item.priceString ?? item.price, item.rating, item.reviewsCount),
        kbeauty: isKBeauty(`${title} ${item.brand ?? ""}`),
        url: item.productUrl ?? item.url ?? null,
      };
    });
  } catch {
    return BEAUTY_DEMO.slice(0, 10);
  }
}

// ── Hashtags ─────────────────────────────────────────────────
// 1.5e9 → "1.5B" のように Posts/Views を読みやすく整形（文字列もケア）
function fmtCount(n) {
  if (n == null) return null;
  const num = typeof n === "string" ? Number(n.replace(/[^0-9.]/g, "")) : n;
  if (!Number.isFinite(num)) return String(n);
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return String(num);
}

function hashtagSub(posts, views) {
  const p = fmtCount(posts);
  const v = fmtCount(views);
  if (p && v) return `${p} posts · ${v} views`;
  return v ? `${v} views` : p ? `${p} posts` : "—";
}

// デモ（TikTok障害時 / キー未設定時のフォールバック。posts/viewsは目安の架空値）
const HASHTAG_DEMO = [
  { name: "skincare", posts: 412000, views: 9_800_000_000 },
  { name: "makeup", posts: 380000, views: 8_200_000_000 },
  { name: "kbeauty", posts: 156000, views: 4_100_000_000 },
  { name: "glowup", posts: 142000, views: 3_700_000_000 },
  { name: "beautyofjoseon", posts: 98000, views: 2_900_000_000 },
  { name: "grwm", posts: 121000, views: 2_500_000_000 },
  { name: "sunscreen", posts: 76000, views: 1_800_000_000 },
  { name: "skintok", posts: 64000, views: 1_600_000_000 },
  { name: "haul", posts: 58000, views: 1_400_000_000 },
  { name: "antiaging", posts: 44000, views: 1_100_000_000 },
  { name: "glasskin", posts: 39000, views: 980_000_000 },
  { name: "koreanskincare", posts: 35000, views: 870_000_000 },
  { name: "makeuptutorial", posts: 31000, views: 760_000_000 },
  { name: "cleangirl", posts: 28000, views: 690_000_000 },
  { name: "skincareroutine", posts: 25000, views: 610_000_000 },
  { name: "blush", posts: 22000, views: 540_000_000 },
  { name: "lipcombo", posts: 19000, views: 480_000_000 },
  { name: "fragrance", posts: 17000, views: 420_000_000 },
  { name: "dewymakeup", posts: 14000, views: 360_000_000 },
  { name: "snailmucin", posts: 12000, views: 310_000_000 },
].map((h) => ({ name: h.name, sub: hashtagSub(h.posts, h.views) }));

// data_xplorer/tiktok-trends（cookie不要・Creative Center実データ・業種絞込可）
// 入力: countryCode / industryId / period(7|30|120) / maxHashtags
// industryId 14000000000 = Beauty & Personal Care
// 返却は [{ "Hashtag":"#xxx", "Posts":n, "Video Views":n, "Rank":n }]
const BEAUTY_INDUSTRY_ID = "14000000000";

export async function fetchHashtags() {
  const token = process.env.APIFY_TOKEN;
  const actor = process.env.APIFY_HASHTAG_ACTOR;
  if (!token || !actor) return HASHTAG_DEMO.slice(0, 10);

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${actor.replace("/", "~")}/run-sync-get-dataset-items?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode: "US",
          industryId: BEAUTY_INDUSTRY_ID,
          period: "7",
          maxHashtags: 10,
        }),
        signal: AbortSignal.timeout(120_000),
      }
    );
    if (!res.ok) throw new Error(`Apify hashtag ${res.status}`);
    const data = await res.json();
    const items = Array.isArray(data) ? data : data?.items;
    // 障害時などで空 → デモにフォールバック
    if (!Array.isArray(items) || items.length === 0) return HASHTAG_DEMO.slice(0, 10);
    return items.slice(0, 10).map((item) => ({
      name: String(item.Hashtag ?? item.hashtag ?? item.name ?? "—").replace(/^#/, ""),
      sub: hashtagSub(item.Posts ?? item.posts, item["Video Views"] ?? item.video_views),
      url: item["TikTok URL"] ?? item.url ?? null,
    }));
  } catch {
    return HASHTAG_DEMO.slice(0, 10);
  }
}

// ── TikTok Shop 売れ筋（FastMoss相当）─────────────────────────
// devcake/tiktok-shop-data-scraper（cookie不要）。keyword"beauty"×売れ筋順で
// US TikTok Shopのコスメ売れ筋を取得。返却は [{title,url,sold_count,price_formatted,...}]
function shopSub(sold, price) {
  const s = fmtCount(sold);
  const parts = [];
  if (s) parts.push(`${s} sold`);
  if (price) parts.push(`$${price}`);
  return parts.length ? parts.join(" · ") : "—";
}

const SHOP_DEMO = [
  { name: "medicube PDRN Pink Collagen Multi Balm", sold: 842000, price: "25.10", kbeauty: true },
  { name: "Dr.Melaxin Calcium Multi Balm Eye Care", sold: 900000, price: "23.00", kbeauty: true },
  { name: "Beauty of Joseon Daily Tinted Fluid Sun", sold: 361000, price: "10.00", kbeauty: true },
  { name: "tarte shape tape concealer duo", sold: 456000, price: "32.00", kbeauty: false },
  { name: "The Ordinary The Acne Set", sold: 210000, price: "24.90", kbeauty: false },
  { name: "e.l.f. Glow Reviver Lip Oil", sold: 214000, price: "15.50", kbeauty: false },
  { name: "medicube Zero Pore Pad 2.0", sold: 180000, price: "28.90", kbeauty: true },
  { name: "Anua Heartleaf 77 Toner", sold: 150000, price: "21.00", kbeauty: true },
  { name: "COSRX Snail Mucin Essence", sold: 140000, price: "16.00", kbeauty: true },
  { name: "Maybelline Fit Me Foundation", sold: 90000, price: "14.99", kbeauty: false },
].map((s) => ({ name: shortenName(s.name), sub: shopSub(s.sold, s.price), kbeauty: s.kbeauty, url: amazonSearch(s.name) }));

export async function fetchTikTokShop() {
  const token = process.env.APIFY_TOKEN;
  const actor = process.env.APIFY_SHOP_ACTOR;
  if (!token || !actor) return SHOP_DEMO.slice(0, 10);

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${actor.replace("/", "~")}/run-sync-get-dataset-items?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // maxProductsは最低20（devcake仕様）。20件取得して上位10件を表示
        body: JSON.stringify({
          searchKeywords: ["beauty"],
          sortBySoldCount: "highest_first",
          maxProducts: 20,
        }),
        signal: AbortSignal.timeout(120_000),
      }
    );
    if (!res.ok) throw new Error(`Apify shop ${res.status}`);
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) return SHOP_DEMO.slice(0, 10);
    return items.slice(0, 10).map((item) => {
      const title = item.title ?? item.name ?? "—";
      return {
        name: shortenName(title),
        sub: shopSub(item.sold_count ?? item.soldCount, item.price_formatted ?? item.price),
        kbeauty: isKBeauty(title),
        // TikTok Shopのpdpリンクはホームに飛ぶため、商品名でAmazon検索に差し替え
        url: amazonSearch(title),
      };
    });
  } catch {
    return SHOP_DEMO.slice(0, 10);
  }
}
