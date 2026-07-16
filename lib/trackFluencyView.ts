import type { FluencyEntityType } from "@/lib/supabase/types";

function getSessionId(): string {
  try {
    let sessionId = localStorage.getItem("nw_session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("nw_session_id", sessionId);
    }
    return sessionId;
  } catch {
    return crypto.randomUUID();
  }
}

/** Fire-and-forget fluency content view for admin engagement charts. */
export function trackFluencyView(entityType: FluencyEntityType, entityId: string) {
  if (!entityId || typeof window === "undefined") return;
  const sessionId = getSessionId();
  fetch("/api/fluency/view", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entityType, entityId, sessionId }),
  }).catch(() => {});
}
