import { ArrowLeftRight, FileText, LayoutDashboard, Package, Receipt, Target, Users, type LucideIcon } from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon };
export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  { title: "Pilotage", items: [{ label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard }] },
  {
    title: "Relation client",
    items: [
      { label: "Clients", href: "/clients", icon: Users },
      { label: "Opportunités", href: "/opportunites", icon: Target },
    ],
  },
  {
    title: "Ventes",
    items: [
      { label: "Devis", href: "/devis", icon: FileText },
      { label: "Factures", href: "/factures", icon: Receipt },
    ],
  },
  {
    title: "Stock",
    items: [
      { label: "Produits", href: "/produits", icon: Package },
      { label: "Mouvements", href: "/stock", icon: ArrowLeftRight },
    ],
  },
];
