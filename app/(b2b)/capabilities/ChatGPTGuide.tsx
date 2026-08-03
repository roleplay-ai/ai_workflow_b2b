"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./capabilities.module.css";

export type ChatGPTGuideKind =
  | "skills"
  | "projects"
  | "work"
  | "codex"
  | "images"
  | "sites"
  | "scheduled"
  | "custom-gpts"
  | "insider";

type Props = {
  kind: ChatGPTGuideKind;
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

const STEPS: Record<ChatGPTGuideKind, GuideStep[]> = {
  skills: [
    { title: "Open the Skills area", helper: "Plugins → Skills", description: "View installed skills and access skill creation options.", caption: "The Skills area shows installed skills and gives you access to creation and management options.", src: "/chatgpt-guides/skills-1.png", alt: "ChatGPT Skills page showing installed skills including Skill Creator and Skill Installer", width: 1089, height: 592 },
    { title: "Create a Skill in conversation", tabTitle: "Use Skill Creator", helper: "Chat → Skill Creator", description: "Call the creator directly in a normal ChatGPT conversation.", caption: "Call Skill Creator and describe the task you want to turn into a reusable workflow.", src: "/chatgpt-guides/skills-2.png", alt: "ChatGPT conversation with Skill Creator selected and a request to create a skill", width: 720, height: 274 },
    { title: "Use an installed Skill", tabTitle: "Call an installed Skill", helper: "Chat composer → Skills", description: "Select the saved skill and give it the input to assess.", caption: "Select the installed Skill in the composer, then provide the file or raw input it should process.", src: "/chatgpt-guides/skills-3.png", alt: "ChatGPT composer showing the installed NudgeCheck skill selected alongside uploaded files", width: 794, height: 349 },
  ],
  projects: [
    { title: "Create a new project", tabTitle: "Create the project", helper: "Projects → New project", description: "Name the workspace and choose its memory mode.", caption: "Name the project and choose default or project-only memory before creating it.", src: "/chatgpt-guides/projects-1.png", alt: "ChatGPT Create project dialog with a project name field and memory selection", width: 482, height: 261 },
    { title: "Set project instructions", tabTitle: "Add project instructions", helper: "Project → More menu → Project settings", description: "Define how ChatGPT should respond inside this project.", caption: "Add instructions that apply to every chat in the project. This screen also shows memory and library access settings.", src: "/chatgpt-guides/projects-2.png", alt: "ChatGPT Project settings panel showing project instructions, memory, and library access", width: 466, height: 535 },
    { title: "Add project sources", tabTitle: "Upload project sources", helper: "Project → Sources → Add sources", description: "Keep the reference files together in the Sources tab.", caption: "Upload the files that should remain available as shared reference material across chats in the project.", src: "/chatgpt-guides/projects-3.png", alt: "ChatGPT project Sources tab showing several uploaded documents and a PDF", width: 733, height: 551 },
  ],
  work: [
    { title: "Open ChatGPT Work", tabTitle: "Open Work", helper: "ChatGPT → Work", description: "Switch from Chat to Work and describe the outcome.", caption: "Select Work, then describe what you want completed. You can choose a Project or approved plugins before starting.", src: "/chatgpt-guides/work-1.png", alt: "ChatGPT Work start screen with the Work tab selected, a prompt box, Project selector and plugin options", width: 826, height: 563 },
    { title: "Choose where Work runs", tabTitle: "Choose where it runs", helper: "Work → Run this chat", description: "Run the task on your computer or in the cloud.", caption: "Choose On my computer for local files and apps, or In the cloud when the task should continue away from your laptop.", src: "/chatgpt-guides/work-2.png", alt: "ChatGPT Work menu showing options to run a chat on the computer or in the cloud", width: 802, height: 670 },
    { title: "Add files, Projects and plugins", tabTitle: "Add sources and tools", helper: "Work → Add", description: "Attach files, folders, Projects or approved plugins.", caption: "Use the add menu to provide files and folders, attach Chrome, start inside a Project, set a goal or choose a supported creation tool.", src: "/chatgpt-guides/work-3.png", alt: "ChatGPT Work add menu showing files and folders, Google Chrome, Projects, goals and supported plugins", width: 682, height: 491 },
    { title: "Review the completed work", tabTitle: "Review the result", helper: "Work chat → Result", description: "See what Work changed and which sources it used.", caption: "Work reports what it changed and keeps the relevant outputs and sources visible for review.", src: "/chatgpt-guides/work-4.png", alt: "ChatGPT Work result showing renamed travel receipt files with outputs and source files listed", width: 1094, height: 412 },
    { title: "Confirm local file changes", tabTitle: "Check local changes", helper: "Desktop app → Local folder", description: "Confirm the finished changes on your computer.", caption: "When Work runs locally, review the updated files on your computer before moving or sharing them.", src: "/chatgpt-guides/work-5.png", alt: "Computer file browser showing travel receipt PDF files renamed by transport type and date", width: 549, height: 361 },
  ],
  codex: [
    { title: "Start from the Codex workspace", tabTitle: "Select your project", helper: "Codex → Select project → Enter task", description: "Choose a local folder, then describe what you want Codex to build or change.", caption: "Choose a project folder, confirm the working branch if needed, then enter one clear outcome in the task box.", src: "/chatgpt-guides/codex-1.png", alt: "Codex workspace showing project selection, build options and the task input area", width: 816, height: 591 },
    { title: "Follow Codex while it works", tabTitle: "Follow the work", helper: "Project chat → Live progress", description: "See the files, images and commands Codex is using while it builds.", caption: "Codex shows the tools it has used, the files it has changed and what it is doing next. You can respond or change direction from the same task box.", src: "/chatgpt-guides/codex-2.png", alt: "Codex project chat showing live progress while building a travel details prototype", width: 1121, height: 818 },
    { title: "Review the working preview", tabTitle: "Review the result", helper: "Project chat → Preview", description: "Open the preview beside the task and check the finished experience.", caption: "Open the result beside the conversation to review the finished interface and test its important features.", src: "/chatgpt-guides/codex-3.png", alt: "Codex project chat beside a working preview of a travel ledger dashboard", width: 1553, height: 949 },
  ],
  images: [
    { title: "Describe the image you need", tabTitle: "Describe the image", helper: "Chat → Create image", description: "Enter the subject, setting, style, composition and constraints.", caption: "Include the subject, setting, style and composition in one clear prompt before generating the first version.", src: "/chatgpt-guides/images-1.png", alt: "ChatGPT prompt composer showing a detailed prompt for creating a realistic photograph of Indian professionals collaborating around a laptop", width: 702, height: 378 },
    { title: "Review and request edits", tabTitle: "Review and refine", helper: "Generated image → Add edits", description: "Open the result and request precise changes in the edit box.", caption: "Open the generated image, select an area when needed and describe the exact change in the edit box.", src: "/chatgpt-guides/images-2.png", alt: "ChatGPT image editor showing a realistic office collaboration image with a field for additional edits", width: 1114, height: 769 },
    { title: "Share or download the result", tabTitle: "Share or save", helper: "Generated image → Share", description: "Open Share to copy a link, post or download the image.", caption: "Use the share controls to copy a link, post the image or download it to your device.", src: "/chatgpt-guides/images-3.png", alt: "ChatGPT image share panel with copy link, social sharing and download controls", width: 610, height: 533 },
  ],
  sites: [
    { title: "Select @Sites", helper: "ChatGPT Work → @Sites", description: "Start in ChatGPT Work and call Sites from the prompt box.", caption: "Type @Sites in the prompt box, then describe what you want the Site to contain.", src: "/chatgpt-guides/sites-1.png", alt: "ChatGPT Work prompt box with Sites selected using the @Sites mention", width: 836, height: 550 },
    { title: "Review the generated preview", helper: "ChatGPT Work → Site preview", description: "Review the Site beside the chat and request changes.", caption: "Review the generated Site beside the chat and ask ChatGPT to make changes before publishing.", src: "/chatgpt-guides/sites-2.png", alt: "ChatGPT Work showing a generated Action Engine Site preview beside the chat panel", width: 1094, height: 756 },
    { title: "Choose how to share", tabTitle: "Open the Share menu", helper: "Site preview → Share", description: "Choose whether the Site stays private or is available online.", caption: "Use the Share menu to keep the Site private or make it available to anyone on the internet.", src: "/chatgpt-guides/sites-3.png", alt: "ChatGPT Sites Share menu showing Just me and Anyone on the Internet options", width: 435, height: 336 },
    { title: "Find the published URL", helper: "ChatGPT → Sites", description: "Published Sites appear in the Sites list with their URL.", caption: "Published Sites appear in the Sites list, with the working URL shown beneath each Site name.", src: "/chatgpt-guides/sites-4.png", alt: "ChatGPT Sites list showing published Sites and their working URLs", width: 1112, height: 491 },
  ],
  scheduled: [
    { title: "Open the Scheduled page", tabTitle: "Open Scheduled", helper: "Sidebar → Scheduled", description: "Use the sidebar to view suggested tasks and manage existing ones.", caption: "Ask ChatGPT directly to schedule a task, or open Scheduled from the sidebar. This page shows suggested tasks and provides one place to search and manage them.", src: "/chatgpt-guides/scheduled-1.png", alt: "ChatGPT desktop app with Scheduled selected in the sidebar and the Scheduled Tasks page open", width: 1164, height: 681 },
    { title: "Configure a scheduled task", tabTitle: "Configure a task", helper: "Scheduled → Create", description: "Set where it runs, the project, model, frequency and notifications.", caption: "Name the task, describe the work, choose where it runs, then set the frequency, time and notification preference before selecting Create.", src: "/chatgpt-guides/scheduled-2.png", alt: "ChatGPT Scheduled Tasks creation panel showing a CV Tracker task with project, model, reasoning, daily frequency and notification settings", width: 881, height: 657 },
  ],
  "custom-gpts": [
    { title: "Find GPTs", helper: "More → GPTs", description: "Open More, then select GPTs.", caption: "Open More in the ChatGPT sidebar, then select GPTs to reach the GPT area.", src: "/chatgpt-guides/custom-gpts-1.png", alt: "ChatGPT sidebar with the More menu open and GPTs highlighted", width: 474, height: 304 },
    { title: "Configure your assistant", helper: "GPT Builder → Configure", description: "Add its name, instructions, starters and knowledge.", caption: "Add the GPT's name, description, instructions and conversation starters. Upload the handbook under Knowledge.", src: "/chatgpt-guides/custom-gpts-2.png", alt: "ChatGPT GPT Builder Configure screen showing a Work Policy Assistant with instructions, conversation starters and an employee handbook knowledge file", width: 1246, height: 821 },
    { title: "Choose who can use it", helper: "Share → Access", description: "Select the sharing option that fits your use case.", caption: "Use the Share menu to keep the GPT private, share it by link, or publish it to the GPT Store.", src: "/chatgpt-guides/custom-gpts-3.png", alt: "Share GPT dialog showing Only me, Anyone with the link and GPT Store sharing options", width: 429, height: 364 },
    { title: "Use the finished GPT", helper: "Open GPT", description: "Open it and start with a suggested question.", caption: "The finished GPT opens as its own named assistant with the description and conversation starters you configured.", src: "/chatgpt-guides/custom-gpts-4.png", alt: "Finished Work Policy Assistant Custom GPT with four suggested employee policy questions", width: 846, height: 667 },
  ],
  insider: [
    { title: "Choose intelligence and model", tabTitle: "Choose intelligence", helper: "Composer → Intelligence menu", description: "Open the model menu to select reasoning level and model.", caption: "Open the intelligence menu to choose Instant, Medium or High, then open the model submenu when it is available.", src: "/chatgpt-guides/insider-1.png", alt: "ChatGPT model menu showing intelligence levels and GPT model choices", width: 348, height: 360 },
    { title: "Open a temporary Side Chat", tabTitle: "Open Side Chat", helper: "Type /side in a running chat", description: "Use /side to create a parallel conversation.", caption: "The original conversation remains on the left while a temporary Side Chat opens beside it.", src: "/chatgpt-guides/insider-2.png", alt: "ChatGPT desktop app showing a running conversation and a Side Chat panel", width: 1044, height: 667 },
    { title: "Pick or create a Pet", tabTitle: "Select a Pet", helper: "Settings → Pets", description: "Choose a built-in companion or create your own.", caption: "Select a built-in Pet, wake the selected companion or use Create to make a custom one.", src: "/chatgpt-guides/insider-3.png", alt: "ChatGPT Pets settings showing a list of built-in companion characters", width: 820, height: 584 },
    { title: "Use ChatGPT Voice", tabTitle: "Start Voice", helper: "Desktop app → Work or Codex → Voice", description: "Use live voice to coordinate Work or Codex.", caption: "Start Voice mode to speak naturally and coordinate longer-running tasks.", src: "/chatgpt-guides/insider-4.png", alt: "ChatGPT Voice interface with the live voice orb and message composer", width: 763, height: 599 },
  ],
};

const HEADERS: Record<ChatGPTGuideKind, { eyebrow: string; title: string; subtitle: string }> = {
  skills: { eyebrow: "CHATGPT FEATURE GUIDE", title: "ChatGPT Skills", subtitle: "Save a repeatable workflow once, then apply it inside your normal ChatGPT conversations." },
  projects: { eyebrow: "AI WORKSPACE", title: "ChatGPT Projects", subtitle: "Keep related chats, files, and instructions together so ongoing work carries its context from one chat to the next." },
  work: { eyebrow: "AI PRACTICE LAB · PRODUCT GUIDE", title: "ChatGPT Work", subtitle: "Give ChatGPT an outcome and let it work through the steps, information and files needed to create a finished result." },
  codex: { eyebrow: "AI BUILDING GUIDE", title: "Codex", subtitle: "Build and change websites, apps, dashboards and automations using plain language." },
  images: { eyebrow: "IMAGE GENERATION", title: "ChatGPT Images: How to Get Better Results", subtitle: "Create new images, edit existing ones and improve results through clearer prompts." },
  sites: { eyebrow: "CHATGPT WORK", title: "ChatGPT Sites", subtitle: "Create, review, publish and update websites or lightweight web apps inside ChatGPT." },
  scheduled: { eyebrow: "PRODUCT GUIDE", title: "ChatGPT Scheduled Tasks", subtitle: "Let ChatGPT run work later, repeat it on a schedule, or check for meaningful changes." },
  "custom-gpts": { eyebrow: "AI PRACTICE LAB · PRODUCT GUIDE", title: "Custom GPTs", subtitle: "Build a reusable ChatGPT assistant with its own instructions, knowledge and tools." },
  insider: { eyebrow: "CHATGPT GUIDE", title: "Useful features most people miss", subtitle: "Choose the right level of intelligence, follow long-running work and turn repeated processes into reusable workflows." },
};

function GuideHeading({ number, tone, kicker, title }: { number: string; tone?: "purple" | "green" | "blue" | "yellow"; kicker: string; title: string }) {
  const toneClass = tone ? styles[`claudeNumber${tone[0].toUpperCase()}${tone.slice(1)}`] : "";
  return <div className={styles.claudeSectionHead}><span className={`${styles.claudeSectionNumber} ${toneClass}`}>{number}</span><div><span className={styles.claudeKicker}>{kicker}</span><h2>{title}</h2></div></div>;
}

function StepGuide({ steps, label }: { steps: GuideStep[]; label: string }) {
  const [activeStep, setActiveStep] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const step = steps[activeStep];
  useEffect(() => {
    if (!zoomed) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setZoomed(false); };
    document.addEventListener("keydown", onKeyDown); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = ""; };
  }, [zoomed]);
  return <>
    <div className={styles.claudeGuide}>
      <div className={styles.claudeGuideTabs} role="tablist" aria-label={label}>{steps.map((item, index) => <button className={index === activeStep ? styles.claudeGuideTabActive : styles.claudeGuideTab} key={item.title} type="button" role="tab" aria-selected={index === activeStep} onClick={() => setActiveStep(index)}><span>{index + 1}</span><div><strong>{item.tabTitle ?? item.title}</strong><p>{item.description}</p></div></button>)}</div>
      <div className={styles.claudeScreenshotViewer} role="tabpanel" aria-live="polite"><div className={styles.claudeScreenshotToolbar}><div><strong>{step.title}</strong><span>{step.helper}</span></div><button type="button" onClick={() => setZoomed(true)}>Zoom</button></div><button className={styles.claudeScreenshotButton} type="button" onClick={() => setZoomed(true)} aria-label={`Zoom screenshot: ${step.title}`}><Image key={step.src} className={styles.claudeScreenshotImage} src={step.src} alt={step.alt} width={step.width} height={step.height} sizes="(max-width: 760px) 92vw, 760px" /></button><p className={styles.claudeScreenshotCaption}>{step.caption}</p></div>
    </div>
    {zoomed ? <div className={styles.claudeImageModal} role="dialog" aria-modal="true" aria-label={step.title} onMouseDown={() => setZoomed(false)}><div className={styles.claudeImageModalDialog} onMouseDown={(event) => event.stopPropagation()}><div className={styles.claudeImageModalHead}><strong>{step.title}</strong><button type="button" onClick={() => setZoomed(false)} aria-label="Close enlarged screenshot">×</button></div><div className={styles.claudeImageModalStage}><Image src={step.src} alt={step.alt} width={step.width} height={step.height} sizes="96vw" /></div></div></div> : null}
  </>;
}

function CopyPrompt({ title, prompt, compact = false }: { title: string; prompt: string; compact?: boolean }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() { try { await navigator.clipboard.writeText(prompt); setStatus("copied"); } catch { setStatus("failed"); } window.setTimeout(() => setStatus("idle"), 1800); }
  return <div className={`${styles.claudePromptCard} ${compact ? styles.chatgptPromptCompact : ""}`}><div><strong>{title}</strong><button type="button" onClick={() => void copy()}>{status === "copied" ? "Copied" : status === "failed" ? "Select and copy" : "Copy prompt"}</button></div><pre>{prompt}</pre></div>;
}

function Header({ kind }: { kind: ChatGPTGuideKind }) {
  const header = HEADERS[kind];
  return <><Link href="/ask-ai?tool=chatgpt" className={styles.claudeBack}>← Back</Link><header className={styles.claudeTitleRow}><div><p className={styles.claudeEyebrow}>{header.eyebrow}</p><h1>{header.title}</h1><p className={styles.claudeSubtitle}>{header.subtitle}</p></div><span className={styles.claudeToolChip}>ChatGPT</span></header></>;
}

function Cta({ count, workflowsHref, heading, description }: Pick<Props, "count" | "workflowsHref"> & { heading: string; description: string }) {
  return <section className={styles.claudeCta}><span>→</span><div><small>RECOMMENDED STARTING POINT</small><h3>{heading}</h3><p>{description}</p></div><Link href={workflowsHref}>Explore workflows →{typeof count === "number" ? ` (${count})` : ""}</Link></section>;
}

const SKILL_SETUP_PROMPT = "Help me create a Skill called 'Weekly Status Report'. Inputs: my raw notes for the week. Output: a weekly status report with a one-line TL;DR, four fixed sections, a 150-word limit, bullet points, a professional tone, and flagged risks with owners.";
const SKILL_TRY_PROMPT = "Create a skill called 'Meeting Notes Cleanup'. Input: my raw, messy meeting notes. Output: Decisions Made, Action Items with owner, and Open Questions. Under 100 words, bullet points only.";
const PROJECT_PROMPT = "You're writing Instagram captions for Northwind Coffee Co. Match the tone and rules in the brand voice guide exactly. Use only real product names and prices from the menu file — never invent details. Match the sentence rhythm and dry, understated style shown in the past captions file. Every caption must be under 150 characters, no hashtags.";
const SCHEDULED_BRIEF_PROMPT = "Every weekday at 8:15 AM, review today’s calendar, important emails from the previous 24 hours and messages that mention me. Create a brief with my five highest-priority actions, upcoming deadlines and meetings that need preparation. Include links to the source information. Do not send messages or change my calendar.";
const SCHEDULED_PRACTICE_PROMPT = "Every weekday at 5:30 PM, review my calendar for tomorrow and recent email conversations related to those meetings. Create a short preparation list containing the meeting purpose, important background, open questions and anything I need to complete beforehand. Do not send emails or modify calendar events.";

function SkillsGuide({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  return <>
    <section className={styles.claudeIntro}><div className={styles.claudeIntroCopy}><span className={styles.claudeIntroIcon}>✦</span><div><span className={styles.claudeKicker}>SIMPLE VERSION</span><h2>A saved workflow ChatGPT can reuse automatically</h2><p>A Skill combines prompts, steps, rules, and examples. Once installed, ChatGPT applies it when it recognizes the matching task.</p></div></div><aside className={styles.claudeComparisonNote}><span>Skill vs Custom GPT</span><strong>A Custom GPT is a separate assistant you open. A Skill stays attached to your main ChatGPT and works inside a normal chat.</strong></aside></section>

    <section className={styles.claudeSection}><GuideHeading number="1" kicker="THE CONCEPT" title="What it is" /><ul className={styles.chatgptFeatureList}><li><span>✓</span><p>A saved, reusable workflow made from prompts, steps, rules, and examples.</p></li><li><span>✓</span><p>Once installed, ChatGPT automatically applies it when it recognizes the matching task.</p></li><li><span>✓</span><p>Unlike a Custom GPT, a Skill stays attached to your main ChatGPT and applies inside your normal chat.</p></li></ul></section>

    <section className={styles.claudeSection}><GuideHeading number="2" tone="purple" kicker="WHY IT MATTERS" title="What it solves" /><div className={styles.claudeCompare}><article className={`${styles.claudeCompareCard} ${styles.claudeWithout}`}><strong>WITHOUT A SKILL</strong><div><i>↻</i><p>Retype or paste the same detailed instructions every time.</p></div><div><i>▤</i><p>Repeat the format, tone, word limit, and checklist.</p></div></article><span className={styles.claudeCompareArrow}>→</span><article className={`${styles.claudeCompareCard} ${styles.claudeWith}`}><strong>WITH A SKILL</strong><div><i>✓</i><p>Give ChatGPT the raw input once the workflow is installed.</p></div><div><i>⚙</i><p>It applies the saved steps, rules, and format automatically.</p></div></article></div></section>

    <section className={styles.claudeSection}><GuideHeading number="3" tone="green" kicker="SKILL STRUCTURE" title="What goes into a Skill" /><div className={styles.chatgptFiveGrid}>{[["When to use it","The task types or triggers that should activate it"],["Inputs","What you'll provide, such as raw notes"],["Steps","The ordered instructions ChatGPT follows"],["Rules","Formatting, tone, and structural constraints"],["Examples","A sample input and the ideal output"]].map(([heading,body], index) => <article key={heading}><span>{index + 1}</span><div><strong>{heading}</strong><p>{body}</p></div></article>)}</div><CopyPrompt title="Example: Weekly Status Report setup prompt" prompt={SKILL_SETUP_PROMPT} /><div className={styles.chatgptExamplePair}><article><h3>Weekly input</h3><p>Finished login redesign; started API integration with vendor X; blocked on production database access, waiting on Priya; next week: finish integration and start performance tests.</p></article><article><h3>What happens next</h3><p>ChatGPT turns the notes into the formatted report, includes the TL;DR, stays under 150 words, and flags risks and owners.</p></article></div></section>

    <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}><GuideHeading number="4" tone="blue" kicker="CREATE, EDIT AND SHARE" title="Where to find and set it up" /><div className={styles.chatgptSetupGrid}>{[["💬","In conversation","Tell ChatGPT “Create a skill for [task]”. It asks about inputs, steps, and format, then offers to install the skill."],["✎","Skills editor","Profile icon → Skills → New skill → Create with editor. Define its triggers, inputs, steps, examples, and resources."],["↑","Upload a file","Upload a .skill.md file from Profile icon → Skills → New skill."],["●","Record & Replay","On Mac desktop, record a stable workflow and refine the drafted Skill."],["↻","Editing a Skill","Open the Skill menu, choose Edit, update its instructions or resources, and save."],["↗","Sharing a Skill","Choose Share with workspace so colleagues can install it from Team Skills."]].map(([icon,heading,body]) => <article key={heading}><span>{icon}</span><div><h3>{heading}</h3><p>{body}</p></div></article>)}</div><StepGuide steps={STEPS.skills} label="ChatGPT Skills screenshots" /></section>

    <div className={styles.claudeDetailGrid}><section className={styles.claudeSection}><GuideHeading number="5" tone="green" kicker="USEFUL WHEN REPEATED" title="Strengths" /><ul className={styles.chatgptFeatureList}><li><span>✓</span><p><strong>Consistency</strong> — the same steps, rules, and format are applied every time.</p></li><li><span>✓</span><p>Reusable across chats and projects once installed.</p></li><li><span>✓</span><p><strong>Team alignment</strong> — shared Skills enforce the same SOPs and formats.</p></li><li><span>✓</span><p><strong>Composable</strong> — multiple Skills can work together in one session.</p></li></ul></section><section className={styles.claudeSection}><GuideHeading number="6" tone="yellow" kicker="WHAT TO REVIEW" title="Limitations" /><ul className={`${styles.chatgptFeatureList} ${styles.chatgptWarningList}`}><li><span>!</span><p>A Skill does not update itself. Edit it when the report template or process changes.</p></li><li><span>!</span><p>It can follow the format but cannot judge whether the underlying content is accurate. Review before sending.</p></li></ul></section></div>

    <section className={styles.claudeSection}><GuideHeading number="7" tone="purple" kicker="WHERE IT FITS" title="Good candidates for a Skill" /><div className={styles.chatgptCardGrid}>{[["Recurring documents","Weekly reports, project charters, proposals, meeting notes"],["Content pipelines","Outline → draft → check → post"],["Code and data","Code reviews, test generation, standard SQL queries"],["Research","Literature reviews and competitor summaries with a fixed structure"],["SOPs","Onboarding checklists, incident response, ticket triage"]].map(([h,p]) => <article key={h}><h3>{h}</h3><p>{p}</p></article>)}</div></section>

    <section className={styles.chatgptTryCard}><span className={styles.claudeTryIcon}>→</span><div><span className={styles.claudeKicker}>8 · PRACTICE TASK</span><h2>Try it yourself</h2><p>Create a Skill for cleaning up rough meeting notes. Once installed, paste a few made-up notes and see whether it applies the format without restating the rules.</p><CopyPrompt title="Meeting Notes Cleanup prompt" prompt={SKILL_TRY_PROMPT} compact /></div></section>
    <Cta count={count} workflowsHref={workflowsHref} heading="Explore ChatGPT Skills workflows" description="Open guided examples for creating and using repeatable Skills." />
  </>;
}

function ProjectsGuide({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  const downloads = [
    ["Brand voice guide", "Tone, audience, and writing rules", "1_brand_voice_guide.txt"],
    ["Current product menu", "Real products, prices, and launch details", "2_product_menu.txt"],
    ["Past caption examples", "Sentence rhythm and understated style", "3_past_captions_style_reference.txt"],
  ];
  return <>
    <section className={styles.claudeIntro}><div className={styles.claudeIntroCopy}><span className={styles.claudeIntroIcon}>▱</span><div><span className={styles.claudeKicker}>SIMPLE VERSION</span><h2>A reusable workspace for one ongoing piece of work</h2><p>Set the files and instructions once. Every chat inside the project can use the same context, and the project stays available across your devices.</p></div></div><aside className={styles.claudeComparisonNote}><span>Think of it as</span><strong>A folder that also remembers how ChatGPT should work.</strong></aside></section>

    <section className={styles.claudeSection}><GuideHeading number="1" kicker="CORE IDEA" title="What it is" /><p className={styles.claudeSectionCopy}>A persistent workspace inside ChatGPT that groups related chats, files, and instructions under one folder. Projects are available on all plans, with file limits scaling by tier.</p><div className={styles.chatgptPlanStrip}><article><strong>Free</strong><p>Up to 5 files per project</p></article><article><strong>Go and Plus</strong><p>Up to 25 files per project</p></article><article><strong>Edu, Pro, Business and Enterprise</strong><p>Up to 40 files per project</p></article></div></section>

    <section className={styles.claudeSection}><GuideHeading number="2" tone="purple" kicker="BEFORE AND AFTER" title="What it solves" /><div className={styles.claudeCompare}><article className={`${styles.claudeCompareCard} ${styles.claudeWithout}`}><strong>WITHOUT A PROJECT</strong><div><i>↻</i><p>Re-upload files and repeat the background in every chat.</p></div><div><i>!</i><p>Context becomes scattered across unrelated conversations.</p></div></article><span className={styles.claudeCompareArrow}>→</span><article className={`${styles.claudeCompareCard} ${styles.claudeWith}`}><strong>WITH A PROJECT</strong><div><i>✓</i><p>Chats, files and instructions stay together.</p></div><div><i>✓</i><p>Every project chat can reuse the same context.</p></div></article></div></section>

    <section className={styles.claudeSection}><GuideHeading number="3" tone="green" kicker="WORKSPACE CONTENTS" title="What goes inside" /><div className={styles.chatgptCardGrid}><article><h3>Chats</h3><p>Conversations assigned to the project. Open a chat menu and choose Move to project. Chats created by a Custom GPT cannot be moved in.</p></article><article><h3>Files</h3><p>Documents, spreadsheets, PDFs, and images that remain shared reference material.</p></article><article><h3>Project instructions</h3><p>Project-specific guidance that takes priority over your global custom instructions.</p></article></div><div className={styles.chatgptNotice}><strong>Optional: project-only memory</strong><p>Choose this when creating a project to keep chat context inside it and exclude outside memories. Existing projects cannot be switched later.</p></div></section>

    <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}><GuideHeading number="4" tone="blue" kicker="SET UP" title="Where to find and set it up" /><div className={styles.chatgptChecklist}>{["Click New project in the sidebar and choose one specific outcome.","Name it clearly; a date or version helps.","Upload only current reference files.","Add three or four sentences covering role, source rules, tone, and output requirements."].map((item,index) => <article key={item}><span>{index + 1}</span><p>{item}</p></article>)}</div><div className={styles.chatgptExamplePair}><article><h3>Projects in the app and cloud</h3><p>The same cloud Projects sync across web, mobile, and desktop.</p></article><article><h3>Desktop app</h3><p>The Project can be used in Chat or cloud Work. Local folders stay on that computer unless added as sources.</p></article></div><StepGuide steps={STEPS.projects} label="ChatGPT Project screenshots" /></section>

    <div className={styles.claudeDetailGrid}><section className={styles.claudeSection}><GuideHeading number="5" tone="green" kicker="ADVANTAGES" title="Strengths" /><ul className={styles.chatgptFeatureList}>{["Context persists automatically across project chats.","Project instructions override global custom instructions in that workspace.","ChatGPT prioritizes project chats and files to stay closer to your sources.","Shared projects are available across plans, with limits varying by subscription."].map(item => <li key={item}><span>✓</span><p>{item}</p></li>)}</ul></section><section className={styles.claudeSection}><GuideHeading number="6" tone="yellow" kicker="BOUNDARIES" title="Limitations" /><ul className={`${styles.chatgptFeatureList} ${styles.chatgptWarningList}`}>{["No true nested folders or subfolders.","No built-in calendar or task board.","Chats created by a Custom GPT cannot be moved into a project.","Mixing unrelated work can reduce output quality.","File and collaborator limits vary by plan."].map(item => <li key={item}><span>!</span><p>{item}</p></li>)}</ul></section></div>

    <section className={styles.claudeSection}><GuideHeading number="7" tone="purple" kicker="WORKING METHOD" title="How to do it well" /><div className={styles.chatgptChecklist}>{["Use one project per specific ongoing effort, such as Q1 Campaign, rather than Marketing.","Keep only current files and remove outdated drafts.","Give the project one clear job; mixed projects produce weaker output.","Use a Custom GPT when the workflow should become a reusable assistant for different people or contexts."].map((item,index) => <article key={item}><span>{index + 1}</span><p>{item}</p></article>)}</div></section>

    <section className={styles.claudeSection}><GuideHeading number="8" tone="yellow" kicker="PRACTICE ACTIVITY" title="Try it yourself" /><div className={styles.chatgptNotice}><strong>Create a project called “Practice – Northwind Coffee Co.”</strong><p>See how voice, product facts, and past examples work together across several files.</p></div><div className={styles.chatgptDownloadGrid}>{downloads.map(([title,description,file]) => <article key={file}><span>TXT</span><div><h3>{title}</h3><p>{description}</p><small>{file}</small></div><a href={`/chatgpt-guides/${file}`} download>Download</a></article>)}</div><div className={styles.chatgptChecklist}>{["Create the project with the supplied name.","Upload all three sample files.","Copy the instructions below into Project settings.","Start a new chat and test the launch-day request."].map((item,index) => <article key={item}><span>{index + 1}</span><p>{item}</p></article>)}</div><CopyPrompt title="Project instructions" prompt={PROJECT_PROMPT} /><div className={styles.chatgptTestPrompts}><p>“Write a launch-day caption for the Maple Oat Latte.”</p><p>“Now do one for the croissant, and mention it&apos;s limited.”</p></div></section>
    <Cta count={count} workflowsHref={workflowsHref} heading="Explore ChatGPT Projects workflows" description="Browse guided workflows for using Projects in practical work scenarios." />
  </>;
}

const WORK_PROMPT = `Create a mobile-friendly Site called “My Workday Dashboard.” Use my connected calendar, email and cloud drive to:

1. Review today’s schedule and the next seven days.
2. Find recent emails that genuinely require my response. Ignore newsletters and promotions.
3. Identify upcoming tasks, deadlines and files connected to today’s meetings.
4. Organize the Site into:
   - Daily overview and schedule
   - Emails and follow-ups
   - Tasks, deadlines and relevant files
   - Suggested plan for the day

Do not send messages, edit files or take external actions without my approval. If a Site called “My Workday Dashboard” already exists, update the same Site and retain its URL. Otherwise, create a new Site. Run the workflow once and let me review the result. After I approve it, schedule it to update every weekday at 8:00 AM in my local time.`;

const CODEX_PROMPT = "Create an interactive project dashboard using the files in this folder. Show the project status, key milestones, owners, deadlines and overdue items. Use a clean, professional and mobile-friendly design. Do not modify the original source files. Preview the dashboard, test all buttons and filters, and fix any issues before finishing.";

function WorkGuide({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  return <>
    <section className={styles.claudeIntro}><div className={styles.claudeIntroCopy}><span className={styles.claudeIntroIcon}>◇</span><div><span className={styles.claudeKicker}>THE SIMPLE VERSION</span><h2>Give ChatGPT the outcome, not just the next step</h2><p>Work handles longer tasks across information, files and tools, then creates a finished result you can review.</p></div></div><aside className={styles.claudeComparisonNote}><span>Use it for</span><strong>Several steps, multiple sources, or a finished document, spreadsheet, presentation, report, or Site.</strong></aside></section>

    <section className={styles.claudeSection}><GuideHeading number="1" kicker="OVERVIEW" title="What it is" /><p className={styles.claudeSectionCopy}>ChatGPT Work is designed for longer, multi-step tasks. It can research, analyze information, use approved sources and create finished documents, spreadsheets, presentations, reports or Sites.</p><p className={styles.claudeSectionCopy}>You can follow its progress, answer questions, change direction and approve important actions while it works.</p></section>

    <section className={styles.claudeSection}><GuideHeading number="2" tone="purple" kicker="INPUTS AND OUTPUTS" title="What it can use and create" /><div className={styles.chatgptExamplePair}><article><h3>What it can use</h3><p>Uploaded files, Project context, connected apps such as Gmail, Google Calendar, Drive, Outlook or SharePoint, and supported websites.</p></article><article><h3>What it can create</h3><p>Reports, trackers, presentations, spreadsheets, documents and interactive Sites.</p></article></div></section>

    <section className={styles.claudeSection}><GuideHeading number="3" tone="green" kicker="PICK THE RIGHT PLACE" title="Choose the right setup" /><div className={styles.chatgptTableWrap}><table><thead><tr><th>Use</th><th>When it fits</th></tr></thead><tbody><tr><td>Chat</td><td>A quick question, draft, explanation or one-off analysis</td></tr><tr><td>Work</td><td>A task involving several steps, sources or a finished deliverable</td></tr><tr><td>Work inside a Project</td><td>The work continues across sessions and should reuse the same files, chats and instructions</td></tr><tr><td>Work on web or mobile</td><td>The task should run in the cloud using uploaded files, apps or websites</td></tr><tr><td>Work on desktop</td><td>The task needs files, folders or applications stored on your computer</td></tr></tbody></table></div><div className={styles.chatgptNotice}><strong>Quick choice</strong><p>Use web or mobile when the task should continue in the cloud. Use the desktop app when Work needs files or applications stored on your computer.</p></div></section>

    <section className={styles.claudeSection}><GuideHeading number="4" tone="blue" kicker="CLOUD, COMPUTER AND PERMISSIONS" title="How Work runs" /><div className={styles.chatgptCardGrid}><article><h3>Cloud Work</h3><p>Can continue after you close the browser or mobile app. Chats sync across web, mobile and desktop.</p></article><article><h3>Local Work</h3><p>Runs through the desktop app. Local files, chats and outputs stay on that computer unless you move or share them.</p></article><article><h3>Approved access</h3><p>Connected apps only provide approved access. ChatGPT may ask before sending messages, changing files or taking important actions.</p></article></div></section>

    <section className={styles.claudeSection}><GuideHeading number="5" tone="purple" kicker="THREE THINGS TO INCLUDE" title="How to give Work a task" /><div className={styles.claudeRequirements}><article><span>1</span><div><strong>Outcome and output</strong><p>What should be completed and which deliverable you need.</p></div></article><article><span>2</span><div><strong>Sources and boundaries</strong><p>Which files, Projects, apps or websites to use, ignore or leave unchanged.</p></div></article><article><span>3</span><div><strong>Review and repetition</strong><p>What needs approval and whether it should run once or on a schedule.</p></div></article></div></section>

    <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}><GuideHeading number="6" tone="blue" kicker="INTERFACE WALKTHROUGH" title="See how Work fits together" /><StepGuide steps={STEPS.work} label="ChatGPT Work screenshots" /></section>

    <section className={styles.claudeSection}><GuideHeading number="7" tone="yellow" kicker="LIMITS AND AVAILABILITY" title="Important things to know" /><div className={styles.chatgptCardGrid}><article><h3>Availability</h3><p>Work and Sites availability depends on your plan, region and workspace permissions.</p></article><article><h3>Public websites</h3><p>Cloud browser works on supported public websites and may stop for sign-in, payment or human verification.</p></article><article><h3>Scheduled Tasks</h3><p>Scheduled Tasks can repeat a Work workflow even when your device is off.</p></article><article><h3>Project files</h3><p>Scheduled Tasks cannot use files uploaded inside a Project. Use connected apps or other available sources.</p></article></div></section>

    <section className={styles.chatgptTryCard}><span className={styles.claudeTryIcon}>→</span><div><span className={styles.claudeKicker}>8 · TRY IT YOURSELF</span><h2>Build a workday dashboard</h2><p>Connect email, calendar and cloud drive, or use dummy files, then open Work and paste this prompt.</p><CopyPrompt title="Prompt to copy" prompt={WORK_PROMPT} compact /></div></section>
    <Cta count={count} workflowsHref={workflowsHref} heading="Explore ChatGPT Work workflows" description="Practise working across apps, files, Sites and schedules with the guided workday dashboard workflow." />
  </>;
}

function CodexGuide({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  return <>
    <section className={styles.claudeIntro}><div className={styles.claudeIntroCopy}><span className={styles.claudeIntroIcon}>&lt;/&gt;</span><div><span className={styles.claudeKicker}>1 · OVERVIEW</span><h2>What it is</h2><p>Codex is an AI agent for creating and changing websites, apps, dashboards and automations. Describe the outcome in plain language, and Codex works through the files and technical steps needed to build it.</p></div></div><aside className={styles.claudeComparisonNote}><span>Your role</span><strong>You do not need to write code, but you should review and test what it creates.</strong></aside></section>

    <section className={styles.claudeSection}><GuideHeading number="2" kicker="CHOOSE THE TOOL" title="Choose the right mode" /><div className={styles.chatgptCardGrid}><article><h3>Chat</h3><p>A quick answer, explanation, brainstorm, rewrite or short analysis.</p></article><article><h3>Work</h3><p>Several steps or sources producing a document, spreadsheet, presentation, report or Site.</p></article><article><h3>Codex</h3><p>Build or modify a website, app, dashboard, automation or software project.</p></article></div><div className={styles.chatgptNotice}><strong>Simple rule</strong><p>Chat answers. Work completes knowledge work. Codex builds software.</p></div></section>

    <section className={styles.claudeSection}><GuideHeading number="3" tone="purple" kicker="POSSIBLE OUTPUTS" title="What you can build" /><p className={styles.claudeSectionCopy}>Landing pages, internal dashboards, trackers, forms, lightweight applications and automated workflows. Codex can also improve an existing site or app by adding features, changing the design or fixing problems.</p><div className={styles.chatgptPills}>{["Landing pages","Dashboards","Trackers","Forms","Applications","Automations"].map(item => <span key={item}>{item}</span>)}</div></section>

    <section className={styles.claudeSection}><GuideHeading number="4" tone="green" kicker="PROJECT WORKFLOW" title="How it works" /><p className={styles.claudeSectionCopy}>Select a folder on your computer as the project and describe what to create. Codex reads the files, plans the work, creates or edits code, tests the result and shows you a preview.</p><div className={styles.chatgptFlowLine}>{["Select a project folder","Describe the outcome","Codex builds and tests","Review the preview"].map((item,index) => <div key={item}><span>{index + 1}</span><strong>{item}</strong></div>)}</div><p className={styles.chatgptNotice}>Create a separate chat for each distinct outcome so the work remains focused.</p></section>

    <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}><GuideHeading number="↳" tone="blue" kicker="SCREEN WALKTHROUGH" title="Start a Codex project" /><StepGuide steps={STEPS.codex} label="Codex screenshots" /></section>

    <section className={styles.claudeSection}><GuideHeading number="5" tone="purple" kicker="PROMPT STRUCTURE" title="Give it a clear task" /><p className={styles.claudeSectionCopy}>Include four things:</p><div className={styles.chatgptCardGrid}>{[["Goal","What should Codex build or change?"],["Context","Which files, examples or websites should it use?"],["Constraints","What design, content or safety rules should it follow?"],["Done when","What must work before the task is complete?"]].map(([h,p]) => <article key={h}><h3>{h}</h3><p>{p}</p></article>)}</div><div className={styles.chatgptNotice}><p>For a complex idea, ask Codex to prepare a plan and ask questions before it starts building.</p></div></section>

    <section className={styles.claudeSection}><GuideHeading number="6" tone="green" kicker="STAY IN CONTROL" title="Review and control the work" /><div className={styles.chatgptExamplePair}><article><h3>Review the result</h3><p>Follow progress, answer questions and redirect it. Review the preview, test important features and request specific revisions.</p></article><article><h3>Control access</h3><p>Use copied files for early projects and grant only the access required for websites, services or files outside the selected folder.</p></article></div></section>

    <section className={styles.claudeSection}><GuideHeading number="7" tone="blue" kicker="BEHIND THE SCENES" title="How Codex handles the technical work" /><div className={styles.chatgptExamplePair}><article><h3>Code, terminal and CLI</h3><p>Codex edits code, runs commands, tests and debugs. Developers can also use Codex through its command-line interface.</p></article><article><h3>GitHub, review and deployment</h3><p>It can create branches, prepare pull requests, respond to testing issues and help deploy approved work.</p></article></div></section>

    <section className={styles.claudeSection}><GuideHeading number="8" tone="purple" kicker="CONNECTIONS AND REUSE" title="Extend what Codex can do" /><div className={styles.chatgptCardGrid}><article><h3>Plugins</h3><p>Connect Codex to services such as Google Drive, Gmail or GitHub.</p></article><article><h3>Skills</h3><p>Save instructions for repeated workflows, such as consistently applying a brand style.</p></article><article><h3>Scheduled tasks</h3><p>Run a tested workflow at a chosen time.</p></article></div></section>

    <section className={styles.chatgptTryCard}><span className={styles.claudeTryIcon}>→</span><div><span className={styles.claudeKicker}>9 · PRACTICE ACTIVITY</span><h2>Try it yourself</h2><p>Create a folder with a sample spreadsheet or document, select it in Codex, and copy this prompt.</p><CopyPrompt title="Project dashboard prompt" prompt={CODEX_PROMPT} compact /><p>Other useful first projects include a landing page, expense tracker, resource directory or internal request form.</p></div></section>
    <Cta count={count} workflowsHref={workflowsHref} heading="Start from the Codex workspace" description="Open guided Codex workflows for building, testing and refining software with plain-language instructions." />
  </>;
}

const IMAGE_TEMPLATE = "Create a [style] image of [subject] in [setting]. Use [colors or lighting]. Show [composition]. Use a [aspect ratio] layout with [constraints].";
const IMAGE_EXAMPLE = "Create a flat vector illustration of two colleagues reviewing a dashboard in a modern office. Use a clean corporate style with orange, yellow and blue accents. Show them from a side angle with the dashboard as the focal point. Use a 16:9 layout, minimal background and no text.";
const IMAGE_SIMPLE = "Create an image of a team using AI at work.";
const IMAGE_STRUCTURED = "Create a clean flat vector illustration of four corporate employees using AI during a team meeting. Show one person presenting an AI-generated dashboard while the others discuss it. Use a modern office setting with warm natural lighting and a professional orange, blue and yellow palette. Keep the composition spacious with the dashboard as the focal point. Use a 16:9 layout with no text or logos.";
const SITES_PROMPT = "Using the attached LinkedIn profile PDF, build a clean and responsive personal website for me. Include my name, current role, a short About section, professional experience, key skills, achievements, education and a button linking to my LinkedIn profile. Use only information from the PDF and do not invent details. Rewrite the content so it works well on a website instead of copying the profile word for word. Do not show my phone number, email address, home address or other sensitive information. Use a modern professional design that works on mobile and desktop. Show me the preview before publishing.";

function ImagesGuide({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  return <>
    <section className={styles.claudeIntro}><div className={styles.claudeIntroCopy}><span className={styles.claudeIntroIcon}>◇</span><div><span className={styles.claudeKicker}>1 · WHAT IT IS</span><h2>Create and refine images inside ChatGPT</h2><p>Create new images from a written prompt, edit images you have already generated, or upload an existing image and describe the changes you want.</p></div></div><aside className={styles.claudeComparisonNote}><span>Use it for</span><strong>Presentation visuals, illustrations, social graphics, product concepts, icons, posters and realistic photographs.</strong></aside></section>

    <section className={styles.claudeSection}><GuideHeading number="2" tone="purple" kicker="MODEL AND ACCESS" title="Which model does ChatGPT use?" /><div className={styles.chatgptModelBanner}><span>IMAGE MODEL</span><h3>ChatGPT Images 2.0</h3><p>ChatGPT currently uses Images 2.0 for built-in image generation. You do not need to select a separate model. Ask ChatGPT to create an image or open Images from the sidebar.</p></div><div className={styles.chatgptNotice}><strong>Images with thinking</strong><p>Available on selected paid plans for complex images. DALL·E remains available separately through the DALL·E GPT.</p></div></section>

    <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}><GuideHeading number="3" tone="blue" kicker="SCREENSHOT WALKTHROUGH" title="Create, edit and share an image" /><StepGuide steps={STEPS.images} label="ChatGPT Images screenshots" /></section>

    <section className={styles.claudeSection}><GuideHeading number="4" tone="green" kicker="PROMPT STRUCTURE" title="Give ChatGPT five types of information" /><div className={styles.chatgptFiveGrid}>{[["Subject","What should be visible"],["Setting","Where the scene takes place"],["Style","Photograph, vector, illustration or another look"],["Composition","Framing, focal point and object placement"],["Constraints","Aspect ratio, text, logos and exclusions"]].map(([h,p],index) => <article key={h}><span>{index + 1}</span><div><strong>{h}</strong><p>{p}</p></div></article>)}</div><div className={styles.chatgptTwoPrompts}><CopyPrompt title="Prompt template" prompt={IMAGE_TEMPLATE} /><CopyPrompt title="Example" prompt={IMAGE_EXAMPLE} /></div></section>

    <section className={styles.claudeSection}><GuideHeading number="5" tone="yellow" kicker="PRACTICE ACTIVITY" title="Activity: Compare two prompts" /><p className={styles.claudeSectionCopy}>Generate the same idea twice and compare the results.</p><div className={styles.chatgptTwoPrompts}><CopyPrompt title="Simple prompt" prompt={IMAGE_SIMPLE} /><CopyPrompt title="Structured prompt" prompt={IMAGE_STRUCTURED} /></div><div className={styles.chatgptNotice}><strong>Compare the images</strong><p>Which version gives better control over people, setting, composition, palette and the final aspect ratio?</p></div></section>

    <section className={styles.claudeSection}><GuideHeading number="6" tone="purple" kicker="ITERATION" title="Improve the image through conversation" /><p className={styles.claudeSectionCopy}>You do not need the perfect prompt in one attempt. Generate the first version, then request one specific change at a time.</p><div className={styles.chatgptPills}>{["Make the background simpler","Move the subject right","Use warmer lighting","Remove the text","Change to 16:9","Keep the same character"].map(item => <span key={item}>{item}</span>)}</div></section>

    <section className={styles.claudeSection}><GuideHeading number="7" tone="blue" kicker="MORE CONTROL" title="Useful prompt controls" /><div className={styles.chatgptCardGrid}>{[["Choose the orientation","Specify 16:9 landscape, 1:1 square or 9:16 vertical."],["Control the text","Put exact short wording inside quotation marks."],["Control the background","Ask for transparent, solid colour or a specific setting."],["Control the layout","Describe where important objects and empty space should appear."],["Control photographs","Add lens, depth-of-field and lighting language."],["Use references","Upload an image for a specific layout, product, character or style."]].map(([h,p]) => <article key={h}><h3>{h}</h3><p>{p}</p></article>)}</div></section>

    <section className={styles.claudeSection}><GuideHeading number="8" tone="yellow" kicker="TROUBLESHOOTING" title="When the result is still incorrect" /><p className={styles.claudeSectionCopy}>Instead of repeating the same prompt, identify the exact problem.</p><div className={styles.chatgptPromptContrast}><article><span>AVOID</span><p>Make it better.</p></article><article><span>USE</span><p>Reduce the background objects, increase empty space around the subject and make the illustration flatter and less realistic.</p></article></div><p className={styles.claudeSectionCopy}>For complex visuals, establish the subject and composition first, then refine colours, background, text and smaller details.</p></section>

    <section className={styles.claudeSection}><GuideHeading number="9" kicker="CURRENT UPDATE" title="Video generation update" /><div className={styles.chatgptExamplePair}><article><h3>April 26, 2026</h3><p>OpenAI discontinued the Sora web and app experiences.</p></article><article><h3>September 24, 2026</h3><p>The Sora API is scheduled to be discontinued. ChatGPT Images currently focuses on static images.</p></article></div></section>
    <Cta count={count} workflowsHref={workflowsHref} heading="Explore ChatGPT Images workflows" description="Open guided workflows for practising image generation and editing." />
  </>;
}

function SitesGuide({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  return <>
    <section className={styles.claudeIntro}><div className={styles.claudeIntroCopy}><span className={styles.claudeIntroIcon}>▦</span><div><span className={styles.claudeKicker}>1 · WHAT IT IS</span><h2>ChatGPT Sites creates and hosts websites or lightweight web apps from a plain-language prompt</h2><p>You describe the outcome, review the preview, request changes, then publish it.</p></div></div><aside className={styles.claudeComparisonNote}><span>Inside ChatGPT</span><strong>Describe the outcome, review the preview, request changes and publish the Site.</strong></aside></section>

    <section className={styles.claudeSection}><GuideHeading number="2" kicker="WHY IT MATTERS" title="What it solves" /><p className={styles.claudeSectionCopy}>Creating a website usually requires coding, hosting and deployment. ChatGPT Sites handles these inside ChatGPT and gives you a working URL when the Site is published.</p></section>

    <section className={styles.claudeSection}><GuideHeading number="3" tone="purple" kicker="USE CASES" title="What it can create" /><div className={styles.claudeRequirements}><article><span>1</span><div><strong>Work tools</strong><p>Project trackers, team dashboards and interactive reports.</p></div></article><article><span>2</span><div><strong>Information sites</strong><p>Learning hubs, onboarding pages and event websites.</p></div></article><article><span>3</span><div><strong>Interactive experiences</strong><p>Personal websites, prototypes and forms that save responses.</p></div></article></div></section>

    <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}><GuideHeading number="4" tone="blue" kicker="BUILD AND PUBLISH" title="Where to find and use it" /><div className={styles.chatgptChecklist}>{["Open ChatGPT Work, type @Sites, then describe what you want and attach relevant files.","Review the generated preview and request content, design or functionality changes.","Select Share, publish the Site and copy its URL."].map((item,index) => <article key={item}><span>{index + 1}</span><p>{item}</p></article>)}</div><StepGuide steps={STEPS.sites} label="ChatGPT Sites screenshots" /></section>

    <section className={styles.claudeSection}><GuideHeading number="5" tone="green" kicker="AFTER PUBLISHING" title="Hosting and updates" /><ul className={styles.chatgptFeatureList}><li><span>✓</span><p>Hosting is included, so you do not need to configure a server or another hosting platform.</p></li><li><span>✓</span><p>To update the Site, return to ChatGPT, describe the changes and publish the revised version.</p></li></ul></section>

    <section className={styles.claudeSection}><GuideHeading number="6" tone="purple" kicker="PROMPT CLEARLY" title="How to get better results" /><div className={styles.chatgptChecklist}>{["Explain who the Site is for, what it should contain and what visitors should be able to do.","Mention whether forms, uploaded files or other information must be saved between visits.","Review the first version before giving detailed instructions about colours and layout."].map((item,index) => <article key={item}><span>{index + 1}</span><p>{item}</p></article>)}</div></section>

    <section className={styles.claudeSection}><GuideHeading number="7" tone="yellow" kicker="BEFORE PUBLISHING" title="Sharing and limitations" /><div className={styles.chatgptExamplePair}><article><h3>Sharing access</h3><p>Keep the Site private or make it available to anyone on the internet. There is no simple selected-people private sharing option.</p></article><article><h3>Limits and confidential information</h3><p>Availability depends on plan, region and workspace settings. Check confidential information before publishing publicly.</p></article></div></section>

    <section className={styles.chatgptTryCard}><span className={styles.claudeTryIcon}>→</span><div><span className={styles.claudeKicker}>8 · PRACTICE ACTIVITY</span><h2>Try it yourself</h2><p>Download your LinkedIn profile as a PDF. Open ChatGPT Work, select @Sites, upload the PDF and paste the prompt. Remove sensitive information before publishing.</p><CopyPrompt title="Personal website prompt" prompt={SITES_PROMPT} compact /></div></section>
    <Cta count={count} workflowsHref={workflowsHref} heading="Explore ChatGPT Sites workflows" description="Open guided workflows for building, reviewing and publishing lightweight Sites." />
  </>;
}

const CUSTOM_GPT_PROMPT = `Act as a professional 'Company HR Support Assistant'. Your primary goal is to assist employees with inquiries regarding company policies and procedures.

Purpose and Goals:
* Provide accurate, clear, and helpful answers based on the internal company knowledge base and employee handbook.
* Ensure employees feel supported and informed about workplace rights, benefits, and responsibilities.
* Direct complex or unanswerable queries to the appropriate human resources channel.

Behaviors and Rules:
1) Policy Inquiry and Knowledge Retrieval
* Retrieve information strictly from the provided employee handbook and knowledge base.
* Summarize policies clearly, using bullet points for multi-step processes or benefits.
* For personal or confidential information unavailable in the handbook, explain the official access procedure.

2) Handling Information Gaps
* If an answer is not in the knowledge base, do not speculate.
* Say the information is unavailable and instruct the employee to email ask@company.com.

3) Professionalism and Boundaries
* Maintain a professional, neutral and supportive tone.
* Do not provide legal advice or personal opinions.
* Keep responses concise and focused on the employee's question.`;

function CustomGptsGuide({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  return <>
    <section className={styles.claudeIntro}><div className={styles.claudeIntroCopy}><span className={styles.claudeIntroIcon}>◎</span><div><span className={styles.claudeKicker}>1 · WHAT IT IS</span><h2>Your own configured version of ChatGPT</h2><p>Built once and reused for a specific job — an HR policy bot, finance report writer or sales email drafter. Build it inside ChatGPT&apos;s GPT Builder with no coding required.</p></div></div><aside className={styles.claudeComparisonNote}><span>Simple way to think about it</span><strong>Configure the job, tone, rules and documents once. Then open the same assistant whenever you need it.</strong></aside></section>

    <section className={styles.claudeSection}><GuideHeading number="2" kicker="WHY IT MATTERS" title="What it solves" /><div className={styles.claudeCompare}><article className={`${styles.claudeCompareCard} ${styles.claudeWithout}`}><strong>INSTEAD OF</strong><div><i>↻</i><p>Repeat the role, rules and tone in every chat.</p></div><div><i>↑</i><p>Upload the same source documents again.</p></div></article><span className={styles.claudeCompareArrow}>→</span><article className={`${styles.claudeCompareCard} ${styles.claudeWith}`}><strong>WITH A CUSTOM GPT</strong><div><i>✓</i><p>Open a named assistant already configured for the job.</p></div><div><i>✓</i><p>Reuse its instructions, knowledge and tools.</p></div></article></div></section>

    <section className={styles.claudeSection}><GuideHeading number="3" tone="purple" kicker="THE CONFIGURATION" title="What goes inside" /><div className={styles.chatgptFiveGrid}>{[["Instructions","What it should do, tone, style and rules"],["Knowledge","Uploaded documents and links it should know"],["Tools","Web browsing, code interpreter and image generation"],["Conversation starters","Pre-set prompts that make it easy to begin"],["Actions","API integrations for tickets, data and workflows"]].map(([h,p],index) => <article key={h}><span>{index + 1}</span><div><strong>{h}</strong><p>{p}</p></div></article>)}</div></section>

    <div className={styles.claudeDetailGrid}><section className={styles.claudeSection}><GuideHeading number="4" tone="green" kicker="USE YOUR REAL SOURCES" title="Grounded knowledge" /><ul className={styles.chatgptFeatureList}>{["Answers from uploaded PDFs, documents, FAQs and SOPs.","Tell it to say “not in the knowledge base” instead of guessing.","Keeps answers aligned with your actual policies."].map(item => <li key={item}><span>✓</span><p>{item}</p></li>)}</ul></section><section className={styles.claudeSection}><GuideHeading number="5" tone="yellow" kicker="KEEP KNOWLEDGE CURRENT" title="Knowledge limits" /><ul className={`${styles.chatgptFeatureList} ${styles.chatgptWarningList}`}>{["Up to 20 files per GPT, each up to 512MB or about 2M tokens.","Keep files clean, well named and versioned.","Changed documents must be re-uploaded manually."].map(item => <li key={item}><span>!</span><p>{item}</p></li>)}</ul></section></div>

    <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}><GuideHeading number="6" tone="blue" kicker="ACCESS AND WALKTHROUGH" title="Sharing options" /><div className={styles.chatgptPills}>{["Only me","Anyone with the link","GPT Store","Within your organization"].map(item => <span key={item}>{item}</span>)}</div><p className={styles.claudeSectionCopy}>A link-shared GPT cannot be restricted to specific emails unless you use an organization or Enterprise setup with domain-based access.</p><StepGuide steps={STEPS["custom-gpts"]} label="Custom GPT screenshots" /></section>

    <section className={styles.claudeSection}><GuideHeading number="7" tone="yellow" kicker="USE THE RIGHT INFORMATION" title="Privacy and sensitivity" /><ul className={`${styles.chatgptFeatureList} ${styles.chatgptWarningList}`}>{["Uploaded files are accessible to anyone who can use the GPT.","Do not upload secrets, personal information or sensitive data without proper controls.","Include only what the GPT needs."].map(item => <li key={item}><span>!</span><p>{item}</p></li>)}</ul></section>

    <section className={styles.claudeSection}><GuideHeading number="8" tone="purple" kicker="CHOOSE THE RIGHT FORMAT" title="Custom GPTs vs Skills" /><div className={styles.chatgptExamplePair}><article><h3>Custom GPT</h3><p>A named assistant with its own instructions and knowledge base.</p></article><article><h3>Skill</h3><p>A reusable workflow applied from your main ChatGPT.</p></article></div><div className={styles.chatgptNotice}><p>Use Custom GPTs for role-based bots. Use Skills for repeatable workflows.</p></div></section>

    <section className={styles.claudeSection}><GuideHeading number="9" tone="yellow" kicker="PRACTICE ACTIVITY" title="Try it yourself" /><div className={styles.chatgptChecklist}><article><span>1</span><p>Download and upload the sample employee handbook as Knowledge.</p></article><article><span>2</span><p>Copy the HR Support Assistant prompt into Instructions.</p></article><article><span>3</span><p>Test one covered question and one question the handbook does not answer.</p></article></div><div className={styles.chatgptDownloadGrid}><article><span>PDF</span><div><h3>Employee-Handbook_sample.pdf</h3><p>Sample knowledge base · PDF</p></div><a href="/chatgpt-guides/employee-handbook_sample.pdf" download>Download</a></article></div><CopyPrompt title="Company HR Support Assistant prompt" prompt={CUSTOM_GPT_PROMPT} /></section>
    <Cta count={count} workflowsHref={workflowsHref} heading="Explore Custom GPT workflows" description="Open guided workflows for building, testing and improving task-specific GPTs." />
  </>;
}

function ScheduledGuide({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  const workplaceExamples = [
    "Review tomorrow’s meetings and prepare discussion points.",
    "Summarize important emails and messages every morning.",
    "Collect customer feedback and group recurring themes each week.",
    "Check project updates and highlight delays or dependencies.",
    "Monitor a policy, competitor or industry topic for meaningful changes.",
  ];
  const promptElements = [
    "The work to complete",
    "The sources to check",
    "The schedule",
    "The required output",
    "What counts as important",
    "Actions it must not take",
  ];
  const limitations = [
    "Tasks cannot run more frequently than once per hour.",
    "Active-task limits depend on the user’s plan.",
    "Unattended tasks may pause after a period of inactivity.",
    "Scheduled Tasks currently do not support voice chats or GPTs.",
  ];

  return <>
    <section className={styles.claudeIntro}><div className={styles.claudeIntroCopy}><span className={styles.claudeIntroIcon}>◷</span><div><span className={styles.claudeKicker}>SIMPLE VERSION</span><h2>Give ChatGPT a task and a future time</h2><p>ChatGPT can complete it once, repeat it regularly, or watch for a change and notify you when something important happens.</p></div></div><aside className={styles.claudeComparisonNote}><span>Closest comparison</span><strong>Think of it as a recurring prompt combined with a reminder and an update checker.</strong></aside></section>

    <div className={styles.chatgptExamplePair}>
      <section className={styles.claudeSection}><GuideHeading number="1" kicker="THE FEATURE" title="What it is" /><p className={styles.claudeSectionCopy}>Scheduled Tasks lets ChatGPT perform work later without waiting for you to open a chat again. A task can run once, repeat on a schedule, or check for changes and notify you only when something important happens.</p></section>
      <section className={styles.claudeSection}><GuideHeading number="2" tone="purple" kicker="WHY IT MATTERS" title="What it solves" /><div className={styles.chatgptPromptContrast}><article><span>Without a schedule</span><p>Remember to collect the information yourself, then repeat the same prompt every time.</p></article><article><span>With Scheduled Tasks</span><p>Prepare routine work at the right time and receive updates without checking manually.</p></article></div></section>
    </div>

    <section className={styles.claudeSection}><GuideHeading number="3" tone="green" kicker="TASK TYPES" title="How it works" /><p className={styles.claudeSectionCopy}>Describe the work, the information ChatGPT should use, when it should run and what the output should contain.</p><div className={styles.chatgptCardGrid}><article><h3>One-time tasks</h3><p>Prepare a briefing before a specific meeting.</p></article><article><h3>Recurring tasks</h3><p>Create a priority summary every weekday morning.</p></article><article><h3>Monitoring tasks</h3><p>Check for an important change and notify you only when something is worth reporting.</p></article></div><div className={styles.chatgptNotice}><p>Monitoring tasks remember earlier runs, which helps ChatGPT identify what has changed instead of repeating the same update.</p></div></section>

    <section className={styles.claudeSection}><GuideHeading number="4" tone="blue" kicker="SOURCES AND OUTPUTS" title="What it can use and create" /><div className={styles.chatgptExamplePair}><article><h3>Information it can use</h3><p>Depending on your account and company permissions, Scheduled Tasks can use uploaded information, web search and connected apps such as Gmail, Calendar and other workplace tools.</p></article><article><h3>Useful workplace examples</h3><ul className={styles.chatgptFeatureList}>{workplaceExamples.map(item => <li key={item}><span>✓</span><p>{item}</p></li>)}</ul></article></div><div className={styles.chatgptNotice}><p>When used with ChatGPT Work, it can turn this information into briefs, reports, spreadsheets, presentations or updated documents.</p></div></section>

    <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}><GuideHeading number="5" kicker="WALKTHROUGH" title="Where to find and manage it" /><StepGuide steps={STEPS.scheduled} label="ChatGPT Scheduled Tasks screenshots" /><p className={styles.claudeSectionCopy}>From the Scheduled page, you can review recent results, see the next run time, and pause, resume, edit or delete a task.</p></section>

    <div className={styles.chatgptExamplePair}>
      <section className={styles.claudeSection}><GuideHeading number="6" tone="purple" kicker="EXECUTION" title="Use the right setup" /><div className={styles.chatgptSetupGrid}><article><span>☁</span><div><h3>Cloud task</h3><p>Use it when the workflow relies on uploaded information, websites or connected apps. It can continue while your computer is offline.</p></div></article><article><span>▣</span><div><h3>Local desktop task</h3><p>Use it when ChatGPT needs direct access to a folder or project on your computer. The computer must remain on and the desktop app must stay open.</p></div></article></div><p className={styles.claudeSectionCopy}>Web and mobile tasks cannot directly access files stored on your computer.</p></section>
      <section className={styles.claudeSection}><GuideHeading number="7" tone="green" kicker="INDIVIDUAL OR TEAM" title="Scheduled Task or Workspace Agent?" /><div className={styles.chatgptExamplePair}><article><h3>Scheduled Task</h3><p>Use it for a recurring workflow that mainly supports you.</p></article><article><h3>Workspace Agent</h3><p>Use it when the workflow should be shared across a team, follow a common process, use organizational tools and run in the cloud. Workspace Agents can be used through ChatGPT or Slack, depending on company access.</p></article></div></section>
    </div>

    <section className={styles.claudeSection}><GuideHeading number="8" tone="blue" kicker="PROMPT STRUCTURE" title="How to prompt it well" /><div className={styles.chatgptChecklist}>{promptElements.map((item, index) => <article key={item}><span>{index + 1}</span><p>{item}</p></article>)}</div><CopyPrompt title="Example: weekday priority briefing" prompt={SCHEDULED_BRIEF_PROMPT} /><p className={styles.claudeSectionCopy}>This is stronger than “send me a daily briefing” because ChatGPT knows what to review, what to produce and what it is allowed to do.</p></section>

    <div className={styles.chatgptExamplePair}>
      <section className={styles.claudeSection}><GuideHeading number="9" kicker="CURRENT CONSTRAINTS" title="Important limitations" /><ul className={`${styles.chatgptFeatureList} ${styles.chatgptWarningList}`}>{limitations.map(item => <li key={item}><span>!</span><p>{item}</p></li>)}</ul></section>
      <section className={styles.claudeSection}><GuideHeading number="10" tone="purple" kicker="PRACTICE ACTIVITY" title="Try it yourself" /><p className={styles.claudeSectionCopy}>Create a task using this prompt:</p><CopyPrompt title="Prepare for tomorrow’s meetings" prompt={SCHEDULED_PRACTICE_PROMPT} /><p className={styles.claudeSectionCopy}>Review the first few results, then refine the prompt, connected tools or schedule based on what is missing.</p></section>
    </div>

    <Cta count={count} workflowsHref={workflowsHref} heading="Explore Scheduled Tasks workflows" description="Start with the guided meeting-preparation workflow, then adapt the schedule and sources to your work." />
  </>;
}

function InsiderGuide({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  return <>
    <section className={styles.claudeIntro}><div className={styles.claudeIntroCopy}><span className={styles.claudeIntroIcon}>✦</span><div><span className={styles.claudeKicker}>THE SIMPLE VERSION</span><h2>ChatGPT has more controls than the model picker</h2><p>You can adjust reasoning, open a parallel chat, track work with a Pet, record a repeatable workflow and coordinate tasks through Voice.</p></div></div><aside className={styles.claudeComparisonNote}><span>Best place to start</span><strong>Choose a model and effort level that match the difficulty of the task.</strong></aside></section>

    <section className={styles.claudeSection}><GuideHeading number="1" kicker="MODEL CHOICE" title="Choose the right model" /><div className={styles.chatgptTableWrap}><table><thead><tr><th>Model</th><th>Best used for</th><th>Where it appears</th></tr></thead><tbody><tr><td>GPT-5.6 Sol</td><td>Complex, open-ended or high-value work requiring deeper judgment and polish</td><td>ChatGPT reasoning, Work and Codex</td></tr><tr><td>GPT-5.6 Terra</td><td>Everyday writing, analysis, research and tool use</td><td>Work and Codex</td></tr><tr><td>GPT-5.6 Luna</td><td>Clear, repeatable tasks such as extraction, classification and structured summaries</td><td>Work and Codex</td></tr><tr><td>GPT-5.5 Instant</td><td>Fast, everyday questions and conversational responses</td><td>Standard ChatGPT</td></tr></tbody></table></div><div className={styles.chatgptNotice}><strong>Simple rule</strong><p>In Work or Codex, start with Terra for everyday work, move to Sol when the task is difficult or ambiguous, and use Luna for clearly defined work repeated at scale.</p></div></section>

    <section className={styles.claudeSection}><GuideHeading number="2" tone="purple" kicker="ADVANCED CONTROLS" title="Model, effort and speed are separate controls" /><div className={styles.claudeRequirements}><article><span>M</span><div><strong>Model</strong><p>The overall capability level.</p></div></article><article><span>E</span><div><strong>Effort</strong><p>How much reasoning the model should apply.</p></div></article><article><span>S</span><div><strong>Speed</strong><p>How quickly you want the response or task completed.</p></div></article></div><div className={styles.chatgptExamplePair}><article><h3>Max</h3><p>Gives one model more time to reason.</p></article><article><h3>Ultra</h3><p>Divides suitable work across subagents.</p></article></div><p className={styles.claudeSectionCopy}>Medium effort works for most tasks. Increase it for several sources, difficult trade-offs or extensive checking. Availability depends on your plan and settings.</p></section>

    <section className={styles.claudeSection}><GuideHeading number="3" tone="green" kicker="PARALLEL CONVERSATION" title="Open a Side Chat" /><p className={styles.claudeSectionCopy}>Type <strong>/side</strong> while a long task is running. ChatGPT opens a temporary parallel conversation while the original task continues.</p></section>

    <section className={styles.claudeSection}><GuideHeading number="4" tone="blue" kicker="DESKTOP STATUS" title="Follow running work with a Pet" /><p className={styles.claudeSectionCopy}>In the desktop app, a ChatGPT Pet can float above other applications and show the status of a chat.</p><div className={styles.chatgptNotice}><strong>Settings → Pets</strong><p>Open Settings → Pets or type /pet. Custom desktop Pets are stored locally and do not automatically sync to the web.</p></div></section>

    <section className={styles.claudeSection}><GuideHeading number="5" tone="purple" kicker="REUSABLE WORKFLOW" title="Record a workflow and turn it into a Skill" /><p className={styles.claudeSectionCopy}><strong>Record & Replay</strong> lets eligible users demonstrate a stable process once and convert it into a reusable Skill.</p><div className={styles.chatgptInsiderPath}>Plugins <span>→</span> + <span>→</span> Record a skill</div><p className={styles.chatgptNotice}>Record & Replay requires Computer Use. Keep recordings focused and avoid secrets or sensitive data.</p></section>

    <section className={styles.claudeSection}><GuideHeading number="6" tone="green" kicker="HANDS-FREE COORDINATION" title="Voice can coordinate work across chats" /><p className={styles.claudeSectionCopy}>In the desktop app, Voice can start longer tasks, check their progress and send follow-up instructions while you continue talking.</p><div className={styles.chatgptCardGrid}><article><h3>Start</h3><p>Launch a longer Work or Codex task.</p></article><article><h3>Coordinate</h3><p>Check progress and provide follow-up instructions.</p></article><article><h3>Context</h3><p>Voice conversations must start in Voice mode; a microphone in text chat is dictation.</p></article></div></section>

    <section className={`${styles.claudeSection} ${styles.claudeGuideSection}`}><GuideHeading number="7" tone="blue" kicker="VISUAL WALKTHROUGH" title="See where the features appear" /><StepGuide steps={STEPS.insider} label="ChatGPT Insider Guide screenshots" /></section>
    <Cta count={count} workflowsHref={workflowsHref} heading="Explore ChatGPT workflows" description="Open guided ChatGPT workflows for models, Work, Codex and reusable features." />
  </>;
}

export default function ChatGPTGuide({ kind, count, workflowsHref }: Props) {
  const content = kind === "skills" ? <SkillsGuide count={count} workflowsHref={workflowsHref} />
    : kind === "projects" ? <ProjectsGuide count={count} workflowsHref={workflowsHref} />
    : kind === "work" ? <WorkGuide count={count} workflowsHref={workflowsHref} />
    : kind === "codex" ? <CodexGuide count={count} workflowsHref={workflowsHref} />
    : kind === "images" ? <ImagesGuide count={count} workflowsHref={workflowsHref} />
    : kind === "sites" ? <SitesGuide count={count} workflowsHref={workflowsHref} />
    : kind === "scheduled" ? <ScheduledGuide count={count} workflowsHref={workflowsHref} />
    : kind === "custom-gpts" ? <CustomGptsGuide count={count} workflowsHref={workflowsHref} />
    : <InsiderGuide count={count} workflowsHref={workflowsHref} />;
  return <main className={`${styles.page} ${styles.claudePage} ${styles.chatgptPage}`}><Header kind={kind} />{content}</main>;
}
