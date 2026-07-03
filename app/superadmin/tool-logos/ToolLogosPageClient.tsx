"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ToolLogosManager from "@/components/ToolLogosManager";
import type { ActivityTag, ActivityCategory } from "@/lib/supabase/types";
import type { ToolLogoMap } from "@/lib/toolLogos";

type CatalogItem = Pick<ActivityTag, "id" | "name" | "icon_url">;

type Props = {
  toolLogos: ToolLogoMap;
  tags: CatalogItem[];
  categories: Pick<ActivityCategory, "id" | "name" | "icon_url">[];
};

function CatalogGrid({
  items,
  uploading,
  onUpload,
  onRemoveLogo,
  onDelete,
  deleteLabel,
}: {
  items: CatalogItem[];
  uploading: string | null;
  onUpload: (id: string, name: string, file: File) => void;
  onRemoveLogo: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
  deleteLabel: string;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
      {items.map(item => {
        const busy = uploading === item.id;
        return (
          <div key={item.id} style={{ padding: 12, borderRadius: 12, border: "1px solid #E8E6DC", background: "#FAFAF8" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              {item.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.icon_url} alt={item.name} width={32} height={32} style={{ objectFit: "contain", borderRadius: 6, border: "1px solid #E8E6DC" }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid #E8E6DC", background: "#F0EEE8", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800, color: "#6B6B6B" }}>
                  {item.name.slice(0, 3).toUpperCase()}
                </div>
              )}
              <span style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</span>
            </div>
            <label style={{ display: "block", marginBottom: 8 }}>
              <input
                type="file"
                accept="image/*"
                disabled={busy}
                style={{ fontSize: 11, width: "100%" }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(item.id, item.name, file);
                  e.target.value = "";
                }}
              />
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              {item.icon_url && (
                <button type="button" disabled={busy} onClick={() => onRemoveLogo(item.id, item.name)}
                  style={{ ...btnGhost, padding: "5px 10px", fontSize: 11 }}>
                  {busy ? "…" : "Remove logo"}
                </button>
              )}
              <button type="button" disabled={busy} onClick={() => onDelete(item.id, item.name)}
                style={{ ...btnGhost, padding: "5px 10px", fontSize: 11, borderColor: "rgba(239,68,68,.3)", color: "#B91C1C" }}>
                {busy ? "…" : deleteLabel}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ToolLogosPageClient({ toolLogos, tags: initTags, categories: initCategories }: Props) {
  const supabase = createClient();
  const [tags, setTags] = useState(initTags);
  const [categories, setCategories] = useState(initCategories);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function uploadTagLogo(tagId: string, tagName: string, file: File) {
    if (!file.type.startsWith("image/")) { setMessage("Please choose an image file."); return; }
    if (file.size > 512 * 1024) { setMessage("Logo must be 512 KB or smaller."); return; }

    setUploading(tagId);
    setMessage(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `tag-${tagName.toLowerCase().replace(/\s+/g, "-")}.${ext}`;

    const { error: storageErr } = await supabase.storage
      .from("activity-icons")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (storageErr) { setMessage(`Upload failed: ${storageErr.message}`); setUploading(null); return; }

    const { data: { publicUrl } } = supabase.storage.from("activity-icons").getPublicUrl(path);
    const iconUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: dbErr } = await supabase.from("activity_tags").update({ icon_url: iconUrl }).eq("id", tagId);
    if (dbErr) { setMessage(`DB error: ${dbErr.message}`); setUploading(null); return; }

    setTags(prev => prev.map(t => t.id === tagId ? { ...t, icon_url: iconUrl } : t));
    setUploading(null);
    setMessage(`Logo uploaded for ${tagName}.`);
  }

  async function removeTagLogo(tagId: string, tagName: string) {
    if (!confirm(`Remove logo for tag "${tagName}"?`)) return;
    setUploading(tagId);
    await supabase.from("activity_tags").update({ icon_url: null }).eq("id", tagId);
    setTags(prev => prev.map(t => t.id === tagId ? { ...t, icon_url: null } : t));
    setUploading(null);
    setMessage(`Removed logo for ${tagName}.`);
  }

  async function deleteTag(tagId: string, tagName: string) {
    if (!confirm(`Delete tag "${tagName}"? It will be removed from all activities.`)) return;
    setUploading(tagId);
    await supabase.from("activity_tags").delete().eq("id", tagId);
    setTags(prev => prev.filter(t => t.id !== tagId));
    setUploading(null);
    setMessage(`Deleted tag "${tagName}".`);
  }

  async function uploadCatalogIcon(
    table: "activity_tags" | "activity_categories",
    folder: string,
    itemId: string,
    itemName: string,
    file: File,
    onUpdated: (iconUrl: string) => void,
  ) {
    if (!file.type.startsWith("image/")) { setMessage("Please choose an image file."); return; }
    if (file.size > 512 * 1024) { setMessage("Logo must be 512 KB or smaller."); return; }

    setUploading(itemId);
    setMessage(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${folder}-${itemName.toLowerCase().replace(/\s+/g, "-")}.${ext}`;

    const { error: storageErr } = await supabase.storage
      .from("activity-icons")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (storageErr) { setMessage(`Upload failed: ${storageErr.message}`); setUploading(null); return; }

    const { data: { publicUrl } } = supabase.storage.from("activity-icons").getPublicUrl(path);
    const iconUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: dbErr } = await supabase.from(table).update({ icon_url: iconUrl }).eq("id", itemId);
    if (dbErr) { setMessage(`DB error: ${dbErr.message}`); setUploading(null); return; }

    onUpdated(iconUrl);
    setUploading(null);
    setMessage(`Logo uploaded for ${itemName}.`);
  }

  async function uploadCategoryLogo(catId: string, catName: string, file: File) {
    await uploadCatalogIcon("activity_categories", "category", catId, catName, file, iconUrl => {
      setCategories(prev => prev.map(c => c.id === catId ? { ...c, icon_url: iconUrl } : c));
    });
  }

  async function removeCategoryLogo(catId: string, catName: string) {
    if (!confirm(`Remove logo for category "${catName}"?`)) return;
    setUploading(catId);
    await supabase.from("activity_categories").update({ icon_url: null }).eq("id", catId);
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, icon_url: null } : c));
    setUploading(null);
    setMessage(`Removed logo for ${catName}.`);
  }

  async function deleteCategory(catId: string, catName: string) {
    if (!confirm(`Delete category "${catName}"? It will be removed from all activities.`)) return;
    setUploading(catId);
    await supabase.from("activity_categories").delete().eq("id", catId);
    setCategories(prev => prev.filter(c => c.id !== catId));
    setUploading(null);
    setMessage(`Deleted category "${catName}".`);
  }

  const messageStyle = {
    margin: "0 0 12px" as const,
    fontSize: 12,
    fontWeight: 600,
    color: message && (message.startsWith("Upload failed") || message.includes("error") || message.includes("DB")) ? "#B91C1C" : "#17A855",
  };

  return (
    <div>
        <div style={{ marginBottom: 22 }}>
          <Link href="/superadmin" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 12, fontSize: 13, fontWeight: 600, color: "#6B6B6B", textDecoration: "none" }}>
            ← Activities
          </Link>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: "-.04em" }}>Tool logos</h1>
          <p style={{ margin: "3px 0 0", color: "#6B6B6B", fontSize: 13 }}>
            Add tools, upload logos, and manage what appears in dashboard filters.
          </p>
        </div>

        <ToolLogosManager initialLogos={toolLogos} />

        {(tags.length > 0 || categories.length > 0) && message && (
          <p style={{ ...messageStyle, marginTop: 32 }}>{message}</p>
        )}

        {tags.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900, letterSpacing: "-.03em" }}>Tags</h2>
            <p style={{ margin: "0 0 14px", color: "#6B6B6B", fontSize: 13 }}>
              Upload icons for tags and delete tags you no longer need.
            </p>
            <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 18, padding: 18, boxShadow: "0 2px 12px rgba(34,29,35,.06)" }}>
              <CatalogGrid
                items={tags}
                uploading={uploading}
                onUpload={(id, name, file) => void uploadTagLogo(id, name, file)}
                onRemoveLogo={(id, name) => void removeTagLogo(id, name)}
                onDelete={(id, name) => void deleteTag(id, name)}
                deleteLabel="Delete tag"
              />
            </div>
          </div>
        )}

        {categories.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900, letterSpacing: "-.03em" }}>Categories</h2>
            <p style={{ margin: "0 0 14px", color: "#6B6B6B", fontSize: 13 }}>
              Upload icons for job categories and delete categories you no longer need.
            </p>
            <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 18, padding: 18, boxShadow: "0 2px 12px rgba(34,29,35,.06)" }}>
              <CatalogGrid
                items={categories}
                uploading={uploading}
                onUpload={(id, name, file) => void uploadCategoryLogo(id, name, file)}
                onRemoveLogo={(id, name) => void removeCategoryLogo(id, name)}
                onDelete={(id, name) => void deleteCategory(id, name)}
                deleteLabel="Delete category"
              />
            </div>
          </div>
        )}
    </div>
  );
}

const btnGhost: React.CSSProperties = {
  borderRadius: 999,
  border: "1.5px solid #E8E6DC",
  background: "white",
  color: "#6B6B6B",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};
