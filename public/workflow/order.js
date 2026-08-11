// SHARED BUSINESS RULES
// Both broken/ and answers/ import this menu and validator so they compare the same facts.
// This file does not call a live model or a fixture.

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

export function formatCustomerConversation(history) {
  // Only customer messages are trusted as order facts. Assistant text may be wrong.
  const turns = history
    .filter((message) => message?.role === "customer" && typeof message.content === "string" && message.content.trim())
    .map((message) => message.content.trim());
  if (turns.length === 0) throw new Error("The conversation has no customer message.");
  return `These customer messages describe one order in chronological order.
Later customer messages correct or update earlier ones; use the latest stated value when they conflict.

${turns.map((message, index) => `Customer turn ${index + 1}${index === turns.length - 1 ? " (latest)" : ""}:\n${message}`).join("\n\n")}`;
}

export function parseModelJson(text) {
  // Model output is untrusted input. Accept a JSON fence, but never accept invalid JSON.
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
        // Fall through to one stable error that the interface can explain.
      }
    }
    throw new Error("The model output was not valid JSON.");
  }
}

export function validateOrder(value) {
  // This is the trust boundary: downstream stages receive only this cleaned shape.
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
