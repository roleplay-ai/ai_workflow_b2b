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

/**
 * The "Unique to each" menu content — verbatim from the reference design's
 * per-provider feature panels (Insider Guide + each tool's own distinct
 * features), not the shared 6 capabilities.
 */
export type ProviderFeatureDef = {
  slug: string;
  label: string;
  isNew?: boolean;
  mark: string;
  title: string;
  eyebrow: string;
  subtitle: string;
  badge: string;
  cards: InfoCard[];
  cta: { heading: string; description: string };
  workflowsHref: string;
};

export const INSIDER_GUIDE_ITEM = { slug: "insider-guide", label: "Insider Guide", mark: "◉" };

export const PROVIDER_FEATURES: Record<ProviderTool, ProviderFeatureDef[]> = {
  chatgpt: [
    {
      slug: "sites",
      label: "Sites",
      isNew: true,
      mark: "▦",
      title: "ChatGPT Sites",
      eyebrow: "ChatGPT Feature",
      subtitle: "Build, host and share lightweight websites and apps directly from ChatGPT. Launched July 9, 2026.",
      badge: "Build",
      cards: [
        {
          icon: "▦",
          heading: "What it is",
          body: "ChatGPT Sites lets you describe a website or app in chat, and ChatGPT builds, hosts and shares it at a live URL. No separate deployment is needed.",
        },
        {
          icon: "✦",
          heading: "What it's used for",
          list: [
            "Landing pages, dashboards, internal portals, trackers, prototypes, reports and lightweight apps.",
            "Preview and refine the site inside ChatGPT before publishing.",
            "Share the finished site through a URL, with custom domain support if you own the domain.",
            "A fast path for non-developers or teams that want something live quickly.",
          ],
        },
        {
          icon: "!",
          heading: "Limitations",
          list: [
            "Built for lightweight sites and apps, not full production platforms.",
            "Not available on Free or Go plans, and not available in the EEA, Switzerland or UK at launch.",
            "No support for payment data, health information or content aimed at children under 13.",
            "Deleting a site is permanent, with no restore option.",
            "Complex backends, advanced authentication or heavy integrations still need a full development stack.",
          ],
        },
        {
          icon: "↗",
          heading: "Access and sharing",
          list: [
            "Rolling out first to Pro, Pro Lite, Enterprise and Edu, with Plus following.",
            "Can be triggered in chat or with an @Sites mention, from ChatGPT Work or Codex surfaces.",
            "Sites can be private drafts, shared by link or published publicly if your plan allows.",
            "Enterprise workspaces have public publishing off by default until an admin enables it.",
          ],
        },
      ],
      cta: {
        heading: "Explore ChatGPT Sites Workflows",
        description: "Open guided workflows for building, refining, publishing and sharing lightweight websites and apps with ChatGPT Sites.",
      },
      workflowsHref: "/workflows?tool=chatgpt&tag=Sites",
    },
    {
      slug: "image-generation",
      label: "Image generation",
      mark: "◇",
      title: "ChatGPT Image Generation",
      eyebrow: "ChatGPT Feature",
      subtitle: "Create, edit and refine images directly through conversation inside ChatGPT.",
      badge: "Images",
      cards: [
        {
          icon: "◇",
          heading: "What it does",
          list: [
            "Generates original visuals from a written description.",
            "Edits uploaded or generated images using natural-language instructions.",
            "Supports iterative refinement, so you can change composition, style, objects or text without restarting.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "Specify the subject, composition, visual style, aspect ratio and intended use.",
            "Ask for one focused change at a time when refining an existing image.",
            "Review small text, hands, logos and factual details before using the output.",
          ],
        },
      ],
      cta: {
        heading: "Explore Image Generation Workflows",
        description: "Open guided workflows for structured prompting, visual refinement and creating usable image assets.",
      },
      workflowsHref: "/workflows?category=Generate%20Images&tool=chatgpt",
    },
  ],
  claude: [
    {
      slug: "design",
      label: "Design",
      mark: "✎",
      title: "Claude Design",
      eyebrow: "New Feature",
      subtitle: "Create on-brand presentations, carousels and graphics using a reusable design system.",
      badge: "New",
      cards: [
        {
          icon: "✎",
          heading: "What is Claude Design",
          body: "Anthropic's tool for creating presentations, carousels and graphics with Claude, built to produce on-brand output instead of generic templates. Strong results depend on setting up three inputs before generating anything rather than jumping straight to a template.",
        },
        {
          icon: "▧",
          heading: "The 3 Setup Inputs",
          list: [
            "DESIGN.md file: a rulebook with exact colors, hex codes, fonts and spacing. You can adapt an existing public example after removing proprietary details.",
            "Design System: import DESIGN.md into Claude Design, then add your logo, icons and voice principles such as avoiding corporate jargon.",
            "Reusable Template: define the layout structure for a specific use case, including headers, footers and slide arrangements, so you do not start from blank each time.",
          ],
        },
        {
          icon: "↻",
          heading: "Generate and Refine",
          list: [
            "Upload your talking points and Claude Design generates a complete deck using your design system and template.",
            "Corrections can be saved into a Claude.md file that Claude reads before future designs, reducing repeated feedback.",
            "Use Edit or Annotate for one-off slide changes, or Tweaks for global changes such as slide numbers across the whole deck.",
          ],
        },
      ],
      cta: {
        heading: "Explore Claude Design Workflows",
        description: "Open guided workflows for setting up brand rules, creating reusable templates, generating decks and refining visual output with Claude Design.",
      },
      workflowsHref: "/workflows?tool=claude",
    },
    {
      slug: "dispatch",
      label: "Dispatch",
      isNew: true,
      mark: "↗",
      title: "Claude Dispatch",
      eyebrow: "New Feature",
      subtitle: "Create recurring AI-generated updates and send them to the right audience.",
      badge: "New",
      cards: [
        { icon: "↗", heading: "My Claude Dispatches", body: "Review recurring updates, summaries and reports." },
        { icon: "＋", heading: "Create a Claude Dispatch", body: "Choose the source, schedule, audience and output format." },
        { icon: "◷", heading: "Schedule and Deliver", body: "Set when the update should run and where it should be delivered." },
      ],
      cta: {
        heading: "Explore Claude Dispatch Workflows",
        description: "Open guided workflows for creating recurring updates, choosing sources and delivering reports automatically.",
      },
      workflowsHref: "/workflows?tool=claude",
    },
    {
      slug: "tag",
      label: "Tag",
      isNew: true,
      mark: "#",
      title: "Claude Tag",
      eyebrow: "Claude Feature",
      subtitle: "Bring Claude into Slack as a shared, channel-aware teammate for collaborative and asynchronous work.",
      badge: "New",
      cards: [
        {
          icon: "#",
          heading: "What is Claude Tag",
          body: "Claude Tag brings Claude directly into Slack as a team member, rather than keeping it inside a personal chat.",
          list: [
            "Multiplayer: works inside Slack channels, so everyone sees the same thread and collaborates with Claude together.",
            "Channel-aware: builds context from the channels it is added to, and can learn from other approved channels or data sources when permitted.",
            "Scoped memory: retains useful context over time only within the channels and permissions admins allow, rather than creating company-wide memory.",
            "Asynchronous: lets you delegate work that can continue over hours or days, including scheduled follow-ups while the team moves on.",
          ],
        },
        {
          icon: "⚙",
          heading: "How to Set It Up",
          list: [
            "Requires Claude Owner and Slack Admin access on a Team or Enterprise plan.",
            "Enable it in settings, then link Slack using the /claude connect pairing code.",
            "Set access bundles for connected tools such as Google Drive or Notion.",
            "Admins can set monthly spending limits, restrict guest access and configure custom system prompts for each channel.",
          ],
        },
      ],
      cta: {
        heading: "Explore Claude Tag Workflows",
        description: "Open guided workflows for adding Claude to team channels, setting permissions, connecting approved knowledge and delegating asynchronous work safely.",
      },
      workflowsHref: "/workflows?category=Organize%20Knowledge%20in%20One%20Place&tool=claude",
    },
    {
      slug: "plugins",
      label: "Plugins",
      mark: "⌘",
      title: "Claude Plugins",
      eyebrow: "Claude Feature",
      subtitle: "Connect specialist tools that extend what Claude can do.",
      badge: "Extend AI",
      cards: [
        { icon: "▤", heading: "Installed Plugins", body: "See the plugins currently available in your workspace." },
        { icon: "＋", heading: "Browse Plugins", body: "Discover tools for travel, design, productivity and more." },
        { icon: "⚙", heading: "Manage Access", body: "Connect, disconnect or review plugin permissions." },
      ],
      cta: {
        heading: "Learn how to use Plugins",
        description: "Explore guided workflows for choosing, connecting and using plugins safely.",
      },
      workflowsHref: "/workflows?tool=claude",
    },
  ],
  gemini: [
    {
      slug: "video-generation",
      label: "Video generation",
      mark: "▶",
      title: "Gemini Video Generation",
      eyebrow: "Gemini Feature",
      subtitle: "Create short videos from prompts, reference images and structured scene directions in Gemini.",
      badge: "Video",
      cards: [
        {
          icon: "▶",
          heading: "What it does",
          list: [
            "Turns a written scene description into a short generated video.",
            "Can use a reference image as the visual starting point for motion and camera direction.",
            "Lets you describe the subject, setting, action, framing, lighting and overall visual mood.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "Write one clear scene per generation instead of combining several moments in one prompt.",
            "State the camera movement, subject movement, duration, aspect ratio and ending frame.",
            "Generate short clips first, then assemble the strongest outputs into a longer sequence.",
          ],
        },
      ],
      cta: {
        heading: "Explore Video Generation Workflows",
        description: "Open guided workflows for planning scenes, writing controlled prompts and refining AI-generated video clips.",
      },
      workflowsHref: "/workflows?category=Generate%20Videos&tool=gemini",
    },
    {
      slug: "image-generation",
      label: "Image generation",
      mark: "◇",
      title: "Gemini Image Generation",
      eyebrow: "Gemini Feature",
      subtitle: "Generate and edit visuals in Gemini using prompts, reference images and conversational feedback.",
      badge: "Images",
      cards: [
        {
          icon: "◇",
          heading: "What it does",
          list: [
            "Creates images from text prompts for presentations, marketing, learning and everyday work.",
            "Uses uploaded reference images to guide style, layout or visual consistency.",
            "Supports conversational editing such as replacing an object, changing the background or adjusting the composition.",
          ],
        },
        {
          icon: "✓",
          heading: "Use it well",
          list: [
            "Structure the prompt around purpose, subject, composition, style, colors, text and output format.",
            "Reuse the same visual references and instructions when creating a consistent series.",
            "Inspect typography and fine visual details before publishing the image.",
          ],
        },
      ],
      cta: {
        heading: "Explore Image Generation Workflows",
        description: "Open guided workflows for structured image prompting, reference-based generation and visual refinement.",
      },
      workflowsHref: "/workflows?category=Generate%20Images&tool=gemini",
    },
  ],
  copilot: [
    {
      slug: "pages",
      label: "Pages",
      mark: "▤",
      title: "Copilot Pages",
      eyebrow: "Copilot Feature",
      subtitle: "Turn AI responses into persistent, editable pages for collaborative work.",
      badge: "Collaborate",
      cards: [
        { icon: "▤", heading: "Create a Page", body: "Move useful Copilot output into a page that remains editable." },
        { icon: "✎", heading: "Build Together", body: "Refine content with colleagues instead of keeping it inside one chat." },
        { icon: "⌁", heading: "Use Microsoft 365 Context", body: "Bring relevant work context into a shared page when available." },
      ],
      cta: {
        heading: "Explore Copilot Pages Workflows",
        description: "Open guided workflows for creating and collaborating through Copilot Pages.",
      },
      workflowsHref: "/workflows?category=Organize%20Knowledge%20in%20One%20Place&tool=copilot",
    },
    {
      slug: "studio",
      label: "Studio Agents",
      mark: "◫",
      title: "Copilot Studio Agents",
      eyebrow: "Copilot Feature",
      subtitle: "Build focused agents with instructions, knowledge, actions and business connectors.",
      badge: "Build Agents",
      cards: [
        { icon: "◫", heading: "Define the Agent", body: "Choose its purpose, audience and the work it should handle." },
        { icon: "▤", heading: "Add Knowledge and Actions", body: "Connect approved sources and define the actions the agent may take." },
        { icon: "✓", heading: "Test and Govern", body: "Test responses, permissions and escalation rules before wider use." },
      ],
      cta: {
        heading: "Explore Copilot Studio Workflows",
        description: "Open guided workflows for designing, testing and deploying Copilot agents.",
      },
      workflowsHref: "/workflows?category=Delegate%20Multi-Step%20Work%20to%20an%20Agent&tool=copilot",
    },
    {
      slug: "scheduled",
      label: "Scheduled Prompts",
      mark: "◷",
      title: "Copilot Scheduled Prompts",
      eyebrow: "Copilot Feature",
      subtitle: "Run repeatable prompts on a schedule for recurring updates and routine work.",
      badge: "Automate",
      cards: [
        { icon: "◷", heading: "Set the Schedule", body: "Choose when the prompt should run and how often it should repeat." },
        { icon: "✎", heading: "Write the Prompt", body: "Define the source, task and expected output clearly." },
        { icon: "⚙", heading: "Review and Manage", body: "Edit, pause or remove scheduled prompts as work changes." },
      ],
      cta: {
        heading: "Explore Scheduled Prompt Workflows",
        description: "Open guided workflows for recurring Copilot prompts and automated updates.",
      },
      workflowsHref: "/workflows?category=Automate%20Email%20%26%20Tasks&tool=copilot",
    },
  ],
};

export function isProviderFeatureSlug(tool: ProviderTool, value: string): boolean {
  return PROVIDER_FEATURES[tool].some((feature) => feature.slug === value);
}

export function getProviderFeature(tool: ProviderTool, slug: string): ProviderFeatureDef | undefined {
  return PROVIDER_FEATURES[tool].find((feature) => feature.slug === slug);
}

/** Insider Guide — plan value, recent launches and practice notes, verbatim from the reference design. */
export type InsiderGuideDef = {
  title: string;
  subtitle: string;
  freeVsPaid: {
    freeLabel: string;
    freeList: string[];
    paidLabel: string;
    paidList: string[];
  };
  whatsNew: { date: string; text: string }[];
  fromPractice: string[];
};

export const INSIDER_GUIDES: Record<ProviderTool, InsiderGuideDef> = {
  chatgpt: {
    title: "ChatGPT Insider Guide",
    subtitle: "Plan value, recent launches and first-hand findings from regular use.",
    freeVsPaid: {
      freeLabel: "ChatGPT Free",
      freeList: [
        "Core chat, web search and memory",
        "Limited files, data analysis, images, voice and Deep Research",
        "Use GPTs created by others",
      ],
      paidLabel: "ChatGPT Plus · $20/month",
      paidList: [
        "Higher model and tool limits with faster access",
        "Advanced reasoning, broader voice, image and research access",
        "Create GPTs, use Projects, Scheduled Tasks and paid Work features",
      ],
    },
    whatsNew: [
      { date: "Jul 23", text: "Voice became available inside Work and Codex on desktop." },
      { date: "Jul 16", text: "The desktop app added a clearer Chat and Work layout with unified recents." },
      { date: "Jul 14", text: "One search now covers chats, Projects, images and files." },
      { date: "Jul 09", text: "ChatGPT Work and the new Plugin Directory began rolling out." },
    ],
    fromPractice: [
      "The strongest all-round option when work combines writing, research, data, images and voice.",
      "Image generation and GPT-Live voice are two of its most useful practical advantages.",
      "Use Chat for answers, Work for multi-step execution and Codex for development.",
      "It is the safest default when someone wants one versatile AI tool rather than a specialist ecosystem.",
    ],
  },
  claude: {
    title: "Claude Insider Guide",
    subtitle: "Plan value, recent launches and first-hand findings from regular use.",
    freeVsPaid: {
      freeLabel: "Claude Free",
      freeList: [
        "Chat, writing, coding, web search and file or image analysis",
        "Artifacts and desktop extensions with standard limits",
        "Best suited to occasional or lighter work",
      ],
      paidLabel: "Claude Pro · $20/month",
      paidList: [
        "More usage, models and extended thinking",
        "Unlimited Projects, Research and Claude Code",
        "Google Workspace and supported tool connections",
      ],
    },
    whatsNew: [
      { date: "Jul 09", text: "Reflect added a dashboard for understanding usage patterns and AI habits." },
      { date: "Jun 30", text: "Claude Sonnet 5 launched for coding, agents and professional work." },
      { date: "Jun 23", text: "Claude Tag brought shared, channel-aware Claude work into Slack." },
      { date: "Apr 17", text: "Claude Design launched for on-brand decks, graphics and prototypes." },
    ],
    fromPractice: [
      "Claude remains the strongest option for careful reasoning and polished writing; its responses feel more deliberate and human.",
      "Cowork is especially useful when local files and desktop workflows matter.",
      "Claude Design becomes valuable after the design system and reusable templates are set up. Skipping that setup produces generic output.",
      "It still lacks native image generation, and its voice experience is less capable than ChatGPT's live multimodal voice.",
    ],
  },
  gemini: {
    title: "Gemini Insider Guide",
    subtitle: "Plan value, recent launches and first-hand findings from regular use.",
    freeVsPaid: {
      freeLabel: "Gemini Free",
      freeList: [
        "Gemini 3.5 Flash with varying access to 3.1 Pro",
        "Images, Deep Research, Live, Canvas and Gems",
        "Standard limits and a smaller file context window",
      ],
      paidLabel: "Google AI Pro · $19.99/month",
      paidList: [
        "Four times higher usage and a 1 million-token context window",
        "Expanded Pro, Deep Research, Flow and NotebookLM access",
        "Gemini inside Gmail, Docs, Vids and other Google apps",
      ],
    },
    whatsNew: [
      { date: "Jun 30", text: "Gemini Spark expanded to macOS, more connected apps and live topic tracking." },
      { date: "Jun 29", text: "Personal Intelligence began powering personalized image creation with Google Photos." },
      { date: "May 19", text: "Gemini 3.5 Flash, Omni, Daily Brief and Spark were announced together." },
      { date: "Apr 29", text: "Gemini added direct generation of Docs, Sheets, Slides, PDF, DOCX and XLSX files." },
    ],
    fromPractice: [
      "NotebookLM remains Gemini's clearest advantage for grounded, multi-source research.",
      "Canvas is excellent for live text editing, and the Google Workspace connection feels natural.",
      "Image and video generation are strong, especially when the work already sits inside Google's ecosystem.",
      "For complex reasoning and primary daily work, the output is still less consistent than Claude or ChatGPT.",
    ],
  },
  copilot: {
    title: "Copilot Insider Guide",
    subtitle: "Plan value, recent launches and first-hand findings from regular use.",
    freeVsPaid: {
      freeLabel: "Microsoft Copilot Free",
      freeList: [
        "General chat, web-grounded answers and Edge summaries",
        "Image creation, voice and chat history when signed in",
        "Useful for lightweight personal assistance",
      ],
      paidLabel: "Copilot Pro · $20/month",
      paidList: [
        "Preferred model access and higher AI credits",
        "Copilot in web versions of Word, Excel, PowerPoint and Outlook",
        "More Designer usage and access to selected experimental features",
      ],
    },
    whatsNew: [
      { date: "Jul 2026", text: "Copilot Cowork guidance expanded around email, calendar, files, research and scheduled work." },
      { date: "Jul 2026", text: "A single Dynamic Action Button became the main Copilot entry point in Office apps." },
      { date: "Jul 2026", text: "PowerPoint added stronger on-brand generation through templates and Brand Kit." },
      { date: "Jun 16", text: "Copilot Cowork became generally available worldwide." },
    ],
    fromPractice: [
      "Copilot is most valuable when daily work already lives inside Microsoft 365.",
      "It is useful in Word, Excel, PowerPoint and Outlook, but results depend heavily on permissions and file structure.",
      "Its general chat and agentic performance still trail ChatGPT and Claude.",
      "The $20 consumer plan is difficult to justify unless Microsoft 365 integration is the main reason for choosing it.",
    ],
  },
};
