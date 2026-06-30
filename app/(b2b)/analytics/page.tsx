import B2BTopbar from "@/components/B2BTopbar";

export default function AnalyticsPage() {
  return (
    <>
      <B2BTopbar />
      <div style={{ padding: "24px 28px" }}>
        <div style={{
          background: "#fff", border: "1px solid #E9E4DC",
          borderRadius: 16, padding: "48px 32px", textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-.03em", marginBottom: 8 }}>Analytics</h1>
          <p style={{ color: "#746F78", fontSize: 14, fontWeight: 600, maxWidth: 420, margin: "0 auto" }}>
            Company-wide workflow completion rates, time saved, and AI fluency scores. Coming soon.
          </p>
        </div>
      </div>
    </>
  );
}
