import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  // #region agent log
  fetch("http://127.0.0.1:7828/ingest/cb0c7db1-dacd-4a55-8df4-c55ced40b85b", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "bec0f7",
    },
    body: JSON.stringify({
      sessionId: "bec0f7",
      runId: "pre-fix",
      hypothesisId: "H1",
      location: "lib/supabase/server.ts:createClient",
      message: "createClient called",
      data: {},
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}
