"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ActivityFunction } from "@/lib/supabase/types";

type FnRow = Pick<ActivityFunction, "id" | "name" | "description" | "icon_url" | "thumbnail_url" | "created_at">;

type Props = {
  functions: FnRow[];
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

export default function FunctionsManageClient({ functions: initFunctions }: Props) {
  const supabase = createClient();
  const [functions, setFunctions]   = useState<FnRow[]>(initFunctions);
  const [uploading, setUploading]   = useState<string | null>(null);
  const [message, setMessage]       = useState<{ text: string; ok: boolean } | null>(null);
  const [newName, setNewName]       = useState("");
  const [creating, setCreating]     = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  // description drafts: fnId → draft text
  const [descDrafts, setDescDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initFunctions.map(f => [f.id, f.description ?? ""]))
  );
  const [savingDesc, setSavingDesc] = useState<string | null>(null);

  function toast(text: string, ok = true) {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 3500);
  }

  async function saveDescription(fnId: string, fnName: string) {
    const description = (descDrafts[fnId] ?? "").trim() || null;
    setSavingDesc(fnId);
    const { error } = await supabase
      .from("activity_functions")
      .update({ description })
      .eq("id", fnId);
    if (error) { toast(`Failed to save: ${error.message}`, false); }
    else {
      setFunctions(prev => prev.map(f => f.id === fnId ? { ...f, description } : f));
      toast(`Description saved for "${fnName}".`);
    }
    setSavingDesc(null);
  }

  async function createFunction(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("activity_functions")
      .insert({ name })
      .select("id, name, description, icon_url, thumbnail_url, created_at")
      .single();
    if (error) { toast(`Error: ${error.message}`, false); }
    else if (data) {
      setFunctions(prev => [...prev, data as FnRow].sort((a, b) => a.name.localeCompare(b.name)));
      setDescDrafts(prev => ({ ...prev, [(data as FnRow).id]: "" }));
      setNewName("");
      setShowCreate(false);
      toast(`Created function "${name}".`);
    }
    setCreating(false);
  }

  async function uploadFile(
    fnId: string,
    fnName: string,
    file: File,
    type: "icon" | "thumbnail",
  ) {
    if (!file.type.startsWith("image/")) { toast("Please choose an image file.", false); return; }
    const maxKb = type === "thumbnail" ? 2048 : 512;
    if (file.size > maxKb * 1024) { toast(`File must be ${maxKb} KB or smaller.`, false); return; }

    setUploading(`${fnId}-${type}`);
    const ext  = file.name.split(".").pop()?.toLowerCase() || "png";
    const slug = fnName.toLowerCase().replace(/\s+/g, "-");
    const path = type === "thumbnail"
      ? `function-thumb-${slug}.${ext}`
      : `function-${slug}.${ext}`;

    const { error: storageErr } = await supabase.storage
      .from("activity-icons")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (storageErr) { toast(`Upload failed: ${storageErr.message}`, false); setUploading(null); return; }

    const { data: { publicUrl } } = supabase.storage.from("activity-icons").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;

    const field = type === "thumbnail" ? "thumbnail_url" : "icon_url";
    const { error: dbErr } = await supabase
      .from("activity_functions")
      .update({ [field]: url })
      .eq("id", fnId);

    if (dbErr) { toast(`DB error: ${dbErr.message}`, false); setUploading(null); return; }

    setFunctions(prev => prev.map(f => f.id === fnId ? { ...f, [field]: url } : f));
    setUploading(null);
    toast(`${type === "thumbnail" ? "Thumbnail" : "Icon"} uploaded for "${fnName}".`);
  }

  async function removeFile(fnId: string, fnName: string, type: "icon" | "thumbnail") {
    if (!confirm(`Remove ${type} for "${fnName}"?`)) return;
    setUploading(`${fnId}-${type}`);
    const field = type === "thumbnail" ? "thumbnail_url" : "icon_url";
    await supabase.from("activity_functions").update({ [field]: null }).eq("id", fnId);
    setFunctions(prev => prev.map(f => f.id === fnId ? { ...f, [field]: null } : f));
    setUploading(null);
    toast(`Removed ${type} for "${fnName}".`);
  }

  async function deleteFunction(fnId: string, fnName: string) {
    if (!confirm(`Delete function "${fnName}"? It will be removed from all activities.`)) return;
    setUploading(fnId);
    await supabase.from("activity_functions").delete().eq("id", fnId);
    setFunctions(prev => prev.filter(f => f.id !== fnId));
    setUploading(null);
    toast(`Deleted function "${fnName}".`);
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
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: "-.04em" }}>Functions</h1>
              <p style={{ margin: "3px 0 0", color: "#746F78", fontSize: 13 }}>
                Manage job functions — upload thumbnails and icons that appear on the dashboard.
              </p>
            </div>
            <button style={btnPrimary} onClick={() => setShowCreate(v => !v)}>+ New Function</button>
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
          <form onSubmit={e => void createFunction(e)} style={{
            marginBottom: 24, padding: "16px 20px", borderRadius: 14,
            background: "white", border: "1.5px solid #E8E6DC",
            display: "flex", gap: 10, alignItems: "center",
            boxShadow: "0 2px 12px rgba(34,29,35,.06)",
          }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Function name (e.g. Marketing, Finance…)"
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

        {/* Function cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
          {functions.map(fn => {
            const busyIcon  = uploading === `${fn.id}-icon`;
            const busyThumb = uploading === `${fn.id}-thumbnail`;
            const busyDel   = uploading === fn.id;

            return (
              <div key={fn.id} style={{
                background: "white", border: "1.5px solid #E8E6DC", borderRadius: 18,
                overflow: "hidden", boxShadow: "0 2px 12px rgba(34,29,35,.06)",
              }}>
                {/* Thumbnail preview */}
                <div style={{
                  aspectRatio: "16 / 9",
                  background: fn.thumbnail_url ? "transparent" : "#F0EEE8",
                  position: "relative", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: fn.thumbnail_url ? "18px 18px 0 0" : 0,
                }}>
                  {fn.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fn.thumbnail_url}
                      alt=""
                      style={{ position: "absolute", inset: 0, width: "100%", height: "calc(100% + 2px)", objectFit: "cover", objectPosition: "center top", display: "block", borderRadius: "18px 18px 0 0" }}
                    />
                  ) : (
                    <span style={{ fontSize: 32, fontWeight: 900, color: "#CEC8C2", letterSpacing: "-.04em" }}>
                      {fn.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  {fn.thumbnail_url && (
                    <button
                      onClick={() => void removeFile(fn.id, fn.name, "thumbnail")}
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
                      {fn.icon_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={fn.icon_url} alt="" style={{ width: 26, height: 26, objectFit: "contain" }} />
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#A09AA6" }}>
                          {fn.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#221D23", letterSpacing: "-.02em" }}>{fn.name}</div>
                      <div style={{ fontSize: 11, color: "#A09AA6", marginTop: 1 }}>
                        Added {new Date(fn.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
                      value={descDrafts[fn.id] ?? ""}
                      onChange={e => setDescDrafts(prev => ({ ...prev, [fn.id]: e.target.value }))}
                      placeholder="Short description shown on the dashboard function card…"
                      style={{
                        width: "100%", boxSizing: "border-box",
                        padding: "8px 10px", borderRadius: 8,
                        border: "1.5px solid #E8E6DC", fontSize: 12.5,
                        fontFamily: "inherit", outline: "none", resize: "vertical",
                        lineHeight: 1.5, color: "#221D23",
                      }}
                    />
                    <button
                      onClick={() => void saveDescription(fn.id, fn.name)}
                      disabled={savingDesc === fn.id}
                      style={{ ...btnPrimary, marginTop: 6, padding: "6px 14px", fontSize: 12 }}
                    >
                      {savingDesc === fn.id ? "Saving…" : "Save description"}
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
                            if (file) void uploadFile(fn.id, fn.name, file, "thumbnail");
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
                              if (file) void uploadFile(fn.id, fn.name, file, "icon");
                              e.target.value = "";
                            }}
                          />
                        </label>
                        {fn.icon_url && (
                          <button
                            onClick={() => void removeFile(fn.id, fn.name, "icon")}
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
                    onClick={() => void deleteFunction(fn.id, fn.name)}
                    disabled={!!busyDel}
                    style={{ ...btnDanger, width: "100%", marginTop: 10, padding: "7px 0", fontSize: 12 }}
                  >
                    {busyDel ? "Deleting…" : "Delete function"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {functions.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#A09AA6" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>No functions yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Click &ldquo;+ New Function&rdquo; to create your first one.</div>
          </div>
        )}
    </div>
  );
}
