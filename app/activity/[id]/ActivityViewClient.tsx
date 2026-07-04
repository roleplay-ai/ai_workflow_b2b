"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import QuizModal from "@/components/QuizModal";
import CelebrationModal from "@/components/CelebrationModal";
import VideoModal from "@/components/VideoModal";
import RotatingTools from "@/components/RotatingTools";
import type { ToolLogoMap } from "@/lib/toolLogos";
import { normalizeActivityTools, resolveActivityOpenLink } from "@/lib/tools";
import MdText from "@/components/MdText";
import SlideZoom from "@/components/SlideZoom";
import type { WorkflowStep, Quiz } from "@/types";
import { buildCoachChatMessage } from "@/types";
import type { Profile, Activity, ActivityContent, ActivityStep, UserProgress } from "@/lib/supabase/types";
import s from "./activity-panel.module.css";

const OVERVIEW_CARD_TONES = [s.overviewCardTone0, s.overviewCardTone1, s.overviewCardTone2];

type Props = {
  profile: (Profile & { companies: { name: string } | null }) | null;
  activity: Activity & { activity_content: ActivityContent | null };
  activitySteps: ActivityStep[];
  progress: UserProgress | null;
  toolLogos: ToolLogoMap;
  toolTryUrls: Record<string, string>;
};

export default function ActivityViewClient({ profile, activity, activitySteps, progress: initProgress, toolLogos, toolTryUrls }: Props) {
  const supabase = createClient();
  const content = activity.activity_content;
  const whatYouGet = content?.what_you_will_get ?? [];

  const steps = useMemo((): WorkflowStep[] => {
    const slideImages = content?.slide_images ?? [];
    return activitySteps.map(st => ({
      id: st.id,
      step_number: st.step_number,
      slide_number: st.slide_number,
      title: st.title,
      what_learner_sees: st.what_learner_sees,
      what_this_means: st.what_this_means,
      what_to_do: st.what_to_do,
      if_stuck: st.if_stuck,
      callout: st.callout,
      coach_next: st.coach_next,
      try_asking: st.try_asking ?? [],
      slideUrl: slideImages[st.slide_number - 1]?.url ?? undefined,
    }));
  }, [activitySteps, content?.slide_images]);

  const quizForStep = useMemo((): Record<number, Quiz> => {
    const q = content?.quiz ?? [];
    const map: Record<number, Quiz> = {};
    q.forEach((question, i) => {
      map[i] = { question: question.question, options: question.options, correct: question.correct_index, successMsg: "Correct! Well done.", wrongMsg: "Review this step and try again.", badge: "✓ Got it" };
    });
    return map;
  }, [content?.quiz]);

  type Msg = { role: "user" | "assistant"; content: string };

  const stepsForAPI = useMemo(() => steps.map(st => ({
    title: st.title, what_learner_sees: st.what_learner_sees,
    what_this_means: st.what_this_means, what_to_do: st.what_to_do, if_stuck: st.if_stuck,
  })), [steps]);

  const [current, setCurrent] = useState(-1);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState<Quiz | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoThumb, setVideoThumb] = useState<string | null>(null);
  const finishPendingRef = useRef(false);
  const [jumpToast, setJumpToast] = useState<string | null>(null);
  const [progress, setProgress] = useState(initProgress);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [slideOpen, setSlideOpen] = useState(false);
  const [chipsDismissed, setChipsDismissed] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<"resources" | "chat" | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const initDone = useRef(false);

  const isOverview = current === -1;
  const showOverview = isOverview && !isStarting;
  const step = isOverview ? null : steps[current];
  const slideUrl = step?.slideUrl ?? null;
  const activityTools = normalizeActivityTools(activity.tools);
  const openLink = resolveActivityOpenLink(activity.try_link, activityTools, toolTryUrls);
  const currentChips = isOverview ? (steps[0]?.try_asking ?? []) : (suggestions.length > 0 ? suggestions : (step?.try_asking ?? []));
  const hasInput = !!input.trim();
  const prevEnabled = !hasInput && current > 0 && !loading && !stepLoading && !initializing && !isStarting;
  const nextEnabled = !hasInput && !loading && !stepLoading && !initializing && !showCelebration && !isStarting;

  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);
  useEffect(() => { setChipsDismissed(false); }, [current, suggestions]);

  useEffect(() => {
    let sessionId = localStorage.getItem("nw_session_id");
    if (!sessionId) { sessionId = crypto.randomUUID(); localStorage.setItem("nw_session_id", sessionId); }
    fetch(`/api/activity/${activity.id}/view`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) }).catch(() => {});
  }, [activity.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const url = content?.video_url;
    if (!url) return;
    const ytMatch = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) { setVideoThumb(`https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`); }
  }, [content?.video_url]);

  useEffect(() => {
    if (!progress && profile) {
      supabase.from("user_progress").insert({ user_id: profile.id, activity_id: activity.id, status: "in_progress", completed_steps: [], updated_at: new Date().toISOString() }).select().single().then(({ data }) => { if (data) setProgress(data as any); });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    setMessages([{ role: "assistant", content: `Hi, I'm Nudgie 👋 Stuck on a step, or not sure why you're doing it? Just ask — I'm right here the whole way through.` }]);
    setInitializing(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const askCoach = async (userMessage: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: userMessage, stepIndex: current, activityTitle: activity.title, steps: stepsForAPI }) });
      const data = await res.json();
      if (data.reply) {
        setMessages(m => [...m, { role: "assistant", content: data.reply }]);
        if (Array.isArray(data.suggestions) && data.suggestions.length > 0) setSuggestions(data.suggestions);
        if (profile) supabase.from("chat_logs").insert({ user_id: profile.id, activity_id: activity.id, step_index: current, step_title: steps[current]?.title ?? "", user_message: userMessage, ai_response: data.reply, navigated_to_step: typeof data.goToStep === "number" ? data.goToStep : null });
      }
      if (typeof data.goToStep === "number") {
        setCurrent(data.goToStep); setSlideOpen(false);
        const jumped = steps[data.goToStep];
        const toastText = jumped?.callout && jumped.callout !== "" ? jumped.callout : jumped?.title ?? `Step ${data.goToStep + 1}`;
        setJumpToast(toastText);
        setTimeout(() => setJumpToast(null), 4000);
      }
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Sorry, I had trouble connecting. Please try again." }]);
    } finally { setLoading(false); }
  };

  const startActivity = () => {
    if (isStarting) return;
    setIsStarting(true); setSuggestions([]); setStepLoading(true); setLoading(true);
    setTimeout(() => { setCurrent(0); setMessages(m => [...m, { role: "assistant", content: buildCoachChatMessage(steps[0]) }]); setIsStarting(false); setStepLoading(false); setLoading(false); }, 1500);
  };

  const finishActivity = async () => {
    const completedSteps = steps.map((_, i) => i);
    const payload = { status: "completed" as const, completed_steps: completedSteps, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    if (progress) {
      const { data } = await supabase.from("user_progress").update(payload).eq("id", progress.id).select().single();
      if (data) setProgress(data as UserProgress);
    } else if (profile) {
      const { data } = await supabase.from("user_progress").insert({ user_id: profile.id, activity_id: activity.id, ...payload }).select().single();
      if (data) setProgress(data as UserProgress);
    }
    setShowCelebration(true);
  };

  const handleVideoCompleted = async () => {
    setShowVideo(false);
    const payload = { status: "completed" as const, video_watched: true, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    if (progress) {
      const { data } = await supabase.from("user_progress").update(payload).eq("id", progress.id).select().single();
      if (data) setProgress(data as UserProgress);
    } else if (profile) {
      const { data } = await supabase.from("user_progress").insert({ user_id: profile.id, activity_id: activity.id, ...payload }).select().single();
      if (data) setProgress(data as UserProgress);
    }
    setShowCelebration(true);
  };

  const handleQuizClose = () => {
    setShowQuiz(false); setPendingQuiz(null);
    if (finishPendingRef.current) { finishPendingRef.current = false; void finishActivity(); }
  };

  const goNext = async () => {
    if (current >= steps.length - 1) {
      if (loading || stepLoading || initializing || hasInput || showCelebration) return;
      const quiz = quizForStep[current];
      if (quiz) { finishPendingRef.current = true; setPendingQuiz(quiz); setShowQuiz(true); return; }
      await finishActivity(); return;
    }
    if (loading || stepLoading || initializing || hasInput) return;
    const quiz = quizForStep[current];
    if (quiz) { setPendingQuiz(quiz); setShowQuiz(true); }
    setSlideOpen(false);
    const completedSteps = Array.from(new Set([...(progress?.completed_steps ?? []), current]));
    if (progress) supabase.from("user_progress").update({ completed_steps: completedSteps, updated_at: new Date().toISOString() }).eq("id", progress.id);
    const nextIndex = current + 1;
    setSuggestions([]); setMessages(m => [...m, { role: "user", content: "next" }]); setStepLoading(true); setLoading(true);
    setTimeout(() => { setCurrent(nextIndex); setMessages(m => [...m, { role: "assistant", content: buildCoachChatMessage(steps[nextIndex]) }]); setStepLoading(false); setLoading(false); }, 1500);
  };

  const goPrev = () => {
    if (current <= 0 || loading || stepLoading || initializing || hasInput) return;
    setSlideOpen(false); const prevIndex = current - 1;
    setSuggestions([]); setMessages(m => [...m, { role: "user", content: "previous" }]); setStepLoading(true); setLoading(true);
    setTimeout(() => { setCurrent(prevIndex); setMessages(m => [...m, { role: "assistant", content: buildCoachChatMessage(steps[prevIndex]) }]); setStepLoading(false); setLoading(false); }, 1500);
  };

  const goToStep = (stepNum: number) => {
    if (loading || stepLoading || initializing) return;
    const targetIndex = stepNum - 1;
    if (targetIndex < 0 || targetIndex >= steps.length || targetIndex === current) return;
    setSlideOpen(false); setSuggestions([]);
    setMessages(m => [...m, { role: "user", content: `go to step ${stepNum}` }]); setStepLoading(true); setLoading(true);
    setTimeout(() => { setCurrent(targetIndex); setMessages(m => [...m, { role: "assistant", content: buildCoachChatMessage(steps[targetIndex]) }]); setStepLoading(false); setLoading(false); }, 1500);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim(); setInput(""); setMessages(m => [...m, { role: "user", content: userMsg }]);
    await askCoach(userMsg);
  };

  const sendInline = () => { if (input.trim()) void sendMessage(); setActiveDrawer("chat"); };

  if (steps.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F8F6", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
        <header className={s.topbar}>
          <div className={s.titleBlock}>
            <div className={s.titleText}><div className={s.titleMain}>{activity.title}</div></div>
          </div>
          <div className={s.topActions}>
            <BackBtn />
          </div>
        </header>
        <div style={{ maxWidth: 720, margin: "60px auto", padding: "0 24px", textAlign: "center", color: "#6B6B6B" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
          <h2 style={{ fontWeight: 900, fontSize: 22, color: "#221D23", marginBottom: 8 }}>{activity.title}</h2>
          <p>Content for this activity hasn&apos;t been uploaded yet. Check back soon.</p>
          <BackBtn className={s.applyBtnEmpty} />
        </div>
      </div>
    );
  }

  return (
    <div className={s.pageWrap}>
      <header className={s.topbar}>
        <div className={s.titleBlock}>
          {activityTools.length > 0 ? (
            <RotatingTools tools={activityTools} toolLogos={toolLogos} iconSize={36} insetScale={0.9} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 14, background: "conic-gradient(from 35deg, #623cea, #3699fc, #23ce6b, #ffce00, #f68a29, #ed4551, #623cea)", boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.40)", flexShrink: 0 }}>
              {(activity.title?.trim()[0] ?? "A").toUpperCase()}
            </div>
          )}
          <div className={s.titleText}>
            <div className={s.titleRow}>
              <div className={s.titleMain}>{activity.title}</div>
              <div className={s.meta}>{activity.level} · {activity.time_estimate_minutes}m</div>
            </div>
          </div>
        </div>
        <div className={s.topActions}>
          <div className={s.progressMini}>{isStarting ? 1 : isOverview ? 0 : current + 1}/{steps.length}</div>
          <BackBtn />
        </div>
      </header>

      <main className={s.page}>
        <section className={s.focusCard}>
          {showOverview ? (
            <>
              <div className={s.overviewWrap}>
                <div className={s.overviewScroll}>
                  <div className={s.overviewHero}>
                    <div className={s.overviewHeroLeft}>
                      <div className={s.overviewPill}>Workflow overview</div>
                      <OverviewTitle title={activity.title} />
                      {activity.description && (
                        <p className={s.overviewDesc}>{activity.description.replace(/\*\*/g, "").replace(/\n+/g, " ").trim()}</p>
                      )}
                    </div>
                    {content?.video_url && (
                      <div className={s.overviewVideoCard}>
                        <button type="button" className={s.overviewVideoThumbBtn} onClick={() => setShowVideo(true)} aria-label="Watch walkthrough video">
                          {(videoThumb || activity.thumbnail_url) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className={s.overviewVideoThumbImg} src={videoThumb ?? activity.thumbnail_url ?? ""} alt="" />
                          ) : (
                            <div className={s.overviewVideoThumbPlaceholder} />
                          )}
                          <span className={s.overviewVideoPlay}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="8 5 19 12 8 19 8 5" /></svg>
                          </span>
                        </button>
                        <div className={s.overviewVideoFooter}>
                          <span className={s.overviewVideoLabel}>2-min walkthrough</span>
                          <button type="button" className={s.overviewVideoLink} onClick={() => setShowVideo(true)}>
                            Watch video <span aria-hidden="true">›</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {whatYouGet.length > 0 && (
                    <div className={s.overviewOutcomes}>
                      <div className={s.overviewOutcomesHead}>
                        <div className={s.overviewSectionLabel}>What you&apos;ll walk away with</div>
                        {activity.points > 0 && (
                          <div className={s.overviewPointsBadge}>
                            <span className={s.overviewPointsIcon} aria-hidden="true">⚡</span>
                            {activity.points} points available
                          </div>
                        )}
                      </div>
                      <div className={s.overviewCardGrid}>
                        {whatYouGet.map((item, i) => (
                          <div key={i} className={`${s.overviewCard} ${OVERVIEW_CARD_TONES[i % 3]}`}>
                            <div className={s.overviewCardIcon}>{item.icon || "✨"}</div>
                            <div className={s.overviewCardTitle}>{item.title}</div>
                            <div className={s.overviewCardDesc}>{item.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className={s.overviewFooter}>
                <div className={s.overviewFooterActions}>
                  {openLink && (
                    <a href={openLink.url} target="_blank" rel="noreferrer" className={`${s.overviewBtn} ${s.overviewBtnGhost}`}>
                      Open {openLink.label} ↗
                    </a>
                  )}
                  <button type="button" onClick={startActivity} disabled={isStarting} className={`${s.overviewBtn} ${s.overviewBtnPrimary}`}>
                    Let&apos;s start, Step 1 →
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={s.focusHead}>
                <div>
                  <div className={s.stepPill}><span className={s.stepPillDot} />Step {(isStarting ? 0 : current) + 1} of {steps.length}</div>
                  <h2 className={s.focusTitle}>{(isStarting ? steps[0] : step)?.title ?? activity.title}</h2>
                </div>
                <div className={s.quickActions}>
                  <button type="button" className={s.ghostBtn} onClick={() => setActiveDrawer("resources")}>Resources</button>
                  {content?.video_url && (
                    <button type="button" className={s.ghostBtn} onClick={() => setShowVideo(true)}>▶ Video</button>
                  )}
                  <button type="button" className={s.nudgeCta} onClick={() => setActiveDrawer("chat")}>
                    <span className={s.nudgeIcon}>🤖</span><span>Ask Nudgie</span>
                  </button>
                </div>
              </div>

              <div className={s.content}>
                {stepLoading || isStarting ? (
                  <StepSkeleton />
                ) : (
                  <div className={s.workRow}>
                    <aside className={s.instructionCard}>
                      <div className={s.label}>What to do</div>
                      {step?.what_to_do && step.what_to_do.length > 0 ? (
                        <ul className={s.taskList}>
                          {step.what_to_do.map((item, i) => (
                            <li key={i} className={s.taskListItem}>
                              <span className={s.num}>{i + 1}</span>
                              <span><MdText text={item} /></span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ margin: 0, color: "#667085", fontSize: 14 }}>Follow along with the screenshot.</p>
                      )}
                      {(step?.callout || step?.if_stuck) && (
                        <div className={s.hint}>{step.callout || `💡 ${step.if_stuck}`}</div>
                      )}
                    </aside>

                    <section className={s.screenCard}>
                      <div className={s.browserBar}>
                        <span className={s.traffic} /><span className={s.traffic} /><span className={s.traffic} />
                        <span className={s.screenTitle}>Screenshot guide</span>
                      </div>
                      <div className={s.screenshotWrap}>
                        {slideUrl ? (
                          <>
                            <SlideZoom src={slideUrl} alt={`Step ${current + 1}`} open={slideOpen} onClose={() => setSlideOpen(false)} />
                            <button type="button" className={s.expandBtn} onClick={() => setSlideOpen(true)} title="Expand">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
                            </button>
                          </>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "#98a2b3", fontSize: 13.5, fontWeight: 600 }}>
                            <span style={{ fontSize: 36 }}>🖼️</span>No slide for this step
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                )}
              </div>

              <div className={s.belowScreen}>
                <div className={s.askInline}>
                  <span className={s.miniNudgeIcon}>🤖</span>
                  <input className={s.askInlineInput} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) sendInline(); }} placeholder="Stuck? Ask Nudgie…" suppressHydrationWarning />
                  <button type="button" className={s.sendBtn} onClick={sendInline} disabled={loading || isStarting}>➤</button>
                </div>
                <div className={s.footerActions}>
                  <button type="button" className={s.backBtn} onClick={goPrev} disabled={!prevEnabled}>← Back</button>
                  <button type="button" className={s.finishBtn} onClick={goNext} disabled={!nextEnabled}>
                    {current < steps.length - 1 ? "✓ Next step →" : "✓ Finish activity"}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      <div className={`${s.overlay} ${activeDrawer ? s.overlayShow : ""}`} onClick={() => setActiveDrawer(null)} />

      {/* Resources drawer */}
      <aside className={`${s.drawer} ${activeDrawer === "resources" ? s.drawerOpen : ""}`}>
        <div className={s.drawerHead}>
          <h3 className={s.drawerHeadTitle}>Resources</h3>
          <button type="button" className={s.closeBtn} onClick={() => setActiveDrawer(null)}>×</button>
        </div>
        <div className={s.drawerBody}>
          <div className={s.resourceCard}>
            <div className={s.resourceCardTitle}>🎯 Goals</div>
            {(content?.goals?.length ?? 0) > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                {content!.goals.map((g, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 14, lineHeight: 1.45, color: "#344054" }}>
                    <span style={{ color: "#16A34A", flexShrink: 0 }}>✓</span>{g}
                  </li>
                ))}
              </ul>
            ) : <p style={{ margin: 0, fontSize: 14, color: "#667085" }}>No goals set yet.</p>}
          </div>
          <div className={s.resourceCard}>
            <div className={s.resourceCardTitle}>🔑 Access Needed</div>
            {(content?.access_needed?.length ?? 0) > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                {content!.access_needed.map((a, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 14, lineHeight: 1.45, color: "#344054" }}>
                    <span style={{ color: "#667085", flexShrink: 0 }}>·</span>{a}
                  </li>
                ))}
              </ul>
            ) : <p style={{ margin: 0, fontSize: 14, color: "#667085" }}>No special access required.</p>}
          </div>
          <div className={s.resourceCard}>
            <div className={s.resourceCardTitle}>📥 Downloads</div>
            {(content?.downloads?.length ?? 0) > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {content!.downloads.map((d, i) => (
                  <a key={i} href={d.url} download target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, border: "1px solid #e4eaf2", background: "#fff", textDecoration: "none", color: "#101828", fontSize: 13, fontWeight: 700 }}>
                    <span style={{ fontSize: 16 }}>{dlIcon(d.type)}</span><span style={{ flex: 1 }}>{d.label}</span><span style={{ color: "#94A3B8" }}>↓</span>
                  </a>
                ))}
              </div>
            ) : <p style={{ margin: 0, fontSize: 14, color: "#667085" }}>No files for this workflow yet.</p>}
          </div>
          <div className={s.resourceCard}>
            <div className={s.resourceCardTitle}>💬 Copy Prompts</div>
            {(content?.prompts?.length ?? 0) > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {content!.prompts.map((p, i) => (
                  <div key={i} style={{ border: "1px solid #e4eaf2", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 12px", background: "#f9fbfd", borderBottom: "1px solid #e4eaf2" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#344054" }}>{p.label}</span>
                      <button type="button" suppressHydrationWarning onClick={() => { navigator.clipboard.writeText(p.text).then(() => { setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 2000); }); }} style={{ border: "1px solid", borderColor: copiedIdx === i ? "rgba(35,206,104,.3)" : "#e4eaf2", background: copiedIdx === i ? "rgba(35,206,104,.08)" : "white", color: copiedIdx === i ? "#16A34A" : "#667085", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                        {copiedIdx === i ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                    <pre style={{ margin: 0, padding: "8px 12px", fontSize: 12, fontFamily: "monospace", whiteSpace: "pre-wrap", lineHeight: 1.5, color: "#475569", maxHeight: 100, overflowY: "auto", background: "white" }}>{p.text}</pre>
                  </div>
                ))}
              </div>
            ) : <p style={{ margin: 0, fontSize: 14, color: "#667085" }}>No prompts yet.</p>}
          </div>
          <div className={s.resourceCard}>
            <div className={s.resourceCardTitle}>📋 Your Steps</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {steps.map((st, i) => {
                const done = !isOverview && i < current;
                const active = !isOverview && i === current;
                return (
                  <button key={i} type="button" className={`${s.stepItem} ${active ? s.stepItemActive : ""}`} onClick={() => { goToStep(i + 1); setActiveDrawer(null); }} disabled={loading || stepLoading || initializing}>
                    <div className={s.stepNum} style={{ background: done ? "#23ce6b" : active ? "#2f6fed" : "#f1f5f9", color: done || active ? "white" : "#94A3B8" }}>{done ? "✓" : i + 1}</div>
                    <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: done ? "#16A34A" : active ? "#101828" : "#667085", lineHeight: 1.3, flex: 1 }}>{st.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* Chat drawer */}
      <aside className={`${s.drawer} ${activeDrawer === "chat" ? s.drawerOpen : ""}`}>
        <div className={s.drawerHead}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: "50%", background: "#f6d34d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</span>
            <div>
              <h3 className={s.drawerHeadTitle} style={{ marginBottom: 2 }}>Ask Nudgie</h3>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>{isOverview ? "ready when you are 👋" : `step ${current + 1} · ${step?.title ?? ""}`}</div>
            </div>
          </div>
          <button type="button" className={s.closeBtn} onClick={() => setActiveDrawer(null)}>×</button>
        </div>
        <div className={s.chatDrawerBody}>
          <div ref={chatRef} className={s.chatMessages}>
            {initializing && <div className={`${s.bubble} ${s.bubbleAi}`} style={{ color: "#94A3B8" }}>Preparing your session…</div>}
            {messages.map((m, i) => (
              <div key={i} className={`${s.bubble} ${m.role === "assistant" ? s.bubbleAi : s.bubbleUser}`}>
                {m.role === "user" ? m.content : <MdText text={m.content} />}
              </div>
            ))}
            {loading && <div className={`${s.bubble} ${s.bubbleAi}`} style={{ color: "#94A3B8" }}>Thinking…</div>}
          </div>

          {!chipsDismissed && currentChips.length > 0 && !loading && (
            <div className={s.chatChips}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#94A3B8" }}>{isOverview ? "TRY ASKING…" : "OR ASK ME TO…"}</span>
                <button type="button" onClick={() => setChipsDismissed(true)} style={{ width: 22, height: 22, borderRadius: "50%", border: "1px solid #e4eaf2", background: "white", color: "#94A3B8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontFamily: "inherit" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              {currentChips.map((chip, i) => (
                <button key={i} type="button" className={s.chip} onClick={() => { setInput(""); setMessages(m => [...m, { role: "user", content: chip }]); askCoach(chip); }}>{chip}</button>
              ))}
            </div>
          )}

          <div className={s.chatInputWrap}>
            <div className={s.chatInputRow}>
              <input className={s.chatInputField} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) sendMessage(); }} placeholder="Ask Nudgie anything…" suppressHydrationWarning />
              <button type="button" className={s.chatSendBtn} onClick={sendMessage} disabled={!hasInput || loading}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {showQuiz && pendingQuiz && <QuizModal quiz={pendingQuiz} onClose={handleQuizClose} />}
      {showCelebration && <CelebrationModal activityTitle={activity.title} points={activity.points} onContinue={() => { window.location.href = "/workflows"; }} />}
      {showVideo && content?.video_url && <VideoModal src={content.video_url} activityTitle={activity.title} alreadyWatched={!!progress?.video_watched} onClose={() => setShowVideo(false)} onCompleted={handleVideoCompleted} />}

      {jumpToast && (
        <div className={s.jumpToast}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>{jumpToast}
        </div>
      )}
    </div>
  );
}

function BackBtn({ className }: { className?: string }) {
  const [navigating, setNavigating] = useState(false);
  return (
    <Link href="/workflows" className={`${className ?? s.applyBtn}${navigating ? ` ${s.applyBtnLoading}` : ""}`} onClick={() => setNavigating(true)} aria-busy={navigating}>
      {navigating && <span className={s.applyBtnSpinner} aria-hidden="true" />}
      <span aria-hidden="true">←</span> Back
    </Link>
  );
}

function OverviewTitle({ title }: { title: string }) {
  const parts = title.split(/(\*\*[^*]+\*\*)/g);
  return (
    <h2 className={s.overviewTitle}>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**")
          ? <span key={i} className={s.overviewTitleAccent}>{part.slice(2, -2)}</span>
          : <span key={i}>{part}</span>
      )}
    </h2>
  );
}

function StepSkeleton() {
  return (
    <div className={s.workRow}>
      <aside className={s.instructionCard}>
        <div className={s.label}>What to do</div>
        <div className={s.instructionThinking}>
          <span className={s.instructionThinkingAvatar}>🤖</span>
          <div className={s.instructionThinkingBubble}>Thinking…</div>
        </div>
      </aside>
      <section className={s.screenCard}>
        <div className={s.browserBar}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#e4eaf2" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#e4eaf2" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#e4eaf2" }} />
        </div>
        <div className={s.skeletonBlock} style={{ width: "100%", aspectRatio: "16/10", borderRadius: 0 }} />
      </section>
    </div>
  );
}

function dlIcon(type: string): string {
  return ({ pdf: "📄", ppt: "📊", xlsx: "📗", doc: "📝", other: "📎" } as Record<string, string>)[type] ?? "📎";
}
