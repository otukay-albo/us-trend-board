"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Music, Mic2, ShoppingBag, Hash, RefreshCw, Sparkles, TrendingUp, TrendingDown, Minus, Star } from "lucide-react";

function DeltaBadge({ d }) {
  if (!d || d.t === "same") return <Minus className="w-3 h-3 text-gray-500" />;
  if (d.t === "new") return <span className="text-xs font-bold text-purple-400">NEW</span>;
  if (d.t === "up") return (
    <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-semibold">
      <TrendingUp className="w-3 h-3" />+{d.n}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-rose-400 text-xs font-semibold">
      <TrendingDown className="w-3 h-3" />-{d.n}
    </span>
  );
}

function RankRow({ rank, name, sub, badge, d }) {
  return (
    <li className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="w-6 text-right text-xs font-mono text-gray-500 shrink-0">{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-gray-100">{name}</p>
        <p className="truncate text-xs text-gray-500">{sub}</p>
      </div>
      {badge}
      <DeltaBadge d={d} />
    </li>
  );
}

function Panel({ icon: Icon, title, color, children }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 flex flex-col gap-3">
      <div className={`flex items-center gap-2 ${color}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-semibold tracking-wide uppercase">{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function Board({ music, artists, beauty, hashtags, insight }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1500);
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">US Beauty Trend Board</h1>
          <p className="text-xs text-gray-500 mt-0.5">音楽 × コスメ × TikTokハッシュタグ</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          更新
        </button>
      </div>

      {/* Insight banner */}
      <div className="bg-gradient-to-r from-violet-900/60 to-pink-900/60 border border-violet-500/30 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-violet-300 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-violet-300 uppercase tracking-widest mb-1">今日の一手</p>
            <p className="text-sm text-gray-200 leading-relaxed">{insight}</p>
          </div>
        </div>
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Music */}
        <Panel icon={Music} title="バズ曲 TOP10" color="text-sky-400">
          <ul>
            {(music ?? []).map((item, i) => (
              <RankRow
                key={i}
                rank={i + 1}
                name={item.name}
                sub={item.sub}
                d={item.d}
              />
            ))}
          </ul>
        </Panel>

        {/* Artists */}
        <Panel icon={Mic2} title="バズアーティスト TOP10" color="text-indigo-400">
          <ul>
            {(artists ?? []).map((item, i) => (
              <RankRow
                key={i}
                rank={i + 1}
                name={item.name}
                sub={item.sub}
                d={item.d}
              />
            ))}
          </ul>
        </Panel>

        {/* Beauty */}
        <Panel icon={ShoppingBag} title="コスメ売れ筋 TOP10" color="text-pink-400">
          <ul>
            {(beauty ?? []).map((item, i) => (
              <RankRow
                key={i}
                rank={i + 1}
                name={item.name}
                sub={item.sub}
                d={item.d}
                badge={
                  item.kbeauty ? (
                    <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-amber-300 bg-amber-900/40 px-1.5 py-0.5 rounded-full">
                      <Star className="w-2.5 h-2.5" />K
                    </span>
                  ) : null
                }
              />
            ))}
          </ul>
        </Panel>

        {/* Hashtags */}
        <Panel icon={Hash} title="ハッシュタグ TOP10" color="text-emerald-400">
          <ul>
            {(hashtags ?? []).map((item, i) => (
              <RankRow
                key={i}
                rank={i + 1}
                name={`#${item.name}`}
                sub={item.sub}
                d={item.d}
              />
            ))}
          </ul>
        </Panel>
      </div>

      <p className="text-center text-xs text-gray-600">
        音楽: Apple Music RSS（リアルタイム）/ コスメ・ハッシュタグ: Apify（日次 or デモ）
      </p>
    </main>
  );
}
