"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useNavigationLoading } from "@/components/NavigationLoading";
import {
  CAPABILITIES,
  INSIDER_GUIDE_ITEM,
  PROVIDER_FEATURES,
  PROVIDER_TOOLS,
  PROVIDERS,
  capabilityLabelForTool,
  type CapabilitySlug,
  type ProviderTool,
} from "@/lib/capabilities";
import ToolIcon from "@/components/ToolIcon";
import type { ToolLogoMap } from "@/lib/toolLogos";
import PersonalizationModal, { type PersonalizationKey } from "@/components/PersonalizationModal";
import styles from "@/components/b2b-shell.module.css";

const PERSONALIZATION_ITEMS: { key: PersonalizationKey; icon: string; name: string; description: string }[] = [
  { key: "customInstructions", icon: "✎", name: "Custom Instructions", description: "Your fixed response preferences" },
  { key: "userProfile", icon: "◉", name: "User Profile", description: "A profile that updates over time" },
  { key: "memoryFiles", icon: "▤", name: "Memory Files", description: "Detailed context pulled when relevant" },
  { key: "importMemory", icon: "⇩", name: "Import Memory", description: "Bring useful context from another AI" },
];

type Props = {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userInitials: string;
  toolLogos: ToolLogoMap;
};

type ConversationSummary = {
  id: string;
  title: string;
  is_saved: boolean;
  is_pinned: boolean;
  updated_at: string;
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

const FLYOUT_MOBILE_BREAKPOINT = 900;
const FLYOUT_WIDTH = 270;
const FLYOUT_GAP = 8;

/** Computes a fixed position to the right of `button`, flipping/clamping to stay on-screen. */
function useFlyoutPosition(open: boolean, buttonRef: React.RefObject<HTMLButtonElement | null>) {
  const [style, setStyle] = React.useState<React.CSSProperties>({});

  React.useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const button = buttonRef.current;
      if (!button) return;
      if (window.innerWidth <= FLYOUT_MOBILE_BREAKPOINT) {
        setStyle({});
        return;
      }
      const rect = button.getBoundingClientRect();
      let left = rect.right + FLYOUT_GAP;
      if (left + FLYOUT_WIDTH > window.innerWidth - 12) {
        left = Math.max(12, rect.left - FLYOUT_WIDTH - FLYOUT_GAP);
      }
      const estimatedHeight = 320;
      let top = rect.top;
      if (top + estimatedHeight > window.innerHeight - 12) {
        top = Math.max(12, window.innerHeight - estimatedHeight - 12);
      }
      setStyle({ left, top });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open, buttonRef]);

  return style;
}

/** Shared flyout shell: a sidebar row that opens a fixed panel to the right, matching the reference design. */
function SidebarFlyout({
  triggerIcon,
  triggerLabel,
  panelTitle,
  open,
  onToggle,
  onClose,
  children,
}: {
  triggerIcon: React.ReactNode;
  triggerLabel: string;
  panelTitle: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const style = useFlyoutPosition(open, buttonRef);

  return (
    <div className={styles.capabilityMenuRow}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.filterLink}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className={styles.filterMark}>{triggerIcon}</span>
        <span>{triggerLabel}</span>
        <span className={styles.capabilityMenuChevron} aria-hidden="true">›</span>
      </button>
      {open ? (
        <>
          <button type="button" className={styles.capabilityMenuBackdrop} aria-label="Close menu" onClick={onClose} />
          <div className={styles.capabilityMenu} role="menu" style={style}>
            <div className={styles.capabilityMenuTitle}>{panelTitle}</div>
            {children}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Sidebar trigger for a Capability: opens a menu of tool-specific variants before landing on an info page. */
function CapabilityMenuTrigger({
  slug,
  mark,
  open,
  onToggle,
  onNavigate,
  toolLogos,
}: {
  slug: CapabilitySlug;
  mark: string;
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  toolLogos: ToolLogoMap;
}) {
  const def = CAPABILITIES[slug];

  return (
    <SidebarFlyout
      triggerIcon={mark}
      triggerLabel={def.contentType}
      panelTitle={def.contentType}
      open={open}
      onToggle={onToggle}
      onClose={onToggle}
    >
      {PROVIDER_TOOLS.map((tool) => (
        <Link key={tool} href={`/capabilities/${slug}/${tool}`} onClick={onNavigate}>
          <span className={styles.capabilityMenuIcon}><ToolIcon tool={tool} size={18} logos={toolLogos} /></span>
          <span>{capabilityLabelForTool(slug, tool)}</span>
        </Link>
      ))}
    </SidebarFlyout>
  );
}

/** Sidebar trigger for a Provider (tool): opens a menu of that tool's own distinct features, mirroring the reference design's "Unique to each" panel exactly (Insider Guide + that tool's specific features — not the shared capabilities). */
function ProviderMenuTrigger({
  tool,
  open,
  onToggle,
  onNavigate,
  toolLogos,
}: {
  tool: ProviderTool;
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  toolLogos: ToolLogoMap;
}) {
  const provider = PROVIDERS[tool];
  const features = PROVIDER_FEATURES[tool];

  return (
    <SidebarFlyout
      triggerIcon={<ToolIcon tool={tool} size={18} logos={toolLogos} />}
      triggerLabel={provider.label}
      panelTitle={provider.label}
      open={open}
      onToggle={onToggle}
      onClose={onToggle}
    >
      <Link href={`/capabilities/tool/${tool}/insider-guide`} onClick={onNavigate}>
        <span className={styles.capabilityMenuIcon}>{INSIDER_GUIDE_ITEM.mark}</span>
        <span>{INSIDER_GUIDE_ITEM.label}</span>
      </Link>
      {features.map((feature) => (
        <Link key={feature.slug} href={`/capabilities/tool/${tool}/${feature.slug}`} onClick={onNavigate}>
          <span className={styles.capabilityMenuIcon}>{feature.mark}</span>
          <span>{feature.label}</span>
          {feature.isNew ? <span className={styles.capabilityMenuNewBadge}>New</span> : null}
        </Link>
      ))}
    </SidebarFlyout>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export default function B2BSidebar({ userId, userName, userEmail, userInitials, toolLogos }: Props) {
  const supabase = createClient();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startNavigating } = useNavigationLoading();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const [conversations, setConversations] = React.useState<ConversationSummary[]>([]);
  const [historyAvailable, setHistoryAvailable] = React.useState(false);
  const [historyMenuId, setHistoryMenuId] = React.useState<string | null>(null);
  const [renameId, setRenameId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [capabilityMenuKey, setCapabilityMenuKey] = React.useState<CapabilitySlug | null>(null);
  const [providerMenuKey, setProviderMenuKey] = React.useState<ProviderTool | null>(null);
  const [personalizationOpen, setPersonalizationOpen] = React.useState<PersonalizationKey | null>(null);
  const activeConversationId = searchParams.get("conversation");

  const refreshConversations = React.useCallback(async () => {
    const { data, error } = await supabase
      .from("ask_conversations")
      .select("id, title, is_saved, is_pinned, updated_at")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(10);

    if (error) {
      setHistoryAvailable(false);
      setConversations([]);
      return;
    }
    setHistoryAvailable(true);
    setConversations((data ?? []) as ConversationSummary[]);
  }, [supabase, userId]);

  React.useEffect(() => {
    const openDrawer = () => setDrawerOpen(true);
    window.addEventListener("b2b:open-sidebar", openDrawer);
    return () => window.removeEventListener("b2b:open-sidebar", openDrawer);
  }, []);

  React.useEffect(() => {
    void refreshConversations();
    const refresh = () => void refreshConversations();
    window.addEventListener("ask:conversations-changed", refresh);
    return () => window.removeEventListener("ask:conversations-changed", refresh);
  }, [refreshConversations]);

  React.useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
    setHistoryMenuId(null);
    setCapabilityMenuKey(null);
    setProviderMenuKey(null);
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

  function startNewConversation() {
    const nextId = crypto.randomUUID();
    const href = `/ask-ai?new=${nextId}`;
    setHistoryMenuId(null);
    setDrawerOpen(false);
    if (pathname !== "/ask-ai") startNavigating(href);
    router.push(href);
  }

  function openConversation(event: React.MouseEvent<HTMLAnchorElement>, conversationId: string) {
    event.preventDefault();
    const href = `/ask-ai?conversation=${conversationId}`;
    setHistoryMenuId(null);
    setDrawerOpen(false);
    if (pathname !== "/ask-ai") startNavigating(href);
    router.push(href);
  }

  async function updateConversation(
    conversationId: string,
    updates: Partial<Pick<ConversationSummary, "title" | "is_saved" | "is_pinned">> & { deleted_at?: string },
  ) {
    const { error } = await supabase
      .from("ask_conversations")
      .update(updates)
      .eq("id", conversationId)
      .eq("user_id", userId);
    if (!error) await refreshConversations();
  }

  async function commitRename(conversationId: string) {
    const title = renameValue.trim();
    setRenameId(null);
    if (!title) return;
    await updateConversation(conversationId, { title: title.slice(0, 120) });
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

        <div
          className={styles.sidebarScroll}
          onScroll={() => {
            setCapabilityMenuKey(null);
            setProviderMenuKey(null);
          }}
        >
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
            {(["skills", "projects", "vibe-coding", "scheduled-actions", "ai-agents", "coding-agents"] as CapabilitySlug[]).map((slug) => (
              <CapabilityMenuTrigger
                key={slug}
                slug={slug}
                mark={CAPABILITIES[slug].mark}
                open={capabilityMenuKey === slug}
                onToggle={() => setCapabilityMenuKey((current) => (current === slug ? null : slug))}
                onNavigate={() => {
                  setCapabilityMenuKey(null);
                  closeDrawer();
                }}
                toolLogos={toolLogos}
              />
            ))}
          </section>

          <section className={styles.sidebarSection} aria-labelledby="providers-label">
            <h2 id="providers-label" className={styles.sectionLabel}>Unique to each</h2>
            {PROVIDER_TOOLS.map((tool) => (
              <ProviderMenuTrigger
                key={tool}
                tool={tool}
                open={providerMenuKey === tool}
                onToggle={() => setProviderMenuKey((current) => (current === tool ? null : tool))}
                onNavigate={() => {
                  setProviderMenuKey(null);
                  closeDrawer();
                }}
                toolLogos={toolLogos}
              />
            ))}
          </section>

          {historyAvailable && conversations.length > 0 ? (
            <section className={`${styles.sidebarSection} ${styles.historySection}`} aria-labelledby="conversation-history-label">
              <div className={styles.historyHeading}>
                <h2 id="conversation-history-label" className={styles.sectionLabel}>Recent chats</h2>
                <button type="button" onClick={startNewConversation} aria-label="Start a new conversation" title="New conversation">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <path d="M8 3v10M3 8h10" />
                  </svg>
                </button>
              </div>
              <div className={styles.historyList}>
                {conversations.map((conversation) => (
                  <div
                    className={`${styles.historyRow} ${activeConversationId === conversation.id ? styles.historyRowActive : ""}`}
                    key={conversation.id}
                  >
                    {renameId === conversation.id ? (
                      <input
                        className={styles.historyRenameInput}
                        value={renameValue}
                        autoFocus
                        maxLength={120}
                        aria-label="Conversation title"
                        onChange={(event) => setRenameValue(event.target.value)}
                        onBlur={() => void commitRename(conversation.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") event.currentTarget.blur();
                          if (event.key === "Escape") {
                            setRenameId(null);
                            setRenameValue("");
                          }
                        }}
                      />
                    ) : (
                      <Link
                        href={`/ask-ai?conversation=${conversation.id}`}
                        onClick={(event) => openConversation(event, conversation.id)}
                        title={conversation.title}
                      >
                        <span className={styles.historyMarkers} aria-hidden="true">
                          {conversation.is_pinned ? "◆" : conversation.is_saved ? "★" : "·"}
                        </span>
                        <span>{conversation.title}</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      className={styles.historyMoreButton}
                      aria-label={`Actions for ${conversation.title}`}
                      aria-expanded={historyMenuId === conversation.id}
                      onClick={() => setHistoryMenuId((current) => current === conversation.id ? null : conversation.id)}
                    >
                      •••
                    </button>
                    {historyMenuId === conversation.id ? (
                      <>
                        <button type="button" className={styles.historyMenuBackdrop} aria-label="Close conversation actions" onClick={() => setHistoryMenuId(null)} />
                        <div className={styles.historyMenu}>
                          <button
                            type="button"
                            onClick={() => {
                              setRenameId(conversation.id);
                              setRenameValue(conversation.title);
                              setHistoryMenuId(null);
                            }}
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setHistoryMenuId(null);
                              void updateConversation(conversation.id, { is_pinned: !conversation.is_pinned });
                            }}
                          >
                            {conversation.is_pinned ? "Unpin" : "Pin"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setHistoryMenuId(null);
                              void updateConversation(conversation.id, { is_saved: !conversation.is_saved });
                            }}
                          >
                            {conversation.is_saved ? "Unsave" : "Save"}
                          </button>
                          <button
                            type="button"
                            className={styles.historyDeleteButton}
                            onClick={() => {
                              setHistoryMenuId(null);
                              void updateConversation(conversation.id, { deleted_at: new Date().toISOString() });
                              if (activeConversationId === conversation.id) startNewConversation();
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
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

                <div className={styles.profileMenuSectionLabel}>Personalization</div>
                {PERSONALIZATION_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={styles.profileMenuItem}
                    onClick={() => {
                      setMenuOpen(false);
                      setPersonalizationOpen(item.key);
                    }}
                  >
                    <span className={styles.profileMenuItemIcon} aria-hidden="true">{item.icon}</span>
                    <span className={styles.profileMenuItemCopy}>
                      <span className={styles.profileMenuItemName}>{item.name}</span>
                      <span className={styles.profileMenuItemDesc}>{item.description}</span>
                    </span>
                  </button>
                ))}

                <div className={styles.profileMenuDivider} />

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

      {personalizationOpen ? (
        <PersonalizationModal personalizationKey={personalizationOpen} onClose={() => setPersonalizationOpen(null)} />
      ) : null}
    </>
  );
}
