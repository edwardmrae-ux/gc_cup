import Link from "next/link";

export function AdminNav() {
  return (
    <div className="flex gap-4 mb-6 text-sm">
      <Link href="/admin" className="text-slate-700 hover:text-slate-900 font-medium">
        Dashboard
      </Link>
      <Link href="/" className="text-slate-600 hover:text-slate-800">
        Leaderboard
      </Link>
    </div>
  );
}
