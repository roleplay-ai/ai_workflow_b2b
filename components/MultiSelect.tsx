"use client";
import { useState, useRef, useEffect } from "react";
import ToolIcon from "@/components/ToolIcon";
import { normalizeToolSlug } from "@/lib/tools";
import { resolveToolLogoUrl, type ToolLogoMap } from "@/lib/toolLogos";

export type SelectOption = { name: string; imageUrl?: string | null; displayName?: string };

type Props = {
  label: string;
  mode?: "multi" | "single";
  selected: string[];
  options: SelectOption[];
  /** Tool logo map — used for Tools dropdown (same source as dashboard) */
  toolLogos?: ToolLogoMap;
  onChange: (next: string[]) => void;
  onAddNew?: (name: string, imageFile: File | null) => Promise<void>;
  /** Called when an existing option's logo is uploaded/changed */
  onUpdateImage?: (name: string, imageFile: File) => Promise<void>;
  placeholder?: string;
};

export default function MultiSelect({
  label, mode = "multi", selected, options, toolLogos, onChange, onAddNew, onUpdateImage, placeholder,
}: Props) {
  const [open,          setOpen]         = useState(false);
  const [search,        setSearch]       = useState("");
  const [adding,        setAdding]       = useState(false);
  const [newName,       setNewName]      = useState("");
  const [newFile,       setNewFile]      = useState<File | null>(null);
  const [saving,        setSaving]       = useState(false);
  const [uploadingFor,  setUploadingFor] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function down(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false); setAdding(false); setSearch("");
      }
    }
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, []);

  const findOption = (name: string) =>
    options.find(o => o.name.toLowerCase() === name.toLowerCase());

  const isSelected = (name: string) =>
    selected.some(s => s.toLowerCase() === name.toLowerCase());

  const filtered = options.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase())
    || (o.displayName ?? o.name).toLowerCase().includes(search.toLowerCase())
  );

  function pick(name: string) {
    const canonical = findOption(name)?.name ?? name;
    if (mode === "single") {
      onChange([canonical]); setOpen(false); setSearch("");
    } else {
      onChange(isSelected(canonical)
        ? selected.filter(s => s.toLowerCase() !== canonical.toLowerCase())
        : [...selected, canonical]
      );
    }
  }

  async function submit() {
    if (!onAddNew || !newName.trim() || saving) return;
    setSaving(true);
    try { await onAddNew(newName.trim(), newFile); }
    finally { setSaving(false); setNewName(""); setNewFile(null); setAdding(false); }
  }

  async function handleLogoUpload(name: string, file: File) {
    if (!onUpdateImage) return;
    setUploadingFor(name);
    try { await onUpdateImage(name, file); }
    finally { setUploadingFor(null); }
  }

  const optionLabel = (opt: SelectOption) => opt.displayName ?? opt.name;
  const selectedLabel = (name: string) => findOption(name)?.displayName ?? name;
  const singleLabel = mode === "single" ? (selected[0] ? selectedLabel(selected[0]) : "") : "";

  const resolveImageUrl = (name: string, imageUrl?: string | null) => {
    const fromOpt = imageUrl?.trim();
    if (fromOpt) return fromOpt;
    if (toolLogos) return resolveToolLogoUrl(name, toolLogos);
    return null;
  };

  const logoUrl = (name: string) => resolveImageUrl(name, findOption(name)?.imageUrl);

  const OptionIcon = ({ name, size, insetScale = 1 }: { name: string; size: number; insetScale?: number }) => {
    if (toolLogos) {
      return <ToolIcon tool={name} size={size} logos={toolLogos} insetScale={insetScale} />;
    }
    const url = logoUrl(name);
    if (url) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} style={{ width: size, height: size, borderRadius: size <= 16 ? 3 : 5, objectFit: "contain", flexShrink: 0 }} />
      );
    }
    return (
      <div style={{ width: size, height: size, borderRadius: 5, background: "#E8E6DC", display: "grid", placeItems: "center", fontSize: Math.max(8, size * 0.45), fontWeight: 800, color: "#6B6B6B", flexShrink: 0 }}>
        {name[0]?.toUpperCase()}
      </div>
    );
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#6B6B6B", marginBottom: 6 }}>{label}</div>

      {/* ── Trigger box ── */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          minHeight: 40, padding: "6px 10px 6px 8px",
          borderRadius: 10, border: `1.5px solid ${open ? "#221D23" : "#E8E6DC"}`,
          background: "#FAFAF8", cursor: "text",
          display: "flex", flexWrap: "wrap", alignItems: "center", gap: 5,
          transition: "border-color .15s",
        }}
      >
        {/* chips (multi) */}
        {mode === "multi" && selected.map(name => {
          const hasImg = !!logoUrl(name);
          return (
            <div key={name} style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "2px 8px 2px 5px", borderRadius: 999,
              background: "#221D23", color: "white", fontSize: 11.5, fontWeight: 700,
            }}>
              {hasImg
                ? <OptionIcon name={name} size={14} insetScale={0.9} />
                : <span style={{ width: 14, height: 14, borderRadius: 2, background: "rgba(255,255,255,.18)", display: "grid", placeItems: "center", fontSize: 8, flexShrink: 0 }}>{name[0]?.toUpperCase()}</span>
              }
              {selectedLabel(name)}
              <span
                onClick={e => { e.stopPropagation(); onChange(selected.filter(s => s !== name)); }}
                style={{ cursor: "pointer", opacity: .65, fontSize: 14, lineHeight: 1, marginLeft: 1 }}
              >×</span>
            </div>
          );
        })}

        {/* single value */}
        {mode === "single" && singleLabel && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {logoUrl(selected[0]) && <OptionIcon name={selected[0]} size={16} insetScale={0.9} />}
            <span style={{ fontSize: 13, fontWeight: 600, color: "#221D23" }}>{singleLabel}</span>
          </div>
        )}

        {/* search input */}
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onClick={e => e.stopPropagation()}
          placeholder={selected.length === 0 ? (placeholder ?? `Select ${label.toLowerCase()}…`) : ""}
          style={{ flex: 1, minWidth: 60, border: 0, background: "transparent", fontSize: 13, outline: "none", fontFamily: "inherit" }}
        />

        {/* chevron */}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#B0ABA5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 300,
          background: "white", border: "1.5px solid #E8E6DC", borderRadius: 12,
          boxShadow: "0 8px 28px rgba(34,29,35,.13)",
          maxHeight: 280, overflowY: "auto",
        }}>
          {filtered.length === 0 && !adding && (
            <div style={{ padding: "11px 14px", fontSize: 12.5, color: "#B0ABA5" }}>
              {search ? "No matches" : "No options yet"}
            </div>
          )}

          {filtered.map(opt => {
            const isSel       = isSelected(opt.name);
            const isUploading = uploadingFor === opt.name;
            const hasLogo     = !!resolveImageUrl(opt.name, opt.imageUrl);

            return (
              <div
                key={normalizeToolSlug(opt.name) || opt.name}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px 8px 14px",
                  background: isSel ? "#F0EDE8" : "transparent",
                  transition: "background .1s",
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "#F8F8F6"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isSel ? "#F0EDE8" : "transparent"; }}
              >
                {/* image / letter fallback — clicking this area selects the option */}
                <div onClick={() => pick(opt.name)} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "pointer", fontSize: 13, fontWeight: isSel ? 700 : 500 }}>
                  <OptionIcon name={opt.name} size={22} insetScale={0.88} />
                  {optionLabel(opt)}
                </div>

                {/* ── "Add logo" button for options without an image ── */}
                {!hasLogo && onUpdateImage && (
                  <label
                    onClick={e => e.stopPropagation()}
                    title="Upload logo for this option"
                    style={{
                      display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                      padding: "3px 8px", borderRadius: 6,
                      border: "1px solid #E8E6DC", background: "white",
                      fontSize: 11, fontWeight: 700,
                      color: isUploading ? "#6B6B6B" : "#6B6B6B",
                      cursor: isUploading ? "default" : "pointer",
                      transition: "border-color .1s, color .1s",
                    }}
                    onMouseEnter={e => { if (!isUploading) { e.currentTarget.style.borderColor = "#221D23"; e.currentTarget.style.color = "#221D23"; } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#E8E6DC"; e.currentTarget.style.color = "#6B6B6B"; }}
                  >
                    {isUploading ? (
                      "Uploading…"
                    ) : (
                      <>
                        {/* image icon */}
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        Add logo
                      </>
                    )}
                    {!isUploading && (
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={async e => {
                          const file  = e.target.files?.[0];
                          const input = e.currentTarget; // capture before async — React nulls currentTarget after return
                          if (file) await handleLogoUpload(opt.name, file);
                          if (input) input.value = "";
                        }}
                      />
                    )}
                  </label>
                )}

                {/* checkmark for selected items in multi mode */}
                {isSel && mode === "multi" && (
                  <svg onClick={() => pick(opt.name)} style={{ flexShrink: 0, cursor: "pointer" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#17A855" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            );
          })}

          {/* ── Add new ── */}
          {onAddNew && !adding ? (
            <div
              onClick={() => setAdding(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 14px", borderTop: "1px solid #F0EDE8",
                cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#6B6B6B",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#F8F8F6")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add new {label.toLowerCase()}
            </div>
          ) : onAddNew ? (
            <div style={{ padding: "10px 14px", borderTop: "1px solid #F0EDE8", display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()}
                placeholder={`${label} name…`}
                style={{ padding: "7px 10px", borderRadius: 8, border: "1.5px solid #E8E6DC", fontSize: 12.5, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", background: "#FAFAF8" }}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#6B6B6B", cursor: "pointer" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                {newFile ? <span style={{ color: "#17A855" }}>✓ {newFile.name}</span> : "Add image (optional)"}
                <input type="file" accept="image/*" onChange={e => setNewFile(e.target.files?.[0] ?? null)} style={{ display: "none" }} />
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={submit} disabled={!newName.trim() || saving}
                  style={{ padding: "6px 16px", borderRadius: 999, border: 0, background: "#FFCE00", color: "#221D23", fontWeight: 800, fontSize: 12, cursor: !newName.trim() || saving ? "default" : "pointer", opacity: !newName.trim() || saving ? .5 : 1, whiteSpace: "nowrap" }}>
                  {saving ? "Adding…" : "Add"}
                </button>
                <button onClick={() => { setAdding(false); setNewName(""); setNewFile(null); }}
                  style={{ padding: "6px 14px", borderRadius: 999, border: "1px solid #E8E6DC", background: "white", color: "#6B6B6B", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
