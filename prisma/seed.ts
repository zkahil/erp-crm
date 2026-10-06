import { PrismaClient, type InvoiceStatus, type QuoteStatus, type OpportunityStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { calculateInvoiceTotals } from "../services/sales/invoice.service";

const db = new PrismaClient();

let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const int = (a: number, b: number) => Math.floor(a + rnd() * (b - a + 1));
const pick = <T,>(a: T[]) => a[int(0, a.length - 1)]!;
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000);

const CUSTOMERS: [string, string][] = [
  ["Atlas Textile SARL", "Casablanca"], ["Maghreb Pièces Auto", "Casablanca"], ["Boulangerie Al Amal", "Rabat"],
  ["Clinique Les Orangers", "Marrakech"], ["Hôtel Riad Zitoun", "Marrakech"], ["Imprimerie Chrifia", "Fès"],
  ["Agro Souss", "Agadir"], ["Menuiserie Tanger Nord", "Tanger"], ["Cabinet Benjelloun", "Rabat"],
  ["Pharmacie Ibn Sina", "Casablanca"], ["Cimenterie du Rif", "Nador"], ["Coopérative Argan Tiznit", "Tiznit"],
  ["Transports El Fassi", "Fès"], ["Électro Meknès", "Meknès"], ["École Les Palmiers", "Kénitra"],
  ["Café Bab Doukkala", "Marrakech"], ["Quincaillerie Moderne", "Oujda"], ["Salon Nour", "Casablanca"],
  ["Conserverie Safi Mer", "Safi"], ["Studio Zellij Design", "Rabat"],
];
const PRODUCTS = [
  "Câble réseau Cat6", "Onduleur 1000 VA", "Routeur Wi-Fi 6", "Switch 24 ports", "Écran 24 pouces", "Clavier sans fil",
  "Souris ergonomique", "Imprimante laser", "Toner noir", "Rame papier A4", "Disque SSD 512 Go", "Mémoire 16 Go",
  "Caméra de surveillance", "Disjoncteur 32 A", "Prise connectée", "Panneau LED 60x60", "Batterie 12 V", "Tableau électrique",
  "Chargeur USB-C", "Lecteur code-barres", "Caisse enregistreuse", "Rouleau ticket thermique", "Casque audio", "Webcam HD",
  "Support mural TV", "Rallonge 5 m", "Multiprise parafoudre", "Tablette 10 pouces", "Pointeuse biométrique", "Étiqueteuse",
];

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Seed interdit en production");

  // Base de développement uniquement : on repart de zéro.
  await db.payment.deleteMany(); await db.invoice.deleteMany(); await db.order.deleteMany();
  await db.quoteLine.deleteMany(); await db.quote.deleteMany(); await db.opportunity.deleteMany();
  await db.contact.deleteMany(); await db.prospect.deleteMany(); await db.stockMovement.deleteMany();
  await db.product.deleteMany(); await db.warehouse.deleteMany(); await db.customer.deleteMany();
  await db.auditLog.deleteMany(); await db.user.deleteMany(); await db.organization.deleteMany();

  const org = await db.organization.create({ data: { name: "Demo SARL", ice: "001234567000089", address: "Boulevard Zerktouni, Casablanca", phone: "+212 5 22 00 00 00", email: "contact@demo.ma" } });
  const o = org.id;

  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);
  const users: [string, string, "ADMIN" | "MANAGER" | "COMMERCIAL" | "COMPTABLE" | "MAGASINIER"][] = [
    ["admin@example.com", "Zakariaa K.", "ADMIN"], ["manager@example.com", "Salma Alaoui", "MANAGER"],
    ["commercial@example.com", "Youssef Idrissi", "COMMERCIAL"], ["compta@example.com", "Nadia Berrada", "COMPTABLE"],
    ["stock@example.com", "Hamza Tazi", "MAGASINIER"],
  ];
  for (const [email, name, role] of users) await db.user.create({ data: { organizationId: o, email, name, role, passwordHash } });

  const customers = [];
  for (const [i, [name, city]] of CUSTOMERS.entries()) {
    customers.push(await db.customer.create({ data: {
      organizationId: o, name, city, email: `contact${i + 1}@${name.toLowerCase().replace(/[^a-z]+/g, "")}.ma`,
      phone: `+212 6 ${int(10, 99)} ${int(10, 99)} ${int(10, 99)} ${int(10, 99)}`, createdAt: daysAgo(int(5, 200)),
    } }));
  }

  const warehouses = [await db.warehouse.create({ data: { organizationId: o, name: "Casablanca" } }), await db.warehouse.create({ data: { organizationId: o, name: "Tanger" } })];

  const products = [];
  for (const [i, name] of PRODUCTS.entries()) {
    const buy = int(30, 1500);
    const p = await db.product.create({ data: { organizationId: o, sku: `PRD-${String(i + 1).padStart(3, "0")}`, name, purchasePrice: buy, salePrice: Math.round(buy * (1.25 + rnd() * 0.3)), minStock: int(5, 20) } });
    products.push(p);
    // Quelques produits volontairement en dessous du seuil pour le tableau de bord
    const initial = i % 9 === 0 ? int(0, 3) : int(30, 120);
    await db.stockMovement.create({ data: { organizationId: o, productId: p.id, warehouseId: warehouses[0]!.id, type: "INITIAL", quantity: initial, createdAt: daysAgo(180) } });
    if (initial > 20) {
      await db.stockMovement.create({ data: { organizationId: o, productId: p.id, warehouseId: warehouses[0]!.id, type: "SALE", quantity: -int(1, 15), reference: "Vente comptoir", createdAt: daysAgo(int(1, 60)) } });
      await db.stockMovement.create({ data: { organizationId: o, productId: p.id, warehouseId: warehouses[1]!.id, type: "TRANSFER_IN", quantity: int(5, 20), reference: "Transfert Casablanca", createdAt: daysAgo(int(1, 40)) } });
    }
  }

  const lines = () => Array.from({ length: int(1, 4) }, () => {
    const p = pick(products);
    return { productId: p.id, description: p.name, quantity: int(1, 10), unitPrice: Number(p.salePrice), discount: pick([0, 0, 5, 10]), vatRate: 20 };
  });

  const quoteStatuses: QuoteStatus[] = ["DRAFT", "SENT", "SENT", "ACCEPTED", "ACCEPTED", "REJECTED", "EXPIRED"];
  for (let i = 1; i <= 20; i++) {
    const l = lines();
    const t = calculateInvoiceTotals(l);
    const age = int(2, 150);
    await db.quote.create({ data: {
      organizationId: o, number: `DEV-2026-${String(i).padStart(4, "0")}`, customerId: pick(customers).id, status: pick(quoteStatuses),
      date: daysAgo(age), validUntil: daysAgo(age - 30), ...t, lines: { create: l },
    } });
  }

  const invStatuses: InvoiceStatus[] = ["PAID", "PAID", "PAID", "PAID", "PARTIALLY_PAID", "ISSUED", "OVERDUE"];
  for (let i = 1; i <= 24; i++) {
    const t = calculateInvoiceTotals(lines());
    const age = Math.round(i * 7 + int(0, 5));
    const status = pick(invStatuses);
    const date = daysAgo(Math.min(age, 170));
    const due = new Date(date.getTime() + 30 * 86_400_000);
    // Une facture « en retard » doit avoir une échéance passée
    const finalStatus: InvoiceStatus = status === "OVERDUE" && due > new Date() ? "ISSUED" : status;
    const paid = finalStatus === "PAID" ? t.totalTTC : finalStatus === "PARTIALLY_PAID" ? Math.round(t.totalTTC / 2) : 0;
    const inv = await db.invoice.create({ data: {
      organizationId: o, number: `FAC-2026-${String(i).padStart(4, "0")}`, customerId: pick(customers).id, status: finalStatus,
      date, dueDate: due, ...t, paidAmount: paid,
    } });
    if (paid > 0) await db.payment.create({ data: { organizationId: o, invoiceId: inv.id, method: pick(["BANK_TRANSFER", "CHECK", "CASH", "CARD"]), amount: paid, paidAt: new Date(Math.min(Date.now(), date.getTime() + int(3, 25) * 86_400_000)) } });
  }

  const oppTitles = ["Équipement bureau", "Renouvellement parc informatique", "Vidéosurveillance entrepôt", "Contrat maintenance annuel", "Caisses point de vente", "Câblage réseau agence", "Pointeuses biométriques"];
  const oppStatuses: OpportunityStatus[] = ["NEW", "NEW", "QUALIFIED", "QUALIFIED", "PROPOSAL", "PROPOSAL", "NEGOTIATION", "NEGOTIATION", "WON", "LOST"];
  for (let i = 0; i < 14; i++) {
    const status = pick(oppStatuses);
    await db.opportunity.create({ data: {
      organizationId: o, customerId: pick(customers).id, title: pick(oppTitles), amount: int(8, 180) * 1000, status,
      probability: { NEW: 10, QUALIFIED: 30, PROPOSAL: 50, NEGOTIATION: 75, WON: 100, LOST: 0 }[status], expectedDate: daysAhead(int(5, 60)),
    } });
  }

  const sources = ["Recommandation", "Salon", "Site web", "WhatsApp"];
  for (let i = 1; i <= 20; i++) await db.prospect.create({ data: { organizationId: o, name: `Prospect ${i}`, company: `Société ${i}`, source: pick(sources), email: `prospect${i}@exemple.ma` } });

  console.log("Données de démonstration créées. Connexion : admin@example.com / ChangeMe123!");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
