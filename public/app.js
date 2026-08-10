import { DEMO_MESSAGE, completeFixture, runOrderBot } from "./workflow.js";

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
  message: $("#customer-message"),
  customerResponse: $("#customer-response"),
  run: $("#run-workflow"),
  runLabel: $("#run-workflow span:first-child"),
  reset: $("#reset-chat"),
  status: $("#run-status"),
  botMessage: $("#bot-message"),
  botResponse: $("#bot-response"),
  typing: $("#typing-indicator"),
};

const state = {
  source: "fixture",
  provider: "openai",
  apiKey: "",
  running: false,
  model: "",
};

elements.message.value = DEMO_MESSAGE;
if (elements.customerResponse) elements.customerResponse.textContent = DEMO_MESSAGE;
renderSettings();
resetChat();

elements.settingsTrigger.addEventListener("click", () => elements.settingsDialog.showModal());
elements.settingsClose.addEventListener("click", () => elements.settingsDialog.close());
elements.settingsDialog.addEventListener("close", () => elements.settingsTrigger.focus());

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
    ? "Your key stays in browser memory, goes only to this local server, and disappears on refresh."
    : "Fixture mode is deterministic and works without Wi-Fi.";
  renderModel();
}

function renderModel() {
  if (!elements.modelLabel) return;
  elements.modelLabel.textContent = state.source === "fixture"
    ? "Model: deterministic fixture"
    : state.model
      ? `Model: ${state.model}`
      : "Model: selected by local server";
}

function resetChat() {
  elements.message.value = DEMO_MESSAGE;
  if (elements.customerResponse) elements.customerResponse.textContent = DEMO_MESSAGE;
  elements.botResponse.textContent = "Ready when you are.";
  elements.botResponse.hidden = false;
  elements.botMessage.hidden = false;
  elements.botMessage.dataset.state = "idle";
  elements.typing.hidden = true;
  elements.runLabel.textContent = "Run bot";
  setStatus("Ready");
  elements.message.focus();
}

async function runBot() {
  if (state.running) return;
  const message = elements.message.value.trim();
  if (!message) {
    elements.botMessage.dataset.state = "error";
    elements.botResponse.textContent = "Please add a customer message first.";
    elements.botResponse.hidden = false;
    setStatus("Error", "error");
    elements.message.focus();
    return;
  }
  if (state.source === "live" && !state.apiKey.trim()) {
    elements.botMessage.dataset.state = "error";
    elements.botResponse.textContent = "Add an API key in Settings to use Live API.";
    elements.botResponse.hidden = false;
    setStatus("Error", "error");
    elements.settingsDialog.showModal();
    elements.apiKey.focus();
    return;
  }

  state.running = true;
  elements.run.disabled = true;
  elements.run.setAttribute("aria-busy", "true");
  elements.botMessage.hidden = false;
  elements.botMessage.dataset.state = "running";
  elements.botResponse.hidden = true;
  elements.typing.hidden = false;
  if (elements.customerResponse) elements.customerResponse.textContent = message;
  setStatus("Running");

  try {
    const complete = state.source === "fixture" ? completeFixture : completeLive;
    const response = await runOrderBot(message, complete);
    elements.botResponse.textContent = response;
    elements.botResponse.hidden = false;
    elements.runLabel.textContent = "Run again";
    const recovered = isRecovered(response);
    elements.botMessage.dataset.state = recovered ? "success" : "response";
    setStatus(recovered ? "Recovered" : "Ready", recovered ? "success" : "");
  } catch (error) {
    elements.botResponse.textContent = `Sorry, the bot could not run. ${safeError(error)}`;
    elements.botResponse.hidden = false;
    elements.botMessage.dataset.state = "error";
    setStatus("Error", "error");
  } finally {
    state.running = false;
    elements.run.disabled = false;
    elements.run.removeAttribute("aria-busy");
    elements.typing.hidden = true;
  }
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

function isRecovered(response) {
  return response.includes("RM162")
    && response.includes("jangan letak gula lebih")
    && response.includes("Pickup requested: esok petang")
    && !/deliver(?:y|ed)?|5pm/i.test(response);
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
