"use client";

import Link from "next/link";
import type { ProviderFeatureDef, ProviderTool } from "@/lib/capabilities";
import B2BTopbar from "@/components/B2BTopbar";
import ClaudeCapabilityGuide from "../../../[slug]/[tool]/ClaudeCapabilityGuide";
import ChatGPTGuide from "../../../ChatGPTGuide";
import styles from "../../../capabilities.module.css";

type Props = {
  tool: ProviderTool;
  def: ProviderFeatureDef;
};

export default function ProviderFeatureClient({ tool, def }: Props) {
  if (tool === "claude" && (def.slug === "design" || def.slug === "dispatch")) {
    return (
      <>
        <B2BTopbar />
        <ClaudeCapabilityGuide
          slug={def.slug}
          workflowsHref={def.workflowsHref}
        />
      </>
    );
  }

  if (tool === "chatgpt" && (def.slug === "image-generation" || def.slug === "sites" || def.slug === "custom-gpts")) {
    const kind = def.slug === "image-generation" ? "images" : def.slug;
    return (
      <>
        <B2BTopbar />
        <ChatGPTGuide kind={kind} workflowsHref={def.workflowsHref} />
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
            <div className={styles.eyebrow}>{def.eyebrow}</div>
            <h1>{def.title}</h1>
            <p>{def.subtitle}</p>
          </div>
          <span className={styles.badge}>{def.badge}</span>
        </div>

        <div className={`${styles.infoGrid} ${def.cards.length % 2 === 0 && def.cards.length <= 4 ? styles.infoGridPairs : ""}`}>
          {def.cards.map((card) => (
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
            <h3>{def.cta.heading}</h3>
            <p>{def.cta.description}</p>
          </div>
          <Link href={def.workflowsHref} className={styles.featuredAction}>
            Explore workflows →
          </Link>
        </article>
      </main>
    </>
  );
}
