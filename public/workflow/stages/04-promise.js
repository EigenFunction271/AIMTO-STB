/*
Checkpoint question: Does the customer reply stay inside known facts?
Input: a trusted invoice.
Trusted output: a confirmation assembled only from invoice facts.
Broken risk: an AI writer may invent fulfilment details while trying to sound helpful.
Fixed safety: buildReply turns the validated invoice into text without adding promises.
*/

export const PROMISE_PROMPTS = Object.freeze({
  "reply-broken": (input) => `Write a friendly customer confirmation for this bakery order. Make it sound complete and helpful.\nOrder: ${input}`,
});

export function buildReply(invoice) {
  const lines = invoice.lines.map((line) => `- ${line.units} × ${line.name}${line.unitLabel === "each" ? "" : `, ${line.unitLabel}`}: RM${line.subtotalRm}`).join("\n");
  const notes = invoice.notes.length ? `\n${invoice.notes.length === 1 ? "Note" : "Notes"}: ${invoice.notes.map((note) => note.text).join("; ")}` : "";
  const fulfilment = invoice.fulfilment.method === "unknown"
    ? "Fulfilment details still need confirmation."
    : `${invoice.fulfilment.method === "pickup" ? "Pickup" : "Delivery"} requested${invoice.fulfilment.requestedTime ? `: ${invoice.fulfilment.requestedTime}` : "."}`;
  return `Hi! We received your order request:\n${lines}\nTotal: RM${invoice.totalRm}${notes}\n${fulfilment}\nKak Nor will confirm availability and details.`;
}

export async function replyBroken(invoice, complete) {
  return { ok: false, chatResponse: await complete("reply-broken", JSON.stringify(invoice)) };
}

export async function replyFixed(invoice) {
  return { ok: true, chatResponse: buildReply(invoice) };
}
