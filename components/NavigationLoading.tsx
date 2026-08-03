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
    pathname.startsWith("/capabilities") ||
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
      // Always set explicitly so 0 overrides the CSS --sidebar-w default
      // on routes without a sidebar (e.g. `/` during the home → ask-ai handoff).
      style={{ paddingLeft: sidebarOffset }}
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
  const pendingRef = React.useRef(false);
  const targetRef = React.useRef<string | null>(null);
  const shownAtRef = React.useRef(0);
  const previousPathnameRef = React.useRef(pathname);

  const startNavigating = React.useCallback((href?: string) => {
    let target: string | null = null;
    if (href) {
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        target = url.pathname;
      } catch {
        target = href.split("?")[0].split("#")[0];
      }
    }
    if (target && target === pathname) return;
    if (pendingRef.current && targetRef.current === target) return;

    targetRef.current = target;
    pendingRef.current = true;
    // Link navigations run inside a React transition. Without flushSync the
    // pending state is deferred until the route finishes — so the overlay never paints.
    flushSync(() => {
      shownAtRef.current = Date.now();
      setPending(true);
    });
  }, [pathname]);

  // Capture every normal internal link. This makes the animation automatic for
  // Next.js Links and plain anchors instead of relying on each page to opt in.
  React.useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const eventElement = event.target instanceof Element
        ? event.target
        : event.target instanceof Node
          ? event.target.parentElement
          : null;
      const anchor = eventElement?.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) {
        return;
      }

      startNavigating(url.href);
    }

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [startNavigating]);

  // Browser Back and Forward do not dispatch a click, so start the same
  // animation as soon as the history destination becomes known.
  React.useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname !== pathname) {
        startNavigating(window.location.href);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [pathname, startNavigating]);

  // Fallback for programmatic router navigation and server redirects that did
  // not originate from a link or an explicit startNavigating call.
  React.useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    if (pendingRef.current) return;

    targetRef.current = pathname;
    pendingRef.current = true;
    shownAtRef.current = Date.now();
    setPending(true);
  }, [pathname]);

  React.useEffect(() => {
    if (!pending) return;

    const target = targetRef.current;
    // Still navigating toward a different route
    if (target && pathname !== target) {
      return;
    }

    const elapsed = Date.now() - shownAtRef.current;
    const remaining = Math.max(0, 280 - elapsed);
    const timer = window.setTimeout(() => {
      targetRef.current = null;
      pendingRef.current = false;
      setPending(false);
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [pathname, pending]);

  // Safety: never leave the overlay stuck if navigation is cancelled
  React.useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => {
      targetRef.current = null;
      pendingRef.current = false;
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
