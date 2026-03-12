import fs from "fs/promises";
import path from "path";

const CONFIG_FILENAME = "active-session.json";

type ActiveSessionConfig = {
  activeSessionId: string | null;
};

function getConfigPath() {
  return path.join(process.cwd(), CONFIG_FILENAME);
}

export async function getActiveSessionId(): Promise<string | null> {
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
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      return null;
    }
    console.error("Failed to read active session config:", err);
    return null;
  }
}

export async function setActiveSessionId(sessionId: string | null): Promise<void> {
  const filePath = getConfigPath();
  const config: ActiveSessionConfig = {
    activeSessionId: sessionId,
  };
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


