"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

type Props = {
  profile: Profile & { companies: { id: string; name: string } | null };
  children: React.ReactNode;
};

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: "Bulk Upload",
    href: "/admin/bulk-upload",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
];

export default function AdminShell({ profile, children }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const initials = profile.full_name
    ? profile.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : (profile.email ?? "?")[0].toUpperCase();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8F8F6", fontFamily: "Roboto, ui-sans-serif, system-ui, sans-serif" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.2)", zIndex: 199 }}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "admin-sidebar-open" : ""}`} style={{
        width: 256,
        background: "#FFFFFF",
        borderRight: "1px solid #E8E6DC",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        bottom: 0,
        zIndex: 200,
        transition: "transform .2s ease",
      }}>
        {/* Brand area */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #F0EEE8" }}>
          <Link href="/apply" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Nudgeable-black.png" alt="Nudgeable" style={{ height: 32 }} />
            <span style={{ fontSize: 15, fontWeight: 500, color: "#221D23", letterSpacing: "-.02em" }}>
              AI Practice Lab
            </span>
          </Link>
        </div>

        {/* Company badge */}
        <div style={{ padding: "16px 20px 8px" }}>
          <div style={{
            padding: "10px 14px",
            background: "linear-gradient(135deg, #221D23 0%, #3a3340 100%)",
            borderRadius: 12,
            color: "white",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", opacity: .7, marginBottom: 4 }}>
              Company
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-.02em" }}>
              {profile.companies?.name ?? "No Company"}
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontSize: 13.5,
                  fontWeight: active ? 800 : 600,
                  color: active ? "#221D23" : "#6B6B6B",
                  background: active ? "#F5F3EE" : "transparent",
                  transition: "all .15s ease",
                }}
              >
                <span style={{ opacity: active ? 1 : .55, display: "flex" }}>{item.icon}</span>
                {item.label}
                {active && (
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%", background: "#FFCE00",
                    marginLeft: "auto", flexShrink: 0,
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div style={{ borderTop: "1px solid #F0EEE8", padding: 12 }}>
          {profile.role === "superadmin" && (
            <Link
              href="/superadmin"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px", borderRadius: 10, marginBottom: 8,
                fontSize: 12, fontWeight: 700, color: "#5030C0",
                background: "rgba(98,60,234,.06)", textDecoration: "none",
                transition: "background .15s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 15l-2 5 9-11h-5l2-5-9 11h5z" />
              </svg>
              Superadmin Panel
            </Link>
          )}
          <Link href="/apply" style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px", borderRadius: 10, marginBottom: 8,
            fontSize: 12, fontWeight: 700, color: "#6B6B6B",
            textDecoration: "none", transition: "background .15s",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to App
          </Link>

          {/* User profile */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10, background: "#FAFAF8",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", background: "#221D23",
              color: "white", display: "grid", placeItems: "center",
              fontSize: 11, fontWeight: 800, flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#221D23", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile.full_name ?? profile.email}
              </div>
              <div style={{ fontSize: 11, color: "#B0ABA5" }}>
                {profile.role}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              style={{
                width: 28, height: 28, borderRadius: 8, border: "1px solid #E8E6DC",
                background: "white", cursor: "pointer", display: "grid", placeItems: "center",
                color: "#6B6B6B", flexShrink: 0, padding: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 256, minWidth: 0 }}>
        {/* Mobile header */}
        <div className="admin-mobile-header" style={{
          display: "none", position: "sticky", top: 0, zIndex: 100,
          height: 56, padding: "0 16px", background: "rgba(255,255,255,.96)",
          borderBottom: "1px solid #E8E6DC", backdropFilter: "blur(18px)",
          alignItems: "center", justifyContent: "space-between",
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              width: 38, height: 38, borderRadius: 10, border: "1px solid #E8E6DC",
              background: "transparent", cursor: "pointer", display: "grid", placeItems: "center",
              padding: 0, color: "#221D23",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#221D23" }}>Admin</span>
          <div style={{ width: 38 }} />
        </div>

        <main style={{ padding: "32px 36px 60px" }}>
          {children}
        </main>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .admin-mobile-header { display: flex !important; }
          .admin-sidebar { transform: translateX(-100%); }
          .admin-sidebar.admin-sidebar-open { transform: translateX(0); }
          div[style*="marginLeft: 256"] { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
