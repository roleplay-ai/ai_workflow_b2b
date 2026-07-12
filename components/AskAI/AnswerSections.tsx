import MarkdownAnswer from "./MarkdownAnswer";
import { parseAnswerSections } from "./parseAnswerSections";

/** Renders an assistant answer, splitting "## Short answer / The details / How we know"
 *  headers into labeled blocks. Falls back to a single plain block when the model didn't
 *  use headers (e.g. the exact decline/fallback sentence). */
export default function AnswerSections({ content }: { content: string }) {
  const sections = parseAnswerSections(content);

  if (sections.length === 1 && sections[0].title === null) {
    return <MarkdownAnswer content={sections[0].body} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {sections.map((section, i) => {
        const isShortAnswer = section.title === "Short answer";
        return (
          <div
            key={i}
            style={isShortAnswer ? { borderLeft: "4px solid #FFCE00", paddingLeft: 14 } : undefined}
          >
            {section.title && (
              <div style={{
                fontSize: 11, fontWeight: 800, letterSpacing: ".06em",
                textTransform: "uppercase", color: "#A09AA6", marginBottom: 6,
              }}>
                {section.title}
              </div>
            )}
            <MarkdownAnswer content={section.body} />
          </div>
        );
      })}
    </div>
  );
}
