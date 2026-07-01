"use client";
import { Fragment, useState } from "react";
import Link from "next/link";
import { AI_UPDATES_PAGE_NAME } from "@/lib/site";
import { createClient } from "@/lib/supabase/client";

import ToolDeepDivesManager from "@/components/ToolDeepDivesManager";
import type { Profile, Company, Activity, ActivityTag, ToolDeepDive } from "@/lib/supabase/types";
import { DEFAULT_TOOLS, formatToolLabel, normalizeActivityTools } from "@/lib/tools";

type ActivityContentSummary = {
  id: string;
  video_url?: string | null;
  slide_images?: { url: string; caption?: string }[] | null;
};

type ActivityRow = Activity & {
  activity_content: ActivityContentSummary | null;
  activity_steps?: { count: number }[];
};

function stepCount(act: ActivityRow): number {
  return act.activity_steps?.[0]?.count ?? 0;
}

function slideCount(act: ActivityRow): number {
  const slides = act.activity_content?.slide_images;
  return Array.isArray(slides) ? slides.length : 0;
}

function hasVideo(act: ActivityRow): boolean {
  return Boolean(act.activity_content?.video_url?.trim());
}

function hasThumbnail(act: ActivityRow): boolean {
  return Boolean(act.thumbnail_url?.trim());
}

type Props = {
  companies: Pick<Company, "id" | "name" | "domain">[];
  activities: ActivityRow[];
  allAssignments: { activity_id: string; company_id: string }[];
  tags: Pick<ActivityTag, "id" | "name" | "icon_url">[];
  availableTools: string[];
  deepDives: ToolDeepDive[];
};

const CATEGORIES = ["chat", "build", "automate"];

export default function SuperadminClient({ companies, activities: initActivities, allAssignments: initAssignments, tags: initTags, availableTools, deepDives }: Props) {
  const [activities,   setActivities]   = useState(initActivities);
  const [assignments,  setAssignments]  = useState(initAssignments);
  const [tags,         setTags]         = useState(initTags);
  const [showForm,     setShowForm]     = useState(false);
  const supabase = createClient();

  // Create form state
  const [title,    setTitle]    = useState("");
  const [desc,     setDesc]     = useState("");
  const [level,    setLevel]    = useState<Activity["level"]>("Beginner");
  const [time,     setTime]     = useState(15);
  const [points,   setPoints]   = useState(50);
  const [tool,     setTool]     = useState<string>(availableTools[0] ?? DEFAULT_TOOLS[0]);
  const [category, setCategory] = useState("chat");
  const [creating, setCreating] = useState(false);

  async function createActivity(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const nextPosition = activities.reduce((max, a) => Math.max(max, a.position), -1) + 1;
    const { data, error } = await supabase.from("activities").insert({
      title, description: desc, level, time_estimate_minutes: time,
      points, tools: [tool], category, published: false, position: nextPosition,
    }).select().single();
    if (!error && data) {
      setActivities(prev => [...prev, { ...(data as ActivityRow), activity_content: null, activity_steps: [{ count: 0 }] }]);
      setTitle(""); setDesc(""); setShowForm(false);
    }
    setCreating(false);
  }

  async function moveActivity(actId: string, direction: "up" | "down") {
    const act = activities.find(a => a.id === actId);
    if (!act) return;

    const group = [...activities].sort((a, b) => a.position - b.position);

    const idx = group.findIndex(a => a.id === actId);
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= group.length) return;

    // Move item to new index then assign clean sequential positions 0,1,2…
    const reordered = [...group];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(newIdx, 0, moved);

    // Only update rows whose position actually changed
    const updates = reordered
      .map((a, i) => ({ id: a.id, position: i }))
      .filter((u, i) => group[i].id !== u.id || group[i].position !== u.position);

    await Promise.all(
      updates.map(u => supabase.from("activities").update({ position: u.position }).eq("id", u.id))
    );

    // Reflect new positions in local state
    const posMap: Record<string, number> = {};
    reordered.forEach((a, i) => { posMap[a.id] = i; });
    setActivities(prev => prev.map(a =>
      posMap[a.id] !== undefined ? { ...a, position: posMap[a.id] } : a
    ));
  }

  async function togglePublish(act: ActivityRow) {
    await supabase.from("activities").update({ published: !act.published }).eq("id", act.id);
    setActivities(prev => prev.map(a => a.id === act.id ? { ...a, published: !a.published } : a));
  }

  async function toggleFeatured(act: ActivityRow) {
    await supabase.from("activities").update({ is_featured: !act.is_featured }).eq("id", act.id);
    setActivities(prev => prev.map(a => a.id === act.id ? { ...a, is_featured: !a.is_featured } : a));
  }

  async function toggleLock(act: ActivityRow) {
    await supabase.from("activities").update({ is_locked: !act.is_locked }).eq("id", act.id);
    setActivities(prev => prev.map(a => a.id === act.id ? { ...a, is_locked: !a.is_locked } : a));
  }

  async function toggleMastery(act: ActivityRow) {
    await supabase.from("activities").update({ is_mastery: !act.is_mastery }).eq("id", act.id);
    setActivities(prev => prev.map(a => a.id === act.id ? { ...a, is_mastery: !a.is_mastery } : a));
  }

  async function setHeroSlot(act: ActivityRow, slot: number | null) {
    // If assigning a slot, clear it from whichever activity currently holds it
    if (slot !== null) {
      const current = activities.find(a => a.hero_position === slot && a.id !== act.id);
      if (current) {
        await supabase.from("activities").update({ hero_position: null }).eq("id", current.id);
        setActivities(prev => prev.map(a => a.id === current.id ? { ...a, hero_position: null } : a));
      }
    }
    await supabase.from("activities").update({ hero_position: slot }).eq("id", act.id);
    setActivities(prev => prev.map(a => a.id === act.id ? { ...a, hero_position: slot } : a));
  }

  async function deleteActivity(id: string) {
    if (!confirm("Delete this activity?")) return;
    await supabase.from("activities").delete().eq("id", id);
    setActivities(prev => prev.filter(a => a.id !== id));
  }

  async function deleteTag(id: string, name: string) {
    if (!confirm(`Delete tag "${name}"? It will be removed from all activities.`)) return;
    await supabase.from("activity_tags").delete().eq("id", id);
    setTags(prev => prev.filter(t => t.id !== id));
  }

  async function toggleAssignment(activityId: string, companyId: string) {
    const exists = assignments.some(a => a.activity_id === activityId && a.company_id === companyId);
    if (exists) {
      const { error } = await supabase
        .from("activity_companies")
        .delete()
        .eq("activity_id", activityId)
        .eq("company_id", companyId);
      if (error) { alert(`Failed to remove assignment: ${error.message}`); return; }
      setAssignments(prev => prev.filter(a => !(a.activity_id === activityId && a.company_id === companyId)));
    } else {
      const { error } = await supabase
        .from("activity_companies")
        .insert({ activity_id: activityId, company_id: companyId });
      if (error) { alert(`Failed to add assignment: ${error.message}`); return; }
      setAssignments(prev => [...prev, { activity_id: activityId, company_id: companyId }]);
    }
  }

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const catColor = (cat: string) => ({
    chat:     { bg: "rgba(98,60,234,.08)",  color: "#5030C0" },
    build:    { bg: "rgba(35,206,104,.08)", color: "#17A855" },
    automate: { bg: "rgba(246,138,41,.08)", color: "#B05000" },
  }[cat] ?? { bg: "#F0EEE8", color: "#6B6B6B" });

  return (
    <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: "-.04em" }}>Activities</h1>
            <p style={{ margin: "3px 0 0", color: "#6B6B6B", fontSize: 13 }}>{activities.length} total · create, edit content, assign to companies</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={() => setShowForm(v => !v)} style={btnAmber}>+ New Activity</button>
          </div>
        </div>

        {/* Create form */}
        {showForm && (
          <div style={{ ...card, marginBottom: 18, borderColor: "#FFCE00" }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>New Activity</div>
            <form onSubmit={createActivity} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Activity title" style={inp} />
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Short description shown on the dashboard card" style={{ ...inp, resize: "vertical" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={lbl}>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} style={inp}>
                    <option value="chat">✦ Chatbot</option>
                    <option value="build">🛠 Vibe Coding</option>
                    <option value="automate">⚡ Automation</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Level</label>
                  <select value={level ?? "Beginner"} onChange={e => setLevel(e.target.value as any)} style={inp}>
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Time (min)</label>
                  <input type="number" value={time} onChange={e => setTime(+e.target.value)} style={inp} min={1} />
                </div>
                <div>
                  <label style={lbl}>Points</label>
                  <input type="number" value={points} onChange={e => setPoints(+e.target.value)} style={inp} min={0} />
                </div>
              </div>
              <div>
                <label style={lbl}>Tool</label>
                <select value={tool} onChange={e => setTool(e.target.value)} style={inp}>
                  {availableTools.map(t => <option key={t} value={t}>{formatToolLabel(t)}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" disabled={creating} style={btnAmber}>{creating ? "Creating…" : "Create Activity"}</button>
                <button type="button" onClick={() => setShowForm(false)} style={btnGhost}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Activity list — flat, sorted by position */}
        {activities.length === 0 ? (
          <div style={{ ...card, textAlign: "center", color: "#B0ABA5", padding: 48 }}>
            No activities yet. Create your first one above.
          </div>
        ) : (
          <div style={{ ...card, padding: 0 }}>
            <div style={{ maxHeight: "calc(100vh - 200px)", overflow: "auto" }}>
              <table style={activityTableStyle}>
                <colgroup>
                  <col style={{ width: 40 }} />
                  <col style={{ width: 36 }} />
                  <col style={{ width: 88 }} />
                  <col style={{ width: 300 }} />
                  <col style={{ width: 68 }} />
                  <col style={{ width: 68 }} />
                  <col style={{ width: 68 }} />
                  <col style={{ width: 68 }} />
                  <col style={{ width: 160 }} />
                  <col style={{ width: 160 }} />
                  <col style={{ width: 500 }} />
                  <col style={{ width: 28 }} />
                </colgroup>
                <thead>
                  <tr>
                    {["", "#", "Cat.", "Activity", "Video", "Thumb", "Slides", "Steps", "Functions", "Tools", "Actions", ""].map((label, i) => (
                      <th key={label || `col-${i}`} style={{
                        ...activityThStyle,
                        textAlign: i >= 4 && i <= 7 ? "center" : "left",
                      }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
              {[...activities].sort((a, b) => a.position - b.position).map((act, idx, sorted) => {
                const expanded = expandedId === act.id;
                const actAssignments = assignments.filter(a => a.activity_id === act.id);
                const actTools = normalizeActivityTools(act.tools);
                const actFunctions = act.functions ?? [];
                const cc = catColor(act.category);
                const video = hasVideo(act);
                const thumb = hasThumbnail(act);
                const slides = slideCount(act);
                const steps = stepCount(act);
                return (
                  <Fragment key={act.id}>
                    <tr
                      style={{
                        cursor: "pointer",
                        background: expanded ? "#FFFCF0" : "white",
                        borderBottom: expanded ? "none" : "1px solid #F0EEE8",
                      }}
                      onClick={() => setExpandedId(expanded ? null : act.id)}
                    >
                      <td style={activityTdStyle} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <button onClick={() => moveActivity(act.id, "up")} disabled={idx === 0} style={{ ...posBtnStyle, opacity: idx === 0 ? .3 : 1 }} title="Move up">▲</button>
                          <button onClick={() => moveActivity(act.id, "down")} disabled={idx === sorted.length - 1} style={{ ...posBtnStyle, opacity: idx === sorted.length - 1 ? .3 : 1 }} title="Move down">▼</button>
                        </div>
                      </td>

                      <td style={{ ...activityTdStyle, fontSize: 11, fontWeight: 900, color: "#9A9590" }}>{idx + 1}</td>

                      <td style={activityTdStyle}>
                        <span style={{ display: "block", padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: cc.bg, color: cc.color, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={act.category}>{act.category}</span>
                      </td>

                      <td style={activityTdStyle}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={act.title}>{act.title}</div>
                        <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {act.level} · {act.time_estimate_minutes}m · {act.points}pts
                          {actAssignments.length > 0 && (
                            <span style={{ marginLeft: 6, color: "#3696FC" }}>· {actAssignments.length} co.</span>
                          )}
                        </div>
                      </td>

                      <td style={{ ...activityTdStyle, textAlign: "center" }}>
                        <ContentBadge ok={video} label="Video" detail={video ? "Yes" : "—"} />
                      </td>
                      <td style={{ ...activityTdStyle, textAlign: "center" }}>
                        <ContentBadge ok={thumb} label="Thumbnail" detail={thumb ? "Yes" : "—"} />
                      </td>
                      <td style={{ ...activityTdStyle, textAlign: "center" }}>
                        <ContentBadge ok={slides > 0} label="Slides" detail={slides > 0 ? String(slides) : "—"} />
                      </td>
                      <td style={{ ...activityTdStyle, textAlign: "center" }}>
                        <ContentBadge ok={steps > 0} label="Steps" detail={steps > 0 ? String(steps) : "—"} />
                      </td>

                      <td style={{ ...activityTdStyle, verticalAlign: "top" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {actFunctions.length > 0 ? actFunctions.map(fn => (
                            <span key={fn} style={chipStyle} title={fn}>{fn}</span>
                          )) : (
                            <span style={{ fontSize: 11, color: "#C4BFB8", fontStyle: "italic" }}>None</span>
                          )}
                        </div>
                      </td>

                      <td style={{ ...activityTdStyle, verticalAlign: "top" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {actTools.length > 0 ? actTools.map(t => (
                            <span key={t} style={{ ...chipStyle, background: "rgba(54,150,252,.08)", color: "#1A6FC4" }} title={formatToolLabel(t)}>{formatToolLabel(t)}</span>
                          )) : (
                            <span style={{ fontSize: 11, color: "#C4BFB8", fontStyle: "italic" }}>None</span>
                          )}
                        </div>
                      </td>

                      <td style={activityTdStyle} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button onClick={() => toggleLock(act)} title={act.is_locked ? "Unlock (guests can open)" : "Lock (guests blocked)"} style={{
                          padding: "4px 8px", borderRadius: 999, border: "1px solid",
                          borderColor: act.is_locked ? "rgba(239,68,68,.3)" : "#E8E6DC",
                          background: act.is_locked ? "rgba(239,68,68,.08)" : "#F0EEE8",
                          color: act.is_locked ? "#DC2626" : "#6B6B6B",
                          fontSize: 10.5, fontWeight: 700, cursor: "pointer",
                        }}>{act.is_locked ? "🔒 Locked" : "🔓 Open"}</button>

                        <button onClick={() => toggleFeatured(act)} title="Show in 'New this week'" style={{
                          padding: "4px 8px", borderRadius: 999, border: "1px solid",
                          borderColor: act.is_featured ? "rgba(255,206,0,.5)" : "#E8E6DC",
                          background: act.is_featured ? "#FFF6CF" : "#F0EEE8",
                          color: act.is_featured ? "#7A5F00" : "#6B6B6B",
                          fontSize: 10.5, fontWeight: 700, cursor: "pointer",
                        }}>★ {act.is_featured ? "New" : "+"}</button>

                        <button onClick={() => toggleMastery(act)} title="Show in 'AI Tools Mastery'" style={{
                          padding: "4px 8px", borderRadius: 999, border: "1px solid",
                          borderColor: act.is_mastery ? "rgba(98,60,234,.35)" : "#E8E6DC",
                          background: act.is_mastery ? "rgba(98,60,234,.08)" : "#F0EEE8",
                          color: act.is_mastery ? "#623CEA" : "#6B6B6B",
                          fontSize: 10.5, fontWeight: 700, cursor: "pointer",
                        }}>⚡ {act.is_mastery ? "Mastery" : "+"}</button>

                        <select
                          value={act.hero_position ?? ""}
                          onChange={e => void setHeroSlot(act, e.target.value ? Number(e.target.value) : null)}
                          title="Pin to hero banner slot (top 3 cards)"
                          style={{
                            padding: "4px 8px", borderRadius: 999, border: "1px solid",
                            borderColor: act.hero_position ? "rgba(54,150,252,.4)" : "#E8E6DC",
                            background: act.hero_position ? "rgba(54,150,252,.08)" : "#F0EEE8",
                            color: act.hero_position ? "#1A6FC4" : "#6B6B6B",
                            fontSize: 10.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                            appearance: "none", WebkitAppearance: "none",
                          }}
                        >
                          <option value="">🎯 Hero</option>
                          <option value="1">Slot 1</option>
                          <option value="2">Slot 2</option>
                          <option value="3">Slot 3</option>
                        </select>

                        <button onClick={() => togglePublish(act)} style={{
                          padding: "4px 8px", borderRadius: 999, border: "1px solid",
                          borderColor: act.published ? "rgba(35,206,104,.3)" : "#E8E6DC",
                          background: act.published ? "rgba(35,206,104,.08)" : "#F0EEE8",
                          color: act.published ? "#17A855" : "#6B6B6B",
                          fontSize: 10.5, fontWeight: 700, cursor: "pointer",
                        }}>{act.published ? "Live" : "Draft"}</button>

                        <Link href={`/superadmin/activity/${act.id}`} style={{
                          padding: "4px 8px", borderRadius: 999, border: "1px solid #E8E6DC",
                          background: "white", color: "#221D23", fontSize: 10.5, fontWeight: 700,
                          textDecoration: "none",
                        }}>Edit</Link>

                        <button onClick={() => deleteActivity(act.id)} style={{
                          border: 0, background: "none", color: "#EF4444", cursor: "pointer", fontSize: 15, lineHeight: 1, padding: "2px 4px",
                        }}>×</button>
                        </div>
                      </td>

                      <td style={{ ...activityTdStyle, textAlign: "center" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B0ABA5" strokeWidth="2.5"
                          strokeLinecap="round" strokeLinejoin="round"
                          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: ".15s", display: "inline-block" }}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </td>
                    </tr>

                    {expanded && (
                      <tr style={{ background: "#FFFCF0", borderBottom: "1px solid #F0EEE8" }}>
                        <td colSpan={12} style={{ padding: "0 16px 14px", borderTop: "1px solid #F0EEE8" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6B6B", margin: "10px 0 7px" }}>
                            Assign to companies
                            {actAssignments.length === 0 && <span style={{ fontWeight: 400, marginLeft: 6 }}>· no assignments = visible to everyone</span>}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                            {companies.map(co => {
                              const assigned = assignments.some(a => a.activity_id === act.id && a.company_id === co.id);
                              return (
                                <button key={co.id} onClick={() => toggleAssignment(act.id, co.id)} style={{
                                  display: "flex", alignItems: "center", gap: 7,
                                  padding: "6px 12px", borderRadius: 999, cursor: "pointer",
                                  border: "1.5px solid",
                                  borderColor: assigned ? "#FFCE00" : "#E8E6DC",
                                  background: assigned ? "#FFF6CF" : "white",
                                  fontWeight: 700, fontSize: 12, transition: ".12s",
                                }}>
                                  <span style={{ width: 14, height: 14, borderRadius: "50%", background: assigned ? "#FFCE00" : "#F0EEE8", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 900, color: assigned ? "#221D23" : "transparent" }}>✓</span>
                                  {co.name}
                                  {co.domain && <span style={{ fontSize: 10, color: "#B0ABA5", fontWeight: 400 }}>{co.domain}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <ToolDeepDivesManager initialItems={deepDives} availableTools={availableTools} />
    </div>
  );
}

const ACTIVITY_TABLE_MIN_WIDTH = 1636;

const activityTableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: ACTIVITY_TABLE_MIN_WIDTH,
  tableLayout: "fixed",
  borderCollapse: "collapse",
  fontFamily: "inherit",
};

const activityThStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 2,
  padding: "10px 8px",
  background: "#FAFAF8",
  borderBottom: "1px solid #E8E6DC",
  boxShadow: "0 2px 6px rgba(34,29,35,.06)",
  fontSize: 10.5,
  fontWeight: 800,
  color: "#9A9590",
  textTransform: "uppercase",
  letterSpacing: ".04em",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

const activityTdStyle: React.CSSProperties = {
  padding: "10px 8px",
  verticalAlign: "middle",
};

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
const btnAmber: React.CSSProperties = { padding: "9px 18px", borderRadius: 999, border: 0, background: "#FFCE00", color: "#221D23", fontWeight: 800, fontSize: 13, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "9px 18px", borderRadius: 999, border: "1.5px solid #E8E6DC", background: "white", color: "#6B6B6B", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const posBtnStyle: React.CSSProperties = { width: 18, height: 14, border: "1px solid #E8E6DC", borderRadius: 4, background: "#F8F8F6", color: "#6B6B6B", fontSize: 8, cursor: "pointer", display: "grid", placeItems: "center", padding: 0 };

const chipStyle: React.CSSProperties = {
  padding: "2px 7px", borderRadius: 999, fontSize: 10, fontWeight: 700,
  background: "rgba(98,60,234,.08)", color: "#5030C0",
  whiteSpace: "normal", wordBreak: "break-word",
};

function ContentBadge({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <span
      title={`${label}: ${ok ? "present" : "missing"}${detail !== "—" && detail !== "Yes" ? ` (${detail})` : ""}`}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        minWidth: 36, padding: "3px 6px", borderRadius: 6, fontSize: 10.5, fontWeight: 800,
        background: ok ? "rgba(35,206,104,.1)" : "rgba(246,138,41,.08)",
        color: ok ? "#17A855" : "#C47A20",
        border: `1px solid ${ok ? "rgba(35,206,104,.25)" : "rgba(246,138,41,.2)"}`,
      }}
    >
      {detail}
    </span>
  );
}
