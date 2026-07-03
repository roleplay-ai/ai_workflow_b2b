"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ActivityCategory } from "@/lib/supabase/types";

type CatRow = Pick<ActivityCategory, "id" | "name" | "description" | "icon_url" | "thumbnail_url" | "created_at">;

type Props = {
  categories: CatRow[];
};

const btn: React.CSSProperties = {
  padding: "7px 14px", borderRadius: 999, border: "1.5px solid #E8E6DC",
  background: "white", color: "#221D23", fontWeight: 700, cursor: "pointer",
  fontFamily: "inherit", fontSize: 12.5, transition: "all .15s",
};
const btnPrimary: React.CSSProperties = {
  ...btn, background: "#FFCE00", border: "1.5px solid #E8B800", color: "#221D23",
};
const btnDanger: React.CSSProperties = {
  ...btn, borderColor: "rgba(239,68,68,.3)", color: "#DC2626", background: "rgba(239,68,68,.05)",
};

export default function CategoriesManageClient({ categories: initCategories }: Props) {
  const supabase = createClient();
  const [categories, setCategories] = useState<CatRow[]>(initCategories);
  const [uploading, setUploading]   = useState<string | null>(null);
  const [message, setMessage]       = useState<{ text: string; ok: boolean } | null>(null);
  const [newName, setNewName]       = useState("");
  const [creating, setCreating]     = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  // description drafts: catId → draft text
  const [descDrafts, setDescDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initCategories.map(c => [c.id, c.description ?? ""]))
  );
  const [savingDesc, setSavingDesc] = useState<string | null>(null);

  function toast(text: string, ok = true) {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 3500);
  }

  async function saveDescription(catId: string, catName: string) {
    const description = (descDrafts[catId] ?? "").trim() || null;
    setSavingDesc(catId);
    const { error } = await supabase
      .from("activity_categories")
      .update({ description })
      .eq("id", catId);
    if (error) { toast(`Failed to save: ${error.message}`, false); }
    else {
      setCategories(prev => prev.map(c => c.id === catId ? { ...c, description } : c));
      toast(`Description saved for "${catName}".`);
    }
    setSavingDesc(null);
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("activity_categories")
      .insert({ name })
      .select("id, name, description, icon_url, thumbnail_url, created_at")
      .single();
    if (error) { toast(`Error: ${error.message}`, false); }
    else if (data) {
      setCategories(prev => [...prev, data as CatRow].sort((a, b) => a.name.localeCompare(b.name)));
      setDescDrafts(prev => ({ ...prev, [(data as CatRow).id]: "" }));
      setNewName("");
      setShowCreate(false);
      toast(`Created category "${name}".`);
    }
    setCreating(false);
  }

  async function uploadFile(
    catId: string,
    catName: string,
    file: File,
    type: "icon" | "thumbnail",
  ) {
    if (!file.type.startsWith("image/")) { toast("Please choose an image file.", false); return; }
    const maxKb = type === "thumbnail" ? 2048 : 512;
    if (file.size > maxKb * 1024) { toast(`File must be ${maxKb} KB or smaller.`, false); return; }

    setUploading(`${catId}-${type}`);
    const ext  = file.name.split(".").pop()?.toLowerCase() || "png";
    const slug = catName.toLowerCase().replace(/\s+/g, "-");
    const path = type === "thumbnail"
      ? `category-thumb-${slug}.${ext}`
      : `category-${slug}.${ext}`;

    const { error: storageErr } = await supabase.storage
      .from("activity-icons")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (storageErr) { toast(`Upload failed: ${storageErr.message}`, false); setUploading(null); return; }

    const { data: { publicUrl } } = supabase.storage.from("activity-icons").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;

    const field = type === "thumbnail" ? "thumbnail_url" : "icon_url";
    const { error: dbErr } = await supabase
      .from("activity_categories")
      .update({ [field]: url })
      .eq("id", catId);

    if (dbErr) { toast(`DB error: ${dbErr.message}`, false); setUploading(null); return; }

    setCategories(prev => prev.map(c => c.id === catId ? { ...c, [field]: url } : c));
    setUploading(null);
    toast(`${type === "thumbnail" ? "Thumbnail" : "Icon"} uploaded for "${catName}".`);
  }

  async function removeFile(catId: string, catName: string, type: "icon" | "thumbnail") {
    if (!confirm(`Remove ${type} for "${catName}"?`)) return;
    setUploading(`${catId}-${type}`);
    const field = type === "thumbnail" ? "thumbnail_url" : "icon_url";
    await supabase.from("activity_categories").update({ [field]: null }).eq("id", catId);
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, [field]: null } : c));
    setUploading(null);
    toast(`Removed ${type} for "${catName}".`);
  }

  async function deleteCategory(catId: string, catName: string) {
    if (!confirm(`Delete category "${catName}"? It will be removed from all activities.`)) return;
    setUploading(catId);
    await supabase.from("activity_categories").delete().eq("id", catId);
    setCategories(prev => prev.filter(c => c.id !== catId));
    setUploading(null);
    toast(`Deleted category "${catName}".`);
  }

  return (
    <div>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <Link href="/superadmin" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 10, fontSize: 13, fontWeight: 600, color: "#746F78", textDecoration: "none" }}>
            ← Back to Activities
          </Link>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: "-.04em" }}>Categories</h1>
              <p style={{ margin: "3px 0 0", color: "#746F78", fontSize: 13 }}>
                Manage job categories — upload thumbnails and icons that appear on the dashboard.
              </p>
            </div>
            <button style={btnPrimary} onClick={() => setShowCreate(v => !v)}>+ New Category</button>
          </div>
        </div>

        {/* Toast */}
        {message && (
          <div style={{
            marginBottom: 16, padding: "10px 16px", borderRadius: 10,
            background: message.ok ? "#EDFBF3" : "#FEF2F2",
            border: `1px solid ${message.ok ? "#A7F3D0" : "#FECACA"}`,
            color: message.ok ? "#065F46" : "#991B1B",
            fontWeight: 600, fontSize: 13,
          }}>{message.text}</div>
        )}

        {/* Create form */}
        {showCreate && (
          <form onSubmit={e => void createCategory(e)} style={{
            marginBottom: 24, padding: "16px 20px", borderRadius: 14,
            background: "white", border: "1.5px solid #E8E6DC",
            display: "flex", gap: 10, alignItems: "center",
            boxShadow: "0 2px 12px rgba(34,29,35,.06)",
          }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Category name (e.g. Marketing, Finance…)"
              required
              style={{
                flex: 1, padding: "8px 14px", borderRadius: 8,
                border: "1.5px solid #E8E6DC", fontSize: 14, fontWeight: 600,
                fontFamily: "inherit", outline: "none",
              }}
            />
            <button type="submit" disabled={creating} style={btnPrimary}>
              {creating ? "Creating…" : "Create"}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} style={btn}>Cancel</button>
          </form>
        )}

        {/* Category cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
          {categories.map(cat => {
            const busyIcon  = uploading === `${cat.id}-icon`;
            const busyThumb = uploading === `${cat.id}-thumbnail`;
            const busyDel   = uploading === cat.id;

            return (
              <div key={cat.id} style={{
                background: "white", border: "1.5px solid #E8E6DC", borderRadius: 18,
                overflow: "hidden", boxShadow: "0 2px 12px rgba(34,29,35,.06)",
              }}>
                {/* Thumbnail preview */}
                <div style={{
                  aspectRatio: "16 / 9",
                  background: cat.thumbnail_url ? "transparent" : "#F0EEE8",
                  position: "relative", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: cat.thumbnail_url ? "18px 18px 0 0" : 0,
                }}>
                  {cat.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cat.thumbnail_url}
                      alt=""
                      style={{ position: "absolute", inset: 0, width: "100%", height: "calc(100% + 2px)", objectFit: "cover", objectPosition: "center top", display: "block", borderRadius: "18px 18px 0 0" }}
                    />
                  ) : (
                    <span style={{ fontSize: 32, fontWeight: 900, color: "#CEC8C2", letterSpacing: "-.04em" }}>
                      {cat.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  {cat.thumbnail_url && (
                    <button
                      onClick={() => void removeFile(cat.id, cat.name, "thumbnail")}
                      disabled={busyThumb}
                      title="Remove thumbnail"
                      style={{
                        position: "absolute", top: 8, right: 8,
                        width: 26, height: 26, borderRadius: "50%",
                        background: "rgba(34,29,35,.7)", border: "none",
                        color: "white", cursor: "pointer", fontSize: 13,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >×</button>
                  )}
                </div>

                {/* Card body */}
                <div style={{ padding: "14px 16px" }}>
                  {/* Name + icon */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: "#F0EEE8", border: "1px solid #E8E6DC",
                      overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {cat.icon_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cat.icon_url} alt="" style={{ width: 26, height: 26, objectFit: "contain" }} />
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#A09AA6" }}>
                          {cat.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#221D23", letterSpacing: "-.02em" }}>{cat.name}</div>
                      <div style={{ fontSize: 11, color: "#A09AA6", marginTop: 1 }}>
                        Added {new Date(cat.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#746F78", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                      Description
                    </div>
                    <textarea
                      rows={3}
                      value={descDrafts[cat.id] ?? ""}
                      onChange={e => setDescDrafts(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      placeholder="Short description shown on the dashboard category card…"
                      style={{
                        width: "100%", boxSizing: "border-box",
                        padding: "8px 10px", borderRadius: 8,
                        border: "1.5px solid #E8E6DC", fontSize: 12.5,
                        fontFamily: "inherit", outline: "none", resize: "vertical",
                        lineHeight: 1.5, color: "#221D23",
                      }}
                    />
                    <button
                      onClick={() => void saveDescription(cat.id, cat.name)}
                      disabled={savingDesc === cat.id}
                      style={{ ...btnPrimary, marginTop: 6, padding: "6px 14px", fontSize: 12 }}
                    >
                      {savingDesc === cat.id ? "Saving…" : "Save description"}
                    </button>
                  </div>

                  {/* Upload sections */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

                    {/* Thumbnail upload */}
                    <div style={{ padding: "10px 12px", background: "#FAFAF8", borderRadius: 10, border: "1px solid #EEEAE4" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#746F78", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                        Card Thumbnail
                      </div>
                      <label style={{ cursor: "pointer", display: "block" }}>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={busyThumb}
                          style={{ fontSize: 12, width: "100%", cursor: "pointer" }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) void uploadFile(cat.id, cat.name, file, "thumbnail");
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <div style={{ fontSize: 10.5, color: "#A09AA6", marginTop: 4 }}>
                        {busyThumb ? "Uploading…" : "16:9 landscape · 1024×576 px recommended · max 2 MB"}
                      </div>
                    </div>

                    {/* Icon upload */}
                    <div style={{ padding: "10px 12px", background: "#FAFAF8", borderRadius: 10, border: "1px solid #EEEAE4" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#746F78", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                        Icon (small)
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <label style={{ flex: 1, cursor: "pointer" }}>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={busyIcon}
                            style={{ fontSize: 12, width: "100%", cursor: "pointer" }}
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) void uploadFile(cat.id, cat.name, file, "icon");
                              e.target.value = "";
                            }}
                          />
                        </label>
                        {cat.icon_url && (
                          <button
                            onClick={() => void removeFile(cat.id, cat.name, "icon")}
                            disabled={busyIcon}
                            style={{ ...btn, padding: "4px 9px", fontSize: 11 }}
                          >Remove</button>
                        )}
                      </div>
                      <div style={{ fontSize: 10.5, color: "#A09AA6", marginTop: 4 }}>
                        {busyIcon ? "Uploading…" : "Square PNG · max 512 KB"}
                      </div>
                    </div>

                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => void deleteCategory(cat.id, cat.name)}
                    disabled={!!busyDel}
                    style={{ ...btnDanger, width: "100%", marginTop: 10, padding: "7px 0", fontSize: 12 }}
                  >
                    {busyDel ? "Deleting…" : "Delete category"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {categories.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#A09AA6" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>No categories yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Click &ldquo;+ New Category&rdquo; to create your first one.</div>
          </div>
        )}
    </div>
  );
}
