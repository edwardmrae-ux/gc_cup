"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { createMatch } from "./actions";

export function CreateMatchForm({
  foursomes,
  players,
  teams,
  sessions,
}: {
  foursomes: { id: string; session_id: string; label: string | null }[];
  players: { id: string; name: string; team_id: string }[];
  teams: { id: string; name: string }[];
  sessions: { id: string; name: string }[];
}) {
  const [matchType, setMatchType] = useState<"stableford_2v2" | "match_play_1v1">("stableford_2v2");
  const [nine, setNine] = useState<"front" | "back">("front");
  const [state, formAction] = useFormState(createMatch, {});

  const teamChubbs = teams.find((t) => t.name === "Team Chubbs")?.id;
  const teamMcAvoy = teams.find((t) => t.name === "Team McAvoy")?.id;
  const chubbsPlayers = players.filter((p) => p.team_id === teamChubbs);
  const mcavoyPlayers = players.filter((p) => p.team_id === teamMcAvoy);
  const sessionsById = new Map(sessions.map((s) => [s.id, s.name]));

  return (
    <form action={formAction} className="space-y-3 max-w-lg">
      <input type="hidden" name="match_type" value={matchType} />
      <input type="hidden" name="nine" value={nine} />
      <div className="flex gap-4 flex-wrap">
        <label className="flex items-center gap-1 text-sm">
          <input
            type="radio"
            name="match_type_radio"
            checked={matchType === "stableford_2v2"}
            onChange={() => setMatchType("stableford_2v2")}
          />
          2v2 Stableford
        </label>
        <label className="flex items-center gap-1 text-sm">
          <input
            type="radio"
            name="match_type_radio"
            checked={matchType === "match_play_1v1"}
            onChange={() => setMatchType("match_play_1v1")}
          />
          1v1 Match play
        </label>
      </div>
      <div className="flex gap-4 flex-wrap">
        <label className="flex items-center gap-1 text-sm">
          <input
            type="radio"
            name="nine_radio"
            checked={nine === "front"}
            onChange={() => setNine("front")}
          />
          Front 9
        </label>
        <label className="flex items-center gap-1 text-sm">
          <input
            type="radio"
            name="nine_radio"
            checked={nine === "back"}
            onChange={() => setNine("back")}
          />
          Back 9
        </label>
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <select name="foursome_id" className="px-3 py-2 border border-slate-300 rounded text-sm" required>
          <option value="">Foursome</option>
          {foursomes.map((f) => (
            <option key={f.id} value={f.id}>
              {`${sessionsById.get(f.session_id) ?? f.session_id.slice(0, 8)} – ${
                f.label ?? "(no label)"
              }`}
            </option>
          ))}
        </select>
        <select name="holes" className="px-3 py-2 border border-slate-300 rounded text-sm">
          <option value="9">9 holes</option>
          <option value="18">18 holes</option>
        </select>
        <select name="status" className="px-3 py-2 border border-slate-300 rounded text-sm">
          <option value="not_started">Not started</option>
          <option value="in_progress">In progress</option>
          <option value="complete">Complete</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium text-slate-700 mb-1">Team Chubbs</p>
          <select name="team_a_player_1" className="w-full px-2 py-1 border rounded mb-1" required={matchType === "stableford_2v2"}>
            <option value="">Player 1</option>
            {chubbsPlayers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            name="team_a_player_2"
            className="w-full px-2 py-1 border rounded"
            required={matchType === "stableford_2v2"}
            disabled={matchType === "match_play_1v1"}
          >
            <option value="">Player 2</option>
            {chubbsPlayers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="font-medium text-slate-700 mb-1">Team McAvoy</p>
          <select name="team_b_player_1" className="w-full px-2 py-1 border rounded mb-1" required={matchType === "stableford_2v2"}>
            <option value="">Player 1</option>
            {mcavoyPlayers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            name="team_b_player_2"
            className="w-full px-2 py-1 border rounded"
            required={matchType === "stableford_2v2"}
            disabled={matchType === "match_play_1v1"}
          >
            <option value="">Player 2</option>
            {mcavoyPlayers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        className="px-3 py-2 bg-slate-800 text-white rounded text-sm font-medium hover:bg-slate-700"
      >
        Create match
      </button>
      {state?.error && <span className="text-red-600 text-sm block">{state.error}</span>}
    </form>
  );
}
