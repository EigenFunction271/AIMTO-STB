/*
Checkpoint question: Did every required fact survive the invoice handoff?
Input: an order with trusted item lines and total.
Trusted output: an invoice containing lines, total, notes, and fulfilment details.
Broken risk: a short message keeps the total but silently drops the facts behind it.
Fixed safety: buildInvoice copies every required field into one explicit invoice shape.
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

export async function invoiceBroken(pricedOrder) {
  return { ok: false, chatResponse: `Order received.\nTotal: RM${pricedOrder.totalRm}` };
}

export async function invoiceFixed(pricedOrder) {
  return { ok: true, value: buildInvoice(pricedOrder) };
}
