import { MENU, parseModelJson, validateOrder } from "../order.js";

/**
 * CHECKPOINT 1: UNDERSTANDING — REFERENCE ANSWER
 * Input: customer text. Source: selected live or fixture completion function.
 * Output: an order that must pass the shared validator.
 * Compare: ../broken/01-understanding.js
 * Safety: the prompt defines the contract and code rejects anything outside it.
 */
export const EXTRACTION_SCHEMA = `Return only JSON in this exact shape:
{"items":[{"menuId":"C1","units":1}],"notes":[{"menuId":"C1","text":"..."}],"fulfilment":{"method":"pickup|delivery|unknown","requestedTime":"customer's words or null"}}
Use selling units: K1 and P1 are priced per half-dozen, so half a dozen is 1 unit.
Business rule: if an item is named without a quantity, use 1 selling unit. Never invent a piece count or other missing facts.`;

export const UNDERSTANDING_ANSWER_PROMPTS = Object.freeze({
  "extract-fixed": (input) => `${EXTRACTION_SCHEMA}

Menu:
${MENU.map((item) => `${item.id}: ${item.name}, RM${item.priceRm} per ${item.unitLabel}`).join("\n")}

Examples:
Message: nak kaya puff, collect petang
JSON: {"items":[{"menuId":"K1","units":1}],"notes":[],"fulfilment":{"method":"pickup","requestedTime":"petang"}}
Message: dua kek coklat, kurang manis ya
JSON: {"items":[{"menuId":"C1","units":2}],"notes":[{"menuId":"C1","text":"kurang manis"}],"fulfilment":{"method":"unknown","requestedTime":null}}

Message: ${input}`,
});

export async function extractFixed(message, complete) {
  const output = await complete("extract-fixed", message);
  return { ok: true, value: validateOrder(parseModelJson(output)) };
}
