import * as React from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

export type NewsletterEmailItem = { title: string; description: string };

export type NewsletterEmailProps = {
  title: string;
  newsItems: NewsletterEmailItem[];
  workflowItems: NewsletterEmailItem[];
  workflowsUrl?: string;
};

const COLORS = {
  yellow: "#FFCE00",
  black: "#221D23",
  white: "#FFFFFF",
  muted: "#6B6B6B",
  border: "#E8E6DC",
};

export function NewsletterEmail({
  title,
  newsItems,
  workflowItems,
  workflowsUrl = "https://work.nudgeable.app/workflows",
}: NewsletterEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{title}</Preview>
      <Body style={body}>
        <Container style={outer}>
          <Container style={card}>
            <Section style={hero}>
              <Text style={badge}>Nudgeable</Text>
              <Heading style={h1}>{title}</Heading>
            </Section>

            <Section style={bodyPad}>
              {newsItems.length > 0 && (
                <>
                  <Text style={sectionTitle}>Latest AI News</Text>
                  {newsItems.map((item, i) => (
                    <ItemCard key={`news-${i}`} index={i + 1} title={item.title} description={item.description} />
                  ))}
                </>
              )}

              {workflowItems.length > 0 && (
                <>
                  <Text style={{ ...sectionTitle, marginTop: newsItems.length > 0 ? 28 : 0 }}>Workflows to Try</Text>
                  <WorkflowCardRow items={workflowItems} workflowsUrl={workflowsUrl} />
                  <Section style={{ textAlign: "center", marginTop: 22 }}>
                    <Button href={workflowsUrl} style={cta}>
                      Open Workflows →
                    </Button>
                  </Section>
                </>
              )}

              <Text style={signoff}>
                Regards,
                <br />
                <strong>Team Nudgeable</strong>
              </Text>
            </Section>
          </Container>
        </Container>
      </Body>
    </Html>
  );
}

function ItemCard({ index, title, description }: { index: number; title: string; description: string }) {
  return (
    <Section style={itemCard}>
      <Row>
        <Column style={{ width: 34, verticalAlign: "top" }}>
          <Section style={newsBadge}>
            <Text style={newsBadgeText}>{index}</Text>
          </Section>
        </Column>
        <Column style={{ verticalAlign: "top", paddingLeft: 12 }}>
          <Text style={itemTitle}>{title}</Text>
          {description && <Text style={itemDesc}>{description}</Text>}
        </Column>
      </Row>
    </Section>
  );
}

/**
 * Table-based 2-column card grid. Real HTML table rows auto-stretch every cell
 * in the row to match the tallest one, so cards never need a fixed height or
 * text truncation to line up — no clipping, and it renders consistently in
 * Gmail/Outlook/Apple Mail since it's a plain table, not overflow-scroll.
 */
export function WorkflowCardRow({ items, workflowsUrl }: { items: { title: string; description: string }[]; workflowsUrl: string }) {
  const rows: { title: string; description: string }[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));

  return (
    <>
      {rows.map((pair, ri) => (
        <Row key={ri} style={{ marginBottom: 12 }}>
          <Column style={{ width: "50%", verticalAlign: "top", paddingRight: 6 }}>
            <WorkflowCard item={pair[0]} workflowsUrl={workflowsUrl} />
          </Column>
          <Column style={{ width: "50%", verticalAlign: "top", paddingLeft: 6 }}>
            {pair[1] && <WorkflowCard item={pair[1]} workflowsUrl={workflowsUrl} />}
          </Column>
        </Row>
      ))}
    </>
  );
}

function WorkflowCard({ item, workflowsUrl }: { item: { title: string; description: string }; workflowsUrl: string }) {
  return (
    <a href={workflowsUrl} style={workflowCard}>
      <span style={workflowCardAccent} />
      <span style={cardTitle}>{item.title}</span>
      {item.description && <span style={cardDesc}>{item.description}</span>}
      <span style={cardCta}>Open →</span>
    </a>
  );
}

export default NewsletterEmail;

const body: React.CSSProperties = {
  margin: 0,
  padding: 0,
  backgroundColor: COLORS.white,
  fontFamily: "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
};

const outer: React.CSSProperties = { backgroundColor: COLORS.white, padding: "28px 12px", maxWidth: 584 };

const card: React.CSSProperties = {
  maxWidth: 560,
  borderRadius: 24,
  overflow: "hidden",
  border: `2px solid ${COLORS.black}`,
  backgroundColor: COLORS.white,
};

const hero: React.CSSProperties = { backgroundColor: COLORS.yellow, padding: "32px 36px 28px" };

const badge: React.CSSProperties = {
  display: "inline-block",
  margin: 0,
  backgroundColor: COLORS.black,
  borderRadius: 999,
  padding: "6px 14px",
  color: COLORS.yellow,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const h1: React.CSSProperties = {
  margin: "16px 0 0",
  color: COLORS.black,
  fontSize: 26,
  lineHeight: 1.2,
  fontWeight: 800,
  letterSpacing: "-0.04em",
};

const bodyPad: React.CSSProperties = { backgroundColor: COLORS.white, padding: "32px 36px" };

const sectionTitle: React.CSSProperties = {
  margin: "0 0 12px",
  color: COLORS.black,
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const itemCard: React.CSSProperties = {
  border: `1.5px solid ${COLORS.border}`,
  borderRadius: 14,
  padding: "14px 16px",
  marginBottom: 10,
  backgroundColor: "#FFFCF3",
};

const newsBadge: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: "50%",
  backgroundColor: COLORS.black,
  textAlign: "center",
};

const newsBadgeText: React.CSSProperties = { margin: 0, color: COLORS.yellow, fontSize: 12, fontWeight: 800, lineHeight: "26px" };

const itemTitle: React.CSSProperties = { margin: 0, color: COLORS.black, fontSize: 14.5, fontWeight: 700, lineHeight: 1.35 };

const itemDesc: React.CSSProperties = { margin: "6px 0 0", color: COLORS.muted, fontSize: 13, lineHeight: 1.5 };

const workflowCard: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
  padding: "16px 16px 14px",
  border: `1.5px solid ${COLORS.border}`,
  borderRadius: 16,
  backgroundColor: COLORS.white,
  textDecoration: "none",
  boxSizing: "border-box",
};

const workflowCardAccent: React.CSSProperties = {
  display: "block",
  width: 28,
  height: 4,
  borderRadius: 999,
  backgroundColor: COLORS.yellow,
  marginBottom: 10,
};

const cardTitle: React.CSSProperties = {
  display: "block",
  color: COLORS.black,
  fontSize: 14.5,
  fontWeight: 700,
  lineHeight: 1.35,
  marginBottom: 6,
};

const cardDesc: React.CSSProperties = {
  display: "block",
  color: COLORS.muted,
  fontSize: 12.5,
  lineHeight: 1.55,
  marginBottom: 10,
};

const cardCta: React.CSSProperties = {
  display: "block",
  color: COLORS.black,
  fontSize: 12.5,
  fontWeight: 800,
};

const cta: React.CSSProperties = {
  backgroundColor: COLORS.yellow,
  color: COLORS.black,
  fontSize: 14,
  fontWeight: 800,
  textDecoration: "none",
  padding: "13px 26px",
  borderRadius: 999,
  border: `2px solid ${COLORS.black}`,
  display: "inline-block",
};

const signoff: React.CSSProperties = { margin: "26px 0 0", color: COLORS.black, fontSize: 14, lineHeight: 1.5, fontWeight: 600 };
