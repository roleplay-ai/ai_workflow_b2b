import type { ToolLogoMap } from "@/lib/toolLogos";

const TOOL_FALLBACK: Record<string, { bg: string; label: string }> = {
  claude: { bg: "#D97757", label: "Cl" },
  chatgpt: { bg: "#10a37f", label: "C" },
  gemini: { bg: "linear-gradient(135deg,#4285f4,#a142f4)", label: "G" },
  copilot: { bg: "linear-gradient(135deg,#00a4ef,#7fba00)", label: "Co" },
  "agentic-workflows": { bg: "linear-gradient(135deg,#623CEA,#3699FC)", label: "AW" },
};

type Props = {
  tool: string;
  size?: number;
  logos?: ToolLogoMap;
  insetScale?: number;
};

export default function ToolIcon({ tool, size = 18, logos, insetScale = 1 }: Props) {
  const key = tool.toLowerCase();
  const url = logos?.[key];

  if (url) {
    const imgSize = Math.round(size * insetScale);
    const img = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={tool}
        width={imgSize}
        height={imgSize}
        style={{
          borderRadius: "50%",
          flexShrink: 0,
          display: "block",
          objectFit: insetScale < 1 ? "contain" : "cover",
          background: "transparent",
        }}
      />
    );
    if (insetScale >= 1) return img;
    return (
      <span style={{
        width: size, height: size, flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: "transparent",
      }}>
        {img}
      </span>
    );
  }

  const logo = TOOL_FALLBACK[key] ?? { bg: "#888", label: tool.slice(0, 2).toUpperCase() };
  return (
    <span style={{
      width: size, height: size, borderRadius: "50%",
      display: "inline-grid", placeItems: "center",
      fontSize: Math.max(7, size * 0.44), fontWeight: 900,
      color: "white", background: logo.bg, flexShrink: 0,
    }}>
      {logo.label}
    </span>
  );
}
