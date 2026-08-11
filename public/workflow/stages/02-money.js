import { MENU, validateOrder } from "../order.js";

/*
Checkpoint question: Is the total exactly supported by the menu?
Input: a validated order.
Trusted output: priced lines and a total calculated in code.
Broken risk: an AI response can sound confident while doing the arithmetic incorrectly.
Fixed safety: code looks up menu prices and performs the same calculation every time.
*/

export const MONEY_PROMPTS = Object.freeze({
  "price-broken": (input) => `Match this order to the menu and calculate its total. Reply briefly.\nMenu: ${JSON.stringify(MENU)}\nOrder: ${input}`,
});

export function priceOrder(order) {
  const valid = validateOrder(order);
  const lines = valid.items.map(({ menuId, units }) => {
    const menuItem = MENU.find((item) => item.id === menuId);
    const subtotalRm = menuItem.priceRm * units;
    return { menuId, name: menuItem.name, units, unitLabel: menuItem.unitLabel, unitPriceRm: menuItem.priceRm, subtotalRm };
  });
  return { ...valid, lines, totalRm: lines.reduce((total, line) => total + line.subtotalRm, 0) };
}

export async function priceBroken(order, complete) {
  return { ok: false, chatResponse: await complete("price-broken", JSON.stringify(order)) };
}

export async function priceFixed(order) {
  return { ok: true, value: priceOrder(order) };
}
