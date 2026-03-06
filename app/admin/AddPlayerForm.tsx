"use client";

import { useFormState } from "react-dom";
import { addPlayer } from "./actions";

export function AddPlayerForm({
  teams,
}: {
  teams: { id: string; name: string }[];
}) {
  const [state, formAction] = useFormState(addPlayer, {});

  return (
    <form action={formAction} className="flex flex-wrap gap-2 items-end">
      <input
        type="text"
        name="name"
        placeholder="Player name"
        className="px-3 py-2 border border-slate-300 rounded text-sm"
        required
      />
      <select
        name="team_id"
        className="px-3 py-2 border border-slate-300 rounded text-sm"
        required
      >
        <option value="">Select team</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="px-3 py-2 bg-slate-800 text-white rounded text-sm font-medium hover:bg-slate-700"
      >
        Add player
      </button>
      {state?.error && <span className="text-red-600 text-sm">{state.error}</span>}
    </form>
  );
}
