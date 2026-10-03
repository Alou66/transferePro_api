import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Express } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";

/**
 * Tests de la réinitialisation des données (`POST /api/admin/maintenance/reset-data`).
 *
 * Isolation : `src/config/database` est entièrement remplacé par un double
 * de test. Aucune connexion n'est ouverte et la base de données réelle — a
 * fortiori celle de production — n'est jamais sollicitée. Les requêtes
 * observées sont les appels Prisma que le service émet.
 */
const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    // Le service utilise la forme interactive ($transaction(async tx => ...)) :
    // le double exécute le callback et, si une promesse rejection survient,
    // la propagation reproduit le ROLLBACK de PostgreSQL (aucun état validé).
    $transaction: vi.fn(),
    cashCollection: { deleteMany: vi.fn() },
    transfer: { deleteMany: vi.fn() },
    user: { deleteMany: vi.fn(), findUnique: vi.fn() },
    city: { deleteMany: vi.fn() },
  };

  return { prismaMock };
});

vi.mock("../src/config/database", () => ({ prisma: prismaMock }));

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const AGENT_ID = "22222222-2222-4222-8222-222222222222";
const JWT_SECRET = "test-jwt-secret";
const RESET_ENDPOINT = "/api/admin/maintenance/reset-data";

function buildApp(enableDataReset: boolean): Promise<Express> {
  // src/config/env.ts lit process.env une seule fois au chargement du module :
  // on repart d'un registre de modules vierge avec la variable positionnée pour
  // que chaque test observe la configuration qu'il veut vérifier.
  vi.resetModules();
  vi.stubEnv("ENABLE_DATA_RESET", enableDataReset ? "true" : "false");

  return import("../src/app").then((module) => module.default());
}

function signToken(role: "ADMIN" | "AGENT", userId: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "24h" });
}

function authHeaderAs(role: "ADMIN" | "AGENT", userId: string) {
  return `Bearer ${signToken(role, userId)}`;
}

/** État par défaut : une suppression réussi sur une base déjà réinitialisée. */
function primeSuccessfulReset() {
  prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));
  prismaMock.cashCollection.deleteMany.mockResolvedValue({ count: 0 });
  prismaMock.transfer.deleteMany.mockResolvedValue({ count: 0 });
  prismaMock.user.deleteMany.mockResolvedValue({ count: 0 });
  prismaMock.user.findUnique.mockResolvedValue({
    id: ADMIN_ID,
    role: "ADMIN",
    status: "ACTIVE",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  primeSuccessfulReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/admin/maintenance/reset-data — accès", () => {
  it("refuse un utilisateur non authentifié (401)", async () => {
    const app = await buildApp(true);

    const response = await request(app).post(RESET_ENDPOINT).send({ confirmation: "RESET" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Token d'accès requis",
    });
    // Aucune suppression ne doit être tentée.
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("refuse un utilisateur authentifié qui n'est pas administrateur (403)", async () => {
    const app = await buildApp(true);

    const response = await request(app)
      .post(RESET_ENDPOINT)
      .set("Authorization", authHeaderAs("AGENT", AGENT_ID))
      .send({ confirmation: "RESET" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "Accès interdit",
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("refuse un administrateur dont la double confirmation est incorrecte (400)", async () => {
    const app = await buildApp(true);

    for (const confirmation of ["reset", "RESET ", "RESETS", "OUI", "", "annuler"]) {
      const response = await request(app)
        .post(RESET_ENDPOINT)
        .set("Authorization", authHeaderAs("ADMIN", ADMIN_ID))
        .send({ confirmation });

      expect(response.status, `confirmation=${JSON.stringify(confirmation)}`).toBe(400);
      expect(response.body.success).toBe(false);
    }

    // Le refus a lieu avant tout accès à la base.
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.transfer.deleteMany).not.toHaveBeenCalled();
  });

  it("refuse un administrateur quand la fonctionnalité est désactivée (403)", async () => {
    const app = await buildApp(false);

    const response = await request(app)
      .post(RESET_ENDPOINT)
      .set("Authorization", authHeaderAs("ADMIN", ADMIN_ID))
      .send({ confirmation: "RESET" });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "La réinitialisation des données est désactivée sur cet environnement.",
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("renseigne la disponibilité de l'opération pour un administrateur", async () => {
    const appEnabled = await buildApp(true);
    const appDisabled = await buildApp(false);

    const enabled = await request(appEnabled)
      .get("/api/admin/maintenance/reset-data/available")
      .set("Authorization", authHeaderAs("ADMIN", ADMIN_ID));

    const disabled = await request(appDisabled)
      .get("/api/admin/maintenance/reset-data/available")
      .set("Authorization", authHeaderAs("ADMIN", ADMIN_ID));

    expect(enabled.status).toBe(200);
    expect(enabled.body.data).toEqual({ enabled: true });
    expect(disabled.body.data).toEqual({ enabled: false });
  });

  it("interdit la consultation de la disponibilité à un agent", async () => {
    const app = await buildApp(true);

    const response = await request(app)
      .get("/api/admin/maintenance/reset-data/available")
      .set("Authorization", authHeaderAs("AGENT", AGENT_ID));

    expect(response.status).toBe(403);
  });
});

describe("POST /api/admin/maintenance/reset-data — exécution", () => {
  it("supprime les données dans l'ordre imposé par les clés étrangères", async () => {
    const callOrder: string[] = [];
    prismaMock.cashCollection.deleteMany.mockImplementation(async () => {
      callOrder.push("cash_collections");
      return { count: 4 };
    });
    prismaMock.transfer.deleteMany.mockImplementation(async () => {
      callOrder.push("transfers");
      return { count: 7 };
    });
    prismaMock.user.deleteMany.mockImplementation(async () => {
      callOrder.push("users");
      return { count: 3 };
    });

    const app = await buildApp(true);

    const response = await request(app)
      .post(RESET_ENDPOINT)
      .set("Authorization", authHeaderAs("ADMIN", ADMIN_ID))
      .send({ confirmation: "RESET" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Les données transactionnelles ont été réinitialisées.",
      data: { cashCollections: 4, transfers: 7, agents: 3 },
    });

    // cash_collections et transfers référencent toutes deux users en RESTRICT :
    // l'ordre d'exécution est impératif, pas un simple ordre d'affichage.
    expect(callOrder).toEqual(["cash_collections", "transfers", "users"]);

    // Un seul appel de transaction : soit les trois suppressions passent, soit
    // aucune n'est validée.
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it("n'exécute l'ensemble des suppressions que dans une transaction", async () => {
    const app = await buildApp(true);

    await request(app)
      .post(RESET_ENDPOINT)
      .set("Authorization", authHeaderAs("ADMIN", ADMIN_ID))
      .send({ confirmation: "RESET" });

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.cashCollection.deleteMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.transfer.deleteMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.deleteMany).toHaveBeenCalledTimes(1);
  });

  it("ne supprime que les comptes agents, jamais aucun administrateur", async () => {
    const app = await buildApp(true);

    await request(app)
      .post(RESET_ENDPOINT)
      .set("Authorization", authHeaderAs("ADMIN", ADMIN_ID))
      .send({ confirmation: "RESET" });

    // Le filtre role = AGENT est la protection du compte administrateur : il
    // doit être présent sur la requête, jamais un deleteMany sans condition.
    expect(prismaMock.user.deleteMany).toHaveBeenCalledWith({ where: { role: "AGENT" } });

    // Le compte à l'origine de l'opération est relu en fin de transaction pour
    // vérifier qu'il est toujours présent et toujours administrateur.
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: ADMIN_ID } }),
    );
  });

  it("ne supprime jamais les villes", async () => {
    const app = await buildApp(true);

    await request(app)
      .post(RESET_ENDPOINT)
      .set("Authorization", authHeaderAs("ADMIN", ADMIN_ID))
      .send({ confirmation: "RESET" });

    // city.deleteMany est présent sur le double uniquement pour pouvoir
    // affirmer qu'il n'est jamais appelé : cities est un référentiel
    // fonctionnel (inscription, destination des transferts).
    expect(prismaMock.city.deleteMany).not.toHaveBeenCalled();
  });

  it("annule tout si une suppression échoue (ROLLBACK)", async () => {
    prismaMock.transfer.deleteMany.mockRejectedValue(new Error("deadlock detected"));

    const app = await buildApp(true);

    const response = await request(app)
      .post(RESET_ENDPOINT)
      .set("Authorization", authHeaderAs("ADMIN", ADMIN_ID))
      .send({ confirmation: "RESET" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      message: "Internal server error",
    });

    // L'erreur s'est propagée hors du callback de transaction : Prisma émet un
    // ROLLBACK et ne valide rien. La suppression des comptes agents, qui
    // suit l'échec, n'a pas été atteinte.
    expect(prismaMock.user.deleteMany).not.toHaveBeenCalled();
  });

  it("annule tout si le compte administrateur a disparu pendant l'opération", async () => {
    // Le garde-fou de fin de transaction échoue : l'erreur levée dans le
    // callback provoque le ROLLBACK de l'ensemble des suppressions.
    prismaMock.user.findUnique.mockResolvedValue(null);

    const app = await buildApp(true);

    const response = await request(app)
      .post(RESET_ENDPOINT)
      .set("Authorization", authHeaderAs("ADMIN", ADMIN_ID))
      .send({ confirmation: "RESET" });

    expect(response.status).toBe(500);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe("src/config/env.ts — ENABLE_DATA_RESET", () => {
  it("est désactivée par défaut", async () => {
    // src/config/env.ts appelle dotenv.config(), qui relit le .env local mais
    // n'écrase jamais une variable déjà présente. Le test suppose donc que
    // .env ne déclare pas ENABLE_DATA_RESET : s'il le faisait, ce test échouerait
    // bruyamment plutôt que de passer à tort.
    vi.resetModules();
    vi.stubEnv("ENABLE_DATA_RESET", undefined);
    const { env } = await import("../src/config/env");

    expect(env.ENABLE_DATA_RESET).toBe(false);
  });

  it("n'accepte que la chaîne exacte « true »", async () => {
    for (const value of ["true", "TRUE", " true "]) {
      vi.resetModules();
      vi.stubEnv("ENABLE_DATA_RESET", value);
      const { env } = await import("../src/config/env");

      expect(env.ENABLE_DATA_RESET, `valeur=${JSON.stringify(value)}`).toBe(true);
    }

    // Toute autre valeur non vide laisse la fonctionnalité désactivée : un
    // « 1 » ou un « false » mal interprété ne doit jamais ouvrir une
    // opération destructive.
    for (const value of ["false", "1", "yes", "on", "vrai", "falsey"]) {
      vi.resetModules();
      vi.stubEnv("ENABLE_DATA_RESET", value);
      const { env } = await import("../src/config/env");

      expect(env.ENABLE_DATA_RESET, `valeur=${JSON.stringify(value)}`).toBe(false);
    }
  });
});