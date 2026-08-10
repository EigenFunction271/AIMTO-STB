# Save the Build

Dependency-free single-chat stage app for **[DEBUG] Save the Build** at AIMTO.

## Run locally

Requires Node.js 18 or newer.

```bash
npm start
```

Open <http://127.0.0.1:3000/>. Fixture mode is the deterministic, offline-safe default. Live mode accepts an OpenAI, Anthropic, or Gemini API key in Settings; the key stays in browser memory and is sent only to the local server for each request.

Live models are fixed server-side: `gpt-4o-mini`, `claude-haiku-4-5-20251001`, and `gemini-3.5-flash-lite`. The browser cannot select or override them.

## Stage repairs

Edit only the `PIPELINE` function references near the top of `public/workflow.js`, one at a time:

```js
const PIPELINE = {
  extract: extractBroken,
  price: priceBroken,
  invoice: invoiceBroken,
  reply: replyBroken,
};
```

Swap `extract`, then `price`, then `invoice`, then `reply` to their `Fixed` function. Refresh and run the same message after each edit. The first unrepaired stage becomes the bot response; the all-fixed pipeline returns RM162 without inventing delivery or timing promises.

## Check

```bash
npm test
node --check server.mjs
node --check public/app.js
node --check public/workflow.js
```
