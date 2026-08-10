import { DEMO_MESSAGE, MENU, completeFixture, formatCustomerConversation, runOrderBot } from "./workflow.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  settingsTrigger: $("#settings-trigger"),
  settingsDialog: $("#settings-dialog"),
  settingsClose: $("#settings-close"),
  source: $$('input[name="source"]'),
  provider: $("#provider"),
  apiKey: $("#api-key"),
  clearKey: $("#clear-key"),
  keyNote: $("#key-note"),
  modelLabel: $("#model-label"),
  form: $("#chat-form"),
  conversation: $(".conversation"),
  tabs: $$('[role="tab"][data-view]'),
  chatView: $("#chat-view"),
  dashboardView: $("#dashboard-view"),
  currentOrder: $("#current-order"),
  invoice: $("#invoice"),
  runHistory: $("#run-history"),
  message: $("#customer-message"),
  run: $("#run-workflow"),
  runLabel: $("#run-workflow span:first-child"),
  reset: $("#reset-chat"),
  status: $("#run-status"),
};

const state = {
  source: "fixture",
  provider: "openai",
  apiKey: "",
  running: false,
  model: "",
  history: [],
  reports: [],
  view: "chat",
};

renderSettings();
resetChat();

elements.settingsTrigger.addEventListener("click", () => elements.settingsDialog.showModal());
elements.settingsClose.addEventListener("click", () => elements.settingsDialog.close());
elements.settingsDialog.addEventListener("close", () => elements.settingsTrigger.focus());

for (const tab of elements.tabs) {
  tab.addEventListener("click", () => setView(tab.dataset.view));
  tab.addEventListener("keydown", (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "ArrowRight" ? 1 : -1;
    const index = elements.tabs.indexOf(tab);
    const target = elements.tabs[(index + next + elements.tabs.length) % elements.tabs.length];
    setView(target.dataset.view);
    target.focus();
  });
}

for (const input of elements.source) {
  input.addEventListener("change", () => {
    state.source = input.value;
    state.model = "";
    renderSettings();
  });
}

elements.provider.addEventListener("change", () => {
  state.provider = elements.provider.value;
  state.model = "";
  renderModel();
});

elements.apiKey.addEventListener("input", () => {
  state.apiKey = elements.apiKey.value;
  elements.clearKey.disabled = !state.apiKey;
});

elements.clearKey.addEventListener("click", () => {
  state.apiKey = "";
  elements.apiKey.value = "";
  elements.clearKey.disabled = true;
  elements.apiKey.focus();
});

elements.reset.addEventListener("click", resetChat);
elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  runBot();
});
elements.message.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    elements.form.requestSubmit();
  }
});

function renderSettings() {
  const live = state.source === "live";
  elements.provider.disabled = !live;
  elements.apiKey.disabled = !live;
  elements.apiKey.placeholder = live ? "Paste provider API key" : "No key needed";
  elements.clearKey.disabled = !live || !state.apiKey;
  elements.keyNote.textContent = live
    ? "Live API handles arbitrary follow-ups. Your key stays in browser memory and disappears on refresh."
    : "Scripted fixture replays the demo failures. Use Live API for arbitrary follow-ups.";
  renderModel();
}

function renderModel() {
  if (!elements.modelLabel) return;
  elements.modelLabel.textContent = state.source === "fixture"
    ? "Scripted fixture · demo responses"
    : state.model
      ? `Model: ${state.model}`
      : "Model: selected by local server";
}

function resetChat() {
  state.history = [];
  state.reports = [];
  elements.conversation.replaceChildren();
  elements.message.value = DEMO_MESSAGE;
  elements.runLabel.textContent = "Run bot";
  renderDashboard();
  setStatus("Ready");
  if (state.view === "chat") elements.message.focus();
}

async function runBot() {
  if (state.running) return;
  const message = elements.message.value.trim();
  if (!message && !state.history.some((turn) => turn.role === "customer")) {
    setStatus("Error", "error");
    elements.message.focus();
    return;
  }
  if (state.source === "live" && !state.apiKey.trim()) {
    const warning = appendMessage("assistant", "Add an API key in Settings to use Live API.");
    warning.row.dataset.state = "error";
    setStatus("Error", "error");
    elements.settingsDialog.showModal();
    elements.apiKey.focus();
    return;
  }

  state.running = true;
  elements.run.disabled = true;
  elements.run.setAttribute("aria-busy", "true");
  if (message) {
    state.history.push({ role: "customer", content: message });
    appendMessage("customer", message);
  }
  elements.message.value = "";
  const pending = appendMessage("assistant", "", "running");
  setStatus("Running");

  try {
    const complete = state.source === "fixture" ? completeFixture : completeLive;
    const result = await runOrderBot(formatCustomerConversation(state.history), complete);
    finishMessage(pending, result.chatResponse);
    state.history.push({ role: "assistant", content: result.chatResponse });
    state.reports.push(result.report);
    renderDashboard();
    elements.runLabel.textContent = "Run again";
    const recovered = result.report.status === "complete";
    pending.row.dataset.state = recovered ? "success" : "response";
    setStatus(recovered ? "Recovered" : "Ready", recovered ? "success" : "");
  } catch (error) {
    const response = `Sorry, the bot could not run. ${safeError(error)}`;
    finishMessage(pending, response);
    state.history.push({ role: "assistant", content: response });
    state.reports.push({
      status: "error",
      stage: "unknown",
      order: null,
      invoice: null,
      events: ["The workflow could not finish. No order or invoice was saved."],
    });
    renderDashboard();
    pending.row.dataset.state = "error";
    setStatus("Error", "error");
  } finally {
    state.running = false;
    elements.run.disabled = false;
    elements.run.removeAttribute("aria-busy");
    elements.message.focus();
  }
}

function setView(view) {
  state.view = view;
  for (const tab of elements.tabs) {
    const selected = tab.dataset.view === view;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }
  elements.chatView.hidden = view !== "chat";
  elements.dashboardView.hidden = view !== "dashboard";
}

function renderDashboard() {
  const report = state.reports.at(-1);
  renderCurrentOrder(report);
  renderInvoice(report);
  elements.runHistory.replaceChildren();

  if (state.reports.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No bot run yet.";
    elements.runHistory.append(empty);
    return;
  }

  for (const [index, run] of state.reports.entries()) {
    const item = document.createElement("li");
    const heading = document.createElement("strong");
    const stage = run.stage === "complete" ? "completed" : `${run.status} at ${stageLabel(run.stage)}`;
    heading.textContent = `Run ${index + 1} · ${stage}`;
    const events = document.createElement("ul");
    for (const event of run.events) {
      const eventItem = document.createElement("li");
      eventItem.textContent = event;
      events.append(eventItem);
    }
    item.append(heading, events);
    elements.runHistory.append(item);
  }
}

function renderCurrentOrder(report) {
  elements.currentOrder.replaceChildren();
  if (!report?.order) {
    appendParagraph(
      elements.currentOrder,
      report?.stage === "extract"
        ? "The order was not saved because extraction did not pass validation."
        : "No order saved yet.",
      "dashboard-muted",
    );
    return;
  }

  const items = document.createElement("ul");
  for (const item of report.order.items) {
    const menuItem = MENU.find((entry) => entry.id === item.menuId);
    const line = document.createElement("li");
    line.textContent = `${item.units} × ${menuItem.name}${menuItem.unitLabel === "each" ? "" : ` · ${menuItem.unitLabel}`}`;
    items.append(line);
  }
  elements.currentOrder.append(items);
  for (const note of report.order.notes) appendParagraph(elements.currentOrder, `Note: ${note.text}`);
  const fulfilment = report.order.fulfilment;
  appendParagraph(
    elements.currentOrder,
    fulfilment.method === "unknown"
      ? "Fulfilment: not specified"
      : `${fulfilment.method === "pickup" ? "Pickup" : "Delivery"} requested${fulfilment.requestedTime ? `: ${fulfilment.requestedTime}` : ""}`,
  );
  if (Number.isFinite(report.order.totalRm)) {
    appendParagraph(elements.currentOrder, `Priced total: RM${report.order.totalRm}`, "dashboard-total");
  }
}

function renderInvoice(report) {
  elements.invoice.replaceChildren();
  if (!report?.invoice) {
    const message = Number.isFinite(report?.order?.totalRm)
      ? `Pricing finished at RM${report.order.totalRm}, but the invoice was not saved.`
      : report?.stage === "extract"
        ? "Invoice creation did not start."
        : report?.stage === "price"
          ? "Invoice creation did not start because pricing did not finish."
          : "No invoice created yet.";
    appendParagraph(elements.invoice, message, "dashboard-muted");
    return;
  }

  const lines = document.createElement("ul");
  for (const line of report.invoice.lines) {
    const item = document.createElement("li");
    item.textContent = `${line.units} × ${line.name}: RM${line.subtotalRm}`;
    lines.append(item);
  }
  elements.invoice.append(lines);
  for (const note of report.invoice.notes) appendParagraph(elements.invoice, `Note: ${note.text}`);
  const fulfilment = report.invoice.fulfilment;
  appendParagraph(
    elements.invoice,
    fulfilment.method === "unknown"
      ? "Fulfilment: not specified"
      : `${fulfilment.method === "pickup" ? "Pickup" : "Delivery"} requested${fulfilment.requestedTime ? `: ${fulfilment.requestedTime}` : ""}`,
  );
  appendParagraph(elements.invoice, `Total: RM${report.invoice.totalRm}`, "dashboard-total");
}

function appendParagraph(parent, text, className = "") {
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  if (className) paragraph.className = className;
  parent.append(paragraph);
}

function stageLabel(stage) {
  return ({ extract: "extraction", price: "pricing", invoice: "invoice", reply: "reply" })[stage] || "the workflow";
}

function appendMessage(role, content, status = "") {
  const row = document.createElement("div");
  row.className = `message-row ${role === "customer" ? "customer-row" : "bot-row"}`;
  if (status) row.dataset.state = status;

  const meta = document.createElement("div");
  meta.className = "message-meta";
  const name = document.createElement("span");
  name.textContent = role === "customer" ? "Customer" : "Kak Nor Bot";
  const detail = document.createElement("span");
  detail.textContent = role === "customer" ? "Now" : "Assistant";
  meta.append(name, detail);

  const bubble = document.createElement("div");
  bubble.className = `message-bubble ${role === "customer" ? "customer-bubble" : "bot-bubble"}`;
  const response = document.createElement("p");
  response.textContent = content;
  if (role === "assistant") response.setAttribute("aria-live", "polite");
  const typing = document.createElement("div");
  typing.className = "typing-indicator";
  typing.hidden = status !== "running";
  typing.setAttribute("aria-label", "Bot is responding");
  typing.append(document.createElement("span"), document.createElement("span"), document.createElement("span"));
  if (role === "assistant") bubble.append(typing, response);
  else bubble.append(response);
  row.append(meta, bubble);
  elements.conversation.append(row);
  row.scrollIntoView({ block: "nearest" });
  return { row, response, typing };
}

function finishMessage(message, content) {
  message.typing.hidden = true;
  message.response.textContent = content;
}

async function completeLive(operation, input) {
  const response = await fetch("/api/save-the-build", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      provider: state.provider,
      apiKey: state.apiKey,
      operation,
      input,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "The provider request failed.");
  if (typeof result.output !== "string") throw new Error("The provider returned an unexpected response.");
  if (typeof result.model === "string" && result.model.length <= 100) {
    state.model = result.model;
    renderModel();
  }
  return result.output;
}

function setStatus(message, kind = "") {
  elements.status.textContent = message;
  elements.status.classList.toggle("is-error", kind === "error");
  elements.status.classList.toggle("is-success", kind === "success");
}

function safeError(error) {
  const message = error instanceof Error && error.message
    ? error.message
    : "Please check the settings and try again.";
  return state.apiKey ? message.split(state.apiKey).join("[redacted]") : message;
}
