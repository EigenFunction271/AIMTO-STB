import { DEMO_ORDER } from "../workflow/order.js";

/**
 * OFFLINE MODEL SOURCE
 * Returns saved example AI text for tests or workshops without provider access.
 * This is not a workflow stage and it is not the answer scheme.
 */
export const FIXTURE_MODEL_OUTPUTS = Object.freeze({
  "extract-broken": `Here's the extracted bakery order:

- 2 Kek Coklat
- 1 individual Kaya Puff (without extra sugar)
- 1 Kek Lapis

- Collection: Tomorrow afternoon

Let me know if you need anything else!`,
  "extract-fixed": JSON.stringify(DEMO_ORDER),
  "price-broken": "Your order total is RM159.",
  "reply-broken": "Thanks! Your order will be delivered tomorrow at 5pm 🚚",
});

export async function completeFromFixture(operation) {
  if (!Object.hasOwn(FIXTURE_MODEL_OUTPUTS, operation)) throw new Error(`Unknown fixture operation: ${operation}`);
  return FIXTURE_MODEL_OUTPUTS[operation];
}
