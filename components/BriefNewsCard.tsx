import "./BriefNewsCard.css";

export type BriefNewsItem = { id: string; content: string; sort_order: number };

const TAG_ACCENTS: Record<string, { className: string; accent: string }> = {
  Microsoft: { className: "microsoft", accent: "#3699FC" },
  Google: { className: "google", accent: "#23CE6B" },
  Enterprise: { className: "enterprise", accent: "#F68A29" },
  Update: { className: "", accent: "#FFCE00" },
};

function inferTag(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("microsoft") || lower.includes("copilot")) return "Microsoft";
  if (lower.includes("google") || lower.includes("gemini") || lower.includes("notebooklm")) return "Google";
  if (
    lower.includes("anthropic") || lower.includes("claude") || lower.includes("openai")
    || lower.includes("salesforce") || lower.includes("enterprise")
  ) return "Enterprise";
  return "Update";
}

function parseNewsContent(content: string): { title: string; description: string; tag: string } {
  const cleaned = content.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, "").trim();
  const tag = inferTag(cleaned);
  const colonIdx = cleaned.indexOf(": ");

  if (colonIdx > 0) {
    return {
      title: cleaned.slice(0, colonIdx).trim(),
      description: cleaned.slice(colonIdx + 2).trim(),
      tag,
    };
  }

  return { title: cleaned, description: "", tag };
}

export function formatBriefNewsDate(dateStr?: string | null) {
  const date = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

type Props = {
  items: BriefNewsItem[];
  publishedDate?: string | null;
  className?: string;
};

export default function BriefNewsCard({ items, publishedDate, className }: Props) {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order).slice(0, 3);
  const displayDate = formatBriefNewsDate(publishedDate);

  if (sorted.length === 0) {
    return (
      <div className={className ? `aif-news-empty ${className}` : "aif-news-empty"}>
        No updates available yet
      </div>
    );
  }

  return (
    <div className={className ? `aif-news-grid ${className}` : "aif-news-grid"}>
      {sorted.map((item) => {
        const parsed = parseNewsContent(item.content);
        const accent = TAG_ACCENTS[parsed.tag] ?? TAG_ACCENTS.Update;
        const cardClass = accent.className
          ? `aif-news-card aif-news-card--${accent.className}`
          : "aif-news-card";

        return (
          <article
            key={item.id}
            className={cardClass}
            style={{ ["--aif-news-accent" as string]: accent.accent }}
          >
            <div className="aif-news-meta">
              <span>{displayDate}</span>
              <span className="aif-news-tag">{parsed.tag}</span>
            </div>
            <h3 className="aif-news-title">{parsed.title}</h3>
            {parsed.description ? (
              <p className="aif-news-desc">{parsed.description}</p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
