/**
 * CHECKPOINT 3: HANDOFF — REFERENCE ANSWER
 * Input: trusted priced order. Source: all fields from the previous stage.
 * Output: a complete invoice with lines, total, notes, and fulfilment.
 * Compare: ../broken/03-handoff.js
 * Safety: every required field is copied into one explicit invoice shape.
 */
export function buildInvoice(pricedOrder) {
  if (!pricedOrder || !Array.isArray(pricedOrder.lines) || !Number.isFinite(pricedOrder.totalRm)) {
    throw new Error("A priced order is required.");
  }
  return {
    lines: pricedOrder.lines.map((line) => ({ ...line })),
    totalRm: pricedOrder.totalRm,
    notes: pricedOrder.notes.map((note) => ({ ...note })),
    fulfilment: { ...pricedOrder.fulfilment },
  };
}

export async function invoiceFixed(pricedOrder) {
  return { ok: true, value: buildInvoice(pricedOrder) };
}
