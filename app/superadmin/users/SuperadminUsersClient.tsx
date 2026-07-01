"use client";
import { useState, useEffect, useCallback } from "react";

type User = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  company_id: string | null;
  company_name: string | null;
  created_at: string;
};

type Company = { id: string; name: string };

export default function SuperadminUsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (companyFilter) params.set("company_id", companyFilter);
    if (roleFilter !== "all") params.set("role", roleFilter);
    const res = await fetch(`/api/superadmin/users?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setCompanies(data.companies);
    }
    setLoading(false);
  }, [search, companyFilter, roleFilter]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  async function handleAction(userId: string, action: string, data?: any) {
    setActionLoading(userId);
    const res = await fetch("/api/superadmin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, data }),
    });
    if (res.ok) {
      fetchUsers();
      setEditingUser(null);
    } else {
      const err = await res.json();
      alert(err.error || "Action failed");
    }
    setActionLoading(null);
  }

  const roleBadge = (role: string) => ({
    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
    background: role === "superadmin" ? "rgba(98,60,234,.1)" : role === "admin" ? "rgba(54,150,252,.1)" : "rgba(35,206,104,.1)",
    color: role === "superadmin" ? "#5030C0" : role === "admin" ? "#1A7FD4" : "#17A855",
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: "-.04em", color: "#221D23" }}>
          User Management
        </h1>
        <p style={{ margin: "4px 0 0", color: "#6B6B6B", fontSize: 14 }}>
          Manage all platform users across companies
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 400 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B0ABA5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text" placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px 10px 40px", borderRadius: 12,
              border: "1px solid #E8E6DC", fontSize: 13.5, fontWeight: 600,
              outline: "none", fontFamily: "inherit", background: "white", boxSizing: "border-box",
            }}
          />
        </div>
        <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #E8E6DC", fontSize: 13, fontWeight: 700, background: "white", cursor: "pointer", fontFamily: "inherit" }}>
          <option value="">All companies</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #E8E6DC", fontSize: 13, fontWeight: 700, background: "white", cursor: "pointer", fontFamily: "inherit" }}>
          <option value="all">All roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
          <option value="superadmin">Superadmins</option>
        </select>
      </div>

      {/* Count */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#6B6B6B", marginBottom: 12 }}>
        {users.length} user{users.length !== 1 ? "s" : ""}
      </div>

      {/* Table */}
      <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 20, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#B0ABA5", fontSize: 14 }}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#B0ABA5", fontSize: 14 }}>No users found</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ background: "#FAFAF8", borderBottom: "1px solid #E8E6DC" }}>
                  {["Name", "Email", "Company", "Role", "Joined", "Actions"].map(h => (
                    <th key={h} style={{
                      padding: "12px 16px", textAlign: h === "Actions" ? "right" : "left",
                      fontSize: 11.5, fontWeight: 700, color: "#6B6B6B",
                      textTransform: "uppercase", letterSpacing: ".04em",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #F0EEE8", background: i % 2 === 0 ? "white" : "#FAFAF8" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%", background: "#221D23",
                          color: "white", display: "grid", placeItems: "center",
                          fontSize: 11, fontWeight: 800, flexShrink: 0,
                        }}>
                          {(u.full_name ?? u.email ?? "?")[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: "#221D23" }}>{u.full_name ?? "—"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#6B6B6B" }}>{u.email}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <select
                        value={u.company_id ?? ""}
                        onChange={e => handleAction(u.id, "assign-company", { company_id: e.target.value || null })}
                        disabled={actionLoading === u.id}
                        style={{
                          padding: "5px 8px", borderRadius: 8, border: "1px solid #E8E6DC",
                          fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                          background: "white", color: u.company_id ? "#221D23" : "#B0ABA5",
                          maxWidth: 160,
                        }}
                      >
                        <option value="">No company</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <select
                        value={u.role}
                        onChange={e => handleAction(u.id, "change-role", { role: e.target.value })}
                        disabled={actionLoading === u.id}
                        style={{
                          padding: "5px 8px", borderRadius: 8, border: "1px solid #E8E6DC",
                          fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                          background: "white",
                          color: u.role === "superadmin" ? "#5030C0" : u.role === "admin" ? "#1A7FD4" : "#17A855",
                        }}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                        <option value="superadmin">superadmin</option>
                      </select>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#6B6B6B" }}>
                      {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => { setEditingUser(u); setEditName(u.full_name ?? ""); setEditEmail(u.email ?? ""); }}
                          disabled={actionLoading === u.id}
                          style={{
                            padding: "5px 10px", borderRadius: 8, border: "1px solid #E8E6DC",
                            background: "white", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deactivate ${u.full_name ?? u.email}? This removes company and sets role to user.`)) {
                              handleAction(u.id, "deactivate");
                            }
                          }}
                          disabled={actionLoading === u.id}
                          style={{
                            padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,.2)",
                            background: "rgba(239,68,68,.05)", fontSize: 11, fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit", color: "#EF4444",
                          }}
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.3)", zIndex: 500, display: "grid", placeItems: "center" }}
          onClick={() => setEditingUser(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "white", borderRadius: 20, padding: 32, width: "min(440px, calc(100vw - 48px))",
            boxShadow: "0 24px 64px rgba(0,0,0,.15)",
          }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 900, letterSpacing: "-.03em" }}>Edit User</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6B6B6B", marginBottom: 6 }}>Full Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E8E6DC", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6B6B6B", marginBottom: 6 }}>Email</label>
                <input value={editEmail} onChange={e => setEditEmail(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E8E6DC", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => setEditingUser(null)}
                style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #E8E6DC", background: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
              <button
                onClick={() => handleAction(editingUser.id, "update", { full_name: editName, email: editEmail })}
                disabled={actionLoading === editingUser.id}
                style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#221D23", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {actionLoading === editingUser.id ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
