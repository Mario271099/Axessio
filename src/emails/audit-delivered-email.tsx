import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import {
  AXESSIO_DEFAULT_OUTPUT_BRANDING,
  type OutputBranding,
} from "@/lib/branding/output";

export interface AuditDeliveredEmailProps {
  recipientName: string;
  projectName: string;
  clientName: string;
  auditUrl: string;
  branding?: OutputBranding;
}

export function AuditDeliveredEmail({
  recipientName,
  projectName,
  clientName,
  auditUrl,
  branding = AXESSIO_DEFAULT_OUTPUT_BRANDING,
}: AuditDeliveredEmailProps) {
  const greeting = recipientName.trim()
    ? `Bonjour ${recipientName},`
    : "Bonjour,";
  const brandName = branding.brandName;

  return (
    <Html lang="fr">
      <Head />
      <Preview>
        Votre rapport d&apos;audit d&apos;accessibilité est disponible
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={headerSection}>
            {branding.logoUrl ? (
              <Img
                src={branding.logoUrl}
                alt={brandName}
                height={40}
                style={logoImg}
              />
            ) : (
              <Heading style={{ ...brand, color: branding.primaryColor }}>
                {brandName}
              </Heading>
            )}
            {branding.tagline ? (
              <Text style={subBrand}>{branding.tagline}</Text>
            ) : null}
          </Section>

          <Section style={card}>
            <Heading as="h2" style={h2}>
              Rapport d&apos;audit livré
            </Heading>

            <Text style={paragraph}>{greeting}</Text>

            <Text style={paragraph}>
              Le rapport d&apos;audit du projet{" "}
              <strong>{projectName}</strong> ({clientName}) vient d&apos;être
              livré.
            </Text>

            <Text style={paragraph}>
              Vous pouvez consulter le rapport complet, les non-conformités et
              télécharger le PDF directement depuis la plateforme.
            </Text>

            <Section style={ctaSection}>
              <Button
                href={auditUrl}
                style={{ ...ctaButton, backgroundColor: branding.primaryColor }}
              >
                Consulter l&apos;audit
              </Button>
            </Section>

            <Text style={muted}>
              Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre
              navigateur :
            </Text>
            <Text style={{ ...linkFallback, color: branding.primaryColor }}>
              {auditUrl}
            </Text>

            <Hr style={hr} />

            <Text style={muted}>
              Pour toute question, contactez votre interlocuteur {brandName}{" "}
              habituel.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              {brandName}
              {branding.tagline ? ` — ${branding.tagline}` : ""}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default AuditDeliveredEmail;

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

const logoImg: React.CSSProperties = {
  margin: "0 auto",
  maxHeight: "40px",
  objectFit: "contain",
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
  backgroundColor: "#0f172a",
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
