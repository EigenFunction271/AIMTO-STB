// Start here: this file is the workshop switchboard. The detailed work lives in workflow/.
import { DEMO_MESSAGE, DEMO_ORDER, MENU, formatCustomerConversation, parseModelJson, validateOrder } from "./workflow/order.js";
import { FIXTURE_MODEL_OUTPUTS, completeFixture } from "./workflow/fixtures.js";
import { runOrderBotWith } from "./workflow/pipeline.js";
import { UNDERSTANDING_PROMPTS, extractBroken, extractFixed } from "./workflow/stages/01-understanding.js";
import { MONEY_PROMPTS, priceBroken, priceFixed, priceOrder } from "./workflow/stages/02-money.js";
import { buildInvoice, invoiceBroken, invoiceFixed } from "./workflow/stages/03-handoff.js";
import { PROMISE_PROMPTS, buildReply, replyBroken, replyFixed } from "./workflow/stages/04-promise.js";

export const PROMPTS = Object.freeze({
  ...UNDERSTANDING_PROMPTS,
  ...MONEY_PROMPTS,
  ...PROMISE_PROMPTS,
});

// Change one `Broken` function to its matching `Fixed` function, then rerun the chat.
// This is the only place that selects which version of each stage is active.
export const PIPELINE = Object.freeze({
  extract: extractBroken,
  price: priceBroken,
  invoice: invoiceBroken,
  reply: replyBroken,
});

// Live AI and fixture mode both enter through `complete`; the pipeline itself stays the same.
export function runOrderBot(message, complete = completeFixture) {
  return runOrderBotWith(PIPELINE, message, complete);
}

// Keep one stable public entry point for the app, server, and tests.
export {
  DEMO_MESSAGE,
  DEMO_ORDER,
  MENU,
  FIXTURE_MODEL_OUTPUTS,
  buildInvoice,
  buildReply,
  completeFixture,
  extractBroken,
  extractFixed,
  formatCustomerConversation,
  invoiceBroken,
  invoiceFixed,
  parseModelJson,
  priceBroken,
  priceFixed,
  priceOrder,
  replyBroken,
  replyFixed,
  runOrderBotWith,
  validateOrder,
};
