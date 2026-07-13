"use client";
import { useState } from "react";
import Link from "next/link";
import type { Activity } from "@/lib/supabase/types";
import { normalizeActivityTools } from "@/lib/tools";
import type { ToolLogoMap } from "@/lib/toolLogos";
import RotatingTools from "@/components/RotatingTools";
import "@/app/card-styles.css";

// ── Scene theme system ─────────────────────────────────────────────────────

type LeftEl = "spreadsheet" | "person-purple" | "person-green" | "person-red" | "doc-stack" | "ticket-cloud";
type RightEl = "deck" | "scorecard" | "result-card" | "tool-ui" | "theme-map";
type SparkV = "s1" | "s2";

type SceneTheme = {
  posterColor: "green" | "blue" | "purple" | "orange" | "warm";
  left: LeftEl;
  right: RightEl;
  spark?: SparkV;
};

const THEMES: SceneTheme[] = [
  { posterColor: "green",  left: "spreadsheet",   right: "deck",        spark: "s1" },
  { posterColor: "blue",   left: "person-purple",  right: "scorecard",   spark: "s1" },
  { posterColor: "purple", left: "doc-stack",      right: "result-card", spark: "s2" },
  { posterColor: "orange", left: "person-green",   right: "tool-ui",     spark: "s1" },
  { posterColor: "blue",   left: "ticket-cloud",   right: "theme-map"                },
  { posterColor: "green",  left: "doc-stack",      right: "tool-ui",     spark: "s1" },
  { posterColor: "purple", left: "spreadsheet",    right: "result-card", spark: "s2" },
];

export function getTheme(id: string): SceneTheme {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = ((h << 5) - h) + id.charCodeAt(i); h |= 0; }
  return THEMES[Math.abs(h) % THEMES.length];
}

// ── Illustration sub-components ────────────────────────────────────────────

function Person({ shirt }: { shirt: "red" | "purple" | "green" }) {
  return (
    <div className={`person ${shirt}-shirt`}>
      <span className="hair" /><span className="head" /><span className="body" />
      <span className="arm left" /><span className="arm right" />
      <span className="leg left" /><span className="leg right" />
    </div>
  );
}

export function Scene({ theme }: { theme: SceneTheme }) {
  const left =
    theme.left === "spreadsheet"   ? <div className="spreadsheet" /> :
    theme.left === "doc-stack"     ? <div className="document-stack"><span className="doc" /><span className="doc" /><span className="doc" /></div> :
    theme.left === "ticket-cloud"  ? <div className="ticket-cloud"><span className="ticket" /><span className="ticket" /><span className="ticket" /></div> :
    theme.left === "person-purple" ? <Person shirt="purple" /> :
    theme.left === "person-green"  ? <Person shirt="green" /> :
                                     <Person shirt="red" />;

  const right =
    theme.right === "deck"        ? <div className="deck" /> :
    theme.right === "scorecard"   ? <div className="scorecard" /> :
    theme.right === "result-card" ? <div className="result-card" /> :
    theme.right === "tool-ui"     ? <div className="tool-ui" /> :
                                    <div className="theme-map"><span /><span /><span /></div>;

  return (
    <div className="scene">
      {left}
      <div className="arrow-flow" />
      {right}
      {theme.spark && <div className={`spark ${theme.spark}`} />}
    </div>
  );
}

// ── Eye icon ───────────────────────────────────────────────────────────────

function EyeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 1.75 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatViewCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

const MAX_VISIBLE_TAGS = 5;

function resolveTagLogoUrl(tag: string, tagLogos: Record<string, string>): string | null {
  return tagLogos[tag.toLowerCase()] ?? null;
}

function TagLogosRow({
  tags,
  tagLogos,
}: {
  tags: string[];
  tagLogos: Record<string, string>;
}) {
  if (tags.length === 0) return null;

  const visible = tags.slice(0, MAX_VISIBLE_TAGS);
  const overflow = tags.length - MAX_VISIBLE_TAGS;

  return (
    <div className="card-tag-row" aria-label={`${tags.length} tag${tags.length !== 1 ? "s" : ""}`}>
      {visible.map(tag => {
        const url = resolveTagLogoUrl(tag, tagLogos);
        return url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={tag}
            className="card-tag-logo"
            src={url}
            alt={tag}
            title={tag}
          />
        ) : (
          <span key={tag} className="card-tag-fallback" title={tag}>
            {tag.slice(0, 1).toUpperCase()}
          </span>
        );
      })}
      {overflow > 0 && (
        <span className="card-tag-overflow">+{overflow}</span>
      )}
    </div>
  );
}

// ── ActivityCard ───────────────────────────────────────────────────────────

type Props = {
  activity: Activity;
  toolLogos: ToolLogoMap;
  tagLogos?: Record<string, string>;
  viewCount?: number;
  isCompleted?: boolean;
  /** When set, RotatingTools shows only this tool (if the activity has it) instead of all of them. */
  onlyTool?: string | null;
  /** Whether this workflow is in My Workflows (hearted / onboarding-saved). */
  isSaved?: boolean;
  /** Toggle save to My Workflows. When omitted, the heart is hidden. */
  onToggleSave?: (activityId: string) => void;
};

export default function ActivityCard({
  activity,
  toolLogos,
  tagLogos = {},
  viewCount = 0,
  isCompleted = false,
  onlyTool = null,
  isSaved = false,
  onToggleSave,
}: Props) {
  const theme = getTheme(activity.id);
  const allTools = normalizeActivityTools(activity.tools);
  const preferredOnly = onlyTool ? allTools.filter(t => t.toLowerCase() === onlyTool.toLowerCase()) : [];
  const tools = preferredOnly.length > 0 ? preferredOnly : allTools;
  const [navigating, setNavigating] = useState(false);
  const showHeart = !!onToggleSave;

  const inner = (
    <>
      {/* Poster */}
      <div className={`card-poster ${theme.posterColor}${activity.thumbnail_url ? " has-thumbnail" : ""}${showHeart ? " has-like" : ""}`}>
        {activity.is_featured && <span className="new-badge">New</span>}
        {showHeart && (
          <button
            type="button"
            className={`card-like-btn${isSaved ? " is-saved" : ""}`}
            title={isSaved ? "Remove from My Workflows" : "Save to My Workflows"}
            aria-label={isSaved ? "Remove from My Workflows" : "Save to My Workflows"}
            aria-pressed={isSaved}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSave(activity.id);
            }}
          >
            <HeartIcon filled={isSaved} />
          </button>
        )}
        {activity.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="card-thumbnail" src={activity.thumbnail_url} alt={activity.title} />
        ) : (
          <Scene theme={theme} />
        )}
        {isCompleted && (
          <span style={{
            position: "absolute", bottom: 10, left: 12, zIndex: 15,
            fontSize: 10, fontWeight: 700, color: "#23CE68",
            background: "rgba(35,206,104,.15)", border: "1px solid rgba(35,206,104,.3)",
            borderRadius: 999, padding: "3px 9px",
          }}>
            ✓ Done
          </span>
        )}
      </div>

      {/* Body */}
      <div className="card-body">
        <div className="meta-line">
          {tools.length > 0 && (
            <RotatingTools
              tools={tools}
              toolLogos={toolLogos}
              iconSize={14}
              insetScale={0.9}
              borderColor="#E5E0D8"
              labelColor="#221D23"
              labelSize={10}
              chipStyle={{ padding: "6px 9px 6px 6px", fontWeight: 900 }}
            />
          )}
          {viewCount > 0 && (
            <span
              title={`${viewCount} view${viewCount !== 1 ? "s" : ""}`}
              style={{
                marginLeft: "auto", display: "flex", alignItems: "center", gap: 4,
                fontSize: 10, fontWeight: 800, color: "#221D23",
                background: "#FFCE00", borderRadius: 20, padding: "3px 7px 3px 5px",
                letterSpacing: ".01em", flexShrink: 0, lineHeight: 1,
              }}
            >
              <EyeIcon />
              {formatViewCount(viewCount)}
            </span>
          )}
        </div>
        <h3 className="card-title">{activity.title}</h3>
        {activity.description && <p className="card-desc">{activity.description}</p>}
        <TagLogosRow tags={activity.tags ?? []} tagLogos={tagLogos} />
      </div>

      {navigating && (
        <div className="card-nav-loading" aria-hidden="true">
          <span className="card-nav-spinner" />
        </div>
      )}
    </>
  );

  return (
    <Link
      href={`/activity/${activity.id}`}
      className={`workflow-card${navigating ? " is-navigating" : ""}`}
      onClick={() => setNavigating(true)}
      aria-busy={navigating}
    >
      {inner}
    </Link>
  );
}
