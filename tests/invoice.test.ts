import { describe, it, expect } from "vitest";
import { calculateInvoiceTotals } from "@/services/sales/invoice.service";

describe("calculateInvoiceTotals", () => {
  it("calcule HT, TVA et TTC", () => {
    const t = calculateInvoiceTotals([{ quantity: 2, unitPrice: 100, vatRate: 20 }]);
    expect(t).toEqual({ totalHT: 200, totalVAT: 40, totalTTC: 240 });
  });
});
