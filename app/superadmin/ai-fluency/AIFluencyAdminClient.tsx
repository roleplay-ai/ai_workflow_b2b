"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { probeVideoDurationFromFile, formatFileSize } from "@/lib/videoDuration";
import { resumableUpload } from "@/lib/resumableUpload";

// ── Types ──────────────────────────────────────────────────────────────────

type FluencyModule = {
  id: string; title: string; description: string | null; emoji: string; concepts: string[];
  sort_order: number; is_locked: boolean; published: boolean;
  next_module_hint: string | null; html_path: string | null;
};
type Video = {
  id: string; title: string; description: string | null;
  video_url: string | null; thumbnail_url: string | null;
  duration: string | null; order_index: number; is_locked: boolean;
  is_featured: boolean; group_name: string | null; category_tag: string | null;
  platforms: string | null; is_published: boolean;
};
type Tool = {
  id: string; name: string; category_label: string; description: string | null;
  icon_emoji: string | null; letter: string | null; color: string | null;
  company_name: string | null; try_url: string | null; best_for: string | null;
  pricing: string | null; is_featured: boolean; published: boolean; sort_order: number;
};
type BriefItem = { id: string; content: string; link_url: string | null; sort_order: number };
type Brief = { id: string; title: string; published_date: string; is_active: boolean; fluency_brief_items: BriefItem[] };
type BriefEdit = { title: string; published_date: string };

type Props = {
  modules: FluencyModule[];
  videos: Video[];
  tools: Tool[];
  briefs: Brief[];
};

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
const posBtn: React.CSSProperties = { width: 18, height: 14, border: "1px solid #E8E6DC", borderRadius: 4, background: "#F8F8F6", color: "#6B6B6B", fontSize: 8, cursor: "pointer", display: "grid", placeItems: "center", padding: 0 };

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B0ABA5" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: ".15s", flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ToggleBtn({ active, activeColor, activeLabel, inactiveLabel, onClick }: {
  active: boolean; activeColor: string; activeLabel: string; inactiveLabel: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 10px", borderRadius: 999, border: "1px solid", cursor: "pointer", fontFamily: "inherit",
      borderColor: active ? activeColor + "55" : "#E8E6DC",
      background: active ? activeColor + "14" : "#F0EEE8",
      color: active ? activeColor : "#6B6B6B",
      fontSize: 11, fontWeight: 700,
    }}>{active ? activeLabel : inactiveLabel}</button>
  );
}

// ── Modules Tab ────────────────────────────────────────────────────────────

function ModulesTab({ initModules }: { initModules: FluencyModule[] }) {
  const supabase = createClient();
  const [modules, setModules] = useState(initModules);
  const [showAdd, setShowAdd] = useState(false);

  const [mTitle, setMTitle] = useState("");
  const [mDesc, setMDesc] = useState("");
  const [mEmoji, setMEmoji] = useState("📖");
  const [mConcepts, setMConcepts] = useState("");

  const sorted = [...modules].sort((a, b) => a.sort_order - b.sort_order);

  async function addModule() {
    const nextSort = sorted.length > 0 ? sorted[sorted.length - 1].sort_order + 1 : 0;
    const concepts = mConcepts.split(",").map(s => s.trim()).filter(Boolean);
    const { data, error } = await supabase.from("fluency_modules")
      .insert({
        title: mTitle,
        description: mDesc.trim() || null,
        emoji: mEmoji,
        concepts,
        sort_order: nextSort,
        is_locked: false,
        published: false,
      })
      .select().single();
    if (!error && data) {
      setModules(prev => [...prev, data as FluencyModule]);
      setMTitle(""); setMDesc(""); setMConcepts(""); setShowAdd(false);
    } else if (error) alert(error.message);
  }

  async function togglePublished(mod: FluencyModule) {
    const { error } = await supabase.from("fluency_modules").update({ published: !mod.published }).eq("id", mod.id);
    if (error) { alert(error.message); return; }
    setModules(prev => prev.map(m => m.id === mod.id ? { ...m, published: !m.published } : m));
  }

  async function toggleLocked(mod: FluencyModule) {
    const { error } = await supabase.from("fluency_modules").update({ is_locked: !mod.is_locked }).eq("id", mod.id);
    if (error) { alert(error.message); return; }
    setModules(prev => prev.map(m => m.id === mod.id ? { ...m, is_locked: !m.is_locked } : m));
  }

  async function deleteModule(modId: string) {
    if (!confirm("Delete this module?")) return;
    await supabase.from("fluency_modules").delete().eq("id", modId);
    setModules(prev => prev.filter(m => m.id !== modId));
  }

  async function moveModule(modId: string, dir: "up" | "down") {
    const list = [...sorted];
    const idx = list.findIndex(m => m.id === modId);
    const ni = dir === "up" ? idx - 1 : idx + 1;
    if (ni < 0 || ni >= list.length) return;
    const r = [...list]; const [m] = r.splice(idx, 1); r.splice(ni, 0, m);
    await Promise.all(r.map((mod, i) => supabase.from("fluency_modules").update({ sort_order: i }).eq("id", mod.id)));
    setModules(r.map((mod, i) => ({ ...mod, sort_order: i })));
  }

  function updateModuleHtml(modId: string, path: string | null) {
    setModules(prev => prev.map(m => m.id === modId ? { ...m, html_path: path } : m));
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>AI Foundations</h2>
          <p style={{ margin: "3px 0 0", color: "#6B6B6B", fontSize: 13 }}>
            {modules.length} module{modules.length !== 1 ? "s" : ""} · upload HTML per topic card
          </p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={btnAmber}>+ New Module</button>
      </div>

      {showAdd && (
        <div style={{ ...card, padding: 18, marginBottom: 14, borderColor: "#FFCE00" }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>New Module</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 64px", gap: 10, marginBottom: 10 }}>
            <div><label style={lbl}>Title</label><input value={mTitle} onChange={e => setMTitle(e.target.value)} placeholder="e.g. Tokens" style={inp} /></div>
            <div><label style={lbl}>Emoji</label><input value={mEmoji} onChange={e => setMEmoji(e.target.value)} style={inp} /></div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>Subtitle (card description)</label>
            <input value={mDesc} onChange={e => setMDesc(e.target.value)} placeholder="e.g. How AI counts your words" style={inp} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>Concepts (comma-separated, optional)</label>
            <input value={mConcepts} onChange={e => setMConcepts(e.target.value)} placeholder="Tokens, Tokenization" style={inp} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addModule} disabled={!mTitle} style={btnAmber}>Create Module</button>
            <button onClick={() => setShowAdd(false)} style={btnGhost}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.map((mod, mi) => (
          <div key={mod.id} style={{ ...card, display: "flex", alignItems: "center", gap: 9, padding: "12px 16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
              <button onClick={() => moveModule(mod.id, "up")} disabled={mi === 0} style={{ ...posBtn, opacity: mi === 0 ? .3 : 1 }}>▲</button>
              <button onClick={() => moveModule(mod.id, "down")} disabled={mi === sorted.length - 1} style={{ ...posBtn, opacity: mi === sorted.length - 1 ? .3 : 1 }}>▼</button>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#B0ABA5", width: 20, textAlign: "center", flexShrink: 0 }}>#{mi + 1}</span>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{mod.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{mod.title}</div>
              <div style={{ fontSize: 11, color: "#9B9199", marginTop: 1 }}>
                {mod.description || (mod.concepts.length > 0 ? mod.concepts.slice(0, 3).join(" · ") : "No subtitle")}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
              <ModuleHtmlUpload
                moduleId={mod.id}
                htmlPath={mod.html_path}
                onUploaded={path => updateModuleHtml(mod.id, path)}
              />
              <Link href={`/superadmin/modules/${mod.id}`} style={{
                padding: "4px 10px", borderRadius: 999, border: "1px solid #E8E6DC",
                background: "white", color: "#221D23", fontSize: 11, fontWeight: 700, textDecoration: "none",
              }}>Edit content</Link>
              <ToggleBtn active={mod.is_locked} activeColor="#DC2626" activeLabel="🔒 Locked" inactiveLabel="🔓 Open" onClick={() => toggleLocked(mod)} />
              <ToggleBtn active={mod.published} activeColor="#17A855" activeLabel="Live" inactiveLabel="Draft" onClick={() => togglePublished(mod)} />
              <button onClick={() => deleteModule(mod.id)} style={{ border: 0, background: "none", color: "#EF4444", cursor: "pointer", fontSize: 15 }}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Module HTML upload ─────────────────────────────────────────────────────

const FLUENCY_MODULE_HTML_BUCKET = "fluency-module-html";

function ModuleHtmlUpload({
  moduleId, htmlPath, onUploaded,
}: {
  moduleId: string; htmlPath: string | null; onUploaded: (path: string | null) => void;
}) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `modules/${moduleId}.html`;
      const { error } = await supabase.storage
        .from(FLUENCY_MODULE_HTML_BUCKET)
        .upload(path, file, { contentType: "text/html", upsert: true });
      if (error) { alert("Upload failed: " + error.message); return; }
      const { error: dbErr } = await supabase
        .from("fluency_modules")
        .update({ html_path: path })
        .eq("id", moduleId);
      if (dbErr) { alert("DB update failed: " + dbErr.message); return; }
      onUploaded(path);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeHtml() {
    if (!htmlPath || !confirm("Remove HTML content from this module?")) return;
    await supabase.storage.from(FLUENCY_MODULE_HTML_BUCKET).remove([htmlPath]);
    await supabase.from("fluency_modules").update({ html_path: null }).eq("id", moduleId);
    onUploaded(null);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
      {htmlPath ? (
        <>
          <span style={{
            fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 999,
            background: "#ECFFF4", color: "#159E4B", border: "1px solid #BBF7D0",
          }}>HTML ✓</span>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            title="Replace HTML"
            style={{ border: 0, background: "none", color: "#6B6B6B", cursor: "pointer", fontSize: 12, fontWeight: 700, padding: "3px 6px" }}
          >{uploading ? "…" : "↺"}</button>
          <button
            onClick={removeHtml}
            title="Remove HTML"
            style={{ border: 0, background: "none", color: "#EF4444", cursor: "pointer", fontSize: 13 }}
          >×</button>
        </>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: "3px 10px", borderRadius: 999, border: "1px solid #E8E6DC",
            background: "white", color: "#221D23", fontSize: 11, fontWeight: 700, cursor: "pointer",
          }}
        >{uploading ? "Uploading…" : "Upload HTML"}</button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".html,text/html"
        style={{ display: "none" }}
        onChange={handleFile}
      />
    </div>
  );
}

// ── Upload field components ────────────────────────────────────────────────

type UploadPhase = null | "reading" | "uploading";

function VideoUploadField({
  value, onUploaded, onDuration,
}: {
  value: string | null;
  onUploaded: (url: string | null) => void;
  onDuration: (d: string) => void;
}) {
  const supabase = createClient();
  const [phase, setPhase] = useState<UploadPhase>(null);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingLabel(`${file.name} · ${formatFileSize(file.size)}`);
    setPhase("reading");
    let dur: string | null = null;
    try { dur = await probeVideoDurationFromFile(file); } catch { /* ignore */ }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setPhase(null); setPendingLabel(null);
      alert("Upload failed: not signed in.");
      return;
    }

    setProgress(0);
    setPhase("uploading");
    const ext = file.name.split(".").pop() ?? "mp4";
    const path = `apply-videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    try {
      await resumableUpload({
        bucket: "content",
        objectName: path,
        file,
        accessToken,
        onProgress: (f) => setProgress(f),
      });
    } catch (err) {
      setPhase(null); setPendingLabel(null); setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
      alert("Upload failed: " + (err instanceof Error ? err.message : String(err)));
      return;
    }
    setPhase(null); setPendingLabel(null); setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
    const { data } = supabase.storage.from("content").getPublicUrl(path);
    onUploaded(data.publicUrl);
    if (dur) onDuration(dur);
  }

  const filename = value ? decodeURIComponent(value.split("/").pop() ?? "") : null;

  if (phase) {
    return (
      <div style={{ border: "1.5px dashed #E8E6DC", borderRadius: 12, padding: "18px 14px", textAlign: "center", background: "#FAFAF8" }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
          {phase === "reading"
            ? "⏱ Reading metadata…"
            : `⬆ Uploading… ${Math.round(progress * 100)}%`}
        </div>
        <div style={{ fontSize: 11, color: "#9B9199", marginBottom: 8 }}>{pendingLabel}</div>
        <div style={{ height: 4, borderRadius: 4, background: "#E8E6DC", overflow: "hidden" }}>
          {phase === "reading" ? (
            <div style={{ height: "100%", width: "60%", background: "#FFCE00", borderRadius: 4, animation: "pulse 1.2s ease-in-out infinite" }} />
          ) : (
            <div style={{ height: "100%", width: `${Math.round(progress * 100)}%`, background: "#FFCE00", borderRadius: 4, transition: "width .2s ease" }} />
          )}
        </div>
      </div>
    );
  }

  return value ? (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "#F0FFF4", border: "1px solid #BBF7D0" }}>
      <span style={{ fontSize: 18 }}>🎬</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{filename}</div>
        <div style={{ fontSize: 10, color: "#16a34a" }}>Video uploaded</div>
      </div>
      <button onClick={() => onUploaded(null)} style={{ border: 0, background: "none", color: "#EF4444", cursor: "pointer", fontSize: 16, padding: 4 }}>×</button>
    </div>
  ) : (
    <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "18px 14px", borderRadius: 12, border: "1.5px dashed #E8E6DC", background: "#FAFAF8", cursor: "pointer", transition: "border-color .15s" }}>
      <span style={{ fontSize: 22 }}>🎬</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#221D23" }}>Upload video</span>
      <span style={{ fontSize: 10, color: "#9B9199" }}>MP4, MOV, or WebM · max 500 MB</span>
      <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/*" onChange={handleFile} style={{ display: "none" }} />
    </label>
  );
}

function ImageUploadField({ value, onUploaded }: { value: string | null; onUploaded: (url: string | null) => void }) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `video-thumbs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("content").upload(path, file, { cacheControl: "3600", upsert: false });
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (error) { alert("Upload failed: " + error.message); return; }
    const { data } = supabase.storage.from("content").getPublicUrl(path);
    onUploaded(data.publicUrl);
  }

  return value ? (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: "16/9", background: "#F0EEE8" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={value} alt="thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <button onClick={() => onUploaded(null)} style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", border: 0, background: "rgba(34,29,35,.7)", color: "white", cursor: "pointer", fontSize: 14, display: "grid", placeItems: "center" }}>×</button>
    </div>
  ) : (
    <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "18px 14px", borderRadius: 12, border: "1.5px dashed #E8E6DC", background: "#FAFAF8", cursor: "pointer", aspectRatio: "16/9", justifyContent: "center" }}>
      {uploading ? (
        <span style={{ fontSize: 12, color: "#9B9199" }}>Uploading…</span>
      ) : (<>
        <span style={{ fontSize: 22 }}>🖼</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#221D23" }}>Upload thumbnail</span>
        <span style={{ fontSize: 10, color: "#9B9199" }}>JPEG, PNG, or WebP</span>
      </>)}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} style={{ display: "none" }} />
    </label>
  );
}

// ── Videos Tab ─────────────────────────────────────────────────────────────

const GROUP_OPTIONS = ["Features", "Apps", "Workflows", "Skills"];

type VideoEdit = {
  title: string; description: string; video_url: string; thumbnail_url: string;
  duration: string; group_name: string; category_tag: string; platforms: string;
};

function VideosTab({ initVideos }: { initVideos: Video[] }) {
  const supabase = createClient();
  const [videos, setVideos] = useState(initVideos);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<VideoEdit>({
    title: "", description: "", video_url: "", thumbnail_url: "",
    duration: "", group_name: "Features", category_tag: "", platforms: "",
  });

  // "New video" form state
  const [nTitle, setNTitle] = useState("");
  const [nDesc, setNDesc] = useState("");
  const [nUrl, setNUrl] = useState<string | null>(null);
  const [nThumb, setNThumb] = useState<string | null>(null);
  const [nDuration, setNDuration] = useState("");
  const [nGroup, setNGroup] = useState("Features");
  const [nTag, setNTag] = useState("");
  const [nPlatforms, setNPlatforms] = useState("");

  const sorted = [...videos].sort((a, b) => a.order_index - b.order_index);

  function startEdit(v: Video) {
    setEditingId(v.id);
    setEditDraft({
      title: v.title, description: v.description ?? "",
      video_url: v.video_url ?? "", thumbnail_url: v.thumbnail_url ?? "",
      duration: v.duration ?? "", group_name: v.group_name ?? "Features",
      category_tag: v.category_tag ?? "", platforms: v.platforms ?? "",
    });
  }

  async function saveEdit(id: string) {
    const patch = {
      title: editDraft.title,
      description: editDraft.description || null,
      video_url: editDraft.video_url || null,
      thumbnail_url: editDraft.thumbnail_url || null,
      duration: editDraft.duration || null,
      group_name: editDraft.group_name,
      category_tag: editDraft.category_tag || null,
      platforms: editDraft.platforms || null,
    };
    const { error } = await supabase.from("apply_videos").update(patch).eq("id", id);
    if (error) { alert(error.message); return; }
    setVideos(prev => prev.map(v => v.id === id ? { ...v, ...patch } : v));
    setEditingId(null);
  }

  async function addVideo() {
    const nextIdx = sorted.length > 0 ? sorted[sorted.length - 1].order_index + 1 : 0;
    const { data, error } = await supabase.from("apply_videos").insert({
      title: nTitle, description: nDesc || null,
      video_url: nUrl || null, thumbnail_url: nThumb || null,
      duration: nDuration || null, group_name: nGroup,
      category_tag: nTag || null, platforms: nPlatforms || null,
      order_index: nextIdx, is_locked: false, is_featured: false, is_published: false,
    }).select().single();
    if (!error && data) {
      setVideos(prev => [...prev, data as Video]);
      setNTitle(""); setNDesc(""); setNUrl(null); setNThumb(null);
      setNDuration(""); setNTag(""); setNPlatforms(""); setShowAdd(false);
    } else if (error) alert(error.message);
  }

  async function toggle(id: string, field: "is_published" | "is_featured" | "is_locked") {
    const v = videos.find(v => v.id === id);
    if (!v) return;
    const val = !v[field];
    const { error } = await supabase.from("apply_videos").update({ [field]: val }).eq("id", id);
    if (error) { alert(error.message); return; }
    setVideos(prev => prev.map(v => v.id === id ? { ...v, [field]: val } : v));
  }

  async function moveVideo(id: string, dir: "up" | "down") {
    const list = [...sorted];
    const idx = list.findIndex(v => v.id === id);
    const ni = dir === "up" ? idx - 1 : idx + 1;
    if (ni < 0 || ni >= list.length) return;
    const r = [...list]; const [m] = r.splice(idx, 1); r.splice(ni, 0, m);
    await Promise.all(r.map((v, i) => supabase.from("apply_videos").update({ order_index: i }).eq("id", v.id)));
    setVideos(r.map((v, i) => ({ ...v, order_index: i })));
  }

  async function deleteVideo(id: string) {
    if (!confirm("Delete this video?")) return;
    await supabase.from("apply_videos").delete().eq("id", id);
    setVideos(prev => prev.filter(v => v.id !== id));
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Apply Videos</h2>
          <p style={{ margin: "3px 0 0", color: "#6B6B6B", fontSize: 13 }}>{videos.length} videos · short AI feature demos</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={btnAmber}>+ New Video</button>
      </div>

      {showAdd && (
        <div style={{ ...card, padding: 18, marginBottom: 14, borderColor: "#FFCE00" }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>New Video</div>

          {/* Upload row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={lbl}>Video file</label>
              <VideoUploadField
                value={nUrl}
                onUploaded={url => setNUrl(url)}
                onDuration={d => setNDuration(d)}
              />
            </div>
            <div>
              <label style={lbl}>Thumbnail</label>
              <ImageUploadField value={nThumb} onUploaded={url => setNThumb(url)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10, marginBottom: 10 }}>
            <div><label style={lbl}>Title</label><input value={nTitle} onChange={e => setNTitle(e.target.value)} placeholder="Video title" style={inp} /></div>
            <div>
              <label style={lbl}>Duration</label>
              <input value={nDuration} onChange={e => setNDuration(e.target.value)} placeholder="auto"
                style={{ ...inp, color: nDuration ? "#221D23" : "#9B9199" }} />
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>Description</label>
            <textarea value={nDesc} onChange={e => setNDesc(e.target.value)} rows={2} placeholder="Short description" style={{ ...inp, resize: "vertical" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Group</label>
              <select value={nGroup} onChange={e => setNGroup(e.target.value)} style={inp}>
                {GROUP_OPTIONS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Category Tag</label><input value={nTag} onChange={e => setNTag(e.target.value)} placeholder="e.g. Summarise" style={inp} /></div>
            <div><label style={lbl}>Platforms</label><input value={nPlatforms} onChange={e => setNPlatforms(e.target.value)} placeholder="ChatGPT | Claude" style={inp} /></div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addVideo} disabled={!nTitle} style={btnAmber}>Create Video</button>
            <button onClick={() => setShowAdd(false)} style={btnGhost}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.map((v, idx) => {
          const isEditing = editingId === v.id;
          return (
            <div key={v.id} style={card}>
              {/* Row header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                  <button onClick={() => moveVideo(v.id, "up")} disabled={idx === 0} style={{ ...posBtn, opacity: idx === 0 ? .3 : 1 }}>▲</button>
                  <button onClick={() => moveVideo(v.id, "down")} disabled={idx === sorted.length - 1} style={{ ...posBtn, opacity: idx === sorted.length - 1 ? .3 : 1 }}>▼</button>
                </div>

                {v.thumbnail_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={v.thumbnail_url} alt="" style={{ width: 52, height: 30, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 52, height: 30, borderRadius: 6, background: "#F0EEE8", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 14 }}>🎬</div>
                )}

                <span style={{ fontSize: 10, fontWeight: 700, color: "#B0ABA5", width: 20, textAlign: "center", flexShrink: 0 }}>#{idx + 1}</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{v.title}</div>
                  <div style={{ fontSize: 11, color: "#9B9199", marginTop: 1 }}>
                    {v.group_name && <span style={{ fontWeight: 700, color: "#221D23" }}>{v.group_name}</span>}
                    {v.category_tag && <span> · {v.category_tag}</span>}
                    {v.duration && <span> · {v.duration}</span>}
                    {!v.video_url && <span style={{ color: "#F68A29", fontWeight: 700 }}> · no video</span>}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => isEditing ? setEditingId(null) : startEdit(v)}
                    style={{ ...btnGhost, padding: "4px 12px", fontSize: 11,
                      ...(isEditing ? { background: "#F0EEE8" } : {}) }}
                  >{isEditing ? "Close" : "Edit"}</button>
                  <ToggleBtn active={v.is_locked} activeColor="#DC2626" activeLabel="🔒 Locked" inactiveLabel="🔓 Open" onClick={() => toggle(v.id, "is_locked")} />
                  <ToggleBtn active={v.is_featured} activeColor="#B08000" activeLabel="★ Featured" inactiveLabel="★ Feature" onClick={() => toggle(v.id, "is_featured")} />
                  <ToggleBtn active={v.is_published} activeColor="#17A855" activeLabel="Live" inactiveLabel="Draft" onClick={() => toggle(v.id, "is_published")} />
                  <button onClick={() => deleteVideo(v.id)} style={{ border: 0, background: "none", color: "#EF4444", cursor: "pointer", fontSize: 15 }}>×</button>
                </div>
              </div>

              {/* Inline edit form */}
              {isEditing && (
                <div style={{ borderTop: "1px solid #F0EEE8", padding: "14px 16px 16px", background: "#FAFAF8" }}>

                  {/* Upload row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={lbl}>Video file</label>
                      <VideoUploadField
                        value={editDraft.video_url || null}
                        onUploaded={url => setEditDraft(d => ({ ...d, video_url: url ?? "" }))}
                        onDuration={d => setEditDraft(prev => ({ ...prev, duration: d }))}
                      />
                    </div>
                    <div>
                      <label style={lbl}>Thumbnail</label>
                      <ImageUploadField
                        value={editDraft.thumbnail_url || null}
                        onUploaded={url => setEditDraft(d => ({ ...d, thumbnail_url: url ?? "" }))}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10, marginBottom: 10 }}>
                    <div><label style={lbl}>Title</label><input value={editDraft.title} onChange={e => setEditDraft(d => ({ ...d, title: e.target.value }))} style={inp} /></div>
                    <div>
                      <label style={lbl}>Duration</label>
                      <input value={editDraft.duration} onChange={e => setEditDraft(d => ({ ...d, duration: e.target.value }))}
                        placeholder="auto" style={{ ...inp, color: editDraft.duration ? "#221D23" : "#9B9199" }} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={lbl}>Description</label>
                    <textarea value={editDraft.description} onChange={e => setEditDraft(d => ({ ...d, description: e.target.value }))} rows={2} style={{ ...inp, resize: "vertical" }} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                    <div>
                      <label style={lbl}>Group</label>
                      <select value={editDraft.group_name} onChange={e => setEditDraft(d => ({ ...d, group_name: e.target.value }))} style={inp}>
                        {GROUP_OPTIONS.map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                    <div><label style={lbl}>Category Tag</label><input value={editDraft.category_tag} onChange={e => setEditDraft(d => ({ ...d, category_tag: e.target.value }))} style={inp} /></div>
                    <div><label style={lbl}>Platforms</label><input value={editDraft.platforms} onChange={e => setEditDraft(d => ({ ...d, platforms: e.target.value }))} placeholder="ChatGPT | Claude" style={inp} /></div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => saveEdit(v.id)} disabled={!editDraft.title} style={btnAmber}>Save changes</button>
                    <button onClick={() => setEditingId(null)} style={btnGhost}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tools Tab ──────────────────────────────────────────────────────────────

type ToolEdit = {
  name: string; category_label: string; description: string;
  icon_emoji: string; letter: string; color: string;
  company_name: string; try_url: string; best_for: string; pricing: string;
};

function ToolsTab({ initTools }: { initTools: Tool[] }) {
  const supabase = createClient();
  const [tools, setTools] = useState(initTools);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ToolEdit>({ name: "", category_label: "", description: "", icon_emoji: "", letter: "", color: "#623CEA", company_name: "", try_url: "", best_for: "", pricing: "Free" });

  const [nName, setNName] = useState("");
  const [nCategory, setNCategory] = useState("");
  const [nDesc, setNDesc] = useState("");
  const [nEmoji, setNEmoji] = useState("");
  const [nLetter, setNLetter] = useState("");
  const [nColor, setNColor] = useState("#623CEA");
  const [nCompany, setNCompany] = useState("");
  const [nUrl, setNUrl] = useState("");
  const [nBestFor, setNBestFor] = useState("");
  const [nPricing, setNPricing] = useState("Free");

  const sorted = [...tools].sort((a, b) => a.sort_order - b.sort_order);

  function startEdit(t: Tool) {
    setEditingId(t.id);
    setEditDraft({
      name: t.name, category_label: t.category_label, description: t.description ?? "",
      icon_emoji: t.icon_emoji ?? "", letter: t.letter ?? "",
      color: t.color ?? "#623CEA", company_name: t.company_name ?? "",
      try_url: t.try_url ?? "", best_for: t.best_for ?? "", pricing: t.pricing ?? "",
    });
  }

  async function saveEdit(id: string) {
    const patch = {
      name: editDraft.name,
      category_label: editDraft.category_label,
      description: editDraft.description || null,
      icon_emoji: editDraft.icon_emoji || null,
      letter: editDraft.letter || null,
      color: editDraft.color || "#623CEA",
      company_name: editDraft.company_name || null,
      try_url: editDraft.try_url || null,
      best_for: editDraft.best_for || null,
      pricing: editDraft.pricing || null,
    };
    const { error } = await supabase.from("fluency_tools").update(patch).eq("id", id);
    if (error) { alert(error.message); return; }
    setTools(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
    setEditingId(null);
  }

  async function addTool() {
    const nextSort = sorted.length > 0 ? sorted[sorted.length - 1].sort_order + 1 : 0;
    const { data, error } = await supabase.from("fluency_tools").insert({
      name: nName, category_label: nCategory, description: nDesc,
      icon_emoji: nEmoji || null, letter: nLetter || null, color: nColor,
      company_name: nCompany || null, try_url: nUrl || null,
      best_for: nBestFor || null, pricing: nPricing,
      is_featured: false, published: false, sort_order: nextSort,
    }).select().single();
    if (!error && data) {
      setTools(prev => [...prev, data as Tool]);
      setNName(""); setNCategory(""); setNDesc(""); setNEmoji(""); setNLetter(""); setNCompany(""); setNUrl(""); setNBestFor(""); setShowAdd(false);
    } else if (error) alert(error.message);
  }

  async function toggle(id: string, field: "published" | "is_featured") {
    const t = tools.find(t => t.id === id);
    if (!t) return;
    const val = !t[field];
    const { error } = await supabase.from("fluency_tools").update({ [field]: val }).eq("id", id);
    if (error) { alert(error.message); return; }
    setTools(prev => prev.map(t => t.id === id ? { ...t, [field]: val } : t));
  }

  async function moveTool(id: string, dir: "up" | "down") {
    const list = [...sorted];
    const idx = list.findIndex(t => t.id === id);
    const ni = dir === "up" ? idx - 1 : idx + 1;
    if (ni < 0 || ni >= list.length) return;
    const r = [...list]; const [m] = r.splice(idx, 1); r.splice(ni, 0, m);
    await Promise.all(r.map((t, i) => supabase.from("fluency_tools").update({ sort_order: i }).eq("id", t.id)));
    setTools(r.map((t, i) => ({ ...t, sort_order: i })));
  }

  async function deleteTool(id: string) {
    if (!confirm("Delete this tool?")) return;
    await supabase.from("fluency_tools").delete().eq("id", id);
    setTools(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Fluency Tools</h2>
          <p style={{ margin: "3px 0 0", color: "#6B6B6B", fontSize: 13 }}>{tools.length} tools · AI tool directory</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={btnAmber}>+ New Tool</button>
      </div>

      {showAdd && (
        <div style={{ ...card, padding: 18, marginBottom: 14, borderColor: "#FFCE00" }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>New Tool</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={lbl}>Name</label><input value={nName} onChange={e => setNName(e.target.value)} placeholder="Tool name" style={inp} /></div>
            <div><label style={lbl}>Category</label><input value={nCategory} onChange={e => setNCategory(e.target.value)} placeholder="e.g. AI Chatbots" style={inp} /></div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>Description</label>
            <textarea value={nDesc} onChange={e => setNDesc(e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={lbl}>Emoji</label><input value={nEmoji} onChange={e => setNEmoji(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Letter fallback</label><input value={nLetter} onChange={e => setNLetter(e.target.value)} placeholder="C" style={inp} /></div>
            <div><label style={lbl}>Accent color</label><input value={nColor} onChange={e => setNColor(e.target.value)} placeholder="#623CEA" style={{ ...inp, fontFamily: "monospace" }} /></div>
            <div><label style={lbl}>Pricing</label><input value={nPricing} onChange={e => setNPricing(e.target.value)} placeholder="Free / Paid" style={inp} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={lbl}>Company</label><input value={nCompany} onChange={e => setNCompany(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Try URL</label><input value={nUrl} onChange={e => setNUrl(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Best For</label><input value={nBestFor} onChange={e => setNBestFor(e.target.value)} style={inp} /></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addTool} disabled={!nName} style={btnAmber}>Create Tool</button>
            <button onClick={() => setShowAdd(false)} style={btnGhost}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.map((t, idx) => {
          const isEditing = editingId === t.id;
          return (
            <div key={t.id} style={card}>
              {/* Row header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                  <button onClick={() => moveTool(t.id, "up")} disabled={idx === 0} style={{ ...posBtn, opacity: idx === 0 ? .3 : 1 }}>▲</button>
                  <button onClick={() => moveTool(t.id, "down")} disabled={idx === sorted.length - 1} style={{ ...posBtn, opacity: idx === sorted.length - 1 ? .3 : 1 }}>▼</button>
                </div>

                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: (isEditing ? editDraft.color : t.color ?? "#623CEA") + "22",
                  border: `1.5px solid ${isEditing ? editDraft.color : t.color ?? "#623CEA"}44`,
                  display: "grid", placeItems: "center",
                  fontSize: (isEditing ? editDraft.icon_emoji : t.icon_emoji) ? 19 : 13,
                  fontWeight: 900, color: isEditing ? editDraft.color : t.color ?? "#623CEA",
                }}>{(isEditing ? editDraft.icon_emoji : t.icon_emoji) || (isEditing ? editDraft.letter : t.letter) || t.name[0]}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "#9B9199", marginTop: 1 }}>
                    {t.category_label}
                    {t.company_name && <span> · {t.company_name}</span>}
                    {t.pricing && <span> · {t.pricing}</span>}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => isEditing ? setEditingId(null) : startEdit(t)}
                    style={{ ...btnGhost, padding: "4px 12px", fontSize: 11,
                      ...(isEditing ? { background: "#F0EEE8", color: "#221D23" } : {}) }}
                  >{isEditing ? "Close" : "Edit"}</button>
                  <ToggleBtn active={t.is_featured} activeColor="#B08000" activeLabel="★ Featured" inactiveLabel="★ Feature" onClick={() => toggle(t.id, "is_featured")} />
                  <ToggleBtn active={t.published} activeColor="#17A855" activeLabel="Live" inactiveLabel="Draft" onClick={() => toggle(t.id, "published")} />
                  <button onClick={() => deleteTool(t.id)} style={{ border: 0, background: "none", color: "#EF4444", cursor: "pointer", fontSize: 15 }}>×</button>
                </div>
              </div>

              {/* Inline edit form */}
              {isEditing && (
                <div style={{ borderTop: "1px solid #F0EEE8", padding: "14px 16px 16px", background: "#FAFAF8" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div><label style={lbl}>Name</label><input value={editDraft.name} onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))} style={inp} /></div>
                    <div><label style={lbl}>Category</label><input value={editDraft.category_label} onChange={e => setEditDraft(d => ({ ...d, category_label: e.target.value }))} style={inp} /></div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={lbl}>Description</label>
                    <textarea value={editDraft.description} onChange={e => setEditDraft(d => ({ ...d, description: e.target.value }))} rows={2} style={{ ...inp, resize: "vertical" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div><label style={lbl}>Emoji</label><input value={editDraft.icon_emoji} onChange={e => setEditDraft(d => ({ ...d, icon_emoji: e.target.value }))} style={inp} /></div>
                    <div><label style={lbl}>Letter fallback</label><input value={editDraft.letter} onChange={e => setEditDraft(d => ({ ...d, letter: e.target.value }))} placeholder="C" style={inp} /></div>
                    <div><label style={lbl}>Accent color</label><input value={editDraft.color} onChange={e => setEditDraft(d => ({ ...d, color: e.target.value }))} style={{ ...inp, fontFamily: "monospace" }} /></div>
                    <div><label style={lbl}>Pricing</label><input value={editDraft.pricing} onChange={e => setEditDraft(d => ({ ...d, pricing: e.target.value }))} placeholder="Free / Paid" style={inp} /></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                    <div><label style={lbl}>Company</label><input value={editDraft.company_name} onChange={e => setEditDraft(d => ({ ...d, company_name: e.target.value }))} style={inp} /></div>
                    <div><label style={lbl}>Try URL</label><input value={editDraft.try_url} onChange={e => setEditDraft(d => ({ ...d, try_url: e.target.value }))} style={inp} /></div>
                    <div><label style={lbl}>Best For</label><input value={editDraft.best_for} onChange={e => setEditDraft(d => ({ ...d, best_for: e.target.value }))} style={inp} /></div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => saveEdit(t.id)} disabled={!editDraft.name} style={btnAmber}>Save changes</button>
                    <button onClick={() => setEditingId(null)} style={btnGhost}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Brief Tab ──────────────────────────────────────────────────────────────

function briefDateOnly(value: string) {
  return value.slice(0, 10);
}

function BriefTab({ initBriefs }: { initBriefs: Brief[] }) {
  const supabase = createClient();
  const [briefs, setBriefs] = useState(initBriefs);
  const [expandedId, setExpandedId] = useState<string | null>(initBriefs[0]?.id ?? null);
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingBriefId, setEditingBriefId] = useState<string | null>(null);
  const [briefDraft, setBriefDraft] = useState<BriefEdit>({ title: "", published_date: "" });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState("");
  const [itemLinkDraft, setItemLinkDraft] = useState("");

  const [nTitle, setNTitle] = useState("");
  const [nDate, setNDate] = useState(new Date().toISOString().slice(0, 10));
  const [nItem, setNItem] = useState("");
  const [nItemLink, setNItemLink] = useState("");

  async function deactivateOtherBriefs(activeId: string) {
    const others = briefs.filter(b => b.id !== activeId && b.is_active);
    if (others.length === 0) return;
    await Promise.all(others.map(b => supabase.from("fluency_briefs").update({ is_active: false }).eq("id", b.id)));
    setBriefs(prev => prev.map(b => b.id === activeId ? b : { ...b, is_active: false }));
  }

  async function addBrief() {
    await deactivateOtherBriefs("__new__");
    const { data, error } = await supabase.from("fluency_briefs")
      .insert({ title: nTitle, published_date: nDate, is_active: true })
      .select().single();
    if (!error && data) {
      setBriefs(prev => [{ ...data, is_active: true, fluency_brief_items: [] }, ...prev.map(b => ({ ...b, is_active: false }))]);
      setNTitle(""); setShowAdd(false); setExpandedId(data.id);
    } else if (error) alert(error.message);
  }

  function startEditBrief(b: Brief) {
    setEditingBriefId(b.id);
    setBriefDraft({ title: b.title, published_date: briefDateOnly(b.published_date) });
    setExpandedId(b.id);
  }

  async function saveBrief(id: string) {
    const patch = { title: briefDraft.title.trim(), published_date: briefDateOnly(briefDraft.published_date) };
    const { data, error } = await supabase.from("fluency_briefs").update(patch).eq("id", id).select("id").maybeSingle();
    if (error) { alert(error.message); return; }
    if (!data) {
      alert("Could not save brief. Run supabase/migrations/20240624_fluency_brief_superadmin_rls.sql in the Supabase SQL editor, then try again.");
      return;
    }
    setBriefs(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
    setEditingBriefId(null);
  }

  async function toggleActive(brief: Brief) {
    if (brief.is_active) {
      const { data, error } = await supabase.from("fluency_briefs").update({ is_active: false }).eq("id", brief.id).select("id").maybeSingle();
      if (error) { alert(error.message); return; }
      if (!data) { alert("Could not update brief status. Check database permissions."); return; }
      setBriefs(prev => prev.map(b => b.id === brief.id ? { ...b, is_active: false } : b));
      return;
    }
    await deactivateOtherBriefs(brief.id);
    const { data, error } = await supabase.from("fluency_briefs").update({ is_active: true }).eq("id", brief.id).select("id").maybeSingle();
    if (error) { alert(error.message); return; }
    if (!data) { alert("Could not activate brief. Check database permissions."); return; }
    setBriefs(prev => prev.map(b => ({ ...b, is_active: b.id === brief.id })));
  }

  async function deleteBrief(id: string) {
    if (!confirm("Delete this brief and all its items?")) return;
    await supabase.from("fluency_briefs").delete().eq("id", id);
    setBriefs(prev => prev.filter(b => b.id !== id));
    if (editingBriefId === id) setEditingBriefId(null);
  }

  async function addItem(briefId: string) {
    const brief = briefs.find(b => b.id === briefId);
    if (!brief) return;
    const nextSort = brief.fluency_brief_items.length > 0
      ? Math.max(...brief.fluency_brief_items.map(i => i.sort_order)) + 1 : 0;
    const { data, error } = await supabase.from("fluency_brief_items")
      .insert({ brief_id: briefId, content: nItem, link_url: nItemLink.trim() || null, sort_order: nextSort })
      .select().single();
    if (!error && data) {
      setBriefs(prev => prev.map(b => b.id === briefId
        ? { ...b, fluency_brief_items: [...b.fluency_brief_items, data as BriefItem] }
        : b));
      setNItem(""); setNItemLink(""); setAddingItemTo(null);
    } else if (error) alert(error.message);
  }

  function startEditItem(item: BriefItem) {
    setEditingItemId(item.id);
    setItemDraft(item.content);
    setItemLinkDraft(item.link_url ?? "");
  }

  async function saveItem(briefId: string, itemId: string) {
    const content = itemDraft.trim();
    if (!content) return;
    const link_url = itemLinkDraft.trim() || null;
    const { data, error } = await supabase.from("fluency_brief_items").update({ content, link_url }).eq("id", itemId).select("id").maybeSingle();
    if (error) { alert(error.message); return; }
    if (!data) {
      alert("Could not save item. Run supabase/migrations/20240624_fluency_brief_superadmin_rls.sql in the Supabase SQL editor, then try again.");
      return;
    }
    setBriefs(prev => prev.map(b => b.id === briefId
      ? { ...b, fluency_brief_items: b.fluency_brief_items.map(i => i.id === itemId ? { ...i, content, link_url } : i) }
      : b));
    setEditingItemId(null);
    setItemDraft("");
    setItemLinkDraft("");
  }

  async function moveItem(briefId: string, itemId: string, dir: "up" | "down") {
    const brief = briefs.find(b => b.id === briefId);
    if (!brief) return;
    const list = [...brief.fluency_brief_items].sort((a, b) => a.sort_order - b.sort_order);
    const idx = list.findIndex(i => i.id === itemId);
    const ni = dir === "up" ? idx - 1 : idx + 1;
    if (ni < 0 || ni >= list.length) return;
    const r = [...list]; const [m] = r.splice(idx, 1); r.splice(ni, 0, m);
    await Promise.all(r.map((item, i) => supabase.from("fluency_brief_items").update({ sort_order: i }).eq("id", item.id)));
    setBriefs(prev => prev.map(b => b.id === briefId
      ? { ...b, fluency_brief_items: r.map((item, i) => ({ ...item, sort_order: i })) }
      : b));
  }

  async function deleteItem(briefId: string, itemId: string) {
    await supabase.from("fluency_brief_items").delete().eq("id", itemId);
    setBriefs(prev => prev.map(b => b.id === briefId
      ? { ...b, fluency_brief_items: b.fluency_brief_items.filter(i => i.id !== itemId) }
      : b));
    if (editingItemId === itemId) setEditingItemId(null);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>AI Briefs</h2>
          <p style={{ margin: "3px 0 0", color: "#6B6B6B", fontSize: 13 }}>{briefs.length} briefs · weekly AI news cards shown on Dashboard</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={btnAmber}>+ New Brief</button>
      </div>

      {showAdd && (
        <div style={{ ...card, padding: 18, marginBottom: 14, borderColor: "#FFCE00" }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>New Brief</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 10, marginBottom: 10 }}>
            <div><label style={lbl}>Title</label><input value={nTitle} onChange={e => setNTitle(e.target.value)} placeholder="This week in AI..." style={inp} /></div>
            <div><label style={lbl}>Published Date</label><input type="date" value={nDate} onChange={e => setNDate(e.target.value)} style={inp} /></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addBrief} disabled={!nTitle} style={btnAmber}>Create Brief</button>
            <button onClick={() => setShowAdd(false)} style={btnGhost}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {briefs.map(b => {
          const open = expandedId === b.id;
          const isEditingBrief = editingBriefId === b.id;
          const items = [...b.fluency_brief_items].sort((a, c) => a.sort_order - c.sort_order);
          return (
            <div key={b.id} style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", cursor: "pointer" }}
                onClick={() => setExpandedId(open ? null : b.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{b.title}</div>
                  <div style={{ fontSize: 11.5, color: "#9B9199", marginTop: 1 }}>
                    {b.published_date} · {items.length} item{items.length !== 1 ? "s" : ""}
                    {b.is_active && <span style={{ color: "#17A855", fontWeight: 700 }}> · Live on dashboard</span>}
                  </div>
                </div>
                <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button
                    onClick={() => isEditingBrief ? setEditingBriefId(null) : startEditBrief(b)}
                    style={{ ...btnGhost, padding: "4px 12px", fontSize: 11,
                      ...(isEditingBrief ? { background: "#F0EEE8", color: "#221D23" } : {}) }}
                  >{isEditingBrief ? "Close" : "Edit"}</button>
                  <ToggleBtn
                    active={b.is_active}
                    activeColor="#17A855"
                    activeLabel="Live"
                    inactiveLabel="Draft"
                    onClick={() => toggleActive(b)}
                  />
                  <button onClick={() => deleteBrief(b.id)} style={{ border: 0, background: "none", color: "#EF4444", cursor: "pointer", fontSize: 15 }}>×</button>
                </div>
                <ChevronIcon open={open} />
              </div>

              {open && (
                <div style={{ borderTop: "1px solid #F0EEE8", padding: "12px 16px 14px" }}>
                  {isEditingBrief && (
                    <div style={{ marginBottom: 12, padding: 14, borderRadius: 12, background: "#FAFAF8", border: "1px solid #F0EEE8" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 10, marginBottom: 10 }}>
                        <div><label style={lbl}>Title</label><input value={briefDraft.title} onChange={e => setBriefDraft(d => ({ ...d, title: e.target.value }))} style={inp} /></div>
                        <div><label style={lbl}>Published Date</label><input type="date" value={briefDraft.published_date} onChange={e => setBriefDraft(d => ({ ...d, published_date: e.target.value }))} style={inp} /></div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => saveBrief(b.id)} disabled={!briefDraft.title} style={{ ...btnAmber, padding: "7px 14px", fontSize: 12 }}>Save brief</button>
                        <button onClick={() => setEditingBriefId(null)} style={{ ...btnGhost, padding: "7px 14px", fontSize: 12 }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {items.map((item, i) => {
                      const isEditingItem = editingItemId === item.id;
                      return (
                        <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "9px 12px", borderRadius: 10, background: "#FAFAF8", border: "1px solid #F0EEE8" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0, paddingTop: 2 }}>
                            <button onClick={() => moveItem(b.id, item.id, "up")} disabled={i === 0} style={{ ...posBtn, opacity: i === 0 ? .3 : 1 }}>▲</button>
                            <button onClick={() => moveItem(b.id, item.id, "down")} disabled={i === items.length - 1} style={{ ...posBtn, opacity: i === items.length - 1 ? .3 : 1 }}>▼</button>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#B0ABA5", paddingTop: 2, flexShrink: 0, minWidth: 16, textAlign: "center" }}>{i + 1}</span>
                          {isEditingItem ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
                              <textarea
                                value={itemDraft}
                                onChange={e => setItemDraft(e.target.value)}
                                rows={3}
                                style={{ ...inp, resize: "vertical" }}
                              />
                              <input
                                type="url"
                                value={itemLinkDraft}
                                onChange={e => setItemLinkDraft(e.target.value)}
                                placeholder="Article URL (https://…)"
                                style={inp}
                              />
                            </div>
                          ) : (
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>{item.content}</p>
                              {item.link_url && (
                                <a href={item.link_url} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 4, color: "#3696FC", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {item.link_url}
                                </a>
                              )}
                            </div>
                          )}
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                            {isEditingItem ? (
                              <>
                                <button onClick={() => saveItem(b.id, item.id)} disabled={!itemDraft.trim()} style={{ ...btnAmber, padding: "4px 10px", fontSize: 11 }}>Save</button>
                                <button onClick={() => setEditingItemId(null)} style={{ ...btnGhost, padding: "4px 10px", fontSize: 11 }}>✕</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEditItem(item)} style={{ ...btnGhost, padding: "4px 10px", fontSize: 11 }}>Edit</button>
                                <button onClick={() => deleteItem(b.id, item.id)} style={{ border: 0, background: "none", color: "#EF4444", cursor: "pointer", fontSize: 14 }}>×</button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {addingItemTo === b.id ? (
                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
                        <textarea
                          value={nItem} onChange={e => setNItem(e.target.value)}
                          placeholder="Brief item text…" rows={2}
                          style={{ ...inp, resize: "vertical" }}
                        />
                        <input
                          type="url"
                          value={nItemLink}
                          onChange={e => setNItemLink(e.target.value)}
                          placeholder="Article URL (https://…)"
                          style={inp}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <button onClick={() => addItem(b.id)} disabled={!nItem} style={{ ...btnAmber, padding: "9px 14px", fontSize: 12 }}>Add</button>
                        <button onClick={() => setAddingItemTo(null)} style={{ ...btnGhost, padding: "9px 14px", fontSize: 12 }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setAddingItemTo(b.id)} style={{ ...btnGhost, marginTop: 10, fontSize: 12, width: "100%", padding: "8px" }}>+ Add Item</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────────────────

type Tab = "modules" | "videos" | "tools" | "brief";
const TABS: { key: Tab; label: string }[] = [
  { key: "modules", label: "Modules" },
  { key: "videos", label: "Videos" },
  { key: "tools",  label: "Tools" },
  { key: "brief",  label: "Brief" },
];

export default function AIFluencyAdminClient({ modules, videos, tools, briefs }: Props) {
  const [tab, setTab] = useState<Tab>("modules");

  return (
    <div>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: "-.04em" }}>AI Fluency</h1>
            <p style={{ margin: "3px 0 0", color: "#6B6B6B", fontSize: 13 }}>Manage foundation modules, videos, tools, and briefs</p>
          </div>
          <Link href="/superadmin" style={{ ...btnGhost, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>← Activities</Link>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 2, borderBottom: "2px solid #E8E6DC", marginBottom: 28 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "10px 20px", border: "none", background: "transparent",
              color: tab === t.key ? "#221D23" : "#6B6B6B",
              fontWeight: tab === t.key ? 800 : 600, fontSize: 13.5,
              cursor: "pointer", fontFamily: "inherit",
              borderBottom: tab === t.key ? "2px solid #FFCE00" : "2px solid transparent",
              marginBottom: -2, transition: "color .12s",
            }}>{t.label}</button>
          ))}
        </div>

        {tab === "modules" && <ModulesTab initModules={modules} />}
        {tab === "videos" && <VideosTab initVideos={videos} />}
        {tab === "tools"  && <ToolsTab  initTools={tools}  />}
        {tab === "brief"  && <BriefTab  initBriefs={briefs} />}
    </div>
  );
}
