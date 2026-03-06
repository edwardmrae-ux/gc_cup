import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GC Cup – Golf Tournament",
  description: "Weekend golf tournament leaderboard and score tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
            <a href="/" className="font-semibold text-lg text-slate-800">
              GC Cup
            </a>
            <nav>
              <a
                href="/admin"
                className="text-slate-600 hover:text-slate-900 text-sm"
              >
                Admin
              </a>
            </nav>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
