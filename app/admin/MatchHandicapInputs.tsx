"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateMatchHandicap } from "@/app/match/[id]/actions";

export function MatchHandicapInputs({
  matchId,
  teamAHandicap,
  teamBHandicap,
}: {
  matchId: string;
  teamAHandicap: number;
  teamBHandicap: number;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [values, setValues] = useState({
    teamA: teamAHandicap === 0 ? "" : String(teamAHandicap),
    teamB: teamBHandicap === 0 ? "" : String(teamBHandicap),
  });

  useEffect(() => {
    setValues({
      teamA: teamAHandicap === 0 ? "" : String(teamAHandicap),
      teamB: teamBHandicap === 0 ? "" : String(teamBHandicap),
    });
  }, [teamAHandicap, teamBHandicap]);

  function parseHandicap(raw: string): number {
    if (raw.trim() === "") return 0;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? 0 : Math.max(0, n);
  }

  function save(teamA: string, teamB: string) {
    const a = parseHandicap(teamA);
    const b = parseHandicap(teamB);
    if (a === teamAHandicap && b === teamBHandicap) return;

    startTransition(async () => {
      await updateMatchHandicap(matchId, a, b);
      router.refresh();
    });
  }

  function handleBlur() {
    save(values.teamA, values.teamB);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  }

  return (
    <div className="flex items-center gap-3 text-xs text-slate-600">
      <span className="text-slate-500">Handicap:</span>
      <label className="flex items-center gap-1">
        <span>Chubbs</span>
        <input
          type="number"
          min={0}
          step={1}
          disabled={isPending}
          value={values.teamA}
          onChange={(e) => setValues((v) => ({ ...v, teamA: e.target.value }))}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-12 border border-slate-300 rounded px-1.5 py-0.5 text-center"
          placeholder="0"
        />
      </label>
      <label className="flex items-center gap-1">
        <span>McAvoy</span>
        <input
          type="number"
          min={0}
          step={1}
          disabled={isPending}
          value={values.teamB}
          onChange={(e) => setValues((v) => ({ ...v, teamB: e.target.value }))}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-12 border border-slate-300 rounded px-1.5 py-0.5 text-center"
          placeholder="0"
        />
      </label>
    </div>
  );
}
