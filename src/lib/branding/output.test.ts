import { describe, expect, it } from "vitest";
import {
  AXESSIO_DEFAULT_OUTPUT_BRANDING,
  sanitizeHexColor,
  sanitizeLogoUrl,
} from "./output";

describe("sanitizeHexColor", () => {
  it("accepte un #RRGGBB valide", () => {
    expect(sanitizeHexColor("#1a2b3c")).toBe("#1a2b3c");
    expect(sanitizeHexColor("#FFFFFF")).toBe("#FFFFFF");
  });

  it("trim les espaces autour", () => {
    expect(sanitizeHexColor("  #0f172a  ")).toBe("#0f172a");
  });

  it("rejette les formes courtes / invalides → fallback", () => {
    expect(sanitizeHexColor("#fff")).toBe(AXESSIO_DEFAULT_OUTPUT_BRANDING.primaryColor);
    expect(sanitizeHexColor("0f172a")).toBe(AXESSIO_DEFAULT_OUTPUT_BRANDING.primaryColor);
    expect(sanitizeHexColor("#1a2b3g")).toBe(AXESSIO_DEFAULT_OUTPUT_BRANDING.primaryColor);
  });

  it("rejette une tentative d'injection CSS → fallback", () => {
    expect(sanitizeHexColor("#000;} body{display:none")).toBe(
      AXESSIO_DEFAULT_OUTPUT_BRANDING.primaryColor,
    );
    expect(sanitizeHexColor("red;background:url(x)")).toBe(
      AXESSIO_DEFAULT_OUTPUT_BRANDING.primaryColor,
    );
  });

  it("gère null/undefined → fallback", () => {
    expect(sanitizeHexColor(null)).toBe(AXESSIO_DEFAULT_OUTPUT_BRANDING.primaryColor);
    expect(sanitizeHexColor(undefined)).toBe(AXESSIO_DEFAULT_OUTPUT_BRANDING.primaryColor);
  });

  it("respecte un fallback custom", () => {
    expect(sanitizeHexColor("bad", "#abcdef")).toBe("#abcdef");
  });
});

describe("sanitizeLogoUrl", () => {
  it("accepte une URL https absolue", () => {
    expect(sanitizeLogoUrl("https://cdn.example.com/logo.png")).toBe(
      "https://cdn.example.com/logo.png",
    );
  });

  it("rejette http:// → null (mixed content)", () => {
    expect(sanitizeLogoUrl("http://cdn.example.com/logo.png")).toBeNull();
  });

  it("rejette data: et javascript: → null", () => {
    expect(sanitizeLogoUrl("data:image/png;base64,AAAA")).toBeNull();
    expect(sanitizeLogoUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejette un chemin relatif → null", () => {
    expect(sanitizeLogoUrl("/logo.png")).toBeNull();
    expect(sanitizeLogoUrl("logo.png")).toBeNull();
  });

  it("gère null / vide → null", () => {
    expect(sanitizeLogoUrl(null)).toBeNull();
    expect(sanitizeLogoUrl(undefined)).toBeNull();
    expect(sanitizeLogoUrl("   ")).toBeNull();
  });
});

describe("AXESSIO_DEFAULT_OUTPUT_BRANDING", () => {
  it("n'est pas custom et porte les valeurs Axessio", () => {
    expect(AXESSIO_DEFAULT_OUTPUT_BRANDING.isCustom).toBe(false);
    expect(AXESSIO_DEFAULT_OUTPUT_BRANDING.brandName).toBe("Axessio");
    expect(AXESSIO_DEFAULT_OUTPUT_BRANDING.logoUrl).toBeNull();
    expect(sanitizeHexColor(AXESSIO_DEFAULT_OUTPUT_BRANDING.primaryColor)).toBe(
      AXESSIO_DEFAULT_OUTPUT_BRANDING.primaryColor,
    );
  });
});
