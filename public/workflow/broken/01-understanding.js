import { parseModelJson, validateOrder } from "../order.js";

/**
 * CHECKPOINT 1: UNDERSTANDING — BROKEN
 * Input: customer text. Source: selected live or fixture completion function.
 * Output: validated order, or raw model text when validation fails.
 * Compare: ../answers/01-understanding.js
 * Risk: the vague prompt does not define the response shape or selling-unit rules.
 */
export const UNDERSTANDING_BROKEN_PROMPTS = Object.freeze({
  "extract-broken": (input) => `Extract this bakery order: ${input}`,
});

export async function extractBroken(message, complete) {
  const chatResponse = await complete("extract-broken", message);
  try {
    return { ok: true, value: validateOrder(parseModelJson(chatResponse)), chatResponse };
  } catch {
    return { ok: false, chatResponse };
  }
}
