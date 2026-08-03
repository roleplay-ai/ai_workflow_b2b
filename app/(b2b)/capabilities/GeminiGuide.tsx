"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./capabilities.module.css";

export type GeminiGuideKind = "skills" | "notebooks" | "schedules" | "spark" | "gems" | "images" | "video" | "insider";

type Props = { kind: GeminiGuideKind; count?: number; workflowsHref: string };
type GuideStep = { title: string; tabTitle?: string; helper: string; description: string; caption: string; src: string; alt: string; width: number; height: number };

const STEPS: Record<GeminiGuideKind, GuideStep[]> = {
  skills: [
    { title: "Open the Skills page", helper: "Gemini → Spark → Skills", description: "See active Skills, templates and creation routes.", caption: "The Skills page shows active Skills, Recommended templates and the three creation routes at the top.", src: "/gemini-guides/skills-1.png", alt: "Gemini Spark Skills page showing creation routes, active Skills and recommended templates", width: 2048, height: 1093 },
    { title: "Create with Gemini", helper: "Skills → Create with Gemini", description: "Describe the recurring work in a normal task thread.", caption: "Describe the recurring work in a task thread. Gemini drafts the Skill and saves it once the setup is complete.", src: "/gemini-guides/skills-2.png", alt: "Gemini task thread showing a newly created unread email to-dos Skill card", width: 2048, height: 1016 },
    { title: "Create manually", helper: "Skills → Create manually", description: "Enter the name, description and instructions yourself.", caption: "Fill in the Skill name, description and instructions when you already know the rules you want Spark to follow.", src: "/gemini-guides/skills-3.png", alt: "Gemini manual Skill creation form with name, description and instructions fields", width: 2048, height: 1175 },
    { title: "Upload a Skill file", helper: "Skills → Upload", description: "Upload a folder containing a valid SKILL.md file.", caption: "Upload a folder containing SKILL.md. Use a kebab-case Skill name and remove hidden files such as .DS_Store first.", src: "/gemini-guides/skills-4.png", alt: "Gemini Upload a Skill dialog showing SKILL.md and kebab-case file requirements", width: 1038, height: 1144 },
    { title: "Select a saved Skill", helper: "Spark prompt → Type /", description: "Call a saved Skill from a Spark task.", caption: "Type / inside a Spark task to open the menu and choose the Skill you want to apply.", src: "/gemini-guides/skills-5.png", alt: "Gemini Spark prompt box showing a slash menu with saved Skills", width: 1426, height: 740 },
  ],
  notebooks: [
    { title: "Create a new notebook", helper: "Gemini → Notebooks → New notebook", description: "Start a source-grounded workspace.", caption: "Open Gemini and select New notebook from the Notebooks area.", src: "/gemini-guides/notebooks-1.png", alt: "Gemini interface showing the Notebooks section and New notebook option", width: 1902, height: 1078 },
    { title: "Add source material", helper: "Notebook → Sources → Add", description: "Upload files, links, Drive items or copied text.", caption: "Choose files, Drive items, websites or copied text that Gemini can reference.", src: "/gemini-guides/notebooks-2.png", alt: "Gemini Notebook source picker showing upload files, Drive, websites and copied text options", width: 1806, height: 1144 },
    { title: "Work with sources and Studio outputs", tabTitle: "Use Chat and Studio", helper: "Notebook → Chat and Studio", description: "Ask grounded questions and generate new formats.", caption: "Use the centre panel to ask source-grounded questions and the Studio panel to generate formats such as audio, video, quizzes and slide decks.", src: "/gemini-guides/notebooks-3.png", alt: "Gemini Notebook workspace showing Sources, Chat and Studio panels", width: 2048, height: 994 },
    { title: "Review a Video Overview", helper: "Studio → Video Overview", description: "Open, review and share a generated overview.", caption: "Open the generated video, review the prompt and source count, then share, download or rate the result.", src: "/gemini-guides/notebooks-4.png", alt: "Gemini Notebook Video Overview screen showing a generated sample video", width: 1120, height: 1274 },
  ],
  schedules: [
    { title: "Schedules list", helper: "Gemini → Spark → Schedules", description: "Review active schedules and their latest runs.", caption: "Use this page to see active schedules, inspect their latest run and create another schedule.", src: "/gemini-guides/schedules-1.png", alt: "Gemini Spark Schedules page showing ongoing schedules and creation options", width: 2048, height: 865 },
    { title: "Manual schedule setup", helper: "Schedules → Create manually", description: "Set the frequency, time and instructions.", caption: "Set the frequency and time, then describe the task in the Instructions field. Event-based monitors can be created by asking Gemini.", src: "/gemini-guides/schedules-2.png", alt: "Gemini Schedules manual creation form for monitoring a Google Sheet", width: 1496, height: 1230 },
    { title: "Completed schedule notification", helper: "Gmail → Inbox", description: "Review the result delivered by Gemini.", caption: "This example shows the email Gemini sent after detecting a new row in the monitored spreadsheet.", src: "/gemini-guides/schedules-3.png", alt: "Gmail message generated by Gemini summarizing a newly added spreadsheet row", width: 2048, height: 1111 },
  ],
  spark: [
    { title: "Open Spark Tasks", helper: "Gemini → Spark → Tasks", description: "Start from the agent workspace.", caption: "Spark separates agent work into Tasks, with Schedules, Skills and Connected Apps available in the same workspace.", src: "/gemini-guides/spark-1.png", alt: "Gemini Spark Tasks home screen showing recent tasks, Schedules, Skills and Connected Apps", width: 2048, height: 1184 },
    { title: "Describe the workflow", helper: "Spark → Describe a task", description: "State the trigger, sources, rules and destination.", caption: "Describe the trigger, the source folder, the naming rule and where the finished file should go.", src: "/gemini-guides/spark-2.png", alt: "Gemini Spark prompt describing a receipt and invoice processing workflow", width: 1486, height: 592 },
    { title: "Track work in progress", helper: "Task → Plan steps", description: "Follow connected-app activity and progress.", caption: "Spark shows the task thread, connected app activity and progress while the workflow is running.", src: "/gemini-guides/spark-3.png", alt: "Gemini Spark task showing an automated receipt workflow in progress", width: 2048, height: 1008 },
    { title: "Review the completed workflow", helper: "Task → Complete", description: "Check the final rules and completed actions.", caption: "The completed task records what Spark should check and what it should do when the workflow runs.", src: "/gemini-guides/spark-4.png", alt: "Gemini Spark completed task showing receipt processing rules", width: 2048, height: 986 },
  ],
  gems: [
    { title: "Open Gems from the Gemini sidebar", tabTitle: "Open Gems", helper: "Gemini → Gems", description: "Open saved and premade Gems.", caption: "Select Gems in the left sidebar to open your saved and premade Gems.", src: "/gemini-guides/gems-1.png", alt: "Gemini home screen with Gems highlighted in the sidebar", width: 1033, height: 494 },
    { title: "Add instructions and knowledge", tabTitle: "Build or edit a Gem", helper: "Gem Manager → Create or edit", description: "Add a name, instructions and knowledge files.", caption: "Give the Gem a name and description, add the reusable instructions, then attach files in the Knowledge area.", src: "/gemini-guides/gems-2.png", alt: "Gemini Gem editor showing instructions and a PDF knowledge file", width: 1001, height: 744 },
    { title: "Review and manage your Gems", tabTitle: "Manage your Gems", helper: "Gems → Gem Manager", description: "Open, edit and share custom Gems.", caption: "Gem Manager shows premade Gems and your custom Gems, with controls to share, edit or open additional options.", src: "/gemini-guides/gems-3.png", alt: "Gem Manager showing premade and custom Gems with controls", width: 860, height: 765 },
  ],
  images: [
    { title: "Open Create image", helper: "Gemini prompt bar → + → Create image", description: "Choose image creation from the attachment menu.", caption: "Open the attachment menu and select Create image.", src: "/gemini-guides/images-1.png", alt: "Gemini prompt bar menu with Create image selected", width: 1534, height: 918 },
    { title: "Write the first prompt", helper: "Create images → Prompt", description: "Define the subject, setting, style and constraints.", caption: "Use one prompt to define the subject, setting, style, composition, details and constraints.", src: "/gemini-guides/images-2.png", alt: "Gemini Create images screen with a detailed portrait prompt", width: 1466, height: 1292 },
    { title: "Review the first image", helper: "Image thread → Generated result", description: "Check consistency before requesting an edit.", caption: "Check the face, hairstyle, clothing, framing and lighting before asking for the next change.", src: "/gemini-guides/images-3.png", alt: "Generated portrait of a product manager wearing a navy blazer", width: 1780, height: 1334 },
    { title: "Edit in the same thread", helper: "Image thread → Follow-up edit", description: "Make one focused change and preserve the rest.", caption: "Make one clear change while keeping the rest of the image stable.", src: "/gemini-guides/images-4.png", alt: "Edited portrait of the same product manager with a light blue blazer", width: 1564, height: 1194 },
  ],
  video: [
    { title: "Gemini video generation", helper: "Gemini → Videos", description: "Create a fast single clip from a prompt.", caption: "Use Gemini for a fast single clip or to test an idea before building a longer sequence.", src: "/gemini-guides/video-1.png", alt: "Gemini Create videos screen with prompt and output controls", width: 1460, height: 1254 },
    { title: "Generated video result in Gemini", helper: "Gemini → Generated result", description: "Review the clip and continue refining it.", caption: "Review the generated clip in the same conversation, then continue with another prompt if you want to refine or extend it.", src: "/gemini-guides/video-2.png", alt: "Gemini conversation showing a generated product video", width: 1698, height: 1406 },
    { title: "Google Vids start screen", helper: "Google Vids → New video", description: "Choose the right starting format.", caption: "Start from a prompt, upload, recording, slide deck, avatar or template depending on the video you need.", src: "/gemini-guides/video-3.png", alt: "Google Vids start screen with video creation options", width: 1005, height: 665 },
    { title: "Edit script and customize video", helper: "Google Vids → Help Me Create", description: "Review the outline and narration scene by scene.", caption: "Review the outline and narration scene by scene before creating the draft video.", src: "/gemini-guides/video-4.png", alt: "Google Vids script editor with narration and scene controls", width: 1015, height: 721 },
    { title: "Select an AI avatar", helper: "Google Vids → Avatar", description: "Choose a presenter for the script.", caption: "Choose a presenter, then use the avatar with the script and narration inside the video.", src: "/gemini-guides/video-5.png", alt: "Google Vids avatar selection screen", width: 1012, height: 720 },
    { title: "Google Vids timeline editor", helper: "Google Vids → Edit timeline", description: "Assemble the complete business video.", caption: "Use the timeline to assemble the complete explainer, training or presentation video.", src: "/gemini-guides/video-6.png", alt: "Google Vids timeline editor with presenter and slide scenes", width: 899, height: 812 },
    { title: "Google Flow media library", helper: "Flow → All Media", description: "Organize clips and creative assets.", caption: "Flow keeps generated clips and reusable creative assets together for multi-shot work.", src: "/gemini-guides/video-7.png", alt: "Google Flow media library with generated videos and assets", width: 1261, height: 796 },
    { title: "Google Flow clip editor", helper: "Flow → Open clip", description: "Extend motion or make a focused edit.", caption: "Describe continued motion or a focused edit while keeping important visual details unchanged.", src: "/gemini-guides/video-8.png", alt: "Google Flow clip editor with a video timeline and edit field", width: 1271, height: 811 },
  ],
  insider: [
    { title: "AI Mode in Search", helper: "Google Search → AI Mode", description: "Conversational search and follow-up research.", caption: "AI Mode appears inside Google Search and adds a conversational layer for deeper searches and follow-up questions.", src: "/gemini-guides/insider-1.png", alt: "Google Search showing the AI Mode button", width: 897, height: 358 },
    { title: "Google Labs", helper: "Google Labs → Experiments", description: "Find early Google AI experiments.", caption: "Google Labs is the entry point for experimental products. Availability can change as tools move, evolve, or close.", src: "/gemini-guides/insider-2.png", alt: "Google Labs experiments page", width: 2048, height: 980 },
    { title: "Pomelli", helper: "Google Labs → Pomelli", description: "Create on-brand marketing content.", caption: "Pomelli analyses a brand and then generates marketing content aligned to its tone, values, and visual direction.", src: "/gemini-guides/insider-3.png", alt: "Pomelli generating a Business DNA", width: 2048, height: 961 },
    { title: "Stitch", helper: "Google Labs → Stitch", description: "Turn design briefs into interface concepts.", caption: "Stitch accepts a natural-language design brief and generates interface concepts for mobile or web applications.", src: "/gemini-guides/insider-4.png", alt: "Stitch AI design interface", width: 2048, height: 987 },
    { title: "Opal", helper: "Google Labs → Opal", description: "Build lightweight AI mini-apps.", caption: "Opal uses a visual workflow made of input, generate, and output blocks to build small AI mini-apps.", src: "/gemini-guides/insider-5.png", alt: "Google Opal visual workflow interface", width: 2048, height: 989 },
    { title: "Workspace Studio", helper: "Workspace Studio → Create", description: "Automate Google Workspace processes.", caption: "Workspace Studio provides templates and a prompt box for automating work across Google Workspace applications.", src: "/gemini-guides/insider-6.png", alt: "Google Workspace Studio workflow templates", width: 2048, height: 977 },
    { title: "Verify AI-generated content", helper: "Gemini → Upload media → @Verify AI", description: "Check for Google SynthID provenance.", caption: "The Gemini feature is called Verify AI-generated content. SynthID remains the name of the underlying watermarking technology.", src: "/gemini-guides/insider-7.png", alt: "Gemini Verify AI-generated content prompt", width: 1516, height: 762 },
    { title: "AI avatars", helper: "Gemini → Avatar", description: "Use presenter avatars in supported video tools.", caption: "Avatar features appear inside selected Google product workflows rather than as one standalone application.", src: "/gemini-guides/insider-8.png", alt: "Gemini avatar setup page", width: 2048, height: 977 },
    { title: "Custom app link to Spark", helper: "Gemini Spark → Connected Apps", description: "Connect compatible custom tools and services.", caption: "Spark can connect to compatible custom apps through a configured endpoint, subject to permissions and setup.", src: "/gemini-guides/insider-9.png", alt: "Gemini Spark custom connected app setup", width: 2048, height: 976 },
    { title: "Google Antigravity", helper: "Google Antigravity → Download", description: "Explore advanced agentic development.", caption: "Antigravity is positioned as an advanced agent platform for software engineering workflows.", src: "/gemini-guides/insider-10.png", alt: "Google Antigravity agent platform landing page", width: 2047, height: 977 },
  ],
};

const HEADERS: Record<GeminiGuideKind, { eyebrow: string; title: string; subtitle: string }> = {
  skills: { eyebrow: "GEMINI SPARK GUIDE", title: "Gemini Skills", subtitle: "Save the rules for recurring work, then let Spark apply them whenever they are needed." },
  notebooks: { eyebrow: "AI RESEARCH AND STUDY", title: "Gemini Notebooks", subtitle: "Use your own sources to research, study and create traceable outputs." },
  schedules: { eyebrow: "GEMINI GUIDE", title: "Gemini Schedules", subtitle: "Run recurring and event-based tasks automatically with Gemini Spark." },
  spark: { eyebrow: "GEMINI · AI AGENT", title: "Gemini Spark", subtitle: "A practical guide to Tasks, Skills, Schedules and connected apps." },
  gems: { eyebrow: "REUSABLE AI SETUPS", title: "Gemini Gems", subtitle: "Save instructions and knowledge once, then reuse the same specialist chat whenever the task returns." },
  images: { eyebrow: "GEMINI FEATURE GUIDE", title: "Gemini image generation", subtitle: "Create images from prompts, then refine them through conversational editing in Gemini Apps." },
  video: { eyebrow: "GOOGLE AI VIDEO", title: "Google video generation tools", subtitle: "Gemini for quick clips, Flow for creative control, and Vids for complete business videos." },
  insider: { eyebrow: "GOOGLE AI GUIDE", title: "Google AI tools worth knowing", subtitle: "A practical guide to Search, Labs experiments, automation, verification, connected apps, and agentic development." },
};

function Heading({ number, kicker, title, tone }: { number: string; kicker: string; title: string; tone?: "purple" | "green" | "blue" | "yellow" }) {
  const toneClass = tone ? styles[`claudeNumber${tone[0].toUpperCase()}${tone.slice(1)}`] : "";
  return <div className={styles.claudeSectionHead}><span className={`${styles.claudeSectionNumber} ${toneClass}`}>{number}</span><div><span className={styles.claudeKicker}>{kicker}</span><h2>{title}</h2></div></div>;
}

function Section({ number, kicker, title, tone, children, guide = false }: { number: string; kicker: string; title: string; tone?: "purple" | "green" | "blue" | "yellow"; children: ReactNode; guide?: boolean }) {
  return <section className={`${styles.claudeSection} ${guide ? styles.claudeGuideSection : ""}`}><Heading number={number} kicker={kicker} title={title} tone={tone} />{children}</section>;
}

function FeatureList({ items, warning = false }: { items: string[]; warning?: boolean }) {
  return <ul className={`${styles.chatgptFeatureList} ${warning ? styles.chatgptWarningList : ""}`}>{items.map(item => <li key={item}><span>{warning ? "!" : "✓"}</span><p>{item}</p></li>)}</ul>;
}

function Cards({ items }: { items: { title: string; body: string }[] }) {
  return <div className={styles.chatgptCardGrid}>{items.map(item => <article key={item.title}><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>;
}

function StepGuide({ steps, label }: { steps: GuideStep[]; label: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const step = steps[active];
  useEffect(() => {
    if (!zoomed) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setZoomed(false); };
    document.addEventListener("keydown", close); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", close); document.body.style.overflow = ""; };
  }, [zoomed]);
  return <>
    <div className={styles.claudeGuide}><div className={styles.claudeGuideTabs} role="tablist" aria-label={label}>{steps.map((item, index) => <button className={index === active ? styles.claudeGuideTabActive : styles.claudeGuideTab} key={item.title} type="button" role="tab" aria-selected={index === active} onClick={() => setActive(index)}><span>{index + 1}</span><div><strong>{item.tabTitle ?? item.title}</strong><p>{item.description}</p></div></button>)}</div><div className={styles.claudeScreenshotViewer} role="tabpanel" aria-live="polite"><div className={styles.claudeScreenshotToolbar}><div><strong>{step.title}</strong><span>{step.helper}</span></div><button type="button" onClick={() => setZoomed(true)}>Zoom</button></div><button className={styles.claudeScreenshotButton} type="button" onClick={() => setZoomed(true)} aria-label={`Zoom screenshot: ${step.title}`}><Image key={step.src} className={styles.claudeScreenshotImage} src={step.src} alt={step.alt} width={step.width} height={step.height} sizes="(max-width: 760px) 92vw, 760px" /></button><p className={styles.claudeScreenshotCaption}>{step.caption}</p></div></div>
    {zoomed ? <div className={styles.claudeImageModal} role="dialog" aria-modal="true" aria-label={step.title} onMouseDown={() => setZoomed(false)}><div className={styles.claudeImageModalDialog} onMouseDown={event => event.stopPropagation()}><div className={styles.claudeImageModalHead}><strong>{step.title}</strong><button type="button" onClick={() => setZoomed(false)} aria-label="Close enlarged screenshot">×</button></div><div className={styles.claudeImageModalStage}><Image src={step.src} alt={step.alt} width={step.width} height={step.height} sizes="96vw" /></div></div></div> : null}
  </>;
}

function CopyPrompt({ title, prompt }: { title: string; prompt: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() { try { await navigator.clipboard.writeText(prompt); setStatus("copied"); } catch { setStatus("failed"); } window.setTimeout(() => setStatus("idle"), 1800); }
  return <div className={styles.claudePromptCard}><div><strong>{title}</strong><button type="button" onClick={() => void copy()}>{status === "copied" ? "Copied" : status === "failed" ? "Select and copy" : "Copy prompt"}</button></div><pre>{prompt}</pre></div>;
}

function Header({ kind }: { kind: GeminiGuideKind }) {
  const header = HEADERS[kind];
  return <><Link href="/ask-ai?tool=gemini" className={styles.claudeBack}>← Back</Link><header className={styles.claudeTitleRow}><div><p className={styles.claudeEyebrow}>{header.eyebrow}</p><h1>{header.title}</h1><p className={styles.claudeSubtitle}>{header.subtitle}</p></div><span className={styles.claudeToolChip}>Gemini</span></header></>;
}

function Cta({ count, workflowsHref, heading, description }: Pick<Props, "count" | "workflowsHref"> & { heading: string; description: string }) {
  return <section className={styles.claudeCta}><span>→</span><div><small>RECOMMENDED STARTING POINT</small><h3>{heading}</h3><p>{description}</p></div><Link href={workflowsHref}>Explore workflows →{typeof count === "number" ? ` (${count})` : ""}</Link></section>;
}

const SKILL_PROMPT = "Create a skill based on these instructions: summarize my unread emails from the last 24 hours into a table with columns Sender, Subject, Action Needed, ignoring anything from newsletters or no-reply addresses.";
const GEM_PROMPT = `Role: You are a company policy expert.\n\nInstructions:\nAnswer employee questions using only the uploaded policy document.\n- Give a clear, direct answer in simple language.\n- Refer to the relevant policy section, clause or page when it is available.\n- Do not add rules, exceptions or interpretations that are not stated in the document.\n- If the answer is not available in the uploaded policy, say: “This information is not covered in the uploaded policy. Please check with HR or the relevant policy owner.”\n- If the question is unclear, ask one clarifying question before answering.`;
const NOTEBOOK_PROMPT = "Summarize the key arguments in this source and generate 5 quiz questions to test my understanding.";
const SCHEDULE_PROMPT = "Check [a specific Google Sheet link] hourly. If a new row has been added, send me an email summarizing it.";
const IMAGE_PROMPT = "Create a photorealistic waist-up portrait of a confident product manager in a modern office. Style: clean, premium, soft background blur, centered framing. Details: navy blazer, warm studio lighting, subtle laptop glow. Keep the face and hairstyle consistent in any edits.";
const VIDEO_PROMPT = "A tech founder in a navy blazer, presenting confidently in a glass-walled office overlooking a city skyline. Slow forward dolly shot, warm golden-hour light. Keep her face and blazer consistent throughout.";

function Skills({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  return <>
    <section className={styles.claudeIntro}><div className={styles.claudeIntroCopy}><span className={styles.claudeIntroIcon}>✦</span><div><span className={styles.claudeKicker}>THE SIMPLE VERSION</span><h2>A Skill tells Spark how to do recurring work</h2><p>It stores your format, tone, rules and sources, so you do not have to repeat the same guidance in every prompt.</p></div></div><aside className={styles.claudeComparisonNote}><span>Reusable method</span><strong>Spark can apply a relevant Skill automatically, or you can call one directly.</strong></aside></section>
    <div className={styles.chatgptExamplePair}><Section number="1" kicker="WHAT IT IS" title="Reusable instructions saved inside Gemini Spark"><p className={styles.claudeSectionCopy}>Spark can apply a relevant Skill automatically, or you can call one directly when you want the same method used again.</p></Section><Section number="2" kicker="WHAT IT SOLVES" title="Stop rebuilding the same instructions" tone="purple"><FeatureList items={["Keep the same format, tone and rules across repeated work.", "Save reliable instructions once instead of rebuilding the prompt.", "Combine a recurring task with a consistent method."]} /></Section></div>
    <Section number="3" kicker="WHAT IT CAN DO" title="Use the same working method across repeated tasks" tone="green"><Cards items={[{ title: "Repeat work", body: "Use Skills for inbox triage, writing help, report formatting and similar repeat work." }, { title: "Compose workflows", body: "A Skill can reference another Skill, allowing complex workflows to share instructions." }, { title: "Apply when relevant", body: "Spark can recognize a relevant Skill, or you can select one directly." }]} /></Section>
    <Section number="4" kicker="SET UP AND USE" title="Create it from the Skills page, then call it inside a task" tone="blue"><FeatureList items={["Create with Gemini by describing the recurring task.", "Create manually with a name, description and instructions.", "Upload a folder containing SKILL.md.", "Create one mid-task by asking Gemini to save the instructions as a Skill."]} /><div className={styles.chatgptNotice}><p>On gemini.google.com or the Gemini app, switch to Spark and open Skills. Type / in a Spark task to call a saved Skill.</p></div></Section>
    <Section number="5" kicker="SCREEN WALKTHROUGH" title="Where to create, manage and select Skills" guide><StepGuide steps={STEPS.skills} label="Gemini Skills screenshots" /></Section>
    <Section number="6" kicker="STRENGTHS AND LIMITATIONS" title="What to know before relying on Skills" tone="purple"><div className={styles.chatgptExamplePair}><article><h3>Strengths</h3><FeatureList items={["Keeps repeated work consistent.", "Can be selected directly or applied automatically.", "Can reference other Skills and be exported as a Markdown file."]} /></article><article><h3>Limitations</h3><FeatureList warning items={["Availability depends on Spark access and account eligibility.", "Connected-app permissions still control what information a Skill can use.", "Review the first results before automating a new Skill."]} /></article></div></Section>
    <Section number="7" kicker="TRY IT YOURSELF" title="Create an unread-email triage Skill" tone="green"><CopyPrompt title="Unread-email triage Skill" prompt={SKILL_PROMPT} /><div className={styles.chatgptPlanStrip}><article><strong>1 · Create</strong><p>Paste the prompt into a Spark task and let Gemini save the Skill.</p></article><article><strong>2 · Start again</strong><p>Open a new Spark task after the Skill is saved.</p></article><article><strong>3 · Run</strong><p>Type /, select the Skill and test it on your unread emails.</p></article></div></Section>
    <Cta count={count} workflowsHref={workflowsHref} heading="Explore Gemini Skills workflows" description="Use the guided unread-email workflow to create and test your first Skill." />
  </>;
}

function Gems({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  return <>
    <section className={styles.claudeIntro}><div className={styles.claudeIntroCopy}><span className={styles.claudeIntroIcon}>✦</span><div><span className={styles.claudeKicker}>SIMPLE VERSION</span><h2>A saved, reusable custom chat setup inside Gemini</h2><p>It stores instructions and can hold files as a knowledge base, so the same specialist is one click away.</p></div></div><aside className={styles.claudeComparisonNote}><span>Why it matters</span><strong>Reuse one reliable setup instead of rebuilding context each time.</strong></aside></section>
    <Section number="1" kicker="BUILDING BLOCKS" title="What goes inside"><Cards items={[{ title: "Instructions or prompt", body: "The core behaviour, role and output rules." }, { title: "Uploaded files", body: "Device files or Google Drive files used as knowledge." }, { title: "Notebook source", body: "An optional Notebook can ground a personal, unshared Gem." }, { title: "Premade Gems", body: "Google provides ready-made Gems when you do not need to build from scratch." }]} /></Section>
    <Section number="2" kicker="ACCESS AND SETUP" title="Where to find and set it up" tone="purple"><p className={styles.claudeSectionCopy}>Create and edit Gems in the Gemini web app through Gem Manager. Add a name, description, instructions and knowledge files. Full creation access depends on plan and rollout.</p></Section>
    <Section number="3" kicker="SCREEN WALKTHROUGH" title="Find, build and manage a Gem" tone="green" guide><StepGuide steps={STEPS.gems} label="Gemini Gems screenshots" /></Section>
    <Section number="4" kicker="COLLABORATION" title="Sharing" tone="blue"><div className={styles.chatgptExamplePair}><article><h3>How sharing works</h3><FeatureList items={["Share by email invite or link.", "Give recipients use or edit access.", "Edit access allows changes to instructions and files."]} /></article><article><h3>Storage and restrictions</h3><FeatureList warning items={["Owned Gems appear in a Gemini Gems Drive folder.", "A Gem using a Notebook as knowledge cannot be shared.", "Workspace admins can control Gem sharing organization-wide."]} /></article></div></Section>
    <div className={styles.chatgptExamplePair}><Section number="5" kicker="GOOD FIT" title="Strengths"><FeatureList items={["One-click reuse instead of rebuilding context.", "Can work as a shared team asset.", "Premade Gems are available out of the box."]} /></Section><Section number="6" kicker="BOUNDARIES" title="Limitations" tone="purple"><FeatureList warning items={["Sharing depends on account type and rollout.", "Notebook-sourced knowledge blocks sharing.", "A Gem is prompt plus files, not a multi-step automation framework."]} /></Section></div>
    <Section number="7" kicker="PRACTICE ACTIVITY" title="Try it yourself" tone="green"><p className={styles.claudeSectionCopy}>Upload a company policy as the Gem’s knowledge source, then use this instruction.</p><CopyPrompt title="Company policy expert" prompt={GEM_PROMPT} /></Section>
    <Cta count={count} workflowsHref={workflowsHref} heading="Explore Gemini Gems workflows" description="Use the guided policy Q&A activity to build and test your first reusable Gem." />
  </>;
}

function Notebooks({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  return <>
    <section className={styles.claudeIntro}><div className={styles.claudeIntroCopy}><span className={styles.claudeIntroIcon}>▤</span><div><span className={styles.claudeKicker}>1 · WHAT IT IS</span><h2>A source-grounded AI research and study workspace</h2><p>Gemini Notebook answers, summarizes and creates outputs using your selected sources, with citations back to them.</p></div></div><aside className={styles.claudeComparisonNote}><span>Simple version</span><strong>Bring the sources; Gemini stays grounded in them.</strong></aside></section>
    <Section number="2" kicker="WHY IT MATTERS" title="What it solves"><div className={styles.chatgptPromptContrast}><article><span>General chatbot</span><p>Answers from broad model knowledge and may not show where each claim came from.</p></article><article><span>Gemini Notebook</span><p>Uses selected sources and cites the supporting material.</p></article></div></Section>
    <Section number="3" kicker="NOTEBOOK CONTENTS" title="What goes inside" tone="purple"><div className={styles.chatgptExamplePair}><article><h3>Sources</h3><FeatureList items={["PDFs, Docs, Sheets, Word, EPUB and images", "Web pages and YouTube videos", "Pasted text and Drive-synced files"]} /></article><article><h3>Studio outputs</h3><FeatureList items={["Audio and Video Overviews", "Study guides, briefings, FAQs and timelines", "Mind maps, infographics and slide decks", "Flashcards, quizzes and data tables"]} /></article></div></Section>
    <Section number="4" kicker="WHERE TO FIND IT" title="Where to find and set it up" tone="green"><p className={styles.claudeSectionCopy}>Access it through Gemini or NotebookLM. Create a new notebook, then use Add in the Sources panel to upload material.</p></Section>
    <Section number="5" kicker="SCREEN WALKTHROUGH" title="Create, ground and explore a Notebook" tone="blue" guide><StepGuide steps={STEPS.notebooks} label="Gemini Notebooks screenshots" /></Section>
    <div className={styles.chatgptExamplePair}><Section number="6" kicker="WHERE IT WORKS WELL" title="Strengths"><FeatureList items={["Citations make claims checkable against the source.", "Flashcards and quizzes track progress across sessions.", "Audio Overviews support interactive questions.", "Notebooks can be shared."]} /></Section><Section number="7" kicker="IMPORTANT CONSTRAINTS" title="Limitations" tone="purple"><FeatureList warning items={["Some video formats are language, age or plan restricted.", "Video generation may take more than 30 minutes.", "Visual artifacts are not always fully editable.", "A Notebook can ground only an unshared Gem."]} /></Section></div>
    <Section number="8" kicker="PRACTICE ACTIVITY" title="Try it yourself" tone="green"><FeatureList items={["Upload one PDF or paste a few pages of notes.", "Ask for a summary and five questions.", "Generate an Audio Overview from the same notebook."]} /><CopyPrompt title="Source-grounded study prompt" prompt={NOTEBOOK_PROMPT} /></Section>
    <Cta count={count} workflowsHref={workflowsHref} heading="Explore Gemini Notebook workflows" description="Open guided workflows for source-grounded research, study and reusable outputs." />
  </>;
}

function Schedules({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  return <>
    <section className={styles.claudeIntro}><div className={styles.claudeIntroCopy}><span className={styles.claudeIntroIcon}>◷</span><div><span className={styles.claudeKicker}>THE SIMPLE VERSION</span><h2>Tell Gemini what should run and when</h2><p>Schedules keeps repeat tasks and event-based checks running in the background.</p></div></div><aside className={styles.claudeComparisonNote}><span>Schedule = when</span><strong>Tasks define what to do; Skills store how to do it.</strong></aside></section>
    <Section number="1" kicker="FEATURE OVERVIEW" title="What it is"><p className={styles.claudeSectionCopy}>Schedules is part of Gemini Spark. It runs a task automatically in the background on a time interval or when a condition is detected.</p></Section>
    <Section number="2" kicker="WHY IT MATTERS" title="What it solves" tone="purple"><FeatureList items={["Run recurring work without reopening Gemini.", "React to a condition such as a delayed flight or a new spreadsheet row.", "Use Gmail, Calendar, Drive and the web when permissions allow."]} /></Section>
    <Section number="3" kicker="AUTOMATION TYPES" title="What it can do" tone="green"><Cards items={[{ title: "Recurring", body: "Every day at 8 AM, provide an AI news update." }, { title: "Event-based", body: "When a flight is delayed, notify me and propose an itinerary update." }, { title: "Combined", body: "Use a Task for what, a Skill for how and a Schedule for when." }]} /></Section>
    <Section number="4" kicker="SETUP WALKTHROUGH" title="Where to find and set it up" tone="blue" guide><p className={styles.claudeSectionCopy}>Open Spark, select Schedules, then create with Gemini or configure a simple interval manually.</p><StepGuide steps={STEPS.schedules} label="Gemini Schedules screenshots" /></Section>
    <Section number="5" kicker="WHAT TO KNOW" title="Strengths, limitations and how to do it well"><div className={styles.chatgptExamplePair}><article><h3>Use it well</h3><FeatureList items={["State the condition and action in one sentence.", "Use Ask Gemini for event-based schedules.", "Pair a Schedule with a Skill when formatting must stay consistent.", "Cloud schedules run while your device is off."]} /></article><article><h3>Limitations</h3><FeatureList warning items={["Scheduled times are approximate.", "Monitors check periodically, not continuously.", "Schedules stop when compute limits are reached.", "Availability depends on account, age and rollout."]} /></article></div></Section>
    <Section number="6" kicker="PRACTICE ACTIVITY" title="Try it yourself" tone="purple"><CopyPrompt title="Google Sheet monitoring schedule" prompt={SCHEDULE_PROMPT} /><p className={styles.claudeSectionCopy}>Set frequency to Hourly and confirm that a notification arrives after the sheet changes.</p></Section>
    <Cta count={count} workflowsHref={workflowsHref} heading="Explore Gemini Schedules workflows" description="Start with the guided Google Sheet monitoring workflow." />
  </>;
}

function Spark({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  return <>
    <section className={styles.claudeIntro}><div className={styles.claudeIntroCopy}><span className={styles.claudeIntroIcon}>✦</span><div><span className={styles.claudeKicker}>1 · WHAT IT IS</span><h2>Google’s personal AI agent</h2><p>Spark runs multi-step tasks across Gmail, Calendar, Drive, Docs, Sheets and the web instead of answering one prompt at a time.</p></div></div><aside className={styles.claudeComparisonNote}><span>Cloud agent</span><strong>Tasks, Skills and Schedules work together in one workspace.</strong></aside></section>
    <Section number="2" kicker="CORE STRUCTURE" title="The three building blocks"><Cards items={[{ title: "Task", body: "The goal Spark should complete." }, { title: "Skill", body: "The saved method, rules or format." }, { title: "Schedule", body: "The time or event trigger that runs the task." }]} /></Section>
    <Section number="3" kicker="BEFORE YOU BEGIN" title="Setup and eligibility" tone="purple"><p className={styles.claudeSectionCopy}>Connect Google Workspace under Settings → Personal Intelligence → Connected Apps. Access depends on plan, country, age and account type.</p></Section>
    <Section number="4" kicker="HOW WORK PROGRESSES" title="Working with Tasks" tone="green"><p className={styles.claudeSectionCopy}>Spark breaks a goal into planned, current and completed steps. Add instructions in the same task thread, follow progress, or take over the browser when input is required.</p></Section>
    <Section number="5" kicker="SCREENSHOT WALKTHROUGH" title="From a task prompt to a completed workflow" tone="blue" guide><StepGuide steps={STEPS.spark} label="Gemini Spark screenshots" /></Section>
    <Section number="6" kicker="CROSS-APP WORK" title="Connect the dots across apps"><p className={styles.claudeSectionCopy}>Spark can combine web research, Calendar context and Workspace files in one request without requiring you to open each app.</p></Section>
    <Section number="7" kicker="CONSISTENT OUTPUT" title="Follow your templates" tone="purple"><p className={styles.claudeSectionCopy}>Point Spark at a saved template and raw material so repeated outputs follow the same structure.</p></Section>
    <div className={styles.chatgptExamplePair}><Section number="8" kicker="REUSE THE METHOD" title="Turn a workflow into a Skill" tone="green"><p className={styles.claudeSectionCopy}>Save a stable workflow as a Skill, invoke it with /, edit it in plain language and export it as Markdown.</p></Section><Section number="9" kicker="RUN IT AUTOMATICALLY" title="Automate with Schedules" tone="blue"><p className={styles.claudeSectionCopy}>Use a time trigger or an event condition so Spark can run the workflow automatically.</p></Section></div>
    <Section number="10" kicker="WORKPLACE USE CASES" title="Real examples"><Cards items={[{ title: "Inbox action system", body: "Label emails, create tasks and events, log bills, draft replies and prepare a daily summary." }, { title: "Receipt logging", body: "Turn receipts added to Drive into structured Sheet rows." }, { title: "Writing in your voice", body: "Learn from past emails to draft new messages in the same style." }]} /><div className={styles.chatgptNotice}><p>Spark runs in the cloud but still asks for approval before sending, deleting or taking other high-stakes actions.</p></div></Section>
    <Cta count={count} workflowsHref={workflowsHref} heading="Explore Gemini Spark workflows" description="Review guided examples for triggers, connected apps and reusable rules." />
  </>;
}

function Images({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  return <>
    <section className={styles.claudeIntro}><div className={styles.claudeIntroCopy}><span className={styles.claudeIntroIcon}>◇</span><div><span className={styles.claudeKicker}>WHAT IT IS</span><h2>Create and edit images in the same conversation</h2><p>Gemini creates images from text and supports conversational, multi-turn editing on the same image.</p></div></div><aside className={styles.claudeComparisonNote}><span>Best habit</span><strong>Make one specific change at a time while keeping everything else stable.</strong></aside></section>
    <Section number="1" kicker="WHICH MODEL TO USE" title="Match the model to the output"><div className={styles.chatgptExamplePair}><article><h3>gemini-3.1-flash-image</h3><p>Fast and lower-cost for drafts, variants and everyday content.</p></article><article><h3>gemini-3-pro-image</h3><p>Higher quality for complex instructions, text rendering and final marketing visuals.</p></article></div></Section>
    <Section number="2" kicker="CHARACTER AND STYLE" title="Keep the workflow stable" tone="purple"><FeatureList items={["Define the character, clothing, framing and lighting in the first prompt.", "Ask Gemini to keep specific details unchanged during edits.", "Reuse the same conversation and references for a consistent series."]} /></Section>
    <Section number="3" kicker="TEXT ON IMAGES" title="Verify text before using the asset" tone="green"><FeatureList warning items={["Text remains difficult for image models.", "State the exact headline, layout and palette.", "Check spelling, spacing and brand details before publishing."]} /></Section>
    <Section number="4" kicker="HOW TO EDIT" title="Use specific, incremental follow-up prompts" tone="blue"><p className={styles.claudeSectionCopy}>Edit a generated image, upload one and request changes, or combine multiple uploads. Keep each follow-up focused.</p></Section>
    <Section number="5" kicker="SCREENSHOT WALKTHROUGH" title="From image creation to a multi-turn edit" guide><StepGuide steps={STEPS.images} label="Gemini image generation screenshots" /></Section>
    <Section number="6" kicker="PROMPT FRAMEWORK" title="Build the prompt in six parts" tone="purple"><div className={styles.chatgptChecklist}>{["Purpose", "Subject", "Setting", "Style", "Composition", "Constraints"].map((item, index) => <article key={item}><span>{index + 1}</span><p>{item}</p></article>)}</div></Section>
    <Section number="7" kicker="TRY IT YOURSELF" title="Generate a portrait, then edit it twice" tone="green"><CopyPrompt title="Portrait prompt" prompt={IMAGE_PROMPT} /><CopyPrompt title="Follow-up edit" prompt="Change the jacket from navy to charcoal, keep everything else the same." /></Section>
    <Cta count={count} workflowsHref={workflowsHref} heading="Explore Gemini image generation workflows" description="Practise creating and refining images through guided workflows." />
  </>;
}

function Video({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  return <>
    <section className={styles.claudeIntro}><div className={styles.claudeIntroCopy}><span className={styles.claudeIntroIcon}>▶</span><div><span className={styles.claudeKicker}>WHAT IT IS</span><h2>Three separate tools, built for different video jobs</h2><p>Gemini makes quick clips, Flow provides shot-level creative control, and Vids assembles complete business videos.</p></div></div><aside className={styles.claudeComparisonNote}><span>Choose by output</span><strong>Single clip → Gemini · Creative sequence → Flow · Complete business video → Vids</strong></aside></section>
    <Section number="1" kicker="CHOOSE BY OUTPUT" title="Which one to use"><Cards items={[{ title: "Gemini", body: "Fast single clip or quick idea test." }, { title: "Google Flow", body: "Camera control, scene extensions and consistent characters across shots." }, { title: "Google Vids", body: "Finished explainer, training or presentation video with narration." }]} /></Section>
    <Section number="2" kicker="UNDER THE HOOD" title="Models running underneath" tone="purple"><Cards items={[{ title: "Veo 3 / 3.1", body: "Photorealistic output, higher resolutions and synchronized dialogue, effects and ambience." }, { title: "Gemini Omni Flash", body: "Fast text-to-video, image-to-video and conversational editing." }, { title: "Imagen 3 and Lyria", body: "Reference imagery, keyframes and background music for supported workflows." }]} /></Section>
    <Section number="3" kicker="CREATIVE CONTROL" title="Key features by tool" tone="green"><div className={styles.chatgptExamplePair}><article><h3>Flow</h3><p>Extend clips, use start and end keyframes, add reference ingredients and build scenes in a storyboard.</p></article><article><h3>Vids</h3><p>Draft scripts, narration and scenes, add presenters and Veo clips, then assemble the result on a timeline.</p></article></div></Section>
    <Section number="4" kicker="INTERFACE WALKTHROUGH" title="See where each tool fits" tone="blue" guide><StepGuide steps={STEPS.video} label="Google video generation screenshots" /></Section>
    <Section number="5" kicker="OUTPUT SETTINGS" title="Technical specs"><FeatureList items={["Choose aspect ratio before generating.", "Keep one main action in each short clip.", "Use reference images and keyframes when consistency matters.", "Review dialogue, motion and transitions before assembling a longer video."]} /></Section>
    <Section number="6" kicker="PLAN ACCESS" title="Pricing" tone="purple"><FeatureList items={["Gemini offers limited trial video access; paid plans raise limits.", "Flow uses daily or plan-based generation credits.", "Vids includes limited personal generations and higher Workspace allowances."]} /></Section>
    <Section number="7" kicker="PROMPT STRUCTURE" title="Prompt formula" tone="green"><div className={styles.chatgptFlowLine}>{["Subject", "Action", "Setting", "Camera", "Lighting", "Consistency"].map(item => <div key={item}><strong>{item}</strong></div>)}</div></Section>
    <Section number="8" kicker="BETTER RESULTS" title="Practical tips" tone="blue"><FeatureList items={["Put exact spoken dialogue in quotation marks.", "When extending, describe continued motion instead of adding a new scene.", "State what should change and what must remain unchanged.", "Lock the aspect ratio before generating.", "Keep one main action per short clip."]} /></Section>
    <Section number="9" kicker="TRY IT YOURSELF" title="Generate, then extend the same clip"><CopyPrompt title="First clip" prompt={VIDEO_PROMPT} /><CopyPrompt title="Extend" prompt="She continues speaking and gestures toward the skyline." /></Section>
    <Cta count={count} workflowsHref={workflowsHref} heading="Explore Google video generation workflows" description="Open guided workflows for planning, generating and extending AI video clips." />
  </>;
}

const AI_TOOLS = [
  ["AI Mode in Search", "Conversational Google Search for follow-ups, comparisons and deeper research."],
  ["Google Labs", "The experiment playground where early Google AI products appear."],
  ["Pomelli", "On-brand marketing ideas, social posts and creative assets."],
  ["Stitch", "Natural-language interface concepts and early UI direction."],
  ["Opal", "Lightweight AI mini-apps and focused internal workflows."],
  ["Workspace Studio", "No-code and low-code automation across Google Workspace."],
  ["Verify AI-generated content", "SynthID-based provenance checks for supported AI media."],
  ["AI avatars", "Presenter-style avatars inside selected Google video workflows."],
  ["Custom app link to Spark", "Connect compatible internal tools, data and services."],
  ["Antigravity", "Advanced agentic development across editor, terminal and browser."],
];

function Insider({ count, workflowsHref }: Pick<Props, "count" | "workflowsHref">) {
  return <>
    <section className={styles.claudeIntro}><div className={styles.claudeIntroCopy}><span className={styles.claudeIntroIcon}>✦</span><div><span className={styles.claudeKicker}>THE ECOSYSTEM</span><h2>One ecosystem, different jobs</h2><p>Google’s AI tools span search, experiments, design, marketing, mini-apps, automation, verification, connected apps and agentic development.</p></div></div><aside className={styles.claudeComparisonNote}><span>Choose by task</span><strong>Start with the job you need done, then choose the Google surface built for it.</strong></aside></section>
    <section className={styles.claudeSection}><div className={styles.chatgptFiveGrid}>{AI_TOOLS.map(([title, body], index) => <article key={title}><span>{index + 1}</span><strong>{title}</strong><p>{body}</p></article>)}</div></section>
    <Section number="11" kicker="SCREENSHOTS" title="Screenshots from across Google’s AI ecosystem" tone="blue" guide><StepGuide steps={STEPS.insider} label="Google AI tools screenshots" /></Section>
    <div className={styles.chatgptNotice}><strong>Expect access and availability to vary</strong><p>Several tools are Labs experiments, previews, plan-dependent Workspace features or product-specific capabilities. Availability can differ by account, region and rollout stage.</p></div>
    <Cta count={count} workflowsHref={workflowsHref} heading="Explore Gemini workflows" description="Open guided workflows across Gemini, Spark, Notebooks and Google’s creative tools." />
  </>;
}

export default function GeminiGuide({ kind, count, workflowsHref }: Props) {
  const content = kind === "skills" ? <Skills count={count} workflowsHref={workflowsHref} />
    : kind === "notebooks" ? <Notebooks count={count} workflowsHref={workflowsHref} />
    : kind === "schedules" ? <Schedules count={count} workflowsHref={workflowsHref} />
    : kind === "spark" ? <Spark count={count} workflowsHref={workflowsHref} />
    : kind === "gems" ? <Gems count={count} workflowsHref={workflowsHref} />
    : kind === "images" ? <Images count={count} workflowsHref={workflowsHref} />
    : kind === "video" ? <Video count={count} workflowsHref={workflowsHref} />
    : <Insider count={count} workflowsHref={workflowsHref} />;
  return <main className={`${styles.page} ${styles.claudePage} ${styles.chatgptPage} ${styles.geminiPage}`}><Header kind={kind} />{content}</main>;
}
