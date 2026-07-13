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

function PageLoadingOverlay() {
  return (
    <div
      className="page-nav-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading your page"
    >
      <div className="page-nav-loading-content">
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

  return (
    <NavigationLoadingContext.Provider value={{ startNavigating }}>
      {children}
      {pending && <PageLoadingOverlay />}
    </NavigationLoadingContext.Provider>
  );
}
