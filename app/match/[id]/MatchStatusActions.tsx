"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMatchStatus } from "./actions";

export function MatchStatusActions({
  matchId,
  currentStatus,
}: {
  matchId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isComplete = currentStatus === "complete";

  function handleClick() {
    const newStatus = isComplete ? "in_progress" : "complete";
    startTransition(async () => {
      await updateMatchStatus(matchId, newStatus);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={
          isComplete
            ? "px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            : "px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        }
      >
        {isPending ? "Updating…" : isComplete ? "Mark in progress" : "Mark match complete"}
      </button>
    </div>
  );
}
