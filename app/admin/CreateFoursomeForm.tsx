"use client";

import { useFormState } from "react-dom";
import { createFoursome } from "./actions";

export function CreateFoursomeForm({
  sessions,
}: {
  sessions: { id: string; name: string; session_date: string }[];
}) {
  const [state, formAction] = useFormState(createFoursome, {});

  return (
    <form action={formAction} className="flex flex-wrap gap-2 items-end">
      <select
        name="session_id"
        className="px-3 py-2 border border-slate-300 rounded text-sm"
        required
      >
        <option value="">Select session</option>
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.session_date})
          </option>
        ))}
      </select>
      <input
        type="text"
        name="label"
        placeholder="Label (optional)"
        className="px-3 py-2 border border-slate-300 rounded text-sm"
      />
      <button
        type="submit"
        className="px-3 py-2 bg-slate-800 text-white rounded text-sm font-medium hover:bg-slate-700"
      >
        Create foursome
      </button>
      {state?.error && <span className="text-red-600 text-sm">{state.error}</span>}
    </form>
  );
}
