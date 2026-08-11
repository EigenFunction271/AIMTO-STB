// START HERE: this is the only file participants edit during the workshop.
import { extractBroken, UNDERSTANDING_BROKEN_PROMPTS } from "./workflow/broken/01-understanding.js";
import { priceBroken, MONEY_BROKEN_PROMPTS } from "./workflow/broken/02-money.js";
import { invoiceBroken } from "./workflow/broken/03-handoff.js";
import { replyBroken, PROMISE_BROKEN_PROMPTS } from "./workflow/broken/04-promise.js";
import { extractFixed, UNDERSTANDING_ANSWER_PROMPTS } from "./workflow/answers/01-understanding.js";
import { priceFixed, priceOrder } from "./workflow/answers/02-money.js";
import { buildInvoice, invoiceFixed } from "./workflow/answers/03-handoff.js";
import { buildReply, replyFixed } from "./workflow/answers/04-promise.js";
import { DEMO_MESSAGE, DEMO_ORDER, MENU, formatCustomerConversation, parseModelJson, validateOrder } from "./workflow/order.js";
import { runOrderBotWith } from "./workflow/pipeline.js";

// The local server uses these prompt builders for the supported operations.
export const PROMPTS = Object.freeze({
  ...UNDERSTANDING_BROKEN_PROMPTS,
  ...MONEY_BROKEN_PROMPTS,
  ...PROMISE_BROKEN_PROMPTS,
  ...UNDERSTANDING_ANSWER_PROMPTS,
});

// Switch one line from Broken to Fixed, then rerun the same customer message.
export const PIPELINE = Object.freeze({
  extract: extractFixed, // Answer: extractFixed
  price: priceBroken,     // Answer: priceFixed
  invoice: invoiceBroken, // Answer: invoiceFixed
  reply: replyBroken,     // Answer: replyFixed
});

// The caller must choose a model source before the workflow starts.
export function runOrderBot(message, complete) {
  if (typeof complete !== "function") {
    throw new TypeError("runOrderBot requires completeFromLive or completeFromFixture.");
  }
  return runOrderBotWith(PIPELINE, message, complete);
}

// Stable exports keep the app, server, existing tests, and workshop snippets working.
export {
  DEMO_MESSAGE,
  DEMO_ORDER,
  MENU,
  buildInvoice,
  buildReply,
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
