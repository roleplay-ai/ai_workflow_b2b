"use client";
import { useState, useEffect, useCallback, useMemo } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

type BriefItem = { id: string; content: string; sort_order: number };
type Brief = { id: string; title: string; published_date: string; is_active: boolean; fluency_brief_items: BriefItem[] };
type Workflow = { id: string; title: string; description: string | null; created_at: string };

type UserRow = { id: string; email: string | null; full_name: string | null; role: string; company_id: string | null; company_name: string | null };
type Company = { id: string; name: string };

type Newsletter = {
  id: string; title: string; subject: string; item_ids: string[]; workflow_ids: string[]; recipient_ids: string[];
  send_date: string; send_time: string; status: "scheduled" | "sent" | "cancelled"; sent_at: string | null; created_at: string;
};

type ReminderSchedule = {
  id: string; name: string; recipient_ids: string[]; day_of_week: number; send_time: string;
  start_date: string; duration_weeks: number; sends_completed: number; status: "active" | "completed" | "cancelled";
  last_sent_date: string | null; created_at: string;
};

type Props = { briefs: Brief[]; workflows: Workflow[] };

// ── Shared styles ──────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "white", border: "1px solid #E8E6DC", borderRadius: 18,
  boxShadow: "0 2px 12px rgba(34,29,35,.06)",
};
const inp: React.CSSProperties = {
  padding: "9px 12px", borderRadius: 10, border: "1.5px solid #E8E6DC",
  fontSize: 13.5, outline: "none", width: "100%", boxSizing: "border-box",
  fontFamily: "inherit", background: "#FAFAF8",
};
const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 700, color: "#6B6B6B", marginBottom: 4 };
const btnAmber: React.CSSProperties = { padding: "9px 18px", borderRadius: 999, border: 0, background: "#FFCE00", color: "#221D23", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" };
const btnGhost: React.CSSProperties = { padding: "9px 18px", borderRadius: 999, border: "1.5px solid #E8E6DC", background: "white", color: "#6B6B6B", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" };

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const RECENT_DAYS = 14;

function parseNewsItem(content: string): { title: string; description: string } {
  const cleaned = content.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, "").trim();
  const idx = cleaned.indexOf(": ");
  return idx > 0
    ? { title: cleaned.slice(0, idx).trim(), description: cleaned.slice(idx + 2).trim() }
    : { title: cleaned, description: "" };
}

function isRecent(createdAt: string): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RECENT_DAYS);
  return new Date(createdAt) >= cutoff;
}

// ── Recipient picker ─────────────────────────────────────────────────────────

function RecipientPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);

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

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  }

  function selectAllFiltered() {
    const ids = new Set(selected);
    users.forEach(u => ids.add(u.id));
    onChange(Array.from(ids));
  }

  function clearFiltered() {
    const filteredIds = new Set(users.map(u => u.id));
    onChange(selected.filter(id => !filteredIds.has(id)));
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, flex: "1 1 200px" }} />
        <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} style={{ ...inp, width: "auto" }}>
          <option value="">All companies</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ ...inp, width: "auto" }}>
          <option value="all">All roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
          <option value="superadmin">Superadmins</option>
        </select>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "#6B6B6B", fontWeight: 700 }}>{selected.length} selected</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={selectAllFiltered} style={{ ...btnGhost, padding: "5px 12px", fontSize: 11.5 }}>Select all filtered</button>
          <button type="button" onClick={clearFiltered} style={{ ...btnGhost, padding: "5px 12px", fontSize: 11.5 }}>Clear filtered</button>
        </div>
      </div>

      <div style={{ maxHeight: 260, overflowY: "auto", border: "1.5px solid #E8E6DC", borderRadius: 10, background: "#FAFAF8" }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: "#B0ABA5", fontSize: 13 }}>Loading…</div>
        ) : users.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "#B0ABA5", fontSize: 13 }}>No users match</div>
        ) : (
          users.map(u => (
            <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: "1px solid #F0EEE8", cursor: "pointer" }}>
              <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#221D23" }}>{u.full_name ?? u.email}</div>
                <div style={{ fontSize: 11, color: "#9A9590" }}>{u.email} {u.company_name ? `· ${u.company_name}` : ""}</div>
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

// ── Newsletter tab ─────────────────────────────────────────────────────────

function NewsletterTab({ briefs, workflows }: { briefs: Brief[]; workflows: Workflow[] }) {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [briefId, setBriefId] = useState(briefs.find(b => b.is_active)?.id ?? briefs[0]?.id ?? "");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [workflowSearch, setWorkflowSearch] = useState("");
  const [selectedWorkflowIds, setSelectedWorkflowIds] = useState<string[]>([]);
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [sendDate, setSendDate] = useState("");
  const [sendTime, setSendTime] = useState("09:00");
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const activeBrief = briefs.find(b => b.id === briefId) ?? null;
  const filteredWorkflows = useMemo(
    () => workflows.filter(w => w.title.toLowerCase().includes(workflowSearch.toLowerCase())),
    [workflows, workflowSearch],
  );

  const resolvedNewsItems = useMemo(() => {
    if (!activeBrief) return [];
    return activeBrief.fluency_brief_items
      .filter(item => selectedItemIds.includes(item.id))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(item => parseNewsItem(item.content));
  }, [activeBrief, selectedItemIds]);

  const resolvedWorkflowItems = useMemo(() => {
    return workflows
      .filter(w => selectedWorkflowIds.includes(w.id))
      .map(w => ({ title: w.title, description: w.description ?? "" }));
  }, [workflows, selectedWorkflowIds]);

  const fetchNewsletters = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/superadmin/newsletters");
    if (res.ok) setNewsletters((await res.json()).newsletters);
    setLoading(false);
  }, []);

  useEffect(() => { fetchNewsletters(); }, [fetchNewsletters]);

  function toggleItem(id: string) {
    setSelectedItemIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }
  function toggleWorkflow(id: string) {
    setSelectedWorkflowIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function resetForm() {
    setTitle(""); setSubject(""); setSelectedItemIds([]); setSelectedWorkflowIds([]); setRecipientIds([]);
    setSendDate(""); setSendTime("09:00"); setShowForm(false);
  }

  async function handleSave(sendNow: boolean) {
    setSaving(true);
    const now = new Date();
    const fallbackDate = sendDate || now.toISOString().split("T")[0];
    const fallbackTime = sendTime || now.toTimeString().slice(0, 5);

    const res = await fetch("/api/superadmin/newsletters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, subject, brief_id: briefId || null, item_ids: selectedItemIds, workflow_ids: selectedWorkflowIds,
        recipient_ids: recipientIds, send_date: fallbackDate, send_time: fallbackTime,
      }),
    });

    if (!res.ok) {
      alert((await res.json()).error ?? "Failed to save newsletter");
      setSaving(false);
      return;
    }

    if (sendNow) {
      const { newsletter } = await res.json();
      const sendRes = await fetch(`/api/superadmin/newsletters/${newsletter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_now" }),
      });
      const sendData = await sendRes.json();
      alert(sendRes.ok ? `Sent: ${sendData.sent}, Failed: ${sendData.failed}` : (sendData.error ?? "Newsletter created but sending failed"));
    }

    resetForm();
    fetchNewsletters();
    setSaving(false);
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this scheduled newsletter?")) return;
    const res = await fetch(`/api/superadmin/newsletters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    if (res.ok) fetchNewsletters();
    else alert((await res.json()).error ?? "Failed to cancel");
  }

  async function handleSendNow(id: string) {
    if (!confirm("Send this newsletter now, ahead of its scheduled date?")) return;
    const res = await fetch(`/api/superadmin/newsletters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_now" }),
    });
    const data = await res.json();
    if (res.ok) {
      alert(`Sent: ${data.sent}, Failed: ${data.failed}`);
      fetchNewsletters();
    } else {
      alert(data.error ?? "Failed to send");
    }
  }

  async function handlePreview() {
    if (resolvedNewsItems.length === 0 && resolvedWorkflowItems.length === 0) {
      alert("Select at least one news item or workflow to preview");
      return;
    }
    setPreviewLoading(true);
    const res = await fetch("/api/superadmin/email-management/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, newsItems: resolvedNewsItems, workflowItems: resolvedWorkflowItems }),
    });
    if (res.ok) {
      setPreviewHtml((await res.json()).html);
    } else {
      alert((await res.json()).error ?? "Failed to build preview");
    }
    setPreviewLoading(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={() => setShowForm(v => !v)} style={btnAmber}>{showForm ? "Close" : "+ New Newsletter"}</button>
      </div>

      {showForm && (
        <div style={{ ...card, padding: 20, marginBottom: 18, borderColor: "#FFCE00" }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>New Newsletter</div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Title (shown as the heading inside the email)</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="This week in AI" style={inp} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="3 new workflows worth trying" style={inp} />
            <p style={{ fontSize: 11.5, color: "#9A9590", margin: "6px 0 0" }}>
              Email subject line becomes: <strong>Hi {"{name}"} — {subject || "3 new workflows worth trying"}</strong>
            </p>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>News brief</label>
            <select value={briefId} onChange={e => { setBriefId(e.target.value); setSelectedItemIds([]); }} style={inp}>
              <option value="">— None —</option>
              {briefs.map(b => (
                <option key={b.id} value={b.id}>{b.title} ({b.published_date}){b.is_active ? " · active" : ""}</option>
              ))}
            </select>
            {activeBrief && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {[...activeBrief.fluency_brief_items].sort((a, b) => a.sort_order - b.sort_order).map(item => (
                  <label key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", border: "1.5px solid #E8E6DC", borderRadius: 10, cursor: "pointer", background: "#FAFAF8" }}>
                    <input type="checkbox" checked={selectedItemIds.includes(item.id)} onChange={() => toggleItem(item.id)} style={{ marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: "#221D23" }}>{parseNewsItem(item.content).title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Workflows to include</label>
            <input placeholder="Search workflows…" value={workflowSearch} onChange={e => setWorkflowSearch(e.target.value)} style={{ ...inp, marginBottom: 8 }} />
            <div style={{ maxHeight: 200, overflowY: "auto", border: "1.5px solid #E8E6DC", borderRadius: 10, background: "#FAFAF8" }}>
              {filteredWorkflows.map(w => (
                <label key={w.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderBottom: "1px solid #F0EEE8", cursor: "pointer" }}>
                  <input type="checkbox" checked={selectedWorkflowIds.includes(w.id)} onChange={() => toggleWorkflow(w.id)} />
                  <span style={{ fontSize: 13, color: "#221D23", flex: 1 }}>{w.title}</span>
                  {isRecent(w.created_at) && (
                    <span style={{ fontSize: 9.5, fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: "#FFF6CF", color: "#7A5F00" }}>NEW</span>
                  )}
                </label>
              ))}
              {filteredWorkflows.length === 0 && (
                <div style={{ padding: 16, textAlign: "center", color: "#B0ABA5", fontSize: 13 }}>No workflows match</div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Recipients</label>
            <RecipientPicker selected={recipientIds} onChange={setRecipientIds} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div>
              <label style={lbl}>Send date</label>
              <input type="date" value={sendDate} onChange={e => setSendDate(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Send time (IST)</label>
              <input type="time" value={sendTime} onChange={e => setSendTime(e.target.value)} style={inp} />
            </div>
          </div>
          <p style={{ fontSize: 11.5, color: "#9A9590", marginTop: -10, marginBottom: 14 }}>
            The daily cron only runs once a day (5:00 PM IST) — this time is stored for reference, but the send date is checked in IST and the send itself happens whenever that day's cron executes.
            Leave blank and use <strong>Send Now</strong> below to skip scheduling entirely.
          </p>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handlePreview} disabled={previewLoading} style={{ ...btnGhost, opacity: previewLoading ? .6 : 1, borderColor: "rgba(54,150,252,.4)", color: "#1A7FD4" }}>{previewLoading ? "Loading…" : "Preview"}</button>
            <button onClick={() => handleSave(false)} disabled={saving} style={{ ...btnAmber, opacity: saving ? .6 : 1 }}>{saving ? "Saving…" : "Schedule Newsletter"}</button>
            <button onClick={() => handleSave(true)} disabled={saving} style={{ ...btnGhost, opacity: saving ? .6 : 1, borderColor: "rgba(35,206,104,.4)", color: "#17A855" }}>{saving ? "Sending…" : "Send Now"}</button>
            <button onClick={resetForm} style={btnGhost}>Cancel</button>
          </div>
        </div>
      )}

      {previewHtml !== null && (
        <div
          onClick={() => setPreviewHtml(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: "min(680px, 100%)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #E8E6DC" }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Email Preview</div>
              <button onClick={() => setPreviewHtml(null)} style={{ border: 0, background: "none", cursor: "pointer", fontSize: 20, lineHeight: 1, color: "#6B6B6B" }}>×</button>
            </div>
            <p style={{ margin: 0, padding: "8px 20px", fontSize: 11.5, color: "#9A9590", background: "#FAFAF8", borderBottom: "1px solid #E8E6DC" }}>
              This is how the email content renders. Actual appearance can still vary slightly by mail client (Gmail, Outlook, Apple Mail, etc).
            </p>
            <iframe title="Newsletter preview" srcDoc={previewHtml} style={{ flex: 1, border: 0, width: "100%", minHeight: 500 }} />
          </div>
        </div>
      )}

      <div style={{ ...card, padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#B0ABA5" }}>Loading…</div>
        ) : newsletters.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#B0ABA5" }}>No newsletters yet</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAF8", borderBottom: "1px solid #E8E6DC" }}>
                {["Title", "Subject", "Recipients", "Send Date", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9A9590", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {newsletters.map(n => (
                <tr key={n.id} style={{ borderBottom: "1px solid #F0EEE8" }}>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700 }}>{n.title}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#6B6B6B" }}>{n.subject}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}>{n.recipient_ids.length}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}>{n.send_date} {n.send_time}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <StatusBadge status={n.status} />
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    {n.status === "scheduled" && (
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={() => handleSendNow(n.id)} style={{ ...btnGhost, padding: "5px 12px", fontSize: 11.5, color: "#17A855", borderColor: "rgba(35,206,104,.3)" }}>Send Now</button>
                        <button onClick={() => handleCancel(n.id)} style={{ ...btnGhost, padding: "5px 12px", fontSize: 11.5, color: "#EF4444", borderColor: "rgba(239,68,68,.3)" }}>Cancel</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Workflow Reminders tab ───────────────────────────────────────────────────

function WorkflowRemindersTab() {
  const [schedules, setSchedules] = useState<ReminderSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [sendTime, setSendTime] = useState("09:00");
  const [startDate, setStartDate] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [saving, setSaving] = useState(false);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/superadmin/workflow-reminders");
    if (res.ok) setSchedules((await res.json()).schedules);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  function resetForm() {
    setName(""); setRecipientIds([]); setDayOfWeek(1); setSendTime("09:00");
    setStartDate(""); setDurationWeeks(4); setShowForm(false);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/superadmin/workflow-reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, recipient_ids: recipientIds, day_of_week: dayOfWeek,
        send_time: sendTime, start_date: startDate, duration_weeks: durationWeeks,
      }),
    });
    if (res.ok) {
      resetForm();
      fetchSchedules();
    } else {
      alert((await res.json()).error ?? "Failed to save schedule");
    }
    setSaving(false);
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this reminder schedule?")) return;
    const res = await fetch(`/api/superadmin/workflow-reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    if (res.ok) fetchSchedules();
    else alert((await res.json()).error ?? "Failed to cancel");
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={() => setShowForm(v => !v)} style={btnAmber}>{showForm ? "Close" : "+ New Schedule"}</button>
      </div>

      {showForm && (
        <div style={{ ...card, padding: 20, marginBottom: 18, borderColor: "#FFCE00" }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>New Reminder Schedule</div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Weekly Monday reminder" style={inp} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Recipients</label>
            <RecipientPicker selected={recipientIds} onChange={setRecipientIds} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Day of week (IST)</label>
              <select value={dayOfWeek} onChange={e => setDayOfWeek(Number(e.target.value))} style={inp}>
                {DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Send time (IST)</label>
              <input type="time" value={sendTime} onChange={e => setSendTime(e.target.value)} style={inp} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 6 }}>
            <div>
              <label style={lbl}>Start date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Duration (weeks)</label>
              <input type="number" min={1} value={durationWeeks} onChange={e => setDurationWeeks(Number(e.target.value))} style={inp} />
            </div>
          </div>
          <p style={{ fontSize: 11.5, color: "#9A9590", marginTop: 4, marginBottom: 14 }}>
            Sends once a week on the chosen day (checked in IST) for {durationWeeks} week{durationWeeks === 1 ? "" : "s"}, then stops automatically.
            The daily cron only runs once a day (5:00 PM IST), so send time is stored for reference only.
          </p>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={saving} style={{ ...btnAmber, opacity: saving ? .6 : 1 }}>{saving ? "Saving…" : "Create Schedule"}</button>
            <button onClick={resetForm} style={btnGhost}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ ...card, padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#B0ABA5" }}>Loading…</div>
        ) : schedules.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#B0ABA5" }}>No reminder schedules yet</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAF8", borderBottom: "1px solid #E8E6DC" }}>
                {["Name", "Day / Time", "Progress", "Recipients", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9A9590", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedules.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid #F0EEE8" }}>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700 }}>{s.name}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}>{DAY_LABELS[s.day_of_week]} · {s.send_time}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}>{s.sends_completed} / {s.duration_weeks} weeks</td>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}>{s.recipient_ids.length}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <StatusBadge status={s.status} />
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    {s.status === "active" && (
                      <button onClick={() => handleCancel(s.id)} style={{ ...btnGhost, padding: "5px 12px", fontSize: 11.5, color: "#EF4444", borderColor: "rgba(239,68,68,.3)" }}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Shared bits ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    scheduled: { bg: "rgba(54,150,252,.1)", color: "#1A7FD4" },
    active: { bg: "rgba(35,206,104,.1)", color: "#17A855" },
    sent: { bg: "rgba(35,206,104,.1)", color: "#17A855" },
    completed: { bg: "rgba(35,206,104,.1)", color: "#17A855" },
    cancelled: { bg: "#F0EEE8", color: "#6B6B6B" },
  };
  const c = colors[status] ?? colors.cancelled;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: c.bg, color: c.color, textTransform: "capitalize" }}>
      {status}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function EmailManagementClient({ briefs, workflows }: Props) {
  const [tab, setTab] = useState<"newsletter" | "reminders">("newsletter");
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);

  async function handleRunNow() {
    setRunning(true);
    setRunResult(null);
    const res = await fetch("/api/superadmin/email-management/run-now", { method: "POST" });
    const data = await res.json();
    setRunResult(res.ok ? data : { error: data.error ?? "Failed" });
    setRunning(false);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: "-.04em" }}>Email Management</h1>
          <p style={{ margin: "3px 0 0", color: "#6B6B6B", fontSize: 13 }}>Newsletters and workflow reminders, sent by the daily cron</p>
        </div>
        <button onClick={handleRunNow} disabled={running} style={{ ...btnGhost, opacity: running ? .6 : 1 }} title="Process anything due today, right now">
          {running ? "Running…" : "▶ Run now"}
        </button>
      </div>

      {runResult && (
        <div style={{ ...card, padding: 14, marginBottom: 16, background: runResult.error ? "#FDE9EB" : "#E8FBEE", borderColor: runResult.error ? "rgba(239,68,68,.3)" : "rgba(35,206,104,.3)" }}>
          {runResult.error ? (
            <span style={{ fontSize: 13, color: "#991B1B", fontWeight: 700 }}>{runResult.error}</span>
          ) : (
            <span style={{ fontSize: 13, color: "#166534", fontWeight: 700 }}>
              Newsletters: {runResult.newsletters.processed} processed, {runResult.newsletters.sent} sent, {runResult.newsletters.failed} failed ·
              {" "}Reminders: {runResult.reminders.processed} processed, {runResult.reminders.sent} sent, {runResult.reminders.failed} failed
            </span>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {([["newsletter", "Newsletter"], ["reminders", "Workflow Reminders"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "9px 18px", borderRadius: 999, border: "1.5px solid",
            borderColor: tab === id ? "#221D23" : "#E8E6DC",
            background: tab === id ? "#221D23" : "white",
            color: tab === id ? "white" : "#6B6B6B",
            fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
          }}>{label}</button>
        ))}
      </div>

      {tab === "newsletter" ? <NewsletterTab briefs={briefs} workflows={workflows} /> : <WorkflowRemindersTab />}
    </div>
  );
}
