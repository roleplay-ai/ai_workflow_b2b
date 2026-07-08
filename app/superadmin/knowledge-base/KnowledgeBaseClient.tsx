"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type DocStatus = "pending" | "processing" | "ready" | "error";

type DocRow = {
  id: string;
  title: string;
  description: string | null;
  page_count: number | null;
  status: DocStatus;
  error_message: string | null;
  created_at: string;
};

type PageRow = { page_number: number; raw_text: string | null };
type ImageRow = { page_number: number; image_path: string; width: number | null; height: number | null; imageUrl: string };

type Props = { documents: DocRow[] };

const btn: React.CSSProperties = {
  padding: "7px 14px", borderRadius: 999, border: "1.5px solid #E8E6DC",
  background: "white", color: "#221D23", fontWeight: 700, cursor: "pointer",
  fontFamily: "inherit", fontSize: 12.5, transition: "all .15s",
};
const btnPrimary: React.CSSProperties = { ...btn, background: "#FFCE00", border: "1.5px solid #E8B800", color: "#221D23" };
const btnDanger: React.CSSProperties = { ...btn, borderColor: "rgba(239,68,68,.3)", color: "#DC2626", background: "rgba(239,68,68,.05)" };

const STATUS_STYLE: Record<DocStatus, { bg: string; fg: string; label: string }> = {
  pending:    { bg: "#F0EEE8", fg: "#746F78", label: "Pending" },
  processing: { bg: "#EAF3FF", fg: "#1D4ED8", label: "Processing…" },
  ready:      { bg: "#EDFBF3", fg: "#065F46", label: "Ready" },
  error:      { bg: "#FEF2F2", fg: "#991B1B", label: "Error" },
};

function StatusBadge({ status }: { status: DocStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 999,
      background: s.bg, color: s.fg, fontSize: 11, fontWeight: 800,
      textTransform: "uppercase", letterSpacing: ".04em",
    }}>
      {s.label}
    </span>
  );
}

export default function KnowledgeBaseClient({ documents: initDocs }: Props) {
  const supabase = createClient();
  const [documents, setDocuments] = useState<DocRow[]>(initDocs);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ pages: PageRow[]; images: ImageRow[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  function toast(text: string, ok = true) {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 4000);
  }

  async function refreshDocuments() {
    const res = await fetch("/api/superadmin/knowledge-base");
    if (!res.ok) return;
    const { documents: docs } = await res.json();
    setDocuments(docs ?? []);
  }

  async function pollIngestion(id: string) {
    setBusyId(id);
    try {
      for (;;) {
        const res = await fetch(`/api/superadmin/knowledge-base/${id}/process`, { method: "POST" });
        const body = await res.json();
        await refreshDocuments();
        if (!res.ok) {
          toast(`Ingestion failed: ${body.error ?? "unknown error"}`, false);
          break;
        }
        if (body.done) {
          toast("Document ready.");
          break;
        }
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { toast("Choose a PDF file first.", false); return; }
    if (file.type !== "application/pdf") { toast("Only PDF files are supported.", false); return; }
    if (!title.trim()) { toast("Title is required.", false); return; }

    setUploading(true);
    const id = crypto.randomUUID();
    const storagePath = `${id}.pdf`;

    const { error: uploadErr } = await supabase.storage
      .from("kb-documents")
      .upload(storagePath, file, { contentType: "application/pdf" });

    if (uploadErr) {
      toast(`Upload failed: ${uploadErr.message}`, false);
      setUploading(false);
      return;
    }

    const res = await fetch("/api/superadmin/knowledge-base", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title: title.trim(), description: description.trim() || null, storagePath }),
    });
    const body = await res.json();

    if (!res.ok) {
      toast(`Failed to register document: ${body.error ?? "unknown error"}`, false);
      setUploading(false);
      return;
    }

    setDocuments((prev) => [body.document, ...prev]);
    setTitle("");
    setDescription("");
    setFile(null);
    setUploading(false);
    toast(`Uploaded "${body.document.title}" — ingesting…`);
    void pollIngestion(id);
  }

  async function handleReprocess(doc: DocRow) {
    if (doc.status === "error") {
      await supabase.from("kb_documents").update({ status: "pending", error_message: null }).eq("id", doc.id);
      await refreshDocuments();
    }
    void pollIngestion(doc.id);
  }

  async function handleDelete(doc: DocRow) {
    if (!confirm(`Delete "${doc.title}"? This removes its pages, extracted images, and chunks.`)) return;
    setBusyId(doc.id);
    const res = await fetch(`/api/superadmin/knowledge-base/${doc.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast(`Delete failed: ${body.error ?? "unknown error"}`, false);
    } else {
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      if (expandedId === doc.id) { setExpandedId(null); setDetail(null); }
      toast(`Deleted "${doc.title}".`);
    }
    setBusyId(null);
  }

  async function toggleDetail(doc: DocRow) {
    if (expandedId === doc.id) { setExpandedId(null); setDetail(null); return; }
    setExpandedId(doc.id);
    setDetail(null);
    setDetailLoading(true);
    const res = await fetch(`/api/superadmin/knowledge-base/${doc.id}`);
    const body = await res.json();
    if (res.ok) setDetail({ pages: body.pages ?? [], images: body.images ?? [] });
    setDetailLoading(false);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Link href="/superadmin" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 10, fontSize: 13, fontWeight: 600, color: "#746F78", textDecoration: "none" }}>
          ← Back to Activities
        </Link>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: "-.04em" }}>Knowledge Base</h1>
        <p style={{ margin: "3px 0 0", color: "#746F78", fontSize: 13 }}>
          Upload PDFs for the &ldquo;Ask AI&rdquo; assistant. Text is chunked and embedded for retrieval;
          embedded images (not full-page screenshots) are extracted and shown alongside cited answers.
        </p>
      </div>

      {message && (
        <div style={{
          marginBottom: 16, padding: "10px 16px", borderRadius: 10,
          background: message.ok ? "#EDFBF3" : "#FEF2F2",
          border: `1px solid ${message.ok ? "#A7F3D0" : "#FECACA"}`,
          color: message.ok ? "#065F46" : "#991B1B", fontWeight: 600, fontSize: 13,
        }}>{message.text}</div>
      )}

      {/* Upload form */}
      <form onSubmit={(e) => void handleUpload(e)} style={{
        marginBottom: 24, padding: "18px 20px", borderRadius: 14,
        background: "white", border: "1.5px solid #E8E6DC",
        display: "flex", flexDirection: "column", gap: 10,
        boxShadow: "0 2px 12px rgba(34,29,35,.06)",
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#221D23" }}>Add a document</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g. Salesforce Automation Guide)"
          required
          style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #E8E6DC", fontSize: 14, fontFamily: "inherit", outline: "none" }}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          rows={2}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #E8E6DC", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical" }}
        />
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={{ fontSize: 13 }}
        />
        <div>
          <button type="submit" disabled={uploading} style={btnPrimary}>
            {uploading ? "Uploading…" : "Upload PDF"}
          </button>
        </div>
      </form>

      {/* Document list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {documents.map((doc) => {
          const isBusy = busyId === doc.id;
          const isExpanded = expandedId === doc.id;
          return (
            <div key={doc.id} style={{ background: "white", border: "1.5px solid #E8E6DC", borderRadius: 14, boxShadow: "0 2px 12px rgba(34,29,35,.06)" }}>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#221D23" }}>{doc.title}</span>
                    <StatusBadge status={doc.status} />
                    {doc.page_count != null && (
                      <span style={{ fontSize: 11.5, color: "#A09AA6" }}>{doc.page_count} pages</span>
                    )}
                  </div>
                  {doc.description && (
                    <div style={{ fontSize: 12.5, color: "#746F78", marginTop: 3 }}>{doc.description}</div>
                  )}
                  {doc.status === "error" && doc.error_message && (
                    <div style={{ fontSize: 11.5, color: "#DC2626", marginTop: 3 }}>{doc.error_message}</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {(doc.status === "pending" || doc.status === "error") && (
                    <button onClick={() => void handleReprocess(doc)} disabled={isBusy} style={btn}>
                      {isBusy ? "Working…" : doc.status === "error" ? "Retry" : "Start"}
                    </button>
                  )}
                  <button onClick={() => void toggleDetail(doc)} style={btn}>
                    {isExpanded ? "Hide" : "View"}
                  </button>
                  <button onClick={() => void handleDelete(doc)} disabled={isBusy} style={btnDanger}>
                    Delete
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div style={{ borderTop: "1px solid #EEEAE4", padding: "14px 16px", background: "#FAFAF8" }}>
                  {detailLoading && <div style={{ fontSize: 13, color: "#746F78" }}>Loading…</div>}
                  {!detailLoading && detail && detail.pages.length === 0 && (
                    <div style={{ fontSize: 13, color: "#746F78" }}>No pages ingested yet.</div>
                  )}
                  {!detailLoading && detail && detail.pages.map((page) => {
                    const pageImages = detail.images.filter((img) => img.page_number === page.page_number);
                    return (
                      <div key={page.page_number} style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #EEEAE4" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#746F78", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                          Page {page.page_number}
                        </div>
                        <div style={{ fontSize: 12.5, color: "#221D23", lineHeight: 1.6, marginBottom: pageImages.length ? 10 : 0 }}>
                          {page.raw_text ? (page.raw_text.length > 400 ? `${page.raw_text.slice(0, 400)}…` : page.raw_text) : "(no extracted text)"}
                        </div>
                        {pageImages.length > 0 && (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {pageImages.map((img) => (
                              <a key={img.image_path} href={img.imageUrl} target="_blank" rel="noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={img.imageUrl}
                                  alt={`Extracted image, page ${img.page_number}`}
                                  style={{ height: 90, borderRadius: 6, border: "1px solid #E8E6DC", display: "block" }}
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {documents.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#A09AA6" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>No documents yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Upload a PDF above to start building the knowledge base.</div>
          </div>
        )}
      </div>
    </div>
  );
}
