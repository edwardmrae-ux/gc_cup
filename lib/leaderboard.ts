import { createClient } from "./supabase/server";
import {
  stablefordTotal,
  stableford2v2Points,
  matchPlay1v1Points,
  type HoleScoreRow,
} from "./team-points";

export interface TeamTotals {
  teamChubbs: number;
  teamMcAvoy: number;
}

export interface LiveMatch {
  id: string;
  sessionId: string | null;
  sessionName: string;
  foursomeLabel: string | null;
  matchType: string;
  holes: number;
  status: string;
  teamAPoints?: number;
  teamBPoints?: number;
  matchPlayState?: string;
  playerNames?: { team_a: string[]; team_b: string[] };
  holesCompleted?: number;
  matchNum?: number;
  nine?: "front" | "back" | null;
}

function computeHolesCompleted(
  scoreRows: HoleScoreRow[],
  playerIds: string[],
  holeNumbers: number[]
): number {
  if (playerIds.length === 0 || holeNumbers.length === 0) return 0;

  let completed = 0;

  for (const holeNumber of holeNumbers) {
    const allPlayersHaveScore = playerIds.every((playerId) =>
      scoreRows.some(
        (row) =>
          row.player_id === playerId &&
          row.hole_number === holeNumber &&
          row.gross_score != null
      )
    );

    if (!allPlayersHaveScore) {
      break;
    }

    completed += 1;
  }

  return completed;
}

export function partitionMatchesBySessionAndStatus(
  allMatches: LiveMatch[],
  activeSessionId: string | null
): {
  liveMatches: LiveMatch[];
  completedMatches: LiveMatch[];
  upcomingMatches: LiveMatch[];
} {
  const liveMatches = allMatches.filter(
    (m) => activeSessionId != null && m.sessionId === activeSessionId
  );
  const completedMatches = allMatches.filter(
    (m) => m.status === "complete" && m.sessionId !== activeSessionId
  );
  const upcomingMatches = allMatches.filter(
    (m) => m.status !== "complete" && m.sessionId !== activeSessionId
  );
  return { liveMatches, completedMatches, upcomingMatches };
}

export async function getTeamTotals(): Promise<TeamTotals> {
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, course_id")
    .eq("counts_for_team_competition", true);
  if (!sessions?.length) return { teamChubbs: 0, teamMcAvoy: 0 };

  const sessionIds = sessions.map((s) => s.id);
  const { data: foursomes } = await supabase
    .from("foursomes")
    .select("id, session_id")
    .in("session_id", sessionIds);
  if (!foursomes?.length) return { teamChubbs: 0, teamMcAvoy: 0 };

  const foursomesById = new Map(foursomes.map((f) => [f.id, f]));
  const sessionsById = new Map(sessions.map((s) => [s.id, s]));

  const foursomeIds = foursomes.map((f) => f.id);
  const { data: matches } = await supabase
    .from("matches")
    .select("id, foursome_id, match_type, holes, status, nine")
    .in("foursome_id", foursomeIds)
    .eq("status", "complete");
  if (!matches?.length) return { teamChubbs: 0, teamMcAvoy: 0 };

  // Collect all course_ids used by these sessions
  const courseIds = Array.from(
    new Set(
      sessions
        .map((s: any) => s.course_id as string | null)
        .filter((id): id is string => !!id)
    )
  );

  let parByCourseAndHole = new Map<string, Map<number, number>>();
  if (courseIds.length > 0) {
    const { data: courseHoles } = await supabase
      .from("course_holes")
      .select("course_id, hole_number, par")
      .in("course_id", courseIds);
    if (courseHoles) {
      for (const row of courseHoles as { course_id: string; hole_number: number; par: number }[]) {
        if (!parByCourseAndHole.has(row.course_id)) {
          parByCourseAndHole.set(row.course_id, new Map());
        }
        parByCourseAndHole.get(row.course_id)!.set(row.hole_number, row.par);
      }
    }
  }

  const { data: config } = await supabase
    .from("stableford_config")
    .select("strokes_over_par, points");
  const stablefordConfig = config ?? [];

  let teamChubbs = 0;
  let teamMcAvoy = 0;

  for (const match of matches) {
    const foursome = foursomesById.get(match.foursome_id);
    const session = foursome ? sessionsById.get(foursome.session_id) : undefined;
    const courseId: string | undefined = (session as any)?.course_id ?? undefined;
    const parMap = courseId ? parByCourseAndHole.get(courseId) : undefined;

    const { data: matchPlayers } = await supabase
      .from("match_players")
      .select("player_id, side")
      .eq("match_id", match.id);
    if (!matchPlayers?.length) continue;

    const teamAIds = matchPlayers.filter((p) => p.side === "team_a").map((p) => p.player_id);
    const teamBIds = matchPlayers.filter((p) => p.side === "team_b").map((p) => p.player_id);

    const { data: scores } = await supabase
      .from("hole_scores")
      .select("player_id, hole_number, gross_score")
      .eq("match_id", match.id);
    const scoreRows: HoleScoreRow[] = (scores ?? []).map((s) => ({
      player_id: s.player_id,
      hole_number: s.hole_number,
      gross_score: s.gross_score,
    }));

    const holeCount = match.holes;
    const holeNumbers =
      holeCount === 18
        ? Array.from({ length: 18 }, (_, i) => i + 1)
        : match.nine === "back"
          ? Array.from({ length: 9 }, (_, i) => i + 10)
          : Array.from({ length: 9 }, (_, i) => i + 1);

    if (match.match_type === "stableford_2v2") {
      const ptsA = stablefordTotal(scoreRows, teamAIds, holeCount, stablefordConfig, parMap, holeNumbers);
      const ptsB = stablefordTotal(scoreRows, teamBIds, holeCount, stablefordConfig, parMap, holeNumbers);
      const { team_a, team_b } = stableford2v2Points(ptsA, ptsB);
      teamChubbs += team_a;
      teamMcAvoy += team_b;
    } else {
      const teamAPlayerId = teamAIds[0];
      const teamBPlayerId = teamBIds[0];
      if (teamAPlayerId && teamBPlayerId) {
        const { team_a, team_b } = matchPlay1v1Points(
          scoreRows,
          teamAPlayerId,
          teamBPlayerId,
          holeCount,
          holeNumbers
        );
        teamChubbs += team_a;
        teamMcAvoy += team_b;
      }
    }
  }

  return { teamChubbs, teamMcAvoy };
}

export async function getInProgressMatches(): Promise<LiveMatch[]> {
  const supabase = await createClient();
  const { data: matches } = await supabase
    .from("matches")
    .select("id, foursome_id, match_type, holes, status, nine, match_num")
    .eq("status", "in_progress");
  if (!matches?.length) return [];

  const { data: config } = await supabase
    .from("stableford_config")
    .select("strokes_over_par, points");
  const stablefordConfig = config ?? [];

  // Preload foursomes and sessions with course information
  const foursomeIds = matches.map((m) => m.foursome_id);
  const { data: foursomes } = await supabase
    .from("foursomes")
    .select("id, session_id, label, sort")
    .in("id", foursomeIds);
  const foursomesById = new Map((foursomes ?? []).map((f) => [f.id, f]));

  const sortedMatches = [...matches].sort((a, b) => {
    const sortA = foursomesById.get(a.foursome_id)?.sort ?? 0;
    const sortB = foursomesById.get(b.foursome_id)?.sort ?? 0;
    if (sortA !== sortB) return sortA - sortB;
    return a.id.localeCompare(b.id);
  });

  const sessionIds = Array.from(
    new Set((foursomes ?? []).map((f: any) => f.session_id as string))
  );
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, name, course_id")
    .in("id", sessionIds);
  const sessionsById = new Map((sessions ?? []).map((s) => [s.id, s]));

  const courseIds = Array.from(
    new Set(
      (sessions ?? [])
        .map((s: any) => s.course_id as string | null)
        .filter((id): id is string => !!id)
    )
  );
  let parByCourseAndHole = new Map<string, Map<number, number>>();
  if (courseIds.length > 0) {
    const { data: courseHoles } = await supabase
      .from("course_holes")
      .select("course_id, hole_number, par")
      .in("course_id", courseIds);
    if (courseHoles) {
      for (const row of courseHoles as { course_id: string; hole_number: number; par: number }[]) {
        if (!parByCourseAndHole.has(row.course_id)) {
          parByCourseAndHole.set(row.course_id, new Map());
        }
        parByCourseAndHole.get(row.course_id)!.set(row.hole_number, row.par);
      }
    }
  }

  const result: LiveMatch[] = [];

  for (const m of sortedMatches) {
    const foursome = foursomesById.get(m.foursome_id);
    const session = foursome ? sessionsById.get(foursome.session_id) : undefined;
    const courseId: string | undefined = (session as any)?.course_id ?? undefined;
    const parMap = courseId ? parByCourseAndHole.get(courseId) : undefined;
    const { data: matchPlayers } = await supabase
      .from("match_players")
      .select("player_id, side")
      .eq("match_id", m.id);
    const { data: players } = matchPlayers?.length
      ? await supabase.from("players").select("id, name").in("id", matchPlayers.map((mp) => mp.player_id))
      : { data: [] };
    const playersById = new Map((players ?? []).map((p) => [p.id, p.name]));
    const teamAIds = (matchPlayers ?? [])
      .filter((p) => p.side === "team_a")
      .map((p) => p.player_id);
    const teamBIds = (matchPlayers ?? [])
      .filter((p) => p.side === "team_b")
      .map((p) => p.player_id);

    const { data: scores } = await supabase
      .from("hole_scores")
      .select("player_id, hole_number, gross_score")
      .eq("match_id", m.id);
    const scoreRows: HoleScoreRow[] = (scores ?? []).map((s) => ({
      player_id: s.player_id,
      hole_number: s.hole_number,
      gross_score: s.gross_score,
    }));

    const holeNumbers =
      m.holes === 18
        ? Array.from({ length: 18 }, (_, i) => i + 1)
        : m.nine === "back"
          ? Array.from({ length: 9 }, (_, i) => i + 10)
          : Array.from({ length: 9 }, (_, i) => i + 1);

    const allPlayerIds = [...teamAIds, ...teamBIds];
    const holesCompleted = computeHolesCompleted(scoreRows, allPlayerIds, holeNumbers);

    let teamAPoints: number | undefined;
    let teamBPoints: number | undefined;
    let matchPlayState: string | undefined;

    if (m.match_type === "stableford_2v2") {
      teamAPoints = stablefordTotal(scoreRows, teamAIds, m.holes, stablefordConfig, parMap, holeNumbers);
      teamBPoints = stablefordTotal(scoreRows, teamBIds, m.holes, stablefordConfig, parMap, holeNumbers);
    } else {
      const teamAPlayerId = teamAIds[0];
      const teamBPlayerId = teamBIds[0];
      if (teamAPlayerId && teamBPlayerId) {
        const { team_a, team_b } = matchPlay1v1Points(
          scoreRows,
          teamAPlayerId,
          teamBPlayerId,
          m.holes,
          holeNumbers
        );
      matchPlayState =
        team_a > team_b
          ? "Chubbs leads"
          : team_b > team_a
            ? "McAvoy leads"
            : "All square";
      }
    }

    result.push({
      id: m.id,
      sessionId: foursome?.session_id ?? null,
      sessionName: (session as any)?.name ?? "",
      foursomeLabel: foursome?.label ?? null,
      matchType: m.match_type,
      holes: m.holes,
      status: m.status,
      teamAPoints,
      teamBPoints,
      matchPlayState,
      holesCompleted,
      matchNum: m.match_num,
      nine: m.nine ?? null,
      playerNames: {
        team_a: teamAIds.map((id) => playersById.get(id) ?? ""),
        team_b: teamBIds.map((id) => playersById.get(id) ?? ""),
      },
    });
  }

  return result;
}

export async function getAllMatches(): Promise<LiveMatch[]> {
  // #region agent log
  fetch('http://127.0.0.1:7828/ingest/cb0c7db1-dacd-4a55-8df4-c55ced40b85b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fe25fe'},body:JSON.stringify({sessionId:'fe25fe',location:'leaderboard.ts:getAllMatches',message:'getAllMatches entry',data:{},timestamp:Date.now(),hypothesisId:'entry'})}).catch(()=>{});
  // #endregion
  const supabase = await createClient();
  const matchesResult = await supabase
    .from("matches")
    .select("id, foursome_id, match_type, holes, status, nine, match_num")
    .order("id");
  const matches = matchesResult.data;
  const matchesError = matchesResult.error;
  // #region agent log
  fetch('http://127.0.0.1:7828/ingest/cb0c7db1-dacd-4a55-8df4-c55ced40b85b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fe25fe'},body:JSON.stringify({sessionId:'fe25fe',location:'leaderboard.ts:after matches query',message:'matches query result',data:{matchesLength:matches?.length ?? 0,matchesError:matchesError?.message ?? null,hasData:!!matches},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  if (!matches?.length) return [];

  const { data: config } = await supabase
    .from("stableford_config")
    .select("strokes_over_par, points");
  const stablefordConfig = config ?? [];

  const foursomeIds = matches.map((m) => m.foursome_id);
  const { data: foursomes } = await supabase
    .from("foursomes")
    .select("id, session_id, label, sort")
    .in("id", foursomeIds);
  const foursomesById = new Map((foursomes ?? []).map((f) => [f.id, f]));

  const sessionIds = Array.from(
    new Set((foursomes ?? []).map((f: any) => f.session_id as string))
  );
  const sessionsResult = await supabase
    .from("sessions")
    .select("id, name, course_id, sort")
    .in("id", sessionIds);
  const sessions = sessionsResult.data;
  const sessionsError = sessionsResult.error;
  // #region agent log
  fetch('http://127.0.0.1:7828/ingest/cb0c7db1-dacd-4a55-8df4-c55ced40b85b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fe25fe'},body:JSON.stringify({sessionId:'fe25fe',location:'leaderboard.ts:after sessions query',message:'sessions query result',data:{sessionsLength:sessions?.length ?? 0,sessionsError:sessionsError?.message ?? null,hasData:!!sessions},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  const sessionsById = new Map((sessions ?? []).map((s) => [s.id, s]));

  const sortedMatches = [...matches].sort((a, b) => {
    const foursomeA = foursomesById.get(a.foursome_id);
    const foursomeB = foursomesById.get(b.foursome_id);
    const sessionSortA = foursomeA
      ? (sessionsById.get(foursomeA.session_id) as { sort?: number | null } | undefined)?.sort ?? 0
      : 0;
    const sessionSortB = foursomeB
      ? (sessionsById.get(foursomeB.session_id) as { sort?: number | null } | undefined)?.sort ?? 0
      : 0;
    if (sessionSortA !== sessionSortB) return sessionSortA - sessionSortB;
    const matchNumA = a.match_num ?? 0;
    const matchNumB = b.match_num ?? 0;
    if (matchNumA !== matchNumB) return matchNumA - matchNumB;
    return a.id.localeCompare(b.id);
  });

  // #region agent log
  fetch('http://127.0.0.1:7828/ingest/cb0c7db1-dacd-4a55-8df4-c55ced40b85b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fe25fe'},body:JSON.stringify({sessionId:'fe25fe',location:'leaderboard.ts:getAllMatches after sort',message:'sortedMatches length',data:{sortedMatchesLength:sortedMatches.length},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
  // #endregion

  const courseIds = Array.from(
    new Set(
      (sessions ?? [])
        .map((s: any) => s.course_id as string | null)
        .filter((id): id is string => !!id)
    )
  );
  let parByCourseAndHole = new Map<string, Map<number, number>>();
  if (courseIds.length > 0) {
    const { data: courseHoles } = await supabase
      .from("course_holes")
      .select("course_id, hole_number, par")
      .in("course_id", courseIds);
    if (courseHoles) {
      for (const row of courseHoles as { course_id: string; hole_number: number; par: number }[]) {
        if (!parByCourseAndHole.has(row.course_id)) {
          parByCourseAndHole.set(row.course_id, new Map());
        }
        parByCourseAndHole.get(row.course_id)!.set(row.hole_number, row.par);
      }
    }
  }

  const result: LiveMatch[] = [];

  for (const m of sortedMatches) {
    const foursome = foursomesById.get(m.foursome_id);
    const session = foursome ? sessionsById.get(foursome.session_id) : undefined;
    const courseId: string | undefined = (session as any)?.course_id ?? undefined;
    const parMap = courseId ? parByCourseAndHole.get(courseId) : undefined;
    const { data: matchPlayers } = await supabase
      .from("match_players")
      .select("player_id, side")
      .eq("match_id", m.id);
    const teamAIds = (matchPlayers ?? [])
      .filter((p) => p.side === "team_a")
      .map((p) => p.player_id);
    const teamBIds = (matchPlayers ?? [])
      .filter((p) => p.side === "team_b")
      .map((p) => p.player_id);
    const { data: players } = matchPlayers?.length
      ? await supabase.from("players").select("id, name").in("id", matchPlayers.map((mp) => mp.player_id))
      : { data: [] };
    const playersById = new Map((players ?? []).map((p) => [p.id, p.name]));

    const { data: scores } = await supabase
      .from("hole_scores")
      .select("player_id, hole_number, gross_score")
      .eq("match_id", m.id);
    const scoreRows: HoleScoreRow[] = (scores ?? []).map((s) => ({
      player_id: s.player_id,
      hole_number: s.hole_number,
      gross_score: s.gross_score,
    }));

    const holeNumbers =
      m.holes === 18
        ? Array.from({ length: 18 }, (_, i) => i + 1)
        : m.nine === "back"
          ? Array.from({ length: 9 }, (_, i) => i + 10)
          : Array.from({ length: 9 }, (_, i) => i + 1);

    const allPlayerIds = [...teamAIds, ...teamBIds];
    const holesCompleted = computeHolesCompleted(scoreRows, allPlayerIds, holeNumbers);

    let teamAPoints: number | undefined;
    let teamBPoints: number | undefined;
    let matchPlayState: string | undefined;
    if (m.match_type === "stableford_2v2") {
      teamAPoints = stablefordTotal(scoreRows, teamAIds, m.holes, stablefordConfig, parMap, holeNumbers);
      teamBPoints = stablefordTotal(scoreRows, teamBIds, m.holes, stablefordConfig, parMap, holeNumbers);
    } else if (teamAIds[0] && teamBIds[0]) {
      const { team_a, team_b } = matchPlay1v1Points(
        scoreRows,
        teamAIds[0],
        teamBIds[0],
        m.holes,
        holeNumbers
      );
      matchPlayState =
        team_a > team_b ? "Chubbs leads" : team_b > team_a ? "McAvoy leads" : "All square";
    }

    result.push({
      id: m.id,
      sessionId: foursome?.session_id ?? null,
      sessionName: (session as any)?.name ?? "",
      foursomeLabel: foursome?.label ?? null,
      matchType: m.match_type,
      holes: m.holes,
      status: m.status,
      teamAPoints,
      teamBPoints,
      matchPlayState,
      holesCompleted,
      matchNum: m.match_num,
      nine: m.nine ?? null,
      playerNames: {
        team_a: teamAIds.map((id) => playersById.get(id) ?? ""),
        team_b: teamBIds.map((id) => playersById.get(id) ?? ""),
      },
    });
  }
  // #region agent log
  fetch('http://127.0.0.1:7828/ingest/cb0c7db1-dacd-4a55-8df4-c55ced40b85b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fe25fe'},body:JSON.stringify({sessionId:'fe25fe',location:'leaderboard.ts:getAllMatches return',message:'result length',data:{resultLength:result.length},timestamp:Date.now(),hypothesisId:'exit'})}).catch(()=>{});
  // #endregion
  return result;
}
