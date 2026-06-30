"use client";
import { useState, useEffect, useMemo } from "react";
import ToolIcon from "@/components/ToolIcon";
import { formatToolLabel } from "@/lib/tools";
import type { ToolLogoMap } from "@/lib/toolLogos";
import styles from "./RotatingTools.module.css";

type Props = {
  tools: string[];
  toolLogos: ToolLogoMap;
  iconSize?: number;
  intervalMs?: number;
  insetScale?: number;
  chipStyle?: React.CSSProperties;
  borderColor?: string;
  labelColor?: string;
  labelSize?: number;
};

export default function RotatingTools({
  tools: rawTools,
  toolLogos,
  iconSize = 16,
  intervalMs = 3200,
  insetScale = 1,
  chipStyle,
  borderColor = "#e8e3d8",
  labelColor,
  labelSize,
}: Props) {
  const tools = useMemo(() => rawTools.filter(Boolean), [rawTools]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const count = tools.length;

  useEffect(() => {
    setIndex(0);
    setPhase("in");
  }, [tools]);

  useEffect(() => {
    if (count <= 1) return;
    let fadeTimeout: ReturnType<typeof setTimeout>;
    const timer = setInterval(() => {
      setPhase("out");
      fadeTimeout = setTimeout(() => {
        setIndex(i => (i + 1) % count);
        setPhase("in");
      }, 420);
    }, intervalMs);
    return () => {
      clearInterval(timer);
      clearTimeout(fadeTimeout);
    };
  }, [count, intervalMs]);

  const minChipWidth = useMemo(() => {
    const longest = tools.reduce((max, t) => Math.max(max, formatToolLabel(t).length), 0);
    return iconSize + 28 + longest * 6.8;
  }, [tools, iconSize]);

  if (!count) return null;

  const tool = tools[index % count];
  if (!tool) return null;
  const animClass = count > 1 ? (phase === "in" ? styles.fadeIn : styles.fadeOut) : undefined;

  return (
    <div
      className={styles.wrap}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 9px",
        borderRadius: 999,
        border: `1px solid ${borderColor}`,
        background: "white",
        fontSize: labelSize ?? 11.5,
        fontWeight: 700,
        color: labelColor,
        minWidth: count > 1 ? minChipWidth : undefined,
        justifyContent: "center",
        ...chipStyle,
      }}
    >
      <div key={count > 1 ? tool : undefined} className={`${styles.chipInner} ${animClass ?? ""}`}>
        <ToolIcon tool={tool} size={iconSize} logos={toolLogos} insetScale={insetScale} />
        <span>{formatToolLabel(tool)}</span>
      </div>
    </div>
  );
}
