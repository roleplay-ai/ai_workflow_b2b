"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../../capabilities.module.css";

type ClaudeGuideSlug = "skills" | "projects";

type Props = {
  slug: ClaudeGuideSlug;
  count: number;
  workflowsHref: string;
};

type GuideStep = {
  title: string;
  tabTitle?: string;
  helper: string;
  description: string;
  caption: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

const SKILL_STEPS: GuideStep[] = [
  {
    title: "Find your saved Skills",
    helper: "Settings → Skills",
    description: "Open Claude settings and go to the area where your Skills are managed.",
    caption: "Open Claude Settings and select Skills from the left menu to view the Skills already available to you.",
    src: "/claude-guides/skills-step-1.png",
    alt: "Claude Settings page showing the Skills section and a list of saved Skills",
    width: 987,
    height: 742,
  },
  {
    title: "Upload a new Skill",
    helper: "Skills → Add → Upload skill",
    description: "Choose the ZIP file containing the Skill and upload it to Claude.",
    caption: "Select Add, choose Upload skill, and upload the ZIP or .skill file that contains the SKILL.md file.",
    src: "/claude-guides/skills-step-2.png",
    alt: "Claude Upload skill dialog with a drag and drop area and file requirements",
    width: 979,
    height: 735,
  },
  {
    title: "Use a Skill in chat",
    tabTitle: "Use it in a chat",
    helper: "Open the Skills menu in the chat box",
    description: "Ask Claude for the task. Claude will load the matching Skill when it applies.",
    caption: "Open the Skills menu inside a Claude chat and select the Skill you want to use. You can then describe the task as usual.",
    src: "/claude-guides/skills-step-3.png",
    alt: "Claude chat showing the Skills menu with several saved Skills available to select",
    width: 758,
    height: 475,
  },
];

const PROJECT_STEPS: GuideStep[] = [
  {
    title: "Projects home page",
    helper: "Left sidebar → Projects",
    description: "Left sidebar → Projects",
    caption: "Projects home page (Point 4)",
    src: "/claude-guides/projects-step-1.png",
    alt: "Claude Projects home page showing the Projects link in the left sidebar",
    width: 2048,
    height: 851,
  },
  {
    title: "New Project creation screen",
    helper: "Projects → New Project",
    description: "Projects → New Project",
    caption: "“New Project” creation screen (Point 4)",
    src: "/claude-guides/projects-step-2.png",
    alt: "Claude New Project screen with fields for a project name and description",
    width: 1114,
    height: 762,
  },
  {
    title: "Project instructions",
    helper: "Project → Instructions",
    description: "Project → Instructions",
    caption: "Project instructions screen",
    src: "/claude-guides/projects-step-3.png",
    alt: "Claude Project instructions screen where persistent project guidance is entered",
    width: 1464,
    height: 1058,
  },
  {
    title: "Project workspace",
    helper: "Files, instructions, memory and chats",
    description: "Files, instructions, memory and chats",
    caption: "Project workspace showing files, instructions, memory and chats",
    src: "/claude-guides/projects-step-4.png",
    alt: "Claude Project workspace showing project files, instructions, memory, and chats",
    width: 2048,
    height: 1237,
  },
  {
    title: "Settings > Memory view",
    helper: "Settings → Memory",
    description: "Settings → Memory",
    caption: "Settings > Memory view (Points 6 and 7)",
    src: "/claude-guides/projects-step-5.png",
    alt: "Claude Settings Memory view showing project-specific memory controls",
    width: 1580,
    height: 1408,
  },
];

const PROJECT_PROMPT = `You are a meeting follow-up assistant.

This project will contain meeting transcripts and two instruction files:
1. Leadership Meeting Summary Email Instructions
2. Meeting Participant Action Item Instructions

Whenever I upload a meeting transcript, use the latest transcript and the two instruction files to create two ready-to-send emails:

1. Leadership Email
For senior stakeholders. Focus on project status, summary, decisions, risks, blockers, dependencies, owners, and leadership support needed.

2. Participant Action Email
For meeting participants. Focus on participant-wise action items, owners, timelines, dependencies, and open questions. Design one consolidated email for all participants

Do not invent missing details. If something is unclear, write “To be confirmed.” Ensure that the emails are very brief.

Output only the two emails. Keep them clear, professional, and easy to scan.`;

function SectionHeading({
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
  return (
    <div className={styles.claudeSectionHead}>
      <span className={`${styles.claudeSectionNumber} ${tone ? styles[`claudeNumber${tone[0].toUpperCase()}${tone.slice(1)}`] : ""}`}>
        {number}
      </span>
      <div>
        <span className={styles.claudeKicker}>{kicker}</span>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function StepGuide({ steps, label }: { steps: GuideStep[]; label: string }) {
  const [activeStep, setActiveStep] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const step = steps[activeStep];

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
      <div className={styles.claudeGuide}>
        <div className={styles.claudeGuideTabs} role="tablist" aria-label={label}>
          {steps.map((item, index) => (
            <button
              className={index === activeStep ? styles.claudeGuideTabActive : styles.claudeGuideTab}
              key={item.title}
              onClick={() => setActiveStep(index)}
              role="tab"
              type="button"
              aria-selected={index === activeStep}
            >
              <span>{index + 1}</span>
              <div><strong>{item.tabTitle ?? item.title}</strong><p>{item.description}</p></div>
            </button>
          ))}
        </div>
        <div className={styles.claudeScreenshotViewer} role="tabpanel" aria-live="polite">
          <div className={styles.claudeScreenshotToolbar}>
            <div><strong>{step.title}</strong><span>{step.helper}</span></div>
            <button type="button" onClick={() => setZoomed(true)}>Zoom</button>
          </div>
          <button
            className={styles.claudeScreenshotButton}
            type="button"
            onClick={() => setZoomed(true)}
            aria-label={`Zoom screenshot: ${step.title}`}
          >
            <Image
              key={step.src}
              className={styles.claudeScreenshotImage}
              src={step.src}
              alt={step.alt}
              width={step.width}
              height={step.height}
              sizes="(max-width: 760px) 92vw, 650px"
            />
          </button>
          <p className={styles.claudeScreenshotCaption}>{step.caption}</p>
        </div>
      </div>

      {zoomed ? (
        <div className={styles.claudeImageModal} role="dialog" aria-modal="true" aria-label={step.title} onMouseDown={() => setZoomed(false)}>
          <div className={styles.claudeImageModalDialog} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.claudeImageModalHead}>
              <strong>{step.title}</strong>
              <button type="button" onClick={() => setZoomed(false)} aria-label="Close enlarged screenshot">×</button>
            </div>
            <div className={styles.claudeImageModalStage}>
              <Image src={step.src} alt={step.alt} width={step.width} height={step.height} sizes="96vw" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ClaudeHeader({ slug }: { slug: ClaudeGuideSlug }) {
  const isSkills = slug === "skills";
  return (
    <>
      <Link href="/ask-ai?tool=claude" className={styles.claudeBack}>← Back</Link>
      <header className={styles.claudeTitleRow}>
        <div>
          <p className={styles.claudeEyebrow}>{isSkills ? "SKILLS · CLAUDE" : "PRODUCTS · CLAUDE"}</p>
          <h1>Claude {isSkills ? "Skills" : "Projects"}</h1>
          <p className={styles.claudeSubtitle}>
            {isSkills
              ? "Saved instructions Claude can reuse whenever a matching task appears."
              : "A practical guide to understanding, creating, and using Projects inside Claude."}
          </p>
        </div>
        <span className={styles.claudeToolChip}>Claude</span>
      </header>
    </>
  );
}

function ClaudeSkillsGuide({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  return (
    <>
      <section className={styles.claudeIntro}>
        <div className={styles.claudeIntroCopy}>
          <span className={styles.claudeIntroIcon}>📋</span>
          <div><span className={styles.claudeKicker}>THE SIMPLE VERSION</span><h2>A Skill is a saved set of instructions for Claude</h2><p>It tells Claude how to handle a specific type of task and can be reused whenever that task comes up.</p></div>
        </div>
        <aside className={styles.claudeComparisonNote}><span>Closest comparison</span><strong>A saved prompt that can also include reference files or scripts when needed.</strong></aside>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="1" kicker="WHY IT MATTERS" title="The same task becomes easier to repeat" />
        <div className={styles.claudeCompare}>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWithout}`}><strong>WITHOUT A SKILL</strong><div><i>↻</i><p>Explain the requirements again</p></div><div><i>≈</i><p>Output can vary between users</p></div><div><i>!</i><p>Important details may be missed</p></div></article>
          <span className={styles.claudeCompareArrow}>→</span>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWith}`}><strong>WITH A SKILL</strong><div><i>✓</i><p>Instructions are already available</p></div><div><i>✓</i><p>The same structure is followed</p></div><div><i>✓</i><p>Rules and examples guide the output</p></div></article>
        </div>
      </section>

      <div className={styles.claudeDetailGrid}>
        <section className={styles.claudeSection}>
          <SectionHeading number="2" tone="purple" kicker="WHAT IS INSIDE" title="Every Skill has a SKILL.md file" />
          <div className={styles.claudeFileCard}>
            <div className={styles.claudeFileTop}><span>▤</span><strong>SKILL.md</strong><em>Required</em></div>
            <div className={styles.claudeFileLines}><p><span>Name</span><strong>Invoice Generator</strong></p><p><span>Description</span><strong>Creates Nudgeable invoices</strong></p><p><span>Instructions</span><strong>Steps, rules and examples</strong></p></div>
          </div>
        </section>
        <section className={styles.claudeSection}>
          <SectionHeading number="3" tone="green" kicker="THREE SOURCES" title="Where Skills come from" />
          <div className={styles.claudeTypes}>
            <article><span>A</span><div><strong>Anthropic</strong><p>Pre-built Skills for Word, Excel, PowerPoint and PDF.</p></div></article>
            <article><span>P</span><div><strong>Partners</strong><p>Skills from companies such as Notion, Figma and Atlassian.</p></div></article>
            <article><span>✦</span><div><strong>Custom</strong><p>Skills created by you or your team for your own work.</p></div></article>
          </div>
        </section>
      </div>

      <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}>
        <SectionHeading number="4" tone="blue" kicker="FIND AND USE THEM" title="Three steps inside Claude" />
        <StepGuide steps={SKILL_STEPS} label="Claude Skill steps" />
      </section>

      <div className={styles.claudeShareGrid}>
        <article><span>↗</span><div><h3>Share with your team</h3><p>Send colleagues the Skill ZIP file. They can upload it to Claude and use the same instructions.</p></div></article>
        <article><span>!</span><div><h3>Before using a downloaded Skill</h3><p>Check its instructions before allowing it to work with company information.</p></div></article>
      </div>

      <ClaudeCta
        count={count}
        workflowsHref={workflowsHref}
        heading="Practice creating your first Claude Skill"
        description="Use guided workflows for writing, analysis and branded outputs."
      />
    </>
  );
}

function ClaudeProjectsGuide({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(PROJECT_PROMPT);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
    window.setTimeout(() => setCopyStatus("idle"), 1800);
  }

  return (
    <>
      <section className={styles.claudeIntro}>
        <div className={styles.claudeIntroCopy}>
          <span className={styles.claudeIntroIcon}>🗂</span>
          <div><span className={styles.claudeKicker}>1 · WHAT IT IS</span><h2>A Project is a workspace that keeps context together</h2><p>A project is a workspace that holds instructions, files, and chats together. Once set up, every new chat inside it carries that context automatically, no re-explaining.</p></div>
        </div>
        <aside className={styles.claudeComparisonNote}><span>Closest comparison</span><strong>A reusable workspace where Claude already knows the instructions, files, and chat history linked to that work.</strong></aside>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="2" kicker="WHAT IT SOLVES" title="The same context does not need to be pasted again and again" />
        <div className={styles.claudeCompare}>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWithout}`}><strong>WITHOUT A PROJECT</strong><div><i>×</i><p>Without a project, you paste the same background files and instructions into every new chat.</p></div></article>
          <span className={styles.claudeCompareArrow}>→</span>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWith}`}><strong>WITH A PROJECT</strong><div><i>✓</i><p>A project holds that context once, so every conversation inside it starts already knowing your work.</p></div></article>
        </div>
      </section>

      <div className={styles.claudeDetailGrid}>
        <section className={styles.claudeSection}>
          <SectionHeading number="3" tone="purple" kicker="WHAT GOES INSIDE" title="The core pieces inside a Project" />
          <p className={styles.claudeSectionCopy}>Custom instructions (how Claude should behave), a knowledge base (your files), and a set of chats scoped to that project only.</p>
          <div className={styles.claudeMiniGrid}><article><strong>Custom instructions</strong><p>How Claude should behave.</p></article><article><strong>Knowledge base</strong><p>Your files.</p></article><article><strong>Project chats</strong><p>A set of chats scoped to that project only.</p></article></div>
        </section>
        <section className={styles.claudeSection}>
          <SectionHeading number="5" tone="green" kicker="SHARING" title="Can you share Projects" />
          <div className={styles.claudeNoteBox}>Yes, on Team and Enterprise plans. Share with specific people or your whole org.</div>
        </section>
      </div>

      <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}>
        <SectionHeading number="4" tone="blue" kicker="WHERE TO FIND AND CREATE ONE" title="Find Projects and create a new one inside Claude" />
        <p className={styles.claudeSectionCopy}>Left sidebar on claude.ai, or go straight to claude.ai/projects. Click &quot;New Project,&quot; name it, add a description.</p>
        <StepGuide steps={PROJECT_STEPS} label="Claude Project steps" />
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="6–7" tone="yellow" kicker="PROJECT MEMORY" title="How memory works and how to update it" />
        <div className={styles.claudeMemoryGrid}>
          <article><h3>How Claude writes memory in projects</h3><p>Each project has its own separate memory, not shared with other projects or general chats. Claude builds it automatically as you chat, no manual saving needed. Find it in Settings &gt; Memory.</p></article>
          <article><h3>How to update project memory</h3><p>Just tell Claude directly in a project chat, e.g. &quot;remember that this client&apos;s fiscal year starts in April.&quot; Claude updates it in real time. You can also open Settings &gt; Memory to view and edit entries manually, or delete ones that are wrong.</p></article>
        </div>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="8" kicker="TRY IT YOURSELF" title="Practice building one using files and a copy-ready prompt" />
        <p className={styles.claudeSectionCopy}>3 downloadable dummy meeting notes files + one copy-ready prompt. Download all 3, upload into a new project&apos;s knowledge base, paste the prompt, get back summary emails for leadership on who owns what and by when.</p>
        <div className={styles.claudeAssets}>
          {[1, 2, 3].map((number) => (
            <article key={number}>
              <div><span>▤</span><div><h3>Dummy meeting notes {number}</h3><p>Meeting notes file</p></div></div>
              <span className={styles.claudeFileTag}>DOCX</span>
              <a download={`dummy_meeting_notes_${number}.docx`} href={`/claude-guides/dummy_meeting_notes_${number}.docx`}>Download</a>
            </article>
          ))}
        </div>
        <div className={styles.claudePromptCard}>
          <div><strong>Project prompt to copy</strong><button type="button" onClick={copyPrompt}>{copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : "Copy prompt"}</button></div>
          <pre>{PROJECT_PROMPT}</pre>
        </div>
      </section>

      <ClaudeCta
        count={count}
        workflowsHref={workflowsHref}
        heading="Explore Claude Project workflows"
        description="Open guided workflows for organising files, context and repeatable work in Projects."
      />
    </>
  );
}

function ClaudeCta({
  count,
  workflowsHref,
  heading,
  description,
}: Pick<Props, "count" | "workflowsHref"> & { heading: string; description: string }) {
  return (
    <section className={styles.claudeCta}>
      <span>→</span>
      <div><small>RECOMMENDED NEXT STEP</small><h3>{heading}</h3><p>{description}</p></div>
      <Link href={workflowsHref}>Explore workflows → ({count})</Link>
    </section>
  );
}

export default function ClaudeCapabilityGuide({ slug, count, workflowsHref }: Props) {
  return (
    <main className={`${styles.page} ${styles.claudePage}`}>
      <ClaudeHeader slug={slug} />
      {slug === "skills"
        ? <ClaudeSkillsGuide count={count} workflowsHref={workflowsHref} />
        : <ClaudeProjectsGuide count={count} workflowsHref={workflowsHref} />}
    </main>
  );
}
