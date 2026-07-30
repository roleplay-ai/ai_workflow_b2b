"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ToolIcon from "@/components/ToolIcon";
import {
  CHATBOT_FILTERS,
  CHATBOT_FILTER_LABELS,
  isChatbotFilter,
  type ChatbotFilter,
} from "@/lib/chatbotFilter";
import type { ToolLogoMap } from "@/lib/toolLogos";
import type { PreferredAiTool, WhatsNewUpdate } from "@/lib/supabase/types";
import styles from "./ask-ai-controls.module.css";

type ToolChoice = ChatbotFilter | "all";

type Props = {
  toolLogos: ToolLogoMap;
  updates: WhatsNewUpdate[];
  defaultTool: PreferredAiTool | null;
  canSaveDefault: boolean;
};

function toolLabel(tool: ToolChoice): string {
  return tool === "all" ? "All AI tools" : CHATBOT_FILTER_LABELS[tool];
}

function formatPublishedDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function AllToolsMark({ large = false }: { large?: boolean }) {
  return (
    <span className={`${styles.allToolsMark} ${large ? styles.largeMark : ""}`} aria-hidden="true">
      ✦
    </span>
  );
}

function ToolMark({
  tool,
  toolLogos,
  large = false,
}: {
  tool: ToolChoice;
  toolLogos: ToolLogoMap;
  large?: boolean;
}) {
  if (tool === "all") return <AllToolsMark large={large} />;
  return <ToolIcon tool={tool} size={large ? 34 : 22} logos={toolLogos} />;
}

export default function AskAIToolControls({
  toolLogos,
  updates,
  defaultTool,
  canSaveDefault,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTool = searchParams.get("tool");
  const selectedTool: ToolChoice = isChatbotFilter(queryTool) ? queryTool : "all";
  const [pendingTool, setPendingTool] = useState<ToolChoice>(selectedTool);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [saveDefault, setSaveDefault] = useState(defaultTool !== null);
  const [savingPreference, setSavingPreference] = useState(false);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const [newsOpen, setNewsOpen] = useState(false);
  const [newsFilter, setNewsFilter] = useState<ToolChoice>(selectedTool);
  const [portalReady, setPortalReady] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPendingTool(selectedTool);
  }, [selectedTool]);

  useEffect(() => setPortalReady(true), []);

  useEffect(() => {
    setSaveDefault(defaultTool !== null);
  }, [defaultTool]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setSelectorOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setSelectorOpen(false);
      setNewsOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!newsOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [newsOpen]);

  async function applySelection() {
    setSavingPreference(true);
    setPreferenceError(null);
    let preferenceError: { message: string } | null = null;
    if (canSaveDefault) {
      const supabase = createClient();
      const { error } = await supabase.rpc("set_preferred_ai_tool", {
        p_tool: saveDefault ? pendingTool : null,
      });
      preferenceError = error;
    }
    setSavingPreference(false);

    const params = new URLSearchParams(searchParams.toString());
    if (pendingTool === "all") params.delete("tool");
    else params.set("tool", pendingTool);

    router.replace(`/ask-ai${params.size > 0 ? `?${params.toString()}` : ""}`, { scroll: false });
    if (preferenceError) {
      setPreferenceError("The filter changed, but your default couldn’t be saved. Apply the preference migration and try again.");
      return;
    }
    if (canSaveDefault) {
      window.dispatchEvent(new CustomEvent("ask:default-tool-changed", {
        detail: { tool: saveDefault ? pendingTool : null },
      }));
    }
    setSelectorOpen(false);
  }

  function openNews() {
    setNewsFilter(selectedTool);
    setNewsOpen(true);
  }

  const visibleUpdates = updates.filter(
    (update) => newsFilter === "all" || update.tool === newsFilter,
  );

  const newsDrawer = (
    <div className={`${styles.drawerLayer} ${newsOpen ? styles.drawerLayerOpen : ""}`} aria-hidden={!newsOpen}>
      <button
        type="button"
        className={styles.drawerOverlay}
        aria-label="Close What’s new"
        tabIndex={newsOpen ? 0 : -1}
        onClick={() => setNewsOpen(false)}
      />
      <aside className={styles.newsDrawer} role="dialog" aria-modal="true" aria-labelledby="whats-new-title" inert={!newsOpen}>
        <header className={styles.drawerHeader}>
          <div>
            <span>LATEST RELEASES</span>
            <h2 id="whats-new-title">What’s new</h2>
          </div>
          <button type="button" onClick={() => setNewsOpen(false)} aria-label="Close What’s new">×</button>
        </header>
        <p className={styles.drawerIntro}>Recent features and improvements across the AI tools you use.</p>

        <div className={styles.newsFilters} role="group" aria-label="Filter updates by AI tool">
          {(["all", ...CHATBOT_FILTERS] as ToolChoice[]).map((tool) => (
            <button
              type="button"
              key={tool}
              className={newsFilter === tool ? styles.newsFilterActive : ""}
              aria-pressed={newsFilter === tool}
              onClick={() => setNewsFilter(tool)}
            >
              {tool !== "all" ? <ToolMark tool={tool} toolLogos={toolLogos} /> : null}
              {tool === "all" ? "All" : toolLabel(tool)}
            </button>
          ))}
        </div>

        <div className={styles.updatesList}>
          {visibleUpdates.length > 0 ? visibleUpdates.map((update) => (
            <article className={styles.updateCard} key={update.id}>
              <div className={styles.updateMeta}>
                <span>
                  <ToolMark tool={update.tool} toolLogos={toolLogos} />
                  {CHATBOT_FILTER_LABELS[update.tool]}
                </span>
                <time dateTime={update.published_at}>{formatPublishedDate(update.published_at)}</time>
              </div>
              <h3>{update.title}</h3>
              <p>{update.summary}</p>
              <footer>
                <span>{update.tag}</span>
                {update.link_url ? (
                  <a href={update.link_url}>Explore update →</a>
                ) : null}
              </footer>
            </article>
          )) : (
            <div className={styles.emptyUpdates}>
              <span aria-hidden="true">✦</span>
              <strong>No updates here yet</strong>
              <p>New releases for this tool will appear here.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );

  return (
    <>
      <div className={styles.controls}>
        <div className={styles.selectorControl} ref={selectorRef}>
          <button
            type="button"
            className={`${styles.selectorButton} ${selectorOpen ? styles.selectorButtonOpen : ""}`}
            aria-haspopup="dialog"
            aria-expanded={selectorOpen}
            onClick={() => setSelectorOpen((current) => !current)}
          >
            <ToolMark tool={selectedTool} toolLogos={toolLogos} />
            <span className={styles.selectorCopy}>
              <small>Viewing</small>
              <strong>{toolLabel(selectedTool)}</strong>
            </span>
            <span className={styles.selectorChevron} aria-hidden="true">⌄</span>
          </button>

          {selectorOpen ? (
            <section className={styles.selectorPopover} role="dialog" aria-label="Choose your AI tool">
              <header className={styles.selectorHeader}>
                <div>
                  <strong>Choose your AI tool</strong>
                  <p>Show content for the tools you use.</p>
                </div>
                <button type="button" onClick={() => setSelectorOpen(false)} aria-label="Close tool selector">×</button>
              </header>

              <div className={styles.toolList}>
                {(["all", ...CHATBOT_FILTERS] as ToolChoice[]).map((tool) => {
                  const active = pendingTool === tool;
                  return (
                    <button
                      type="button"
                      key={tool}
                      className={`${styles.toolOption} ${active ? styles.toolOptionActive : ""}`}
                      onClick={() => setPendingTool(tool)}
                    >
                      <ToolMark tool={tool} toolLogos={toolLogos} large />
                      <span>
                        <strong>{toolLabel(tool)}</strong>
                        <small>{tool === "all" ? "Compare and learn across tools" : `Focus on ${toolLabel(tool)} content`}</small>
                      </span>
                      <i>{active ? "✓" : ""}</i>
                    </button>
                  );
                })}
              </div>

              {canSaveDefault ? (
                <label className={styles.saveChoice}>
                  <input
                    type="checkbox"
                    checked={saveDefault}
                    onChange={(event) => setSaveDefault(event.target.checked)}
                  />
                  <span className={styles.checkboxMark}>✓</span>
                  <span>
                    <strong>Save as my default AI tool</strong>
                    <small>Open with this selection on future visits.</small>
                  </span>
                </label>
              ) : null}

              <button
                type="button"
                className={styles.applyButton}
                disabled={savingPreference}
                onClick={() => void applySelection()}
              >
                {savingPreference ? "Saving…" : "Apply selection"}
              </button>
              {preferenceError ? <p className={styles.preferenceError} role="alert">{preferenceError}</p> : null}
            </section>
          ) : null}
        </div>

        <button type="button" className={styles.newsButton} onClick={openNews}>
          <span aria-hidden="true">✦</span>
          <span className={styles.newsLabel}>What’s new</span>
          {updates.length > 0 ? <b>{updates.length}</b> : null}
        </button>
      </div>

      {portalReady ? createPortal(newsDrawer, document.body) : null}
    </>
  );
}
