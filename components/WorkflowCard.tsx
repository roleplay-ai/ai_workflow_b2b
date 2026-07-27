"use client";

import { useState } from "react";
import Link from "next/link";
import type { Activity } from "@/lib/supabase/types";
import { formatToolLabel, normalizeActivityTools } from "@/lib/tools";
import type { ToolLogoMap } from "@/lib/toolLogos";
import ToolIcon from "@/components/ToolIcon";
import styles from "@/app/(b2b)/workflows/workflows.module.css";

export type WorkflowCategoryMetadata = {
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  icon: string | null;
  display_order: number;
  is_visible: boolean;
};

const CATEGORY_ICON_FALLBACKS: Record<string, string> = {
  "get set up": "⚙",
  "automate email & tasks": "✉",
  "make presentations": "▧",
  "organize knowledge in one place": "▤",
  "analyze data": "▥",
  "delegate multi-step work to an agent": "✦",
  "generate videos": "▶",
  "make your chatbot remember you": "◉",
  "build a voice chatbot": "⌁",
  "build a web app": "</>",
  "teach ai your way of working": "✎",
  "build a text chatbot": "◌",
  "research the market": "⌕",
  "generate images": "◇",
  "build a website": "▦",
  "data security": "⌾",
};

export function categoryIcon(category: WorkflowCategoryMetadata | undefined): string {
  if (!category) return "✦";
  return category.icon || CATEGORY_ICON_FALLBACKS[category.name.toLowerCase()] || "◇";
}

export function formatViewCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K`;
  return String(count);
}

export function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l8.9 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

export function WorkflowCard({
  activity,
  category,
  toolLogos,
  viewCount,
  isCompleted,
  isInProgress,
  isSaved,
  isSavePending,
  onToggleSave,
}: {
  activity: Activity;
  category?: WorkflowCategoryMetadata;
  toolLogos: ToolLogoMap;
  viewCount: number;
  isCompleted: boolean;
  isInProgress: boolean;
  isSaved: boolean;
  isSavePending: boolean;
  onToggleSave: (activityId: string) => void;
}) {
  const tools = normalizeActivityTools(activity.tools);
  const primaryTool = tools[0] ?? "";
  const [navigating, setNavigating] = useState(false);

  return (
    <article className={`${styles.workflowCard} ${navigating ? styles.workflowCardNavigating : ""}`}>
      <button
        type="button"
        className={`${styles.saveCardButton} ${isSaved ? styles.saveCardButtonActive : ""}`}
        aria-label={isSaved ? `Remove ${activity.title} from saved workflows` : `Save ${activity.title}`}
        aria-pressed={isSaved}
        aria-busy={isSavePending}
        disabled={isSavePending}
        onClick={() => onToggleSave(activity.id)}
      >
        <HeartIcon filled={isSaved} />
      </button>
      <Link href={`/activity/${activity.id}`} onClick={() => setNavigating(true)} aria-busy={navigating}>
        <div className={styles.workflowCardTop}>
          <span className={styles.workflowNatureIcon}>{categoryIcon(category)}</span>
          {primaryTool ? (
            <span className={styles.toolLabel}>
              <ToolIcon tool={primaryTool} size={16} logos={toolLogos} insetScale={0.88} />
              {formatToolLabel(primaryTool)}
            </span>
          ) : null}
        </div>
        <h3>{activity.title}</h3>
        {activity.description ? <p>{activity.description}</p> : null}
        <div className={styles.workflowCardFooter}>
          <span>
            {viewCount > 0 ? `${formatViewCount(viewCount)} views` : `${activity.time_estimate_minutes ?? 0} min`}
          </span>
          <span className={isCompleted ? styles.doneStatus : isInProgress ? styles.progressStatus : ""}>
            {isCompleted ? "Completed" : isInProgress ? "Continue →" : activity.is_locked ? "Locked" : "Start →"}
          </span>
        </div>
      </Link>
      {navigating ? <span className={styles.cardSpinner} aria-hidden="true" /> : null}
    </article>
  );
}
