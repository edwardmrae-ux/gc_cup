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

function MatchCard({ m }: { m: LiveMatch }) {
  const winner = getWinner(m);
  const holesLabel =
    m.holesCompleted != null && m.holesCompleted >= m.holes
      ? "Match Complete"
      : m.holesCompleted != null && m.holesCompleted > 0
        ? `Thru ${m.holesCompleted}`
        : null;

  const cardClasses =
    winner === "chubbs"
      ? "block border border-white/30 rounded-lg p-4 bg-[#1F5E3B] hover:opacity-95 shadow-sm text-white"
      : winner === "mcavoy"
        ? "block border border-white/30 rounded-lg p-4 bg-[#C65D1E] hover:opacity-95 shadow-sm text-white"
        : "block border border-slate-200 rounded-lg p-4 bg-white hover:bg-slate-50 shadow-sm";

  const textPrimary = winner ? "text-white" : "text-slate-800";
  const textSecondary = winner ? "text-white/90" : "text-slate-600";
  const textMuted = winner ? "text-white/80" : "text-slate-500";
  const textBold = winner ? "text-white" : "text-slate-900";

  const matchTypeLabel =
    m.matchType === "stableford_2v2" ? "2v2 Stableford" : "1v1 Match play";
  const nineLabel =
    m.nine === "front"
      ? "Front 9"
      : m.nine === "back"
        ? "Back 9"
        : "9 holes";

  const metaParts = [matchTypeLabel, nineLabel, holesLabel].filter(Boolean);
  const metaLabel = metaParts.join(" · ");

  return (
    <Link href={`/match/${m.id}`} className={cardClasses}>
      <div className="flex flex-col gap-1">
        {/* Row 1: Team names + centered session/match */}
        <div className="grid grid-cols-3 items-baseline gap-3 text-sm">
          <div className={`justify-self-start font-semibold ${textBold}`}>
            Team Chubbs
          </div>
          <div className="justify-self-center text-center">
            <span className={`font-medium ${textPrimary}`}>
              {m.sessionName} – Match {m.matchNum ?? "—"}
            </span>
          </div>
          <div
            className={`justify-self-end text-right font-semibold ${textBold}`}
          >
            Team McAvoy
          </div>
        </div>

        {/* Row 2: Centered meta line */}
        {metaLabel && (
          <div className="text-xs text-center">
            <span className={textSecondary}>{metaLabel}</span>
          </div>
        )}

        {/* Row 3: Players under each team label */}
        {m.playerNames && (
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className={textSecondary}>
              {m.playerNames.team_a.map((name: string, idx: number) => (
                <div key={idx}>{name}</div>
              ))}
            </div>
            <div />
            <div className={`${textSecondary} text-right`}>
              {m.playerNames.team_b.map((name: string, idx: number) => (
                <div key={idx}>{name}</div>
              ))}
            </div>
          </div>
        )}

        {/* Row 4: Scores under players (Stableford) / match state (1v1) */}
        {m.matchType === "stableford_2v2" && (
          <div className="mt-1 grid grid-cols-3 gap-3">
            <div className={`text-2xl font-bold ${textPrimary}`}>
              {m.teamAPoints ?? 0}
            </div>
            <div />
            <div className={`text-2xl font-bold ${textPrimary} text-right`}>
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
