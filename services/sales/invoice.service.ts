export type Line = { quantity: number; unitPrice: number; discount?: number; vatRate: number };

export function calculateInvoiceTotals(lines: Line[]) {
  let ht = 0;
  let vat = 0;
  for (const l of lines) {
    const net = l.quantity * l.unitPrice * (1 - (l.discount ?? 0) / 100);
    ht += net;
    vat += net * (l.vatRate / 100);
  }
  const r = (n: number) => Math.round(n * 100) / 100;
  return { totalHT: r(ht), totalVAT: r(vat), totalTTC: r(ht + vat) };
}
