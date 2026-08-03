"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CHATBOT_FILTERS, CHATBOT_FILTER_LABELS, type ChatbotFilter } from "@/lib/chatbotFilter";
import type { WhatsNewUpdate } from "@/lib/supabase/types";
import styles from "./whats-new.module.css";

type Props = {
  initialUpdates: WhatsNewUpdate[];
  userId: string;
  migrationReady: boolean;
};

type Draft = {
  tool: ChatbotFilter;
  title: string;
  summary: string;
  tag: string;
  link_url: string;
  published_at: string;
  is_published: boolean;
};

function toLocalDateTime(value: string): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function blankDraft(): Draft {
  return {
    tool: "chatgpt",
    title: "",
    summary: "",
    tag: "New feature",
    link_url: "",
    published_at: toLocalDateTime(new Date().toISOString()),
    is_published: false,
  };
}

function updateToDraft(update: WhatsNewUpdate): Draft {
  return {
    tool: update.tool,
    title: update.title,
    summary: update.summary,
    tag: update.tag,
    link_url: update.link_url ?? "",
    published_at: toLocalDateTime(update.published_at),
    is_published: update.is_published,
  };
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function WhatsNewAdminClient({ initialUpdates, userId, migrationReady }: Props) {
  const supabase = createClient();
  const [updates, setUpdates] = useState(initialUpdates);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function showMessage(text: string, ok = true) {
    setMessage({ text, ok });
    window.setTimeout(() => setMessage(null), 3500);
  }

  function startNew() {
    setDraft(blankDraft());
    setEditingId("new");
  }

  function startEdit(update: WhatsNewUpdate) {
    setDraft(updateToDraft(update));
    setEditingId(update.id);
  }

  function patchDraft(patch: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function saveUpdate() {
    if (!draft.title.trim() || !draft.summary.trim() || !draft.tag.trim()) {
      showMessage("Title, summary, and tag are required.", false);
      return;
    }
    if (!draft.published_at || Number.isNaN(new Date(draft.published_at).getTime())) {
      showMessage("Choose a valid publish date.", false);
      return;
    }
    if (draft.link_url.trim()) {
      try {
        const link = new URL(draft.link_url.trim(), window.location.origin);
        if (!["http:", "https:"].includes(link.protocol)) throw new Error("Unsupported link");
      } catch {
        showMessage("Use a valid http or https link.", false);
        return;
      }
    }

    setSaving(true);
    const payload = {
      tool: draft.tool,
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      tag: draft.tag.trim(),
      link_url: draft.link_url.trim() || null,
      is_published: draft.is_published,
      published_at: new Date(draft.published_at).toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (editingId === "new") {
      const { data, error } = await supabase
        .from("whats_new_updates")
        .insert({ ...payload, created_by: userId })
        .select("*")
        .single();
      if (error || !data) {
        showMessage(error?.message ?? "Couldn’t create the update.", false);
        setSaving(false);
        return;
      }
      setUpdates((current) => [data as WhatsNewUpdate, ...current]);
      showMessage(draft.is_published ? "Update published." : "Draft created.");
    } else if (editingId) {
      const { data, error } = await supabase
        .from("whats_new_updates")
        .update(payload)
        .eq("id", editingId)
        .select("*")
        .single();
      if (error || !data) {
        showMessage(error?.message ?? "Couldn’t save the update.", false);
        setSaving(false);
        return;
      }
      setUpdates((current) => current.map((item) => item.id === editingId ? data as WhatsNewUpdate : item));
      showMessage("Update saved.");
    }

    setEditingId(null);
    setSaving(false);
  }

  async function togglePublished(update: WhatsNewUpdate) {
    const nextPublished = !update.is_published;
    const { data, error } = await supabase
      .from("whats_new_updates")
      .update({
        is_published: nextPublished,
        published_at: nextPublished ? new Date().toISOString() : update.published_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", update.id)
      .select("*")
      .single();

    if (error || !data) {
      showMessage(error?.message ?? "Couldn’t change the publish status.", false);
      return;
    }
    setUpdates((current) => current.map((item) => item.id === update.id ? data as WhatsNewUpdate : item));
    showMessage(nextPublished ? "Update published." : "Update moved to drafts.");
  }

  async function deleteUpdate(update: WhatsNewUpdate) {
    if (!window.confirm(`Delete “${update.title}”? This cannot be undone.`)) return;
    const { error } = await supabase.from("whats_new_updates").delete().eq("id", update.id);
    if (error) {
      showMessage(error.message, false);
      return;
    }
    setUpdates((current) => current.filter((item) => item.id !== update.id));
    if (editingId === update.id) setEditingId(null);
    showMessage("Update deleted.");
  }

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span>ASK AI CONTENT</span>
          <h1>What’s new</h1>
          <p>Create and publish the release notes learners see in the Ask AI drawer.</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/ask-ai" target="_blank">Preview Ask AI ↗</Link>
          <button type="button" onClick={startNew}>+ Add update</button>
        </div>
      </header>

      {!migrationReady ? (
        <div className={styles.migrationNotice}>
          Apply <code>20260730_whats_new_updates.sql</code> before creating updates.
        </div>
      ) : null}

      {message ? (
        <div className={`${styles.message} ${message.ok ? styles.messageSuccess : styles.messageError}`} role="status">
          {message.text}
        </div>
      ) : null}

      {editingId ? (
        <section className={styles.editor} aria-labelledby="update-editor-title">
          <div className={styles.editorHeading}>
            <div>
              <span>{editingId === "new" ? "NEW RELEASE NOTE" : "EDIT RELEASE NOTE"}</span>
              <h2 id="update-editor-title">{editingId === "new" ? "Add update" : "Edit update"}</h2>
            </div>
            <button type="button" className={styles.closeButton} onClick={() => setEditingId(null)} aria-label="Close editor">×</button>
          </div>

          <div className={styles.formGrid}>
            <label>
              <span>AI tool</span>
              <select value={draft.tool} onChange={(event) => patchDraft({ tool: event.target.value as ChatbotFilter })}>
                {CHATBOT_FILTERS.map((tool) => <option value={tool} key={tool}>{CHATBOT_FILTER_LABELS[tool]}</option>)}
              </select>
            </label>
            <label>
              <span>Update tag</span>
              <input value={draft.tag} maxLength={50} onChange={(event) => patchDraft({ tag: event.target.value })} placeholder="New feature" />
            </label>
            <label className={styles.fullWidth}>
              <span>Title</span>
              <input value={draft.title} maxLength={160} onChange={(event) => patchDraft({ title: event.target.value })} placeholder="Describe the release in one line" />
            </label>
            <label className={styles.fullWidth}>
              <span>Summary</span>
              <textarea value={draft.summary} maxLength={1000} rows={4} onChange={(event) => patchDraft({ summary: event.target.value })} placeholder="Explain what changed and why it is useful." />
            </label>
            <label>
              <span>Optional link</span>
              <input type="url" value={draft.link_url} onChange={(event) => patchDraft({ link_url: event.target.value })} placeholder="https://…" />
            </label>
            <label>
              <span>Publish date</span>
              <input type="datetime-local" required value={draft.published_at} onChange={(event) => patchDraft({ published_at: event.target.value })} />
            </label>
          </div>

          <label className={styles.publishCheck}>
            <input type="checkbox" checked={draft.is_published} onChange={(event) => patchDraft({ is_published: event.target.checked })} />
            <span>
              <strong>Publish in Ask AI</strong>
              <small>Drafts remain visible only to Superadmins.</small>
            </span>
          </label>

          <div className={styles.editorActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setEditingId(null)}>Cancel</button>
            <button type="button" className={styles.primaryButton} disabled={saving || !migrationReady} onClick={() => void saveUpdate()}>
              {saving ? "Saving…" : draft.is_published ? "Save and publish" : "Save draft"}
            </button>
          </div>
        </section>
      ) : null}

      <section className={styles.listSection}>
        <div className={styles.listHeading}>
          <h2>Release notes</h2>
          <span>{updates.filter((update) => update.is_published).length} published · {updates.filter((update) => !update.is_published).length} drafts</span>
        </div>

        {updates.length > 0 ? (
          <div className={styles.updateList}>
            {updates.map((update) => (
              <article className={styles.updateCard} key={update.id}>
                <div className={styles.cardTop}>
                  <div className={styles.cardMeta}>
                    <span className={styles.toolBadge}>{CHATBOT_FILTER_LABELS[update.tool]}</span>
                    <span className={update.is_published ? styles.publishedBadge : styles.draftBadge}>
                      {update.is_published ? "Published" : "Draft"}
                    </span>
                    <time dateTime={update.published_at}>{formatDate(update.published_at)}</time>
                  </div>
                  <span className={styles.tag}>{update.tag}</span>
                </div>
                <h3>{update.title}</h3>
                <p>{update.summary}</p>
                {update.link_url ? <a href={update.link_url} target="_blank" rel="noreferrer">{update.link_url} ↗</a> : null}
                <footer>
                  <button type="button" onClick={() => startEdit(update)}>Edit</button>
                  <button type="button" onClick={() => void togglePublished(update)}>
                    {update.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button type="button" className={styles.deleteButton} onClick={() => void deleteUpdate(update)}>Delete</button>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span aria-hidden="true">✦</span>
            <h3>No release notes yet</h3>
            <p>Add an update, then publish it when it is ready for learners.</p>
            <button type="button" onClick={startNew}>Add the first update</button>
          </div>
        )}
      </section>
    </main>
  );
}
