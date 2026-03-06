"use client";

import { useFormState } from "react-dom";
import { createSession } from "./actions";

export function CreateSessionForm() {
  const [state, formAction] = useFormState(createSession, {});

  return (
    <form action={formAction} className="flex flex-wrap gap-2 items-end">
      <input
        type="text"
        name="name"
        placeholder="Session name"
        className="px-3 py-2 border border-slate-300 rounded text-sm"
        required
      />
      <input
        type="date"
        name="session_date"
        className="px-3 py-2 border border-slate-300 rounded text-sm"
        required
      />
      <label className="flex items-center gap-1 text-sm">
        <input type="checkbox" name="counts_for_team_competition" defaultChecked />
        Counts for team competition
      </label>
      <button
        type="submit"
        className="px-3 py-2 bg-slate-800 text-white rounded text-sm font-medium hover:bg-slate-700"
      >
        Create session
      </button>
      {state?.error && <span className="text-red-600 text-sm">{state.error}</span>}
    </form>
  );
}
