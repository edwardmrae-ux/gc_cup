"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMatch } from "./actions";

export function DeleteMatchButton({ matchId }: { matchId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (
          !window.confirm(
            "Delete this match and all of its hole scores? This cannot be undone."
          )
        )
          return;
        startTransition(async () => {
          const res = await deleteMatch(matchId);
          if (res?.error) {
            window.alert(`Failed to delete match: ${res.error}`);
            return;
          }
          router.refresh();
        });
      }}
      className="text-xs border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 rounded px-2 py-0.5"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
