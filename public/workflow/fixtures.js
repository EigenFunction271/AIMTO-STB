import { DEMO_ORDER } from "./order.js";

// Fixtures are predictable model replies for workshops without network access.
// They cross the same parsing and validation boundary as a live AI response.
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

// `operation` names the requested model task; the returned value always mimics text from a model.
export async function completeFixture(operation) {
  if (!Object.hasOwn(FIXTURE_MODEL_OUTPUTS, operation)) throw new Error(`Unknown fixture operation: ${operation}`);
  return FIXTURE_MODEL_OUTPUTS[operation];
}
