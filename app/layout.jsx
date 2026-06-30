import "./globals.css";

export const metadata = {
  title: "US Beauty Trend Board",
  description: "US音楽・コスメ・TikTokハッシュタグのトレンドを一元集約",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
