import Image from "next/image";
import { getTeamTotals, getAllMatches, partitionMatchesBySessionAndStatus } from "@/lib/leaderboard";
import { getActiveSessionLabel } from "@/lib/activeSessionLabel";
import { MatchesSection } from "./MatchesSection";
import { TeamPointsScorecard } from "./TeamPointsScorecard";

export default async function LeaderboardPage() {
  const [totals, allMatches, { activeSessionId, activeSessionName }] = await Promise.all([
    getTeamTotals(),
    getAllMatches(),
    getActiveSessionLabel(),
  ]);

  const { liveMatches, completedMatches, upcomingMatches } = partitionMatchesBySessionAndStatus(
    allMatches,
    activeSessionId
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <Image
          src="/images/gc-cup-shield-2026.png"
          alt="The Good Counsel Cup 2026 tournament crest featuring a cat drinking beer, a tornado playing golf, a dragon with beer bottles, and a knight."
          width={682}
          height={1024}
          className="h-auto w-auto max-h-48 md:max-h-56 object-contain"
          priority
        />
      </div>

      <section className="border border-slate-200 rounded-lg bg-white p-6 shadow-sm">
        <div className="flex justify-between items-end gap-8">
          <div className="flex flex-col items-center text-center flex-1">
            <Image
              src="/images/team-chubbs.png"
              alt="Team Chubbs G.C. logo"
              width={1024}
              height={1024}
              className="mb-2 h-auto w-auto max-h-20 md:max-h-24 object-contain"
            />
            <p className="text-2xl font-bold text-slate-900">Team Chubbs</p>
            <p className="text-1xl font-light text-slate-600">16 points to retain</p>
          </div>
          <div className="pb-1 text-slate-400 font-medium">vs</div>
          <div className="flex flex-col items-center text-center flex-1">
            <Image
              src="/images/team-mcavoy.png"
              alt="Team McAvoy Golf Club logo"
              width={1024}
              height={1024}
              className="mb-2 h-auto w-auto max-h-20 md:max-h-24 object-contain"
            />
            <p className="text-2xl font-bold text-slate-900">Team McAvoy</p>
            <p className="text-1xl font-light text-slate-600">16.5 points to win</p>
          </div>
        </div>

        <div className="my-5">
          <TeamPointsScorecard teamChubbs={totals.teamChubbs} teamMcAvoy={totals.teamMcAvoy} />
        </div>

        <div className="flex justify-between items-center gap-8">
          <div className="text-center flex-1">
            <p className="text-4xl font-bold text-slate-800">{totals.teamChubbs}</p>
          </div>
          <div className="text-slate-400 font-medium" aria-hidden>
            vs
          </div>
          <div className="text-center flex-1">
            <p className="text-4xl font-bold text-slate-800">{totals.teamMcAvoy}</p>
          </div>
        </div>
      </section>

      {allMatches.length > 0 && (
        <MatchesSection
          liveMatches={liveMatches}
          completedMatches={completedMatches}
          upcomingMatches={upcomingMatches}
          allMatches={allMatches}
          activeSessionName={activeSessionName}
        />
      )}

      <p className="text-sm text-slate-500">
        Team points are from sessions that count toward the competition. Saturday
        afternoon round is excluded.
      </p>
    </div>
  );
}
