// Spec OpenAPI 3.1 de l'API publique v1, servie en JSON.
//
// Publique (pas d'auth) : un consommateur doit pouvoir lire le contrat avant
// d'avoir un token. Maintenue à la main et alignée sur les routes réelles —
// chaque nouvel endpoint /api/v1/* doit être ajouté ici.

import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/site";
import { API_SCOPES } from "@/lib/api-tokens/server";
import { API_RATE_LIMIT } from "@/lib/api-tokens/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Axessio API",
      version: "1.0.0",
      description:
        `API REST d'Axessio (lecture des audits d'accessibilité).\n\n` +
        `**Authentification** : header \`Authorization: Bearer axe_live_...\` ` +
        `(token créé depuis Organisation → API tokens).\n\n` +
        `**Quota** : ${API_RATE_LIMIT} requêtes / minute par token. Les réponses ` +
        `portent les headers \`RateLimit-Limit\`, \`RateLimit-Remaining\`, ` +
        `\`RateLimit-Reset\` (secondes). Dépassement → 429 + \`Retry-After\`.\n\n` +
        `**Scopes disponibles** : ${API_SCOPES.join(", ")}.\n\n` +
        `**Versionnement** : la version est dans le chemin (\`/api/v1\`). En cas ` +
        `de dépréciation, un header \`Sunset\` (RFC 8594) annoncera la date de ` +
        `retrait avec au moins 6 mois de préavis.`,
    },
    servers: [{ url: siteUrl("/api/v1") }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "axe_live_<random>",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: { error: { type: "string" } },
          required: ["error"],
        },
        Audit: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            project_id: { type: "string", format: "uuid" },
            reference_id: { type: "string", format: "uuid" },
            service_type: { type: "string" },
            platform: { type: "string" },
            status: { type: "string" },
            language: { type: "string" },
            expected_start_at: { type: ["string", "null"], format: "date-time" },
            expected_end_at: { type: ["string", "null"], format: "date-time" },
            delivered_at: { type: ["string", "null"], format: "date-time" },
            initial_score: { type: ["number", "null"] },
            final_score: { type: ["number", "null"] },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            limit: { type: "integer" },
            has_more: { type: "boolean" },
            next_cursor: { type: ["string", "null"], format: "date-time" },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "Token manquant, malformé, invalide ou expiré.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
        Forbidden: {
          description: "Scope insuffisant pour cette opération.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
        TooManyRequests: {
          description: "Quota dépassé. Voir le header Retry-After.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/audits": {
        get: {
          operationId: "listAudits",
          summary: "Liste les audits de l'organisation du token",
          description: "Pagination par curseur (created_at décroissant). Scope requis : `audits:read`.",
          parameters: [
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
              description: "Nombre d'éléments par page (1–200).",
            },
            {
              name: "cursor",
              in: "query",
              required: false,
              schema: { type: "string", format: "date-time" },
              description: "Curseur = `next_cursor` de la page précédente (created_at ISO).",
            },
          ],
          responses: {
            "200": {
              description: "Page d'audits.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Audit" },
                      },
                      pagination: { $ref: "#/components/schemas/Pagination" },
                    },
                    required: ["data", "pagination"],
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "429": { $ref: "#/components/responses/TooManyRequests" },
          },
        },
      },
    },
  };

  return NextResponse.json(spec, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
