import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface ReviewReminderEmailProps {
  recipientName: string;
  projectName: string;
  clientName: string;
  auditUrl: string;
  daysWaiting: number;
}

export function ReviewReminderEmail({
  recipientName,
  projectName,
  clientName,
  auditUrl,
  daysWaiting,
}: ReviewReminderEmailProps) {
  const greeting = recipientName.trim()
    ? `Bonjour ${recipientName},`
    : "Bonjour,";

  return (
    <Html lang="fr">
      <Head />
      <Preview>{`Un audit attend votre relecture depuis ${daysWaiting} jours`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={brand}>Axessio</Heading>
            <Text style={subBrand}>
              Plateforme d&apos;audits d&apos;accessibilité numérique
            </Text>
          </Section>

          <Section style={card}>
            <Heading as="h2" style={h2}>
              Relecture en attente
            </Heading>

            <Text style={paragraph}>{greeting}</Text>

            <Text style={paragraph}>
              L&apos;audit du projet <strong>{projectName}</strong> (
              {clientName}) attend votre relecture depuis{" "}
              <strong>{daysWaiting} jours</strong>.
            </Text>

            <Text style={paragraph}>
              Merci de prendre quelques minutes pour valider ou demander des
              corrections.
            </Text>

            <Section style={ctaSection}>
              <Button href={auditUrl} style={ctaButton}>
                Ouvrir l&apos;audit
              </Button>
            </Section>

            <Text style={muted}>
              Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre
              navigateur :
            </Text>
            <Text style={linkFallback}>{auditUrl}</Text>

            <Hr style={hr} />

            <Text style={muted}>
              Vous recevez cet email car vous êtes désigné·e comme relecteur·trice
              de cet audit.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Axessio — Plateforme d&apos;audits d&apos;accessibilité
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ReviewReminderEmail;

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: "32px 0",
};

const container: React.CSSProperties = {
  margin: "0 auto",
  maxWidth: "560px",
  padding: "0 16px",
};

const headerSection: React.CSSProperties = {
  textAlign: "center",
  paddingBottom: "24px",
};

const brand: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "28px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  margin: 0,
};

const subBrand: React.CSSProperties = {
  color: "#64748b",
  fontSize: "13px",
  margin: "4px 0 0",
};

const card: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e4e4e7",
  borderRadius: "12px",
  padding: "32px",
};

const h2: React.CSSProperties = {
  color: "#18181b",
  fontSize: "20px",
  fontWeight: 600,
  margin: "0 0 16px",
};

const paragraph: React.CSSProperties = {
  color: "#27272a",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const ctaSection: React.CSSProperties = {
  margin: "24px 0",
  textAlign: "center",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#b45309",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 24px",
  textDecoration: "none",
};

const muted: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 8px",
};

const linkFallback: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "13px",
  margin: "0 0 16px",
  wordBreak: "break-all",
};

const hr: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "24px 0",
};

const footer: React.CSSProperties = {
  paddingTop: "24px",
  textAlign: "center",
};

const footerText: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "12px",
  margin: 0,
};
