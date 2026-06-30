"use client";

import { useRef, useState } from "react";
import B2BTopbar from "@/components/B2BTopbar";
import BriefNewsCard, { type BriefNewsItem } from "@/components/BriefNewsCard";
import "./updates.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type BriefItem = { id: string; content: string; sort_order: number };
type Brief = { id: string; title: string; published_date: string; fluency_brief_items: BriefItem[] };

type Video = {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: string | null;
  group_name: string | null;
  category_tag: string | null;
};

type Props = {
  brief: Brief | null;
  videos: Video[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

const GROUP_ACCENT: Record<string, string> = {
  Features: "#A855F7",
  Apps: "#EC4899",
  Workflows: "#F68A29",
  Skills: "#3699FC",
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

// ── Section header helper ─────────────────────────────────────────────────────

function SectionHeader({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <div style={{ position: "relative", paddingLeft: 22 }}>
      <div style={{
        position: "absolute", left: 0, top: 4, width: 7, height: 58,
        borderRadius: 999, background: "#FFCE00", border: "1px solid rgba(34,29,35,.18)",
      }} />
      <span style={{
        display: "inline-flex", padding: "7px 10px", borderRadius: 999, background: "#221D23",
        color: "#fff", fontSize: 10, fontWeight: 950, textTransform: "uppercase",
        letterSpacing: ".10em", marginBottom: 8,
      }}>{label}</span>
      <h2 className="upd-section-title">{title}</h2>
      <p style={{ margin: "8px 0 0", color: "#6B6670", fontSize: 14, fontWeight: 650, lineHeight: 1.45 }}>{subtitle}</p>
    </div>
  );
}

// ── Video modal ───────────────────────────────────────────────────────────────

function VideoModal({ video, onClose }: { video: Video; onClose: () => void }) {
  const accent = GROUP_ACCENT[video.group_name ?? ""] ?? "#623CEA";
  const isYouTube = video.video_url?.includes("youtube.com") || video.video_url?.includes("youtu.be");

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,.55)", backdropFilter: "blur(5px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "min(640px,100%)" }}>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 12, right: 12, zIndex: 10,
            width: 34, height: 34, borderRadius: "50%",
            background: "rgba(0,0,0,.55)", border: 0, cursor: "pointer",
            color: "#fff", fontSize: 20, fontWeight: 700,
            display: "grid", placeItems: "center",
          }}
        >×</button>

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
                fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase",
              }}>{video.group_name ?? "Feature"}</span>
              {video.category_tag && (
                <span style={{
                  background: "#F5F3F0", color: "#6B6670",
                  padding: "3px 11px", borderRadius: 999,
                  fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
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

// ── Video carousel ────────────────────────────────────────────────────────────

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

                  {/* Overlay gradient */}
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

                  {/* Duration badge */}
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
                      textTransform: "uppercase", color: "#6B6670",
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

// ── AI at Work questions ──────────────────────────────────────────────────────

function WorkQuestionsSection() {
  const questionRefs = useRef<(HTMLDetailsElement | null)[]>([]);

  function handleToggle(index: number) {
    const current = questionRefs.current[index];
    if (!current?.open) return;
    questionRefs.current.forEach((el, i) => { if (el && i !== index) el.open = false; });
  }

  return (
    <section className="upd-questions-section" id="questions">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 22, marginBottom: 24 }}>
        <SectionHeader
          label="Perspective"
          title="AI at Work: Questions"
          subtitle="Practical takes on adoption, automation, and work redesign. Click any question to expand."
        />
      </div>

      <div className="upd-question-grid">
        {WORK_QUESTIONS.map((item, index) => (
          <details
            key={item.question}
            className="upd-question"
            ref={el => { questionRefs.current[index] = el; }}
            onToggle={() => handleToggle(index)}
          >
            <summary>
              <span className="upd-question-emoji">{item.emoji}</span>
              <span>{item.question}</span>
              <span className="upd-question-chev">+</span>
            </summary>
            <div className="upd-question-answer">
              <p className="upd-question-short">{item.short}</p>
              <ul>
                {item.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}
              </ul>
            </div>
          </details>
        ))}
      </div>

      <div className="upd-questions-cta">
        <div>
          <h3>Use updates for awareness. Use workflows for practice.</h3>
          <p>The AI Updates page keeps your team informed. The Workflows page drives hands-on practice.</p>
        </div>
        <a
          href="/workflows"
          style={{
            display: "inline-flex", alignItems: "center",
            padding: "12px 18px", borderRadius: 999,
            background: "#FFCE00", color: "#221D23",
            border: "1px solid rgba(34,29,35,.10)",
            fontWeight: 700, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap",
          }}
        >Go to Workflows →</a>
      </div>
    </section>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UpdatesClient({ brief, videos }: Props) {
  return (
    <>
      <B2BTopbar />

      <main style={{ padding: "28px 32px", maxWidth: 1280, minWidth: 0 }}>

        {/* Hero strip */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "28px 36px", borderRadius: 24,
          background: "#fff", border: "1px solid #E8DFD2",
          boxShadow: "0 10px 30px rgba(34,29,35,.06)",
          marginBottom: 52, gap: 24,
        }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#FFFDF0", border: "1px solid #F0D35E",
              borderRadius: 999, padding: "8px 13px",
              fontWeight: 900, fontSize: 12, marginBottom: 14,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: 999,
                background: "#FFCE00", border: "1px solid #221D23", display: "inline-block",
              }} />
              Updated every week
            </div>
            <h1 style={{
              margin: 0, fontSize: 36, fontWeight: 600,
              letterSpacing: "-.055em", lineHeight: 1.05, color: "#221D23",
            }}>Stay current with AI</h1>
            <p style={{ margin: "12px 0 0", fontSize: 15, color: "#746F78", fontWeight: 500, lineHeight: 1.5, maxWidth: 520 }}>
              Latest AI news, short launch videos, and practical perspectives — curated weekly for your team.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
            {[
              { icon: "📰", label: "News" },
              { icon: "▶", label: "Videos" },
              { icon: "💡", label: "Perspectives" },
            ].map(({ icon, label }) => (
              <div key={label} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                padding: "16px 20px", borderRadius: 18,
                background: "#FEFCFA", border: "1px solid #E8DFD2",
                minWidth: 72, fontSize: 22,
              }}>
                <span>{icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#746F78" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

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

        {/* AI at Work Questions */}
        <WorkQuestionsSection />

      </main>
    </>
  );
}
