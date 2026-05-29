"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { LiveMatch } from "@/lib/leaderboard";
import { isSaturdayMatchPlay } from "@/lib/db-types";
import { TRACKED_SESSION_NAMES } from "@/lib/session-names";

function isTeamCompetitionSession(sessionName: string): boolean {
  const normalized = sessionName.trim().toLowerCase();
  return TRACKED_SESSION_NAMES.some(
    (name) => normalized === name.toLowerCase()
  );
}

/** Parse 1v1 `matchPlayState` strings and infer current leader. */
function oneVOneLeaderFromState(
  state: string | undefined,
  a0: string,
  b0: string
): "chubbs" | "mcavoy" | null {
  if (!state || state.toLowerCase() === "all square") return null;
  const parsed = state.match(/^(.+?) (?:\d+ up|wins \d+&\d+|wins \d+ up)$/);
  if (!parsed) return null;
  const leaderName = parsed[1].trim();
  if (a0 && leaderName === a0) return "chubbs";
  if (b0 && leaderName === b0) return "mcavoy";
  return null;
}

function getWinner(m: LiveMatch): "chubbs" | "mcavoy" | null {
  if (m.status !== "complete") return null;
  if (m.matchType === "stableford_2v2") {
    const a = m.teamAPoints ?? 0;
    const b = m.teamBPoints ?? 0;
    if (a > b) return "chubbs";
    if (b > a) return "mcavoy";
    return null;
  }
  if (isSaturdayMatchPlay(m.matchType)) {
    const a0 = (m.playerNames?.team_a?.[0] ?? "").trim();
    const b0 = (m.playerNames?.team_b?.[0] ?? "").trim();
    return oneVOneLeaderFromState(m.matchPlayState, a0, b0);
  }
  if (m.matchType === "match_play_1v1") {
    if (m.matchPlayState === "Chubbs leads") return "chubbs";
    if (m.matchPlayState === "McAvoy leads") return "mcavoy";
    const a0 = (m.playerNames?.team_a?.[0] ?? "").trim();
    const b0 = (m.playerNames?.team_b?.[0] ?? "").trim();
    return oneVOneLeaderFromState(m.matchPlayState, a0, b0);
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
  if (isSaturdayMatchPlay(m.matchType)) {
    const a0 = (m.playerNames?.team_a?.[0] ?? "").trim();
    const b0 = (m.playerNames?.team_b?.[0] ?? "").trim();
    return oneVOneLeaderFromState(m.matchPlayState, a0, b0);
  }
  if (m.matchType === "match_play_1v1") {
    if (m.matchPlayState === "Chubbs leads") return "chubbs";
    if (m.matchPlayState === "McAvoy leads") return "mcavoy";
    const a0 = (m.playerNames?.team_a?.[0] ?? "").trim();
    const b0 = (m.playerNames?.team_b?.[0] ?? "").trim();
    return oneVOneLeaderFromState(m.matchPlayState, a0, b0);
  }
  return null;
}

function MatchCard({ m }: { m: LiveMatch }) {
  const completedWinner = getWinner(m);
  const inProgressLeader =
    m.status === "in_progress" ? getCurrentLeader(m) : null;
  const logoTeam =
    completedWinner ??
    (isTeamCompetitionSession(m.sessionName) ? inProgressLeader : null);
  const holesLabel =
    m.status === "complete"
      ? "Final"
      : m.holesCompleted != null && m.holesCompleted >= m.holes
        ? "Match Complete"
        : m.holesCompleted != null && m.holesCompleted > 0
          ? `Thru ${m.holesCompleted}`
          : null;

  const hasColor = !!completedWinner;

  const cardClasses =
    completedWinner === "chubbs"
      ? "block border border-white/30 rounded-lg p-4 bg-[#427340] hover:opacity-95 shadow-sm text-white"
      : completedWinner === "mcavoy"
        ? "block border border-white/30 rounded-lg p-4 bg-[#3C4E73] hover:opacity-95 shadow-sm text-white"
        : "block border border-slate-200 rounded-lg p-4 bg-white hover:bg-slate-50 shadow-sm";

  const textPrimary = hasColor ? "text-white" : "text-slate-800";
  const textSecondary = hasColor ? "text-white/90" : "text-slate-600";
  const textMuted = hasColor ? "text-white/80" : "text-slate-500";
  const textBold = hasColor ? "text-white" : "text-slate-900";

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
          Match {m.matchNum ?? "—"} — {nineLabel}
        </div>

        <div className="relative">
          {logoTeam && (
            <div className="pointer-events-none absolute left-0 right-0 top-9 bottom-2 z-10 flex items-center justify-center">
              <Image
                src={
                  logoTeam === "chubbs"
                    ? "/images/team-chubbs.png"
                    : "/images/team-mcavoy.png"
                }
                alt={
                  logoTeam === "chubbs"
                    ? "Team Chubbs G.C. logo"
                    : "Team McAvoy Golf Club logo"
                }
                width={1024}
                height={1024}
                className="h-auto max-h-[6.12rem] w-auto max-w-[min(9.52rem,100%)] object-contain"
              />
            </div>
          )}

          {isSaturdayMatchPlay(m.matchType) ? (
            <>
              <div className="grid grid-cols-3 items-baseline gap-3 text-xl">
                <div className={`justify-self-start font-medium ${textBold}`}>
                  {teamAPlayerOne || "—"}
                </div>
                <div className={`justify-self-center text-center text-lg ${textMuted}`}>
                  {holesLabel ?? ""}
                </div>
                <div className={`justify-self-end text-right font-medium ${textBold}`}>
                  {teamBPlayerOne || "—"}
                </div>
              </div>
              {m.matchPlayState && (
                <div className="mt-1 flex justify-center">
                  <p className={`text-lg font-semibold ${textPrimary}`}>
                    {m.matchPlayState}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 items-baseline gap-3 text-xl">
                <div className={`justify-self-start font-medium ${textBold}`}>
                  Chubbs
                </div>
                <div className={`justify-self-center text-center text-lg ${textMuted}`}>
                  {holesLabel ?? ""}
                </div>
                <div className={`justify-self-end text-right font-medium ${textBold}`}>
                  McAvoy
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
            </>
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
  activeSessionName: string | null;
}

type MatchState = {
  liveMatches: LiveMatch[];
  completedMatches: LiveMatch[];
  upcomingMatches: LiveMatch[];
  allMatches: LiveMatch[];
  activeSessionName: string | null;
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

type SessionMatchGroup = {
  key: string;
  label: string;
  matches: LiveMatch[];
};

type SaturdayFoursomeGroup = {
  key: string;
  label: string;
  matches: LiveMatch[];
  logoSrc: string | null;
};

const SATURDAY_FOURSOME_LOGOS: Record<string, string> = {
  "Harborfields Invitational": "/images/Green Jacket.png",
  "Miller High Life Classic": "/images/Gold Jacket.png",
  "Smirnoff Ice Shootout": "/images/Silver Jacket.png",
  "The Masters by Dr. McGillicuddy's Menthol Mint": "/images/Rainbow Jacket.png",
};

function isSaturdayAfternoonSession(activeSessionName: string | null): boolean {
  return (activeSessionName ?? "").toLowerCase().includes("saturday afternoon");
}

function compareMatchesByMatchNum(a: LiveMatch, b: LiveMatch): number {
  const numA = a.matchNum ?? Number.POSITIVE_INFINITY;
  const numB = b.matchNum ?? Number.POSITIVE_INFINITY;
  if (numA !== numB) return numA - numB;
  return a.id.localeCompare(b.id);
}

function groupSaturdayMatchesByFoursome(matches: LiveMatch[]): SaturdayFoursomeGroup[] {
  const map = new Map<string, LiveMatch[]>();
  const order: string[] = [];

  for (const m of matches) {
    const rawLabel = m.foursomeLabel?.trim() ?? "";
    const key = rawLabel || `foursome:${m.sessionId ?? "unknown"}:${m.id}`;
    if (!map.has(key)) {
      order.push(key);
      map.set(key, []);
    }
    map.get(key)!.push(m);
  }

  return order.map((key) => {
    const grouped = [...(map.get(key) ?? [])].sort(compareMatchesByMatchNum);
    const label = grouped[0]?.foursomeLabel?.trim() || "Foursome";
    return {
      key,
      label,
      matches: grouped,
      logoSrc: SATURDAY_FOURSOME_LOGOS[label] ?? null,
    };
  });
}

function groupMatchesBySession(matches: LiveMatch[]): SessionMatchGroup[] {
  const map = new Map<string, LiveMatch[]>();
  const order: string[] = [];
  for (const m of matches) {
    const key = m.sessionId ?? `name:${m.sessionName}`;
    if (!map.has(key)) {
      order.push(key);
      map.set(key, []);
    }
    map.get(key)!.push(m);
  }
  return order.map((key) => {
    const groupMatches = map.get(key)!;
    const raw = groupMatches[0]?.sessionName?.trim() ?? "";
    return {
      key,
      label: raw || "Session",
      matches: groupMatches,
    };
  });
}

export function MatchesSection({
  liveMatches,
  completedMatches,
  upcomingMatches,
  allMatches,
  activeSessionName,
}: MatchesSectionProps) {
  const [activeTab, setActiveTab] = useState<MatchTab>(() =>
    getInitialTab(liveMatches, completedMatches, upcomingMatches)
  );
  const [matchState, setMatchState] = useState<MatchState>({
    liveMatches,
    completedMatches,
    upcomingMatches,
    allMatches,
    activeSessionName,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setMatchState({
      liveMatches,
      completedMatches,
      upcomingMatches,
      allMatches,
      activeSessionName,
    });
  }, [liveMatches, completedMatches, upcomingMatches, allMatches, activeSessionName]);

  const matches =
    activeTab === "live"
      ? matchState.liveMatches
      : activeTab === "upcoming"
        ? matchState.upcomingMatches
        : activeTab === "all"
          ? matchState.allMatches
          : matchState.completedMatches;

  const sessionGroups = matches.length === 0 ? [] : groupMatchesBySession(matches);
  const showSessionHeadings = sessionGroups.length > 1;
  const showSaturdayFoursomeGrouping = isSaturdayAfternoonSession(matchState.activeSessionName);
  const saturdayGroups =
    showSaturdayFoursomeGrouping && matches.length > 0
      ? groupSaturdayMatchesByFoursome(matches)
      : [];

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
        activeSessionName: data.activeSessionName ?? null,
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
      <p className="text-sm text-slate-600 mb-3">
        {matchState.activeSessionName ? (
          <>
            <span className="text-slate-500">Active session </span>
            <span className="font-medium text-slate-800">{matchState.activeSessionName}</span>
          </>
        ) : (
          <span className="text-slate-500">No active session selected</span>
        )}
      </p>
      {matches.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">No matches in this category yet.</p>
      ) : showSaturdayFoursomeGrouping ? (
        <div className="space-y-4">
          {saturdayGroups.map((group) => (
            <details key={group.key} open className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 hover:bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  {group.logoSrc && (
                    <Image
                      src={group.logoSrc}
                      alt={`${group.label} logo`}
                      width={200}
                      height={200}
                      className="h-9 w-9 object-contain"
                    />
                  )}
                  <span className="truncate text-sm font-semibold text-slate-800">{group.label}</span>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {group.matches.length} {group.matches.length === 1 ? "match" : "matches"}
                </span>
              </summary>
              <div className="px-4 pb-4">
                <ul className="space-y-3">
                  {group.matches.map((m) => (
                    <li key={m.id}>
                      <MatchCard m={m} />
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {sessionGroups.map((group) => (
            <div key={group.key}>
              {showSessionHeadings && (
                <h3 className="text-sm font-semibold text-slate-700 mb-2">{group.label}</h3>
              )}
              <ul className="space-y-3">
                {group.matches.map((m) => (
                  <li key={m.id}>
                    <MatchCard m={m} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
