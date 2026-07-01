"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DEEP_DIVE_PAGES_BUCKET } from "@/lib/deepDives";
import { formatToolLabel, normalizeToolSlug } from "@/lib/tools";
import type { ToolDeepDive, ToolDeepDiveLinkType } from "@/lib/supabase/types";

type Props = {
  initialItems: ToolDeepDive[];
  availableTools: string[];
};

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isHtmlFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".html") || name.endsWith(".htm") || file.type === "text/html";
}

export default function ToolDeepDivesManager({ initialItems, availableTools }: Props) {
  const supabase = createClient();
  const [items, setItems] = useState(() => [...initialItems].sort((a, b) => a.position - b.position));
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tool, setTool] = useState(availableTools[0] ?? "");
  const [linkType, setLinkType] = useState<ToolDeepDiveLinkType>("html");
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function uploadHtml(id: string, file: File): Promise<string | null> {
    if (!isHtmlFile(file)) {
      setMessage("Please choose an .html or .htm file.");
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("HTML file must be 5 MB or smaller.");
      return null;
    }

    const path = `${id}.html`;
    const { error } = await supabase.storage
      .from(DEEP_DIVE_PAGES_BUCKET)
      .upload(path, file, { upsert: true, contentType: "text/html" });

    if (error) {
      setMessage(`Upload failed: ${error.message} — run migration_009_deep_dive_html.sql first`);
      return null;
    }
    return path;
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setMessage("Title is required.");
      return;
    }
    if (linkType === "html" && !htmlFile) {
      setMessage("Choose an HTML file to upload.");
      return;
    }
    const linkUrl = linkType === "external" ? normalizeUrl(url) : null;
    if (linkType === "external" && !linkUrl) {
      setMessage("Enter a valid external URL.");
      return;
    }

    setSaving(true);
    setMessage(null);
    const position = items.reduce((max, item) => Math.max(max, item.position), -1) + 1;

    const { data, error } = await supabase.from("tool_deep_dives").insert({
      title: title.trim(),
      url: linkUrl,
      link_type: linkType,
      html_path: null,
      description: description.trim() || null,
      tool: tool ? normalizeToolSlug(tool) : null,
      position,
      published: true,
    }).select().single();

    if (error || !data) {
      setMessage(`Could not add item: ${error?.message ?? "unknown error"}`);
      setSaving(false);
      return;
    }

    let html_path: string | null = null;
    if (linkType === "html" && htmlFile) {
      html_path = await uploadHtml(data.id, htmlFile);
      if (!html_path) {
        await supabase.from("tool_deep_dives").delete().eq("id", data.id);
        setSaving(false);
        return;
      }
      const { error: updateErr } = await supabase.from("tool_deep_dives")
        .update({ html_path })
        .eq("id", data.id);
      if (updateErr) {
        setMessage(`Saved file but database error: ${updateErr.message}`);
        setSaving(false);
        return;
      }
    }

    setItems(prev => [...prev, { ...(data as ToolDeepDive), html_path }].sort((a, b) => a.position - b.position));
    setTitle("");
    setUrl("");
    setDescription("");
    setHtmlFile(null);
    setSaving(false);
    setMessage(linkType === "html" ? "HTML page added." : "Link added.");
  }

  async function replaceHtml(item: ToolDeepDive, file: File) {
    setUploadingId(item.id);
    setMessage(null);
    const html_path = await uploadHtml(item.id, file);
    if (!html_path) {
      setUploadingId(null);
      return;
    }
    const { error } = await supabase.from("tool_deep_dives")
      .update({ link_type: "html", html_path, url: null })
      .eq("id", item.id);
    if (error) {
      setMessage(error.message);
      setUploadingId(null);
      return;
    }
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, link_type: "html", html_path, url: null } : i));
    setUploadingId(null);
    setMessage(`Updated HTML for "${item.title}".`);
  }

  async function togglePublished(item: ToolDeepDive) {
    const { error } = await supabase.from("tool_deep_dives").update({ published: !item.published }).eq("id", item.id);
    if (error) { setMessage(error.message); return; }
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, published: !i.published } : i));
  }

  async function deleteItem(item: ToolDeepDive) {
    if (!confirm("Delete this item?")) return;
    if (item.html_path) {
      await supabase.storage.from(DEEP_DIVE_PAGES_BUCKET).remove([item.html_path]);
    }
    const { error } = await supabase.from("tool_deep_dives").delete().eq("id", item.id);
    if (error) { setMessage(error.message); return; }
    setItems(prev => prev.filter(i => i.id !== item.id));
  }

  async function moveItem(id: string, direction: "up" | "down") {
    const sorted = [...items].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex(i => i.id === id);
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sorted.length) return;

    const reordered = [...sorted];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(newIdx, 0, moved);

    const updates = reordered.map((item, i) => ({ id: item.id, position: i }));
    await Promise.all(
      updates.map(u => supabase.from("tool_deep_dives").update({ position: u.position }).eq("id", u.id))
    );

    const posMap = Object.fromEntries(updates.map(u => [u.id, u.position]));
    setItems(prev => prev.map(i => posMap[i.id] !== undefined ? { ...i, position: posMap[i.id] } : i));
  }

  function itemSummary(item: ToolDeepDive) {
    if (item.link_type === "html") return item.html_path ? "HTML page" : "HTML page (missing file)";
    return item.url ?? "External link";
  }

  const sorted = [...items].sort((a, b) => a.position - b.position);

  return (
    <div style={card}>
      <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900, letterSpacing: "-.03em" }}>Go deeper with your tools</h2>
      <p style={{ margin: "0 0 16px", color: "#6B6B6B", fontSize: 13 }}>
        Upload HTML guides or add external links for the dashboard sidebar.
      </p>

      {message && (
        <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 600, color: message.includes("failed") || message.includes("error") || message.includes("valid") || message.includes("Choose") ? "#B91C1C" : "#17A855" }}>
          {message}
        </p>
      )}

      <form onSubmit={addItem} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {(["html", "external"] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setLinkType(type)}
              style={{
                padding: "8px 14px", borderRadius: 999, border: "1.5px solid",
                borderColor: linkType === type ? "#221D23" : "#E8E6DC",
                background: linkType === type ? "#221D23" : "white",
                color: linkType === type ? "white" : "#6B6B6B",
                fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {type === "html" ? "Upload HTML page" : "External link"}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required style={inp} />
          <select value={tool} onChange={e => setTool(e.target.value)} style={inp}>
            <option value="">No tool icon</option>
            {availableTools.map(t => (
              <option key={t} value={t}>{formatToolLabel(t)}</option>
            ))}
          </select>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description (optional)" style={{ ...inp, gridColumn: "1 / -1" }} />
          {linkType === "external" ? (
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" style={{ ...inp, gridColumn: "1 / -1" }} />
          ) : (
            <label style={{ ...inp, gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <span style={{ fontWeight: 700, color: "#6B6B6B", fontSize: 12.5 }}>HTML file</span>
              <input
                type="file"
                accept=".html,.htm,text/html"
                onChange={e => setHtmlFile(e.target.files?.[0] ?? null)}
                style={{ fontSize: 12 }}
              />
              {htmlFile && <span style={{ color: "#17A855", fontSize: 12 }}>✓ {htmlFile.name}</span>}
            </label>
          )}
        </div>

        <div>
          <button type="submit" disabled={saving} style={btnAmber}>{saving ? "Saving…" : linkType === "html" ? "Upload page" : "Add link"}</button>
        </div>
      </form>

      {sorted.length === 0 ? (
        <div style={{ padding: 20, textAlign: "center", color: "#B0ABA5", fontSize: 13 }}>
          No items yet. Upload an HTML guide or add an external link.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((item, idx) => {
            const busy = uploadingId === item.id;
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, border: "1px solid #E8E6DC", background: "#FAFAF8" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                  <button type="button" onClick={() => moveItem(item.id, "up")} disabled={idx === 0} style={{ ...posBtn, opacity: idx === 0 ? .3 : 1 }}>▲</button>
                  <button type="button" onClick={() => moveItem(item.id, "down")} disabled={idx === sorted.length - 1} style={{ ...posBtn, opacity: idx === sorted.length - 1 ? .3 : 1 }}>▼</button>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: item.link_type === "html" ? "#eef6ff" : "#f0eee8", color: item.link_type === "html" ? "#1d4ed8" : "#6B6B6B" }}>
                      {item.link_type === "html" ? "HTML" : "Link"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#6B6B6B", marginTop: 2 }}>
                    {item.tool ? `${formatToolLabel(item.tool)} · ` : ""}{itemSummary(item)}
                  </div>
                  {item.description && (
                    <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>{item.description}</div>
                  )}
                </div>
                {item.link_type === "html" && item.html_path && (
                  <Link href={`/explore/${item.id}`} target="_blank" style={{ fontSize: 11.5, fontWeight: 700, color: "#3699FC", textDecoration: "none", flexShrink: 0 }}>
                    Preview
                  </Link>
                )}
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", cursor: busy ? "default" : "pointer", flexShrink: 0 }}>
                  {busy ? "Uploading…" : "Replace HTML"}
                  <input
                    type="file"
                    accept=".html,.htm,text/html"
                    disabled={busy}
                    style={{ display: "none" }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) void replaceHtml(item, file);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button type="button" onClick={() => togglePublished(item)} style={{
                  padding: "5px 10px", borderRadius: 999, border: "1px solid",
                  borderColor: item.published ? "rgba(35,206,104,.3)" : "#E8E6DC",
                  background: item.published ? "rgba(35,206,104,.08)" : "#F0EEE8",
                  color: item.published ? "#17A855" : "#6B6B6B",
                  fontSize: 11.5, fontWeight: 700, cursor: "pointer", flexShrink: 0,
                }}>
                  {item.published ? "Live" : "Draft"}
                </button>
                <button type="button" onClick={() => deleteItem(item)} style={{ border: 0, background: "none", color: "#EF4444", cursor: "pointer", fontSize: 18, lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const card: React.CSSProperties = {
  marginTop: 32,
  background: "white",
  border: "1px solid #E8E6DC",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 2px 12px rgba(34,29,35,.06)",
};

const inp: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 10,
  border: "1.5px solid #E8E6DC",
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
  background: "#FAFAF8",
};

const btnAmber: React.CSSProperties = {
  padding: "8px 18px",
  borderRadius: 999,
  border: 0,
  background: "#FFCE00",
  color: "#221D23",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
};

const posBtn: React.CSSProperties = {
  width: 22,
  height: 16,
  border: "1px solid #E8E6DC",
  borderRadius: 4,
  background: "white",
  cursor: "pointer",
  fontSize: 8,
  lineHeight: 1,
  padding: 0,
};
