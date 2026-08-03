"use client";

import Link from "next/link";
import B2BTopbar from "@/components/B2BTopbar";
import ToolIcon from "@/components/ToolIcon";
import { INSIDER_GUIDE_ITEM, PROVIDER_FEATURES, PROVIDERS, type ProviderTool } from "@/lib/capabilities";
import type { ToolLogoMap } from "@/lib/toolLogos";
import styles from "../../capabilities.module.css";

type Props = {
  tool: ProviderTool;
  toolLogos: ToolLogoMap;
};

export default function ProviderClient({ tool, toolLogos }: Props) {
  const provider = PROVIDERS[tool];
  const features = PROVIDER_FEATURES[tool];

  return (
    <>
      <B2BTopbar />
      <main className={styles.page}>
        <Link href={`/ask-ai?tool=${tool}`} className={styles.backLink}>← Back to Ask AI</Link>

        <div className={styles.pageHeader}>
          <div>
            <div className={styles.eyebrow}>Unique to each</div>
            <h1>{provider.label}</h1>
            <p>{provider.blurb}</p>
          </div>
          <span className={styles.badge}>
            <ToolIcon tool={tool} size={18} logos={toolLogos} />
            <span style={{ marginLeft: 7 }}>{provider.label}</span>
          </span>
        </div>

        <div className={styles.tileGrid}>
          <Link href={`/capabilities/tool/${tool}/insider-guide`} className={styles.tile}>
            <span className={styles.tileIcon}>{INSIDER_GUIDE_ITEM.mark}</span>
            <strong>{INSIDER_GUIDE_ITEM.label}</strong>
            <span>Plans, launches and practice notes</span>
          </Link>
          {features.map((feature) => (
            <Link key={feature.slug} href={`/capabilities/tool/${tool}/${feature.slug}`} className={styles.tile}>
              <span className={styles.tileIcon}>{feature.mark}</span>
              <strong>{feature.label}</strong>
              <span>{feature.badge}</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
