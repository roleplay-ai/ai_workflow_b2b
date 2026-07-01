"use client";

export default function MdText({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.split("\n");

  const parsed = lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;

    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)/);
    if (bulletMatch) {
      return (
        <div key={i} className="flex gap-2 items-start">
          <span className="flex-shrink-0 flex items-center h-[1.625em] w-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
          </span>
          <span className="min-w-0 flex-1">{renderInline(bulletMatch[1])}</span>
        </div>
      );
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      return (
        <div key={i} className="flex gap-2 items-start">
          <span className="flex-shrink-0 font-bold opacity-60 min-w-[16px]">{numMatch[1]}.</span>
          <span>{renderInline(numMatch[2])}</span>
        </div>
      );
    }

    return <div key={i}>{renderInline(trimmed)}</div>;
  });

  return <div className={`flex flex-col gap-1 text-sm leading-relaxed ${className}`}>{parsed}</div>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="bg-slate-100 px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
