"use client";

import Link from "next/link";
import { CAPABILITIES, getToolPageDef, type CapabilitySlug, type ProviderTool } from "@/lib/capabilities";
import B2BTopbar from "@/components/B2BTopbar";
import ClaudeCapabilityGuide from "./ClaudeCapabilityGuide";
import ChatGPTGuide from "../../ChatGPTGuide";
import GeminiGuide from "../../GeminiGuide";
import styles from "../../capabilities.module.css";

type Props = {
  slug: CapabilitySlug;
  tool: ProviderTool;
  count: number;
};

export default function ToolCapabilityClient({ slug, tool, count }: Props) {
  const def = CAPABILITIES[slug];
  const page = getToolPageDef(slug, tool);
  const workflowsHref = `/workflows?content_type=${encodeURIComponent(def.contentType)}&tool=${tool}`;

  if (
    tool === "claude"
    && (
      slug === "skills"
      || slug === "projects"
      || slug === "vibe-coding"
      || slug === "scheduled-actions"
      || slug === "ai-agents"
      || slug === "coding-agents"
    )
  ) {
    return (
      <>
        <B2BTopbar />
        <ClaudeCapabilityGuide slug={slug} count={count} workflowsHref={workflowsHref} />
      </>
    );
  }

  if (
    tool === "chatgpt"
    && (
      slug === "skills"
      || slug === "projects"
      || slug === "vibe-coding"
      || slug === "scheduled-actions"
      || slug === "ai-agents"
      || slug === "coding-agents"
    )
  ) {
    const kind = slug === "vibe-coding"
      ? "sites"
      : slug === "scheduled-actions"
        ? "scheduled"
      : slug === "ai-agents"
        ? "work"
        : slug === "coding-agents"
          ? "codex"
          : slug;
    return (
      <>
        <B2BTopbar />
        <ChatGPTGuide kind={kind} count={count} workflowsHref={workflowsHref} />
      </>
    );
  }

  if (
    tool === "gemini"
    && (slug === "skills" || slug === "projects" || slug === "scheduled-actions" || slug === "ai-agents")
  ) {
    const kind = slug === "projects"
      ? "notebooks"
      : slug === "scheduled-actions"
        ? "schedules"
        : slug === "ai-agents"
          ? "spark"
          : "skills";
    return (
      <>
        <B2BTopbar />
        <GeminiGuide kind={kind} count={count} workflowsHref={workflowsHref} />
      </>
    );
  }

  return (
    <>
      <B2BTopbar />
      <main className={styles.page}>
        <Link href={`/ask-ai?tool=${tool}`} className={styles.backLink}>← Back to Ask AI</Link>

        <div className={styles.pageHeader}>
          <div>
            <div className={styles.eyebrow}>{page.eyebrow}</div>
            <h1>{page.title}</h1>
            <p>{page.subtitle}</p>
          </div>
          <span className={styles.badge}>{page.badge}</span>
        </div>

        <div className={`${styles.infoGrid} ${page.cards.length % 2 === 0 && page.cards.length <= 4 ? styles.infoGridPairs : ""}`}>
          {page.cards.map((card) => (
            <article className={styles.infoCard} key={card.heading}>
              <span className={styles.infoCardIcon}>{card.icon}</span>
              <h3>{card.heading}</h3>
              {card.body ? <p>{card.body}</p> : null}
              {card.steps ? <ol>{card.steps.map((step) => <li key={step}>{step}</li>)}</ol> : null}
              {card.list ? <ul>{card.list.map((item) => <li key={item}>{item}</li>)}</ul> : null}
            </article>
          ))}
        </div>

        <article className={styles.featuredCard}>
          <span className={styles.featuredIcon}>→</span>
          <div>
            <div className={styles.featuredLabel}>Recommended starting point</div>
            <h3>{page.cta.heading}</h3>
            <p>{page.cta.description}</p>
          </div>
          <Link href={workflowsHref} className={styles.featuredAction}>
            Explore workflows → ({count})
          </Link>
        </article>
      </main>
    </>
  );
}
