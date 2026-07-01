"use client";

import { useState } from "react";
import Link from "next/link";

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  aimastery_approved: boolean;
  aimastery_requested: boolean;
  created_at: string;
};

type Props = {
  users: UserRow[];
};

export default function AIMasteryAccessClient({ users: initUsers }: Props) {
  const [users, setUsers]             = useState<UserRow[]>(initUsers);
  const [toggling, setToggling]       = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState<"all" | "approved" | "pending">("all");

  async function toggleAccess(userId: string, approved: boolean) {
    setToggling(userId);
    const res = await fetch("/api/superadmin/aimastery-access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, approved }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, aimastery_approved: approved } : u));
    }
    setToggling(null);
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q);
    const matchesFilter =
      filter === "all" ? true :
      filter === "approved" ? u.aimastery_approved :
      !u.aimastery_approved;
    return matchesSearch && matchesFilter;
  });

  const approvedCount = users.filter(u => u.aimastery_approved).length;
  const pendingCount  = users.length - approvedCount;

  return (
    <div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Link href="/superadmin" style={{ fontSize: 13, color: "#6B6B6B", textDecoration: "none", fontWeight: 700 }}>
                ← Superadmin
              </Link>
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: "-.04em" }}>
              AI Mastery Access Requests
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B6B6B" }}>
              {users.length} request{users.length !== 1 ? "s" : ""} · {approvedCount} approved · {pendingCount} pending
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total requests", value: users.length,  color: "#221D23" },
            { label: "Approved",     value: approvedCount,  color: "#17A855" },
            { label: "Pending",      value: pendingCount,   color: "#B05000" },
          ].map(s => (
            <div key={s.label} style={{
              background: "#fff", border: "1px solid #E8E6DC", borderRadius: 14,
              padding: "18px 22px", boxShadow: "0 2px 8px rgba(34,29,35,.05)",
            }}>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-.04em", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#9A9590", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{
              flex: 1, padding: "9px 14px", borderRadius: 10,
              border: "1.5px solid #E8E6DC", fontSize: 13.5,
              outline: "none", fontFamily: "inherit", background: "#FAFAF8",
            }}
          />
          {(["all", "approved", "pending"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "9px 18px", borderRadius: 999, fontSize: 12, fontWeight: 800,
                cursor: "pointer", border: "1.5px solid",
                borderColor: filter === f ? "#221D23" : "#E8E6DC",
                background:   filter === f ? "#221D23" : "#fff",
                color:        filter === f ? "#fff"    : "#6B6B6B",
                textTransform: "capitalize",
              }}
            >{f}</button>
          ))}
        </div>

        {/* Table */}
        <div style={{
          background: "#fff", border: "1px solid #E8E6DC", borderRadius: 18,
          overflow: "hidden", boxShadow: "0 2px 12px rgba(34,29,35,.06)",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "inherit" }}>
            <thead>
              <tr style={{ background: "#FAFAF8", borderBottom: "1px solid #E8E6DC" }}>
                {["Name", "Email", "Role", "Joined", "Status", "Action"].map(h => (
                  <th key={h} style={{
                    padding: "11px 18px", textAlign: "left",
                    fontSize: 10.5, fontWeight: 800, color: "#9A9590",
                    textTransform: "uppercase", letterSpacing: ".04em", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "40px 18px", textAlign: "center", color: "#B0ABA5", fontSize: 13 }}>
                    No users found
                  </td>
                </tr>
              )}
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F2F0EA" : "none" }}>
                  <td style={{ padding: "13px 18px", fontSize: 13, fontWeight: 700 }}>
                    {u.full_name ?? <span style={{ color: "#B0ABA5" }}>—</span>}
                  </td>
                  <td style={{ padding: "13px 18px", fontSize: 12, color: "#6B6B6B" }}>
                    {u.email ?? "—"}
                  </td>
                  <td style={{ padding: "13px 18px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
                      background: u.role === "superadmin" ? "rgba(98,60,234,.1)" : "rgba(34,29,35,.06)",
                      color:      u.role === "superadmin" ? "#5030C0"            : "#6B6B6B",
                    }}>{u.role}</span>
                  </td>
                  <td style={{ padding: "13px 18px", fontSize: 12, color: "#9A9590" }}>
                    {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "13px 18px" }}>
                    {u.role === "superadmin" ? (
                      <span style={{ fontSize: 11, color: "#9A9590" }}>Always on</span>
                    ) : (
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
                        background: u.aimastery_approved ? "rgba(35,206,104,.12)" : "rgba(246,138,41,.1)",
                        color:      u.aimastery_approved ? "#17A855"               : "#B05000",
                      }}>
                        {u.aimastery_approved ? "Approved" : "Pending"}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "13px 18px" }}>
                    {u.role !== "superadmin" && (
                      <button
                        disabled={toggling === u.id}
                        onClick={() => toggleAccess(u.id, !u.aimastery_approved)}
                        style={{
                          padding: "6px 16px", borderRadius: 999, fontSize: 12, fontWeight: 800,
                          cursor: toggling === u.id ? "default" : "pointer",
                          border: "none",
                          background: u.aimastery_approved ? "#F2F0EA" : "#FFCE00",
                          color:      u.aimastery_approved ? "#6B6B6B" : "#221D23",
                          opacity: toggling === u.id ? 0.6 : 1,
                          transition: "opacity .15s",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {toggling === u.id ? "…" : u.aimastery_approved ? "Revoke" : "Approve"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
}
