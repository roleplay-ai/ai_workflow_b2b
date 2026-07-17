import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { WorkflowCardRow } from "./NewsletterEmail";

export type WorkflowReminderEmailItem = { title: string; description: string };

export type WorkflowReminderEmailProps = {
  firstName: string;
  workflows: WorkflowReminderEmailItem[];
  workflowsUrl?: string;
};

const COLORS = {
  yellow: "#FFCE00",
  black: "#221D23",
  white: "#FFFFFF",
  muted: "#6B6B6B",
  border: "#E8E6DC",
};

export function WorkflowReminderEmail({
  firstName,
  workflows,
  workflowsUrl = "https://work.nudgeable.app/workflows",
}: WorkflowReminderEmailProps) {
  const name = firstName || "there";

  return (
    <Html lang="en">
      <Head />
      <Preview>A few workflows are waiting for you, {name}</Preview>
      <Body style={body}>
        <Container style={outer}>
          <Container style={card}>
            <Section style={hero}>
              <Text style={badge}>Reminder</Text>
              <Heading style={h1}>
                Pick up where you left off, {name}
              </Heading>
              <Text style={heroSub}>
                Here are {workflows.length} workflow{workflows.length === 1 ? "" : "s"} to help you keep building your AI practice.
              </Text>
            </Section>

            <Section style={bodyPad}>
              <WorkflowCardRow items={workflows} workflowsUrl={workflowsUrl} />

              <Section style={{ textAlign: "center", marginTop: 22 }}>
                <Button href={workflowsUrl} style={cta}>
                  Open Workflows →
                </Button>
              </Section>

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

export default WorkflowReminderEmail;

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
  fontSize: 24,
  lineHeight: 1.2,
  fontWeight: 800,
  letterSpacing: "-0.04em",
};

const heroSub: React.CSSProperties = { margin: "10px 0 0", color: "rgba(34,29,35,0.75)", fontSize: 14, lineHeight: 1.55 };

const bodyPad: React.CSSProperties = { backgroundColor: COLORS.white, padding: "32px 36px" };

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
