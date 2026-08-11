/**
 * CHECKPOINT 4: PROMISE — BROKEN
 * Input: trusted invoice. Source: selected live or fixture completion function.
 * Output: untrusted customer-facing model text; the pipeline stops.
 * Compare: ../answers/04-promise.js
 * Risk: a helpful-sounding model may invent delivery details or other promises.
 */
export const PROMISE_BROKEN_PROMPTS = Object.freeze({
  "reply-broken": (input) => `Write a friendly customer confirmation for this bakery order. Make it sound complete and helpful.\nOrder: ${input}`,
});

export async function replyBroken(invoice, complete) {
  return { ok: false, chatResponse: await complete("reply-broken", JSON.stringify(invoice)) };
}
