import type { Role } from "@/lib/supabase/types";

export function getPostLoginPath(role: Role, requestedPath?: string | null): string {
  const path = requestedPath?.trim() || null;

  if (role === "superadmin") {
    if (path && (path.startsWith("/superadmin") || path.startsWith("/admin"))) return path;
    return "/superadmin";
  }

  if (role === "admin") {
    if (path?.startsWith("/admin")) return path;
    return "/admin";
  }

  if (path && !path.startsWith("/admin") && !path.startsWith("/superadmin")) {
    return path;
  }

  return "/workflows";
}
