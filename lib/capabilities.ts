/**
 * Content for the participant-facing Capability and Provider info pages.
 * Capabilities map 1:1 to `ACTIVITY_CONTENT_TYPES`; providers map 1:1 to the
 * four tools shown in the sidebar's "Unique to each" section. Tool-specific
 * capability names (Custom GPTs, Gems, Cowork, Codex, ...) are not separate
 * content types — they're per-(content_type, tool) page content, mirrored
 * verbatim from the reference design (ai_practice_lab_complete_responsive_v83.html).
 */
import { ACTIVITY_CONTENT_TYPES, type ActivityContentType } from "@/lib/contentTypes";

export type CapabilitySlug =
  | "skills"
  | "projects"
  | "vibe-coding"
  | "scheduled-actions"
  | "ai-agents"
  | "coding-agents";

export type ProviderTool = "chatgpt" | "claude" | "gemini" | "copilot";

export const PROVIDER_TOOLS: ProviderTool[] = ["chatgpt", "claude", "gemini", "copilot"];

function slugifyContentType(contentType: string): string {
  return contentType.trim().toLowerCase().replace(/\s+/g, "-");
}

export const CONTENT_TYPE_TO_SLUG: Record<ActivityContentType, CapabilitySlug> = Object.fromEntries(
  ACTIVITY_CONTENT_TYPES.map((contentType) => [contentType, slugifyContentType(contentType) as CapabilitySlug]),
) as Record<ActivityContentType, CapabilitySlug>;

export const SLUG_TO_CONTENT_TYPE: Record<string, ActivityContentType> = Object.fromEntries(
  ACTIVITY_CONTENT_TYPES.map((contentType) => [slugifyContentType(contentType), contentType]),
);

export function isCapabilitySlug(value: string): value is CapabilitySlug {
  return value in SLUG_TO_CONTENT_TYPE;
}

export type InfoCard = {
  icon: string;
  heading: string;
  body?: string;
  steps?: string[];
  list?: string[];
};

export type CapabilityDef = {
  contentType: ActivityContentType;
  mark: string;
  badge: string;
  subtitle: string;
  cards: InfoCard[];
};

/** Generic (all-tools) capability content — used only by the plain /capabilities/[slug] page. */
export const CAPABILITIES: Record<CapabilitySlug, CapabilityDef> = {
  skills: {
    contentType: "Skills",
    mark: "✦",
    badge: "Reusable",
    subtitle: "Saved instructions your AI applies automatically once a matching task appears.",
    cards: [
      {
        icon: "✦",
        heading: "What are Skills",
        body: "A Skill is a set of instructions you write once — Claude calls them Skills, ChatGPT calls them Custom GPTs, Gemini calls them Gems — so the AI follows the same steps every time a matching task comes up, instead of you re-explaining it in every chat.",
      },
      {
        icon: "＋",
        heading: "Build one in 4 steps",
        steps: [
          "Describe what the skill does and when it should be used.",
          "Write the step-by-step instructions to follow.",
          "Add an example so tone and format are unambiguous.",
          "Save it — the AI applies it automatically next time a matching request appears.",
        ],
      },
      {
        icon: "✎",
        heading: "Good use cases",
        list: [
          "A recurring report or summary that should always follow the same structure.",
          "A writing voice or tone you want kept consistent.",
          "A repeatable analysis you run on new data each time.",
        ],
      },
    ],
  },
  projects: {
    contentType: "Projects",
    mark: "▱",
    badge: "Organize work",
    subtitle: "Keep files, instructions and context together so you stop re-explaining background in every new chat.",
    cards: [
      {
        icon: "▱",
        heading: "What are Projects",
        body: "A Project is a dedicated workspace — files, instructions and chat history live together — so every conversation inside it already has the context it needs.",
      },
      {
        icon: "＋",
        heading: "Set one up",
        steps: [
          "Create a project and give it a clear name.",
          "Add the reference files, briefs or data it should know about.",
          "Write standing instructions for how work in this project should be done.",
          "Start chatting inside it — no more re-uploading context each time.",
        ],
      },
      {
        icon: "✎",
        heading: "Good use cases",
        list: [
          "An onboarding hub for a new hire's role-specific files.",
          "A vendor or proposal evaluation workspace.",
          "An ongoing client or account workspace that accumulates context over time.",
        ],
      },
    ],
  },
  "vibe-coding": {
    contentType: "Vibe coding",
    mark: "</>",
    badge: "Build",
    subtitle: "Describe what you want to build in plain language and let AI write, run and refine the code.",
    cards: [
      {
        icon: "</>",
        heading: "What is vibe coding",
        body: "Vibe coding means describing an app, dashboard or website in plain language and iterating with the AI on what comes back, instead of writing code by hand line by line.",
      },
      {
        icon: "→",
        heading: "How it works",
        steps: [
          "Describe the app or page you want in plain language.",
          "Let the AI generate a first working version.",
          "Point out what's wrong or what to change next.",
          "Repeat until it does what you need, then publish or export it.",
        ],
      },
      {
        icon: "✎",
        heading: "Good use cases",
        list: [
          "A quick internal dashboard from a spreadsheet.",
          "A simple interactive tool or calculator to share with a team.",
          "A landing page or small website without a dev handoff.",
        ],
      },
    ],
  },
  "scheduled-actions": {
    contentType: "Scheduled actions",
    mark: "◷",
    badge: "Automate",
    subtitle: "Set something up once and have it run automatically — a morning brief, a weekly check, a recurring task.",
    cards: [
      {
        icon: "◷",
        heading: "What are scheduled actions",
        body: "Instead of asking for the same thing every day, you set the prompt, the schedule and the trigger once — the AI runs it automatically and delivers the result.",
      },
      {
        icon: "＋",
        heading: "Set one up",
        steps: [
          "Write the prompt exactly as you'd want it run every time.",
          "Choose how often it should run and at what time.",
          "Confirm where the result should land — chat, email or message.",
          "Let it run, and check back only when you need to adjust it.",
        ],
      },
      {
        icon: "✎",
        heading: "Good use cases",
        list: [
          "A morning brief that pulls calendar and email data.",
          "A weekly summary of action items from a shared inbox.",
          "A recurring check against a report or dataset.",
        ],
      },
    ],
  },
  "ai-agents": {
    contentType: "AI agents",
    mark: "◇",
    badge: "Delegate work",
    subtitle: "Give an agent a goal and connected tools, and it completes multi-step work on its own.",
    cards: [
      {
        icon: "◇",
        heading: "What are AI agents",
        body: "An agent doesn't just answer — it takes a goal, plans the steps, and uses connected tools or apps to carry them out, checking in only when it needs a decision from you.",
      },
      {
        icon: "→",
        heading: "How it works",
        steps: [
          "Give the agent a clear goal and any limits it should respect.",
          "Connect the apps or data it needs access to.",
          "Let it plan and execute the steps.",
          "Review the outcome and correct course if needed.",
        ],
      },
      {
        icon: "✎",
        heading: "Good use cases",
        list: [
          "Monitoring a shared inbox and drafting responses.",
          "Updating a CRM after a call or meeting.",
          "Running a browser task end-to-end, like filling out a form.",
        ],
      },
    ],
  },
  "coding-agents": {
    contentType: "Coding agents",
    mark: "</>",
    badge: "Ship code",
    subtitle: "AI that writes, tests and ships code as an active collaborator, not just a chat answering questions.",
    cards: [
      {
        icon: "</>",
        heading: "What are coding agents",
        body: "A coding agent works inside your codebase or a dedicated environment — it can read files, write code, run it, and iterate — rather than just returning a snippet for you to paste in.",
      },
      {
        icon: "→",
        heading: "How it works",
        steps: [
          "Point it at a repo, task or bug.",
          "Let it plan the change and make the edits.",
          "Review the diff and the running output.",
          "Ask for revisions, or approve and merge.",
        ],
      },
      {
        icon: "✎",
        heading: "Good use cases",
        list: [
          "Fixing a well-described bug end-to-end.",
          "Scaffolding a new feature from a spec.",
          "Reviewing a pull request for issues before a human does.",
        ],
      },
    ],
  },
};

/** The "What it does / Use it well" tool-specific page, plus its featured CTA card copy. */
export type ToolPageDef = {
  title: string;
  eyebrow: string;
  subtitle: string;
  badge: string;
  cards: InfoCard[];
  cta: { heading: string; description: string };
};

/** Verbatim per-(capability, tool) page content, mirrored from the reference design. */
export const CAPABILITY_TOOL_PAGES: Record<CapabilitySlug, Record<ProviderTool, ToolPageDef>> = {
  skills: {
    chatgpt: {
      title: "Custom GPTs",
      eyebrow: "Skills · ChatGPT",
      subtitle: "Build a reusable ChatGPT for a focused task, knowledge base or working style.",
      badge: "ChatGPT",
      cards: [
        {
          icon: "◇",
          heading: "What it does",
          list: [
            "Combines saved instructions, uploaded knowledge and selected tools.",
            "Creates a repeatable assistant for one task instead of rewriting the same prompt.",
            "Can be kept private, shared with a team or published when appropriate.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "Give it one clear job and define the expected output.",
            "Add examples for tone, structure and edge cases.",
            "Test it with weak, incomplete and conflicting inputs before sharing.",
          ],
        },
      ],
      cta: {
        heading: "Explore Custom GPT workflows",
        description: "Open guided workflows for building, testing and improving task-specific GPTs.",
      },
    },
    claude: {
      title: "Claude Skills",
      eyebrow: "Skills · Claude",
      subtitle: "Save detailed instructions Claude can apply whenever a matching task appears.",
      badge: "Claude",
      cards: [
        {
          icon: "✦",
          heading: "What it does",
          list: [
            "Stores repeatable procedures as reusable instructions.",
            "Lets Claude recognise when a skill is relevant and follow the defined method.",
            "Supports examples, formatting rules and reference material.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "Describe exactly when the skill should and should not be used.",
            "Write the process as observable steps rather than broad principles.",
            "Add examples of acceptable and unacceptable output.",
          ],
        },
      ],
      cta: {
        heading: "Explore Claude Skills workflows",
        description: "Practice creating reusable skills for writing, analysis and branded outputs.",
      },
    },
    gemini: {
      title: "Gemini Gems",
      eyebrow: "Skills · Gemini",
      subtitle: "Create a customised Gemini assistant with a fixed role, method and response style.",
      badge: "Gemini",
      cards: [
        {
          icon: "✦",
          heading: "What it does",
          list: [
            "Saves a specialised set of instructions for a recurring task.",
            "Can use uploaded reference files and a consistent persona.",
            "Works well for coaching, review, writing and structured decision support.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "Define the task, audience and output format in the Gem instructions.",
            "Use reference files only when they materially improve the answer.",
            "Test whether the Gem stays within scope when users ask unrelated questions.",
          ],
        },
      ],
      cta: {
        heading: "Explore Gemini Gems workflows",
        description: "Open guided workflows for creating and pressure-testing task-specific Gems.",
      },
    },
    copilot: {
      title: "Copilot Agents",
      eyebrow: "Skills · Copilot",
      subtitle: "Create a focused Copilot experience around selected knowledge, instructions and actions.",
      badge: "Copilot",
      cards: [
        {
          icon: "⬡",
          heading: "What it does",
          list: [
            "Creates a reusable assistant for a defined business purpose.",
            "Can ground answers in approved Microsoft 365 or organisational sources.",
            "May include actions and workflows when configured by the organisation.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "Keep the use case narrow enough to test reliably.",
            "Limit knowledge sources to the files and sites the agent genuinely needs.",
            "Define hand-off rules for requests requiring human approval.",
          ],
        },
      ],
      cta: {
        heading: "Explore Copilot Agent workflows",
        description: "See guided workflows for creating focused assistants and app-connected agents.",
      },
    },
  },
  projects: {
    chatgpt: {
      title: "ChatGPT Projects",
      eyebrow: "Projects · ChatGPT",
      subtitle: "Keep related chats, files and project instructions together in one workspace.",
      badge: "ChatGPT",
      cards: [
        {
          icon: "▱",
          heading: "What it does",
          list: [
            "Groups ongoing chats and files around one body of work.",
            "Applies project-level instructions without repeating them in every chat.",
            "Makes it easier to return to long-running work with the right context.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "Create separate Projects for clearly different outcomes or audiences.",
            "Keep the project instructions short and specific.",
            "Remove outdated files so old information does not shape new answers.",
          ],
        },
      ],
      cta: {
        heading: "Explore ChatGPT Project workflows",
        description: "Open guided workflows for organising files, context and repeatable work in Projects.",
      },
    },
    claude: {
      title: "Claude Projects",
      eyebrow: "Projects · Claude",
      subtitle: "Create a focused Claude workspace with shared files and instructions for ongoing work.",
      badge: "Claude",
      cards: [
        {
          icon: "▱",
          heading: "What it does",
          list: [
            "Keeps reference files and project instructions available across project chats.",
            "Reduces the need to re-upload documents or restate working rules.",
            "Separates one workstream from unrelated conversations.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "Use project instructions for stable rules, not temporary requests.",
            "Organise source files before uploading them.",
            "Start new chats for distinct tasks while keeping the shared project context.",
          ],
        },
      ],
      cta: {
        heading: "Explore Claude Project workflows",
        description: "Practice setting up reusable context for ongoing projects and document work.",
      },
    },
    gemini: {
      title: "NotebookLM",
      eyebrow: "Projects · Gemini",
      subtitle: "Build a source-grounded notebook that answers and creates outputs from selected material.",
      badge: "Gemini",
      cards: [
        {
          icon: "▤",
          heading: "What it does",
          list: [
            "Creates a dedicated workspace around documents, links and other approved sources.",
            "Answers with citations back to the material in the notebook.",
            "Can turn the same sources into summaries, study guides, audio, video or slide outputs.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "Use one notebook for one coherent subject or project.",
            "Review source quality before relying on generated outputs.",
            "Ask for evidence and citations when comparing claims across documents.",
          ],
        },
      ],
      cta: {
        heading: "Explore NotebookLM workflows",
        description: "Open guided workflows for knowledge bases, source research and grounded outputs.",
      },
    },
    copilot: {
      title: "Copilot Pages",
      eyebrow: "Projects · Copilot",
      subtitle: "Turn Copilot responses into an editable shared page for continuing work with others.",
      badge: "Copilot",
      cards: [
        {
          icon: "▤",
          heading: "What it does",
          list: [
            "Moves useful AI output from chat into a persistent editable canvas.",
            "Supports collaborative refinement instead of copying content into another tool.",
            "Keeps supporting links and generated material together.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "Use Pages when an answer needs review, editing or shared ownership.",
            "Structure the page around decisions and actions, not a raw chat transcript.",
            "Verify generated facts before the page becomes a team reference.",
          ],
        },
      ],
      cta: {
        heading: "Explore Copilot project workflows",
        description: "See guided workflows for shared workspaces, reusable knowledge and Microsoft 365 context.",
      },
    },
  },
  "vibe-coding": {
    chatgpt: {
      title: "ChatGPT Canvas",
      eyebrow: "Vibe coding · ChatGPT",
      subtitle: "Work beside ChatGPT in an editable canvas for code, documents and iterative improvements.",
      badge: "ChatGPT",
      cards: [
        {
          icon: "</>",
          heading: "What it does",
          list: [
            "Places generated code or writing in an editable workspace beside the conversation.",
            "Supports targeted revisions without regenerating the entire output.",
            "Helps users review, debug and refine longer work visually.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "Start with the smallest working version of the app or document.",
            "Request one functional change at a time and test after each change.",
            "Keep a copy of stable code before making structural revisions.",
          ],
        },
      ],
      cta: {
        heading: "Explore ChatGPT building workflows",
        description: "Open guided workflows for dashboards, interactive apps and AI-assisted coding.",
      },
    },
    claude: {
      title: "Claude Artifacts",
      eyebrow: "Vibe coding · Claude",
      subtitle: "Build and preview code, documents and interactive tools in a live pane beside Claude.",
      badge: "Claude",
      cards: [
        {
          icon: "</>",
          heading: "What it does",
          list: [
            "Renders code and interactive outputs while the conversation remains visible.",
            "Supports quick iteration through natural-language changes.",
            "Can produce shareable prototypes without starting in a traditional coding environment.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "Define the user, core action and required data before asking for the interface.",
            "Test buttons, states and responsive behaviour after each major change.",
            "Separate design feedback from functional changes to reduce regressions.",
          ],
        },
      ],
      cta: {
        heading: "Explore Claude Artifacts workflows",
        description: "Build, test and publish guided interactive-app workflows with Artifacts.",
      },
    },
    gemini: {
      title: "Google AI Studio",
      eyebrow: "Vibe coding · Gemini",
      subtitle: "Prototype Gemini-powered experiences, prompts and interfaces in a browser-based workspace.",
      badge: "Gemini",
      cards: [
        {
          icon: "✦",
          heading: "What it does",
          list: [
            "Lets users test Gemini models, multimodal inputs and structured prompts.",
            "Supports rapid prototypes before moving to production code.",
            "Can generate and refine app experiences connected to Gemini capabilities.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "Begin with a clear input-output contract and sample data.",
            "Test multiple realistic examples before adjusting the interface.",
            "Review API, privacy and deployment requirements before production use.",
          ],
        },
      ],
      cta: {
        heading: "Explore Google AI Studio workflows",
        description: "Open guided workflows for live dashboards and Gemini-powered prototypes.",
      },
    },
    copilot: {
      title: "GitHub Spark",
      eyebrow: "Vibe coding · Copilot",
      subtitle: "Create and refine lightweight applications through prompts within the Microsoft and GitHub ecosystem.",
      badge: "Copilot",
      cards: [
        {
          icon: "◇",
          heading: "What it does",
          list: [
            "Turns a product idea into an editable application prototype.",
            "Combines conversational changes with a live preview.",
            "Supports moving from a simple build toward a shareable app.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "Write the first prompt around one user problem and one core workflow.",
            "Use realistic sample data to test the experience.",
            "Check authentication, data storage and permissions before wider sharing.",
          ],
        },
      ],
      cta: {
        heading: "Explore Microsoft building workflows",
        description: "See guided workflows for AI-assisted applications, websites and interactive tools.",
      },
    },
  },
  "scheduled-actions": {
    chatgpt: {
      title: "ChatGPT Scheduled Tasks",
      eyebrow: "Scheduled actions · ChatGPT",
      subtitle: "Ask ChatGPT to deliver recurring briefs, reminders or monitoring outputs on a schedule.",
      badge: "ChatGPT",
      cards: [
        {
          icon: "◷",
          heading: "What it does",
          list: [
            "Runs a saved prompt at a selected time or frequency.",
            "Useful for recurring summaries, reminders and lightweight monitoring.",
            "Delivers the result back through ChatGPT notifications.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "State the frequency, timezone and expected output clearly.",
            "Define what should happen when there is nothing meaningful to report.",
            "Review recurring tasks periodically so outdated prompts do not keep running.",
          ],
        },
      ],
      cta: {
        heading: "Explore ChatGPT scheduled workflows",
        description: "Set up recurring prompts and automated briefs through guided workflows.",
      },
    },
    claude: {
      title: "Claude Scheduled Tasks",
      eyebrow: "Scheduled actions · Claude",
      subtitle: "Schedule recurring work through Claude, including tasks that use Cowork and connected sources.",
      badge: "Claude",
      cards: [
        {
          icon: "◷",
          heading: "What it does",
          list: [
            "Runs prompts at selected times in supported Claude task environments.",
            "Can combine recurring instructions with connected apps or local Cowork access.",
            "Supports work that can continue while the user moves on.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "Choose local or cloud execution based on whether desktop access is required.",
            "Define the exact folders, sources and permissions the task may use.",
            "Add a clear stopping condition for tasks that monitor changes.",
          ],
        },
      ],
      cta: {
        heading: "Explore Claude scheduled workflows",
        description: "Practice recurring email checks, briefs and connected-task automation.",
      },
    },
    gemini: {
      title: "Gemini Scheduled Actions",
      eyebrow: "Scheduled actions · Gemini",
      subtitle: "Set Gemini to prepare recurring responses and summaries using the Google ecosystem.",
      badge: "Gemini",
      cards: [
        {
          icon: "◷",
          heading: "What it does",
          list: [
            "Runs a named instruction on a daily, weekly or selected schedule.",
            "Works well for recurring summaries and Google-connected information.",
            "Uses the information available when the scheduled response is prepared.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "Specify the delivery time and timezone rather than using broad dayparts.",
            "Keep the requested output stable and easy to scan.",
            "Avoid relying on it for information that must be accurate to the exact minute.",
          ],
        },
      ],
      cta: {
        heading: "Explore Gemini scheduled workflows",
        description: "Open guided workflows for recurring Google-connected prompts and summaries.",
      },
    },
    copilot: {
      title: "Copilot Scheduled Prompts",
      eyebrow: "Scheduled actions · Copilot",
      subtitle: "Run recurring Copilot prompts that use approved Microsoft 365 context.",
      badge: "Copilot",
      cards: [
        {
          icon: "◷",
          heading: "What it does",
          list: [
            "Schedules repeatable prompts for routine work and information checks.",
            "Can draw on permitted Microsoft 365 content.",
            "Useful for regular updates, preparation and administrative follow-through.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "Name the source, date range and expected format in the prompt.",
            "Keep permissions narrow and avoid unnecessary access.",
            "Include a human review step before actions affect customers or records.",
          ],
        },
      ],
      cta: {
        heading: "Explore Copilot scheduled workflows",
        description: "See guided workflows for recurring prompts and Microsoft 365 task automation.",
      },
    },
  },
  "ai-agents": {
    chatgpt: {
      title: "ChatGPT Work",
      eyebrow: "AI Agent",
      subtitle: "Use a dedicated ChatGPT workspace for research, connected files and longer multi-step tasks.",
      badge: "ChatGPT",
      cards: [
        {
          icon: "◎",
          heading: "What is ChatGPT Work",
          list: [
            "A focused workspace for open-web research, file analysis and multi-step execution.",
            "Combines browsing, reasoning and code-based analysis inside one task flow.",
            "Useful when the output requires several connected steps instead of one answer.",
          ],
        },
        {
          icon: "↗",
          heading: "Best use and access",
          list: [
            "Best suited to research, synthesis, comparison and producing structured outputs from multiple sources.",
            "Connected local-file work depends on the desktop app and an available computer.",
            "Review permissions and outputs before allowing changes to files or external systems.",
          ],
        },
      ],
      cta: {
        heading: "Explore ChatGPT Work Workflows",
        description: "Open guided workflows for longer research tasks, connected-file work and multi-step execution in ChatGPT.",
      },
    },
    claude: {
      title: "Claude Cowork",
      eyebrow: "AI Agent",
      subtitle: "Delegate multi-step work across connected folders, files and approved browser actions from Claude Desktop.",
      badge: "Claude",
      cards: [
        {
          icon: "C",
          heading: "What is Claude Cowork",
          list: [
            "A desktop-based AI agent that works with folders you explicitly connect.",
            "Can plan and complete multi-file tasks, use approved browser actions and split work across sub-agents.",
            "Designed for longer assignments where Claude needs to keep working beyond a single chat response.",
          ],
        },
        {
          icon: "✓",
          heading: "How it works and stays controlled",
          list: [
            "Local file or browser steps depend on the connected desktop being available.",
            "Permanent deletion requires explicit approval before Claude can continue.",
            "Use it for file-heavy research, document production and repeatable desktop work.",
          ],
        },
      ],
      cta: {
        heading: "Explore Claude Cowork Workflows",
        description: "Practice setting up Cowork, editing real files, delegating longer tasks and reviewing agent actions safely.",
      },
    },
    gemini: {
      title: "Gemini Spark",
      eyebrow: "AI Agent",
      subtitle: "Run cloud-based multi-step work across approved Google Workspace tools without relying on local files.",
      badge: "Gemini",
      cards: [
        {
          icon: "✦",
          heading: "What is Gemini Spark",
          list: [
            "A cloud-native AI agent designed to continue tasks on Google's servers.",
            "Works with approved Google Workspace tools such as Gmail, Drive and Docs.",
            "Can be accessed through web or mobile without requiring a desktop installation.",
          ],
        },
        {
          icon: "☁",
          heading: "Where it fits best",
          list: [
            "Useful for email organization, document coordination, planning and Workspace-based administration.",
            "It does not work directly with files stored only on a local computer.",
            "Check source access and action permissions before delegating ongoing work.",
          ],
        },
      ],
      cta: {
        heading: "Explore Gemini Spark Workflows",
        description: "Open guided workflows for delegating Google Workspace tasks and reviewing cloud-based agent actions.",
      },
    },
    copilot: {
      title: "Copilot Studio Agents",
      eyebrow: "AI Agent",
      subtitle: "Build governed agents that connect Microsoft 365 knowledge, business data and automated actions.",
      badge: "Microsoft",
      cards: [
        {
          icon: "⬡",
          heading: "What are Copilot Studio Agents",
          list: [
            "Custom agents designed around a defined role, instructions, knowledge and actions.",
            "Can use approved Microsoft 365 content, connectors and business workflows.",
            "Agents can be shared through Microsoft environments such as Teams and Copilot experiences.",
          ],
        },
        {
          icon: "⚙",
          heading: "Build and govern the agent",
          list: [
            "Define the agent's purpose, instructions, knowledge sources and permitted actions.",
            "Add approval points for sensitive steps and test the agent against realistic requests.",
            "Use admin controls to manage access, environments, connectors and publishing.",
          ],
        },
      ],
      cta: {
        heading: "Explore Copilot Studio Agent Workflows",
        description: "Practice creating agents, connecting approved data and automating repeatable Microsoft 365 tasks.",
      },
    },
  },
  "coding-agents": {
    chatgpt: {
      title: "Codex (OpenAI)",
      eyebrow: "Coding Agent",
      subtitle: "Delegate software tasks across the ChatGPT app, command line and cloud-based coding environments.",
      badge: "OpenAI",
      cards: [
        {
          icon: "⌘",
          heading: "What is Codex",
          list: [
            "OpenAI's coding agent for planning, writing, reviewing and explaining code.",
            "Supports work across app, CLI and cloud-based task environments.",
            "Can take a software request, inspect the repository and return a proposed implementation.",
          ],
        },
        {
          icon: "✓",
          heading: "How to use it well",
          list: [
            "Give it a clear outcome, repository context, constraints and a definition of done.",
            "Ask it to run tests and summarize the files changed before you review the result.",
            "Keep network access and execution permissions limited to what the task requires.",
          ],
        },
      ],
      cta: {
        heading: "Explore Codex Workflows",
        description: "Open guided workflows for repository tasks, implementation planning, testing and code review with Codex.",
      },
    },
    claude: {
      title: "Claude Code",
      eyebrow: "Coding Agent",
      subtitle: "Plan, write, edit and test coordinated code changes across files from the terminal and development environment.",
      badge: "Claude",
      cards: [
        {
          icon: "C",
          heading: "What is Claude Code",
          list: [
            "An AI coding agent that can inspect a codebase and make coordinated changes across multiple files.",
            "Works across terminal, IDE and other supported development surfaces.",
            "Can write code, run tests, debug failures and explain the changes it made.",
          ],
        },
        {
          icon: "⌘",
          heading: "Best used for",
          list: [
            "Complex repository tasks that need deeper reasoning and several connected edits.",
            "Refactoring, debugging, test generation and implementation from an existing specification.",
            "Review the plan, permissions and generated changes before merging into production.",
          ],
        },
      ],
      cta: {
        heading: "Explore Claude Code Workflows",
        description: "Practice repository setup, multi-file changes, debugging, testing and reviewing AI-generated code.",
      },
    },
    gemini: {
      title: "Antigravity (Google)",
      eyebrow: "Coding Agent",
      subtitle: "Coordinate multiple Gemini-powered coding agents across projects and development tasks.",
      badge: "Google",
      cards: [
        {
          icon: "✦",
          heading: "What is Antigravity",
          list: [
            "An agent-first coding environment designed for parallel work across software projects.",
            "Uses Gemini models to plan, generate and coordinate implementation tasks.",
            "Supports running separate agents on different parts of a project at the same time.",
          ],
        },
        {
          icon: "↗",
          heading: "Where it fits best",
          list: [
            "Useful for teams building with Google Cloud, Firebase or other Google development services.",
            "Split work into clearly owned tasks so parallel agents do not overwrite each other's changes.",
            "Review integration points, test results and deployment settings before release.",
          ],
        },
      ],
      cta: {
        heading: "Explore Antigravity Workflows",
        description: "Practice planning builds, coordinating agents and reviewing parallel code changes.",
      },
    },
    copilot: {
      title: "GitHub Spark",
      eyebrow: "Coding Agent",
      subtitle: "Turn a natural-language idea into a working application that can be previewed, refined and shared.",
      badge: "GitHub",
      cards: [
        {
          icon: "◇",
          heading: "What is GitHub Spark",
          list: [
            "An AI application builder for creating functional apps from a written description.",
            "Generates the interface and application logic, then lets you refine the result through further prompts.",
            "Designed to reduce the setup needed to move from an idea to a usable prototype.",
          ],
        },
        {
          icon: "▱",
          heading: "Best used for",
          list: [
            "Rapid prototypes, lightweight internal tools and early versions of product ideas.",
            "Iterate by testing the live preview and asking for specific design or functional changes.",
            "Review authentication, data handling and generated code before publishing a production application.",
          ],
        },
      ],
      cta: {
        heading: "Explore GitHub Spark Workflows",
        description: "Open guided workflows for turning ideas into applications, refining the build and preparing it to share.",
      },
    },
  },
};

/** Tool-specific page content for a (capability, tool) pair — the title doubles as the sidebar/tile label. */
export function getToolPageDef(slug: CapabilitySlug, tool: ProviderTool): ToolPageDef {
  return CAPABILITY_TOOL_PAGES[slug][tool];
}

/** Display label for a capability under a specific tool, e.g. "Codex (OpenAI)" for coding-agents + chatgpt. */
export function capabilityLabelForTool(slug: CapabilitySlug, tool: ProviderTool): string {
  return CAPABILITY_TOOL_PAGES[slug][tool].title;
}

export type ProviderDef = {
  label: string;
  mark: string;
  blurb: string;
};

export const PROVIDERS: Record<ProviderTool, ProviderDef> = {
  chatgpt: {
    label: "ChatGPT",
    mark: "◎",
    blurb: "OpenAI's assistant — strong all-round writing, research, image generation and live voice.",
  },
  claude: {
    label: "Claude",
    mark: "A",
    blurb: "Anthropic's assistant — careful reasoning, polished writing, and deep desktop/file work via Cowork.",
  },
  gemini: {
    label: "Gemini",
    mark: "✦",
    blurb: "Google's assistant — tightly integrated with Workspace, strong at multimodal and research tasks.",
  },
  copilot: {
    label: "Copilot",
    mark: "◈",
    blurb: "Microsoft's assistant — built into Microsoft 365, strong at workplace docs, email and Teams workflows.",
  },
};

export function providerLabel(tool: string): string {
  return PROVIDERS[tool as ProviderTool]?.label ?? tool;
}

export function isProviderTool(value: string): value is ProviderTool {
  return value in PROVIDERS;
}
