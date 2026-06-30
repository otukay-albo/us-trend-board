import { fetchMusic, fetchArtists, fetchBeauty, fetchHashtags } from "@/lib/sources";
import { saveSnapshot } from "@/lib/redis";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [music, artists, beauty, hashtags] = await Promise.all([
      fetchMusic(),
      fetchArtists(),
      fetchBeauty(),
      fetchHashtags(),
    ]);

    const [m, a, b, h] = await Promise.all([
      saveSnapshot("music", music),
      saveSnapshot("artists", artists),
      saveSnapshot("beauty", beauty),
      saveSnapshot("hashtags", hashtags),
    ]);

    return Response.json({
      ok: true,
      counts: { music: m.length, artists: a.length, beauty: b.length, hashtags: h.length },
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("cron error", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
