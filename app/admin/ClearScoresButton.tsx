"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearMatchScores } from "./actions";

export function ClearScoresButton({ matchId }: { matchId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (
          !window.confirm(
            "Clear all hole scores for this match? The match itself will be kept. This cannot be undone."
          )
        )
          return;
        startTransition(async () => {
          const res = await clearMatchScores(matchId);
          if (res?.error) {
            window.alert(`Failed to clear scores: ${res.error}`);
            return;
          }
          router.refresh();
        });
      }}
      className="text-xs border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50 rounded px-2 py-0.5"
    >
      {isPending ? "Clearing…" : "Clear scores"}
    </button>
  );
}
