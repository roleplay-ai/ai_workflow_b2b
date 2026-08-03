"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../../capabilities.module.css";

type ClaudeGuideSlug =
  | "skills"
  | "projects"
  | "vibe-coding"
  | "scheduled-actions"
  | "ai-agents"
  | "coding-agents"
  | "design"
  | "dispatch";

type Props = {
  slug: ClaudeGuideSlug;
  count?: number;
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
    title: "Find and add Skills",
    helper: "Settings → Skills → Add",
    description: "Open Skills and choose how you want to add one.",
    caption: "Open Claude Settings, select Skills, then use Add to create with Claude, write instructions, or upload a skill.",
    src: "/claude-guides/skills-step-1.png",
    alt: "Claude Settings Skills page with the Add menu open",
    width: 975,
    height: 736,
  },
  {
    title: "Invoke a saved Skill",
    helper: "Chat composer → /",
    description: "Type / and choose a saved Skill.",
    caption: "Type / in the composer and select a saved skill. Claude shows its description before you use it.",
    src: "/claude-guides/skills-step-2.png",
    alt: "Claude chat composer showing saved skills and a skill description",
    width: 727,
    height: 487,
  },
  {
    title: "Start skill-creator",
    helper: "Chat composer → /skill-creator",
    description: "Describe the repeatable task you want Claude to save.",
    caption: "Invoke /skill-creator, then describe the task, inputs, rules, and output you want the skill to repeat.",
    src: "/claude-guides/skills-step-3.png",
    alt: "Claude chat composer with slash skill-creator entered",
    width: 760,
    height: 303,
  },
  {
    title: "Enable file creation",
    helper: "Settings → Capabilities",
    description: "Allow Skills to run scripts and create files.",
    caption: "Turn on Code execution and file creation before using a skill that needs to run scripts or produce files.",
    src: "/claude-guides/skills-step-4.png",
    alt: "Claude Settings Capabilities screen with code execution and file creation enabled",
    width: 979,
    height: 735,
  },
  {
    title: "Review the generated output",
    helper: "Chat → Generated file preview",
    description: "Check the output and update the Skill when needed.",
    caption: "Open the generated file, check it against the reference, and ask Claude to update the skill when the same issue should be prevented next time.",
    src: "/claude-guides/skills-step-5.png",
    alt: "Claude conversation showing a generated branded PowerPoint file preview",
    width: 1848,
    height: 815,
  },
];

const PROJECT_STEPS: GuideStep[] = [
  {
    title: "Create a Project",
    helper: "Projects → New Project",
    description: "Give the workspace a clear name and goal.",
    caption: "Give the Project a clear name and describe what you want to achieve.",
    src: "/claude-guides/projects-step-1.png",
    alt: "Claude Create a project dialog with fields for the project name and goal",
    width: 538,
    height: 369,
  },
  {
    title: "Set project instructions",
    helper: "Project → Instructions",
    description: "Save the recurring rules once.",
    caption: "Save the recurring rules once so every new Project chat follows them.",
    src: "/claude-guides/projects-step-2.png",
    alt: "Claude Set project instructions dialog showing meeting follow-up email instructions",
    width: 734,
    height: 524,
  },
  {
    title: "Add files to the knowledge base",
    helper: "Project → Files → +",
    description: "Upload files, paste text or connect a supported source.",
    caption: "Upload documents, paste text or connect supported sources from the Files menu.",
    src: "/claude-guides/projects-step-3.png",
    alt: "Claude Project files area with the add menu for device, text, GitHub and Drive",
    width: 432,
    height: 369,
  },
  {
    title: "Work inside the Project",
    helper: "Project workspace",
    description: "Start separate chats with shared Project context.",
    caption: "Start separate chats while the instructions and uploaded files remain available in the Project.",
    src: "/claude-guides/projects-step-4.png",
    alt: "Claude Meeting Action Items Project workspace with memory, instructions, files and recent chats",
    width: 1248,
    height: 674,
  },
  {
    title: "Review Project memory",
    helper: "Project → Memory",
    description: "Review the purpose, context and working principles.",
    caption: "Claude can summarise the purpose, context and useful working principles built from past Project chats.",
    src: "/claude-guides/projects-step-5.png",
    alt: "Claude Manage project memory dialog showing purpose, context and key learnings",
    width: 776,
    height: 696,
  },
];

const ARTIFACT_STEPS: GuideStep[] = [
  {
    title: "Your Artifacts collection",
    tabTitle: "Find your Artifacts collection",
    helper: "Claude → Artifacts",
    description: "Open your saved artifacts.",
    caption: "Published artifacts stay together for quick reuse.",
    src: "/claude-guides/artifacts-step-1.png",
    alt: "Claude Artifacts page showing saved artifacts and a New artifact button",
    width: 1128,
    height: 613,
  },
  {
    title: "Start a new artifact",
    tabTitle: "Create a new artifact",
    helper: "Artifacts → New artifact",
    description: "Start from chat or Cowork.",
    caption: "Use New artifact to choose how you want to begin.",
    src: "/claude-guides/artifacts-step-2.png",
    alt: "Claude Artifacts page with chat and Cowork artifact creation options",
    width: 1218,
    height: 622,
  },
  {
    title: "Publish an artifact",
    tabTitle: "Publish and copy the link",
    helper: "Publish → Copy link",
    description: "Publish and copy a link.",
    caption: "Publishing creates a shareable link while keeping the chat private.",
    src: "/claude-guides/artifacts-step-3.png",
    alt: "Claude Artifact published dialog with Copy link and Unpublish options",
    width: 1132,
    height: 711,
  },
  {
    title: "Published artifact in use",
    tabTitle: "Open the published artifact",
    helper: "Public artifact link",
    description: "View it as a standalone page.",
    caption: "The published artifact opens independently in the browser.",
    src: "/claude-guides/artifacts-step-4.png",
    alt: "Published Claude artifact showing an interactive org chart generator",
    width: 1238,
    height: 760,
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

const CODE_STEPS: GuideStep[] = [
  {
    title: "Open the Code tab",
    helper: "Claude desktop app → Code",
    description: "Select Code at the top of the Claude desktop app to enter Claude Code.",
    caption: "Select Code at the top of the Claude desktop app. From here, you can describe a task and let Claude Code work through the project.",
    src: "/claude-guides/code-step-1.png",
    alt: "Claude desktop app with the Code tab selected",
    width: 1227,
    height: 721,
  },
  {
    title: "Choose a local project",
    helper: "Local → select your project folder",
    description: "Select Local and point Claude Code to the folder it is allowed to work inside.",
    caption: "Select Local, then choose the project folder Claude Code is allowed to read, edit, and run commands inside. Check the folder before starting because this is real local access.",
    src: "/claude-guides/code-step-2.png",
    alt: "Claude Code local environment menu used to choose a project folder",
    width: 803,
    height: 420,
  },
  {
    title: "Create a Routine",
    helper: "More → Routines",
    description: "Open Routines to schedule recurring workflows such as PR or issue reviews.",
    caption: "Open Routines to set up recurring coding workflows. The available templates include PR digests, issue triage, system health checks, and dependency update checks.",
    src: "/claude-guides/code-step-3.png",
    alt: "Claude Code Routines page showing recurring workflow templates",
    width: 1236,
    height: 727,
  },
];

const COWORK_STEPS: GuideStep[] = [
  {
    title: "Find the Cowork tab",
    helper: "Claude web → Cowork → Open in desktop app",
    description: "Open Cowork from the left sidebar.",
    caption: "Select Cowork in the left sidebar. On the web, choose Open in desktop app to continue.",
    src: "/claude-guides/cowork-step-1.png",
    alt: "Claude interface showing Cowork in the left sidebar and the option to open it in the desktop app",
    width: 1057,
    height: 711,
  },
  {
    title: "Give Cowork a goal",
    tabTitle: "Give it a goal",
    helper: "Cowork → Choose a folder → Describe the outcome",
    description: "Describe the outcome you want.",
    caption: "Give Cowork access to a folder and describe the result you want. It breaks the goal into steps and starts working through the files.",
    src: "/claude-guides/cowork-step-2.png",
    alt: "Claude Cowork processing a goal to rename travel receipt files while showing task progress and folder contents",
    width: 989,
    height: 786,
  },
  {
    title: "Review the completed work",
    helper: "Cowork → Progress and final report",
    description: "Check what Cowork changed.",
    caption: "Review the completed steps and Cowork’s report. Check what it changed before treating the task as complete.",
    src: "/claude-guides/cowork-step-3.png",
    alt: "Claude Cowork reporting that it reviewed and renamed travel receipt files and showing the completed folder contents",
    width: 1008,
    height: 767,
  },
  {
    title: "Check the folder on your laptop",
    tabTitle: "Check the folder",
    helper: "Finder → The folder Cowork worked on",
    description: "Confirm the files on your laptop.",
    caption: "Open the folder on your laptop and confirm the filenames and folder structure match the goal you gave Cowork.",
    src: "/claude-guides/cowork-step-4.png",
    alt: "Mac Finder window showing travel receipt files renamed by date and mode of transport",
    width: 807,
    height: 411,
  },
];

const DESIGN_STEPS: GuideStep[] = [
  {
    title: "Create a design system from uploaded files",
    tabTitle: "Create a design system",
    helper: "Claude Design → Design system",
    description: "Start from uploaded brand files and strong existing examples.",
    caption: "Start by selecting a design system and uploading real source material.",
    src: "/claude-guides/design-step-1.png",
    alt: "Claude Design home screen showing the Design system selector and visual output templates",
    width: 1030,
    height: 816,
  },
  {
    title: "Review the generated design system",
    tabTitle: "Review the output",
    helper: "Design system → Canvas",
    description: "Check the generated system before building on top of it.",
    caption: "Review and correct the generated visual system before creating other outputs.",
    src: "/claude-guides/design-step-2.png",
    alt: "Claude Design canvas showing a generated carousel design system with slide layouts and the Tweaks panel",
    width: 1471,
    height: 817,
  },
  {
    title: "Create a template on top of it",
    tabTitle: "Create a template",
    helper: "Design system → Template",
    description: "Build recurring layouts on top of the design system.",
    caption: "Use the approved design system as the foundation for recurring layouts.",
    src: "/claude-guides/design-step-3.png",
    alt: "Claude Design canvas showing a structured visual workflow created from a reusable design",
    width: 1599,
    height: 815,
  },
];

const DISPATCH_STEPS: GuideStep[] = [
  {
    title: "Open Dispatch on your phone",
    helper: "Claude mobile → Dispatch",
    description: "Use the Claude mobile menu to enter Dispatch.",
    caption: "Open the Claude mobile menu and select Dispatch to start or continue a remote task.",
    src: "/claude-guides/dispatch-step-1.png",
    alt: "Claude mobile menu showing the Dispatch option",
    width: 317,
    height: 671,
  },
  {
    title: "Give and follow the task",
    helper: "Dispatch conversation on mobile",
    description: "Continue the same Dispatch conversation from your phone.",
    caption: "Describe the task from your phone, answer Claude's questions, and follow the same conversation while it works.",
    src: "/claude-guides/dispatch-step-2.png",
    alt: "Claude Dispatch conversation on a phone showing access to a Cowork folder",
    width: 327,
    height: 678,
  },
  {
    title: "See it on Desktop",
    helper: "Claude Desktop → Dispatch",
    description: "Manage access and follow the connected session on the Desktop app.",
    caption: "The Desktop app shows the connected conversation, local settings, outputs, and the access controls available for the task.",
    src: "/claude-guides/dispatch-step-3.png",
    alt: "Claude Desktop showing Dispatch settings and the same connected conversation",
    width: 1237,
    height: 715,
  },
];

const PROJECT_PROMPT = `Meeting Follow-up Email Instructions
Using the latest uploaded meeting transcript, generate two ready-to-send emails.
1. Leadership Email — for senior stakeholders. Include: status (on track/delayed/blocked), brief summary, decisions made, risks/blockers, and leadership support needed (approvals, sign-offs). Under 200 words.
2. Participant Action Email — one consolidated email for all participants. Include: opening line with submission deadline (if any), action items grouped by participant name with timeline and dependency for each, open questions, and next meeting date. Under 250 words.

Rules for both:
- Use only the latest transcript. Don't invent details, write "To be confirmed" for anything unclear or unstated.
- Bullet points over paragraphs. No filler phrases, no meeting play-by-play.
- Direct, professional tone.
- Output only the two emails.`;

const ARTIFACT_PROMPT = "I've attached my LinkedIn profile as a PDF. Build me a single-page personal website as an HTML artifact. Use my actual name, headline, experience, and skills from the PDF, don't invent anything. Include a hero section with my name and headline, an About section based on my summary, a clean timeline of my experience, and a skills section. Keep the design minimal and modern, one accent color, good whitespace, mobile-responsive.";

const SKILL_ACTIVITY_PROMPT = `Use /skill-creator to build a reusable skill called sales-dashboard-generator.

The skill should accept an uploaded Excel sales dataset and use the supplied Sales_MIS_May2026.pptx file as the visual and structural reference.

It must create an editable PowerPoint dashboard in the same four-slide format:
1. Monthly Summary
Show total revenue, units sold, total orders, average order value, average selling price, channel revenue, zone revenue, and one concise key insight.
2. Weekly Sales Trend
Show each week's revenue, units, orders, average order value, and one concise watch-out based on the data.
3. Product Performance
Show the top six product models by revenue with revenue, units, average selling price, revenue share, and one concise insight on what is working.
4. People, Clients & Channels
Show the top five clients by revenue, top five salespeople by revenue, channel mix, and one concise action needed.

Skill requirements:
- Detect the reporting month and year from the uploaded data. Do not hardcode dates.
- Identify the relevant worksheet and map equivalent fields even when column names vary.
- Normalise mixed date formats.
- If Revenue is missing, calculate it as Units_Sold × Unit_Price or Price.
- Preserve the reference deck's slide size, layout, typography, spacing, colours, hierarchy, and visual density as closely as possible.
- Replace every value, month label, ranking, chart, table, and insight using the uploaded dataset.
- Use Indian number formatting, including ₹L and ₹K where appropriate.
- Keep all PowerPoint elements editable.
- Validate totals and rankings against the source data before saving.
- If a required field cannot be identified safely, ask one concise clarification question instead of guessing.
- Save the completed output as an editable .pptx file.

First build and test the skill using Sales Data - June 2026.xlsx with Sales_MIS_May2026.pptx as the reference.
After the skill is saved, upload Sales_Dummy_Data_Test_Month (1).xlsx and run the skill again without re-explaining the dashboard format.`;

const SCHEDULED_PROMPT = "Check my email and calendar for anything pending that needs my attention today, and summarize it for me.";
const CODE_PROMPT = "Find and fix any obvious bugs in this codebase, then explain what you changed.";
const COWORK_GOAL = "Rename these files based on their date and category, and organize them into subfolders.";
const DISPATCH_PROMPT = `In the Quarterly Reports folder, review Q4 Performance.xlsx. Create a self-contained HTML dashboard in the same folder with five KPI cards, department filters, and interactive charts. Do not modify the spreadsheet or any other files. Ask before using the browser or external connectors. Tell me the saved filename when finished.`;
const DISPATCH_ACTIVITY_PROMPT = `In [folder name], review [file name]. Create a summary of the key numbers as a new text file in the same folder. Do not modify the original file. Tell me when it's done.`;

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
  const header: Record<ClaudeGuideSlug, { eyebrow: string; title: string; subtitle: string; chip: string }> = {
    skills: {
      eyebrow: "CLAUDE GUIDE",
      title: "Claude Skills",
      subtitle: "Reusable instruction sets Claude loads to handle a specific task consistently across Claude.ai, Claude Code, and the API.",
      chip: "Claude",
    },
    projects: {
      eyebrow: "CLAUDE WORKSPACE GUIDE",
      title: "Claude Projects",
      subtitle: "Keep files, instructions and related chats together so the context is available across the work.",
      chip: "Claude",
    },
    "vibe-coding": {
      eyebrow: "CLAUDE WORKSPACE GUIDE",
      title: "Claude Artifacts",
      subtitle: "Create, edit, publish, and reuse substantial work beside your chat.",
      chip: "Claude",
    },
    "scheduled-actions": {
      eyebrow: "AUTOMATION · CLAUDE",
      title: "Scheduled",
      subtitle: "Set a prompt to run automatically at the time and frequency you choose.",
      chip: "Claude desktop",
    },
    "ai-agents": {
      eyebrow: "AI AGENTS · CLAUDE",
      title: "Claude Cowork",
      subtitle: "Give Claude a goal and let it work through files and connected tools on your laptop.",
      chip: "Claude",
    },
    "coding-agents": {
      eyebrow: "AGENTIC CODING · CLAUDE",
      title: "Claude Code",
      subtitle: "An agent that can work across an entire code project, run commands, test changes, and deliver working code.",
      chip: "Claude",
    },
    design: {
      eyebrow: "Visual creation",
      title: "Claude Design",
      subtitle: "A conversational workspace for creating visual outputs.",
      chip: "Claude",
    },
    dispatch: {
      eyebrow: "COWORK · CLAUDE",
      title: "Claude Dispatch",
      subtitle: "Send computer-based tasks from your phone and let Claude complete them through the connected Desktop app.",
      chip: "Claude Cowork",
    },
  };
  const pageHeader = header[slug];

  return (
    <>
      <Link href="/ask-ai?tool=claude" className={styles.claudeBack}>← Back</Link>
      <header className={styles.claudeTitleRow}>
        <div>
          <p className={styles.claudeEyebrow}>{pageHeader.eyebrow}</p>
          <h1>{pageHeader.title}</h1>
          <p className={styles.claudeSubtitle}>{pageHeader.subtitle}</p>
        </div>
        <span className={styles.claudeToolChip}>{pageHeader.chip}</span>
      </header>
    </>
  );
}

function ClaudeSkillsGuide({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(SKILL_ACTIVITY_PROMPT);
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
          <span className={styles.claudeIntroIcon}>📋</span>
          <div><span className={styles.claudeKicker}>1 · WHAT IT IS</span><h2>A reusable instruction set for a specific task</h2><p>A Skill tells Claude how to handle a repeatable task consistently. Claude can load it in Claude.ai, Claude Code, and the API whenever that work comes up.</p></div>
        </div>
        <aside className={styles.claudeComparisonNote}><span>The simple version</span><strong>Save the method once, then reuse it without explaining every requirement again.</strong></aside>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="2" kicker="WHY IT MATTERS" title="Repeat the same work with fewer misses" />
        <div className={styles.claudeCompare}>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWithout}`}><strong>WITHOUT A SKILL</strong><div><i>↻</i><p>Explain the requirements every time</p></div><div><i>≈</i><p>Outputs vary between runs and users</p></div><div><i>!</i><p>Rules, checks, or formats can be missed</p></div></article>
          <span className={styles.claudeCompareArrow}>→</span>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWith}`}><strong>WITH A SKILL</strong><div><i>✓</i><p>Instructions load when the task needs them</p></div><div><i>✓</i><p>The same structure and checks are followed</p></div><div><i>✓</i><p>Files, references, and scripts can travel with it</p></div></article>
        </div>
      </section>

      <div className={styles.claudeDetailGrid}>
        <section className={styles.claudeSection}>
          <SectionHeading number="3" tone="purple" kicker="BEFORE YOU START" title="Turn on file creation" />
          <p className={styles.claudeSectionCopy}>Open <strong>Settings → Capabilities</strong> and enable <strong>Code execution and file creation</strong>. Skills that run scripts or create documents need this capability.</p>
          <div className={styles.claudeNoteBox}>Only enable and run Skills you trust, especially when they use company data or downloaded code.</div>
        </section>
        <section className={styles.claudeSection}>
          <SectionHeading number="4" tone="green" kicker="WHAT IS INSIDE" title="Every Skill starts with SKILL.md" />
          <div className={styles.claudeFileCard}>
            <div className={styles.claudeFileTop}><span>▤</span><strong>SKILL.md</strong><em>Required</em></div>
            <div className={styles.claudeFileLines}><p><span>YAML</span><strong>Name and description</strong></p><p><span>Body</span><strong>Steps, rules, and examples</strong></p><p><span>Optional</span><strong>Scripts and reference files</strong></p></div>
          </div>
        </section>
      </div>

      <section className={styles.claudeSection}>
        <SectionHeading number="5" tone="purple" kicker="CREATE AND IMPROVE" title="Build a Skill with skill-creator" />
        <p className={styles.claudeSectionCopy}>Type <strong>/skill-creator</strong> in a Claude chat and describe the job, inputs, rules, and desired output. After testing, tell Claude what failed and ask it to update the Skill so the improvement is available next time.</p>
      </section>

      <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}>
        <SectionHeading number="6" tone="blue" kicker="SETUP WALKTHROUGH" title="Create, use, and improve a Skill" />
        <StepGuide steps={SKILL_STEPS} label="Claude Skill steps" />
      </section>

      <div className={styles.claudeShareGrid}>
        <article><span>↗</span><div><h3>Share across your organization</h3><p>Team and Enterprise admins can enable a Skill for the organization. Members get a view-only version and automatically receive updates.</p></div></article>
        <article><span>!</span><div><h3>Review external Skills first</h3><p>Agent Skills are an open format available through sources such as GitHub and agentskills.io. Read the instructions and scripts, and never place credentials inside a Skill.</p></div></article>
      </div>

      <section className={styles.claudeSection}>
        <SectionHeading number="7" tone="green" kicker="ANOTHER WAY TO TEACH CLAUDE" title="Record a task from your screen" />
        <p className={styles.claudeSectionCopy}>Claude can use screenshots from a recorded task to help create a Skill. The screenshots are kept as task context; the screen recording video itself is not retained.</p>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="8" tone="yellow" kicker="PRACTICE PATH" title="Build confidence in four levels" />
        <div className={styles.claudeChecklist}>
          <article><span>1</span><div><strong>Use an existing Skill</strong><p>Invoke a saved Skill with / and review how consistently it follows the instructions.</p></div></article>
          <article><span>2</span><div><strong>Create a simple text Skill</strong><p>Save a repeatable writing or analysis method that does not need files or scripts.</p></div></article>
          <article><span>3</span><div><strong>Add files and formatting</strong><p>Give the Skill a reference document, template, or example output to follow.</p></div></article>
          <article><span>4</span><div><strong>Add validation and test again</strong><p>Run it with a second input, find what breaks, and update the Skill.</p></div></article>
        </div>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="9" kicker="TEAM ACTIVITY" title="Create a reusable sales dashboard Skill" />
        <p className={styles.claudeSectionCopy}>Download the source data, reference presentation, and test-month data. Build the Skill with the first two files, then prove it is reusable by running it with the test file without re-explaining the dashboard.</p>
        <div className={styles.claudeAssets}>
          <article><div><span>▤</span><div><h3>Sales Data - June 2026.xlsx</h3><p>First-run sales data</p></div></div><span className={styles.claudeFileTag}>XLSX</span><a download href="/claude-guides/Sales Data - June 2026.xlsx">Download</a></article>
          <article><div><span>▤</span><div><h3>Sales_MIS_May2026.pptx</h3><p>Visual reference deck</p></div></div><span className={styles.claudeFileTag}>PPTX</span><a download href="/claude-guides/Sales_MIS_May2026.pptx">Download</a></article>
          <article><div><span>▤</span><div><h3>Sales_Dummy_Data_Test_Month (1).xlsx</h3><p>Second-run test data</p></div></div><span className={styles.claudeFileTag}>XLSX</span><a download href="/claude-guides/Sales_Dummy_Data_Test_Month (1).xlsx">Download</a></article>
        </div>
        <div className={styles.claudePromptCard}>
          <div><strong>Skill-creator prompt</strong><button type="button" onClick={copyPrompt}>{copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : "Copy prompt"}</button></div>
          <pre>{SKILL_ACTIVITY_PROMPT}</pre>
        </div>
      </section>

      <ClaudeCta
        count={count}
        workflowsHref={workflowsHref}
        heading="Explore Claude Skills workflows"
        description="Practice creating, testing, and sharing repeatable instruction sets for real work."
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
            <h2>A dedicated canvas beside your chat</h2>
            <p>Artifacts are substantial, self-contained work Claude creates beside the conversation—documents, code, websites, diagrams, and interactive apps that you can edit, publish, and reuse.</p>
          </div>
        </div>
        <aside className={styles.claudeComparisonNote}>
          <span>Closest comparison</span>
          <strong>An editable canvas with version history that stays connected to your conversation.</strong>
        </aside>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="2" kicker="WHEN IT APPEARS" title="Claude creates one for substantial output" />
        <p className={styles.claudeSectionCopy}>Claude often opens an Artifact when the output is substantial—typically more than about 15 lines—or when you ask for a document, code, HTML, SVG, diagram, React component, or another standalone deliverable.</p>
      </section>

      <div className={styles.claudeDetailGrid}>
        <section className={styles.claudeSection}>
          <SectionHeading number="3" tone="purple" kicker="TURN IT ON" title="Enable both required capabilities" />
          <p className={styles.claudeSectionCopy}>In <strong>Settings → Capabilities</strong>, enable <strong>Code execution and file creation</strong> and the Artifacts capability available to your account.</p>
        </section>
        <section className={styles.claudeSection}>
          <SectionHeading number="4" tone="green" kicker="WORK WITH IT" title="Edit through conversation" />
          <p className={styles.claudeSectionCopy}>Ask Claude to revise a section, change the design, add functionality, or fix a problem. The Artifact updates beside the chat so you can inspect each iteration.</p>
        </section>
      </div>

      <section className={styles.claudeSection}>
        <SectionHeading number="5" tone="purple" kicker="VIEW AND EXPORT" title="Use the rendered view or its source" />
        <div className={styles.claudeTypes}>
          <article><span>◫</span><div><strong>Preview</strong><p>Interact with the rendered result beside the conversation.</p></div></article>
          <article><span>&lt;/&gt;</span><div><strong>Code</strong><p>Open the source when the Artifact is made from code.</p></div></article>
          <article><span>↓</span><div><strong>Copy or download</strong><p>Export the content or file for use outside Claude.</p></div></article>
        </div>
      </section>

      <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}>
        <SectionHeading number="6" tone="blue" kicker="SETUP WALKTHROUGH" title="Create, publish, and open an Artifact" />
        <p className={styles.claudeSectionCopy}>Open <strong>Artifacts</strong> from the Claude sidebar to see saved work, start a new Artifact, or reopen something you published earlier.</p>
        <StepGuide steps={ARTIFACT_STEPS} label="Claude Artifacts screenshots" />
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="7" tone="green" kicker="AI-POWERED ARTIFACTS" title="Build an app that uses Claude" />
        <p className={styles.claudeSectionCopy}>An Artifact can become a Claude-powered chat, coaching, or Q&amp;A app. People who open it sign in to Claude and use their own usage limits, so the creator can share it without paying for every visitor&apos;s model usage.</p>
        <div className={styles.claudeNoteBox}>Publishing creates a shareable Artifact while keeping the original Claude conversation private.</div>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="8" tone="purple" kicker="REGULAR VS LIVE" title="Choose where the Artifact should live" />
        <div className={styles.claudeCompare}>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWithout}`}><strong>REGULAR ARTIFACT</strong><div><i>1</i><p>Created inside a Claude chat</p></div><div><i>2</i><p>Publish, copy, or download it</p></div><div><i>3</i><p>Runs as an independent result</p></div></article>
          <span className={styles.claudeCompareArrow}>→</span>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWith}`}><strong>LIVE ARTIFACT IN COWORK</strong><div><i>✓</i><p>Saved in the Live artifacts tab</p></div><div><i>✓</i><p>Can refresh apps and local files with version history</p></div><div><i>✓</i><p>Stays local and is organization-only on Team and Enterprise</p></div></article>
        </div>
      </section>

      <section className={styles.claudeTryCard}>
        <span className={styles.claudeTryIcon}>→</span>
        <div>
          <span className={styles.claudeKicker}>9 · TRY IT YOURSELF</span>
          <h2>Turn your LinkedIn profile into a personal website</h2>
          <pre>{ARTIFACT_PROMPT}</pre>
          <p>Attach your LinkedIn profile PDF first, then publish or download the finished HTML Artifact.</p>
        </div>
        <button type="button" onClick={copyPrompt}>
          {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Select prompt" : "Copy prompt"}
        </button>
      </section>

      <ClaudeCta
        count={count}
        workflowsHref={workflowsHref}
        heading="Explore Claude Artifacts workflows"
        description="Open guided workflows for creating, editing, publishing, and reusing substantial work with Artifacts."
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

function ClaudeCodeGuide({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(CODE_PROMPT);
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
          <span className={styles.claudeIntroIcon}>⌘</span>
          <div>
            <span className={styles.claudeKicker}>WHAT IT IS</span>
            <h2>Anthropic&apos;s agentic coding system</h2>
            <p>It reads your codebase, makes changes across multiple files, runs tests, and delivers working code, operating at the project level instead of just suggesting the next line.</p>
          </div>
        </div>
        <aside className={styles.claudeComparisonNote}>
          <span>Simple way to think about it</span>
          <strong>You describe the outcome. Claude Code works through the files and commands needed to produce it.</strong>
        </aside>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="1" kicker="WHAT IT SOLVES" title="You review the work instead of writing every change yourself" />
        <div className={styles.claudeCompare}>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWithout}`}>
            <strong>WITHOUT CLAUDE CODE</strong>
            <div><i>1</i><p>Write code file by file</p></div>
            <div><i>2</i><p>Run commands and tests manually</p></div>
            <div><i>3</i><p>Trace changes across the project yourself</p></div>
          </article>
          <span className={styles.claudeCompareArrow}>→</span>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWith}`}>
            <strong>WITH CLAUDE CODE</strong>
            <div><i>✓</i><p>Describe the change you need</p></div>
            <div><i>✓</i><p>It edits across files and runs tests</p></div>
            <div><i>✓</i><p>Review the diff before committing</p></div>
          </article>
        </div>
      </section>

      <div className={styles.claudeDetailGrid}>
        <section className={styles.claudeSection}>
          <SectionHeading number="2" tone="purple" kicker="WHAT IT CAN DO" title="Work across a complete coding task" />
          <div className={styles.claudeCapabilityGrid}>
            <article><span>↔</span><div><strong>Multi-file editing</strong><p>Change related code across the project.</p></div></article>
            <article><span>⚙</span><div><strong>Bug fixing and refactoring</strong><p>Find issues and improve existing code.</p></div></article>
            <article><span>✓</span><div><strong>Code review</strong><p>Inspect code and explain risks or improvements.</p></div></article>
            <article><span>⑂</span><div><strong>Git work</strong><p>Create commits and pull requests.</p></div></article>
            <article><span>›_</span><div><strong>Terminal commands</strong><p>Run builds, tests, and deployments.</p></div></article>
            <article><span>M</span><div><strong>MCP connections</strong><p>Connect to tools such as databases or Slack.</p></div></article>
          </div>
        </section>

        <section className={styles.claudeSection}>
          <SectionHeading number="3" tone="green" kicker="WHERE TO USE IT" title="Choose the entry point that suits you" />
          <div className={styles.claudeAccessGrid}>
            <article><span>▣</span><div><strong>Desktop app</strong><p>The easiest entry point if you are not comfortable with a terminal.</p></div></article>
            <article><span>›_</span><div><strong>Terminal</strong><p>Use Claude Code through its command-line interface.</p></div></article>
            <article><span>⌨</span><div><strong>IDEs</strong><p>Available in VS Code, Cursor, and JetBrains.</p></div></article>
            <article><span>◎</span><div><strong>Web</strong><p>Use Claude Code from the browser when available to your plan.</p></div></article>
          </div>
        </section>
      </div>

      <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}>
        <SectionHeading number="4" tone="blue" kicker="USE IT IN THE DESKTOP APP" title="Access it, give it project control, and automate recurring work" />
        <StepGuide steps={CODE_STEPS} label="Claude Code steps" />
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="5" tone="purple" kicker="STRENGTHS AND LIMITATIONS" title="It has deep access, so use it with clear boundaries" />
        <div className={styles.claudeBalancedGrid}>
          <article className={styles.claudeStrengthCard}>
            <strong>STRENGTHS</strong>
            <p>Full control over files and commands.</p>
            <p>Shows every step, so you can stop and redirect it mid-task.</p>
            <p>Handles complex multi-step work such as refactors and migrations.</p>
            <p>More token-efficient than Cowork for coding tasks.</p>
          </article>
          <article className={styles.claudeLimitationCard}>
            <strong>LIMITATIONS</strong>
            <p>Reads and writes real files and runs real commands. It is not a sandbox.</p>
            <p>Some comfort with a terminal or project structure helps, even if you do not write code yourself.</p>
            <p>Available on paid plans only, with no free tier.</p>
          </article>
        </div>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="6" tone="green" kicker="CLAUDE CODE VS COWORK" title="Choose based on what the task needs to produce" />
        <div className={styles.claudeProductCompare}>
          <article className={styles.claudeProductCode}>
            <span>CLAUDE CODE</span>
            <h3>For tasks that produce code</h3>
            <p>Use it for building, fixing, reviewing, testing, or changing software projects.</p>
          </article>
          <span className={styles.claudeCompareArrow}>→</span>
          <article className={styles.claudeProductCowork}>
            <span>CLAUDE COWORK</span>
            <h3>For tasks that produce files</h3>
            <p>Use it for documents, spreadsheets, presentations, or file organization.</p>
          </article>
        </div>
      </section>

      <section className={styles.claudePromptActivity}>
        <span className={styles.claudeTryIcon}>→</span>
        <div>
          <span className={styles.claudeKicker}>TRY IT YOURSELF</span>
          <h3>Test Claude Code on a small project</h3>
          <p>Point it at a small project folder. Review the diff before allowing it to commit.</p>
          <p className={styles.claudePromptBox}>{CODE_PROMPT}</p>
        </div>
        <button type="button" onClick={copyPrompt}>
          {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Select and copy" : "Copy prompt"}
        </button>
      </section>

      <ClaudeCta
        count={count}
        workflowsHref={workflowsHref}
        heading="Explore Claude Code workflows"
        description="Open guided workflows for building, fixing, reviewing and testing software projects with Claude Code."
      />
    </>
  );
}

function ClaudeCoworkGuide({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copyGoal() {
    try {
      await navigator.clipboard.writeText(COWORK_GOAL);
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
          <span className={styles.claudeIntroIcon}>✦</span>
          <div>
            <span className={styles.claudeKicker}>WHAT IT IS</span>
            <h2>An AI agent mode inside the Claude desktop app</h2>
            <p>Instead of chatting back and forth, you give Cowork a goal, and it works through your local files and connected tools on its own, reading, editing, creating, or deleting files as needed, until the task is done.</p>
          </div>
        </div>
        <aside className={styles.claudeComparisonNote}>
          <span>The simple version</span>
          <strong>Give it a folder and a goal. Cowork works through the task on your laptop.</strong>
        </aside>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="2" kicker="HOW IT IS DIFFERENT" title="Regular Claude chat vs Cowork" />
        <div className={styles.claudeCompare}>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWithout}`}>
            <strong>REGULAR CHAT</strong>
            <div><i>1</i><p>You paste content in</p></div>
            <div><i>2</i><p>Claude gives content back</p></div>
            <div><i>3</i><p>It cannot touch your laptop</p></div>
          </article>
          <span className={styles.claudeCompareArrow}>→</span>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWith}`}>
            <strong>COWORK</strong>
            <div><i>✓</i><p>Direct access to the folder you allow</p></div>
            <div><i>✓</i><p>Can open, edit, create, and delete files</p></div>
            <div><i>✓</i><p>No chat attachment limit, but it uses more tokens</p></div>
          </article>
        </div>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="3" tone="purple" kicker="PROMPT IT DIFFERENTLY" title="Give it a goal, not a question" />
        <p className={styles.claudeSectionCopy}>Cowork figures out the steps, runs commands, and checks its own work rather than waiting for you to walk it through each step.</p>
        <div className={styles.claudePromptExample}>
          <div><span>Regular chat</span><strong>“Summarize this file.”</strong></div>
          <div><span>Cowork goal</span><strong>“Rename all the files in this folder based on their travel date and mode of transport.”</strong></div>
        </div>
      </section>

      <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}>
        <SectionHeading number="4" tone="blue" kicker="WHERE TO FIND AND SET IT UP" title="Find Cowork and see it work" />
        <p className={styles.claudeSectionCopy}>Cowork is available on paid plans. On the web you can preview it, but you need to select <strong>Open in desktop app</strong> to use it because it needs access to your computer.</p>
        <StepGuide steps={COWORK_STEPS} label="Claude Cowork screenshots" />
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="5" tone="green" kicker="REQUIREMENTS AND LIMITS" title="It runs on your laptop" />
        <div className={styles.claudeRequirements}>
          <article><span>1</span><div><strong>Keep your laptop on and awake</strong><p>Cowork is not running in the cloud.</p></div></article>
          <article><span>2</span><div><strong>Choose the folder or project</strong><p>It works on whatever you give it access to.</p></div></article>
          <article><span>3</span><div><strong>Add connected tools when needed</strong><p>It can also work with tools such as Chrome.</p></div></article>
        </div>
      </section>

      <div className={styles.claudeCoworkShareGrid}>
        <article>
          <span>!</span>
          <div><small>6 · BE CAREFUL</small><h3>It can delete your files</h3><p>A mistake in a prompt or a wrong assumption can delete something permanently. Create a new folder, copy the files you want Cowork to work on into it, and give Cowork access to that copy rather than your original folder or Desktop.</p></div>
        </article>
        <article>
          <span>↗</span>
          <div><small>7 · CONNECTED TOOLS</small><h3>It can browse and act on the web</h3><p>If you have connected Claude for Chrome, Cowork can open websites and take actions on them as part of the task, alongside working with local files.</p></div>
        </article>
      </div>

      <section className={styles.claudeCoworkActivity}>
        <SectionHeading number="8" tone="yellow" kicker="TRY IT YOURSELF" title="Organize a folder with Cowork" />
        <div className={styles.claudeCoworkActivityGrid}>
          <div className={styles.claudeChecklist}>
            <article><span>1</span><div><strong>Create a new folder on your laptop</strong><p>Use a fresh folder only for this activity.</p></div></article>
            <article><span>2</span><div><strong>Copy a handful of files into it</strong><p>Use copies of receipts, notes, or other sample files. Keep the originals elsewhere.</p></div></article>
            <article><span>3</span><div><strong>Give Cowork access to the folder</strong><p>Select the new folder when Cowork asks what it can work with.</p></div></article>
            <article><span>4</span><div><strong>Give Cowork the goal</strong><p>Watch it read the files, make the changes, check its work, and report back.</p></div></article>
          </div>
          <aside className={styles.claudeGoalCard}>
            <span>GOAL TO GIVE COWORK</span>
            <p>{COWORK_GOAL}</p>
            <button type="button" onClick={copyGoal}>
              {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Select and copy" : "Copy goal"}
            </button>
          </aside>
        </div>
      </section>

      <ClaudeCta
        count={count}
        workflowsHref={workflowsHref}
        heading="Explore Cowork Workflows"
        description="Open guided workflows that show how to organize files, complete multi-step tasks, and use Cowork safely."
      />
    </>
  );
}

function ClaudeDesignGuide({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  return (
    <>
      <section className={styles.claudeIntro}>
        <div className={styles.claudeIntroCopy}>
          <span className={styles.claudeIntroIcon}>✎</span>
          <div>
            <span className={styles.claudeKicker}>1 · WHAT IT IS</span>
            <h2>Create and refine visual outputs through conversation</h2>
            <p>A conversational workspace for creating visual outputs — presentations, prototypes, landing pages, wireframes, one-pagers, and marketing assets. You describe what you need, review it on a canvas, then refine through chat, inline comments, or direct editing.</p>
          </div>
        </div>
        <aside className={styles.claudeComparisonNote}>
          <span>Visual outputs</span>
          <strong>Presentations, prototypes, landing pages, wireframes, one-pagers, and marketing assets.</strong>
        </aside>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="2" kicker="WHY IT MATTERS" title="What it solves" />
        <div className={styles.claudeCompare}>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWithout}`}>
            <strong>WITHOUT A DESIGN SYSTEM</strong>
            <div><i>×</i><p>Every output starts from scratch, and Claude has to guess at your visual style each time.</p></div>
          </article>
          <span className={styles.claudeCompareArrow}>→</span>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWith}`}>
            <strong>WITH A DESIGN SYSTEM</strong>
            <div><i>✓</i><p>Claude has your colors, fonts, spacing, and components saved once, and every new output starts from that same foundation instead of a blank page.</p></div>
          </article>
        </div>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="3" tone="purple" kicker="BUILT IN ORDER" title="What goes inside" />
        <p className={styles.claudeSectionCopy}>Three layers, built up in order:</p>
        <div className={styles.claudeRequirements}>
          <article><span>1</span><div><strong>Design system</strong><p>Colors, fonts, spacing, components, logos, and the overall visual style.</p></div></article>
          <article><span>2</span><div><strong>Template</strong><p>Recurring layouts for a specific output, like title slides or two-column slides.</p></div></article>
          <article><span>3</span><div><strong>Project instructions</strong><p>Preferences learned from your feedback that carry into future work.</p></div></article>
        </div>
      </section>

      <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}>
        <SectionHeading number="4" tone="blue" kicker="SETUP WALKTHROUGH" title="Where to find and create one" />
        <p className={styles.claudeSectionCopy}>Start by uploading source material — brand guidelines, two or three strong existing designs, your logo, fonts, and writing or voice principles. Claude builds a design system from these, which you then review and correct before building anything else on top of it.</p>
        <StepGuide steps={DESIGN_STEPS} label="Claude Design setup screenshots" />
      </section>

      <div className={styles.claudeDetailGrid}>
        <section className={styles.claudeSection}>
          <SectionHeading number="5" tone="green" kicker="CHOOSE THE RIGHT METHOD" title="How to edit" />
          <p className={styles.claudeSectionCopy}>Different edits call for different methods:</p>
          <div className={styles.claudeDesignMethodGrid}>
            <article><span>C</span><div><strong>Chat</strong><p>Structural or design-wide changes.</p></div></article>
            <article><span>I</span><div><strong>Inline comments</strong><p>Feedback on specific elements.</p></div></article>
            <article><span>D</span><div><strong>Direct editing</strong><p>Quick text, size, or alignment changes.</p></div></article>
            <article><span>T</span><div><strong>Tweaks</strong><p>Controls that affect the whole design, like showing logos or slide numbers.</p></div></article>
          </div>
        </section>

        <section className={styles.claudeSection}>
          <SectionHeading number="6" kicker="WHAT IT DOES WELL" title="Strengths" />
          <div className={styles.claudeDesignStrengthGrid}>
            <article className={styles.claudeDesignStrengthWide}><span>↻</span><div><strong>Reusable design context</strong><p>Later outputs get better and more consistent instead of starting over.</p></div></article>
            <article><span>↓</span><div><strong>Exports</strong><p>Export to PPTX, PDF, standalone HTML, Canva, or Claude Code.</p></div></article>
            <article><span>+</span><div><strong>Project-level instructions</strong><p>Claude learns your recurring feedback as project-level instructions.</p></div></article>
          </div>
        </section>
      </div>

      <section className={styles.claudeSection}>
        <SectionHeading number="7" tone="purple" kicker="PRACTICAL GUIDANCE" title="How to get better results" />
        <div className={styles.claudeDesignTips}>
          <article><span>1</span><p>Upload finished examples, not just a color palette — Claude reads visual style better from real pages or decks than from a list of hex codes.</p></article>
          <article><span>2</span><p>Ask for two or three directions before polishing one.</p></article>
          <article><span>3</span><p>Give specific feedback such as “32px headings” or “reduce card padding to 20px” rather than “make it look better.”</p></article>
          <article><span>4</span><p>Fix the design system itself before fixing the same thing slide by slide.</p></article>
        </div>
      </section>

      <section className={styles.claudeDesignTryCard}>
        <span className={styles.claudeTryIcon}>→</span>
        <div>
          <span className={styles.claudeKicker}>8 · TRY IT YOURSELF</span>
          <h2>Build a small design system and test it</h2>
          <p>Upload two or three of your best existing slides or a one-pager, and ask Claude to build a design system from them. Once it is ready, ask it to turn a rough outline into a two-slide title and agenda deck, then see how closely it matches your style before giving corrections.</p>
        </div>
      </section>

      <ClaudeCta
        count={count}
        workflowsHref={workflowsHref}
        heading="Explore Claude Design workflows"
        description="Open guided workflows for setting up brand rules, creating reusable templates, generating decks, and refining visual output."
      />
    </>
  );
}

function ClaudeDispatchGuide({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  const [copyState, setCopyState] = useState<"idle" | "main" | "activity" | "failed-main" | "failed-activity">("idle");

  async function copyPrompt(prompt: string, target: "main" | "activity") {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState(target);
    } catch {
      setCopyState(`failed-${target}`);
    }
    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  function copyLabel(target: "main" | "activity") {
    if (copyState === target) return "Copied";
    if (copyState === `failed-${target}`) return "Select and copy";
    return "Copy prompt";
  }

  return (
    <>
      <section className={styles.claudeIntro}>
        <div className={styles.claudeIntroCopy}>
          <span className={styles.claudeIntroIcon}>↗</span>
          <div>
            <span className={styles.claudeKicker}>1 · WHAT IT IS</span>
            <h2>Remote control for Claude Cowork</h2>
            <p>A remote-control feature inside Claude Cowork. You assign a task from your phone, and Claude works through it on your Desktop app using approved local folders, browser access, connectors, plugins, and desktop applications. You can monitor progress and continue the same conversation from either device.</p>
          </div>
        </div>
        <aside className={styles.claudeComparisonNote}>
          <span>The key idea</span>
          <strong>Your phone sends the task. Claude Desktop does the computer-based work.</strong>
        </aside>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="2" kicker="WHAT IT SOLVES" title="Computer-based work no longer has to wait" />
        <div className={styles.claudeCompare}>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWithout}`}>
            <strong>WITHOUT DISPATCH</strong>
            <div><i>!</i><p>Computer-based work waits until you are back at your desk.</p></div>
            <div><i>⌂</i><p>You need to be at the computer to start the task.</p></div>
          </article>
          <span className={styles.claudeCompareArrow}>→</span>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWith}`}>
            <strong>WITH DISPATCH</strong>
            <div><i>✓</i><p>Send the task from your phone while you are away.</p></div>
            <div><i>✓</i><p>Review the finished spreadsheet analysis, report, or dashboard when you get back.</p></div>
          </article>
        </div>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="3" tone="purple" kicker="HOW IT WORKS" title="One task, one continuous conversation" />
        <div className={styles.claudeDispatchFlow}>
          <article><b>1</b><h3>Send the task</h3><p>You send a task from your phone and name the files or folders Claude should use.</p></article>
          <article><b>2</b><h3>Claude works on desktop</h3><p>Claude uses the approved files and tools through the Desktop app.</p></article>
          <article><b>3</b><h3>Follow the progress</h3><p>Progress appears on your phone, and the output is saved or returned once done.</p></article>
        </div>
      </section>

      <div className={styles.claudeDetailGrid}>
        <section className={styles.claudeSection}>
          <SectionHeading number="4" tone="green" kicker="WHERE TO FIND AND SET IT UP" title="Connect the two apps" />
          <div className={styles.claudeDispatchSetup}>
            <article><span>1</span><p>In Cowork, select <strong>Dispatch</strong>.</p></article>
            <article><span>2</span><p>Sign in to the same account on your phone and computer, then pair the two apps.</p></article>
            <article><span>3</span><p>Choose which folders, connectors, and browser actions Claude can access.</p></article>
            <article><span>4</span><p>Turn on <strong>Keep computer awake</strong> for local tasks.</p></article>
          </div>
        </section>

        <section className={styles.claudeSection}>
          <SectionHeading number="5" tone="yellow" kicker="IMPORTANT LIMITATIONS" title="Know what keeps working" />
          <div className={styles.claudeDispatchLimits}>
            <article><span>!</span><p><strong>Local Dispatch tasks:</strong> Your computer needs to stay awake with Claude Desktop open. It is not running remotely on its own.</p></article>
            <article><span>↗</span><p><strong>Cloud-based Cowork sessions:</strong> Newer sessions can keep going while your computer is offline, but they lose access to local files once the Desktop app disconnects.</p></article>
          </div>
        </section>
      </div>

      <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}>
        <SectionHeading number="↳" tone="blue" kicker="SEE THE CONNECTION" title="From phone to desktop" />
        <StepGuide steps={DISPATCH_STEPS} label="Claude Dispatch screenshots" />
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="6" tone="purple" kicker="HOW TO PROMPT IT WELL" title="Give Claude a precise operating brief" />
        <p className={styles.claudeSectionCopy}>Name the exact folder, file, expected output, and restrictions.</p>
        <div className={styles.claudePromptCard}>
          <div><strong>Example Dispatch prompt</strong><button type="button" onClick={() => void copyPrompt(DISPATCH_PROMPT, "main")}>{copyLabel("main")}</button></div>
          <pre>{DISPATCH_PROMPT}</pre>
        </div>
        <p className={styles.claudeDispatchPromptReason}>This is stronger than “build a dashboard from my spreadsheet” because Claude knows exactly where to look and what it is allowed to touch.</p>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="7" tone="yellow" kicker="TRY IT YOURSELF" title="Run a low-risk first Dispatch task" />
        <div className={styles.claudeDispatchActivity}>
          <span>▣</span>
          <div>
            <h3>Create one folder and use one spreadsheet</h3>
            <p>Create a new folder, put one spreadsheet in it, and give Dispatch access to that folder only. Send the prompt from your phone, then check the result from your desktop once it reports back.</p>
            <div className={styles.claudePromptCard}>
              <div><strong>Your activity prompt</strong><button type="button" onClick={() => void copyPrompt(DISPATCH_ACTIVITY_PROMPT, "activity")}>{copyLabel("activity")}</button></div>
              <pre>{DISPATCH_ACTIVITY_PROMPT}</pre>
            </div>
          </div>
        </div>
      </section>

      <ClaudeCta
        count={count}
        workflowsHref={workflowsHref}
        heading="Use Dispatch for reports, dashboards, and file-based work"
        description="Practice with small, clearly scoped tasks before using it for sensitive or external actions."
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
          <div><span className={styles.claudeKicker}>1 · WHAT IT IS</span><h2>A dedicated workspace inside Claude</h2><p>A Project keeps files, instructions, and related chats together so the same context is available across the work instead of being rebuilt in every conversation.</p></div>
        </div>
        <aside className={styles.claudeComparisonNote}><span>What carries forward</span><strong>Project instructions, uploaded knowledge, relevant memory, and the chats connected to that work.</strong></aside>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="2" kicker="NORMAL CHAT VS PROJECT" title="Keep long-running work in one context" />
        <div className={styles.claudeCompare}>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWithout}`}><strong>NORMAL CHAT</strong><div><i>×</i><p>Files and instructions apply only to that conversation.</p></div><div><i>↻</i><p>New chats start without the same working context.</p></div></article>
          <span className={styles.claudeCompareArrow}>→</span>
          <article className={`${styles.claudeCompareCard} ${styles.claudeWith}`}><strong>PROJECT</strong><div><i>✓</i><p>Files and instructions are available to every Project chat.</p></div><div><i>✓</i><p>Related work and useful context build over time.</p></div></article>
        </div>
      </section>

      <div className={styles.claudeDetailGrid}>
        <section className={styles.claudeSection}>
          <SectionHeading number="3" tone="purple" kicker="FILES AND CONTEXT" title="Add the knowledge the work needs" />
          <p className={styles.claudeSectionCopy}>A Project can contain unlimited files. Each file can be up to 30 MB, and paid plans provide roughly a 200,000-token combined context window.</p>
          <div className={styles.claudeNoteBox}>When the Project grows beyond the available context, Claude automatically uses retrieval to find the most relevant snippets rather than loading every file in full.</div>
        </section>
        <section className={styles.claudeSection}>
          <SectionHeading number="4" tone="green" kicker="SHARING" title="Invite people without exposing every chat" />
          <p className={styles.claudeSectionCopy}>Team and Enterprise Projects can be shared with <strong>Can use</strong> or <strong>Can edit</strong> access. Project chats remain private unless someone explicitly shares a chat.</p>
        </section>
      </div>

      <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}>
        <SectionHeading number="5" tone="blue" kicker="SETUP WALKTHROUGH" title="Create a Project and give it working context" />
        <p className={styles.claudeSectionCopy}>Create and name the Project, add files or pasted text, save Project-level instructions, and start separate chats inside it. You can also move an existing chat into a Project when it belongs with the same work.</p>
        <StepGuide steps={PROJECT_STEPS} label="Claude Project steps" />
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="6" tone="yellow" kicker="PROJECT MEMORY" title="The workspace becomes more useful over time" />
        <div className={styles.claudeMemoryGrid}>
          <article><h3>Separate from other work</h3><p>Each Project has its own memory. It is not mixed with unrelated Projects or regular chats.</p></article>
          <article><h3>Review and correct it</h3><p>Open Project memory to inspect the purpose, context, and working principles Claude has built. Tell Claude what to remember, or edit and remove entries that are wrong.</p></article>
        </div>
      </section>

      <section className={styles.claudeSection}>
        <SectionHeading number="7" kicker="TRY IT YOURSELF" title="Build a meeting follow-up Project" />
        <p className={styles.claudeSectionCopy}>Use the first two meeting notes in the first run. Add the third later and run the same request in a new chat to see how the Project reuses its saved instructions with the latest context.</p>
        <div className={styles.claudeAssets}>
          <article><div><span>▤</span><div><h3>Meeting_Notes_1_June_6.docx</h3><p>Use in first run</p></div></div><span className={styles.claudeFileTag}>DOCX</span></article>
          <article><div><span>▤</span><div><h3>Meeting_Notes_2_June_8.docx</h3><p>Upload with the first file</p></div></div><span className={styles.claudeFileTag}>DOCX</span></article>
          <article><div><span>▤</span><div><h3>Meeting_Notes_3_June_12.docx</h3><p>Add later for the second run</p></div></div><span className={styles.claudeFileTag}>DOCX</span></article>
        </div>
        <div className={styles.claudeChecklist}>
          <article><span>1</span><div><strong>Create the Project</strong><p>Add the first two meeting notes and save the prompt below as Project instructions.</p></div></article>
          <article><span>2</span><div><strong>Run the first chat</strong><p>Start a new Project chat and ask: “Generate the two emails.”</p></div></article>
          <article><span>3</span><div><strong>Add the latest notes</strong><p>Upload Meeting_Notes_3_June_12.docx after reviewing the first result.</p></div></article>
          <article><span>4</span><div><strong>Run it again</strong><p>Start another new Project chat and ask the same question without pasting the instructions again.</p></div></article>
        </div>
        <div className={styles.claudePromptCard}>
          <div><strong>Project instructions to copy</strong><button type="button" onClick={copyPrompt}>{copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : "Copy prompt"}</button></div>
          <pre>{PROJECT_PROMPT}</pre>
        </div>
      </section>

      <ClaudeCta
        count={count}
        workflowsHref={workflowsHref}
        heading="Explore Claude Project workflows"
        description="Open guided workflows for keeping files, instructions, and related chats together in Projects."
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
      <Link href={workflowsHref}>
        Explore workflows →{typeof count === "number" ? ` (${count})` : ""}
      </Link>
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
      ) : slug === "scheduled-actions" ? (
        <ClaudeScheduledGuide count={count} workflowsHref={workflowsHref} />
      ) : slug === "ai-agents" ? (
        <ClaudeCoworkGuide count={count} workflowsHref={workflowsHref} />
      ) : slug === "coding-agents" ? (
        <ClaudeCodeGuide count={count} workflowsHref={workflowsHref} />
      ) : slug === "design" ? (
        <ClaudeDesignGuide count={count} workflowsHref={workflowsHref} />
      ) : (
        <ClaudeDispatchGuide count={count} workflowsHref={workflowsHref} />
      )}
    </main>
  );
}
