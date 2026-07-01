import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AI_UPDATES_PAGE_NAME, WORKFLOWS_PAGE_NAME } from "@/lib/site";
export const dynamic = "force-dynamic";

const card: React.CSSProperties = {
  background: "white", border: "1px solid #E8E6DC", borderRadius: 20,
  boxShadow: "0 2px 16px rgba(34,29,35,.07)", padding: "28px 32px",
  textDecoration: "none", display: "block",
};

export default async function AnalyticsHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role, company_id, full_name, avatar_url, created_at, aimastery_approved, aimastery_requested")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "superadmin") redirect("/apply");

  const [
    { count: applyViews },
    { count: knowViews },
    { count: completions },
  ] = await Promise.all([
    supabase.from("activity_views").select("id", { count: "exact", head: true }),
    supabase.from("fluency_views").select("id", { count: "exact", head: true }),
    supabase.from("user_progress").select("id", { count: "exact", head: true }).eq("status", "completed"),
  ]);

  return (
    <div>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Link href="/superadmin" style={{ color: "#9B9490", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>Superadmin</Link>
            <span style={{ color: "#D0CCC6" }}>/</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#221D23" }}>Analytics</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, letterSpacing: "-.05em" }}>Analytics</h1>
          <p style={{ margin: "6px 0 0", color: "#6B6B6B", fontSize: 14 }}>
            See who clicked on what across {WORKFLOWS_PAGE_NAME} and {AI_UPDATES_PAGE_NAME} sections.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Apply card */}
          <Link href="/superadmin/analytics/apply" style={{ ...card, borderTop: "3px solid #FFCE00" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,206,0,.15)", display: "grid", placeItems: "center", fontSize: 22 }}>
                ✦
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-.04em", color: "#221D23" }}>{WORKFLOWS_PAGE_NAME}</div>
                <div style={{ fontSize: 12.5, color: "#9B9490", fontWeight: 600 }}>Activity engagement</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ padding: "12px 14px", background: "#FAFAF8", borderRadius: 12, border: "1px solid #F0EEE8" }}>
                <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-.05em", color: "#221D23" }}>{(applyViews ?? 0).toLocaleString()}</div>
                <div style={{ fontSize: 11.5, color: "#9B9490", fontWeight: 600, marginTop: 2 }}>Total views</div>
              </div>
              <div style={{ padding: "12px 14px", background: "#FAFAF8", borderRadius: 12, border: "1px solid #F0EEE8" }}>
                <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-.05em", color: "#17A855" }}>{(completions ?? 0).toLocaleString()}</div>
                <div style={{ fontSize: 11.5, color: "#9B9490", fontWeight: 600, marginTop: 2 }}>Completions</div>
              </div>
            </div>
            <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: "#FFCE00", background: "#221D23", borderRadius: 999, padding: "8px 16px", display: "inline-block" }}>
              View {WORKFLOWS_PAGE_NAME} Analytics →
            </div>
          </Link>

          {/* Know card */}
          <Link href="/superadmin/analytics/know" style={{ ...card, borderTop: "3px solid #5030C0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(80,48,192,.12)", display: "grid", placeItems: "center", fontSize: 22 }}>
                🧠
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-.04em", color: "#221D23" }}>{AI_UPDATES_PAGE_NAME}</div>
                <div style={{ fontSize: 12.5, color: "#9B9490", fontWeight: 600 }}>Fluency content engagement</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ padding: "12px 14px", background: "#FAFAF8", borderRadius: 12, border: "1px solid #F0EEE8" }}>
                <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-.05em", color: "#5030C0" }}>{(knowViews ?? 0).toLocaleString()}</div>
                <div style={{ fontSize: 11.5, color: "#9B9490", fontWeight: 600, marginTop: 2 }}>Total views</div>
              </div>
              <div style={{ padding: "12px 14px", background: "#FAFAF8", borderRadius: 12, border: "1px solid #F0EEE8" }}>
                <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-.05em", color: "#1A7FD4" }}>5</div>
                <div style={{ fontSize: 11.5, color: "#9B9490", fontWeight: 600, marginTop: 2 }}>Content types</div>
              </div>
            </div>
            <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: "white", background: "#5030C0", borderRadius: 999, padding: "8px 16px", display: "inline-block" }}>
              View {AI_UPDATES_PAGE_NAME} Analytics →
            </div>
          </Link>
        </div>

        {/* Seed data info box */}
        <div style={{ marginTop: 24, padding: "16px 20px", background: "white", border: "1px solid #E8E6DC", borderRadius: 14, fontSize: 13, color: "#6B6B6B", lineHeight: 1.6 }}>
          <strong style={{ color: "#221D23" }}>About seed data:</strong> The database was seeded with 50–100 random anonymous views per published activity and video to populate view counters. On each analytics page, toggle <strong>Exclude seed data</strong> (logged-in users only) or set a <strong>date range</strong> starting from when real users began using the platform to see true engagement figures.
        </div>
    </div>
  );
}
