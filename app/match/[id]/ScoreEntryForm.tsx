"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { upsertHoleScore } from "./actions";

export function ScoreEntryForm({
  matchId,
  players,
  holeCount,
  existingScores,
}: {
  matchId: string;
  players: { id: string; name: string }[];
  holeCount: number;
  existingScores: { player_id: string; hole_number: number; gross_score: number }[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const getExisting = (playerId: string, holeNum: number) =>
    existingScores.find((s) => s.player_id === playerId && s.hole_number === holeNum)?.gross_score;

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    const matchIdStr = formData.get("match_id") as string;
    const playerId = formData.get("player_id") as string;
    const holeNumber = parseInt(formData.get("hole_number") as string, 10);
    const grossScore = parseInt(formData.get("gross_score") as string, 10);
    if (!matchIdStr || !playerId || !holeNumber || grossScore < 1 || grossScore > 15) {
      setSaving(false);
      return;
    }
    await upsertHoleScore(matchIdStr, playerId, holeNumber, grossScore);
    setSaving(false);
    router.refresh();
  }

  return (
    <section className="border border-slate-200 rounded-lg p-4 bg-white">
      <h2 className="text-lg font-semibold text-slate-800 mb-3">Enter score</h2>
      <form action={handleSubmit} className="space-y-3">
        <input type="hidden" name="match_id" value={matchId} />
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Player</label>
            <select
              name="player_id"
              className="px-3 py-2 border border-slate-300 rounded text-sm"
              required
            >
              <option value="">Select</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Hole</label>
            <select
              name="hole_number"
              className="px-3 py-2 border border-slate-300 rounded text-sm"
              required
            >
              {Array.from({ length: holeCount }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Strokes</label>
            <input
              type="number"
              name="gross_score"
              min={1}
              max={15}
              placeholder="4"
              className="px-3 py-2 border border-slate-300 rounded text-sm w-20"
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-3 py-2 bg-slate-800 text-white rounded text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </section>
  );
}
