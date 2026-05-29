import fs from "fs/promises";
import path from "path";
import { createClient } from "./supabase/server";

const CONFIG_FILENAME = "active-session.json";
const SETTINGS_ROW_ID = 1;

type ActiveSessionConfig = {
  activeSessionId: string | null;
};

function getConfigPath() {
  return path.join(process.cwd(), CONFIG_FILENAME);
}

function isServerlessRuntime(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

async function readActiveSessionFromFile(): Promise<string | null> {
  try {
    const filePath = getConfigPath();
    const data = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(data) as Partial<ActiveSessionConfig>;
    if (!parsed || typeof parsed.activeSessionId === "undefined") {
      return null;
    }
    if (parsed.activeSessionId === null) {
      return null;
    }
    if (typeof parsed.activeSessionId === "string" && parsed.activeSessionId.trim()) {
      return parsed.activeSessionId;
    }
    return null;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "ENOENT") {
      return null;
    }
    console.error("Failed to read active session config:", err);
    return null;
  }
}

async function readActiveSessionFromDb(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("active_session_id")
    .eq("id", SETTINGS_ROW_ID)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data?.active_session_id ?? null;
}

async function writeActiveSessionToDb(sessionId: string | null): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("app_settings").upsert({
    id: SETTINGS_ROW_ID,
    active_session_id: sessionId,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    throw error;
  }
}

export async function getActiveSessionId(): Promise<string | null> {
  // #region agent log
  fetch("http://127.0.0.1:7823/ingest/cb0c7db1-dacd-4a55-8df4-c55ced40b85b", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "19bf9b" },
    body: JSON.stringify({
      sessionId: "19bf9b",
      runId: "pre-fix",
      hypothesisId: "A",
      location: "activeSessionStore.ts:getActiveSessionId:entry",
      message: "getActiveSessionId entry",
      data: {
        cwd: process.cwd(),
        isServerless: isServerlessRuntime(),
        configPath: getConfigPath(),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (isServerlessRuntime()) {
    try {
      const id = await readActiveSessionFromDb();
      // #region agent log
      fetch("http://127.0.0.1:7823/ingest/cb0c7db1-dacd-4a55-8df4-c55ced40b85b", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "19bf9b" },
        body: JSON.stringify({
          sessionId: "19bf9b",
          runId: "pre-fix",
          hypothesisId: "B",
          location: "activeSessionStore.ts:getActiveSessionId:db",
          message: "read from app_settings",
          data: { activeSessionId: id, source: "db" },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return id;
    } catch (err) {
      // #region agent log
      fetch("http://127.0.0.1:7823/ingest/cb0c7db1-dacd-4a55-8df4-c55ced40b85b", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "19bf9b" },
        body: JSON.stringify({
          sessionId: "19bf9b",
          runId: "pre-fix",
          hypothesisId: "C",
          location: "activeSessionStore.ts:getActiveSessionId:db-error",
          message: "app_settings read failed",
          data: { error: String(err) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      console.error("Failed to read active session from app_settings:", err);
      return null;
    }
  }

  try {
    const id = await readActiveSessionFromDb();
    if (id !== null) {
      return id;
    }
  } catch {
    // app_settings may not exist locally yet; fall back to file
  }
  return readActiveSessionFromFile();
}

export async function setActiveSessionId(sessionId: string | null): Promise<void> {
  // #region agent log
  fetch("http://127.0.0.1:7823/ingest/cb0c7db1-dacd-4a55-8df4-c55ced40b85b", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "19bf9b" },
    body: JSON.stringify({
      sessionId: "19bf9b",
      runId: "pre-fix",
      hypothesisId: "A",
      location: "activeSessionStore.ts:setActiveSessionId:entry",
      message: "setActiveSessionId entry",
      data: {
        sessionId,
        cwd: process.cwd(),
        isServerless: isServerlessRuntime(),
        configPath: getConfigPath(),
        storage: isServerlessRuntime() ? "db" : "db-then-file-fallback",
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (isServerlessRuntime()) {
    await writeActiveSessionToDb(sessionId);
    // #region agent log
    fetch("http://127.0.0.1:7823/ingest/cb0c7db1-dacd-4a55-8df4-c55ced40b85b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "19bf9b" },
      body: JSON.stringify({
        sessionId: "19bf9b",
        runId: "pre-fix",
        hypothesisId: "D",
        location: "activeSessionStore.ts:setActiveSessionId:db-success",
        message: "wrote active session to app_settings",
        data: { sessionId, source: "db" },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return;
  }

  try {
    await writeActiveSessionToDb(sessionId);
    // #region agent log
    fetch("http://127.0.0.1:7823/ingest/cb0c7db1-dacd-4a55-8df4-c55ced40b85b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "19bf9b" },
      body: JSON.stringify({
        sessionId: "19bf9b",
        runId: "pre-fix",
        hypothesisId: "D",
        location: "activeSessionStore.ts:setActiveSessionId:db-success-local",
        message: "wrote active session to app_settings (local)",
        data: { sessionId, source: "db" },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return;
  } catch (err) {
    // #region agent log
    fetch("http://127.0.0.1:7823/ingest/cb0c7db1-dacd-4a55-8df4-c55ced40b85b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "19bf9b" },
      body: JSON.stringify({
        sessionId: "19bf9b",
        runId: "pre-fix",
        hypothesisId: "C",
        location: "activeSessionStore.ts:setActiveSessionId:db-fallback-file",
        message: "app_settings write failed, falling back to file",
        data: { error: String(err) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }

  const filePath = getConfigPath();
  const config: ActiveSessionConfig = { activeSessionId: sessionId };
  const tmpPath = `${filePath}.tmp`;
  const json = JSON.stringify(config, null, 2);
  await fs.writeFile(tmpPath, json, "utf8");
  await fs.rename(tmpPath, filePath);
}

export async function clearActiveSessionIfInvalid(): Promise<string | null> {
  const current = await getActiveSessionId();
  if (!current) {
    return null;
  }
  return current;
}
