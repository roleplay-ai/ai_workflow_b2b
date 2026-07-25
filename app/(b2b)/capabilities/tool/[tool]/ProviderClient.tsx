"use client";

import Link from "next/link";
import B2BTopbar from "@/components/B2BTopbar";
import ToolIcon from "@/components/ToolIcon";
import {
  CAPABILITIES,
  CONTENT_TYPE_TO_SLUG,
  PROVIDERS,
  capabilityLabelForTool,
  type ProviderTool,
} from "@/lib/capabilities";
import styles from "../../capabilities.module.css";

type Props = {
  tool: ProviderTool;
  capabilityCounts: Record<string, number>;
};

export default function ProviderClient({ tool, capabilityCounts }: Props) {
  const provider = PROVIDERS[tool];
  const capabilityEntries = Object.values(CAPABILITIES);

  return (
    <>
      <B2BTopbar />
      <main className={styles.page}>
        <Link href="/workflows" className={styles.backLink}>← Back to Workflows</Link>

        <div className={styles.pageHeader}>
          <div>
            <div className={styles.eyebrow}>Unique to each</div>
            <h1>{provider.label}</h1>
            <p>{provider.blurb}</p>
          </div>
          <span className={styles.badge}>
            <ToolIcon tool={tool} size={18} />
            <span style={{ marginLeft: 7 }}>{provider.label}</span>
          </span>
        </div>

        <div className={styles.sectionHeading}>
          <h2>Capabilities</h2>
        </div>
        <div className={styles.tileGrid}>
          {capabilityEntries.map((capability) => {
            const slug = CONTENT_TYPE_TO_SLUG[capability.contentType];
            const label = capabilityLabelForTool(slug, tool);
            const count = capabilityCounts[capability.contentType] ?? 0;
            return (
              <Link key={slug} href={`/capabilities/${slug}/${tool}`} className={styles.tile}>
                <span className={styles.tileIcon}>{capability.mark}</span>
                <strong>{label}</strong>
                <span>{count} workflow{count === 1 ? "" : "s"}</span>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
