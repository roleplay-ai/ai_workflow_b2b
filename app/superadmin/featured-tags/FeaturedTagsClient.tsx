"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ActivityTag } from "@/lib/supabase/types";

type TagRow = Pick<
  ActivityTag,
  "id" | "name" | "icon_url" | "is_featured" | "featured_description" | "featured_position" | "created_at"
>;

type Props = {
  tags: TagRow[];
};

type Draft = {
  is_featured: boolean;
  featured_description: string;
};

const btn: React.CSSProperties = {
  padding: "7px 14px", borderRadius: 999, border: "1.5px solid #E8E6DC",
  background: "white", color: "#221D23", fontWeight: 700, cursor: "pointer",
  fontFamily: "inherit", fontSize: 12.5, transition: "all .15s",
};
const btnPrimary: React.CSSProperties = {
  ...btn, background: "#FFCE00", border: "1.5px solid #E8B800", color: "#221D23",
};

function draftsFromTags(tags: TagRow[]): Record<string, Draft> {
  return Object.fromEntries(
    tags.map(t => [
      t.id,
      {
        is_featured: t.is_featured ?? false,
        featured_description: t.featured_description ?? "",
      },
    ])
  );
}

export default function FeaturedTagsClient({ tags: initTags }: Props) {
  const supabase = createClient();
  const [tags, setTags] = useState<TagRow[]>(initTags);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => draftsFromTags(initTags));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const featuredCount = Object.values(drafts).filter(d => d.is_featured).length;
  const dirty = tags.some(t => {
    const d = drafts[t.id];
    if (!d) return false;
    return d.is_featured !== (t.is_featured ?? false)
      || (d.featured_description.trim() || null) !== (t.featured_description ?? null);
  });

  function toast(text: string, ok = true) {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 3500);
  }

  function setDraft(id: string, patch: Partial<Draft>) {
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function saveAll() {
    setSaving(true);
    let position = 0;
    const updates = tags.map(tag => {
      const d = drafts[tag.id];
      const is_featured = d?.is_featured ?? false;
      const featured_description = is_featured ? (d?.featured_description.trim() || null) : null;
      const featured_position = is_featured ? position++ : 0;
      return { id: tag.id, is_featured, featured_description, featured_position };
    });

    const results = await Promise.all(
      updates.map(u =>
        supabase
          .from("activity_tags")
          .update({
            is_featured: u.is_featured,
            featured_description: u.featured_description,
            featured_position: u.featured_position,
          })
          .eq("id", u.id)
      )
    );

    const failed = results.find(r => r.error);
    if (failed?.error) {
      toast(`Failed to save: ${failed.error.message}`, false);
      setSaving(false);
      return;
    }

    setTags(prev =>
      prev.map(tag => {
        const u = updates.find(x => x.id === tag.id)!;
        return { ...tag, ...u };
      })
    );
    toast(`Saved ${featuredCount} featured tag${featuredCount === 1 ? "" : "s"}.`);
    setSaving(false);
  }

  return (
    <div style={{ padding: "28px 32px 48px", maxWidth: 860 }}>
      <div style={{ marginBottom: 6 }}>
        <Link href="/superadmin" style={{ fontSize: 12.5, fontWeight: 700, color: "#6B6B6B", textDecoration: "none" }}>
          ← Back to Activities
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: "-.03em", color: "#221D23" }}>
            Featured Tags
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#6B6B6B", lineHeight: 1.5, maxWidth: 520 }}>
            Choose which tags appear in the learner topbar spotlight panel. Tick a tag and add a short description for each featured tag.
          </p>
        </div>
        <button
          type="button"
          onClick={saveAll}
          disabled={saving || !dirty}
          style={{ ...btnPrimary, opacity: saving || !dirty ? 0.55 : 1, cursor: saving || !dirty ? "not-allowed" : "pointer" }}
        >
          {saving ? "Saving…" : `Save${featuredCount > 0 ? ` (${featuredCount})` : ""}`}
        </button>
      </div>

      {message && (
        <div style={{
          marginBottom: 16, padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: message.ok ? "rgba(35,206,104,.1)" : "rgba(239,68,68,.08)",
          color: message.ok ? "#166534" : "#B91C1C",
          border: `1px solid ${message.ok ? "rgba(35,206,104,.25)" : "rgba(239,68,68,.25)"}`,
        }}>
          {message.text}
        </div>
      )}

      {tags.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", color: "#6B6B6B", border: "1px dashed #E8E6DC", borderRadius: 14 }}>
          No tags yet. Create tags from the Activities page or Tool Logos page first.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tags.map(tag => {
            const draft = drafts[tag.id] ?? { is_featured: false, featured_description: "" };
            return (
              <div
                key={tag.id}
                style={{
                  padding: 16, borderRadius: 14, border: `1.5px solid ${draft.is_featured ? "rgba(255,206,0,.45)" : "#E8E6DC"}`,
                  background: draft.is_featured ? "#FFFBEB" : "#FAFAF8",
                  transition: "border-color .15s, background .15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, cursor: "pointer", minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={draft.is_featured}
                      onChange={e => setDraft(tag.id, { is_featured: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: "#FFCE00", flexShrink: 0, marginTop: 2 }}
                    />
                    {tag.icon_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tag.icon_url}
                        alt={tag.name}
                        width={36}
                        height={36}
                        style={{ objectFit: "contain", borderRadius: 8, border: "1px solid #E8E6DC", flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, border: "1px solid #E8E6DC",
                        background: "#F0EEE8", display: "grid", placeItems: "center",
                        fontSize: 11, fontWeight: 800, color: "#6B6B6B", flexShrink: 0,
                      }}>
                        {tag.name.slice(0, 3).toUpperCase()}
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#221D23" }}>{tag.name}</div>
                      <div style={{ fontSize: 12, color: "#8C8595", marginTop: 2 }}>
                        {draft.is_featured ? "Shown in learner topbar" : "Not featured"}
                      </div>
                    </div>
                  </label>
                </div>

                {draft.is_featured && (
                  <div style={{ marginTop: 12, marginLeft: 30 }}>
                    <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#6B6B6B", marginBottom: 6, letterSpacing: ".03em", textTransform: "uppercase" }}>
                      Description
                    </label>
                    <textarea
                      value={draft.featured_description}
                      onChange={e => setDraft(tag.id, { featured_description: e.target.value })}
                      placeholder="Short description shown to learners in the spotlight panel…"
                      rows={2}
                      style={{
                        width: "100%", resize: "vertical", minHeight: 64, padding: "10px 12px",
                        borderRadius: 10, border: "1.5px solid #E8E6DC", background: "#fff",
                        fontSize: 13, fontFamily: "inherit", lineHeight: 1.45, color: "#221D23",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
