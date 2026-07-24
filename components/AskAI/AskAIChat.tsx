"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SuggestedWorkflowCard from "./SuggestedWorkflowCard";
import AnswerSections from "./AnswerSections";
import AskTeamDialog from "./AskTeamDialog";
import AskAIThinking from "./AskAIThinking";
import SlideZoom from "@/components/SlideZoom";
import { useNavigationLoading } from "@/components/NavigationLoading";
import { ASK_LIMITS } from "@/lib/ask/guardrails";
import styles from "./ask-ai.module.css";
import "@/app/card-styles.css";

type Citation = {
  documentTitle: string;
  pageNumber: number;
  excerpt: string;
  images: { imageUrl: string; width: number | null; height: number | null }[];
};

type SuggestedWorkflow = {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
};

type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  suggestedWorkflows?: SuggestedWorkflow[];
};

type AskCategory = {
  name: string;
  label: string;
  description: string | null;
  icon: string | null;
};

type Props = {
  categories: AskCategory[];
  userId: string;
};

const POPULAR_QUESTIONS = [
  "What can AI agents do?",
  "Can AI analyze Excel files?",
  "Is the paid plan worth it?",
] as const;

const CATEGORY_ICONS = ["▧", "▥", "⌕", "◇", "▶", "◌", "✦"] as const;
const MAX_COMPOSER_HEIGHT = 200;

function isMissingPreparedColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    error.message?.includes("metadata") === true ||
    error.message?.includes("ask_conversations") === true
  );
}

function metadataFromUnknown(value: unknown): {
  citations: Citation[];
  suggestedWorkflows: SuggestedWorkflow[];
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { citations: [], suggestedWorkflows: [] };
  }
  const metadata = value as Record<string, unknown>;
  return {
    citations: Array.isArray(metadata.citations) ? metadata.citations as Citation[] : [],
    suggestedWorkflows: Array.isArray(metadata.suggestedWorkflows)
      ? metadata.suggestedWorkflows as SuggestedWorkflow[]
      : [],
  };
}

function previousUserQuestion(messages: ChatMessage[], index: number): string {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    if (messages[cursor]?.role === "user") return messages[cursor].content;
  }
  return "";
}

/** Full-page Ask AI client. Existing RAG behavior stays in /api/ask; this
 * component owns only conversation presentation and lifecycle. */
export default function AskAIChat({ categories, userId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startNavigating } = useNavigationLoading();
  const conversationParam = searchParams.get("conversation");
  const newParam = searchParams.get("new");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [conversationTitle, setConversationTitle] = useState("New conversation");
  const [zoomOpenKey, setZoomOpenKey] = useState<string | null>(null);
  const [teamDialogFor, setTeamDialogFor] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<number, "up" | "down">>({});
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeSessionRef = useRef(sessionId);
  const locationKeyRef = useRef<string | null>(null);
  const loadTokenRef = useRef(0);

  function resetConversation(nextSessionId: string) {
    loadTokenRef.current += 1;
    activeSessionRef.current = nextSessionId;
    setSessionId(nextSessionId);
    setMessages([]);
    setInput("");
    setLoading(false);
    setLoadingConversation(false);
    setLoadError(null);
    setConversationTitle("New conversation");
    setFeedback({});
    setTeamDialogFor(null);
  }

  useEffect(() => {
    const locationKey = conversationParam
      ? `conversation:${conversationParam}`
      : newParam
        ? `new:${newParam}`
        : "blank";
    if (locationKeyRef.current === locationKey) return;
    locationKeyRef.current = locationKey;

    if (!conversationParam) {
      const requestedId = newParam && /^[0-9a-f-]{36}$/i.test(newParam)
        ? newParam
        : crypto.randomUUID();
      resetConversation(requestedId);
      return;
    }

    if (!/^[0-9a-f-]{36}$/i.test(conversationParam)) {
      resetConversation(crypto.randomUUID());
      setLoadError("That conversation link is invalid.");
      return;
    }

    const requestedSessionId = conversationParam;
    const token = loadTokenRef.current + 1;
    loadTokenRef.current = token;
    activeSessionRef.current = requestedSessionId;
    setSessionId(requestedSessionId);
    setMessages([]);
    setFeedback({});
    setLoadError(null);
    setLoadingConversation(true);

    void (async () => {
      const supabase = createClient();
      const initialMessageResult = await supabase
        .from("kb_chat_messages")
        .select("id, role, content, metadata, created_at")
        .eq("session_id", requestedSessionId)
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      let messageRows = initialMessageResult.data as {
        id: string;
        role: string;
        content: string;
        metadata?: unknown;
        created_at: string;
      }[] | null;
      let messageError = initialMessageResult.error;

      if (messageError && isMissingPreparedColumn(messageError)) {
        const fallbackMessageResult = await supabase
          .from("kb_chat_messages")
          .select("id, role, content, created_at")
          .eq("session_id", requestedSessionId)
          .eq("user_id", userId)
          .order("created_at", { ascending: true });
        messageRows = fallbackMessageResult.data;
        messageError = fallbackMessageResult.error;
      }

      const conversationResult = await supabase
        .from("ask_conversations")
        .select("title, model, effort")
        .eq("id", requestedSessionId)
        .eq("user_id", userId)
        .maybeSingle();

      if (loadTokenRef.current !== token) return;

      if (messageError) {
        setLoadError("We couldn’t reopen that conversation.");
        setLoadingConversation(false);
        return;
      }

      const restoredMessages = (messageRows ?? []).map((row) => {
        const metadata = metadataFromUnknown("metadata" in row ? row.metadata : null);
        return {
          id: row.id as string,
          role: row.role as "user" | "assistant",
          content: row.content as string,
          citations: metadata.citations,
          suggestedWorkflows: metadata.suggestedWorkflows,
        };
      });

      setMessages(restoredMessages);
      setConversationTitle(
        !conversationResult.error && conversationResult.data?.title
          ? conversationResult.data.title
          : restoredMessages.find((message) => message.role === "user")?.content.slice(0, 120) ?? "Conversation",
      );
      setLoadingConversation(false);
    })();
  }, [conversationParam, newParam, userId]);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, MAX_COMPOSER_HEIGHT)}px`;
  }, [input]);

  useEffect(() => {
    if (conversationParam) return;
    const prefill = searchParams.get("q");
    if (prefill) setInput(prefill);
  }, [conversationParam, searchParams]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function newChat() {
    const nextSessionId = crypto.randomUUID();
    locationKeyRef.current = `new:${nextSessionId}`;
    resetConversation(nextSessionId);
    router.push(`/ask-ai?new=${nextSessionId}`, { scroll: false });
  }

  async function sendMessage(text?: string) {
    const question = (text ?? input).trim();
    if (!question || loading) return;

    const requestSessionId = activeSessionRef.current;
    setMessages((previous) => [...previous, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    setLoadError(null);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, sessionId: requestSessionId }),
      });
      const body = await response.json().catch(() => ({}));

      if (activeSessionRef.current !== requestSessionId) return;

      if (!response.ok) {
        setMessages((previous) => [
          ...previous,
          { role: "assistant", content: body.error ?? "Something went wrong." },
        ]);
      } else {
        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            content: body.answer,
            citations: body.citations ?? [],
            suggestedWorkflows: body.suggestedWorkflows ?? [],
          },
        ]);
      }

      if (conversationTitle === "New conversation") {
        setConversationTitle(question.slice(0, 120));
      }
      locationKeyRef.current = `conversation:${requestSessionId}`;
      router.replace(`/ask-ai?conversation=${requestSessionId}`, { scroll: false });
      window.dispatchEvent(new CustomEvent("ask:conversations-changed"));
    } catch {
      if (activeSessionRef.current === requestSessionId) {
        setMessages((previous) => [
          ...previous,
          { role: "assistant", content: "Couldn’t reach the assistant — try again in a moment." },
        ]);
      }
    } finally {
      if (activeSessionRef.current === requestSessionId) setLoading(false);
    }
  }

  function openCategory(category: string) {
    const href = category
      ? `/workflows?category=${encodeURIComponent(category)}`
      : "/workflows?browse=all";
    startNavigating(href);
    router.push(href);
  }

  const composer = (landing: boolean) => (
    <div className={`${styles.composer} ${landing ? styles.composerLanding : ""}`}>
      <textarea
        ref={textareaRef}
        autoFocus={landing}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void sendMessage();
          }
        }}
        placeholder={landing ? "How is Claude different from ChatGPT?" : "Ask a follow-up…"}
        rows={1}
        maxLength={ASK_LIMITS.maxQuestionChars}
        aria-label="Ask AI"
      />
      <button
        type="button"
        onClick={() => void sendMessage()}
        disabled={loading || !input.trim()}
        aria-label="Send question"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </div>
  );

  const newChatButton = (
    <button type="button" className={styles.newChatButton} onClick={newChat} aria-label="Start a new conversation" title="New conversation">
      <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12.8 3.2 16.8 7.2M4 16l2.1-.4 9.5-9.5a1.4 1.4 0 0 0 0-2l-.7-.7a1.4 1.4 0 0 0-2 0L3.5 13 3 17l4-.5" />
      </svg>
    </button>
  );

  if (loadingConversation) {
    return (
      <main className={styles.chatPage}>
        <div className={styles.loadingConversation} role="status">
          <span className={styles.loadingDot} />
          Reopening conversation…
        </div>
      </main>
    );
  }

  if (messages.length === 0) {
    return (
      <main className={styles.landingPage}>
        {newChatButton}
        <div className={styles.landingContent}>
          <h1>Ask anything about AI tools</h1>

          <div className={styles.landingComposer}>{composer(true)}</div>
          <p className={styles.scopeLine}>Answers questions about AI tools and how to use them</p>

          {loadError ? <div className={styles.loadError}>{loadError}</div> : null}

          <section className={styles.landingSection} aria-labelledby="popular-questions">
            <h2 id="popular-questions">Popular questions</h2>
            <div className={styles.questionRow}>
              {POPULAR_QUESTIONS.map((question) => (
                <button type="button" key={question} onClick={() => void sendMessage(question)}>
                  {question}
                </button>
              ))}
            </div>
          </section>

          {categories.length > 0 ? (
            <section className={`${styles.landingSection} ${styles.categorySection}`} aria-labelledby="compare-by-task">
              <div className={styles.sectionHeading}>
                <h2 id="compare-by-task">Compare tools by task</h2>
                <button type="button" onClick={() => openCategory("")}>See all categories</button>
              </div>
              <div className={styles.categoryGrid}>
                {categories.map((category, index) => (
                  <button type="button" key={category.name} onClick={() => openCategory(category.name)}>
                    <span className={styles.categoryIcon}>{category.icon || CATEGORY_ICONS[index % CATEGORY_ICONS.length]}</span>
                    <span className={styles.categoryText}>
                      <strong>{category.label}</strong>
                    </span>
                    <span className={styles.categoryArrow} aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className={styles.chatPage}>
      <div className={styles.conversationHeader}>
        <div className={styles.conversationIdentity}>
          <strong>{conversationTitle}</strong>
          <span>Sonnet · Medium</span>
        </div>
        {newChatButton}
      </div>

      <div ref={listRef} className={styles.messageScroller}>
        <div className={styles.messageList}>
          {loadError ? <div className={styles.loadError}>{loadError}</div> : null}
          {messages.map((message, index) => (
            <article
              key={message.id ?? `${message.role}-${index}`}
              className={`${styles.message} ${message.role === "user" ? styles.userMessage : styles.assistantMessage}`}
            >
              {message.role === "user" ? (
                <div className={styles.userBubble}>{message.content}</div>
              ) : (
                <div className={styles.assistantBody}>
                  <AnswerSections content={message.content} />

                  {message.citations && message.citations.length > 0 ? (
                    <div className={styles.sources}>
                      <h2>Sources</h2>
                      <div className={styles.sourceList}>
                        {message.citations.map((citation, citationIndex) => (
                          <details key={`${citation.documentTitle}-${citation.pageNumber}-${citationIndex}`}>
                            <summary>{citation.documentTitle} · p. {citation.pageNumber}</summary>
                            {citation.excerpt ? <p>{citation.excerpt}</p> : null}
                          </details>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {message.citations?.some((citation) => citation.images.length > 0) ? (
                    <div className={styles.screenshotGrid}>
                      {message.citations.flatMap((citation, citationIndex) =>
                        citation.images.map((image, imageIndex) => {
                          const zoomKey = `${index}-${citationIndex}-${imageIndex}`;
                          const aspect = image.width && image.height ? image.width / image.height : 4 / 3;
                          return (
                            <div
                              className={styles.screenshot}
                              key={zoomKey}
                              style={{ aspectRatio: String(aspect) }}
                            >
                              <SlideZoom
                                src={image.imageUrl}
                                alt={`Supporting screenshot from ${citation.documentTitle}, page ${citation.pageNumber}`}
                                open={zoomOpenKey === zoomKey}
                                onClose={() => setZoomOpenKey(null)}
                              />
                              <button type="button" onClick={() => setZoomOpenKey(zoomKey)} aria-label="Enlarge screenshot">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
                                </svg>
                              </button>
                            </div>
                          );
                        }),
                      )}
                    </div>
                  ) : null}

                  {message.suggestedWorkflows && message.suggestedWorkflows.length > 0 ? (
                    <section className={styles.recommendedWorkflows}>
                      <h2>Recommended workflows</h2>
                      <div className={`ndb-root ${styles.workflowGrid}`}>
                        {message.suggestedWorkflows.map((workflow) => (
                          <SuggestedWorkflowCard
                            key={workflow.id}
                            id={workflow.id}
                            title={workflow.title}
                            description={workflow.description}
                            thumbnailUrl={workflow.thumbnailUrl}
                          />
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <div className={styles.responseActions}>
                    <span>Was this helpful?</span>
                    <button
                      type="button"
                      className={feedback[index] === "up" ? styles.feedbackActive : ""}
                      onClick={() => setFeedback((current) => ({ ...current, [index]: "up" }))}
                      aria-pressed={feedback[index] === "up"}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={feedback[index] === "down" ? styles.feedbackActive : ""}
                      onClick={() => setFeedback((current) => ({ ...current, [index]: "down" }))}
                      aria-pressed={feedback[index] === "down"}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      className={styles.askTeamButton}
                      onClick={() => setTeamDialogFor(previousUserQuestion(messages, index))}
                    >
                      Ask our team
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
          {loading ? <AskAIThinking /> : null}
        </div>
      </div>

      <div className={styles.composerDock}>
        <div className={styles.composerDockInner}>
          {composer(false)}
          <p>Sonnet · Medium · Answers can contain mistakes, so check important details.</p>
        </div>
      </div>

      <AskTeamDialog
        open={teamDialogFor !== null}
        question={teamDialogFor ?? ""}
        sessionId={sessionId}
        onClose={() => setTeamDialogFor(null)}
      />
    </main>
  );
}
