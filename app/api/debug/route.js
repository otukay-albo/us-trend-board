import { fetchBeauty, fetchHashtags } from "@/lib/sources";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// 一時診断用。秘密情報は出さず、環境変数の「有無」とライブ取得の先頭だけ返す。
export async function GET() {
  const token = process.env.APIFY_TOKEN || "";
  const env = {
    hasToken: !!token,
    tokenLen: token.length,
    tokenHead: token.slice(0, 10), // 先頭のみ（正しいトークンか照合用）
    hashtagActor: process.env.APIFY_HASHTAG_ACTOR || null,
    beautyActor: process.env.APIFY_BEAUTY_ACTOR || null,
    hasKV: !!process.env.KV_REST_API_URL,
  };

  let hashtags, beauty;
  try {
    const h = await fetchHashtags();
    hashtags = { count: h.length, top: h[0]?.name ?? null, sub: h[0]?.sub ?? null };
  } catch (e) {
    hashtags = { error: String(e).slice(0, 200) };
  }
  try {
    const b = await fetchBeauty();
    beauty = { count: b.length, top: b[0]?.name ?? null, sub: b[0]?.sub ?? null };
  } catch (e) {
    beauty = { error: String(e).slice(0, 200) };
  }

  return Response.json({ env, live: { hashtags, beauty } });
}
