"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useNavigationLoading } from "@/components/NavigationLoading";
import styles from "@/components/b2b-shell.module.css";

type Props = {
  userName: string | null;
  userEmail: string | null;
  userInitials: string;
};

type NavItemProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  activePaths?: string[];
  onNavigate?: () => void;
};

function NavItem({ href, label, icon, badge, activePaths, onNavigate }: NavItemProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { startNavigating } = useNavigationLoading();
  const active = activePaths
    ? activePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={(event) => {
        onNavigate?.();
        if (pathname === href && window.location.search === "") {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        startNavigating(href);
        router.push(href);
      }}
    >
      <span className={styles.navIcon}>{icon}</span>
      <span className={styles.navLabel}>{label}</span>
      {badge ? <span className={styles.navBadge}>{badge}</span> : null}
    </Link>
  );
}

function FilterLink({
  href,
  mark,
  children,
  onNavigate,
}: {
  href: string;
  mark: string;
  children: React.ReactNode;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const { startNavigating } = useNavigationLoading();

  return (
    <Link
      className={styles.filterLink}
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onNavigate();
        startNavigating(href);
        router.push(href);
      }}
    >
      <span className={styles.filterMark}>{mark}</span>
      <span>{children}</span>
    </Link>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export default function B2BSidebar({ userName, userEmail, userInitials }: Props) {
  const supabase = createClient();
  const pathname = usePathname();
  const router = useRouter();
  const { startNavigating } = useNavigationLoading();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  React.useEffect(() => {
    const openDrawer = () => setDrawerOpen(true);
    window.addEventListener("b2b:open-sidebar", openDrawer);
    return () => window.removeEventListener("b2b:open-sidebar", openDrawer);
  }, []);

  React.useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function goToProfile(event: React.MouseEvent<HTMLAnchorElement>) {
    setMenuOpen(false);
    setDrawerOpen(false);
    if (pathname === "/profile" && window.location.search === "") {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    startNavigating("/profile");
    router.push("/profile");
  }

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <button
        type="button"
        className={`${styles.drawerBackdrop} ${drawerOpen ? styles.drawerBackdropVisible : ""}`}
        aria-label="Close navigation"
        tabIndex={drawerOpen ? 0 : -1}
        onClick={closeDrawer}
      />
      <aside className={`${styles.sidebar} ${drawerOpen ? styles.sidebarOpen : ""}`} aria-label="Participant navigation">
        <div className={styles.brandRow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.brandLogo} src="/nudgeable-logo.png" alt="" />
          <span className={styles.brandName}>AI Practice Lab</span>
          <button type="button" className={styles.drawerClose} onClick={closeDrawer} aria-label="Close navigation">
            <Icon><path d="M4 4l10 10M14 4L4 14" /></Icon>
          </button>
        </div>

        <div className={styles.sidebarScroll}>
          <nav className={styles.primaryNav} aria-label="Main">
            <NavItem
              href="/ask-ai"
              label="Ask AI"
              onNavigate={closeDrawer}
              icon={<Icon><path d="M9 2l1.15 3.6L14 6.8l-3.85 1.2L9 11.6 7.85 8 4 6.8l3.85-1.2L9 2z" /></Icon>}
            />
            <NavItem
              href="/workflows"
              label="Workflows"
              badge="New"
              onNavigate={closeDrawer}
              icon={<Icon><rect x="2.25" y="2.25" width="5.5" height="5.5" rx="1.2" /><rect x="10.25" y="2.25" width="5.5" height="5.5" rx="1.2" /><rect x="2.25" y="10.25" width="5.5" height="5.5" rx="1.2" /><rect x="10.25" y="10.25" width="5.5" height="5.5" rx="1.2" /></Icon>}
            />
            <NavItem
              href="/updates"
              label="Learn"
              activePaths={["/updates", "/mastery"]}
              onNavigate={closeDrawer}
              icon={<Icon><path d="M3 3.5h8.3A2.7 2.7 0 0 1 14 6.2V15H5.7A2.7 2.7 0 0 1 3 12.3V3.5z" /><path d="M5.7 12.2H14M6 6.5h5M6 9h4" /></Icon>}
            />
          </nav>

          <section className={styles.sidebarSection} aria-labelledby="capabilities-label">
            <h2 id="capabilities-label" className={styles.sectionLabel}>Capabilities</h2>
            <FilterLink href="/workflows?q=Skills" mark="✦" onNavigate={closeDrawer}>Skills</FilterLink>
            <FilterLink href="/workflows?q=Projects" mark="⌁" onNavigate={closeDrawer}>Projects</FilterLink>
            <FilterLink href="/workflows?q=Vibe%20coding" mark="⌘" onNavigate={closeDrawer}>Vibe coding</FilterLink>
            <FilterLink href="/workflows?q=Scheduled%20actions" mark="◴" onNavigate={closeDrawer}>Scheduled actions</FilterLink>
            <FilterLink href="/workflows?q=AI%20Agents" mark="◇" onNavigate={closeDrawer}>AI agents</FilterLink>
            <FilterLink href="/workflows?q=Coding%20agents" mark="&lt;⁄&gt;" onNavigate={closeDrawer}>Coding agents</FilterLink>
          </section>

          <section className={styles.sidebarSection} aria-labelledby="providers-label">
            <h2 id="providers-label" className={styles.sectionLabel}>Unique to each</h2>
            <FilterLink href="/workflows?q=ChatGPT" mark="◎" onNavigate={closeDrawer}>ChatGPT</FilterLink>
            <FilterLink href="/workflows?q=Claude" mark="A" onNavigate={closeDrawer}>Claude</FilterLink>
            <FilterLink href="/workflows?q=Gemini" mark="✦" onNavigate={closeDrawer}>Gemini</FilterLink>
            <FilterLink href="/workflows?q=Copilot" mark="◈" onNavigate={closeDrawer}>Copilot</FilterLink>
          </section>
        </div>

        <div className={styles.profileFooter}>
          {menuOpen ? (
            <>
              <button className={styles.profileMenuBackdrop} type="button" aria-label="Close profile menu" onClick={() => setMenuOpen(false)} />
              <div className={styles.profileMenu}>
                <div className={styles.profileMenuIdentity}>
                  <strong>{userName ?? "User"}</strong>
                  <span>{userEmail}</span>
                </div>
                <Link className={styles.profileMenuItem} href="/profile" onClick={goToProfile}>
                  <Icon><circle cx="9" cy="6" r="3" /><path d="M3.5 16c.3-3.2 2.4-5 5.5-5s5.2 1.8 5.5 5" /></Icon>
                  View profile
                </Link>
                <button className={`${styles.profileMenuItem} ${styles.signOutItem}`} type="button" disabled={signingOut} onClick={handleSignOut}>
                  <Icon><path d="M7 3H3.5A1.5 1.5 0 0 0 2 4.5v9A1.5 1.5 0 0 0 3.5 15H7M12 12.5 15.5 9 12 5.5M15 9H7" /></Icon>
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </>
          ) : null}

          <button type="button" className={styles.profileButton} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            <span className={styles.avatar}>{userInitials}</span>
            <span className={styles.profileText}>
              <strong>{userName ?? "User"}</strong>
              <span>{userEmail}</span>
            </span>
            <svg className={menuOpen ? styles.chevronOpen : ""} width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="m3.5 5.5 4 4 4-4" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
