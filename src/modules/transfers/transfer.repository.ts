import { Prisma, TransferStatus, UserRole, UserStatus } from "@prisma/client";
import { prisma } from "../../config/database";

const transferSelect = {
  id: true,
  reference: true,
  senderName: true,
  senderPhone: true,
  recipientName: true,
  recipientPhone: true,
  amount: true,
  fee: true,
  status: true,
  originCityId: true,
  destinationCityId: true,
  originAgentId: true,
  destinationAgentId: true,
  originCity: {
    select: {
      id: true,
      name: true,
    },
  },
  destinationCity: {
    select: {
      id: true,
      name: true,
    },
  },
  originAgent: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      cityId: true,
      city: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  destinationAgent: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      cityId: true,
      city: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  createdAt: true,
  updatedAt: true,
} as const

// Réservé à la création (l'agent d'origine doit récupérer le code une fois)
// et à l'étape de vérification du code par l'agent destinataire.
// Ne jamais utiliser ce select pour une liste ou un détail de transfert.
const transferSelectWithCode = {
  ...transferSelect,
  withdrawalCode: true,
} as const

// Select allégé pour les vues liste (aucun écran liste n'affiche les
// coordonnées des agents, seulement leurs identifiants) : évite de charger
// originAgent/destinationAgent (et leur city imbriquée) sur chaque ligne
// d'une liste potentiellement longue. La vue détail garde transferSelect.
const transferListSelect = {
  id: true,
  reference: true,
  senderName: true,
  senderPhone: true,
  recipientName: true,
  recipientPhone: true,
  amount: true,
  fee: true,
  status: true,
  originCityId: true,
  destinationCityId: true,
  originAgentId: true,
  destinationAgentId: true,
  originCity: {
    select: {
      id: true,
      name: true,
    },
  },
  destinationCity: {
    select: {
      id: true,
      name: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} as const

// Champs réellement modifiables depuis l'endpoint de modification. Toute autre
// colonne (reference, fee, status, withdrawalCode, paidAt, agents) est
// volontairement absente de ce type : elle ne peut pas être écrite ici.
type TransferUpdateData = {
  senderName?: string;
  senderPhone?: string;
  recipientName?: string;
  recipientPhone?: string;
  amount?: string;
  fee?: string;
  destinationCityId?: string;
  destinationAgentId?: string;
};

/**
 * Neutralise les jokers du motif LIKE de PostgreSQL.
 *
 * `contains` compiles en ILIKE '%terme%' et Prisma n'échappe pas les
 * métacaractères : sans ce traitement, une recherche sur "%" (ou "_", ou
 * "%_%") ne cherche pas un nom mais renvoie tous les transferts. On échappe
 * donc la barre oblique inverse ainsi que % et _, qui redeviennent des
 * caractères littéraux. La requête reste paramétrée : il ne s'agit pas d'une
 * injection SQL, seulement d'un motif LIKE quiurasait trop large.
 */
function escapeLikeTerm(term: string): string {
  return term.replace(/([\\%_])/g, "\\$1");
}

/**
 * Filtre des transferts entrants, utilisé par la liste ET par le compte.
 *
 * Les deux construisant leur `where` avec cette même fonction, la pagination
 * ne peut pas dériver du filtre affiché (sinon on afficherait « page 2 »
 * d'un total sans rapport avec les lignes renvoyées).
 *
 * `search` porte sur le nom de l'expéditeur ou celui du bénéficiaire, sans
 * distinction : l'agent saisit un seul terme et retrouve le transfert quel que
 * soit le côté. La comparaison est insensible à la casse et au trait d'union,
 * pour que "sokhna" retrouve "Sokhna Aïda".
 */
function buildIncomingWhere(
  agentId: string,
  status?: TransferStatus | TransferStatus[],
  search?: string,
): Prisma.TransferWhereInput {
  const term = search?.trim();
  const pattern = term ? escapeLikeTerm(term) : undefined;

  return {
    destinationAgentId: agentId,
    ...(status ? { status: Array.isArray(status) ? { in: status } : status } : {}),
    ...(pattern
      ? {
          OR: [
            { senderName: { contains: pattern, mode: "insensitive" } },
            { recipientName: { contains: pattern, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export const transferRepository = {
  findDestinationCity: (id: string) =>
    prisma.city.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    }),

  findActiveAgentByCity: (cityId: string, excludeAgentId?: string) =>
    prisma.user.findFirst({
      where: {
        role: UserRole.AGENT,
        status: UserStatus.ACTIVE,
        cityId,
        ...(excludeAgentId ? { id: { not: excludeAgentId } } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        cityId: true,
        city: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

  findById: (id: string) =>
    prisma.transfer.findUnique({
      where: { id },
      select: transferSelect,
    }),

  findByIdWithCode: (id: string) =>
    prisma.transfer.findUnique({
      where: { id },
      select: transferSelectWithCode,
    }),

  findByReference: (reference: string) =>
    prisma.transfer.findUnique({
      where: { reference },
      select: {
        id: true,
      },
    }),

  create: (data: {
    reference: string;
    senderName: string;
    senderPhone: string;
    recipientName: string;
    recipientPhone: string;
    amount: string;
    fee: string;
    withdrawalCode: string;
    status: TransferStatus;
    originCityId: string;
    destinationCityId: string;
    originAgentId: string;
    destinationAgentId: string;
  }) =>
    prisma.transfer.create({
      data: {
        reference: data.reference,
        senderName: data.senderName,
        senderPhone: data.senderPhone,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        amount: data.amount,
        fee: data.fee,
        withdrawalCode: data.withdrawalCode,
        status: data.status,
        originCityId: data.originCityId,
        destinationCityId: data.destinationCityId,
        originAgentId: data.originAgentId,
        destinationAgentId: data.destinationAgentId,
      },
      select: transferSelectWithCode,
    }),

  findIncomingByAgent: (
    agentId: string,
    skip: number,
    take: number,
    status?: TransferStatus | TransferStatus[],
    search?: string,
  ) =>
    prisma.transfer.findMany({
      where: buildIncomingWhere(agentId, status, search),
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: transferListSelect,
    }),

  countByDestinationAgent: (
    agentId: string,
    status?: TransferStatus | TransferStatus[],
    search?: string,
  ) =>
    prisma.transfer.count({
      where: buildIncomingWhere(agentId, status, search),
    }),

  findAllWithFilters: (skip: number, take: number, status?: TransferStatus) =>
    prisma.transfer.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: transferListSelect,
    }),

  countAllWithFilters: (status?: TransferStatus) =>
    prisma.transfer.count({
      where: {
        ...(status ? { status } : {}),
      },
    }),

  findByAgentId: (agentId: string, skip: number, take: number, status?: TransferStatus) =>
    prisma.transfer.findMany({
      where: {
        OR: [
          { originAgentId: agentId },
          { destinationAgentId: agentId },
          { paidByAgentId: agentId },
        ],
        ...(status ? { status } : {}),
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: transferListSelect,
    }),

  countByAgentId: (agentId: string, status?: TransferStatus) =>
    prisma.transfer.count({
      where: {
        OR: [
          { originAgentId: agentId },
          { destinationAgentId: agentId },
          { paidByAgentId: agentId },
        ],
        ...(status ? { status } : {}),
      },
    }),

  verifyWithdrawalCodeTransition: (id: string) =>
    prisma.transfer.updateMany({
      where: {
        id,
        status: "CREATED",
      },
      data: {
        status: "READY_FOR_PAYMENT",
      },
    }),

  payTransfer: (id: string, paidByAgentId: string) =>
    prisma.transfer.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paidByAgentId,
      },
      select: {
        ...transferSelect,
        paidAt: true,
        paidByAgentId: true,
      },
    }),

  cancelTransferTransition: (id: string, originAgentId: string) =>
    prisma.transfer.updateMany({
      where: {
        id,
        originAgentId,
        status: "CREATED",
      },
      data: {
        status: "CANCELLED",
      },
    }),

  /**
   * Modification d'un transfert, gardée atomique côté base.
   *
   * Le `where` porte à la fois la propriété du transfert et son statut
   * modifiable : un paiement survenu entre la lecture du transfert et cette
   * écriture ne peut donc pas être écrasé (updateMany renvoie alors count = 0
   * et le service traduit l'échec en erreur métier). Même approche que
   * cancelTransferTransition.
   */
  updateTransfer: (id: string, originAgentId: string, data: TransferUpdateData) =>
    prisma.transfer.updateMany({
      where: {
        id,
        originAgentId,
        status: { in: ["CREATED", "READY_FOR_PAYMENT"] },
      },
      data,
    }),
};
