import { Redis } from "@upstash/redis";

let redis;
function getRedis() {
  if (!redis) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
  return redis;
}

const KEY = (kind) => `snapshot:${kind}`;

export async function saveSnapshot(kind, items) {
  const r = getRedis();
  const prev = await r.get(KEY(kind));
  const prevMap = {};
  if (prev) {
    prev.forEach((item, i) => {
      prevMap[item.name] = i + 1;
    });
  }

  const enriched = items.map((item, i) => {
    const rank = i + 1;
    const prevRank = prevMap[item.name];
    let d;
    if (prevRank == null) {
      d = { t: "new", n: 0 };
    } else {
      const diff = prevRank - rank;
      d = diff > 0
        ? { t: "up", n: diff }
        : diff < 0
        ? { t: "down", n: Math.abs(diff) }
        : { t: "same", n: 0 };
    }
    return { ...item, d };
  });

  await r.set(KEY(kind), enriched);
  return enriched;
}

export async function readAll() {
  const r = getRedis();
  const [music, artists, beauty, hashtags] = await Promise.all([
    r.get(KEY("music")),
    r.get(KEY("artists")),
    r.get(KEY("beauty")),
    r.get(KEY("hashtags")),
  ]);
  return { music, artists, beauty, hashtags };
}
