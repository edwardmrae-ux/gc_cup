"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateMatchScoreOverride } from "./actions";

export function MatchScoreOverrideInputs({
  matchId,
  computedTeamA,
  computedTeamB,
  overrideTeamA,
  overrideTeamB,
}: {
  matchId: string;
  computedTeamA: number;
  computedTeamB: number;
  overrideTeamA?: number | null;
  overrideTeamB?: number | null;
}) {
  const isOverridden = overrideTeamA != null || overrideTeamB != null;
  const effectiveA = overrideTeamA ?? computedTeamA;
  const effectiveB = overrideTeamB ?? computedTeamB;

  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [values, setValues] = useState({
    teamA: String(effectiveA),
    teamB: String(effectiveB),
  });

  useEffect(() => {
    setValues({
      teamA: String(overrideTeamA ?? computedTeamA),
      teamB: String(overrideTeamB ?? computedTeamB),
    });
  }, [computedTeamA, computedTeamB, overrideTeamA, overrideTeamB]);

  function parseScore(raw: string): number | null {
    if (raw.trim() === "") return null;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? null : Math.max(0, n);
  }

  function save(teamA: string, teamB: string) {
    const a = parseScore(teamA);
    const b = parseScore(teamB);
    if (a == null || b == null) return;
    if (a === effectiveA && b === effectiveB) return;

    startTransition(async () => {
      await updateMatchScoreOverride(matchId, a, b);
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
      <span className="text-slate-500">Stableford score:</span>
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
          className="w-14 border border-slate-300 rounded px-1.5 py-0.5 text-center"
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
          className="w-14 border border-slate-300 rounded px-1.5 py-0.5 text-center"
        />
      </label>
      {isOverridden && (
        <span className="text-amber-600">(overridden)</span>
      )}
      {!isOverridden && (
        <span className="text-slate-400">computed from hole scores</span>
      )}
    </div>
  );
}
