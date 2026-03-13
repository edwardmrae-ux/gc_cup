"use client";

import Link from "next/link";
import { useState } from "react";
import type { LiveMatch } from "@/lib/leaderboard";

function MatchCard({ m }: { m: LiveMatch }) {
  const holesLabel =
    m.holesCompleted != null && m.holesCompleted >= m.holes
      ? "Match Complete"
      : m.holesCompleted != null && m.holesCompleted > 0
        ? `Thru ${m.holesCompleted}`
        : null;

  return (
    <Link
      href={`/match/${m.id}`}
      className="block border border-slate-200 rounded-lg p-4 bg-white hover:bg-slate-50 shadow-sm"
    >
      <div className="mb-3 text-center">
        <p className="font-medium text-slate-800 text-lg">
          {m.sessionName}
          {m.foursomeLabel ? ` – ${m.foursomeLabel}` : ""}
        </p>
        <p className="text-sm text-slate-600">
          {m.matchType === "stableford_2v2" ? "2v2 Stableford" : "1v1 Match play"} – {m.holes} holes
        </p>
        {holesLabel && (
          <p className="text-xs text-slate-500 mt-1">
            {holesLabel}
          </p>
        )}
      </div>
      <div className="flex divide-x divide-slate-200">
        <div className="flex-1 px-3">
          <div className="mb-2">
            <p className="font-bold text-slate-900">Team Chubbs</p>
            {m.playerNames && (
              <ul className="text-xs text-slate-600 mt-1">
                {m.playerNames.team_a.map((name: string, idx: number) => (
                  <li key={idx}>{name}</li>
                ))}
              </ul>
            )}
          </div>
          {m.matchType === "stableford_2v2" && (
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {m.teamAPoints ?? 0}
              </p>
            </div>
          )}
          {m.matchType === "match_play_1v1" && m.matchPlayState && (
            <div>
              <p className="text-lg font-semibold text-slate-800">
                {m.matchPlayState}
              </p>
            </div>
          )}
        </div>
        <div className="flex-1 px-3">
          <div className="mb-2 text-right">
            <p className="font-bold text-slate-900">Team McAvoy</p>
            {m.playerNames && (
              <ul className="text-xs text-slate-600 mt-1">
                {m.playerNames.team_b.map((name: string, idx: number) => (
                  <li key={idx}>{name}</li>
                ))}
              </ul>
            )}
          </div>
          {m.matchType === "stableford_2v2" && (
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-800">
                {m.teamBPoints ?? 0}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

type MatchTab = "live" | "completed" | "upcoming" | "all";

interface MatchesSectionProps {
  liveMatches: LiveMatch[];
  completedMatches: LiveMatch[];
  upcomingMatches: LiveMatch[];
  allMatches: LiveMatch[];
}

function getInitialTab(
  liveMatches: LiveMatch[],
  completedMatches: LiveMatch[],
  upcomingMatches: LiveMatch[]
): MatchTab {
  if (liveMatches.length > 0) return "live";
  if (upcomingMatches.length > 0) return "upcoming";
  return "completed";
}

export function MatchesSection({
  liveMatches,
  completedMatches,
  upcomingMatches,
  allMatches,
}: MatchesSectionProps) {
  const [activeTab, setActiveTab] = useState<MatchTab>(() =>
    getInitialTab(liveMatches, completedMatches, upcomingMatches)
  );

  const matches =
    activeTab === "live"
      ? liveMatches
      : activeTab === "upcoming"
        ? upcomingMatches
        : activeTab === "all"
          ? allMatches
          : completedMatches;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-700">Matches</h2>
        <div
          role="tablist"
          className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "live"}
            onClick={() => setActiveTab("live")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "live"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Live
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "completed"}
            onClick={() => setActiveTab("completed")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "completed"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Completed
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "upcoming"}
            onClick={() => setActiveTab("upcoming")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "upcoming"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Upcoming
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            onClick={() => setActiveTab("all")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "all"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            All
          </button>
        </div>
      </div>
      {matches.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">No matches in this category yet.</p>
      ) : (
        <ul className="space-y-3">
          {matches.map((m) => (
            <li key={m.id}>
              <MatchCard m={m} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
