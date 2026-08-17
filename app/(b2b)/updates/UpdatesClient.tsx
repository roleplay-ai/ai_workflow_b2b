"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import B2BTopbar from "@/components/B2BTopbar";
import ModuleHtmlModal from "@/components/ModuleHtmlModal";
import ToolIcon from "@/components/ToolIcon";
import { safeExternalUrl } from "@/components/BriefNewsCard";
import { WHATS_NEW_SOURCES, WHATS_NEW_SOURCE_LABELS, type WhatsNewSource } from "@/lib/chatbotFilter";
import { normalizeToolSlug } from "@/lib/tools";
import { resolveToolLogoUrl, type ToolLogoMap } from "@/lib/toolLogos";
import type { WhatsNewUpdate } from "@/lib/supabase/types";
import { trackFluencyView } from "@/lib/trackFluencyView";
import { createClient } from "@/lib/supabase/client";
import { COURSE_PARTS, getAllModules, type CourseModule } from "@/lib/ai-mastery-course";
import "./updates.css";

// ── Types ──────────────────────────────────────────────────────────────────────

type NewsFilter = WhatsNewSource | "all";

type Video = {
  id: string; title: string; description: string | null; video_url: string | null;
  thumbnail_url: string | null; duration: string | null;
  group_name: string | null; category_tag: string | null;
};

type ProCon = { content: string; sort_order: number };

type Tool = {
  id: string; category_label: string; name: string; description: string;
  icon_emoji: string | null; letter: string | null; color: string | null;
  company_name: string | null; try_url: string | null; best_for: string | null;
  pricing: string | null; is_featured: boolean;
  fluency_tool_pros?: ProCon[]; fluency_tool_cons?: ProCon[];
};

type ToolGuide = {
  id: string; name: string; logo_letter: string; description: string;
  accent_color: string; bg_color: string; border_color: string; guide_url: string | null;
  company_name?: string | null; strengths?: string[] | null;
  update_label?: string | null; update_date?: string | null; theme_key?: string | null;
};

type NewActivity = {
  id: string;
  title: string;
  tools: string | string[] | null | undefined;
  description?: string | null;
};

type ToolDeepDive = {
  id: string;
  title: string;
  description: string | null;
  tool: string | null;
  url: string | null;
  html_path: string | null;
  link_type: "external" | "html" | null;
};

type FluencyModule = {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  concepts: string[];
  sort_order: number;
  is_locked: boolean;
  next_module_hint: string | null;
  html_path: string | null;
};

type Props = {
  updates: WhatsNewUpdate[];
  videos: Video[];
  tools: Tool[];
  toolGuides: ToolGuide[];
  toolLogos: ToolLogoMap;
  deepDives?: ToolDeepDive[];
  newActivities?: NewActivity[];
  fluencyModules: FluencyModule[];
  completedFluencyModuleIds: string[];
  masteryCompletedCount: number;
  masteryCompletedModuleIds: string[];
  masteryTotalModules: number;
  masteryApproved: boolean;
  masteryRequested: boolean;
};

type TabKey = "news" | "videos" | "tools" | "foundations" | "course";

const TABS: { key: TabKey; label: string }[] = [
  { key: "news", label: "News" },
  { key: "videos", label: "Latest Videos" },
  { key: "tools", label: "Popular Tools" },
  { key: "foundations", label: "AI Foundations" },
  { key: "course", label: "Course" },
];

// ── Constants ──────────────────────────────────────────────────────────────────

const GROUP_ACCENT: Record<string, string> = {
  Features: "#A855F7", Apps: "#EC4899", Workflows: "#F68A29", Skills: "#3699FC",
};

const GUIDE_ICON_SYMBOLS = ["✦", "●", "✧", "◆"];

const THEME_TO_SLUG: Record<string, string> = {
  claude: "claude", gpt: "chatgpt", gemini: "gemini", copilot: "copilot",
};

const WORK_QUESTIONS = [
  {
    emoji: "🫧",
    question: "Is this an AI bubble?",
    short: "It might be a financial bubble, but that doesn't mean AI capability is hype.",
    bullets: [
      "There are real signals of a financial bubble: companies without products getting billion-dollar valuations, circular funding between hyperscalers, AI labs and chipmakers, and data center investments that may take decades to recover.",
      "The capability story is different. Since early 2026, Claude's revenue moved from $8B to $30B in two months, and users consistently report significant value from daily use.",
      "For most people, whether it's a financial bubble is irrelevant unless you've invested in AI companies as a VC. Focus on what the technology can do for your work.",
    ],
  },
  {
    emoji: "🤖",
    question: "Will AI take over the world?",
    short: "We're competing with a technology we don't fully understand — but the 10-year risk is low.",
    bullets: [
      "For the first time, we are building something that could become more intelligent than us and we don't fully understand how it works. AI already outperforms the average human on many tasks.",
      "Senior AI scientists are divided on how far scaling will continue to improve intelligence. History shows humans tend to come together against existential threats, as we did with nuclear weapons and COVID.",
      "Due to infrastructure limitations — data center capacity, device constraints, and training data availability — the risk of AI taking over is very low in the next 10 years. Beyond that, it's genuinely uncertain.",
    ],
  },
  {
    emoji: "💼",
    question: "Will everyone lose their jobs?",
    short: "Jobs are collections of tasks. The question is which part of your job is hardest.",
    bullets: [
      "If a job is essentially one repeatable task (like basic customer query resolution) and there's enough training data available, that job can be fully automated.",
      "Most jobs are complex bundles of tasks. You don't pay McKinsey for 70 slides — you pay for customer interviews, insight generation, and perspectives you hadn't considered. If the hardest part of your job can't be done by AI, you're relatively safe.",
      "If you work in coding or design, adopt AI and aim to be in the top 1% of your field — you're competing with machines. For other roles, track how much of your work AI can do today, and if you see a trend, adapt early.",
    ],
  },
  {
    emoji: "🎯",
    question: "Where can I apply GenAI?",
    short: "The key question: do you need 100% accuracy, or can you live with uncertainty?",
    bullets: [
      "GenAI is predictive, not deterministic. Use it comfortably for content generation — text, voice, image, video, and code — where some variability is acceptable.",
      "For data analytics, GenAI can write the code that analyses your data, which works well. But feeding large raw datasets directly into context windows has limits. Know the boundaries.",
      "Avoid GenAI where a standard software rule applies: if input X always needs output Y, use regular code. Do not use it in aviation, banking, or healthcare systems where accuracy is non-negotiable.",
    ],
  },
  {
    emoji: "🔮",
    question: "How will the workplace change with AI?",
    short: "Agents are coming, but humans stay in the loop for anything critical.",
    bullets: [
      "AI agents are increasingly capable but not fully predictable. For any critical business process, expect human-in-the-loop to remain the norm for the foreseeable future.",
      "Most transactional work will shift to machines. Humans will spend more time on relationship-building, selling, and judgment-heavy decisions.",
      "Middle management will face the most pressure. AI can delegate tasks, track progress, and coach more consistently than most managers. The number of middle management roles will likely shrink.",
    ],
  },
  {
    emoji: "🏭",
    question: "How can AI be applied in manufacturing?",
    short: "Think of AI as three new superpowers: Eyes, Voice, and Brain.",
    bullets: [
      "Give your team an extra pair of Eyes, a Voice, and a Brain. With those three, what becomes possible on your shop floor?",
      "Use computer vision for first-pass quality checks — AI flags issues, human approves. Faster throughput, fewer misses.",
      "AI can help supervisors with shift planning, work allocation, and on-the-job capability building. Workers can ask AI directly when something breaks down rather than waiting for an expert.",
    ],
  },
  {
    emoji: "📈",
    question: "How do we measure the impact of GenAI?",
    short: "Two numbers: costs down or revenues up. Pick one and track it.",
    bullets: [
      "Every GenAI initiative must tie to either lower costs or higher revenues. There is no other credible measure of impact.",
      "If your people can do more work with AI, decide upfront: will you hire fewer people (cost reduction) or give them more ambitious targets (revenue growth)? You can't claim both by default.",
      "Always check whether your spend on tokens is proportionate to the returns from the project. Start every AI initiative with a clear, measurable goal.",
    ],
  },
  {
    emoji: "🏆",
    question: "Which is the best AI chatbot?",
    short: "There is no single best. The right question is: best for which task?",
    bullets: [
      "Rankings change every few months as labs release new models. The better question is: which tool is best for the task you need, and which can you afford to use consistently?",
      "Claude is currently the strongest for knowledge work. Gemini and ChatGPT lead for image generation. Claude Code is exceptional for coding but can hit token limits quickly on large projects.",
      "Pick any one paid subscription from the top three — Claude, Gemini, or ChatGPT — and use it daily. You'll learn more from practice than from benchmarks. Paid tiers unlock meaningfully better features.",
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function resolveGuideSlug(guide: ToolGuide): string {
  if (guide.theme_key && THEME_TO_SLUG[guide.theme_key]) return THEME_TO_SLUG[guide.theme_key];
  return normalizeToolSlug(guide.name);
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function formatNewsDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value)).toUpperCase();
}

function newsSourceLabel(tool: NewsFilter): string {
  return tool === "all" ? "All" : WHATS_NEW_SOURCE_LABELS[tool];
}

// ── Section header (used for sub-sections nested inside a tab) ─────────────────

function SectionHeader({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <div style={{ position: "relative", paddingLeft: 22 }}>
      <div style={{
        position: "absolute", left: 0, top: 4, width: 7, height: 58,
        borderRadius: 999, background: "#FFCE00", border: "1px solid rgba(34,29,35,.18)",
      }} />
      <span style={{
        display: "inline-flex", padding: "7px 10px", borderRadius: 999, background: "#221D23",
        color: "#fff", fontSize: 10, fontWeight: 950, textTransform: "uppercase" as const,
        letterSpacing: ".10em", marginBottom: 8,
      }}>{label}</span>
      <h2 className="upd-section-title">{title}</h2>
      <p style={{ margin: "8px 0 0", color: "#6B6670", fontSize: 14, fontWeight: 650, lineHeight: 1.45 }}>{subtitle}</p>
    </div>
  );
}

// ── Tool Modal ─────────────────────────────────────────────────────────────────

function ToolModal({ tool, onClose }: { tool: Tool; onClose: () => void }) {
  useEffect(() => {
    trackFluencyView("tool", tool.id);
  }, [tool.id]);

  const accent = tool.color ?? "#623CEA";

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,.55)", backdropFilter: "blur(5px)",
      WebkitBackdropFilter: "blur(5px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "min(520px,100%)" }}>
        <button onClick={onClose} aria-label="Close" style={{
          position: "absolute", top: 12, right: 12, zIndex: 10,
          width: 34, height: 34, borderRadius: "50%",
          background: "rgba(0,0,0,.55)", border: 0, cursor: "pointer",
          color: "#fff", fontSize: 20, fontWeight: 700,
          display: "grid", placeItems: "center", fontFamily: "inherit",
        }}>×</button>

        <div className="upd-modal-scroll" style={{
          background: "#fff", borderRadius: 20, overflow: "hidden",
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,.35)",
        }}>
          {/* Gradient header */}
          <div style={{
            padding: "28px 28px 24px",
            background: `linear-gradient(125deg, ${accent} 0%, #F9A8D4 55%, #221D23 100%)`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
              <span style={{
                width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                background: "rgba(255,255,255,.20)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,.30)",
                display: "grid", placeItems: "center",
                fontSize: tool.letter ? 22 : 24, fontWeight: 950, color: "#fff", letterSpacing: "-.02em",
              }}>{tool.letter ?? tool.icon_emoji ?? tool.name[0]}</span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{
                    background: "rgba(255,255,255,.25)", color: "#fff", padding: "2px 10px", borderRadius: 999,
                    fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" as const,
                  }}>{tool.category_label}</span>
                  {tool.is_featured && (
                    <span style={{ background: "#FFCE00", color: "#221D23", padding: "2px 10px", borderRadius: 999, fontSize: 10, fontWeight: 800 }}>Featured</span>
                  )}
                </div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 950, letterSpacing: "-.04em", color: "#fff", lineHeight: 1.1 }}>{tool.name}</h2>
                {tool.company_name && (
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600 }}>by {tool.company_name}</p>
                )}
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,.9)", fontWeight: 500 }}>{tool.description}</p>
          </div>

          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #F0ECE6" }}>
            <div style={{ padding: "16px 20px", borderRight: "1px solid #F0ECE6" }}>
              <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "#9B9199" }}>Pricing</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#221D23" }}>{tool.pricing ?? "—"}</p>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "#9B9199" }}>Category</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: accent }}>{tool.category_label}</p>
            </div>
          </div>

          {/* Best for */}
          {tool.best_for && (
            <div style={{ padding: "16px 20px 20px", borderBottom: "1px solid #F0ECE6" }}>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "#9B9199" }}>Best for</p>
              <div style={{ background: accent + "14", borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 650, color: "#221D23", lineHeight: 1.5 }}>{tool.best_for}</p>
              </div>
            </div>
          )}

          {/* Pros */}
          {(tool.fluency_tool_pros?.length ?? 0) > 0 && (
            <div style={{ padding: "16px 20px 20px", borderBottom: "1px solid #F0ECE6" }}>
              <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "#9B9199" }}>Pros</p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {[...(tool.fluency_tool_pros ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((p, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#E8FBEE", borderRadius: 10, padding: "9px 13px" }}>
                    <span style={{ color: "#16A34A", fontWeight: 900, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 13, fontWeight: 650, color: "#166534", lineHeight: 1.45 }}>{p.content}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cons */}
          {(tool.fluency_tool_cons?.length ?? 0) > 0 && (
            <div style={{ padding: "16px 20px 20px", borderBottom: "1px solid #F0ECE6" }}>
              <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "#9B9199" }}>Cons</p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {[...(tool.fluency_tool_cons ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((c, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#FDE9EB", borderRadius: 10, padding: "9px 13px" }}>
                    <span style={{ color: "#DC2626", fontWeight: 900, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✕</span>
                    <span style={{ fontSize: 13, fontWeight: 650, color: "#991B1B", lineHeight: 1.45 }}>{c.content}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div style={{ padding: "16px 20px 20px", display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: "11px 0", borderRadius: 999, cursor: "pointer",
              background: "#fff", border: "1.5px solid #E9E4DC",
              fontSize: 13, fontWeight: 750, color: "#6B6670", fontFamily: "inherit",
            }}>Close</button>
            {tool.try_url ? (
              <a href={tool.try_url} target="_blank" rel="noopener noreferrer" style={{
                flex: 2, padding: "11px 0", borderRadius: 999, textAlign: "center",
                background: accent, color: "#fff", fontSize: 13, fontWeight: 800, textDecoration: "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>Try {tool.name} ↗</a>
            ) : (
              <span style={{
                flex: 2, padding: "11px 0", borderRadius: 999, textAlign: "center",
                background: "#F7F2E9", color: "#9B9199", fontSize: 13, fontWeight: 750,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>Coming soon</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tool Guide Card ────────────────────────────────────────────────────────────

function ToolGuideCard({
  guide, sortIndex, toolLogos, resolvedUrl, isHtml, onOpenHtml,
}: {
  guide: ToolGuide;
  sortIndex: number;
  toolLogos: ToolLogoMap;
  resolvedUrl: string | null;
  isHtml: boolean;
  onOpenHtml?: () => void;
}) {
  const slug = resolveGuideSlug(guide);
  const logoUrl = resolveToolLogoUrl(slug, toolLogos);
  const showUpdate = guide.update_label || guide.update_date;
  const iconIndex = (sortIndex % 4) + 1;

  const trackGuide = () => trackFluencyView("tool_guide", guide.id);

  const exploreBtn = resolvedUrl && !isHtml ? (
    <a
      href={resolvedUrl}
      className="upd-guide-explore"
      target="_blank"
      rel="noopener noreferrer"
      onClick={trackGuide}
    >
      Explore guide ›
    </a>
  ) : resolvedUrl && isHtml ? (
    <button
      type="button"
      className="upd-guide-explore"
      onClick={() => {
        trackGuide();
        onOpenHtml?.();
      }}
      style={{ fontFamily: "inherit" }}
    >
      Explore guide ›
    </button>
  ) : (
    <span className="upd-guide-explore upd-guide-explore--disabled">Guide coming soon</span>
  );

  return (
    <article className="upd-guide-card">
      <div className={`upd-guide-icon upd-guide-icon--${iconIndex}`}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" />
        ) : (
          GUIDE_ICON_SYMBOLS[sortIndex % GUIDE_ICON_SYMBOLS.length]
        )}
      </div>
      <h4 className="upd-guide-name">{guide.name}</h4>
      {guide.description && <p className="upd-guide-desc">{guide.description}</p>}
      {showUpdate && (
        <div className="upd-guide-meta">
          {guide.update_label}
          {guide.update_label && guide.update_date && " · "}
          {guide.update_date}
        </div>
      )}
      {exploreBtn}
    </article>
  );
}

// ── Deep Dive HTML Modal ───────────────────────────────────────────────────────

function DeepDiveModal({ deepDiveId, title, onClose }: { deepDiveId: string; title: string; onClose: () => void }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    trackFluencyView("deep_dive", deepDiveId);
  }, [deepDiveId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,.55)", backdropFilter: "blur(5px)",
      WebkitBackdropFilter: "blur(5px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: "relative", width: "min(1100px,100%)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          background: "#fff", borderRadius: 20, overflow: "hidden",
          height: "92vh", boxShadow: "0 24px 80px rgba(0,0,0,.35)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{
            padding: "14px 20px", borderBottom: "1px solid #E9E4DC",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-.03em", color: "#221D23" }}>
              {title}
            </h2>
            <button onClick={onClose} style={{
              border: 0, background: "none", cursor: "pointer", fontFamily: "inherit",
              fontSize: 13, color: "#6B6670", fontWeight: 600, padding: "4px 8px",
            }}>Close ×</button>
          </div>

          {!loaded && (
            <div style={{ flex: 1, display: "grid", placeItems: "center", background: "var(--bg)", color: "#746F78", fontSize: 14 }}>
              Loading guide…
            </div>
          )}
          <iframe
            src={`/api/fluency/deep-dive/${deepDiveId}/html`}
            title={title}
            style={{ flex: 1, border: 0, display: loaded ? "block" : "none" }}
            onLoad={() => setLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
}

// ── Video Modal ────────────────────────────────────────────────────────────────

function VideoModal({ video, onClose }: { video: Video; onClose: () => void }) {
  const accent = GROUP_ACCENT[video.group_name ?? ""] ?? "#623CEA";
  const isYouTube = video.video_url?.includes("youtube.com") || video.video_url?.includes("youtu.be");

  useEffect(() => {
    trackFluencyView("video", video.id);
  }, [video.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,.55)", backdropFilter: "blur(5px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "min(640px,100%)" }}>
        <button onClick={onClose} aria-label="Close" style={{
          position: "absolute", top: 12, right: 12, zIndex: 10,
          width: 34, height: 34, borderRadius: "50%",
          background: "rgba(0,0,0,.55)", border: 0, cursor: "pointer",
          color: "#fff", fontSize: 20, fontWeight: 700,
          display: "grid", placeItems: "center", fontFamily: "inherit",
        }}>×</button>

        <div className="upd-modal-scroll" style={{
          background: "#fff", borderRadius: 20, overflow: "hidden",
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,.35)",
        }}>
          <div style={{ position: "relative", background: "#0f0a18", aspectRatio: "16 / 9" }}>
            {video.video_url ? (
              isYouTube ? (
                <iframe
                  src={video.video_url}
                  title={video.title}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                  allowFullScreen
                />
              ) : (
                <video
                  src={video.video_url}
                  controls
                  autoPlay
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
                />
              )
            ) : (
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(155deg,${accent} 0%,#1a1030 48%,#0f0a18 100%)`,
              }} />
            )}
          </div>

          <div style={{ padding: "20px 24px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{
                background: accent + "22", color: accent,
                padding: "3px 11px", borderRadius: 999,
                fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" as const,
              }}>{video.group_name ?? "Feature"}</span>
              {video.category_tag && (
                <span style={{
                  background: "#F5F3F0", color: "#6B6670",
                  padding: "3px 11px", borderRadius: 999,
                  fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" as const,
                }}>{video.category_tag}</span>
              )}
            </div>
            <h2 style={{
              margin: "0 0 10px", fontSize: 20, fontWeight: 900,
              lineHeight: 1.2, letterSpacing: "-.04em", color: "#221D23",
            }}>{video.title}</h2>
            {video.description && (
              <p style={{
                margin: 0, fontSize: 14, lineHeight: 1.65,
                color: "#4A4450", fontWeight: 500, whiteSpace: "pre-line",
              }}>
                {video.description.split("\n\n")[0]}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── News tab ───────────────────────────────────────────────────────────────────

function NewsPanel({
  updates,
  toolLogos,
}: {
  updates: WhatsNewUpdate[];
  toolLogos: ToolLogoMap;
}) {
  const [newsFilter, setNewsFilter] = useState<NewsFilter>("all");
  const visibleUpdates = useMemo(
    () => updates.filter((update) => newsFilter === "all" || update.tool === newsFilter),
    [updates, newsFilter],
  );

  return (
    <section>
      <div className="upd-intro">
        <div>
          <h2>News</h2>
          <p>Short, practical updates on AI products, capabilities, and ways of working.</p>
        </div>
        <span className="upd-badge">{updates.length} {updates.length === 1 ? "update" : "updates"}</span>
      </div>

      <div className="upd-news-filters" role="group" aria-label="Filter updates by AI tool">
        {(["all", ...WHATS_NEW_SOURCES] as NewsFilter[]).map((tool) => (
          <button
            type="button"
            key={tool}
            className={`upd-news-filter ${newsFilter === tool ? "active" : ""}`}
            aria-pressed={newsFilter === tool}
            onClick={() => setNewsFilter(tool)}
          >
            {tool !== "all" ? <ToolIcon tool={tool} size={16} logos={toolLogos} /> : null}
            {newsSourceLabel(tool)}
          </button>
        ))}
      </div>

      {visibleUpdates.length === 0 ? (
        <div className="upd-foundation-card" style={{ justifyContent: "center", color: "#746F78", cursor: "default" }}>No updates available yet.</div>
      ) : (
        <div className="upd-news-grid">
          {visibleUpdates.map((update) => {
            const href = safeExternalUrl(update.link_url);
            const inner = (
              <>
                <div className="upd-news-meta">
                  <span className="upd-news-source">
                    <ToolIcon tool={update.tool} size={16} logos={toolLogos} />
                    {WHATS_NEW_SOURCE_LABELS[update.tool]}
                  </span>
                  <time className="upd-news-date" dateTime={update.published_at}>
                    {formatNewsDate(update.published_at)}
                  </time>
                </div>
                <h3>{update.title}</h3>
                <p>{update.summary}</p>
                <div className="upd-news-footer">
                  {update.tag ? <span className="upd-news-tag">{update.tag}</span> : null}
                  {href ? <span className="upd-news-link">Explore update →</span> : null}
                </div>
              </>
            );
            return href ? (
              <a key={update.id} href={href} target="_blank" rel="noopener noreferrer" className="upd-news-card">
                {inner}
              </a>
            ) : (
              <article key={update.id} className="upd-news-card">{inner}</article>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Videos tab ─────────────────────────────────────────────────────────────────

function VideosPanel({ videos }: { videos: Video[] }) {
  const [selected, setSelected] = useState<Video | null>(null);

  return (
    <section>
      <div className="upd-intro">
        <div>
          <h2>Latest Videos</h2>
          <p>Short demonstrations that show how new AI features and workflows work in practice.</p>
        </div>
        <span className="upd-badge">New videos added regularly</span>
      </div>

      {videos.length === 0 ? (
        <div className="upd-foundation-card" style={{ justifyContent: "center", color: "#746F78", cursor: "default" }}>No videos available yet.</div>
      ) : (
        <div className="upd-vgrid">
          {videos.map((v, i) => {
            const ytId = v.video_url ? extractYouTubeId(v.video_url) : null;
            const thumb = v.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null);
            return (
              <button type="button" key={v.id} className="upd-vcard" onClick={() => setSelected(v)}>
                <div className="upd-vthumb">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" />
                  ) : null}
                  <span className="upd-vnum">{String(i + 1).padStart(2, "0")}</span>
                  <span className="upd-vplay" aria-hidden="true">▶</span>
                </div>
                <div className="upd-vcopy">
                  {v.duration ? <div className="upd-vduration">{v.duration}</div> : null}
                  <h3>{v.title}</h3>
                  {v.description ? <p>{v.description.split("\n\n")[0]}</p> : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && <VideoModal video={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

// ── Tools tab ──────────────────────────────────────────────────────────────────

function ToolsPanel({
  tools, toolGuides, toolLogos, deepDiveByTool,
}: {
  tools: Tool[];
  toolGuides: ToolGuide[];
  toolLogos: ToolLogoMap;
  deepDiveByTool: Map<string, ToolDeepDive>;
}) {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [openDeepDive, setOpenDeepDive] = useState<{ id: string; title: string } | null>(null);

  function resolveGuideLink(guide: ToolGuide): { resolvedUrl: string | null; isHtml: boolean; deepDiveId: string | null; deepDiveTitle: string } {
    if (guide.guide_url?.trim()) return { resolvedUrl: guide.guide_url.trim(), isHtml: false, deepDiveId: null, deepDiveTitle: "" };
    const slug = resolveGuideSlug(guide);
    const dive = deepDiveByTool.get(slug);
    if (!dive) return { resolvedUrl: null, isHtml: false, deepDiveId: null, deepDiveTitle: "" };
    if ((dive.link_type ?? "external") === "html" && dive.html_path) {
      return { resolvedUrl: `/api/fluency/deep-dive/${dive.id}/html`, isHtml: true, deepDiveId: dive.id, deepDiveTitle: dive.title };
    }
    return { resolvedUrl: dive.url?.trim() || null, isHtml: false, deepDiveId: null, deepDiveTitle: "" };
  }

  return (
    <section>
      <div className="upd-intro">
        <div>
          <h2>Popular Tools</h2>
          <p>Explore widely used AI tools and understand the work each one is best suited for.</p>
        </div>
        <span className="upd-badge">Curated tool directory</span>
      </div>

      {tools.length === 0 ? (
        <div className="upd-foundation-card" style={{ justifyContent: "center", color: "#746F78", cursor: "default" }}>No tools available yet.</div>
      ) : (
        <div className="upd-tgrid">
          {tools.map(t => (
            <button type="button" key={t.id} className="upd-tcard2" onClick={() => setSelectedTool(t)}>
              <div className="upd-tlogo2">{t.letter ?? t.icon_emoji ?? t.name[0]?.toUpperCase()}</div>
              <h3>{t.name}</h3>
              <p>{t.description}</p>
              <span className="upd-topen">Explore tool →</span>
            </button>
          ))}
        </div>
      )}

      {/*
      {toolGuides.length > 0 && (
        <div className="upd-subsection">
          <SectionHeader label="Guides" title="AI Tool Guides" subtitle="Understand how each major AI tool fits into real work." />
          <div className="upd-guide-grid" style={{ marginTop: 20 }}>
            {toolGuides.map((g, i) => {
              const { resolvedUrl, isHtml, deepDiveId, deepDiveTitle } = resolveGuideLink(g);
              return (
                <ToolGuideCard
                  key={g.id}
                  guide={g}
                  sortIndex={i}
                  toolLogos={toolLogos}
                  resolvedUrl={resolvedUrl}
                  isHtml={isHtml}
                  onOpenHtml={isHtml && deepDiveId ? () => setOpenDeepDive({ id: deepDiveId, title: deepDiveTitle }) : undefined}
                />
              );
            })}
          </div>
        </div>
      )}
      */}

      {selectedTool && <ToolModal tool={selectedTool} onClose={() => setSelectedTool(null)} />}
      {openDeepDive && (
        <DeepDiveModal deepDiveId={openDeepDive.id} title={openDeepDive.title} onClose={() => setOpenDeepDive(null)} />
      )}
    </section>
  );
}

// ── AI Foundations tab ─────────────────────────────────────────────────────────

function FoundationsPanel({
  modules, completedModuleIds,
}: {
  modules: FluencyModule[];
  completedModuleIds: string[];
}) {
  const [openModule, setOpenModule] = useState<FluencyModule | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(() => new Set(completedModuleIds));
  const questionRefs = useRef<(HTMLDetailsElement | null)[]>([]);

  function handleToggle(index: number) {
    const current = questionRefs.current[index];
    if (!current?.open) return;
    questionRefs.current.forEach((el, i) => { if (el && i !== index) el.open = false; });
  }

  function openModuleAndMarkComplete(mod: FluencyModule) {
    setOpenModule(mod);
    if (completed.has(mod.id)) return;
    setCompleted(prev => new Set(prev).add(mod.id));
    const supabase = createClient();
    void supabase.rpc("complete_fluency_module", { p_module_id: mod.id });
  }

  const sortedModules = useMemo(
    () => [...modules].sort((a, b) => a.sort_order - b.sort_order),
    [modules],
  );

  return (
    <section>
      <div className="upd-intro">
        <div>
          <h2>AI Foundations</h2>
          <p>Understand the core ideas behind modern AI before applying them at work.</p>
        </div>
        <span className="upd-badge">{completed.size} of {sortedModules.length} completed</span>
      </div>

      {sortedModules.length === 0 ? (
        <div className="upd-foundation-card" style={{ justifyContent: "center", color: "#746F78", cursor: "default" }}>No foundation modules published yet.</div>
      ) : (
        <div className="upd-foundation-grid">
          {sortedModules.map((mod) => {
            const isDone = completed.has(mod.id);
            if (mod.is_locked) {
              return (
                <div className="upd-foundation-card" key={mod.id} style={{ cursor: "default", opacity: 0.6 }}>
                  <div className="upd-foundation-icon" aria-hidden="true">{mod.emoji}</div>
                  <div>
                    <h3>{mod.title}</h3>
                    <p>{mod.description || (mod.concepts.length > 0 ? mod.concepts.join(" · ") : "")}</p>
                    <div className="upd-foundation-meta">
                      <span>🔒 Locked</span>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <button
                type="button"
                className="upd-foundation-card"
                key={mod.id}
                onClick={() => openModuleAndMarkComplete(mod)}
              >
                <div className="upd-foundation-icon" aria-hidden="true">{mod.emoji}</div>
                <div>
                  <h3>{mod.title}</h3>
                  <p>{mod.description || (mod.concepts.length > 0 ? mod.concepts.join(" · ") : "")}</p>
                  <div className="upd-foundation-meta">
                    {mod.concepts.length > 0 ? <span>{mod.concepts.length} concepts</span> : null}
                    <span>{isDone ? "Completed" : "Start"}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {openModule && (
        <ModuleHtmlModal
          moduleId={openModule.id}
          moduleTitle={openModule.title}
          moduleEmoji={openModule.emoji}
          onClose={() => setOpenModule(null)}
        />
      )}

      {/*
      <div className="upd-subsection">
        <section className="upd-questions-section">
          <div style={{ marginBottom: 24 }}>
            <SectionHeader
              label="Perspective"
              title="AI at Work: Questions"
              subtitle="Practical takes on adoption, automation, and work redesign."
            />
          </div>

          <div className="upd-faq-grid">
            {WORK_QUESTIONS.map((item, index) => (
              <details
                key={item.question}
                className="upd-faq-item"
                ref={el => { questionRefs.current[index] = el; }}
                onToggle={() => handleToggle(index)}
              >
                <summary className="upd-faq-summary">
                  <span className="upd-faq-emoji">{item.emoji}</span>
                  <span className="upd-faq-q">{item.question}</span>
                  <span className="upd-faq-toggle" aria-hidden>+</span>
                </summary>
                <div className="upd-faq-answer">
                  <p className="upd-faq-lead">{item.short}</p>
                  <p>{item.bullets.join(" ")}</p>
                </div>
              </details>
            ))}
          </div>

          <div className="upd-footer-cta">
            <div className="upd-footer-cta-left">
              <div className="upd-footer-cta-spark" aria-hidden>✦</div>
              <div>
                <h3>Stay updated. Then practice.</h3>
                <p>Track what matters and apply it through Workflows.</p>
              </div>
            </div>
            <a href="/workflows" className="upd-footer-cta-btn">Go to Workflows ›</a>
          </div>
        </section>
      </div>
      */}
    </section>
  );
}

// ── Course tab ─────────────────────────────────────────────────────────────────

function CoursePanel({
  completedCount, completedModuleIds, totalModules, approved, initiallyRequested,
}: {
  completedCount: number;
  completedModuleIds: string[];
  totalModules: number;
  approved: boolean;
  initiallyRequested: boolean;
}) {
  const [requested, setRequested] = useState(initiallyRequested);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const progressPercent = totalModules > 0
    ? Math.min(100, Math.round((completedCount / totalModules) * 100))
    : 0;

  const doneIds = useMemo(() => new Set(completedModuleIds), [completedModuleIds]);
  const allModules = useMemo(() => getAllModules(), []);
  const nextModule: CourseModule | null = useMemo(
    () => allModules.find(m => !doneIds.has(m.id)) ?? null,
    [allModules, doneIds],
  );
  const activePart = useMemo(() => {
    if (nextModule) return COURSE_PARTS.find(p => p.number === nextModule.partNumber) ?? null;
    return COURSE_PARTS[COURSE_PARTS.length - 1] ?? null;
  }, [nextModule]);

  async function requestCourseAccess() {
    if (requesting || requested) return;
    setRequesting(true);
    setRequestError("");
    try {
      const response = await fetch("/api/ai-mastery/request-access", { method: "POST" });
      if (!response.ok) throw new Error("Could not request access");
      setRequested(true);
    } catch {
      setRequestError("Could not send your request. Please try again.");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <section>
      <div className="upd-intro">
        <div>
          <h2>Course</h2>
          <p>The full guided course that turns these foundations into practical AI capability.</p>
        </div>
      </div>

      <div className="upd-course-overview">
        <div className="upd-course-copy">
          <span className="upd-course-kicker">AI Mastery</span>
          <h3>{approved ? (completedCount > 0 ? "Continue your course" : "Start your course") : "Build complete AI confidence"}</h3>
          <p>
            {approved
              ? `You have completed ${completedCount} of ${totalModules} modules.${nextModule ? ` Your next module is “${nextModule.title}.”` : " You've completed every module."}`
              : "Request access to unlock the complete guided course, saved progress, and practical examples."}
          </p>
        </div>

        <div className="upd-course-actions">
          {approved ? (
            <>
              <div className="upd-course-progress" aria-label={`${progressPercent}% course progress`}>
                <div><span>Progress</span><strong>{progressPercent}%</strong></div>
                <span><i style={{ width: `${progressPercent}%` }} /></span>
              </div>
              <a href="/mastery" target="_blank" rel="noopener noreferrer" className="upd-course-button">
                Full course <span aria-hidden="true">↗</span>
              </a>
            </>
          ) : (
            <button
              type="button"
              className="upd-course-button"
              disabled={requesting || requested}
              onClick={() => void requestCourseAccess()}
            >
              {requesting ? "Requesting…" : requested ? "Access requested" : "Request full course access"}
            </button>
          )}
          {requestError ? <span className="upd-course-error" role="status">{requestError}</span> : null}
        </div>
      </div>

      {approved && activePart ? (
        <div className="upd-module-group">
          <div className="upd-module-group-title">Part {activePart.number} · {activePart.title}</div>
          <div className="upd-module-list">
            {activePart.modules.map((m, i) => {
              const done = doneIds.has(m.id);
              const isNext = nextModule?.id === m.id;
              return (
                <div className="upd-module-row" key={m.id}>
                  <div className="upd-module-num">{done ? "✓" : i + 1}</div>
                  <div className="upd-module-copy">
                    <div className="upd-module-title">{m.title}</div>
                    <div className="upd-module-desc">{m.sections} sections</div>
                  </div>
                  <a
                    href="/mastery"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="upd-course-button"
                    style={{ minHeight: 34, padding: "0 14px" }}
                  >
                    {done ? "Review" : isNext ? "Continue" : "Start"}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function UpdatesClient({
  updates,
  videos,
  tools,
  toolGuides,
  toolLogos,
  deepDives = [],
  newActivities = [],
  fluencyModules,
  completedFluencyModuleIds,
  masteryCompletedCount,
  masteryCompletedModuleIds,
  masteryTotalModules,
  masteryApproved,
  masteryRequested,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("news");

  const deepDiveByTool = useMemo(
    () => new Map((deepDives).filter(d => d.tool).map(d => [normalizeToolSlug(d.tool!), d])),
    [deepDives],
  );

  return (
    <>
      <B2BTopbar newActivities={newActivities} />

      <div style={{ flex: 1, background: "#fff" }}>
        <div className="upd-page-inner">

        {/* Page header */}
        <div className="upd-page-header">
          <div className="upd-page-header-row">
            <div>
              <h1>Learn</h1>
              <p>Follow important AI updates, watch practical videos, discover useful tools, and build core capability.</p>
            </div>
            <span className="upd-page-pill">
              <i aria-hidden="true" />
              Updated every week
            </span>
          </div>

          <div className="upd-tabs" role="tablist" aria-label="Learning sections">
            {TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`upd-tab ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <main className="upd-main upd-tabpanel">
          {activeTab === "news" && <NewsPanel updates={updates} toolLogos={toolLogos} />}
          {activeTab === "videos" && <VideosPanel videos={videos} />}
          {activeTab === "tools" && (
            <ToolsPanel tools={tools} toolGuides={toolGuides} toolLogos={toolLogos} deepDiveByTool={deepDiveByTool} />
          )}
          {activeTab === "foundations" && (
            <FoundationsPanel modules={fluencyModules} completedModuleIds={completedFluencyModuleIds} />
          )}
          {activeTab === "course" && (
            <CoursePanel
              completedCount={masteryCompletedCount}
              completedModuleIds={masteryCompletedModuleIds}
              totalModules={masteryTotalModules}
              approved={masteryApproved}
              initiallyRequested={masteryRequested}
            />
          )}
        </main>
        </div>
      </div>
    </>
  );
}
