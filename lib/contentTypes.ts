/** Canonical activity content types shown in the B2B Capabilities sidebar. */
export const ACTIVITY_CONTENT_TYPES = [
  "Skills",
  "Projects",
  "Vibe coding",
  "Scheduled actions",
  "AI agents",
  "Coding agents",
] as const;

export type ActivityContentType = (typeof ACTIVITY_CONTENT_TYPES)[number];

export const ACTIVITY_CONTENT_TYPE_SET = new Set<string>(ACTIVITY_CONTENT_TYPES);

export const ACTIVITY_CONTENT_TYPE_COLORS: Record<
  ActivityContentType,
  { bg: string; color: string }
> = {
  Skills: { bg: "rgba(98,60,234,.08)", color: "#5030C0" },
  Projects: { bg: "rgba(35,206,104,.08)", color: "#17A855" },
  "Vibe coding": { bg: "rgba(246,138,41,.08)", color: "#B05000" },
  "Scheduled actions": { bg: "rgba(14,116,144,.08)", color: "#0E7490" },
  "AI agents": { bg: "rgba(190,24,93,.08)", color: "#BE185D" },
  "Coding agents": { bg: "rgba(30,64,175,.08)", color: "#1E40AF" },
};
