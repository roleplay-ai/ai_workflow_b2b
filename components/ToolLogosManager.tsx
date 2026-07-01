"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatToolLabel, normalizeToolSlug, sortToolSlugs } from "@/lib/tools";
import type { ToolLogoMap } from "@/lib/toolLogos";
import ToolIcon from "@/components/ToolIcon";

type Props = {
  initialLogos: ToolLogoMap;
};

export default function ToolLogosManager({ initialLogos }: Props) {
  const supabase = createClient();
  const [logos, setLogos] = useState<ToolLogoMap>(initialLogos);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [newToolName, setNewToolName] = useState("");
  const [newToolFile, setNewToolFile] = useState<File | null>(null);
  const [addingTool, setAddingTool] = useState(false);

  const tools = useMemo(() => sortToolSlugs(Object.keys(logos)), [logos]);

  async function uploadLogo(tool: string, file: File) {
    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file (PNG, JPG, SVG, or WebP).");
      return;
    }
    if (file.size > 512 * 1024) {
      setMessage("Logo must be 512 KB or smaller.");
      return;
    }

    setUploading(tool);
    setMessage(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${tool}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from("tool-logos")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (storageError) {
      setMessage(`Upload failed: ${storageError.message}`);
      setUploading(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("tool-logos").getPublicUrl(path);
    const logoUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: dbError } = await supabase
      .from("tool_logos")
      .upsert({ tool, logo_url: logoUrl, updated_at: new Date().toISOString() });

    if (dbError) {
      setMessage(`Saved file but database error: ${dbError.message}. Run migration_003_tool_logos.sql if the table is missing.`);
      setUploading(null);
      return;
    }

    setLogos(prev => ({ ...prev, [tool]: logoUrl }));
    setUploading(null);
    setMessage(`Uploaded logo for ${formatToolLabel(tool)}.`);
  }

  async function removeTool(tool: string) {
    if (!confirm(`Remove "${formatToolLabel(tool)}"? It will disappear from filters until added again.`)) return;
    setUploading(tool);
    setMessage(null);

    await supabase.from("tool_logos").delete().eq("tool", tool);

    const { data: files } = await supabase.storage.from("tool-logos").list();
    const toRemove = (files ?? []).filter(f => f.name.startsWith(`${tool}.`)).map(f => f.name);
    if (toRemove.length) {
      await supabase.storage.from("tool-logos").remove(toRemove);
    }

    setLogos(prev => {
      const next = { ...prev };
      delete next[tool];
      return next;
    });
    setUploading(null);
    setMessage(`Removed ${formatToolLabel(tool)}.`);
  }

  async function addTool(e: React.FormEvent) {
    e.preventDefault();
    const slug = normalizeToolSlug(newToolName);
    if (!slug) {
      setMessage("Enter a valid tool name.");
      return;
    }
    if (slug in logos) {
      setMessage(`${formatToolLabel(slug)} already exists.`);
      return;
    }

    setAddingTool(true);
    setMessage(null);

    let logoUrl = "";
    if (newToolFile) {
      const ext = newToolFile.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${slug}.${ext}`;
      const { error: storageError } = await supabase.storage
        .from("tool-logos")
        .upload(path, newToolFile, { upsert: true, contentType: newToolFile.type });

      if (storageError) {
        setMessage(`Upload failed: ${storageError.message}`);
        setAddingTool(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("tool-logos").getPublicUrl(path);
      logoUrl = `${publicUrl}?t=${Date.now()}`;
    }

    const { error: dbError } = await supabase
      .from("tool_logos")
      .upsert({ tool: slug, logo_url: logoUrl, updated_at: new Date().toISOString() });

    if (dbError) {
      setMessage(`Database error: ${dbError.message}`);
      setAddingTool(false);
      return;
    }

    setLogos(prev => ({ ...prev, [slug]: logoUrl }));
    setNewToolName("");
    setNewToolFile(null);
    setAddingTool(false);
    setMessage(`Added ${formatToolLabel(slug)}. It will appear in dashboard filters.`);
  }

  return (
    <div style={card}>
      {message && (
        <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 600, color: message.startsWith("Upload failed") || message.includes("error") || message.includes("valid") || message.includes("already") ? "#B91C1C" : "#17A855" }}>
          {message}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
        {tools.map(tool => {
          const logoUrl = logos[tool];
          const busy = uploading === tool;
          return (
            <div key={tool} style={{ padding: 12, borderRadius: 12, border: "1px solid #E8E6DC", background: "#FAFAF8" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <ToolIcon tool={tool} size={32} logos={logos} />
                <span style={{ fontWeight: 700, fontSize: 13 }}>{formatToolLabel(tool)}</span>
              </div>
              <label style={{ display: "block", marginBottom: 8 }}>
                <input
                  type="file"
                  accept="image/*"
                  disabled={busy}
                  style={{ fontSize: 11, width: "100%" }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) void uploadLogo(tool, file);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() => removeTool(tool)}
                style={{ ...btnGhost, padding: "5px 10px", fontSize: 11, borderColor: "rgba(239,68,68,.3)", color: "#B91C1C" }}
              >
                {busy ? "…" : "Remove tool"}
              </button>
            </div>
          );
        })}
      </div>

      <form onSubmit={addTool} style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #F0EDE8", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#221D23" }}>Add a tool</div>
        <p style={{ margin: 0, fontSize: 12, color: "#6B6B6B" }}>
          New tools appear in dashboard filters and activity pickers immediately.
        </p>
        <input
          value={newToolName}
          onChange={e => setNewToolName(e.target.value)}
          placeholder="Tool name (e.g. Perplexity)"
          style={{ padding: "9px 12px", borderRadius: 10, border: "1.5px solid #E8E6DC", fontSize: 13, fontFamily: "inherit" }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#6B6B6B", cursor: "pointer" }}>
          {newToolFile ? <span style={{ color: "#17A855" }}>✓ {newToolFile.name}</span> : "Logo image (optional)"}
          <input type="file" accept="image/*" onChange={e => setNewToolFile(e.target.files?.[0] ?? null)} style={{ display: "none" }} />
        </label>
        <button
          type="submit"
          disabled={addingTool || !newToolName.trim()}
          style={{ alignSelf: "flex-start", padding: "8px 18px", borderRadius: 999, border: 0, background: "#FFCE00", color: "#221D23", fontWeight: 800, fontSize: 13, cursor: addingTool || !newToolName.trim() ? "default" : "pointer", opacity: addingTool || !newToolName.trim() ? .5 : 1 }}
        >
          {addingTool ? "Adding…" : "Add tool"}
        </button>
      </form>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "white",
  border: "1px solid #E8E6DC",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 2px 12px rgba(34,29,35,.06)",
};

const btnGhost: React.CSSProperties = {
  borderRadius: 999,
  border: "1.5px solid #E8E6DC",
  background: "white",
  color: "#6B6B6B",
  fontWeight: 700,
  cursor: "pointer",
};
