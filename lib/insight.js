export function buildInsight({ music, beauty, hashtags }) {
  const topSong = music?.[0];
  const kbeautyItems = beauty?.filter((b) => b.kbeauty) ?? [];
  const topKBeauty = kbeautyItems[0];
  const risingTags = hashtags?.filter((h) => h.d?.t === "up") ?? [];
  const topTag = risingTags[0] ?? hashtags?.[0];

  if (!topSong && !topKBeauty && !topTag) {
    return "データを取得中です。しばらくお待ちください。";
  }

  const parts = [];

  if (topSong) {
    parts.push(`今 US でバズってる「${topSong.name}」(${topSong.sub}) をBGMに`);
  }
  if (topKBeauty) {
    parts.push(`K-Beautyランク1位の「${topKBeauty.name}」を主役にしたレビュー動画`);
  } else if (beauty?.[0]) {
    parts.push(`トレンドコスメ「${beauty[0].name}」を使ったGRWM`);
  }
  if (topTag) {
    const rising = topTag.d?.t === "up" ? `（↑急上昇中）` : "";
    parts.push(`#${topTag.name}${rising} で投稿すると伸びやすい`);
  }

  return parts.join("。") + "。";
}
