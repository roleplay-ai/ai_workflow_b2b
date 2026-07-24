"use client";

import React from "react";
import { flushSync } from "react-dom";
import { usePathname } from "next/navigation";

type NavigationLoadingContextValue = {
  startNavigating: (href?: string) => void;
};

const NavigationLoadingContext = React.createContext<NavigationLoadingContextValue>({
  startNavigating: () => {},
});

export function useNavigationLoading() {
  return React.useContext(NavigationLoadingContext);
}

export function PageLoadingIndicator({ label = "Loading your page" }: { label?: string }) {
  return (
    <div
      className="page-nav-loading-content"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/nudgeable-logo.png"
        alt=""
        className="page-nav-loading-logo"
      />
      <div className="page-nav-loading-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function getSidebarOffset(pathname: string): number {
  if (typeof window !== "undefined" && window.innerWidth <= 900) return 0;
  if (pathname.startsWith("/admin") || pathname.startsWith("/superadmin")) return 256;
  if (
    pathname.startsWith("/apply") ||
    pathname.startsWith("/workflows") ||
    pathname.startsWith("/updates") ||
    pathname.startsWith("/ask-ai") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/team") ||
    pathname.startsWith("/analytics")
  ) {
    return 270;
  }
  return 0;
}

function PageLoadingOverlay({ sidebarOffset }: { sidebarOffset: number }) {
  return (
    <div
      className="page-nav-loading"
      style={{ paddingLeft: sidebarOffset > 0 ? sidebarOffset : undefined }}
      role="status"
      aria-live="polite"
      aria-label="Loading your page"
    >
      <PageLoadingIndicator />
    </div>
  );
}

export default function NavigationLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [pending, setPending] = React.useState(false);
  const targetRef = React.useRef<string | null>(null);
  const shownAtRef = React.useRef(0);

  function startNavigating(href?: string) {
    const target = href ? href.split("?")[0].split("#")[0] : null;
    if (target && target === pathname) return;

    targetRef.current = target;
    // Link navigations run inside a React transition. Without flushSync the
    // pending state is deferred until the route finishes — so the overlay never paints.
    flushSync(() => {
      shownAtRef.current = Date.now();
      setPending(true);
    });
  }

  React.useEffect(() => {
    if (!pending) return;

    const target = targetRef.current;
    // Still navigating toward a different route
    if (target && pathname !== target && !pathname.startsWith(target + "/")) {
      return;
    }

    const elapsed = Date.now() - shownAtRef.current;
    const remaining = Math.max(0, 280 - elapsed);
    const timer = window.setTimeout(() => {
      targetRef.current = null;
      setPending(false);
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [pathname, pending]);

  // Safety: never leave the overlay stuck if navigation is cancelled
  React.useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => {
      targetRef.current = null;
      setPending(false);
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [pending]);

  const sidebarOffset = getSidebarOffset(pathname);

  return (
    <NavigationLoadingContext.Provider value={{ startNavigating }}>
      {children}
      {pending && <PageLoadingOverlay sidebarOffset={sidebarOffset} />}
    </NavigationLoadingContext.Provider>
  );
}
