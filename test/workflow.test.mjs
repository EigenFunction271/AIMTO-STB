import test from "node:test";
import assert from "node:assert/strict";
import {
  DEMO_MESSAGE,
  DEMO_ORDER,
  completeFixture,
  extractBroken,
  extractFixed,
  invoiceBroken,
  invoiceFixed,
  priceBroken,
  priceFixed,
  replyBroken,
  replyFixed,
  runOrderBotWith,
  validateOrder,
} from "../public/workflow.js";

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

  for (const [index, pipeline] of pipelines.entries()) {
    assert.equal(await runOrderBotWith(pipeline, DEMO_MESSAGE, completeFixture), expectedReplies[index]);
  }
});

test("the first broken stage stops later work", async () => {
  const operations = [];
  const complete = async (operation, input) => {
    operations.push(operation);
    return completeFixture(operation, input);
  };

  const reply = await runOrderBotWith(
    { extract: extractFixed, price: priceFixed, invoice: invoiceFixed, reply: replyFixed },
    DEMO_MESSAGE,
    complete,
  );

  assert.deepEqual(operations, ["extract-fixed"]);
  assert.match(reply, /Total: RM162/);
  assert.match(reply, /jangan letak gula lebih/);
  assert.match(reply, /Pickup requested: esok petang/);
  assert.doesNotMatch(reply, /deliver(?:y|ed)?/i);
  assert.doesNotMatch(reply, /5pm/i);
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
