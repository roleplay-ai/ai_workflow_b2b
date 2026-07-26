"use client";

import Link from "next/link";
import {
  CAPABILITIES,
  PROVIDER_TOOLS,
  capabilityLabelForTool,
  type CapabilitySlug,
} from "@/lib/capabilities";
import B2BTopbar from "@/components/B2BTopbar";
import ToolIcon from "@/components/ToolIcon";
import type { ToolLogoMap } from "@/lib/toolLogos";
import styles from "../capabilities.module.css";

type Props = {
  slug: CapabilitySlug;
  totalCount: number;
  toolCounts: Record<string, number>;
  toolLogos: ToolLogoMap;
};

export default function CapabilityClient({ slug, totalCount, toolCounts, toolLogos }: Props) {
  const def = CAPABILITIES[slug];
  const workflowsHref = `/workflows?content_type=${encodeURIComponent(def.contentType)}`;

  return (
    <>
      <B2BTopbar />
      <main className={styles.page}>
        <Link href="/workflows" className={styles.backLink}>← Back to Workflows</Link>

        <div className={styles.pageHeader}>
          <div>
            <div className={styles.eyebrow}>Capability</div>
            <h1>{def.contentType}</h1>
            <p>{def.subtitle}</p>
          </div>
          <span className={styles.badge}>{def.badge}</span>
        </div>

        <div className={`${styles.infoGrid} ${def.cards.length === 4 ? styles.infoGridPairs : ""}`}>
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

        <div className={styles.sectionHeading}>
          <h2>See how each AI does it</h2>
        </div>
        <div className={styles.tileGrid}>
          {PROVIDER_TOOLS.map((tool) => {
            const label = capabilityLabelForTool(slug, tool);
            const count = toolCounts[tool] ?? 0;
            return (
              <Link key={tool} href={`/capabilities/${slug}/${tool}`} className={styles.tile}>
                <span className={styles.tileIcon}><ToolIcon tool={tool} size={22} logos={toolLogos} /></span>
                <strong>{label}</strong>
                <span>{count} workflow{count === 1 ? "" : "s"}</span>
              </Link>
            );
          })}
        </div>

        <article className={styles.featuredCard}>
          <span className={styles.featuredIcon}>{def.mark}</span>
          <div>
            <div className={styles.featuredLabel}>Recommended starting point</div>
            <h3>Explore {def.contentType} workflows</h3>
            <p>Open guided workflows that put {def.contentType.toLowerCase()} into practice, across every AI tool.</p>
          </div>
          <Link href={workflowsHref} className={styles.featuredAction}>
            Explore workflows → ({totalCount})
          </Link>
        </article>
      </main>
    </>
  );
}
