"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStablefordPoints, getParForHole } from "@/lib/stableford";
import { upsertHoleScore } from "./actions";

function scoreKey(playerId: string, holeNum: number) {
  return `${playerId}-${holeNum}`;
}

export function ScoreEntryTable({
  matchId,
  players,
  holeNumbers,
  existingScores,
  matchType,
  teamAIds,
  teamBIds,
  parByHole,
  stablefordConfig,
  readOnly = false,
}: {
  matchId: string;
  players: { id: string; name: string }[];
  holeNumbers: number[];
  existingScores: { player_id: string; hole_number: number; gross_score: number }[];
  matchType: "stableford_2v2" | "match_play_1v1";
  teamAIds: string[];
  teamBIds: string[];
  parByHole: Record<number, number> | null;
  stablefordConfig: { strokes_over_par: number; points: number }[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [scores, setScores] = useState<Map<string, number>>(() => {
    const m = new Map<string, number>();
    for (const s of existingScores) {
      m.set(scoreKey(s.player_id, s.hole_number), s.gross_score);
    }
    return m;
  });
  const [savingCell, setSavingCell] = useState<string | null>(null);

  useEffect(() => {
    const next = new Map<string, number>();
    for (const s of existingScores) {
      next.set(scoreKey(s.player_id, s.hole_number), s.gross_score);
    }
    setScores(next);
  }, [existingScores]);

  const getScore = useCallback(
    (playerId: string, holeNum: number) => scores.get(scoreKey(playerId, holeNum)),
    [scores]
  );

  const setScore = useCallback((playerId: string, holeNum: number, value: number | undefined) => {
    const key = scoreKey(playerId, holeNum);
    setScores((prev) => {
      const next = new Map(prev);
      if (value === undefined) next.delete(key);
      else next.set(key, value);
      return next;
    });
  }, []);

  async function handleBlur(
    playerId: string,
    holeNum: number,
    currentValue: number | undefined
  ) {
    if (currentValue === undefined || currentValue < 1 || currentValue > 15) return;
    const key = scoreKey(playerId, holeNum);
    const existing = existingScores.find(
      (s) => s.player_id === playerId && s.hole_number === holeNum
    )?.gross_score;
    if (existing === currentValue) return;

    setSavingCell(key);
    await upsertHoleScore(matchId, playerId, holeNum, currentValue);
    setSavingCell(null);
    router.refresh();
  }

  const allPlayerIds = [...teamAIds, ...teamBIds];
  const is2v2 = matchType === "stableford_2v2";

  return (
    <section className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="text-left py-2 pr-4 pl-4 font-medium text-slate-700">Hole</th>
              {allPlayerIds.map((pid) => (
                <th key={pid} className="text-left py-2 pr-4 font-medium text-slate-700">
                  {players.find((p) => p.id === pid)?.name ?? pid.slice(0, 8)}
                </th>
              ))}
              {is2v2 && (
                <>
                  <th className="text-left py-2 pr-4 font-medium text-slate-700">Chubbs pts</th>
                  <th className="text-left py-2 pr-4 font-medium text-slate-700">McAvoy pts</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {holeNumbers.map((holeNum) => {
              const par = parByHole?.[holeNum] ?? getParForHole(holeNum);
              const teamAPts = is2v2
                ? teamAIds.reduce((sum, pid) => {
                    const s = getScore(pid, holeNum);
                    return s == null ? sum : sum + getStablefordPoints(s, par, stablefordConfig);
                  }, 0)
                : 0;
              const teamBPts = is2v2
                ? teamBIds.reduce((sum, pid) => {
                    const s = getScore(pid, holeNum);
                    return s == null ? sum : sum + getStablefordPoints(s, par, stablefordConfig);
                  }, 0)
                : 0;
              return (
                <tr key={holeNum} className="border-b border-slate-100">
                  <td className="py-1.5 pr-4 pl-4 font-medium text-slate-800">{holeNum} (Par {par})</td>
                  {allPlayerIds.map((pid) => {
                    const key = scoreKey(pid, holeNum);
                    const value = getScore(pid, holeNum);
                    const isEmpty = value === undefined || value === null;
                    const isSaving = savingCell === key;
                    if (readOnly) {
                      return (
                        <td key={pid} className="py-1 pr-4">
                          <span className="inline-block w-12 px-2 py-1.5 rounded text-center text-sm bg-slate-50 text-slate-600 border border-slate-200">
                            {value ?? "–"}
                          </span>
                        </td>
                      );
                    }
                    return (
                      <td key={pid} className="py-1 pr-4">
                        <input
                          type="number"
                          min={1}
                          max={15}
                          placeholder="—"
                          value={value ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") setScore(pid, holeNum, undefined);
                            else {
                              const n = parseInt(v, 10);
                              if (!Number.isNaN(n)) setScore(pid, holeNum, n);
                            }
                          }}
                          onBlur={(e) => {
                            const v = e.target.value;
                            if (v === "") return;
                            const n = parseInt(v, 10);
                            if (!Number.isNaN(n) && n >= 1 && n <= 15) {
                              handleBlur(pid, holeNum, n);
                            }
                          }}
                          className={`w-12 px-2 py-1.5 rounded text-center text-sm border ${
                            isEmpty
                              ? "border-dashed border-slate-300 bg-transparent placeholder:text-slate-400"
                              : "border-solid border-slate-300 bg-white"
                          } focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none`}
                          disabled={isSaving}
                        />
                      </td>
                    );
                  })}
                  {is2v2 && (
                    <>
                      <td className="py-1.5 text-slate-600">{teamAPts || "–"}</td>
                      <td className="py-1.5 text-slate-600">{teamBPts || "–"}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
