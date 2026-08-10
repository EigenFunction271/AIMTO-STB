export const DEMO_MESSAGE =
  "Hi kak, nak order 2 kek coklat, kaya puff, and 1 kek lapis. Kaya puff tu jangan letak gula lebih ya. Nak collect esok petang 😊";

export const MENU = Object.freeze([
  { id: "C1", name: "Kek Coklat", priceRm: 45, unitLabel: "each" },
  { id: "K1", name: "Kaya Puff", priceRm: 12, unitLabel: "half-dozen (6 pcs)" },
  { id: "P1", name: "Karipap Pedas", priceRm: 10, unitLabel: "half-dozen (6 pcs)" },
  { id: "L1", name: "Kek Lapis", priceRm: 60, unitLabel: "each" },
  { id: "R1", name: "Roti Kaya loaf", priceRm: 15, unitLabel: "each" },
]);

export const DEMO_ORDER = Object.freeze({
  items: [
    { menuId: "C1", units: 2 },
    { menuId: "K1", units: 1 },
    { menuId: "L1", units: 1 },
  ],
  notes: [{ menuId: "K1", text: "jangan letak gula lebih" }],
  fulfilment: { method: "pickup", requestedTime: "esok petang" },
});

const schema = `Return only JSON in this exact shape:
{"items":[{"menuId":"C1","units":1}],"notes":[{"menuId":"C1","text":"..."}],"fulfilment":{"method":"pickup|delivery|unknown","requestedTime":"customer's words or null"}}
Use selling units: K1 and P1 are priced per half-dozen, so half a dozen is 1 unit.
Business rule: if an item is named without a quantity, use 1 selling unit. Never invent a piece count or other missing facts.`;

export const PROMPTS = Object.freeze({
  "extract-broken": (input) => `Extract this bakery order: ${input}`,
  "extract-fixed": (input) => `${schema}

Menu:
${MENU.map((item) => `${item.id}: ${item.name}, RM${item.priceRm} per ${item.unitLabel}`).join("\n")}

Examples:
Message: nak kaya puff, collect petang
JSON: {"items":[{"menuId":"K1","units":1}],"notes":[],"fulfilment":{"method":"pickup","requestedTime":"petang"}}
Message: dua kek coklat, kurang manis ya
JSON: {"items":[{"menuId":"C1","units":2}],"notes":[{"menuId":"C1","text":"kurang manis"}],"fulfilment":{"method":"unknown","requestedTime":null}}

Message: ${input}`,
  "price-broken": (input) => `Match this order to the menu and calculate its total. Reply briefly.\nMenu: ${JSON.stringify(MENU)}\nOrder: ${input}`,
  "reply-broken": (input) => `Write a friendly customer confirmation for this bakery order. Make it sound complete and helpful.\nOrder: ${input}`,
});

export const FIXTURE_MODEL_OUTPUTS = Object.freeze({
  "extract-broken": `Here's the extracted bakery order:

- **Items Ordered:**
  - 2 Kek Coklat
  - 1 Kaya Puff (without extra sugar)
  - 1 Kek Lapis

- **Collection Time:** Tomorrow afternoon

Let me know if you need anything else!`,
  "extract-fixed": JSON.stringify(DEMO_ORDER),
  "price-broken": "Your order total is RM159.",
  "reply-broken": "Thanks! Your order will be delivered tomorrow at 5pm 🚚",
});

export async function completeFixture(operation) {
  if (!Object.hasOwn(FIXTURE_MODEL_OUTPUTS, operation)) throw new Error(`Unknown fixture operation: ${operation}`);
  return FIXTURE_MODEL_OUTPUTS[operation];
}

export function formatCustomerConversation(history) {
  const turns = history
    .filter((message) => message?.role === "customer" && typeof message.content === "string" && message.content.trim())
    .map((message) => message.content.trim());
  if (turns.length === 0) throw new Error("The conversation has no customer message.");
  return `These customer messages describe one order in chronological order.
Later customer messages correct or update earlier ones; use the latest stated value when they conflict.

${turns.map((message, index) => `Customer turn ${index + 1}${index === turns.length - 1 ? " (latest)" : ""}:\n${message}`).join("\n\n")}`;
}

// This is the live editing surface: repair one reference, then rerun the same chat.
export const PIPELINE = Object.freeze({
  extract: extractBroken,
  price: priceBroken,
  invoice: invoiceBroken,
  reply: replyBroken,
});

export function parseModelJson(text) {
  if (typeof text !== "string" || !text.trim()) throw new Error("The model returned no output.");
  const unfenced = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(unfenced);
  } catch {
    const start = unfenced.indexOf("{");
    const end = unfenced.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(unfenced.slice(start, end + 1));
      } catch {
        // Fall through to the stable user-facing error.
      }
    }
    throw new Error("The model output was not valid JSON.");
  }
}

export function validateOrder(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Order must be an object.");
  if (!Array.isArray(value.items) || value.items.length === 0) throw new Error("Order must contain at least one item.");

  const menuIds = new Set(MENU.map((item) => item.id));
  const items = value.items.map((item, index) => {
    if (!item || typeof item !== "object" || !menuIds.has(item.menuId)) {
      throw new Error(`Item ${index + 1} has an unknown menu ID.`);
    }
    if (!Number.isInteger(item.units) || item.units < 1 || item.units > 99) {
      throw new Error(`Item ${index + 1} units must be an integer from 1 to 99.`);
    }
    return { menuId: item.menuId, units: item.units };
  });

  if (!Array.isArray(value.notes)) throw new Error("Notes must be an array.");
  const orderedIds = new Set(items.map((item) => item.menuId));
  const notes = value.notes.map((note, index) => {
    if (!note || typeof note !== "object" || !orderedIds.has(note.menuId)) {
      throw new Error(`Note ${index + 1} must refer to an ordered item.`);
    }
    if (typeof note.text !== "string" || !note.text.trim() || note.text.length > 500) {
      throw new Error(`Note ${index + 1} must contain text.`);
    }
    return { menuId: note.menuId, text: note.text.trim() };
  });

  const fulfilment = value.fulfilment;
  if (!fulfilment || typeof fulfilment !== "object" || Array.isArray(fulfilment)) {
    throw new Error("Fulfilment must be an object.");
  }
  if (!["pickup", "delivery", "unknown"].includes(fulfilment.method)) {
    throw new Error("Fulfilment method is invalid.");
  }
  if (fulfilment.requestedTime !== null && typeof fulfilment.requestedTime !== "string") {
    throw new Error("Requested time must be text or null.");
  }

  return {
    items,
    notes,
    fulfilment: {
      method: fulfilment.method,
      requestedTime: typeof fulfilment.requestedTime === "string" ? fulfilment.requestedTime.trim() || null : null,
    },
  };
}

export function priceOrder(order) {
  const valid = validateOrder(order);
  const lines = valid.items.map(({ menuId, units }) => {
    const menuItem = MENU.find((item) => item.id === menuId);
    const subtotalRm = menuItem.priceRm * units;
    return { menuId, name: menuItem.name, units, unitLabel: menuItem.unitLabel, unitPriceRm: menuItem.priceRm, subtotalRm };
  });
  return { ...valid, lines, totalRm: lines.reduce((total, line) => total + line.subtotalRm, 0) };
}

export function buildInvoice(pricedOrder) {
  if (!pricedOrder || !Array.isArray(pricedOrder.lines) || !Number.isFinite(pricedOrder.totalRm)) {
    throw new Error("A priced order is required.");
  }
  return {
    lines: pricedOrder.lines.map((line) => ({ ...line })),
    totalRm: pricedOrder.totalRm,
    notes: pricedOrder.notes.map((note) => ({ ...note })),
    fulfilment: { ...pricedOrder.fulfilment },
  };
}

export function buildReply(invoice) {
  const lines = invoice.lines.map((line) => `- ${line.units} × ${line.name}${line.unitLabel === "each" ? "" : `, ${line.unitLabel}`}: RM${line.subtotalRm}`).join("\n");
  const notes = invoice.notes.length ? `\n${invoice.notes.length === 1 ? "Note" : "Notes"}: ${invoice.notes.map((note) => note.text).join("; ")}` : "";
  const fulfilment = invoice.fulfilment.method === "unknown"
    ? "Fulfilment details still need confirmation."
    : `${invoice.fulfilment.method === "pickup" ? "Pickup" : "Delivery"} requested${invoice.fulfilment.requestedTime ? `: ${invoice.fulfilment.requestedTime}` : "."}`;
  return `Hi! We received your order request:\n${lines}\nTotal: RM${invoice.totalRm}${notes}\n${fulfilment}\nKak Nor will confirm availability and details.`;
}

export async function extractBroken(message, complete) {
  const chatResponse = await complete("extract-broken", message);
  try {
    return { ok: true, value: validateOrder(parseModelJson(chatResponse)), chatResponse };
  } catch {
    return { ok: false, chatResponse };
  }
}

export async function extractFixed(message, complete) {
  const output = await complete("extract-fixed", message);
  return { ok: true, value: validateOrder(parseModelJson(output)) };
}

export async function priceBroken(order, complete) {
  return { ok: false, chatResponse: await complete("price-broken", JSON.stringify(order)) };
}

export async function priceFixed(order) {
  return { ok: true, value: priceOrder(order) };
}

export async function invoiceBroken(pricedOrder) {
  return { ok: false, chatResponse: `Order received.\nTotal: RM${pricedOrder.totalRm}` };
}

export async function invoiceFixed(pricedOrder) {
  return { ok: true, value: buildInvoice(pricedOrder) };
}

export async function replyBroken(invoice, complete) {
  return { ok: false, chatResponse: await complete("reply-broken", JSON.stringify(invoice)) };
}

export async function replyFixed(invoice) {
  return { ok: true, chatResponse: buildReply(invoice) };
}

export async function runOrderBotWith(pipeline, message, complete) {
  const report = {
    status: "running",
    stage: "extract",
    order: null,
    invoice: null,
    events: [],
  };
  const extracted = await pipeline.extract(message, complete);
  if (!extracted.ok) {
    report.status = "stopped";
    report.events.push(
      "Extraction output did not match the order contract.",
      "The order was not saved.",
      "Pricing and invoice creation did not start.",
    );
    return { chatResponse: extracted.chatResponse, report };
  }
  report.order = extracted.value;
  report.events.push("The order was validated and saved.");

  report.stage = "price";
  const priced = await pipeline.price(extracted.value, complete);
  if (!priced.ok) {
    report.status = "stopped";
    report.events.push(
      "Pricing stopped before a trusted total was created.",
      "Invoice creation did not start.",
    );
    return { chatResponse: priced.chatResponse, report };
  }
  report.order = priced.value;
  report.events.push(`Pricing completed in code: RM${priced.value.totalRm}.`);

  report.stage = "invoice";
  const invoice = await pipeline.invoice(priced.value);
  if (!invoice.ok) {
    report.status = "stopped";
    report.events.push("The invoice was not saved because the handoff dropped required order details.");
    return { chatResponse: invoice.chatResponse, report };
  }
  report.invoice = invoice.value;
  report.events.push("The invoice was created from the validated order.");

  report.stage = "reply";
  const reply = await pipeline.reply(invoice.value, complete);
  if (!reply.ok) {
    report.status = "stopped";
    report.events.push("The customer reply came from the model and may contain unsupported promises.");
    return { chatResponse: reply.chatResponse, report };
  }

  report.status = "complete";
  report.stage = "complete";
  report.events.push("The customer reply was built from validated invoice facts.");
  return { chatResponse: reply.chatResponse, report };
}

export function runOrderBot(message, complete = completeFixture) {
  return runOrderBotWith(PIPELINE, message, complete);
}
