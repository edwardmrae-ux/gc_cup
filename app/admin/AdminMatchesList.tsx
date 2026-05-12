"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MatchStatusSelect } from "./MatchStatusSelect";
import { DeleteMatchButton } from "./DeleteMatchButton";
import { ClearScoresButton } from "./ClearScoresButton";

export type AdminMatchRow = {
  id: string;
  sessionId: string | null;
  sessionName: string;
  foursomeLabel: string;
  matchNum: number | null;
  matchTypeLabel: string;
  nineLabel: string;
  holes: number;
  status: string;
  playersStr: string;
};

type SessionOption = { id: string; name: string; session_date: string };

export function AdminMatchesList({
  sessions,
  rows,
}: {
  sessions: SessionOption[];
  rows: AdminMatchRow[];
}) {
  const [showAll, setShowAll] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(sessions.map((s) => s.id))
  );

  const visibleRows = useMemo(() => {
    if (showAll) return rows;
    return rows.filter(
      (r) => r.sessionId != null && selectedIds.has(r.sessionId)
    );
  }, [rows, showAll, selectedIds]);

  function onToggleAll(checked: boolean) {
    if (checked) {
      setShowAll(true);
      setSelectedIds(new Set(sessions.map((s) => s.id)));
    } else {
      setShowAll(false);
      setSelectedIds(new Set(sessions.map((s) => s.id)));
    }
  }

  function onToggleSession(sessionId: string, checked: boolean) {
    setSelectedIds((prev) => {
      const base = showAll
        ? new Set(sessions.map((s) => s.id))
        : new Set(prev);
      if (checked) base.add(sessionId);
      else base.delete(sessionId);
      return base;
    });
    setShowAll(false);
  }

  return (
    <div className="mt-3 space-y-4">
      <fieldset className="border border-slate-200 rounded-lg p-3 bg-slate-50/80">
        <legend className="text-sm font-medium text-slate-700 px-1">
          Filter by session
        </legend>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-slate-300"
              checked={showAll}
              onChange={(e) => onToggleAll(e.target.checked)}
            />
            All sessions
          </label>
          {sessions.length > 0 && (
            <div
              className="flex flex-wrap gap-x-4 gap-y-2 pt-3 border-t border-slate-200"
              aria-label="Sessions"
            >
              {sessions.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="rounded border-slate-300"
                    checked={showAll ? true : selectedIds.has(s.id)}
                    onChange={(e) => onToggleSession(s.id, e.target.checked)}
                  />
                  {s.name} ({s.session_date})
                </label>
              ))}
            </div>
          )}
        </div>
      </fieldset>

      {visibleRows.length === 0 && rows.length > 0 ? (
        <p className="text-sm text-slate-500 py-2">
          No matches for the selected sessions.
        </p>
      ) : (
        <ul className="space-y-3 text-sm">
          {visibleRows.map((m) => (
            <li
              key={m.id}
              className="space-y-1.5 border-b border-slate-100 pb-3 last:border-0"
            >
              <div className="text-slate-700 flex flex-wrap gap-x-2 gap-y-1 items-baseline">
                <span>
                  <span className="text-slate-500">Session:</span>{" "}
                  {m.sessionName}
                </span>
                <span className="text-slate-300">·</span>
                <span>
                  <span className="text-slate-500">Foursome:</span>{" "}
                  {m.foursomeLabel}
                </span>
                <span className="text-slate-300">·</span>
                <span>
                  <span className="text-slate-500">Match #:</span>{" "}
                  {m.matchNum ?? "—"}
                </span>
                <span className="text-slate-300">·</span>
                <span>
                  <span className="text-slate-500">Type:</span>{" "}
                  {m.matchTypeLabel}
                </span>
                <span className="text-slate-300">·</span>
                <span>
                  <span className="text-slate-500">Nine:</span> {m.nineLabel}
                </span>
              </div>
              <div className="text-slate-700">
                <span className="text-slate-500">Players:</span>{" "}
                {m.playersStr || "—"}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/match/${m.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Open scoring ({m.holes} holes)
                </Link>
                <MatchStatusSelect matchId={m.id} currentStatus={m.status} />
                <ClearScoresButton matchId={m.id} />
                <DeleteMatchButton matchId={m.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
