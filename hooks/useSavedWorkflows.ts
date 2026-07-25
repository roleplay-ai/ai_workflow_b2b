"use client";

import { useEffect, useState } from "react";

/** Shared save/unsave-toggle state for workflow cards, backed by /api/workflows/save. */
export function useSavedWorkflows(userId: string, savedWorkflowIds: string[]) {
  const [savedIds, setSavedIds] = useState(() => new Set(savedWorkflowIds));
  const [savePendingIds, setSavePendingIds] = useState(() => new Set<string>());
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setSavedIds(new Set(savedWorkflowIds));
  }, [savedWorkflowIds]);

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

  return { savedIds, savePendingIds, saveError, toggleSaveWorkflow };
}
