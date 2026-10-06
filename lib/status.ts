export type Tone = "neutral" | "brand" | "ok" | "warn" | "bad";
type Map = Record<string, { label: string; tone: Tone }>;

export const QUOTE_STATUS: Map = {
  DRAFT: { label: "Brouillon", tone: "neutral" },
  SENT: { label: "Envoyé", tone: "brand" },
  ACCEPTED: { label: "Accepté", tone: "ok" },
  REJECTED: { label: "Refusé", tone: "bad" },
  EXPIRED: { label: "Expiré", tone: "warn" },
  CANCELLED: { label: "Annulé", tone: "neutral" },
};

export const INVOICE_STATUS: Map = {
  DRAFT: { label: "Brouillon", tone: "neutral" },
  ISSUED: { label: "Émise", tone: "brand" },
  PARTIALLY_PAID: { label: "Payée en partie", tone: "warn" },
  PAID: { label: "Payée", tone: "ok" },
  OVERDUE: { label: "En retard", tone: "bad" },
  CANCELLED: { label: "Annulée", tone: "neutral" },
};

export const OPPORTUNITY_STATUS: Map = {
  NEW: { label: "Nouvelle", tone: "neutral" },
  QUALIFIED: { label: "Qualifiée", tone: "brand" },
  PROPOSAL: { label: "Proposition", tone: "brand" },
  NEGOTIATION: { label: "Négociation", tone: "warn" },
  WON: { label: "Gagnée", tone: "ok" },
  LOST: { label: "Perdue", tone: "bad" },
};

export const MOVEMENT_TYPE: Record<string, string> = {
  INITIAL: "Stock initial", PURCHASE: "Achat", SALE: "Vente", RETURN: "Retour",
  TRANSFER_IN: "Transfert entrant", TRANSFER_OUT: "Transfert sortant", ADJUSTMENT: "Ajustement", LOSS: "Perte",
};

export const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super admin", ADMIN: "Administrateur", MANAGER: "Responsable", COMMERCIAL: "Commercial",
  COMPTABLE: "Comptable", MAGASINIER: "Magasinier", RH: "RH", EMPLOYEE: "Employé", SUPPORT: "Support",
};
