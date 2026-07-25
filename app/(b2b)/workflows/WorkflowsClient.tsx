"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Activity } from "@/lib/supabase/types";
import { formatToolLabel, normalizeActivityTools } from "@/lib/tools";
import type { ToolLogoMap } from "@/lib/toolLogos";
import B2BTopbar from "@/components/B2BTopbar";
import ToolIcon from "@/components/ToolIcon";
import styles from "./workflows.module.css";

export type WorkflowCategoryMetadata = {
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  icon: string | null;
  display_order: number;
  is_visible: boolean;
};

export type ContinueWorkflowProgress = {
  activityId: string;
  completedSteps: number;
  totalSteps: number;
  updatedAt: string;
};

type Props = {
  activities: Activity[];
  toolLogos: ToolLogoMap;
  userId: string;
  viewCounts: Record<string, number>;
  completedIds: string[];
  inProgressIds: string[];
  savedWorkflowIds: string[];
  categoryMetadata: WorkflowCategoryMetadata[];
  continueProgress: ContinueWorkflowProgress | null;
};

type CategorySummary = WorkflowCategoryMetadata & {
  count: number;
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

const CATEGORY_ORDER_FALLBACKS: Record<string, number> = {
  "get set up": 10,
  "automate email & tasks": 20,
  "make presentations": 30,
  "organize knowledge in one place": 40,
  "analyze data": 50,
  "delegate multi-step work to an agent": 60,
  "generate videos": 70,
  "make your chatbot remember you": 80,
  "build a voice chatbot": 90,
  "build a web app": 100,
  "teach ai your way of working": 110,
  "build a text chatbot": 120,
  "research the market": 130,
  "generate images": 140,
  "build a website": 150,
  "data security": 160,
};

const REDUNDANT_LEGACY_CATEGORIES = new Set(["automate", "build", "chat", "setup"]);

function categoryIcon(category: WorkflowCategoryMetadata | undefined): string {
  if (!category) return "✦";
  return category.icon || CATEGORY_ICON_FALLBACKS[category.name.toLowerCase()] || "◇";
}

function formatViewCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K`;
  return String(count);
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="5" />
      <path d="m12 12 3.5 3.5" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l8.9 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

function WorkflowCard({
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

export default function WorkflowsClient({
  activities,
  toolLogos,
  userId,
  viewCounts,
  completedIds: completedIdList,
  inProgressIds: inProgressIdList,
  savedWorkflowIds,
  categoryMetadata,
  continueProgress,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const queryParam = searchParams.get("q") ?? "";
  const selectedTag = searchParams.get("tag");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [categorySearch, setCategorySearch] = useState("");
  const [workflowSearch, setWorkflowSearch] = useState(queryParam);
  const [savedIds, setSavedIds] = useState(() => new Set(savedWorkflowIds));
  const [savePendingIds, setSavePendingIds] = useState(() => new Set<string>());
  const [saveError, setSaveError] = useState("");
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
  const completedIds = useMemo(() => new Set(completedIdList), [completedIdList]);
  const inProgressIds = useMemo(() => new Set(inProgressIdList), [inProgressIdList]);

  useEffect(() => {
    setSelectedCategory(categoryParam);
    setWorkflowSearch(queryParam);
  }, [categoryParam, queryParam]);

  useEffect(() => {
    setSavedIds(new Set(savedWorkflowIds));
  }, [savedWorkflowIds]);

  useEffect(() => {
    if (!savedDrawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSavedDrawerOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [savedDrawerOpen]);

  const metadataByName = useMemo(
    () => new Map(categoryMetadata.map((category) => [category.name.toLowerCase(), category])),
    [categoryMetadata],
  );

  const categorySummaries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const activity of activities) {
      for (const rawCategory of activity.categories ?? []) {
        const name = rawCategory.trim();
        if (name) counts.set(name.toLowerCase(), (counts.get(name.toLowerCase()) ?? 0) + 1);
      }
    }

    const summaries: CategorySummary[] = categoryMetadata
      .filter((category) =>
        category.is_visible !== false &&
        !REDUNDANT_LEGACY_CATEGORIES.has(category.name.toLowerCase()),
      )
      .map((category) => ({
        ...category,
        count: counts.get(category.name.toLowerCase()) ?? 0,
      }))
      .filter((category) => category.count > 0)
      .sort((a, b) => {
        const aOrder = a.display_order > 0
          ? a.display_order
          : CATEGORY_ORDER_FALLBACKS[a.name.toLowerCase()] ?? 1000;
        const bOrder = b.display_order > 0
          ? b.display_order
          : CATEGORY_ORDER_FALLBACKS[b.name.toLowerCase()] ?? 1000;
        return aOrder - bOrder || a.name.localeCompare(b.name);
      });

    const knownNames = new Set(summaries.map((category) => category.name.toLowerCase()));
    for (const [lowerName, count] of counts) {
      if (knownNames.has(lowerName) || REDUNDANT_LEGACY_CATEGORIES.has(lowerName) || count === 0) continue;
      const activityName = activities
        .flatMap((activity) => activity.categories ?? [])
        .find((name) => name.toLowerCase() === lowerName);
      if (!activityName) continue;
      summaries.push({
        name: activityName,
        description: null,
        thumbnail_url: null,
        icon: null,
        display_order: Number.MAX_SAFE_INTEGER,
        is_visible: true,
        count,
      });
    }
    return summaries;
  }, [activities, categoryMetadata]);

  const visibleCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return categorySummaries;
    return categorySummaries.filter((category) =>
      category.name.toLowerCase().includes(query) ||
      (category.description ?? "").toLowerCase().includes(query),
    );
  }, [categorySearch, categorySummaries]);

  const filteredActivities = useMemo(() => {
    let result = activities;
    if (selectedCategory) {
      result = result.filter((activity) =>
        (activity.categories ?? []).some((category) => category.toLowerCase() === selectedCategory.toLowerCase()),
      );
    }
    if (selectedTag) {
      result = result.filter((activity) =>
        (activity.tags ?? []).some((tag) => tag.toLowerCase() === selectedTag.toLowerCase()),
      );
    }
    const query = workflowSearch.trim().toLowerCase();
    if (query) {
      result = result.filter((activity) =>
        activity.title.toLowerCase().includes(query) ||
        (activity.description ?? "").toLowerCase().includes(query) ||
        (activity.categories ?? []).some((category) => category.toLowerCase().includes(query)) ||
        (activity.tags ?? []).some((tag) => tag.toLowerCase().includes(query)) ||
        normalizeActivityTools(activity.tools).some((tool) =>
          formatToolLabel(tool).toLowerCase().includes(query),
        ),
      );
    }
    return result;
  }, [activities, selectedCategory, selectedTag, workflowSearch]);

  const savedActivities = useMemo(() => {
    const activityById = new Map(activities.map((activity) => [activity.id, activity]));
    return [...savedIds]
      .map((activityId) => activityById.get(activityId))
      .filter((activity): activity is Activity => Boolean(activity));
  }, [activities, savedIds]);

  const continueActivity = continueProgress
    ? activities.find((activity) => activity.id === continueProgress.activityId) ?? null
    : null;

  const isResultView = Boolean(selectedCategory || selectedTag || queryParam.trim());
  const selectedCategoryMetadata = selectedCategory
    ? metadataByName.get(selectedCategory.toLowerCase())
    : undefined;
  const recentlyAdded = activities.some(
    (activity) => Date.now() - new Date(activity.created_at).getTime() <= 7 * 24 * 60 * 60 * 1000,
  );

  function openCategory(category: string) {
    setSelectedCategory(category);
    setWorkflowSearch("");
    router.replace(`/workflows?category=${encodeURIComponent(category)}`, { scroll: false });
  }

  function returnToCategories() {
    setSelectedCategory(null);
    setWorkflowSearch("");
    router.replace("/workflows?browse=all", { scroll: false });
  }

  function toggleSaveWorkflow(activityId: string) {
    if (!userId || savePendingIds.has(activityId)) return;
    const wasSaved = savedIds.has(activityId);
    setSaveError("");
    setSavePendingIds((current) => new Set(current).add(activityId));
    setSavedIds((current) => {
      const next = new Set(current);
      if (wasSaved) next.delete(activityId);
      else {
        next.delete(activityId);
        return new Set([activityId, ...next]);
      }
      return next;
    });

    void fetch("/api/workflows/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId }),
      keepalive: true,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not update saved workflow");
        const body = await response.json() as { saved?: boolean };
        setSavedIds((current) => {
          const next = new Set(current);
          next.delete(activityId);
          if (body.saved) return new Set([activityId, ...next]);
          return next;
        });
      })
      .catch(() => {
        setSaveError("Your saved workflows could not be updated. Please try again.");
        setSavedIds((current) => {
          const next = new Set(current);
          if (wasSaved) return new Set([activityId, ...next]);
          else next.delete(activityId);
          return next;
        });
      })
      .finally(() => {
        setSavePendingIds((current) => {
          const next = new Set(current);
          next.delete(activityId);
          return next;
        });
      });
  }

  function renderWorkflowCard(activity: Activity) {
    const primaryCategory = (activity.categories ?? [])[0]?.toLowerCase();
    return (
      <WorkflowCard
        key={activity.id}
        activity={activity}
        category={primaryCategory ? metadataByName.get(primaryCategory) : undefined}
        toolLogos={toolLogos}
        viewCount={viewCounts[activity.id] ?? 0}
        isCompleted={completedIds.has(activity.id)}
        isInProgress={inProgressIds.has(activity.id)}
        isSaved={savedIds.has(activity.id)}
        isSavePending={savePendingIds.has(activity.id)}
        onToggleSave={toggleSaveWorkflow}
      />
    );
  }

  const resultTitle = selectedCategory
    ? selectedCategory
    : selectedTag
      ? selectedTag
      : queryParam.trim()
        ? `Results for “${queryParam.trim()}”`
        : "All workflows";

  return (
    <>
      <B2BTopbar />
      <main className={styles.workflowPage}>
        {!isResultView ? (
          <>
            <header className={styles.pageHeader}>
              <div>
                <h1>Workflows</h1>
                <p>Browse practical AI workflows by category.</p>
              </div>
              <div className={styles.headerActions}>
                {recentlyAdded ? <span className={styles.updatedPill}>Updated this week</span> : null}
                <button
                  type="button"
                  className={styles.savedTrigger}
                  aria-expanded={savedDrawerOpen}
                  aria-controls="saved-workflows-drawer"
                  onClick={() => setSavedDrawerOpen(true)}
                >
                  <HeartIcon filled={false} />
                  Saved workflows
                  {savedIds.size > 0 ? <span>{savedIds.size}</span> : null}
                </button>
              </div>
            </header>
            {saveError ? <p className={styles.saveError} role="status">{saveError}</p> : null}

            <div className={styles.searchBox}>
              <SearchIcon />
              <input
                value={categorySearch}
                onChange={(event) => setCategorySearch(event.target.value)}
                placeholder="Search categories"
                aria-label="Search workflow categories"
              />
            </div>

            {continueActivity && continueProgress ? (
              <section className={styles.section}>
                <div className={styles.sectionHeading}>
                  <h2>Continue practising</h2>
                </div>
                <div className={styles.continueCard}>
                  <span className={styles.continueIcon}>
                    {categoryIcon(metadataByName.get((continueActivity.categories?.[0] ?? "").toLowerCase()))}
                  </span>
                  <div className={styles.continueCopy}>
                    <strong>{continueActivity.title}</strong>
                    <span>
                      {continueProgress.totalSteps > 0
                        ? `Step ${Math.min(continueProgress.completedSteps + 1, continueProgress.totalSteps)} of ${continueProgress.totalSteps}`
                        : "In progress"}
                      {continueActivity.time_estimate_minutes
                        ? ` · ${Math.max(1, Math.round(continueActivity.time_estimate_minutes * (1 - Math.min(continueProgress.completedSteps / Math.max(continueProgress.totalSteps, 1), 0.9))))} minutes remaining`
                        : ""}
                    </span>
                    {continueProgress.totalSteps > 0 ? (
                      <span className={styles.progressTrack}>
                        <span style={{ width: `${Math.min(100, (continueProgress.completedSteps / continueProgress.totalSteps) * 100)}%` }} />
                      </span>
                    ) : null}
                  </div>
                  <Link href={`/activity/${continueActivity.id}`} className={styles.primaryButton}>Continue</Link>
                </div>
              </section>
            ) : null}

            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <h2>All categories</h2>
              </div>
              {visibleCategories.length > 0 ? (
                <div className={styles.categoryGrid}>
                  {visibleCategories.map((category) => (
                    <button type="button" key={category.name} className={styles.categoryCard} onClick={() => openCategory(category.name)}>
                      <span className={styles.categoryCardIcon}>{categoryIcon(category)}</span>
                      <span className={styles.categoryCardMain}>
                        <strong>{category.name}</strong>
                        {category.description ? <small>{category.description}</small> : null}
                        <span className={styles.categoryCardFooter}>
                          <span>{category.count} workflow{category.count === 1 ? "" : "s"}</span>
                          <span>Explore →</span>
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>No categories match your search.</div>
              )}
            </section>
          </>
        ) : (
          <>
            <header className={`${styles.pageHeader} ${styles.resultsHeader}`}>
              <div>
                <span className={styles.eyebrow}>{selectedCategory ? "Workflow category" : "Workflow library"}</span>
                <h1>{resultTitle}</h1>
                {selectedCategoryMetadata?.description ? <p>{selectedCategoryMetadata.description}</p> : null}
              </div>
              <button type="button" className={styles.secondaryButton} onClick={returnToCategories}>← All categories</button>
            </header>

            <div className={styles.searchBox}>
              <SearchIcon />
              <input
                value={workflowSearch}
                onChange={(event) => setWorkflowSearch(event.target.value)}
                placeholder={selectedCategory ? "Search workflows in this category" : "Search workflows"}
                aria-label="Search workflows"
              />
            </div>

            <div className={styles.categorySummary}>
              <span>{filteredActivities.length} workflow{filteredActivities.length === 1 ? "" : "s"}</span>
              <span>Choose a workflow to open the guided activity.</span>
            </div>

            {filteredActivities.length > 0 ? (
              <div className={styles.workflowGrid}>{filteredActivities.map(renderWorkflowCard)}</div>
            ) : (
              <div className={styles.emptyState}>No workflows match this search.</div>
            )}
          </>
        )}
      </main>

      <button
        type="button"
        className={`${styles.drawerBackdrop} ${savedDrawerOpen ? styles.drawerBackdropOpen : ""}`}
        aria-label="Close saved workflows"
        tabIndex={savedDrawerOpen ? 0 : -1}
        onClick={() => setSavedDrawerOpen(false)}
      />
      <aside
        id="saved-workflows-drawer"
        className={`${styles.savedDrawer} ${savedDrawerOpen ? styles.savedDrawerOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!savedDrawerOpen}
        aria-labelledby="saved-workflows-title"
        inert={!savedDrawerOpen}
      >
        <header>
          <div>
            <h2 id="saved-workflows-title">Saved workflows</h2>
            <p>Workflows you saved for quick access.</p>
          </div>
          <button type="button" onClick={() => setSavedDrawerOpen(false)} aria-label="Close saved workflows">×</button>
        </header>
        <div className={styles.savedDrawerBody}>
          {savedActivities.length > 0 ? (
            <div className={styles.savedList}>{savedActivities.map(renderWorkflowCard)}</div>
          ) : (
            <div className={styles.savedEmpty}>
              <span className={styles.savedEmptyIcon}><HeartIcon filled={false} /></span>
              <strong>No saved workflows yet</strong>
              <span>Select the heart on any workflow to keep it here for quick access.</span>
              <button type="button" onClick={() => setSavedDrawerOpen(false)}>Browse workflows</button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
