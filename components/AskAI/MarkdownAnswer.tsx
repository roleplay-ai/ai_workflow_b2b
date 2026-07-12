import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders an assistant answer's markdown (bold, bullets, etc.) with the app's chat typography. */
export default function MarkdownAnswer({ content }: { content: string }) {
  return (
    <div style={{ fontSize: 15, lineHeight: 1.65, color: "#221D23" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p style={{ margin: "0 0 10px" }}>{children}</p>,
          ul: ({ children }) => (
            <ul style={{ margin: "4px 0 10px", paddingLeft: 22, listStyleType: "disc", listStylePosition: "outside" }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{ margin: "4px 0 10px", paddingLeft: 22, listStyleType: "decimal", listStylePosition: "outside" }}>
              {children}
            </ol>
          ),
          li: ({ children }) => <li style={{ marginBottom: 4, display: "list-item" }}>{children}</li>,
          strong: ({ children }) => <strong style={{ fontWeight: 800 }}>{children}</strong>,
          h1: ({ children }) => <div style={{ fontSize: 17, fontWeight: 800, margin: "6px 0 8px" }}>{children}</div>,
          h2: ({ children }) => <div style={{ fontSize: 16, fontWeight: 800, margin: "6px 0 8px" }}>{children}</div>,
          h3: ({ children }) => <div style={{ fontSize: 15, fontWeight: 800, margin: "6px 0 6px" }}>{children}</div>,
          code: ({ children }) => (
            <code style={{ background: "#F0EEE8", padding: "1px 6px", borderRadius: 4, fontSize: "0.9em", fontFamily: "ui-monospace, monospace" }}>
              {children}
            </code>
          ),
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" style={{ color: "#623CEA", textDecoration: "underline" }}>
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
