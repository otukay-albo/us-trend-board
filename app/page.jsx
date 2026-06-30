import { readAll } from "@/lib/redis";
import { fetchMusic, fetchArtists, fetchBeauty, fetchHashtags } from "@/lib/sources";
import { buildInsight } from "@/lib/insight";
import Board from "./Board";

export const dynamic = "force-dynamic";

async function getData() {
  // Redis から読む（cron未実行 or 接続なしならフォールバック）
  let data = { music: null, artists: null, beauty: null, hashtags: null };
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      data = await readAll();
    }
  } catch {
    // Redis未設定は無視
  }

  // キャッシュがない軸だけ直接取得
  const [music, artists, beauty, hashtags] = await Promise.all([
    data.music ?? fetchMusic(),
    data.artists ?? fetchArtists(),
    data.beauty ?? fetchBeauty(),
    data.hashtags ?? fetchHashtags(),
  ]);

  return { music, artists, beauty, hashtags };
}

export default async function Home() {
  const { music, artists, beauty, hashtags } = await getData();
  const insight = buildInsight({ music, beauty, hashtags });

  return (
    <Board
      music={music}
      artists={artists}
      beauty={beauty}
      hashtags={hashtags}
      insight={insight}
    />
  );
}
