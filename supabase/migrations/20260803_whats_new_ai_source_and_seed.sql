-- Allow "ai" as a fifth What's New source for general AI industry news,
-- then seed the initial published updates.

alter table public.whats_new_updates
  drop constraint if exists whats_new_updates_tool_check;

alter table public.whats_new_updates
  add constraint whats_new_updates_tool_check
  check (tool in ('chatgpt', 'claude', 'gemini', 'copilot', 'ai'));

insert into public.whats_new_updates (tool, title, summary, tag, link_url, is_published, published_at)
select v.tool, v.title, v.summary, v.tag, v.link_url, true, v.published_at
from (
  values
    -- Claude
    (
      'claude',
      'Claude Opus 5 released',
      'The model improves coding, professional work and long-running agent performance.',
      'Models',
      'https://www.anthropic.com/news/claude-opus-5',
      timestamptz '2026-07-24 12:00:00+00'
    ),
    (
      'claude',
      'Claude usage reflection dashboard introduced',
      'The dashboard shows usage patterns and includes quiet hours and break reminders.',
      'Reflection',
      'https://www.anthropic.com/news/reflect-with-claude',
      timestamptz '2026-07-09 12:00:00+00'
    ),
    (
      'claude',
      'Claude Sonnet 5 released',
      'The model can plan, use tools and complete autonomous tasks at a lower cost than Opus models.',
      'Models',
      'https://www.anthropic.com/news/claude-sonnet-5',
      timestamptz '2026-06-30 12:00:00+00'
    ),
    (
      'claude',
      'Claude Tag introduced for Slack',
      'Teams can tag Claude to complete tasks using approved channels, tools and codebases.',
      'Collaboration',
      'https://www.anthropic.com/news/introducing-claude-tag',
      timestamptz '2026-06-23 12:00:00+00'
    ),
    (
      'claude',
      'Financial-services agents added to Claude',
      'Ten agent templates cover work such as pitchbooks, KYC screening, financial models and month-end closing.',
      'Agents',
      'https://www.anthropic.com/news/finance-agents',
      timestamptz '2026-05-05 12:00:00+00'
    ),
    (
      'claude',
      'Claude Design introduced',
      'The tool creates prototypes, slides, one-pagers and other visual assets from prompts.',
      'Design',
      'https://www.anthropic.com/news/claude-design-anthropic-labs',
      timestamptz '2026-04-17 12:00:00+00'
    ),

    -- ChatGPT (date ranges use the start day for published_at)
    (
      'chatgpt',
      'ChatGPT Work introduced',
      'It completes long-running tasks using files and plugins, producing reviewable documents and other outputs.',
      'Work',
      'https://learn.chatgpt.com/docs/get-started-with-work',
      timestamptz '2026-07-06 12:00:00+00'
    ),
    (
      'chatgpt',
      'Codex added to the ChatGPT desktop app',
      'Codex retains a dedicated coding workspace with inline diffs, pull-request review and multi-repository projects.',
      'Codex',
      'https://learn.chatgpt.com/docs/app',
      timestamptz '2026-07-09 12:00:00+00'
    ),
    (
      'chatgpt',
      'ChatGPT Voice expanded across Chat, Work and Codex',
      'Voice can start, monitor and steer work across different threads.',
      'Voice',
      'https://learn.chatgpt.com/docs/features/voice',
      timestamptz '2026-07-20 12:00:00+00'
    ),
    (
      'chatgpt',
      'ChatGPT Sites introduced',
      'Sites creates, previews and hosts websites, dashboards, internal tools and web apps.',
      'Sites',
      'https://learn.chatgpt.com/docs/sites',
      timestamptz '2026-06-01 12:00:00+00'
    ),

    -- Gemini
    (
      'gemini',
      'Gemini Spark introduced',
      'Google’s personal AI agent can complete background tasks across connected apps.',
      'Spark',
      'https://gemini.google/release-notes/',
      timestamptz '2026-05-19 12:00:00+00'
    ),
    (
      'gemini',
      'Skills added to Gemini Spark',
      'Skills save reusable instructions that Spark can apply across tasks and schedules.',
      'Skills',
      'https://support.google.com/gemini/answer/17094296?co=GENIE.Platform%3DDesktop&hl=en',
      timestamptz '2026-07-17 12:00:00+00'
    ),
    (
      'gemini',
      'Tasks added to Gemini Spark',
      'Users can assign goals, monitor progress and manage task threads from a dedicated page.',
      'Tasks',
      'https://support.google.com/gemini/answer/17094196?co=GENIE.Platform%3DAndroid&hl=en',
      timestamptz '2026-07-17 12:00:00+00'
    ),
    (
      'gemini',
      'AI avatars added through Gemini Omni',
      'Users can create a video avatar designed to look and sound like them.',
      'Video',
      'https://gemini.google/release-notes/',
      timestamptz '2026-05-19 12:00:00+00'
    ),

    -- Copilot (month-only dates use the 1st)
    (
      'copilot',
      'Copilot Cowork becomes generally available',
      'Cowork completes tasks across Outlook, Teams, Calendar, OneDrive and Microsoft 365 documents.',
      'Cowork',
      'https://learn.microsoft.com/en-us/microsoft-365/copilot/cowork/',
      timestamptz '2026-06-01 12:00:00+00'
    ),
    (
      'copilot',
      'Custom skill builder added to Copilot Cowork',
      'Users can create, upload and share reusable skills from the Customize page.',
      'Skills',
      'https://learn.microsoft.com/en-us/microsoft-365/copilot/cowork/whats-new',
      timestamptz '2026-06-01 12:00:00+00'
    ),
    (
      'copilot',
      'Usage-based billing added to Copilot Cowork',
      'Administrators can monitor consumption and set limits for users or groups.',
      'Billing',
      'https://learn.microsoft.com/en-us/microsoft-365/copilot/cowork/cowork-admin-governance',
      timestamptz '2026-06-01 12:00:00+00'
    )
) as v(tool, title, summary, tag, link_url, published_at)
where not exists (
  select 1
  from public.whats_new_updates existing
  where existing.tool = v.tool
    and existing.title = v.title
);
