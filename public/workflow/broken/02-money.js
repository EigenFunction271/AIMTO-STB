import { MENU } from "../order.js";

/**
 * CHECKPOINT 2: MONEY — BROKEN
 * Input: validated order. Source: selected live or fixture completion function.
 * Output: untrusted pricing text; the pipeline stops.
 * Compare: ../answers/02-money.js
 * Risk: the model is asked to do arithmetic and may return a confident wrong total.
 */
export const MONEY_BROKEN_PROMPTS = Object.freeze({
  "price-broken": (input) => `Match this order to the menu and calculate its total. Reply briefly.\nMenu: ${JSON.stringify(MENU)}\nOrder: ${input}`,
});

export async function priceBroken(order, complete) {
  return { ok: false, chatResponse: await complete("price-broken", JSON.stringify(order)) };
}
