"use client";

import Link from "next/link";
import { useState } from "react";
import type { LiveMatch } from "@/lib/leaderboard";

function getWinner(m: LiveMatch): "chubbs" | "mcavoy" | null {
  if (m.status !== "complete") return null;
  if (m.matchType === "stableford_2v2") {
    const a = m.teamAPoints ?? 0;
    const b = m.teamBPoints ?? 0;
    if (a > b) return "chubbs";
    if (b > a) return "mcavoy";
    return null;
  }
  if (m.matchType === "match_play_1v1") {
    if (m.matchPlayState === "Chubbs leads") return "chubbs";
    if (m.matchPlayState === "McAvoy leads") return "mcavoy";
    return null;
  }
  return null;
}

function getCurrentLeader(m: LiveMatch): "chubbs" | "mcavoy" | null {
  if (m.matchType === "stableford_2v2") {
    const a = m.teamAPoints;
    const b = m.teamBPoints;
    if (typeof a === "number" && typeof b === "number") {
      if (a > b) return "chubbs";
      if (b > a) return "mcavoy";
    }
    return null;
  }
  if (m.matchType === "match_play_1v1") {
    if (m.matchPlayState === "Chubbs leads") return "chubbs";
    if (m.matchPlayState === "McAvoy leads") return "mcavoy";
    return null;
  }
  return null;
}

function MatchCard({ m }: { m: LiveMatch }) {
  const winner = getWinner(m);
  const leader = getCurrentLeader(m);
  const holesLabel =
    m.holesCompleted != null && m.holesCompleted >= m.holes
      ? "Match Complete"
      : m.holesCompleted != null && m.holesCompleted > 0
        ? `Thru ${m.holesCompleted}`
        : null;

  const hasColor = !!winner || (m.status === "in_progress" && !!leader);

  const cardClasses =
    winner === "chubbs"
      ? "block border border-white/30 rounded-lg p-4 bg-[#1F5E3B] hover:opacity-95 shadow-sm text-white"
      : winner === "mcavoy"
        ? "block border border-white/30 rounded-lg p-4 bg-[#C65D1E] hover:opacity-95 shadow-sm text-white"
        : m.status === "in_progress" && leader === "chubbs"
          ? "block border border-white/30 rounded-lg p-4 bg-[rgba(31,94,59,0.66)] hover:opacity-95 shadow-sm text-white"
          : m.status === "in_progress" && leader === "mcavoy"
            ? "block border border-white/30 rounded-lg p-4 bg-[rgba(198,93,30,0.66)] hover:opacity-95 shadow-sm text-white"
            : "block border border-slate-200 rounded-lg p-4 bg-white hover:bg-slate-50 shadow-sm";

  const textPrimary = hasColor ? "text-white" : "text-slate-800";
  const textSecondary = hasColor ? "text-white/90" : "text-slate-600";
  const textMuted = hasColor ? "text-white/80" : "text-slate-500";
  const textBold = hasColor ? "text-white" : "text-slate-900";

  const matchTypeLabel =
    m.matchType === "stableford_2v2" ? "2v2 Stableford" : "1v1 Match play";
  const nineLabel =
    m.nine === "front"
      ? "Front 9"
      : m.nine === "back"
        ? "Back 9"
        : "9 holes";
  const teamAPlayers = m.playerNames?.team_a ?? [];
  const teamBPlayers = m.playerNames?.team_b ?? [];
  const teamAPlayerOne = teamAPlayers[0] ?? "";
  const teamAPlayerTwo = teamAPlayers[1] ?? "";
  const teamBPlayerOne = teamBPlayers[0] ?? "";
  const teamBPlayerTwo = teamBPlayers[1] ?? "";

  return (
    <Link href={`/match/${m.id}`} className={cardClasses}>
      <div className="flex flex-col gap-0.5">
        <div className={`w-full text-center text-2xl font-medium ${textPrimary}`}>
          Match {m.matchNum ?? "—"} — {matchTypeLabel} — {nineLabel}
        </div>

        <div className="grid grid-cols-3 items-baseline gap-3 text-xl">
          <div className={`justify-self-start font-medium ${textBold}`}>
            Team Chubbs
          </div>
          <div className={`justify-self-center text-center text-lg ${textMuted}`}>
            {holesLabel ?? ""}
          </div>
          <div className={`justify-self-end text-right font-medium ${textBold}`}>
            Team McAvoy
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-base">
          <div className={textSecondary}>{teamAPlayerOne}</div>
          <div />
          <div className={`${textSecondary} text-right`}>{teamBPlayerOne}</div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-base">
          <div className={textSecondary}>{teamAPlayerTwo}</div>
          <div />
          <div className={`${textSecondary} text-right`}>{teamBPlayerTwo}</div>
        </div>

        {m.matchType === "stableford_2v2" && (
          <div className="mt-1 grid grid-cols-3 gap-3">
            <div className={`text-5xl font-normal ${textPrimary}`}>
              {m.teamAPoints ?? 0}
            </div>
            <div />
            <div className={`text-5xl font-normal ${textPrimary} text-right`}>
              {m.teamBPoints ?? 0}
            </div>
          </div>
        )}
        {m.matchType === "match_play_1v1" && m.matchPlayState && (
          <div className="mt-1 flex justify-end">
            <p className={`text-lg font-semibold ${textPrimary}`}>
              {m.matchPlayState}
            </p>
          </div>
        )}
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

type MatchState = {
  liveMatches: LiveMatch[];
  completedMatches: LiveMatch[];
  upcomingMatches: LiveMatch[];
  allMatches: LiveMatch[];
};

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
  const [matchState, setMatchState] = useState<MatchState>({
    liveMatches,
    completedMatches,
    upcomingMatches,
    allMatches,
  });
  const [refreshing, setRefreshing] = useState(false);

  const matches =
    activeTab === "live"
      ? matchState.liveMatches
      : activeTab === "upcoming"
        ? matchState.upcomingMatches
        : activeTab === "all"
          ? matchState.allMatches
          : matchState.completedMatches;

  async function handleRefresh() {
    try {
      setRefreshing(true);
      const res = await fetch("/api/matches");
      if (!res.ok) {
        console.error("Failed to refresh matches", await res.text());
        return;
      }

      const data = (await res.json()) as MatchState;
      setMatchState({
        liveMatches: data.liveMatches,
        completedMatches: data.completedMatches,
        upcomingMatches: data.upcomingMatches,
        allMatches: data.allMatches,
      });
    } catch (error) {
      console.error("Error refreshing matches", error);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col gap-1">
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
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
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
