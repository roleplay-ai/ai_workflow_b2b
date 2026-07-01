"use client";

export default function BulkUploadClient() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: "-.04em", color: "#221D23" }}>
          Bulk Upload Users
        </h1>
        <p style={{ margin: "4px 0 0", color: "#6B6B6B", fontSize: 14 }}>
          Add multiple users to your company at once
        </p>
      </div>

      {/* Coming soon card */}
      <div style={{
        background: "white",
        border: "1.5px solid #E8E6DC",
        borderRadius: 24,
        padding: "64px 40px",
        textAlign: "center",
        maxWidth: 520,
        margin: "0 auto",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: "rgba(255,206,0,.1)", border: "1.5px solid rgba(255,206,0,.2)",
          display: "grid", placeItems: "center",
          margin: "0 auto 24px",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F68A29" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <div style={{
          display: "inline-block",
          padding: "5px 14px",
          borderRadius: 999,
          background: "rgba(255,206,0,.12)",
          border: "1px solid rgba(255,206,0,.25)",
          fontSize: 12,
          fontWeight: 800,
          color: "#B08C00",
          letterSpacing: ".04em",
          textTransform: "uppercase",
          marginBottom: 16,
        }}>
          Coming Soon
        </div>

        <h2 style={{
          margin: "0 0 10px",
          fontSize: 22,
          fontWeight: 900,
          letterSpacing: "-.03em",
          color: "#221D23",
        }}>
          Bulk User Upload
        </h2>

        <p style={{
          margin: "0 0 24px",
          fontSize: 14,
          color: "#6B6B6B",
          lineHeight: 1.6,
          maxWidth: 380,
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          Upload a CSV file to add multiple users to your company at once. Support for up to 500 users per batch with automatic email invitations.
        </p>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "20px 24px",
          background: "#FAFAF8",
          borderRadius: 14,
          border: "1px solid #F0EEE8",
          textAlign: "left",
          maxWidth: 340,
          margin: "0 auto",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#221D23", marginBottom: 2 }}>Planned features</div>
          {[
            "CSV upload with email & name columns",
            "Preview & validate before uploading",
            "Automatic company assignment",
            "Upload status & error reporting",
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 18, height: 18, borderRadius: 6,
                border: "1.5px solid #E8E6DC", background: "white",
                display: "grid", placeItems: "center", flexShrink: 0,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: "#E8E6DC" }} />
              </div>
              <span style={{ fontSize: 13, color: "#6B6B6B", fontWeight: 600 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
