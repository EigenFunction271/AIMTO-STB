import { MENU, validateOrder } from "../order.js";

/**
 * CHECKPOINT 2: MONEY — REFERENCE ANSWER
 * Input: validated order. Source: MENU and validateOrder in ../order.js.
 * Output: trusted item lines and a total calculated in code.
 * Compare: ../broken/02-money.js
 * Safety: menu lookup and arithmetic are deterministic; no model is used.
 */
export function priceOrder(order) {
  const valid = validateOrder(order);
  const lines = valid.items.map(({ menuId, units }) => {
    const menuItem = MENU.find((item) => item.id === menuId);
    const subtotalRm = menuItem.priceRm * units;
    return { menuId, name: menuItem.name, units, unitLabel: menuItem.unitLabel, unitPriceRm: menuItem.priceRm, subtotalRm };
  });
  return { ...valid, lines, totalRm: lines.reduce((total, line) => total + line.subtotalRm, 0) };
}

export async function priceFixed(order) {
  return { ok: true, value: priceOrder(order) };
}
