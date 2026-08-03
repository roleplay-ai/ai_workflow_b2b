"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../../../capabilities.module.css";

type Screenshot = {
  title: string;
  helper: string;
  caption: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

const SCREENSHOTS = {
  model: {
    title: "Choose a model and effort level",
    helper: "New chat → Model selector",
    caption: "Open the model selector in a new chat to choose the model, then set the effort level for the task.",
    src: "/claude-guides/insider-model-effort.png",
    alt: "Claude model selector showing Fable 5, Opus 5, Sonnet 5, Haiku 4.5, and the effort level menu",
    width: 920,
    height: 523,
  },
  record: {
    title: "Start recording a Skill",
    helper: "Skills → Record a skill",
    caption: "Claude records your screen, clicks, typing, and voice, then turns the workflow into a repeatable Skill.",
    src: "/claude-guides/insider-record-skill.png",
    alt: "Claude Record a skill dialog with a Start recording button and a warning about sensitive information",
    width: 477,
    height: 282,
  },
  reflect: {
    title: "Open your Reflect report",
    helper: "Settings → Reflect",
    caption: "Reflect appears inside Settings and summarizes your personal Claude usage over the selected period.",
    src: "/claude-guides/insider-reflect.png",
    alt: "Claude Settings with Reflect selected and a personal usage report showing active day, peak hour, conversations, and a usage chart",
    width: 982,
    height: 726,
  },
  slack: {
    title: "Mention Claude in Slack",
    helper: "Invited channel or DM",
    caption: "Mention @Claude inside an invited channel or DM. Claude reads the thread and posts its response back into Slack.",
    src: "/claude-guides/insider-slack-tag.png",
    alt: "Slack thread showing a user mentioning Claude and Claude responding as an agent inside the channel",
    width: 1059,
    height: 576,
  },
  plugins: {
    title: "Browse the Plugin directory",
    helper: "Customize → Plugins",
    caption: "Use the directory to browse official plugins by role or workflow before installing them.",
    src: "/claude-guides/insider-plugins.png",
    alt: "Claude Plugin directory showing official plugins for Productivity, Design, Marketing, Data, Finance, Product Management, Operations, and Human Resources",
    width: 1030,
    height: 770,
  },
  browser: {
    title: "Let Claude act in the browser",
    helper: "Chrome extension / browser agent",
    caption: "The browser agent can navigate pages, read content, and take actions while showing its progress in the side panel.",
    src: "/claude-guides/insider-browser-agent.png",
    alt: "Claude browser agent working through an Amazon page with a visible activity panel showing its plan and actions",
    width: 1389,
    height: 767,
  },
} satisfies Record<string, Screenshot>;

function GuideHeading({
  number,
  tone,
  kicker,
  title,
}: {
  number: string;
  tone?: "purple" | "green" | "blue" | "yellow";
  kicker: string;
  title: string;
}) {
  const toneClass = tone
    ? styles[`claudeNumber${tone[0].toUpperCase()}${tone.slice(1)}`]
    : "";

  return (
    <div className={styles.claudeSectionHead}>
      <span className={`${styles.claudeSectionNumber} ${toneClass}`}>{number}</span>
      <div>
        <span className={styles.claudeKicker}>{kicker}</span>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function GuideScreenshot({ screenshot, compact = false }: { screenshot: Screenshot; compact?: boolean }) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!zoomed) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomed(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [zoomed]);

  return (
    <>
      <div className={`${styles.claudeScreenshotViewer} ${styles.claudeInsiderScreenshot} ${compact ? styles.claudeInsiderScreenshotCompact : ""}`}>
        <div className={styles.claudeScreenshotToolbar}>
          <div><strong>{screenshot.title}</strong><span>{screenshot.helper}</span></div>
          <button type="button" onClick={() => setZoomed(true)}>Zoom</button>
        </div>
        <button
          className={styles.claudeScreenshotButton}
          type="button"
          onClick={() => setZoomed(true)}
          aria-label={`Zoom screenshot: ${screenshot.title}`}
        >
          <Image
            className={styles.claudeScreenshotImage}
            src={screenshot.src}
            alt={screenshot.alt}
            width={screenshot.width}
            height={screenshot.height}
            sizes="(max-width: 760px) 92vw, 860px"
          />
        </button>
        <p className={styles.claudeScreenshotCaption}>{screenshot.caption}</p>
      </div>

      {zoomed ? (
        <div className={styles.claudeImageModal} role="dialog" aria-modal="true" aria-label={screenshot.title} onMouseDown={() => setZoomed(false)}>
          <div className={styles.claudeImageModalDialog} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.claudeImageModalHead}>
              <strong>{screenshot.title}</strong>
              <button type="button" onClick={() => setZoomed(false)} aria-label="Close enlarged screenshot">×</button>
            </div>
            <div className={styles.claudeImageModalStage}>
              <Image src={screenshot.src} alt={screenshot.alt} width={screenshot.width} height={screenshot.height} sizes="96vw" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function ClaudeInsiderGuide() {
  return (
    <main className={`${styles.page} ${styles.claudePage}`}>
      <Link href="/ask-ai?tool=claude" className={styles.claudeBack}>← Back</Link>
      <header className={styles.claudeTitleRow}>
        <div>
          <p className={styles.claudeEyebrow}>AI PRACTICE LAB · PRODUCT GUIDE</p>
          <h1>Claude models and workspace features</h1>
          <p className={styles.claudeSubtitle}>How to choose a model, control effort, prompt Opus 5, and use Claude across Skills, Slack, plugins, and your workspace.</p>
        </div>
        <span className={styles.claudeToolChip}>Claude</span>
      </header>

      <section className={styles.claudeIntro}>
        <div className={styles.claudeIntroCopy}>
          <span className={styles.claudeIntroIcon}>☼</span>
          <div>
            <span className={styles.claudeKicker}>THE SIMPLE VERSION</span>
            <h2>Match the model and effort to the job</h2>
            <p>Default to Sonnet on Pro. Move to Opus when tasks get complex. On Max, default to Opus and keep effort at medium unless the task genuinely needs more.</p>
          </div>
        </div>
        <aside className={styles.claudeComparisonNote}>
          <span>Quick rule</span>
          <strong>For routine work, Sonnet often beats throttled-down Opus.</strong>
        </aside>
      </section>

      <section className={styles.claudeSection}>
        <GuideHeading number="1" kicker="MODEL CHOICE" title="Current models" />
        <div className={styles.claudeInsiderModelGrid}>
          <article className={styles.claudeInsiderModelPrimary}><div><h3>Opus 5</h3><span>Highest capability</span></div><p>Complex reasoning, multi-step agents, advanced coding, high-stakes work.</p></article>
          <article><div><h3>Sonnet 5</h3><span>Best all-rounder</span></div><p>Daily writing, research, analysis, moderate coding.</p></article>
          <article className={styles.claudeInsiderModelFast}><div><h3>Haiku 4.5</h3><span>Fastest, cheapest</span></div><p>Simple tasks only, not for serious knowledge work.</p></article>
          <article className={styles.claudeInsiderModelCode}><div><h3>Fable 5</h3><span>Coding specialist</span></div><p>Overkill outside coding, burns tokens fast.</p></article>
        </div>
        <div className={styles.claudeInsiderOrder}><strong>Order of intelligence:</strong><span>Opus</span><i>›</i><span>Sonnet</span><i>›</i><span>Haiku</span><small>Fable is a coding niche, not a general tier.</small></div>
      </section>

      <section className={styles.claudeSection}>
        <GuideHeading number="2" tone="purple" kicker="PLAN GUIDE" title="Which model, by plan" />
        <div className={styles.claudeInsiderPlanGrid}>
          <article><h3><span />Pro (~$20/mo)</h3><p>Default to Sonnet. Move to Opus only when tasks get complex.</p></article>
          <article><h3><span />Max (~$100+/mo)</h3><p>Default to Opus. Handles most complex work out of the box.</p></article>
          <article><h3><span />Fable</h3><p>Fallback for hard coding tasks when Opus falls short.</p></article>
          <article><h3><span />Haiku</h3><p>Basic Q&amp;A, classification, quick formatting only.</p></article>
        </div>
      </section>

      <section className={styles.claudeSection}>
        <GuideHeading number="3" tone="green" kicker="OPUS 5 CONTROL" title="Effort level (Opus 5)" />
        <div className={styles.claudeInsiderEffort}>
          <div>
            <strong>Dial: low / medium / high</strong>
            <div className={styles.claudeInsiderDial}>
              <span><b>LOW</b><small>Pro: start here</small></span>
              <span className={styles.claudeInsiderRecommended}><b>MED</b><small>Max: start here</small></span>
              <span><b>HIGH</b><small>Hard tasks only</small></span>
            </div>
          </div>
          <div className={styles.claudeInsiderEffortCopy}>
            <p>Controls tokens and reasoning depth. Higher ≠ better — costs more, often overkill.</p>
            <p><strong>High:</strong> only for genuinely hard tasks such as large refactors or complex constraints, or clearly under-reasoned output.</p>
            <p>For routine work, Sonnet often beats throttled-down Opus.</p>
          </div>
        </div>
        <GuideScreenshot screenshot={SCREENSHOTS.model} />
      </section>

      <section className={styles.claudeSection}>
        <GuideHeading number="4" tone="blue" kicker="BETTER OUTPUTS" title="Five prompting rules for Opus 5" />
        <ol className={styles.claudeInsiderRules}>
          <li><span>1</span><p><strong>Give the full job upfront</strong> — context, materials, constraints, goal, all at once.</p></li>
          <li><span>2</span><p><strong>Set a clear stop point</strong> — Opus tends to do extra unprompted work.</p></li>
          <li><span>3</span><p><strong>Cap response length</strong> — “3 bullet points,” “under 200 words.”</p></li>
          <li><span>4</span><p><strong>Cap deliverable structure</strong> — “max 6 sections,” “one-page memo.”</p></li>
          <li><span>5</span><p><strong>Skip “double-check this”</strong> — Opus already self-checks; it just adds tokens.</p></li>
        </ol>
        <p className={styles.claudeInsiderAlso}><strong>Also:</strong> keep effort low or medium by default, keep Skills simple, use subagents only for big or complex work, and build reusable Projects or Skills instead of one-off prompts.</p>
      </section>

      <section className={styles.claudeSection}>
        <GuideHeading number="5" kicker="REUSABLE WORKFLOW" title="Screen recording → Skill" />
        <div className={styles.claudeInsiderFlow}>
          <span>Record yourself doing a task</span><i>→</i>
          <span>Claude turns the steps into a reusable Skill (SKILL.md)</span><i>→</i>
          <span>Attach it to a workspace or plugin</span><i>→</i>
          <span>Reuse it to automate the same workflow later</span>
        </div>
        <GuideScreenshot screenshot={SCREENSHOTS.record} compact />
      </section>

      <section className={styles.claudeSection}>
        <GuideHeading number="6" tone="purple" kicker="USAGE VIEW" title="Claude Reflect" />
        <p className={styles.claudeSectionCopy}>A personal usage mirror — not an admin console.</p>
        <ul className={styles.claudeInsiderFeatureList}>
          <li><span>✓</span><p><strong>Time range:</strong> 1 / 3 / 6 / 12 months</p></li>
          <li><span>✓</span><p><strong>Shows:</strong> active days, peak hours, total chats, topic breakdown (research, writing, technical, personal)</p></li>
          <li><span>✓</span><p><strong>4D Fluency scores:</strong> Delegation, Description, Discernment, Diligence</p></li>
          <li><span>✓</span><p><strong>Wellbeing:</strong> break reminders, quiet hours, reflective prompts</p></li>
        </ul>
        <p className={styles.claudeInsiderNotice}>Health conversations are excluded from data; nothing is shared externally.</p>
        <p className={styles.claudeInsiderSetup}>Free, Pro, and Max plans. Web and desktop. Requires Memory on.</p>
        <div className={styles.claudeInsiderPath}>Settings <span>→</span> Reflect on your usage</div>
        <GuideScreenshot screenshot={SCREENSHOTS.reflect} />
      </section>

      <section className={styles.claudeSection}>
        <GuideHeading number="7" tone="green" kicker="SLACK" title="Claude Tag (Slack)" />
        <div className={styles.claudeInsiderTagDemo}><strong>@Claude in an invited channel or DM</strong><span>reads the thread → does the work → posts the result back</span><p>Visible to everyone in the channel.</p></div>
        <div className={styles.claudeInsiderSupportGrid}>
          <article><span>⚙</span><div><h3>Admins set</h3><p>Which channels, which tools and data, and spend limits.</p></div></article>
          <article><span>✓</span><div><h3>Setup</h3><p>Pair with Slack → grant tool access → set spend limits → test in a private channel → roll out.</p></div></article>
        </div>
        <GuideScreenshot screenshot={SCREENSHOTS.slack} />
      </section>

      <section className={styles.claudeSection}>
        <GuideHeading number="8" tone="blue" kicker="CUSTOM WORKFLOWS" title="Claude Plugins" />
        <p className={styles.claudeSectionCopy}>Bundles that customize Claude for a role or workflow. Usually include:</p>
        <div className={styles.claudeInsiderPluginGrid}>
          <article><h3>Skills</h3><p>Reusable capabilities</p></article>
          <article><h3>Connectors</h3><p>Tool and data integrations</p></article>
          <article><h3>Sub-agents</h3><p>Specialized helpers</p></article>
        </div>
        <p className={styles.claudeInsiderMarketplace}><strong>Official marketplaces:</strong> Knowledge Work, Life Sciences, Financial Services, and Legal. Teams can also host their own via GitHub.</p>
        <div className={styles.claudeInsiderPath}>Customize <span>→</span> Plugins <span>→</span> Browse <span>→</span> Install</div>
        <div className={styles.claudeInsiderPath}>Customize <span>→</span> Plugins <span>→</span> Personal plugins <span>→</span> + <span>→</span> Add marketplace</div>
        <p className={styles.claudeInsiderNotice}>Stick to official or trusted sources — third-party plugins can access your connected tools and data.</p>
        <GuideScreenshot screenshot={SCREENSHOTS.plugins} />
      </section>

      <section className={styles.claudeSection}>
        <GuideHeading number="9" kicker="WORKSPACE ACCESS" title="Chrome extension / Desktop" />
        <div className={styles.claudeInsiderSupportGrid}>
          <article><span>◉</span><div><h3>Chrome extension</h3><p>Invoke Claude on any page, read selected content, and act on it: summarize, draft replies, extract data, or fill forms.</p></div></article>
          <article><span>▣</span><div><h3>“Opens apps for you”</h3><p>A separate capability from Desktop and OS-level agent features. It can orchestrate across apps — open a document, start a meeting, or file a ticket.</p></div></article>
        </div>
        <p className={styles.claudeInsiderMarketplace}><strong>Why it matters:</strong> moves Claude from a chat window into your actual workspace, so describe → get output → apply it collapses into one step.</p>
        <p className={styles.claudeInsiderSetup}>Setup depends on plan (Consumer vs Team or Enterprise) and OS — check Extensions or Integrations in Settings.</p>
        <GuideScreenshot screenshot={SCREENSHOTS.browser} />
      </section>

      <section className={styles.claudeCta}>
        <span>→</span>
        <div><small>EXPLORE MORE WORKFLOWS</small><h3>Put Claude’s models and workspace features into practice</h3><p>Open guided Claude workflows for research, writing, automation, coding, and connected work.</p></div>
        <Link href="/workflows?tool=claude">Explore workflows →</Link>
      </section>
    </main>
  );
}
