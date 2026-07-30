"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../../capabilities.module.css";

type ClaudeGuideSlug = "skills" | "projects" | "vibe-coding" | "scheduled-actions";

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

const ARTIFACT_STEPS: GuideStep[] = [
  {
    title: "Find your Artifacts",
    helper: "Artifacts tab in the left sidebar",
    description: "Open the Artifacts tab in the left sidebar to see everything you have made.",
    caption: "Open Artifacts from the left sidebar, or go to claude.ai/artifacts, to see everything you have made.",
    src: "/claude-guides/artifacts-step-1.png",
    alt: "Claude Artifacts page showing the Artifacts tab in the left sidebar and saved Artifacts",
    width: 2048,
    height: 917,
  },
  {
    title: "Create an Artifact",
    helper: "Artifact window next to a chat",
    description: "Ask Claude to build something substantial and it appears beside the chat.",
    caption: "When Claude builds something substantial, it renders in an Artifact window beside the conversation.",
    src: "/claude-guides/artifacts-step-2.png",
    alt: "Claude chat with an Artifact rendered in a window on the right",
    width: 2048,
    height: 882,
  },
  {
    title: "Publish an Artifact",
    helper: "Publish → Copy link",
    description: "Use Publish to create a shareable link.",
    caption: "Click Publish to create a link that other people can open and use.",
    src: "/claude-guides/artifacts-step-3.png",
    alt: "Claude Artifact published dialog showing a public link and Copy link option",
    width: 1072,
    height: 864,
  },
];

const SCHEDULED_STEPS: GuideStep[] = [
  {
    title: "Find Scheduled",
    helper: "Claude desktop → Sidebar → Scheduled",
    description: "Open the Claude desktop app and select Scheduled in the left sidebar.",
    caption: "Select Scheduled in the Claude desktop app sidebar to open the Scheduled tasks page.",
    src: "/claude-guides/scheduled-step-1.png",
    alt: "Claude desktop app with Scheduled selected in the left sidebar",
    width: 1378,
    height: 525,
  },
  {
    title: "Create a new task",
    helper: "Scheduled → New task",
    description: "Open New task and choose to create it with Claude or set it up manually.",
    caption: "Select New task, then choose Create with Claude or Set up manually.",
    src: "/claude-guides/scheduled-step-2.png",
    alt: "Claude Scheduled tasks page with a Morning brief task and the New task button",
    width: 881,
    height: 461,
  },
  {
    title: "Fill in the task details",
    tabTitle: "Fill in the details",
    helper: "New task → Set up manually",
    description: "Add the prompt, context, approval setting, model and frequency.",
    caption: "Add a name, description and prompt, then choose the project or folder, approval setting, model and frequency.",
    src: "/claude-guides/scheduled-step-3.png",
    alt: "Claude Create scheduled task form with fields for the task details and frequency",
    width: 749,
    height: 584,
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

const ARTIFACT_PROMPT = `Build me a simple expense tracker as a clean, single-page interactive app.
Let me add an expense with a name, amount, category, and date.
Show every expense in a table and let me edit or delete entries.
Display a running total above the list and category-wise totals.
Add filters for category and date, plus a button to clear all entries.
Use a clean, professional design with clear labels and sensible colors.`;

const SCHEDULED_PROMPT = "Check my email and calendar for anything pending that needs my attention today, and summarize it for me.";

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
  const isProjects = slug === "projects";
  const isArtifacts = slug === "vibe-coding";
  const eyebrow = isSkills
    ? "SKILLS · CLAUDE"
    : isProjects
      ? "PRODUCTS · CLAUDE"
      : isArtifacts
        ? "ARTIFACTS · CLAUDE"
        : "AUTOMATION · CLAUDE";
  const title = isSkills ? "Claude Skills" : isProjects ? "Claude Projects" : isArtifacts ? "Claude Artifacts" : "Scheduled";
  const subtitle = isSkills
    ? "Saved instructions Claude can reuse whenever a matching task appears."
    : isProjects
      ? "A practical guide to understanding, creating, and using Projects inside Claude."
      : isArtifacts
        ? "Documents, code, webpages, diagrams and working apps rendered beside your conversation."
        : "Set a prompt to run automatically at the time and frequency you choose.";

  return (
    <>
      <Link href="/ask-ai?tool=claude" className={styles.claudeBack}>← Back</Link>
      <header className={styles.claudeTitleRow}>
        <div>
          <p className={styles.claudeEyebrow}>{eyebrow}</p>
          <h1>{title}</h1>
          <p className={styles.claudeSubtitle}>{subtitle}</p>
        </div>
        <span className={styles.claudeToolChip}>{slug === "scheduled-actions" ? "Claude desktop" : "Claude"}</span>
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

function ClaudeArtifactsGuide({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(ARTIFACT_PROMPT);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
    window.setTimeout(() => setCopyStatus("idle"), 1600);
  }

  return (
    <>
      <section className={styles.claudeIntro}>
        <div className={styles.claudeIntroCopy}>
          <span className={styles.claudeIntroIcon}>◫</span>
          <div>
            <span className={styles.claudeKicker}>1 · WHAT IT IS</span>
            <h2>A dedicated window for substantial content</h2>
            <p>A dedicated window where Claude renders substantial content it creates — a document, code, a webpage, a diagram, or a small working app — instead of leaving it as plain chat text.</p>
          </div>
        </div>
        <aside className={styles.claudeComparisonNote}>
          <span>Where it appears</span>
          <strong>Right next to the conversation, ready to use or iterate on.</strong>
        </aside>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="2" kicker="WHAT IT SOLVES" title="See and use what Claude creates" />
        <div className={styles.claudeCompare}>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWithout}`}>
            <strong>WITHOUT ARTIFACTS</strong>
            <div><i>×</i><p>Everything Claude makes is buried in the chat as text.</p></div>
            <div><i>↗</i><p>You copy-paste it elsewhere to actually see or use it.</p></div>
          </article>
          <span className={styles.claudeCompareArrow}>→</span>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWith}`}>
            <strong>WITH ARTIFACTS</strong>
            <div><i>✓</i><p>It renders live, right next to the conversation.</p></div>
            <div><i>✓</i><p>It is ready to use or iterate on.</p></div>
          </article>
        </div>
      </section>

      <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}>
        <SectionHeading number="3" tone="blue" kicker="WHERE TO FIND AND CREATE ONE" title="Artifacts inside Claude" />
        <p className={styles.claudeSectionCopy}>Appears automatically on the right whenever Claude builds something substantial — just ask for what you want. See everything you&apos;ve made in the &quot;Artifacts&quot; tab in the left sidebar, or claude.ai/artifacts.</p>
        <StepGuide steps={ARTIFACT_STEPS} label="Claude Artifacts screenshots" />
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="4" tone="green" kicker="STRENGTHS AND LIMITATIONS" title="What Artifacts do well and what to know" />
        <div className={styles.claudeComparisonTableWrap}>
          <table className={styles.claudeComparisonTable}>
            <thead>
              <tr>
                <th scope="col">What Artifacts do well</th>
                <th scope="col">What to know before using one</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><div className={styles.claudeTableGood}><span>✓</span><div>Builds something real and usable in minutes with no separate dev tool.</div></div></td>
                <td><div className={styles.claudeTableLimit}><span>!</span><div>Only runs while someone has it open, nothing happens in the background.</div></div></td>
              </tr>
              <tr>
                <td><div className={styles.claudeTableGood}><span>✓</span><div>Can connect to live tools like Calendar or Slack.</div></div></td>
                <td><div className={styles.claudeTableLimit}><span>!</span><div>Needs &quot;Code execution and file creation&quot; on in Settings.</div></div></td>
              </tr>
              <tr>
                <td><div className={styles.claudeTableGood}><span>✓</span><div>Can remember data between visits once published.</div></div></td>
                <td><div className={styles.claudeTableLimit}><span>!</span><div>No free internet access, only Claude&apos;s API and approved connectors.</div></div></td>
              </tr>
              <tr>
                <td><div className={styles.claudeTableGood}><span>✓</span><div>Easy to iterate by just asking for changes.</div></div></td>
                <td><div className={styles.claudeTableLimit}><span>!</span><div>Saved data only works once published, not while testing.</div></div></td>
              </tr>
              <tr>
                <td className={styles.claudeTableEmpty} />
                <td><div className={styles.claudeTableLimit}><span>!</span><div>Each user must connect their own tools separately.</div></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.claudeTryCard}>
        <span className={styles.claudeTryIcon}>→</span>
        <div>
          <span className={styles.claudeKicker}>5 · TRY IT YOURSELF</span>
          <h2>Build a simple expense tracker</h2>
          <pre>{ARTIFACT_PROMPT}</pre>
          <p>Then ask it to add a chart or change the colors.</p>
        </div>
        <button type="button" onClick={copyPrompt}>
          {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Select prompt" : "Copy prompt"}
        </button>
      </section>

      <ClaudeCta
        count={count}
        workflowsHref={workflowsHref}
        heading="Explore Claude Artifacts workflows"
        description="Build, test and publish guided interactive-app workflows with Artifacts."
      />
    </>
  );
}

function ClaudeScheduledGuide({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(SCHEDULED_PROMPT);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
    window.setTimeout(() => setCopyStatus("idle"), 1600);
  }

  return (
    <>
      <section className={styles.claudeIntro}>
        <div className={styles.claudeIntroCopy}>
          <span className={styles.claudeIntroIcon}>⏱</span>
          <div>
            <span className={styles.claudeKicker}>1 · WHAT IT IS</span>
            <h2>A prompt Claude runs automatically for you</h2>
            <p>Set it to run daily, weekly, or anywhere from hourly to weekly, instead of typing it in every time.</p>
          </div>
        </div>
        <aside className={styles.claudeComparisonNote}>
          <span>The simple version</span>
          <strong>Set the prompt, choose the schedule, and Claude runs it at the time you selected.</strong>
        </aside>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="2" kicker="WHAT IT SOLVES" title="Stop repeating the same prompt manually" />
        <div className={styles.claudeCompare}>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWithout}`}>
            <strong>WITHOUT SCHEDULED TASKS</strong>
            <div><i>↻</i><p>You have to remember to open Claude.</p></div>
            <div><i>⌨</i><p>You ask the same question every morning, every week, every time.</p></div>
          </article>
          <span className={styles.claudeCompareArrow}>→</span>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWith}`}>
            <strong>WITH SCHEDULED TASKS</strong>
            <div><i>✓</i><p>You set it up once.</p></div>
            <div><i>✓</i><p>Claude runs it at the time you chose, waiting for you when you check back.</p></div>
          </article>
        </div>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="3" tone="purple" kicker="WHAT GOES INSIDE" title="The task, context and schedule" />
        <p className={styles.claudeSectionCopy}>Add a name, a short description, and the actual instruction. You also choose which project or folder it runs in, whether you want to approve it before each run, which Claude model it uses, and how often it repeats, from hourly up to weekly.</p>
        <div className={styles.claudeFieldCard}>
          <div className={styles.claudeFieldTop}><span>⏱</span><strong>Scheduled task</strong><em>Example</em></div>
          <div className={styles.claudeFieldLines}>
            <p><span>Name</span><strong>Daily briefing</strong></p>
            <p><span>Frequency</span><strong>Daily</strong></p>
            <p className={styles.claudeFieldWide}><span>Instruction</span><strong>Check my Google Calendar for today&apos;s meetings and summarize my unread emails. Highlight anything urgent.</strong></p>
            <p><span>Context</span><strong>Project or folder</strong></p>
            <p><span>Settings</span><strong>Approval and model</strong></p>
          </div>
        </div>
      </section>

      <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}>
        <SectionHeading number="4" tone="blue" kicker="WHERE TO FIND AND CREATE ONE" title="Three steps inside the Claude desktop app" />
        <p className={styles.claudeSectionCopy}>In the sidebar, open <strong>Scheduled</strong> and select <strong>New task</strong>. You can choose <strong>Create with Claude</strong> to describe it in chat, or <strong>Set up manually</strong> to fill in the fields yourself.</p>
        <StepGuide steps={SCHEDULED_STEPS} label="Claude Scheduled Task steps" />
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="5" tone="green" kicker="IMPORTANT LIMITATIONS" title="Claude desktop must be available" />
        <div className={styles.claudeLimitList}>
          <article><span>⌘</span><div><strong>Desktop app only</strong><p>Scheduled tasks currently only exist in the Claude desktop app. The feature is not available on Claude web.</p></div></article>
          <article><span>!</span><div><strong>Computer awake and online</strong><p>Your computer needs to be awake and online at the scheduled time. If it is asleep or off, the task will not fire.</p></div></article>
          <article><span>☀</span><div><strong>Keep awake</strong><p>Use the “Keep awake” toggle to help Claude run the task at the scheduled time.</p></div></article>
        </div>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="6" tone="green" kicker="STRENGTHS" title="Why scheduled tasks are useful" />
        <div className={styles.claudeStrengthList}>
          <article><span>✓</span><div><strong>Set it up once and forget it</strong><p>No need to remember to ask Claude each time.</p></div></article>
          <article><span>✦</span><div><strong>Create it by chatting</strong><p>Describe what you want in plain language instead of filling out a form.</p></div></article>
          <article><span>↻</span><div><strong>Flexible frequency</strong><p>Run it from a few hours apart up to weekly.</p></div></article>
          <article><span>⌂</span><div><strong>Use the right context</strong><p>Run it inside a specific project or folder so it has the right context every time.</p></div></article>
        </div>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="7" tone="purple" kicker="HOW TO CREATE ONE" title="Choose chat or manual setup" />
        <p className={styles.claudeSectionCopy}>You can either describe what you want in plain language and let Claude build the task for you, or set it up manually: give it a name, a description, the actual prompt, pick a project or folder, choose whether it needs your approval before each run, pick the model, and set the frequency.</p>
        <div className={styles.claudeCreateOptions}>
          <article><span>✦</span><div><h3>Create with Claude</h3><p>Describe the task in chat and let Claude set it up for you.</p></div></article>
          <article><span>☷</span><div><h3>Set up manually</h3><p>Fill in the task details, settings and frequency yourself.</p></div></article>
        </div>
      </section>

      <section className={styles.claudeScheduledTryCard}>
        <span className={styles.claudeTryIcon}>→</span>
        <div>
          <span className={styles.claudeKicker}>8 · TRY IT YOURSELF</span>
          <h2>Create a “6pm check-in”</h2>
          <p>Set the frequency to daily at 6:00 PM and let Claude have it waiting for you every evening.</p>
        </div>
        <button type="button" onClick={copyPrompt}>
          {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Select prompt" : "Copy prompt"}
        </button>
        <p className={styles.claudeScheduledPrompt}>“{SCHEDULED_PROMPT}”</p>
      </section>

      <ClaudeCta
        count={count}
        workflowsHref={workflowsHref}
        heading="Explore Claude Scheduled Task workflows"
        description="Open guided workflows for recurring briefs, check-ins and scheduled follow-up."
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
      {slug === "skills" ? (
        <ClaudeSkillsGuide count={count} workflowsHref={workflowsHref} />
      ) : slug === "projects" ? (
        <ClaudeProjectsGuide count={count} workflowsHref={workflowsHref} />
      ) : slug === "vibe-coding" ? (
        <ClaudeArtifactsGuide count={count} workflowsHref={workflowsHref} />
      ) : (
        <ClaudeScheduledGuide count={count} workflowsHref={workflowsHref} />
      )}
    </main>
  );
}
