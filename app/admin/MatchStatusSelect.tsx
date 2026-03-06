"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMatchStatus } from "./actions";

export function MatchStatusSelect({
  matchId,
  currentStatus,
}: {
  matchId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      defaultValue={currentStatus}
      disabled={isPending}
      className="text-xs border border-slate-300 rounded px-2 py-0.5"
      onChange={(e) => {
        startTransition(async () => {
          await updateMatchStatus(matchId, e.target.value);
          router.refresh();
        });
      }}
    >
      <option value="not_started">Not started</option>
      <option value="in_progress">In progress</option>
      <option value="complete">Complete</option>
    </select>
  );
}
