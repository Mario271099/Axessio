import { describe, it, expect } from "vitest";
import { validateContact } from "./contact";

const VALID = {
  name: "Camille Martin",
  email: "camille@exemple.fr",
  organization: "Mairie de Lyon",
  subject: "demo",
  message: "Bonjour, je souhaite une démonstration de la plateforme.",
};

describe("validateContact", () => {
  it("accepte un message complet et nettoie les espaces", () => {
    const result = validateContact({ ...VALID, name: "  Camille Martin  " });
    expect(result).toEqual({ ok: true, data: { ...VALID } });
  });

  it("accepte une organisation vide (champ facultatif)", () => {
    const result = validateContact({ ...VALID, organization: "" });
    expect(result.ok).toBe(true);
  });

  it("signale tous les champs obligatoires manquants", () => {
    const result = validateContact({});
    expect(result).toEqual({
      ok: false,
      errors: {
        name: "required",
        email: "required",
        subject: "required",
        message: "required",
      },
    });
  });

  it("rejette une adresse e-mail invalide", () => {
    const result = validateContact({ ...VALID, email: "camille@exemple" });
    expect(result).toEqual({ ok: false, errors: { email: "invalid" } });
  });

  it("rejette un sujet hors liste", () => {
    const result = validateContact({ ...VALID, subject: "spam" });
    expect(result).toEqual({ ok: false, errors: { subject: "invalid" } });
  });

  it("applique les bornes de longueur du message", () => {
    expect(validateContact({ ...VALID, message: "Trop court" })).toEqual({
      ok: false,
      errors: { message: "tooShort" },
    });
    expect(validateContact({ ...VALID, message: "a".repeat(5001) })).toEqual({
      ok: false,
      errors: { message: "tooLong" },
    });
  });

  it("ignore les valeurs qui ne sont pas des chaînes", () => {
    const result = validateContact({ ...VALID, name: 42 });
    expect(result).toEqual({ ok: false, errors: { name: "required" } });
  });
});
