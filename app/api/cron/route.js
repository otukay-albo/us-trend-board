import { fetchMusic, fetchArtists, fetchBeauty, fetchHashtags, fetchTikTokShop } from "@/lib/sources";
import { saveSnapshot } from "@/lib/redis";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 有効なデータか（空 or 全項目が "—" のような壊れたデータは保存しない）
  const isValid = (items) =>
    Array.isArray(items) &&
    items.length > 0 &&
    items.some((it) => it && it.name && it.name !== "—");

  try {
    const fetched = {
      music: await fetchMusic().catch(() => null),
      artists: await fetchArtists().catch(() => null),
      beauty: await fetchBeauty().catch(() => null),
      hashtags: await fetchHashtags().catch(() => null),
      shop: await fetchTikTokShop().catch(() => null),
    };

    // 有効な軸だけ保存（無効なら既存のRedisデータを温存して上書きしない）
    const saved = {};
    const skipped = {};
    for (const [kind, items] of Object.entries(fetched)) {
      if (isValid(items)) {
        const s = await saveSnapshot(kind, items);
        saved[kind] = { count: s.length, top: s[0]?.name ?? null };
      } else {
        skipped[kind] = true;
      }
    }

    return Response.json({
      ok: true,
      saved,
      skipped,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("cron error", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
