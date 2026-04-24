import { getActiveSessionId } from "./activeSessionStore";
import { createClient } from "./supabase/server";

export type ActiveSessionLabel = {
  activeSessionId: string | null;
  activeSessionName: string | null;
};

/**
 * Resolves the human-readable label for the configured active session from the DB
 * (not from match rows), so it works when there are no matches yet.
 */
export async function getActiveSessionLabel(): Promise<ActiveSessionLabel> {
  const activeSessionId = await getActiveSessionId();
  if (!activeSessionId) {
    return { activeSessionId: null, activeSessionName: null };
  }

  try {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("sessions")
      .select("name, session_date")
      .eq("id", activeSessionId)
      .maybeSingle();

    if (error) {
      console.error("getActiveSessionLabel sessions query:", error);
      return {
        activeSessionId,
        activeSessionName: activeSessionId.slice(0, 8),
      };
    }
    if (!row?.name) {
      return {
        activeSessionId,
        activeSessionName: activeSessionId.slice(0, 8),
      };
    }
    const datePart = row.session_date ? ` (${row.session_date})` : "";
    return {
      activeSessionId,
      activeSessionName: `${row.name}${datePart}`,
    };
  } catch (err) {
    console.error("getActiveSessionLabel:", err);
    return {
      activeSessionId,
      activeSessionName: activeSessionId.slice(0, 8),
    };
  }
}
