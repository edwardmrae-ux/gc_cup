"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setActiveSessionAction } from "./actions";

interface SessionOption {
  id: string;
  name: string;
  session_date?: string;
}

interface ActiveSessionSelectProps {
  sessions: SessionOption[];
  activeSessionId: string | null;
}

export function ActiveSessionSelect({ sessions, activeSessionId }: ActiveSessionSelectProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleChange = (value: string) => {
    const nextId = value === "" ? null : value;
    startTransition(async () => {
      await setActiveSessionAction(nextId);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      <label className="text-sm text-slate-700">Active session:</label>
      <select
        disabled={isPending}
        defaultValue={activeSessionId ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
      >
        <option value="">No active round</option>
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
            {s.session_date ? ` (${s.session_date})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

