"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useNavigationLoading } from "@/components/NavigationLoading";
import styles from "@/components/b2b-shell.module.css";

type NewActivity = {
  id: string;
  title: string;
  tools: string | string[] | null | undefined;
  description?: string | null;
};

type Props = {
  searchQuery?: string;
  onSearch?: (q: string) => void;
  newActivities?: NewActivity[];
  activeTag?: string | null;
  points?: number | null;
};

const PAGE_LABELS: Record<string, string> = {
  "/updates": "Learn",
  "/mastery": "Learn",
  "/profile": "My Progress",
  "/team": "Team Dashboard",
  "/analytics": "Analytics",
};

function RouteLink({
  href,
  className,
  children,
  ariaCurrent,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
  ariaCurrent?: "page";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { startNavigating } = useNavigationLoading();

  return (
    <Link
      href={href}
      className={className}
      aria-current={ariaCurrent}
      onClick={(event) => {
        if (pathname === href && window.location.search === "") {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        startNavigating(href);
        router.push(href);
      }}
    >
      {children}
    </Link>
  );
}

export default function B2BTopbar({
  searchQuery: _searchQuery = "",
  onSearch: _onSearch,
  newActivities: _newActivities = [],
  activeTag: _activeTag = null,
  points: pointsProp,
}: Props) {
  const pathname = usePathname();
  const [fetchedPoints, setFetchedPoints] = useState<number | null>(null);
  const points = pointsProp !== undefined ? pointsProp : fetchedPoints;
  const modeSwitchVisible = pathname === "/ask-ai" || pathname.startsWith("/ask-ai/") || pathname === "/workflows" || pathname.startsWith("/workflows/");
  const pageLabel = Object.entries(PAGE_LABELS).find(([route]) => pathname === route || pathname.startsWith(`${route}/`))?.[1] ?? "AI Practice Lab";

  void _searchQuery;
  void _onSearch;
  void _newActivities;
  void _activeTag;

  useEffect(() => {
    if (pointsProp !== undefined) return;
    const supabase = createClient();
    void (async () => {
      const { data } = await supabase.rpc("get_my_points_stats");
      if (data && typeof data === "object" && "user_points" in data) {
        setFetchedPoints(Number((data as { user_points?: number }).user_points ?? 0));
      }
    })();
  }, [pointsProp]);

  return (
    <header className={styles.topbar}>
      <button
        type="button"
        className={styles.mobileMenuButton}
        aria-label="Open navigation"
        onClick={() => window.dispatchEvent(new Event("b2b:open-sidebar"))}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      <div className={styles.topbarCenter}>
        {modeSwitchVisible ? (
          <nav className={styles.modeSwitch} aria-label="Practice area">
            <RouteLink
              href="/ask-ai"
              className={`${styles.modeLink} ${pathname.startsWith("/ask-ai") ? styles.modeLinkActive : ""}`}
              ariaCurrent={pathname.startsWith("/ask-ai") ? "page" : undefined}
            >
              Ask AI
            </RouteLink>
            <RouteLink
              href="/workflows"
              className={`${styles.modeLink} ${pathname.startsWith("/workflows") ? styles.modeLinkActive : ""}`}
              ariaCurrent={pathname.startsWith("/workflows") ? "page" : undefined}
            >
              Workflows
            </RouteLink>
          </nav>
        ) : (
          <span className={styles.pageTitle}>{pageLabel}</span>
        )}
      </div>

      <div className={styles.topbarActions}>
        <RouteLink href="/profile" className={styles.progressLink} ariaCurrent={pathname.startsWith("/profile") ? "page" : undefined}>
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
            <path d="M3 14V9M7 14V6M11 14V3M15 14V8" />
          </svg>
          <span className={styles.progressText}>My Progress</span>
        </RouteLink>
        <span className={styles.pointsPill} title="Your points">
          <span aria-hidden="true">✦</span>
          {points === null ? "—" : points.toLocaleString()}
        </span>
      </div>
    </header>
  );
}
