"use client";

import { useRef } from "react";
import "./BriefNewsCard.css";

export type BriefNewsItem = { id: string; content: string; sort_order: number };

// Temporary hardcoded article links — one per brief card, by sort order.
const TEMP_BRIEF_NEWS_LINKS = [
  "https://www.tomshardware.com/tech-industry/artificial-intelligence/z-ai-free-glm-5-2-tops-the-open-weight-ai-rankings-on-all-huawei-silicon",
  "https://www.reuters.com/legal/litigation/openai-defers-public-rollout-gpt56-us-seeks-early-access-frontier-ai-models-2026-06-26/",
  "https://www.anthropic.com/news/claude-sonnet-5",
  "https://www.businessinsider.com/google-3-5-pro-july-release-tokens-ai-agents-model-2026-6",
] as const;

const SCROLL_CARD_WIDTH = 280;
const SCROLL_GAP = 20;

function parseNewsContent(content: string): { title: string; description: string } {
  const cleaned = content.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, "").trim();
  const colonIdx = cleaned.indexOf(": ");

  if (colonIdx > 0) {
    return {
      title: cleaned.slice(0, colonIdx).trim(),
      description: cleaned.slice(colonIdx + 2).trim(),
    };
  }

  return { title: cleaned, description: "" };
}

export function formatBriefNewsDate(dateStr?: string | null) {
  const date = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function NewsCard({
  item,
  displayDate,
  href,
}: {
  item: BriefNewsItem;
  displayDate: string;
  href?: string;
}) {
  const parsed = parseNewsContent(item.content);

  const content = (
    <>
      <div className="aif-news-meta">
        <span>{displayDate}</span>
      </div>
      <h3 className="aif-news-title">{parsed.title}</h3>
      {parsed.description ? (
        <p className="aif-news-desc">{parsed.description}</p>
      ) : (
        <p className="aif-news-desc" style={{ marginBottom: 14 }} />
      )}
      <span className="aif-news-read-link">Read update ›</span>
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="aif-news-card aif-news-card-link">
        {content}
      </a>
    );
  }

  return <article className="aif-news-card">{content}</article>;
}

type Props = {
  items: BriefNewsItem[];
  publishedDate?: string | null;
  className?: string;
};

export default function BriefNewsCard({ items, publishedDate, className }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const displayDate = formatBriefNewsDate(publishedDate);
  const isScrollable = sorted.length > 3;

  function scroll(dir: "left" | "right") {
    const step = SCROLL_CARD_WIDTH + SCROLL_GAP;
    scrollRef.current?.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  }

  if (sorted.length === 0) {
    return (
      <div className={className ? `aif-news-empty ${className}` : "aif-news-empty"}>
        No updates available yet
      </div>
    );
  }

  if (isScrollable) {
    return (
      <div className={className ? `aif-news-carousel-rail ${className}` : "aif-news-carousel-rail"}>
        <button type="button" className="aif-news-arrow-btn" onClick={() => scroll("left")} aria-label="Previous news">
          ‹
        </button>
        <div ref={scrollRef} className="aif-news-scroll">
          {sorted.map((item, index) => (
            <NewsCard
              key={item.id}
              item={item}
              displayDate={displayDate}
              href={TEMP_BRIEF_NEWS_LINKS[index]}
            />
          ))}
        </div>
        <button type="button" className="aif-news-arrow-btn" onClick={() => scroll("right")} aria-label="Next news">
          ›
        </button>
      </div>
    );
  }

  return (
    <div className={className ? `aif-news-grid ${className}` : "aif-news-grid"}>
      {sorted.map((item, index) => (
        <NewsCard
          key={item.id}
          item={item}
          displayDate={displayDate}
          href={TEMP_BRIEF_NEWS_LINKS[index]}
        />
      ))}
    </div>
  );
}
