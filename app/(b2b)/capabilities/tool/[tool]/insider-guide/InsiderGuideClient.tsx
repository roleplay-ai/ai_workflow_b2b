"use client";

import Link from "next/link";
import { INSIDER_GUIDES, PROVIDERS, type ProviderTool } from "@/lib/capabilities";
import B2BTopbar from "@/components/B2BTopbar";
import ClaudeInsiderGuide from "./ClaudeInsiderGuide";
import ChatGPTGuide from "../../../ChatGPTGuide";
import GeminiGuide from "../../../GeminiGuide";
import styles from "../../../capabilities.module.css";

type Props = {
  tool: ProviderTool;
};

export default function InsiderGuideClient({ tool }: Props) {
  const guide = INSIDER_GUIDES[tool];
  const provider = PROVIDERS[tool];

  if (tool === "claude") {
    return (
      <>
        <B2BTopbar />
        <ClaudeInsiderGuide />
      </>
    );
  }

  if (tool === "chatgpt") {
    return (
      <>
        <B2BTopbar />
        <ChatGPTGuide kind="insider" workflowsHref="/workflows?tool=chatgpt" />
      </>
    );
  }

  if (tool === "gemini") {
    return (
      <>
        <B2BTopbar />
        <GeminiGuide kind="insider" workflowsHref="/workflows?tool=gemini" />
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
            <div className={styles.eyebrow}>Unique to Each</div>
            <h1>{guide.title}</h1>
            <p>{guide.subtitle}</p>
          </div>
          <span className={styles.badge}>Insider Guide</span>
        </div>

        <div className={styles.insiderGrid}>
          <article className={styles.infoCard}>
            <span className={styles.infoCardIcon}>◐</span>
            <h3>Free vs Paid</h3>
            <div className={styles.insiderCompare}>
              <section>
                <h4>{guide.freeVsPaid.freeLabel}</h4>
                <ul>{guide.freeVsPaid.freeList.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
              <section className={styles.insiderComparePaid}>
                <h4>{guide.freeVsPaid.paidLabel}</h4>
                <ul>{guide.freeVsPaid.paidList.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
            </div>
          </article>

          <article className={styles.infoCard}>
            <span className={styles.infoCardIcon}>✦</span>
            <h3>What's New</h3>
            <ul className={styles.insiderNewsList}>
              {guide.whatsNew.map((item) => (
                <li key={item.text}>
                  <span className={styles.insiderNewsDate}>{item.date}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </article>

          <article className={`${styles.infoCard} ${styles.insiderPractice}`}>
            <span className={styles.infoCardIcon}>◎</span>
            <h3>From Practice</h3>
            <ul>{guide.fromPractice.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        </div>
      </main>
    </>
  );
}
