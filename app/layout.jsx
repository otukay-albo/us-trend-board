import "./globals.css";

export const metadata = {
  title: "US Beauty Trend Board",
  description: "US音楽・コスメ・TikTokハッシュタグのトレンドを一元集約",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className="bg-[#fdf8f2] text-stone-700 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
