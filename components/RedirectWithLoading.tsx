"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoadingIndicator, useNavigationLoading } from "@/components/NavigationLoading";

/**
 * Renders the shared page-nav loading UI, then client-navigates to `href`.
 * Uses NavigationLoading so the overlay stays up until the destination route is ready.
 */
export default function RedirectWithLoading({
  href,
  label = "Loading your page",
}: {
  href: string;
  label?: string;
}) {
  const router = useRouter();
  const { startNavigating } = useNavigationLoading();

  useEffect(() => {
    // defer: true avoids flushSync-inside-lifecycle (which breaks the overlay).
    startNavigating(href, { defer: true });
    const timer = window.setTimeout(() => {
      router.replace(href);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [href, router, startNavigating]);

  return (
    <div
      className="page-nav-loading"
      style={{ paddingLeft: 0 }}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <PageLoadingIndicator label={label} />
    </div>
  );
}
