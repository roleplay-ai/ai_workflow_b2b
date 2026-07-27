"use client";

import { useEffect } from "react";

export type PersonalizationKey = "customInstructions" | "userProfile" | "memoryFiles" | "importMemory";

type Section = {
  icon: string;
  title: string;
  subtitle: string;
  what: string;
  howAiUses: string;
  whatCanYouDo: string;
  exampleLabel: string;
};

const SECTIONS: Record<PersonalizationKey, Section> = {
  customInstructions: {
    icon: "✎",
    title: "Custom Instructions",
    subtitle: "Fixed guidance that helps the assistant respond in your preferred way.",
    what: "Instructions you write once about your role, goals and preferred response style. They are added behind the scenes to every prompt until you edit them.",
    howAiUses: "AI adds them in full behind every prompt to shape tone, format, terminology and response style.",
    whatCanYouDo: "Write, edit or clear them anytime. Keep only durable preferences that should apply across chats.",
    exampleLabel: "Sample Custom Instructions",
  },
  userProfile: {
    icon: "◉",
    title: "User Profile",
    subtitle: "A summary the AI builds about who you are and how you prefer to work.",
    what: "A summary the AI builds automatically about your role, work and preferences. It is sent in full with every message and updates over time.",
    howAiUses: "AI sends the full profile with every prompt so it can personalize responses without asking you to repeat context.",
    whatCanYouDo: "Edit outdated details, remove anything unnecessary, or clear the profile for a fresh start.",
    exampleLabel: "Example User Profile",
  },
  memoryFiles: {
    icon: "▤",
    title: "Memory Files",
    subtitle: "Detailed memories about important areas, topics or people.",
    what: "Detailed memories the AI saves when you ask it to remember something or signal that the information matters for future chats.",
    howAiUses: "AI sees the memory names and short descriptions. It opens the detailed file through tool calling only when your prompt makes it relevant.",
    whatCanYouDo: "Ask AI to save important information, then review, edit or delete any memory file.",
    exampleLabel: "Sample Memory Files",
  },
  importMemory: {
    icon: "⇩",
    title: "Import Memory",
    subtitle: "Move useful saved memories from one chatbot to another.",
    what: "Ask another chatbot to export its saved memories, then paste or upload that file here.",
    howAiUses: "AI places it into Custom Instructions, User Profile or Memory Files, then uses each layer in the appropriate way.",
    whatCanYouDo: "Export memories from another chatbot, review them, and import only the information you want to keep.",
    exampleLabel: "Sample export prompt",
  },
};

const CUSTOM_INSTRUCTIONS_EXAMPLE = `ROLE AND CONTEXT
I am [role] working on [recurring areas].

WHAT I NEED
Help me with [main tasks or outcomes].

HOW TO RESPOND
Use [tone]. Keep answers [length]. Prefer [format].

GUARDRAILS
Always [important rule]. Avoid [things to avoid].`;

const USER_PROFILE_EXAMPLE = [
  { type: "R", name: "Role and work", description: "Founder of Nudgeable AI, focused on GenAI, behavioural science and HR." },
  { type: "S", name: "Response style", description: "Prefers direct, short and implementation-focused answers." },
];

const MEMORY_FILES_EXAMPLE = [
  { type: "A", name: "Area · Nudgeable AI", description: "Product positioning, brand and recurring product decisions." },
  { type: "T", name: "Topic · AI Practice Lab", description: "Workflow categories, scoring and user experience decisions." },
  { type: "P", name: "People · Key collaborators", description: "Useful context for recurring collaborators and stakeholders." },
];

const IMPORT_MEMORY_SAMPLE_PROMPT = "“Export my saved memories, grouped by preferences, profile, projects, topics and people.”";

export default function PersonalizationModal({ personalizationKey, onClose }: { personalizationKey: PersonalizationKey; onClose: () => void }) {
  const section = SECTIONS[personalizationKey];

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-labelledby="personalization-modal-title"
      style={{
        position: "fixed", inset: 0, zIndex: 1200,
        background: "rgba(0,0,0,.55)", backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(560px,100%)", maxHeight: "88vh", overflowY: "auto",
        background: "#fff", borderRadius: 20, boxShadow: "0 24px 80px rgba(0,0,0,.35)",
      }}>
        <div style={{
          padding: "20px 22px", borderBottom: "1px solid #F0ECE6",
          display: "flex", alignItems: "flex-start", gap: 14,
          position: "sticky", top: 0, background: "#fff", zIndex: 1,
        }}>
          <span style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: "#FFF6CF", display: "grid", placeItems: "center", fontSize: 18,
          }}>{section.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="personalization-modal-title" style={{ margin: 0, fontSize: 17, fontWeight: 900, letterSpacing: "-.02em", color: "#221D23" }}>
              {section.title}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#746F78", fontWeight: 600, lineHeight: 1.4 }}>{section.subtitle}</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            border: 0, background: "rgba(0,0,0,.06)", cursor: "pointer",
            width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center",
            fontSize: 16, fontWeight: 700, color: "#6B6670", flexShrink: 0, fontFamily: "inherit",
          }}>×</button>
        </div>

        <div style={{ padding: 22 }}>
          <div style={{ background: "#FAFAF8", border: "1px solid #F0ECE6", borderRadius: 14, padding: 18, marginBottom: 22 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 14.5, fontWeight: 800, color: "#221D23" }}>What {personalizationKey === "importMemory" ? "is Import Memory" : `is ${section.title}`}?</h3>
            <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#4A4450", lineHeight: 1.55 }}>{section.what}</p>
            <div style={{ height: 1, background: "#EDE8DF", margin: "14px 0" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <strong style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: "#221D23", marginBottom: 4 }}>How AI uses {personalizationKey === "importMemory" ? "imported memory" : "it"}</strong>
                <span style={{ fontSize: 12.5, color: "#6B6670", lineHeight: 1.5 }}>{section.howAiUses}</span>
              </div>
              <div>
                <strong style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: "#221D23", marginBottom: 4 }}>What can you do?</strong>
                <span style={{ fontSize: 12.5, color: "#6B6670", lineHeight: 1.5 }}>{section.whatCanYouDo}</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "#9B9199", marginBottom: 10 }}>
            {section.exampleLabel}
          </div>

          {personalizationKey === "customInstructions" && (
            <pre style={{
              margin: 0, padding: 14, background: "#F7F5F0", border: "1px solid #EDE8DF", borderRadius: 12,
              fontSize: 12, lineHeight: 1.6, color: "#3A353D", whiteSpace: "pre-wrap", fontFamily: "inherit",
            }}>{CUSTOM_INSTRUCTIONS_EXAMPLE}</pre>
          )}

          {personalizationKey === "userProfile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {USER_PROFILE_EXAMPLE.map(row => (
                <div key={row.name} style={{ display: "flex", gap: 12, alignItems: "flex-start", border: "1px solid #EDE8DF", borderRadius: 12, padding: 12 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: "#EEF6FF", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, color: "#17395C", flexShrink: 0 }}>{row.type}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#221D23" }}>{row.name}</div>
                    <div style={{ fontSize: 12.5, color: "#746F78", marginTop: 2, lineHeight: 1.45 }}>{row.description}</div>
                  </div>
                </div>
              ))}
              <p style={{ margin: "8px 2px 0", fontSize: 11.5, color: "#9B9199", lineHeight: 1.5 }}>
                Updating this profile changes the context supplied to future conversations. It does not retrain the underlying AI model.
              </p>
            </div>
          )}

          {personalizationKey === "memoryFiles" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {MEMORY_FILES_EXAMPLE.map(row => (
                <div key={row.name} style={{ display: "flex", gap: 12, alignItems: "flex-start", border: "1px solid #EDE8DF", borderRadius: 12, padding: 12 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: "#E9FFF2", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, color: "#0F4A2C", flexShrink: 0 }}>{row.type}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#221D23" }}>{row.name}</div>
                    <div style={{ fontSize: 12.5, color: "#746F78", marginTop: 2, lineHeight: 1.45 }}>{row.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {personalizationKey === "importMemory" && (
            <div style={{
              padding: 14, background: "#FFF6CF", border: "1px solid #EAD993", borderRadius: 12,
              fontSize: 13, fontStyle: "italic", color: "#4A4020", lineHeight: 1.5,
            }}>
              {IMPORT_MEMORY_SAMPLE_PROMPT}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
