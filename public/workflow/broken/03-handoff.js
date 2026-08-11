/**
 * CHECKPOINT 3: HANDOFF — BROKEN
 * Input: trusted priced order. Source: totalRm from the previous stage.
 * Output: a short message; the pipeline stops without saving an invoice.
 * Compare: ../answers/03-handoff.js
 * Risk: the handoff silently drops item lines, notes, and fulfilment facts.
 */
export async function invoiceBroken(pricedOrder) {
  return { ok: false, chatResponse: `Order received.\nTotal: RM${pricedOrder.totalRm}` };
}
