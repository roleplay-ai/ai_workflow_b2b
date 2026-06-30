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

function formatViewCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

// ── ActivityCard ───────────────────────────────────────────────────────────

type Props = {
  activity: Activity;
  toolLogos: ToolLogoMap;
  viewCount?: number;
  isCompleted?: boolean;
};

export default function ActivityCard({ activity, toolLogos, viewCount = 0, isCompleted = false }: Props) {
  const theme = getTheme(activity.id);
  const tools = normalizeActivityTools(activity.tools);
  const [navigating, setNavigating] = useState(false);

  const inner = (
    <>
      {/* Poster */}
      <div className={`card-poster ${theme.posterColor}${activity.thumbnail_url ? " has-thumbnail" : ""}`}>
        {activity.is_featured && <span className="new-badge">New</span>}
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
      href={`https://app.nudgeable.ai/activity/${activity.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`workflow-card${navigating ? " is-navigating" : ""}`}
      onClick={() => setNavigating(true)}
      aria-busy={navigating}
    >
      {inner}
    </Link>
  );
}
