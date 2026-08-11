import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { PROMPTS, parseModelJson, validateOrder } from "./public/workflow.js";

const HOST = "127.0.0.1";
const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const PUBLIC_DIR = fileURLToPath(new URL("./public/", import.meta.url));
const MAX_BODY_BYTES = 64 * 1024;
const MAX_INPUT_CHARS = 8_000;
const OPERATIONS = new Set(Object.keys(PROMPTS));
const PROVIDERS = new Set(["openai", "anthropic", "gemini"]);
const MODELS = Object.freeze({
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5-20251001",
  gemini: "gemini-3.5-flash-lite",
});
const MIME = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
});

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error("Request is too large."), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Request must contain valid JSON."), { status: 400 });
  }
}

function normalizeInput(input) {
  const text = typeof input === "string" ? input : JSON.stringify(input);
  if (!text || text.length > MAX_INPUT_CHARS) {
    throw Object.assign(new Error(`Input must be between 1 and ${MAX_INPUT_CHARS} characters.`), { status: 400 });
  }
  return text;
}

function upstreamError(status) {
  if (status === 401 || status === 403) return "The provider rejected that API key.";
  if (status === 429) return "The provider rate limit or quota was reached.";
  return "The AI provider could not complete the request.";
}

async function callProvider(provider, apiKey, prompt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  let url;
  let headers;
  let body;

  if (provider === "openai") {
    url = "https://api.openai.com/v1/responses";
    headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
    body = { model: MODELS.openai, input: prompt, max_output_tokens: 1200, store: false };
  } else if (provider === "anthropic") {
    url = "https://api.anthropic.com/v1/messages";
    headers = { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" };
    body = { model: MODELS.anthropic, max_tokens: 1200, messages: [{ role: "user", content: prompt }] };
  } else {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent`;
    headers = { "x-goog-api-key": apiKey, "Content-Type": "application/json" };
    body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 1200 } };
  }

  try {
    const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: controller.signal });
    if (!response.ok) throw Object.assign(new Error(upstreamError(response.status)), { status: response.status });
    const data = await response.json();
    const output = provider === "openai"
      ? data.output_text || data.output?.flatMap((item) => item.content || []).map((part) => part.text).filter(Boolean).join("\n")
      : provider === "anthropic"
        ? data.content?.map((part) => part.text).filter(Boolean).join("\n")
        : data.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n");
    if (!output) throw new Error("The provider returned no text output.");
    return output;
  } catch (error) {
    if (error.name === "AbortError") throw Object.assign(new Error("The AI provider timed out."), { status: 504 });
    if (error.message === "The provider returned no text output." || error.message.startsWith("The provider ") || error.message.startsWith("The AI provider")) throw error;
    throw Object.assign(new Error("The AI provider could not be reached."), { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}

async function handleApi(req, res) {
  try {
    const body = await readJson(req);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw Object.assign(new Error("Request body must be an object."), { status: 400 });
    if ("model" in body) throw Object.assign(new Error("Model selection is controlled by the local server."), { status: 400 });
    if (!PROVIDERS.has(body.provider)) throw Object.assign(new Error("Choose a supported provider."), { status: 400 });
    if (!OPERATIONS.has(body.operation)) throw Object.assign(new Error("Choose a supported operation."), { status: 400 });
    if (typeof body.apiKey !== "string" || !body.apiKey.trim() || body.apiKey.length > 500) {
      throw Object.assign(new Error("Enter a valid API key."), { status: 400 });
    }
    const input = normalizeInput(body.input);
    const rawOutput = await callProvider(body.provider, body.apiKey.trim(), PROMPTS[body.operation](input));
    let output = rawOutput;
    if (body.operation === "extract-fixed") {
      try {
        output = JSON.stringify(validateOrder(parseModelJson(rawOutput)), null, 2);
      } catch {
        throw Object.assign(new Error("The model returned an unusable order."), { status: 502 });
      }
    }
    json(res, 200, { output, model: MODELS[body.provider] });
  } catch (error) {
    json(res, Number.isInteger(error.status) && error.status < 500 ? error.status : error.status === 504 ? 504 : 502, { error: error.message || "Request failed." });
  }
}

async function serveStatic(req, res, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    json(res, 400, { error: "Invalid URL." });
    return;
  }
  const relative = decoded === "/"
    ? "index.html"
    : decoded === "/menu" || decoded === "/menu/"
      ? "menu.html"
      : decoded.replace(/^\/+/, "");
  const filePath = resolve(PUBLIC_DIR, relative);
  if (filePath !== PUBLIC_DIR.slice(0, -1) && !filePath.startsWith(PUBLIC_DIR.endsWith(sep) ? PUBLIC_DIR : `${PUBLIC_DIR}${sep}`)) {
    json(res, 404, { error: "Not found." });
    return;
  }
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("not a file");
    res.writeHead(200, {
      "Content-Type": MIME[extname(filePath).toLowerCase()] || "application/octet-stream",
      "Content-Length": info.size,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    if (req.method === "HEAD") res.end();
    else createReadStream(filePath).pipe(res);
  } catch {
    json(res, 404, { error: "Not found." });
  }
}

export const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${HOST}`);
  if (req.method === "POST" && url.pathname === "/api/save-the-build") return handleApi(req, res);
  if (req.method === "GET" || req.method === "HEAD") return serveStatic(req, res, url.pathname);
  json(res, 405, { error: "Method not allowed." });
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(Number.isFinite(PORT) ? PORT : 3000, HOST, () => {
    console.log(`Save the Build: http://${HOST}:${Number.isFinite(PORT) ? PORT : 3000}`);
  });
}
