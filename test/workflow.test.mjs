import test from "node:test";
import assert from "node:assert/strict";
import {
  DEMO_MESSAGE,
  DEMO_ORDER,
  completeFixture,
  extractBroken,
  extractFixed,
  formatCustomerConversation,
  invoiceBroken,
  invoiceFixed,
  priceBroken,
  priceFixed,
  replyBroken,
  replyFixed,
  runOrderBotWith,
  validateOrder,
} from "../public/workflow.js";

test("customer corrections stay ordered and assistant output is never order truth", () => {
  const conversation = formatCustomerConversation([
    { role: "customer", content: "Nak 2 kek coklat." },
    { role: "assistant", content: "Confirmed 4 kek coklat." },
    { role: "customer", content: "Correction: make that 3 kek coklat." },
  ]);

  assert.match(conversation, /Later customer messages correct or update earlier ones/);
  assert.ok(conversation.indexOf("Nak 2 kek coklat") < conversation.indexOf("make that 3 kek coklat"));
  assert.doesNotMatch(conversation, /Confirmed 4 kek coklat/);
});

const expectedReplies = [
  `Here's the extracted bakery order:

- **Items Ordered:**
  - 2 Kek Coklat
  - 1 Kaya Puff (without extra sugar)
  - 1 Kek Lapis

- **Collection Time:** Tomorrow afternoon

Let me know if you need anything else!`,
  "Your order total is RM159.",
  "Order received.\nTotal: RM162",
  "Thanks! Your order will be delivered tomorrow at 5pm 🚚",
  `Hi! We received your order request:
- 2 × Kek Coklat: RM90
- 1 × Kaya Puff, half-dozen (6 pcs): RM12
- 1 × Kek Lapis: RM60
Total: RM162
Note: jangan letak gula lebih
Pickup requested: esok petang
Kak Nor will confirm availability and details.`,
];

test("each repair exposes exactly the next failure", async () => {
  const pipelines = [
    { extract: extractBroken, price: priceBroken, invoice: invoiceBroken, reply: replyBroken },
    { extract: extractFixed, price: priceBroken, invoice: invoiceBroken, reply: replyBroken },
    { extract: extractFixed, price: priceFixed, invoice: invoiceBroken, reply: replyBroken },
    { extract: extractFixed, price: priceFixed, invoice: invoiceFixed, reply: replyBroken },
    { extract: extractFixed, price: priceFixed, invoice: invoiceFixed, reply: replyFixed },
  ];

  const expectedReports = [
    { status: "stopped", stage: "extract", order: false, invoice: false },
    { status: "stopped", stage: "price", order: true, invoice: false },
    { status: "stopped", stage: "invoice", order: true, invoice: false },
    { status: "stopped", stage: "reply", order: true, invoice: true },
    { status: "complete", stage: "complete", order: true, invoice: true },
  ];

  for (const [index, pipeline] of pipelines.entries()) {
    const result = await runOrderBotWith(pipeline, DEMO_MESSAGE, completeFixture);
    assert.equal(result.chatResponse, expectedReplies[index]);
    assert.equal(result.report.status, expectedReports[index].status);
    assert.equal(result.report.stage, expectedReports[index].stage);
    assert.equal(Boolean(result.report.order), expectedReports[index].order);
    assert.equal(Boolean(result.report.invoice), expectedReports[index].invoice);
  }
});

test("broken extraction shows the raw reply but rejects it as order data", async () => {
  const operations = [];
  const complete = async (operation, input) => {
    operations.push(operation);
    return completeFixture(operation, input);
  };
  const result = await runOrderBotWith(
    { extract: extractBroken, price: priceBroken, invoice: invoiceBroken, reply: replyBroken },
    DEMO_MESSAGE,
    complete,
  );

  assert.deepEqual(operations, ["extract-broken"]);
  assert.equal(result.chatResponse, expectedReplies[0]);
  assert.equal(result.report.status, "stopped");
  assert.equal(result.report.stage, "extract");
  assert.equal(result.report.order, null);
  assert.equal(result.report.invoice, null);
  assert.deepEqual(result.report.events, [
    "Extraction output did not match the order contract.",
    "The order was not saved.",
    "Pricing and invoice creation did not start.",
  ]);
});

test("the fixed workflow keeps validated facts and only calls extraction AI", async () => {
  const operations = [];
  const complete = async (operation, input) => {
    operations.push(operation);
    return completeFixture(operation, input);
  };

  const result = await runOrderBotWith(
    { extract: extractFixed, price: priceFixed, invoice: invoiceFixed, reply: replyFixed },
    DEMO_MESSAGE,
    complete,
  );

  assert.deepEqual(operations, ["extract-fixed"]);
  assert.equal(result.report.status, "complete");
  assert.equal(result.report.order.totalRm, 162);
  assert.equal(result.report.invoice.totalRm, 162);
  assert.match(result.chatResponse, /Total: RM162/);
  assert.match(result.chatResponse, /jangan letak gula lebih/);
  assert.match(result.chatResponse, /Pickup requested: esok petang/);
  assert.doesNotMatch(result.chatResponse, /deliver(?:y|ed)?/i);
  assert.doesNotMatch(result.chatResponse, /5pm/i);
});

test("an unnumbered Kaya Puff exposes guessing but the fixed contract applies one selling unit", async () => {
  assert.match(DEMO_MESSAGE, /2 kek coklat, kaya puff, and 1 kek lapis/i);
  assert.doesNotMatch(DEMO_MESSAGE, /(?:1|6) kaya puff|half[- ]dozen/i);

  const broken = await extractBroken(DEMO_MESSAGE, completeFixture);
  assert.match(broken.chatResponse, /1 Kaya Puff/);

  const fixed = await extractFixed(DEMO_MESSAGE, completeFixture);
  assert.deepEqual(fixed.value.items.find((item) => item.menuId === "K1"), { menuId: "K1", units: 1 });
});

test("validation rejects unknown IDs and invalid selling units", () => {
  assert.throws(
    () => validateOrder({ ...DEMO_ORDER, items: [{ menuId: "NOPE", units: 1 }] }),
    /unknown menu ID/,
  );
  assert.throws(
    () => validateOrder({ ...DEMO_ORDER, items: [{ menuId: "K1", units: 6.5 }] }),
    /integer from 1 to 99/,
  );
});
