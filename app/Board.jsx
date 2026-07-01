"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Music, Mic2, ShoppingBag, Hash, RefreshCw, Sparkles, TrendingUp, TrendingDown, Minus, Star, Lightbulb } from "lucide-react";

function DeltaBadge({ d }) {
  if (!d || d.t === "same") return <Minus className="w-3 h-3 text-stone-300" />;
  if (d.t === "new") return <span className="text-xs font-bold text-rose-400">NEW</span>;
  if (d.t === "up") return (
    <span className="flex items-center gap-0.5 text-emerald-500 text-xs font-semibold">
      <TrendingUp className="w-3 h-3" />+{d.n}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-orange-400 text-xs font-semibold">
      <TrendingDown className="w-3 h-3" />-{d.n}
    </span>
  );
}

function RankRow({ rank, name, sub, badge, d, url }) {
  return (
    <li className="flex items-center gap-3 py-2.5 border-b border-stone-100 last:border-0">
      <span className="w-6 text-right text-xs font-mono text-stone-400 shrink-0">{rank}</span>
      <div className="flex-1 min-w-0">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="break-words text-sm font-medium text-stone-800 hover:text-sky-600 hover:underline transition"
          >
            {name}
          </a>
        ) : (
          <p className="break-words text-sm font-medium text-stone-800">{name}</p>
        )}
        <p className="truncate text-xs text-stone-400">{sub}</p>
      </div>
      {badge}
      <DeltaBadge d={d} />
    </li>
  );
}

function Panel({ icon: Icon, title, color, children }) {
  return (
    <div className="bg-white rounded-3xl p-5 flex flex-col gap-3 shadow-sm ring-1 ring-stone-100">
      <div className={`flex items-center gap-2 ${color}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-bold tracking-wide">{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function Board({ music, artists, beauty, hashtags, insight, trivia }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1500);
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-800">
            US Beauty Trend Board <span aria-hidden>🌷</span>
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">音楽 × コスメ × TikTokハッシュタグ</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition px-3 py-1.5 rounded-full bg-white ring-1 ring-stone-200 hover:ring-stone-300 disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          更新
        </button>
      </div>

      {/* Daily US trivia */}
      {trivia && (
        <div className="bg-gradient-to-r from-sky-50 to-amber-50 rounded-3xl p-5 ring-1 ring-sky-100">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 rounded-full bg-white flex items-center justify-center text-lg shadow-sm">
              🇺🇸
            </div>
            <div>
              <p className="text-[11px] font-bold text-sky-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />今日のアメリカ豆知識 — {trivia.title}
              </p>
              <p className="text-sm text-stone-600 leading-relaxed">{trivia.body}</p>
            </div>
          </div>
        </div>
      )}

      {/* Insight banner */}
      <div className="bg-gradient-to-r from-rose-50 to-violet-50 rounded-3xl p-5 ring-1 ring-rose-100">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-rose-400 uppercase tracking-widest mb-1">今日の一手</p>
            <p className="text-sm text-stone-600 leading-relaxed">{insight}</p>
          </div>
        </div>
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Music */}
        <Panel icon={Music} title="バズ曲 TOP15" color="text-sky-500">
          <ul>
            {(music ?? []).map((item, i) => (
              <RankRow key={i} rank={i + 1} name={item.name} sub={item.sub} d={item.d} url={item.url} />
            ))}
          </ul>
        </Panel>

        {/* Artists */}
        <Panel icon={Mic2} title="バズアーティスト TOP15" color="text-indigo-400">
          <ul>
            {(artists ?? []).map((item, i) => (
              <RankRow key={i} rank={i + 1} name={item.name} sub={item.sub} d={item.d} url={item.url} />
            ))}
          </ul>
        </Panel>

        {/* Beauty */}
        <Panel icon={ShoppingBag} title="コスメ売れ筋 TOP15" color="text-pink-400">
          <ul>
            {(beauty ?? []).map((item, i) => (
              <RankRow
                key={i}
                rank={i + 1}
                name={item.name}
                sub={item.sub}
                d={item.d}
                url={item.url}
                badge={
                  item.kbeauty ? (
                    <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
                      <Star className="w-2.5 h-2.5" />K
                    </span>
                  ) : null
                }
              />
            ))}
          </ul>
        </Panel>

        {/* Hashtags */}
        <Panel icon={Hash} title="ハッシュタグ TOP15" color="text-emerald-500">
          <ul>
            {(hashtags ?? []).map((item, i) => (
              <RankRow key={i} rank={i + 1} name={`#${item.name}`} sub={item.sub} d={item.d} url={item.url} />
            ))}
          </ul>
        </Panel>
      </div>

      <p className="text-center text-xs text-stone-400">
        音楽: Apple Music RSS（リアルタイム）/ コスメ・ハッシュタグ: Apify（日次 or デモ）
      </p>
    </main>
  );
}
