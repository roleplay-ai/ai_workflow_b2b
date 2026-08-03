"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./claude-reference.module.css";

type Kind = "skills" | "projects" | "vibe-coding";
type Props = { kind: Kind; count?: number; workflowsHref: string };
type Step = { title: string; description: string; helper: string; caption: string; src: string; alt: string; width: number; height: number };

const SKILL_STEPS: Step[] = [
  { title: "Find and add Skills", description: "Open the Skills list and use Add to create, write, or upload one.", helper: "Settings → Skills → Add", caption: "Open Claude Settings, select Skills, then use Add to create with Claude, write instructions, or upload a skill.", src: "/claude-guides/skills-step-1.png", alt: "Claude Settings Skills page with the Add menu open", width: 975, height: 736 },
  { title: "Invoke a saved Skill", description: "Type “/” in a chat and choose the skill you want Claude to load.", helper: "Chat composer → /", caption: "Type / in the composer and select a saved skill. Claude shows its description before you use it.", src: "/claude-guides/skills-step-2.png", alt: "Claude chat composer showing saved Skills", width: 727, height: 487 },
  { title: "Start skill-creator", description: "Invoke the built-in skill and describe the repeat task in plain language.", helper: "Chat composer → /skill-creator", caption: "Invoke /skill-creator, then describe the task, inputs, rules, and output you want the skill to repeat.", src: "/claude-guides/skills-step-3.png", alt: "Claude composer with skill-creator entered", width: 760, height: 303 },
  { title: "Enable file creation", description: "Turn on the capability before a skill runs scripts or produces files.", helper: "Settings → Capabilities", caption: "Turn on Code execution and file creation before using a skill that needs to run scripts or produce files.", src: "/claude-guides/skills-step-4.png", alt: "Claude Settings with file creation enabled", width: 979, height: 735 },
  { title: "Review the generated output", description: "Check the file and refine the skill when the result needs adjustment.", helper: "Chat → Generated file preview", caption: "Open the generated file, check it against the reference, and update the skill when the same issue should be prevented next time.", src: "/claude-guides/skills-step-5.png", alt: "Claude generated PowerPoint preview", width: 1848, height: 815 },
];

const PROJECT_STEPS: Step[] = [
  { title: "Create a Project", description: "Add the name, purpose and description.", helper: "Projects → New Project", caption: "Give the Project a clear name and describe what you want to achieve.", src: "/claude-guides/projects-step-1.png", alt: "Claude Create a Project dialog", width: 538, height: 369 },
  { title: "Set instructions", description: "Save the rules every Project chat should follow.", helper: "Project → Instructions", caption: "Save recurring rules once so every new Project chat follows them.", src: "/claude-guides/projects-step-2.png", alt: "Claude Project instructions dialog", width: 734, height: 524 },
  { title: "Add files", description: "Upload documents, paste text or connect a source.", helper: "Project → Files → +", caption: "Upload documents, paste text or connect supported sources from the Files menu.", src: "/claude-guides/projects-step-3.png", alt: "Claude Project files menu", width: 432, height: 369 },
  { title: "Work inside the Project", description: "Start new chats with the same setup available.", helper: "Project workspace", caption: "Start separate chats while the instructions and uploaded files remain available in the Project.", src: "/claude-guides/projects-step-4.png", alt: "Claude Project workspace", width: 1248, height: 674 },
  { title: "Review Project memory", description: "See the context Claude has built from Project activity.", helper: "Project → Memory", caption: "Review the purpose, context, and working principles built from past Project chats.", src: "/claude-guides/projects-step-5.png", alt: "Claude Project memory dialog", width: 776, height: 696 },
];

const ARTIFACT_STEPS: Step[] = [
  { title: "Find your Artifacts collection", description: "Open your published and reusable artifacts.", helper: "Claude → Artifacts", caption: "Published artifacts stay together for quick reuse.", src: "/claude-guides/artifacts-step-1.png", alt: "Claude Artifacts collection", width: 1128, height: 613 },
  { title: "Create a new artifact", description: "Use New artifact to start from chat or Cowork.", helper: "Artifacts → New artifact", caption: "Use New artifact to choose how you want to begin.", src: "/claude-guides/artifacts-step-2.png", alt: "Claude new Artifact options", width: 1218, height: 622 },
  { title: "Publish and copy the link", description: "Publish it to save or share a public link.", helper: "Publish → Copy link", caption: "Publishing creates a shareable link while keeping the chat private.", src: "/claude-guides/artifacts-step-3.png", alt: "Claude Artifact published dialog", width: 1132, height: 711 },
  { title: "Open the published artifact", description: "Open the published artifact in your browser.", helper: "Public artifact link", caption: "The published artifact opens independently in the browser.", src: "/claude-guides/artifacts-step-4.png", alt: "Published Claude Artifact", width: 1238, height: 760 },
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

const SKILL_PROMPT = `Use /skill-creator to build a reusable skill called sales-dashboard-generator.

The skill should accept an uploaded Excel sales dataset and use the supplied Sales_MIS_May2026.pptx file as the visual and structural reference. It must create an editable PowerPoint dashboard in the same four-slide format:

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

First build and test the skill using Sales Data - June 2026.xlsx with Sales_MIS_May2026.pptx as the reference. After the skill is saved, upload Sales_Dummy_Data_Test_Month (1).xlsx and run the skill again without re-explaining the dashboard format.`;

function Header({ kind }: { kind: Kind }) {
  const value = kind === "skills"
    ? { eyebrow: "Claude guide", title: "Claude Skills", subtitle: "Reusable instruction sets Claude loads to handle a specific task consistently across Claude.ai, Claude Code, and the API." }
    : kind === "projects"
      ? { eyebrow: "Claude workspace guide", title: "Claude Projects", subtitle: "Keep files, instructions and related chats together so the context is available across the work." }
      : { eyebrow: "Claude workspace guide", title: "Claude Artifacts", subtitle: "Create, edit, publish, and reuse substantial work beside your chat." };
  return <><Link href="/ask-ai?tool=claude" className={styles.backButton}>← Back</Link><header className={styles.titleRow}><div><p className={styles.eyebrow}>{value.eyebrow}</p><h1>{value.title}</h1><p className={styles.subtitle}>{value.subtitle}</p></div><span className={styles.toolChip}>Claude</span></header></>;
}

function Heading({ number, tone, kicker, title }: { number: string; tone: "orange" | "purple" | "green" | "blue"; kicker: string; title: string }) {
  return <div className={styles.sectionHeading}><span className={`${styles.number} ${styles[tone]}`}>{number}</span><div><p className={styles.kicker}>{kicker}</p><h2>{title}</h2></div></div>;
}

function Intro({ kind, title, text, noteLabel, note }: { kind: Kind; title: string; text: string; noteLabel: string; note: string }) {
  const icon = kind === "projects"
    ? <svg viewBox="0 0 24 24" fill="none"><path d="M4.5 6.5h5l1.5 2h8.5v9.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8"/><path d="M7.5 13h9M7.5 16h6" stroke="currentColor" strokeWidth="1.8"/></svg>
    : kind === "skills"
      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/></svg>
      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M8 8h8M8 12h5M8 16h7"/></svg>;
  return <section className={styles.intro}><div className={styles.introMain}><div className={styles.introIcon}>{icon}</div><div><p className={styles.kicker}>{kind === "projects" ? "Simple version" : kind === "skills" ? "What it is" : "01 · What it is"}</p><h2>{title}</h2><p>{text}</p></div></div><aside className={styles.comparisonNote}><p className={styles.kicker}>{noteLabel}</p><strong>{note}</strong></aside></section>;
}

function Walkthrough({ steps, label }: { steps: Step[]; label: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const step = steps[active];
  useEffect(() => {
    if (!zoomed) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setZoomed(false); };
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", close); document.body.style.overflow = ""; };
  }, [zoomed]);
  return <><div className={styles.guide}><div className={styles.tabs} role="tablist" aria-label={label}>{steps.map((item, index) => <button key={item.title} type="button" role="tab" aria-selected={index === active} className={`${styles.tab} ${index === active ? styles.tabActive : ""}`} onClick={() => setActive(index)}><span className={styles.tabNumber}>{index + 1}</span><span><span className={styles.tabTitle}>{item.title}</span><span className={styles.tabDescription}>{item.description}</span></span></button>)}</div><div className={styles.screenshotViewer} role="tabpanel"><div className={styles.screenshotToolbar}><div><strong>{step.title}</strong><span>{step.helper}</span></div><button className={styles.zoomButton} type="button" onClick={() => setZoomed(true)}>Zoom</button></div><button className={styles.screenshotButton} type="button" onClick={() => setZoomed(true)}><Image src={step.src} alt={step.alt} width={step.width} height={step.height} sizes="(max-width: 850px) 90vw, 760px"/></button><p className={styles.screenshotCaption}>{step.caption}</p></div></div>{zoomed ? <div className={styles.modal} role="dialog" aria-modal="true" onMouseDown={() => setZoomed(false)}><div className={styles.modalDialog} onMouseDown={(event) => event.stopPropagation()}><div className={styles.modalHeader}><strong>{step.title}</strong><button type="button" onClick={() => setZoomed(false)}>×</button></div><div className={styles.modalStage}><Image src={step.src} alt={step.alt} width={step.width} height={step.height} sizes="96vw"/></div></div></div> : null}</>;
}

function CopyButton({ text, label = "Copy prompt" }: { text: string; label?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() { try { await navigator.clipboard.writeText(text); setStatus("copied"); } catch { setStatus("failed"); } window.setTimeout(() => setStatus("idle"), 1600); }
  return <button className={styles.copyButton} type="button" onClick={() => void copy()}>{status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : label}</button>;
}

function Cta({ heading, text, href, count, anchor }: { heading: string; text: string; href: string; count?: number; anchor?: string }) {
  return <aside className={styles.cta}><div className={styles.ctaIcon}>→</div><div><p className={styles.kicker}>Recommended starting point</p><h2>{heading}</h2><p>{text}</p></div><Link href={anchor ?? href}>Explore workflows →{typeof count === "number" ? ` (${count})` : ""}</Link></aside>;
}

function SkillsGuide({ count, workflowsHref }: Omit<Props, "kind">) {
  return <main className={`${styles.page} ${styles.skillsPage}`}><Header kind="skills"/><Intro kind="skills" title="Save the instructions behind repeat work" text="Skills are reusable instruction sets Claude loads to handle a specific task consistently, formatting, brand rules, workflows, so you don't re-teach Claude the same thing every time. They work the same way across Claude.ai, Claude Code, and the API." noteLabel="Why it matters" note="Save formatting, brand rules, and workflows once, then reuse them whenever the same type of task comes up."/>
    <section className={styles.section}><Heading number="02" tone="orange" kicker="Prerequisite" title="Turn on code execution and file creation"/><div className={styles.prereqGrid}><div className={styles.pathCard}><div><strong>Settings &gt; Features</strong><span>Turn on code execution and file creation before using skills that run scripts or produce files.</span></div><div className={styles.toggle}/></div><div className={styles.warningCard}><span>!</span><p>Many skills run scripts or produce files. If these settings are off, Claude can read a skill&apos;s script but can&apos;t run it.</p></div></div></section>
    <div className={styles.detailGrid}><section className={styles.section}><Heading number="03" tone="purple" kicker="Inside a skill" title="What's written inside a skill"/><p className={styles.sectionLead}>A skill is a folder containing a <code>SKILL.md</code> file, plain instructions in YAML frontmatter plus body text that tells Claude when to use the skill and how to execute it. It can also include supporting scripts or reference files.</p><div className={styles.fileStructure}><div className={styles.fileHeader}><span>📁 example-skill</span><span className={styles.statusBadge}>Folder</span></div><div className={styles.fileBody}><div className={styles.fileRow}><strong>SKILL.md</strong><span>When to use the skill and how Claude should execute it.</span></div><div className={styles.fileRow}><strong>scripts/</strong><span>Optional code used to automate or generate outputs.</span></div><div className={styles.fileRow}><strong>references/</strong><span>Optional brand guides, templates, examples, or other source material.</span></div></div></div></section>
      <section className={styles.section}><Heading number="04" tone="blue" kicker="Create and maintain" title="Make or update a skill"/><div className={styles.miniStack}><article className={styles.miniAction}><span className={`${styles.actionIcon} ${styles.iconPurple}`}>+</span><div><h3>How to make one</h3><p>Use Claude&apos;s built-in skill-creator. Invoke it and describe what you want in plain language. It walks you through requirements and drafts the skill.</p></div></article><article className={styles.miniAction}><span className={`${styles.actionIcon} ${styles.iconBlue}`}>✎</span><div><h3>How to update one</h3><p>Open the skill under Customize &gt; Skills and edit it directly, or ask Claude in plain language. Review the proposed change before saving.</p></div></article></div></section></div>
    <section className={styles.section}><Heading number="06" tone="green" kicker="Use beyond your own account" title="Sharing, external skills, and recording"/><div className={styles.sourceGrid}><article className={styles.sourceCard}><span className={`${styles.sourceIcon} ${styles.iconGreen}`}>↗</span><div><h3>Sharing skills</h3><p>On Team and Enterprise plans, an org owner can enable sharing. Shared skills are view-only, and recipients receive updates automatically.</p></div></article><article className={styles.sourceCard}><span className={`${styles.sourceIcon} ${styles.iconOrange}`}>↓</span><div><h3>Downloading skills</h3><p>Skills use the open Agent Skills standard. Review downloaded instructions and scripts before enabling them, and never use hardcoded credentials.</p></div></article><article className={styles.sourceCard}><span className={`${styles.sourceIcon} ${styles.iconBlue}`}>●</span><div><h3>Recording a skill</h3><p>Record yourself completing a task and Claude can propose a skill. The video is not retained; only screenshots from the session are saved.</p></div></article></div></section>
    <section className={`${styles.section} ${styles.guideSection}`}><Heading number="UI" tone="blue" kicker="Where to find it" title="Claude Skills walkthrough"/><Walkthrough steps={SKILL_STEPS} label="Claude Skills screenshots"/></section>
    <section className={styles.section}><Heading number="09" tone="purple" kicker="Practice sequence" title="Four levels to try, in order"/><div className={styles.levelGrid}><article className={styles.levelCard}><span className={`${styles.levelNumber} ${styles.orange}`}>1</span><h3>Use a pre-built skill</h3><p>Try Theme Factory or the Learn skill, then compare the result with the same request without the skill.</p></article><article className={styles.levelCard}><span className={`${styles.levelNumber} ${styles.purple}`}>2</span><h3>Update a pre-built skill</h3><p>Take an existing design skill and update it into your company&apos;s brand skill using a real brand guide or deck.</p></article><article className={styles.levelCard}><span className={`${styles.levelNumber} ${styles.green}`}>3</span><h3>Use a partner skill</h3><p>Try a skill from an Anthropic partner, such as Canva, to extend Claude into the partner&apos;s tool.</p></article><article className={styles.levelCard}><span className={`${styles.levelNumber} ${styles.blue}`}>4</span><h3>Build your own</h3><p>Use skill-creator to build a skill that converts a data file into the same dashboard layout every time.</p></article></div></section>
    <section className={styles.section} id="team-activity"><Heading number="10" tone="green" kicker="Team activity" title="Build a repeatable sales dashboard skill"/><p className={styles.sectionLead}>Download the sample sales data and matching dashboard. Build the skill, then test it with a second dataset without re-explaining the format.</p><div className={styles.activitySteps}><div className={styles.activityStep}><strong>1</strong><span>Upload the June sales file and May dashboard reference.</span></div><div className={styles.activityStep}><strong>2</strong><span>Run the copy-ready skill-creator prompt and save the skill.</span></div><div className={styles.activityStep}><strong>3</strong><span>Upload the second dataset and generate the dashboard again.</span></div></div><div className={styles.teamGrid}><div className={styles.panel}><h3 className={styles.panelTitle}>Activity files</h3><div className={styles.downloadList}><Download name="Sales Data - June 2026.xlsx" note="Sample sales dataset" type="XLSX"/><Download name="Sales_MIS_May2026.pptx" note="Matching four-slide dashboard reference" type="PPTX"/><Download name="Sales_Dummy_Data_Test_Month (1).xlsx" note="Second dataset for testing the saved skill" type="XLSX"/></div></div><div className={styles.panel}><h3 className={styles.panelTitle}>Skill-creator prompt</h3><div className={styles.promptCard}><div className={styles.promptHeader}><strong>sales-dashboard-generator</strong><CopyButton text={SKILL_PROMPT}/></div><div className={styles.promptPreview}><p>The full prompt is ready to copy. It asks Claude to:</p><ul><li>Use the May deck as the exact four-slide dashboard reference.</li><li>Map changing Excel columns, normalise dates, and calculate missing revenue.</li><li>Generate an editable PPTX with recalculated metrics, rankings, and insights.</li><li>Test the saved skill on the second dataset without repeating the format.</li></ul></div></div></div></div></section>
    <Cta heading="Explore Claude Skills workflows" text="Start with the guided sales dashboard workflow and build a skill you can test immediately." href={workflowsHref} count={count}/></main>;
}

function Download({ name, note, type }: { name: string; note: string; type: "XLSX" | "PPTX" }) {
  return <div className={styles.downloadCard}><span className={`${styles.fileIcon} ${type === "PPTX" ? styles.pptIcon : ""}`}>{type}</span><div><strong>{name}</strong><span>{note}</span></div><a href={`/claude-guides/${name}`} download>Download</a></div>;
}

function ProjectsGuide({ count, workflowsHref }: Omit<Props, "kind">) {
  const [checks, setChecks] = useState([false, false, false, false]);
  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem("claude-projects-activity") ?? "null"); if (Array.isArray(saved)) setChecks(checks.map((_, i) => Boolean(saved[i]))); } catch {} }, []);
  function toggle(index: number) { setChecks((current) => { const next = current.map((value, i) => i === index ? !value : value); try { localStorage.setItem("claude-projects-activity", JSON.stringify(next)); } catch {} return next; }); }
  const done = checks.filter(Boolean).length;
  const activity = [
    ["Create the Project", "Add a name and description, then upload the June 6 and June 8 meeting notes."],
    ["Add project instructions", "Use the copy-ready instruction block below and save it at Project level."],
    ["Run the first chat", "Start a new chat inside the Project and ask: “Generate the two emails.”"],
    ["Update and repeat", "Upload the June 12 meeting notes, open another new chat and ask the same question again."],
  ];
  return <main className={`${styles.page} ${styles.projectsPage}`}><Header kind="projects"/><Intro kind="projects" title="A dedicated workspace inside Claude" text="It holds its own files, instructions and chats, so context carries forward instead of resetting each time." noteLabel="What changes" note="Upload material once, and every chat inside that Project can use it."/>
    <section className={styles.section}><Heading number="1" tone="orange" kicker="What it solves" title="Context can carry into new chats"/><div className={styles.comparison}><article className={`${styles.compareCard} ${styles.negative}`}><p className={styles.compareLabel}>Normal chats</p><div className={styles.compareRow}><span className={styles.miniIcon}>×</span><span>Context does not automatically carry into a new chat.</span></div><div className={styles.compareRow}><span className={styles.miniIcon}>↻</span><span>You may need to upload material or repeat instructions again.</span></div></article><div className={styles.arrow}>→</div><article className={`${styles.compareCard} ${styles.positive}`}><p className={styles.compareLabel}>Inside a Project</p><div className={styles.compareRow}><span className={styles.miniIcon}>✓</span><span>Files and project instructions are available across its chats.</span></div><div className={styles.compareRow}><span className={styles.miniIcon}>∞</span><span>Start a new chat without rebuilding the setup each time.</span></div></article></div></section>
    <div className={styles.detailGrid}><section className={styles.section}><Heading number="2" tone="purple" kicker="Knowledge base" title="File limits"/><div className={styles.compactCard}><span className={styles.meta}>Project files</span><h3>Unlimited files per project, not 10</h3><p>Each file can be up to 30MB. Combined content must fit within roughly 200,000 tokens on paid plans.</p></div></section><section className={styles.section}><Heading number="3" tone="green" kicker="When the library grows" title="Automatic RAG mode"/><div className={`${styles.compactCard} ${styles.compactGreen}`}><span className={styles.meta}>Automatic retrieval</span><h3>Claude searches the full Project library</h3><p>Once files exceed the 200,000-token limit, Claude retrieves only the relevant snippets for each prompt.</p></div></section></div>
    <section className={styles.section}><Heading number="4" tone="blue" kicker="Collaboration" title="Sharing and chat visibility"/><div className={styles.shareGrid}><article className={styles.shareCard}><span className={`${styles.shareIcon} ${styles.shareIconGreen}`}>↗</span><div><h3>Share on Team and Enterprise plans</h3><p>Give people <strong>Can use</strong> access to view and chat, or <strong>Can edit</strong> access to modify instructions and files.</p></div></article><article className={styles.shareCard}><span className={`${styles.shareIcon} ${styles.shareIconOrange}`}>✓</span><div><h3>Chats stay private by default</h3><p>Other people do not automatically see your chats. Share a specific chat manually when you want others to view it.</p></div></article></div></section>
    <section className={styles.section}><Heading number="5" tone="orange" kicker="Setting one up" title="Create the reusable setup once"/><div className={styles.setupSteps}><article className={styles.setupStep}><span>1</span><strong>Name the Project</strong><p>Create it with a clear name and description.</p></article><article className={styles.setupStep}><span>2</span><strong>Add knowledge</strong><p>Upload files or paste text into the knowledge base.</p></article><article className={styles.setupStep}><span>3</span><strong>Set instructions</strong><p>Add project-level instructions that apply to every chat inside it.</p></article></div><p className={styles.sectionCopy}>You can also move an existing chat into the Project anytime from the chat menu.</p></section>
    <section className={`${styles.section} ${styles.guideSection}`}><Heading number="6" tone="blue" kicker="Screenshot walkthrough" title="See where each part appears in Claude"/><Walkthrough steps={PROJECT_STEPS} label="Claude Projects screenshots"/></section>
    <section className={styles.section}><Heading number="7" tone="purple" kicker="Memory builds over time" title="Later chats can use more accumulated context"/><div className={styles.memoryBox}><span className={styles.memoryIcon}>◫</span><div><h3>The Project knowledge base grows as you add files and notes</h3><p>Later chats have more context available than earlier ones did.</p></div></div></section>
    <section className={styles.section} id="project-activity"><Heading number="8" tone="green" kicker="Try it yourself" title="Build a meeting follow-up Project"/><p className={styles.sectionLead}>Use the three meeting-note files below to see how the same Project setup can be reused as new transcripts are added.</p><div className={styles.fileCards}><ProjectFile name="Meeting_Notes_1_June_6.docx" note="Use in the first Project run."/><ProjectFile name="Meeting_Notes_2_June_8.docx" note="Upload with the first file."/><ProjectFile name="Meeting_Notes_3_June_12.docx" note="Add later for the second run."/></div><div className={styles.projectActivityGrid}>{activity.map(([title, text], index) => <label className={styles.checkStep} key={title}><input type="checkbox" checked={checks[index]} onChange={() => toggle(index)}/><span><strong>{title}</strong><p>{text}</p></span></label>)}</div><div className={`${styles.promptCard} ${styles.projectPrompt}`}><div className={styles.promptHeader}><div className={styles.promptTitle}><span>▤</span><div><strong>Meeting Follow-up Email Instructions</strong><span>Complete project-level prompt</span></div></div><CopyButton text={PROJECT_PROMPT}/></div><div className={styles.promptSummary}>Creates exactly two ready-to-send emails from the latest uploaded transcript, with strict word limits, formatting rules and safeguards for missing information.</div></div><div className={styles.quickCopy}><code>Generate the two emails.</code><CopyButton text="Generate the two emails." label="Copy request"/></div><div className={styles.progressWrap}><div className={styles.progressLabel}><span>Activity progress</span><strong>{done} of 4 complete</strong></div><div className={styles.progress}><span style={{ width: `${done * 25}%` }}/></div></div></section>
    <Cta heading="Explore Claude Projects workflows" text="Use the guided meeting follow-up workflow above to practise a reusable Project setup." href={workflowsHref} count={count}/></main>;
}

function ProjectFile({ name, note }: { name: string; note: string }) { return <article className={styles.projectFileCard}><div className={styles.fileCardTop}><span>▤</span><span className={styles.fileName}>{name}</span></div><span className={styles.fileType}>DOCX</span><div className={styles.fileNote}>{note}</div></article>; }

function ArtifactsGuide({ count, workflowsHref }: Omit<Props, "kind">) {
  return <main className={`${styles.page} ${styles.artifactsPage}`}><Header kind="vibe-coding"/><Intro kind="vibe-coding" title="A dedicated canvas for work you will reuse" text="Artifacts place substantial, self-contained work, such as documents, code, websites, or diagrams, in an editable window beside the chat." noteLabel="Closest comparison" note="Editable canvas with version history."/>
    <div className={styles.detailGrid}><section className={styles.section}><Heading number="02" tone="orange" kicker="Creation logic" title="When Claude creates one"/><p className={styles.sectionCopy}>Claude creates one for substantial, self-contained output, often 15+ lines: documents, code, HTML, SVGs, diagrams, or React.</p></section><section className={styles.section}><Heading number="03" tone="purple" kicker="Setup" title="Turning it on"/><div className={styles.sectionCopy}><p>Enable both capabilities below.</p><div className={styles.capabilityBox}><div className={styles.capabilityHeader}><span>Required capability</span><span>Code execution + file creation</span></div><div className={styles.capabilityRows}><div className={styles.capabilityRow}><strong>Free, Pro, Max</strong><span>Settings &gt; Capabilities</span></div><div className={styles.capabilityRow}><strong>Team, Enterprise</strong><span>Organization settings &gt; Capabilities</span></div></div></div></div></section></div>
    <section className={styles.section}><Heading number="04" tone="green" kicker="Edit and iterate" title="Working with an artifact"/><div className={styles.compactList}><div className={styles.compactRow}><span className={styles.compactRowIcon}>1</span><div><strong>Modify it directly</strong><span>Ask Claude to change it; updates appear in the artifact window.</span></div></div><div className={styles.compactRow}><span className={styles.compactRowIcon}>2</span><div><strong>Edit a selected section</strong><span>Highlight text in Markdown, then choose “Edit with Claude.”</span></div></div><div className={styles.compactRow}><span className={styles.compactRowIcon}>3</span><div><strong>Move between versions</strong><span>Use the version selector or switch between multiple artifacts in the chat.</span></div></div></div></section>
    <div className={styles.twoInfoGrid}><section className={styles.section}><Heading number="05" tone="blue" kicker="Use outside Claude" title="Viewing and exporting"/><p className={styles.sectionCopy}>View the code, copy it, or download the file.</p></section><section className={styles.section}><Heading number="06" tone="orange" kicker="Build with Claude" title="AI-powered artifacts"/><p className={styles.sectionCopy}>Build Claude-powered chat, coaching, or Q&amp;A apps. Users sign in and use their own limits. Sharing is free.</p></section></div>
    <section className={`${styles.section} ${styles.guideSection}`}><Heading number="07" tone="purple" kicker="Keep and share" title="Publishing and access"/><p className={styles.sectionCopy}>Click “Publish” to save an artifact in the Artifacts section for reuse or sharing.</p><Walkthrough steps={ARTIFACT_STEPS} label="Claude Artifacts walkthrough"/></section>
    <section className={styles.section}><Heading number="08" tone="blue" kicker="Regular vs Cowork" title="How live artifacts (Cowork) differ"/><p className={styles.sectionCopy}>Live artifacts are desktop-only and created in Claude Cowork.</p><div className={styles.artifactComparison}><div className={styles.comparisonHeader}><div>Artifacts</div><div>Live artifacts (Cowork)</div></div><div className={styles.comparisonBody}><div className={styles.comparisonColumn}><ul><li>Created in chat, then publish, copy, or download.</li></ul></div><div className={styles.comparisonColumn}><ul><li><strong>Independent.</strong> Saved in the Live artifacts tab.</li><li><strong>Current.</strong> Refreshes from apps and local files.</li><li><strong>Versioned.</strong> Compare or restore saved versions.</li><li><strong>Local.</strong> Stays on the original computer.</li><li><strong>Org-only.</strong> Team/Enterprise only; Pro/Max cannot share. Viewers use their own data.</li></ul></div></div></div></section>
    <section className={styles.section}><Heading number="09" tone="green" kicker="Hands-on activity" title="Try it yourself: build your own website"/><div className={styles.sectionCopy}><p>Save your LinkedIn profile as a PDF, upload it, enable both capabilities, and paste the prompt.</p><div className={`${styles.promptCard} ${styles.artifactPrompt}`}><div className={styles.promptHeader}><strong>Personal website prompt</strong><CopyButton text={ARTIFACT_PROMPT}/></div><pre>{ARTIFACT_PROMPT}</pre></div><p className={styles.finalNote}>Iterate in the same chat, then download or publish the HTML.</p></div></section>
    <Cta heading="Explore Artifacts workflows" text={typeof count === "number" && count === 0 ? "No workflows supplied." : "Open guided Artifacts workflows."} href={workflowsHref} count={count}/></main>;
}

export default function ClaudeReferenceGuides({ kind, count, workflowsHref }: Props) {
  if (kind === "skills") return <SkillsGuide count={count} workflowsHref={workflowsHref}/>;
  if (kind === "projects") return <ProjectsGuide count={count} workflowsHref={workflowsHref}/>;
  return <ArtifactsGuide count={count} workflowsHref={workflowsHref}/>;
}
