/**
 * CHECKPOINT 4: PROMISE — REFERENCE ANSWER
 * Input: trusted invoice. Source: only validated fields on that invoice.
 * Output: customer confirmation assembled in code.
 * Compare: ../broken/04-promise.js
 * Safety: fixed wording cannot add facts that are absent from the invoice.
 */
export function buildReply(invoice) {
  const lines = invoice.lines.map((line) => `- ${line.units} × ${line.name}${line.unitLabel === "each" ? "" : `, ${line.unitLabel}`}: RM${line.subtotalRm}`).join("\n");
  const notes = invoice.notes.length ? `\n${invoice.notes.length === 1 ? "Note" : "Notes"}: ${invoice.notes.map((note) => note.text).join("; ")}` : "";
  const fulfilment = invoice.fulfilment.method === "unknown"
    ? "Fulfilment details still need confirmation."
    : `${invoice.fulfilment.method === "pickup" ? "Pickup" : "Delivery"} requested${invoice.fulfilment.requestedTime ? `: ${invoice.fulfilment.requestedTime}` : "."}`;
  return `Hi! We received your order request:\n${lines}\nTotal: RM${invoice.totalRm}${notes}\n${fulfilment}\nKak Nor will confirm availability and details.`;
}

export async function replyFixed(invoice) {
  return { ok: true, chatResponse: buildReply(invoice) };
}
