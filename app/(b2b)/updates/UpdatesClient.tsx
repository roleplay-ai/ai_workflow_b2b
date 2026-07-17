"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import B2BTopbar from "@/components/B2BTopbar";
import BriefNewsCard, { type BriefNewsItem } from "@/components/BriefNewsCard";
import { normalizeToolSlug } from "@/lib/tools";
import { resolveToolLogoUrl, type ToolLogoMap } from "@/lib/toolLogos";
import { trackFluencyView } from "@/lib/trackFluencyView";
import "./updates.css";

// ── Types ──────────────────────────────────────────────────────────────────────

type BriefItem = { id: string; content: string; link_url: string | null; sort_order: number };
type Brief = { id: string; title: string; published_date: string; fluency_brief_items: BriefItem[] };

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

type Props = {
  brief: Brief | null;
  videos: Video[];
  tools: Tool[];
  toolGuides: ToolGuide[];
  toolLogos: ToolLogoMap;
  deepDives?: ToolDeepDive[];
  newActivities?: NewActivity[];
};

// ── Constants ──────────────────────────────────────────────────────────────────

const GROUP_ACCENT: Record<string, string> = {
  Features: "#A855F7", Apps: "#EC4899", Workflows: "#F68A29", Skills: "#3699FC",
};

const TOOLS_PAGE_SIZE = 10;

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

// ── Section header ─────────────────────────────────────────────────────────────

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

// ── Tools Section ──────────────────────────────────────────────────────────────

function ToolsSection({ tools, onOpenTool }: { tools: Tool[]; onOpenTool: (t: Tool) => void }) {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(tools.map(t => t.category_label)))],
    [tools],
  );
  const [filter, setFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(TOOLS_PAGE_SIZE);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(TOOLS_PAGE_SIZE);
    scrollRef.current?.scrollTo({ left: 0 });
  }, [filter]);

  const filtered = useMemo(
    () => filter === "All" ? tools : tools.filter(t => t.category_label === filter),
    [tools, filter],
  );
  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  function scroll(dir: "left" | "right") {
    const row = scrollRef.current;
    if (!row) return;
    if (dir === "right") {
      const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 10;
      if (atEnd && hasMore) { setVisibleCount(c => Math.min(filtered.length, c + TOOLS_PAGE_SIZE)); return; }
    }
    row.scrollBy({ left: dir === "left" ? -330 : 330, behavior: "smooth" });
  }

  return (
    <section style={{ marginBottom: 60 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 22, marginBottom: 16 }}>
        <SectionHeader label="Tools" title="Most Useful Tools" subtitle="AI products worth trying for real work." />
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: "8px 18px", borderRadius: 999, fontSize: 12, fontWeight: 750,
              border: "1px solid", cursor: "pointer", transition: "all .15s",
              background: filter === cat ? "#221D23" : "#fff",
              color: filter === cat ? "#FFCE00" : "#221D23",
              borderColor: filter === cat ? "#221D23" : "#E9E4DC",
              fontFamily: "inherit",
            }}
          >{cat}</button>
        ))}
      </div>

      {/* Scroll row */}
      <div className="upd-carousel-rail">
        <button className="upd-arrow-btn" onClick={() => scroll("left")} aria-label="Previous">‹</button>
        <div ref={scrollRef} className="upd-slider upd-tool-slider">
          {visibleItems.map((t, i) => (
            <article key={t.id} className="upd-tool-card">
              <div className={`upd-tool-icon upd-tool-icon--${(i % 4) + 1}`}>
                {t.letter ?? t.icon_emoji ?? t.name[0]?.toUpperCase()}
              </div>
              <div className="upd-tool-cat">{t.category_label}</div>
              <h4 className="upd-tool-name">{t.name}</h4>
              <p className="upd-tool-desc">{t.description}</p>
              <button type="button" className="upd-tool-details-link" onClick={() => onOpenTool(t)}>
                Details ›
              </button>
            </article>
          ))}
        </div>
        <button className="upd-arrow-btn" onClick={() => scroll("right")} aria-label="Next">›</button>
      </div>
    </section>
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

// ── Video Carousel ─────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function VideoCarousel({ videos }: { videos: Video[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Video | null>(null);
  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -290 : 290, behavior: "smooth" });

  if (videos.length === 0) {
    return (
      <div style={{
        padding: "48px 32px", textAlign: "center", color: "#746F78",
        background: "#fff", border: "1px solid #E9E4DC", borderRadius: 24,
      }}>No videos available yet.</div>
    );
  }

  return (
    <>
      <div className="upd-carousel-rail">
        <button className="upd-arrow-btn" onClick={() => scroll("left")} aria-label="Previous">‹</button>

        <div ref={scrollRef} className="upd-slider" style={{
          display: "grid", gridAutoFlow: "column", gridAutoColumns: 268,
          gap: 14, overflowX: "auto", padding: "4px 0 30px", scrollSnapType: "x mandatory",
        }}>
          {videos.map(v => {
            const accent = GROUP_ACCENT[v.group_name ?? ""] ?? "#623CEA";
            const ytId = v.video_url ? extractYouTubeId(v.video_url) : null;

            return (
              <article
                key={v.id}
                className="upd-video-card"
                onClick={() => setSelected(v)}
                style={{
                  scrollSnapAlign: "start", borderRadius: 18, overflow: "hidden",
                  background: "#fff", border: "1px solid rgba(34,29,35,.06)",
                  boxShadow: "0 2px 12px rgba(0,0,0,.06)", cursor: "pointer",
                  display: "flex", flexDirection: "column",
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  position: "relative", height: 132, flexShrink: 0, overflow: "hidden",
                  background: v.thumbnail_url
                    ? "transparent"
                    : `linear-gradient(155deg,${accent} 0%,#1a1030 48%,#0f0a18 100%)`,
                }}>
                  {v.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.thumbnail_url}
                      alt=""
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : ytId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                      alt=""
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : null}

                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,.15) 50%, rgba(0,0,0,.25) 100%)",
                  }} />

                  {/* Play button */}
                  <div style={{
                    position: "absolute", left: "50%", top: "50%",
                    transform: "translate(-50%,-50%)", zIndex: 2,
                    width: 52, height: 52, borderRadius: "50%",
                    background: "#fff", boxShadow: "0 6px 24px rgba(0,0,0,.20)",
                    display: "grid", placeItems: "center",
                  }}>
                    <span style={{
                      width: 0, height: 0, marginLeft: 3,
                      borderTop: "9px solid transparent",
                      borderBottom: "9px solid transparent",
                      borderLeft: "14px solid #221D23",
                      display: "block",
                    }} />
                  </div>

                  {v.duration && (
                    <span style={{
                      position: "absolute", bottom: 8, right: 8, zIndex: 2,
                      background: "rgba(0,0,0,.80)", color: "#fff",
                      padding: "2px 6px", borderRadius: 4,
                      fontFamily: "monospace", fontSize: 11, fontWeight: 500,
                    }}>{v.duration}</span>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: "12px 14px 14px", flex: 1, background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: 2, flexShrink: 0,
                      background: accent, display: "inline-block",
                    }} />
                    <span style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: ".12em",
                      textTransform: "uppercase" as const, color: "#6B6670",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      flex: 1, minWidth: 0,
                    }}>
                      {v.category_tag ?? v.group_name ?? "Feature"}
                    </span>
                  </div>
                  <h3 className="upd-card-title">{v.title}</h3>
                </div>
              </article>
            );
          })}
        </div>

        <button className="upd-arrow-btn" onClick={() => scroll("right")} aria-label="Next">›</button>
      </div>

      {selected && <VideoModal video={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

// ── AI at Work questions ───────────────────────────────────────────────────────

function WorkQuestionsSection() {
  const questionRefs = useRef<(HTMLDetailsElement | null)[]>([]);

  function handleToggle(index: number) {
    const current = questionRefs.current[index];
    if (!current?.open) return;
    questionRefs.current.forEach((el, i) => { if (el && i !== index) el.open = false; });
  }

  return (
    <section className="upd-questions-section" id="questions">
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
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function UpdatesClient({ brief, videos, tools, toolGuides, toolLogos, deepDives = [], newActivities = [] }: Props) {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [openDeepDive, setOpenDeepDive] = useState<{ id: string; title: string } | null>(null);

  const deepDiveByTool = useMemo(
    () => new Map((deepDives).filter(d => d.tool).map(d => [normalizeToolSlug(d.tool!), d])),
    [deepDives],
  );

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
    <>
      <B2BTopbar newActivities={newActivities} />

      <div style={{ flex: 1, background: "var(--bg)" }}>

        {/* Page header — matches Workflows pattern */}
        <div style={{ background: "var(--bg)", borderBottom: "1px solid #E9E4DC", padding: "22px 28px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-.03em", color: "#1C1820", lineHeight: 1.1 }}>
                News
              </h1>
              <p style={{ fontSize: 13.5, color: "#746F78", fontWeight: 600, marginTop: 4 }}>
                Latest AI news, short launch videos, and practical perspectives — curated weekly for your team.
              </p>
            </div>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 11, fontWeight: 700, letterSpacing: ".06em",
              textTransform: "uppercase", borderRadius: 999, padding: "5px 12px",
              background: "rgba(255,206,0,.10)", color: "#6B5000",
              border: "1px solid rgba(255,206,0,.40)", whiteSpace: "nowrap",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFCE00", display: "inline-block" }} />
              Updated every week
            </span>
          </div>
        </div>

        <main className="upd-main">

        {/* Latest AI News */}
        <section id="latest" style={{ marginBottom: 60 }}>
          <div style={{ marginBottom: 22 }}>
            <SectionHeader
              label="News"
              title="Latest AI News"
              subtitle="Short, useful updates for people applying AI at work."
            />
          </div>
          <BriefNewsCard
            items={(brief?.fluency_brief_items ?? []) as BriefNewsItem[]}
            publishedDate={brief?.published_date}
          />
        </section>

        {/* Videos */}
        {videos.length > 0 && (
          <section id="videos" style={{ marginBottom: 60 }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 22, marginBottom: 22 }}>
              <SectionHeader
                label="Videos"
                title="Latest Launches"
                subtitle="Short videos on new launches across AI tools."
              />
            </div>
            <VideoCarousel videos={videos} />
          </section>
        )}

        {/* Most Useful Tools */}
        {tools.length > 0 && (
          <ToolsSection tools={tools} onOpenTool={setSelectedTool} />
        )}

        {/* AI Tool Guides */}
        {toolGuides.length > 0 && (
          <section style={{ marginBottom: 60 }}>
            <div style={{ marginBottom: 24 }}>
              <SectionHeader
                label="Guides"
                title="AI Tool Guides"
                subtitle="Understand how each major AI tool fits into real work."
              />
            </div>
            <div className="upd-guide-grid">
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
          </section>
        )}

        {/* AI at Work Questions */}
        <WorkQuestionsSection />

      </main>
      </div>

      {selectedTool && (
        <ToolModal tool={selectedTool} onClose={() => setSelectedTool(null)} />
      )}
      {openDeepDive && (
        <DeepDiveModal
          deepDiveId={openDeepDive.id}
          title={openDeepDive.title}
          onClose={() => setOpenDeepDive(null)}
        />
      )}
    </>
  );
}
