"use client";
import { useState, useEffect, useCallback } from "react";

type Company = {
  id: string;
  name: string;
  domain: string | null;
  created_at: string;
  user_count: number;
};

export default function CompaniesClient() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editName, setEditName] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/superadmin/companies");
    if (res.ok) {
      const data = await res.json();
      setCompanies(data.companies);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/superadmin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, domain: newDomain }),
    });
    if (res.ok) {
      setNewName(""); setNewDomain(""); setShowCreate(false);
      fetchCompanies();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to create company");
    }
    setCreating(false);
  }

  async function handleUpdate() {
    if (!editingCompany) return;
    setActionLoading(editingCompany.id);
    const res = await fetch("/api/superadmin/companies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: editingCompany.id, name: editName, domain: editDomain }),
    });
    if (res.ok) {
      setEditingCompany(null);
      fetchCompanies();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to update");
    }
    setActionLoading(null);
  }

  async function handleDelete(company: Company) {
    if (!confirm(`Delete "${company.name}"? This will unassign ${company.user_count} user(s) and remove all activity assignments.`)) return;
    setActionLoading(company.id);
    const res = await fetch("/api/superadmin/companies", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: company.id }),
    });
    if (res.ok) {
      fetchCompanies();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to delete");
    }
    setActionLoading(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: "-.04em", color: "#221D23" }}>
            Companies
          </h1>
          <p style={{ margin: "4px 0 0", color: "#6B6B6B", fontSize: 14 }}>
            {companies.length} compan{companies.length !== 1 ? "ies" : "y"} on the platform
          </p>
        </div>
        <button onClick={() => setShowCreate(v => !v)} style={{
          padding: "10px 20px", borderRadius: 999, border: "none",
          background: "#FFCE00", color: "#221D23", fontWeight: 800, fontSize: 13,
          cursor: "pointer", fontFamily: "inherit",
        }}>
          + New Company
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ background: "white", border: "2px solid #FFCE00", borderRadius: 18, padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, color: "#221D23" }}>Create Company</div>
          <form onSubmit={handleCreate} style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6B6B6B", marginBottom: 6 }}>Company Name *</label>
              <input
                value={newName} onChange={e => setNewName(e.target.value)} required
                placeholder="e.g. Acme Corp"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E8E6DC", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6B6B6B", marginBottom: 6 }}>Domain (optional)</label>
              <input
                value={newDomain} onChange={e => setNewDomain(e.target.value)}
                placeholder="e.g. acme.com"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E8E6DC", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{
                padding: "10px 18px", borderRadius: 10, border: "1px solid #E8E6DC",
                background: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>Cancel</button>
              <button type="submit" disabled={creating} style={{
                padding: "10px 18px", borderRadius: 10, border: "none",
                background: "#221D23", color: "white", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>{creating ? "Creating..." : "Create"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Companies grid */}
      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "#B0ABA5", fontSize: 14 }}>Loading companies...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {companies.map(c => (
            <div key={c.id} style={{
              background: "white", border: "1px solid #E8E6DC", borderRadius: 18,
              padding: 22, display: "flex", flexDirection: "column", gap: 12,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#221D23", letterSpacing: "-.02em" }}>{c.name}</div>
                  {c.domain && <div style={{ fontSize: 12, color: "#B0ABA5", marginTop: 2 }}>{c.domain}</div>}
                </div>
                <div style={{
                  padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800,
                  background: "rgba(54,150,252,.08)", color: "#1A7FD4",
                }}>
                  {c.user_count} user{c.user_count !== 1 ? "s" : ""}
                </div>
              </div>

              <div style={{ fontSize: 12, color: "#B0ABA5" }}>
                Created {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => { setEditingCompany(c); setEditName(c.name); setEditDomain(c.domain ?? ""); }}
                  disabled={actionLoading === c.id}
                  style={{
                    flex: 1, padding: "8px 14px", borderRadius: 8, border: "1px solid #E8E6DC",
                    background: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  disabled={actionLoading === c.id}
                  style={{
                    padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(239,68,68,.2)",
                    background: "rgba(239,68,68,.05)", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit", color: "#EF4444",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingCompany && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.3)", zIndex: 500, display: "grid", placeItems: "center" }}
          onClick={() => setEditingCompany(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "white", borderRadius: 20, padding: 32, width: "min(440px, calc(100vw - 48px))",
            boxShadow: "0 24px 64px rgba(0,0,0,.15)",
          }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 900, letterSpacing: "-.03em" }}>Edit Company</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6B6B6B", marginBottom: 6 }}>Company Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E8E6DC", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6B6B6B", marginBottom: 6 }}>Domain</label>
                <input value={editDomain} onChange={e => setEditDomain(e.target.value)} placeholder="e.g. acme.com"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E8E6DC", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => setEditingCompany(null)}
                style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #E8E6DC", background: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
              <button onClick={handleUpdate} disabled={actionLoading === editingCompany.id}
                style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#221D23", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {actionLoading === editingCompany.id ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
