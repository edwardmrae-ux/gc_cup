"use client";

import { useFormState } from "react-dom";
import { createSession } from "./actions";

export function CreateSessionForm({
  courses,
}: {
  courses: { id: string; name: string; short_name: string | null }[];
}) {
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
      <select
        name="course_id"
        className="px-3 py-2 border border-slate-300 rounded text-sm"
        required
      >
        <option value="">Select course</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.short_name ?? c.name}
          </option>
        ))}
      </select>
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
