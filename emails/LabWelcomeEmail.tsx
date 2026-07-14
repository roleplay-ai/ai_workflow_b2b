import * as React from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

export type LabWelcomeEmailProps = {
  firstName: string;
  email: string;
  password: string;
  labUrl?: string;
  logoCid?: string;
  logoAnimCid?: string;
  iconBoltCid?: string;
  iconCoachCid?: string;
  iconProgressCid?: string;
  footerDotsCid?: string;
};

const COLORS = {
  yellow: "#FFCE00",
  black: "#221D23",
  white: "#FFFFFF",
  muted: "#6B6B6B",
  border: "#E8E6DC",
};

export function LabWelcomeEmail({
  firstName,
  email,
  password,
  labUrl = "https://work.nudgeable.app/",
  logoCid = "cid:nudgeable-logo",
  logoAnimCid = "cid:logo-nudge",
  iconBoltCid = "cid:icon-bolt",
  iconCoachCid = "cid:icon-coach",
  iconProgressCid = "cid:icon-progress",
  footerDotsCid = "cid:footer-dots",
}: LabWelcomeEmailProps) {
  const name = firstName || "there";

  return (
    <Html lang="en">
      <Head>
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(14px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes logoNudge {
            0%, 100% { transform: translateY(0); }
            40% { transform: translateY(-4px); }
            60% { transform: translateY(1px); }
          }
          @keyframes cardIn {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes floatDot {
            0%, 100% { transform: translateY(0); opacity: 0.5; }
            50% { transform: translateY(-5px); opacity: 1; }
          }
          @keyframes credReveal {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .anim-fade { animation: fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
          .anim-fade-delay { animation: fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both; }
          .anim-fade-delay-2 { animation: fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.24s both; }
          .anim-logo { animation: logoNudge 2.8s ease-in-out infinite; }
          .card-a { animation: cardIn 0.65s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both; }
          .card-b { animation: cardIn 0.65s cubic-bezier(0.22, 1, 0.36, 1) 0.42s both; }
          .card-c { animation: cardIn 0.65s cubic-bezier(0.22, 1, 0.36, 1) 0.54s both; }
          .creds-anim { animation: credReveal 0.65s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both; }
          .dot-a { animation: floatDot 2.8s ease-in-out infinite; }
          .dot-b { animation: floatDot 2.8s ease-in-out 0.45s infinite; }
          .dot-c { animation: floatDot 2.8s ease-in-out 0.9s infinite; }
          @media (prefers-reduced-motion: reduce) {
            .anim-fade, .anim-fade-delay, .anim-fade-delay-2, .anim-logo,
            .card-a, .card-b, .card-c, .creds-anim, .dot-a, .dot-b, .dot-c {
              animation: none !important;
            }
          }
        `}</style>
      </Head>
      <Preview>Your AI Practice Lab access is ready — login details inside.</Preview>
      <Body style={body}>
        <Container style={outer}>
          <Container style={card}>
            <Section style={hero}>
              <Row>
                <Column style={{ width: 68, verticalAlign: "middle" }}>
                  <Img
                    className="anim-logo"
                    src={logoAnimCid}
                    width={64}
                    height={72}
                    alt="Nudgeable"
                    style={logoImg}
                  />
                </Column>
                <Column style={{ verticalAlign: "middle" }}>
                  <Text style={brandName}>Nudgeable</Text>
                  <Text style={brandSub}>AI Practice Lab</Text>
                </Column>
              </Row>

              <Text className="anim-fade" style={badge}>
                You&apos;re in
              </Text>
              <Heading className="anim-fade-delay" style={h1}>
                Welcome to your
                <br />
                practice space, {name}
              </Heading>
              <Text className="anim-fade-delay-2" style={heroSub}>
                Build practical AI skills through guided learning, workflows, and regular
                practice — all in one lab.
              </Text>
            </Section>

            <Section style={bodyPad}>
              <Container className="creds-anim" style={credsBox}>
                <Section style={credsHeader}>
                  <Text style={credsHeaderText}>Your login details</Text>
                </Section>
                <Section style={credsBody}>
                  <Text style={label}>Lab URL</Text>
                  <Link href={labUrl} style={labLink}>
                    {labUrl}
                  </Link>
                  <HrLine />
                  <Text style={{ ...label, marginTop: 14 }}>Username</Text>
                  <Text style={mono}>{email}</Text>
                  <HrLine />
                  <Text style={{ ...label, marginTop: 14 }}>Password</Text>
                  <Text style={passPill}>{password}</Text>
                </Section>
              </Container>

              <Section style={{ textAlign: "center", marginTop: 26 }}>
                <Button href={labUrl} style={cta}>
                  Open AI Practice Lab →
                </Button>
                <Text style={hint}>Best experienced on a laptop or desktop</Text>
              </Section>

              <Text style={sectionTitle}>Inside the lab</Text>
              <Section className="card-a" style={{ marginBottom: 10 }}>
                <FeatureCard
                  iconCid={iconBoltCid}
                  title="Workflows & Course"
                  body="Practical AI workflows, Mastery Course, and weekly updates"
                />
              </Section>
              <Section className="card-b" style={{ marginBottom: 10 }}>
                <FeatureCard
                  iconCid={iconCoachCid}
                  title="AI Coach"
                  body="A trained coach to guide you whenever you get stuck"
                />
              </Section>
              <Section className="card-c">
                <FeatureCard
                  iconCid={iconProgressCid}
                  title="Progress"
                  body="Points, badges, streaks, and leaderboards"
                />
              </Section>

              <Section style={accessNote}>
                <Text style={accessText}>
                  <strong>3 months of access</strong> — your AI Practice Lab will remain active
                  for the next three months.
                </Text>
              </Section>

              <Text style={help}>
                For login or technical issues, just reply to this email — we&apos;ll help.
              </Text>
              <Text style={signoff}>
                Regards,
                <br />
                <strong>Team Nudgeable</strong>
              </Text>
            </Section>

            <Section style={footer}>
              <Img
                src={logoCid}
                width={36}
                height={36}
                alt="Nudgeable"
                style={{ display: "block", margin: "0 auto 10px" }}
              />
              <Img
                src={footerDotsCid}
                width={72}
                height={16}
                alt=""
                style={{ display: "block", margin: "0 auto 10px", width: 72, height: 16 }}
              />
              <Text style={footerText}>
                <Link href="mailto:team@nudgeable.app" style={footerLink}>
                  team@nudgeable.app
                </Link>
                {" · "}
                AI Practice Lab
              </Text>
            </Section>
          </Container>
        </Container>
      </Body>
    </Html>
  );
}

function FeatureCard({
  iconCid,
  title,
  body,
}: {
  iconCid: string;
  title: string;
  body: string;
}) {
  return (
    <Section className="feature-card" style={featureCard}>
      <Img src={iconCid} width={32} height={32} alt="" style={{ display: "block" }} />
      <Text className="feature-title" style={featureTitle}>
        {title}
      </Text>
      <Text className="feature-body" style={featureBody}>
        {body}
      </Text>
    </Section>
  );
}

function HrLine() {
  return (
    <Section
      style={{
        borderBottom: `1px solid ${COLORS.border}`,
        marginTop: 14,
        lineHeight: "1px",
        height: 1,
      }}
    />
  );
}

export default LabWelcomeEmail;

const body: React.CSSProperties = {
  margin: 0,
  padding: 0,
  backgroundColor: COLORS.white,
  fontFamily:
    "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
};

const outer: React.CSSProperties = {
  backgroundColor: COLORS.white,
  padding: "28px 12px",
  maxWidth: 584,
};

const card: React.CSSProperties = {
  maxWidth: 560,
  borderRadius: 24,
  overflow: "hidden",
  border: `2px solid ${COLORS.black}`,
  backgroundColor: COLORS.white,
};

const hero: React.CSSProperties = {
  backgroundColor: COLORS.yellow,
  padding: "36px 36px 32px",
};

const logoImg: React.CSSProperties = {
  display: "block",
  border: 0,
  outline: "none",
};

const brandName: React.CSSProperties = {
  margin: 0,
  color: COLORS.black,
  fontSize: 18,
  fontWeight: 800,
  letterSpacing: "-0.03em",
  lineHeight: 1,
};

const brandSub: React.CSSProperties = {
  margin: "3px 0 0",
  color: "rgba(34,29,35,0.7)",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const badge: React.CSSProperties = {
  display: "inline-block",
  margin: "18px 0 0",
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
  margin: "18px 0 0",
  color: COLORS.black,
  fontSize: 30,
  lineHeight: 1.15,
  fontWeight: 800,
  letterSpacing: "-0.045em",
};

const heroSub: React.CSSProperties = {
  margin: "14px 0 0",
  color: "rgba(34,29,35,0.75)",
  fontSize: 15,
  lineHeight: 1.6,
  maxWidth: 440,
};

const bodyPad: React.CSSProperties = {
  backgroundColor: COLORS.white,
  padding: "32px 36px",
};

const credsBox: React.CSSProperties = {
  border: `2px solid ${COLORS.black}`,
  borderRadius: 18,
  overflow: "hidden",
  backgroundColor: COLORS.white,
};

const credsHeader: React.CSSProperties = {
  backgroundColor: COLORS.black,
  padding: "14px 20px",
};

const credsHeaderText: React.CSSProperties = {
  margin: 0,
  color: COLORS.yellow,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const credsBody: React.CSSProperties = {
  padding: 20,
  backgroundColor: COLORS.white,
};

const label: React.CSSProperties = {
  margin: "0 0 4px",
  color: COLORS.muted,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const labLink: React.CSSProperties = {
  color: COLORS.black,
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "underline",
  textDecorationColor: COLORS.yellow,
};

const mono: React.CSSProperties = {
  margin: 0,
  color: COLORS.black,
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace",
};

const passPill: React.CSSProperties = {
  display: "inline-block",
  margin: 0,
  backgroundColor: COLORS.yellow,
  border: `2px solid ${COLORS.black}`,
  borderRadius: 10,
  padding: "8px 14px",
  color: COLORS.black,
  fontSize: 16,
  fontWeight: 800,
  letterSpacing: "0.12em",
  fontFamily: "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace",
};

const cta: React.CSSProperties = {
  backgroundColor: COLORS.yellow,
  color: COLORS.black,
  fontSize: 15,
  fontWeight: 800,
  textDecoration: "none",
  padding: "14px 28px",
  borderRadius: 999,
  border: `2px solid ${COLORS.black}`,
  display: "inline-block",
};

const hint: React.CSSProperties = {
  margin: "12px 0 0",
  color: COLORS.muted,
  fontSize: 12.5,
  lineHeight: 1.5,
};

const sectionTitle: React.CSSProperties = {
  margin: "30px 0 12px",
  color: COLORS.black,
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const featureCard: React.CSSProperties = {
  backgroundColor: COLORS.white,
  border: `2px solid ${COLORS.black}`,
  borderRadius: 16,
  padding: 16,
  width: "100%",
  boxSizing: "border-box",
};

const featureTitle: React.CSSProperties = {
  margin: "12px 0 0",
  color: COLORS.black,
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "-0.02em",
  lineHeight: 1.25,
};

const featureBody: React.CSSProperties = {
  margin: "6px 0 0",
  color: COLORS.muted,
  fontSize: 12,
  lineHeight: 1.45,
};

const accessNote: React.CSSProperties = {
  marginTop: 22,
  backgroundColor: COLORS.yellow,
  border: `2px solid ${COLORS.black}`,
  borderRadius: 14,
  padding: "14px 16px",
};

const accessText: React.CSSProperties = {
  margin: 0,
  color: COLORS.black,
  fontSize: 13,
  lineHeight: 1.55,
};

const help: React.CSSProperties = {
  margin: "22px 0 0",
  color: COLORS.muted,
  fontSize: 13.5,
  lineHeight: 1.6,
};

const signoff: React.CSSProperties = {
  margin: "18px 0 0",
  color: COLORS.black,
  fontSize: 14,
  lineHeight: 1.5,
  fontWeight: 600,
};

const footer: React.CSSProperties = {
  backgroundColor: COLORS.black,
  padding: "22px 36px",
  textAlign: "center",
};

const footerText: React.CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.7)",
  fontSize: 12,
  lineHeight: 1.5,
};

const footerLink: React.CSSProperties = {
  color: COLORS.yellow,
  textDecoration: "none",
  fontWeight: 700,
};
