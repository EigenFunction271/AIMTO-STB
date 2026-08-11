# Save the Build

A small workshop app for **[DEBUG] Save the Build** at AI Malaysia Takeover.

You do not need AI or coding experience. The app runs one bakery order through four checks: understanding, money, handoff, and promise.

## What you need

- A Mac or Windows computer
- A browser
- Node.js
- This project folder
- An OpenAI API key for the normal live workshop path

Use **Live API** for the normal workshop path. It is the default, and its response may vary between runs.

Use **Fixture** only when a provider, network, or quota problem blocks the live session. It needs no API key or internet connection.

## 1. Install Node.js

1. Open the [Node.js download page](https://nodejs.org/en/download).
2. Choose **LTS**.
3. Install it with the normal options.
4. Close and reopen Terminal or PowerShell.

Check the installation:

```bash
node --version
npm --version
```

Both commands should show a number. This app needs Node.js 18 or newer.

## 2. Download this app

1. Open [AIMTO-STB on GitHub](https://github.com/EigenFunction271/AIMTO-STB).
2. Press **Code**.
3. Press **Download ZIP**.
4. Unzip the downloaded file.

Git is not required.

## 3. Open the project folder in a command window

### Mac

1. Open **Terminal**.
2. Type `cd `, including the space.
3. Drag the project folder into Terminal.
4. Press <kbd>Enter</kbd>.

### Windows 11

1. Open the project folder.
2. Right-click an empty space inside it.
3. Press **Open in Terminal**.

## 4. Start the app

Run:

```bash
npm start
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

Keep Terminal open. Press <kbd>Control</kbd> + <kbd>C</kbd> when you want to stop the app.

No `npm install` is needed.

## 5. Get an OpenAI API key for the live workshop

Use the OpenAI Platform, not the ChatGPT message box.

1. Open the [OpenAI Platform](https://platform.openai.com/).
2. Sign in or create an account.
3. Open the [API keys page](https://platform.openai.com/api-keys).
4. Press **Create new secret key**.
5. Name it `AIMTO Save the Build`.
6. Create the key.
7. Copy the key and keep it private.
8. If OpenAI asks for credits or billing, open [Billing](https://platform.openai.com/settings/organization/billing/overview) and follow the account instructions.

Official reference: [OpenAI API quickstart](https://developers.openai.com/api/docs/quickstart).

### Put the key into this app

1. Return to the bakery app.
2. Press the **Settings** gear.
3. Choose **Live API**.
4. Choose **OpenAI · GPT-4o mini (recommended)**.
5. Paste the key into **API key**.
6. Close Settings.
7. Press **Run bot**.

### Keep the key safe

- Do not share it.
- Do not show it on the projector.
- Do not paste it into the code.
- Do not include it in a screenshot or Git commit.
- Refreshing or closing this app clears the key.
- After each code-refresh round, reopen Settings and enter the key again.
- API use may cost money.

The app sends the key only to the local server and then to OpenAI for that request. It does not save the key.

## Run the live workshop — default

1. Open Settings.
2. Keep **Live API** and **OpenAI · GPT-4o mini (recommended)** selected.
3. Paste the API key.
4. Close Settings.
5. Press **Run bot**.

Do not predict the response. Compare what actually appears with the known order facts, menu, RM162 total, note, and pickup request.

Mark each checkpoint **PASS**, **NEEDS WORK**, or **NOT REACHED**. The pipeline stops at its first unmet stage, so do not judge later checkpoints until a rerun reaches them. Once all four checks pass, celebrate it and try a harder follow-up.

## Use Fixture only as a fallback

If the live provider, network, or quota fails:

1. Open Settings.
2. Choose **Fixture**.
3. Close Settings.
4. Press **Run bot**.

Fixture mode provides deterministic fallback examples so the session can continue. They are not a prediction of what the live model should do.

## Codebase map — start here

Start with [`public/workflow.js`](public/workflow.js). It is the workshop **switchboard**: it imports the smaller workflow parts and its `PIPELINE` block chooses whether each checkpoint runs the `Broken` or `Fixed` version. You do not need to understand every file before using it.

| File | Plain-English job |
|------|-------------------|
| [`public/workflow.js`](public/workflow.js) | Start here. Switches each checkpoint between `Broken` and `Fixed`. |
| [`public/workflow/pipeline.js`](public/workflow/pipeline.js) | Runs the four checkpoints in order and stops at the first untrusted result. |
| [`public/workflow/order.js`](public/workflow/order.js) | Holds the menu, demo order, conversation rules, and order validation shared by every stage. |
| [`public/workflow/fixtures.js`](public/workflow/fixtures.js) | Holds predictable fallback model replies for provider, network, or quota failure. |
| [`public/app.js`](public/app.js) | Connects the chat, Settings, status, and dashboard to the workflow. |
| [`server.mjs`](server.mjs) | Serves the app locally and makes live provider requests without saving the API key. |

The numbered stage files match the workshop checkpoints:

| Checkpoint | Stage file | Input | Trusted output |
|------------|------------|-------|----------------|
| 1 · Understanding | [`01-understanding.js`](public/workflow/stages/01-understanding.js) | Customer messages as text | A parsed order that passed `validateOrder` |
| 2 · Money | [`02-money.js`](public/workflow/stages/02-money.js) | The validated order | Item prices and total calculated from the menu in code |
| 3 · Handoff | [`03-handoff.js`](public/workflow/stages/03-handoff.js) | The trusted priced order | An invoice containing lines, total, notes, and fulfilment details |
| 4 · Promise | [`04-promise.js`](public/workflow/stages/04-promise.js) | The trusted invoice | A customer reply assembled only from invoice facts |

## Run the workshop

Participants only need to answer:

> Did this checkpoint PASS, NEEDS WORK, or was it NOT REACHED?

The facilitator edits one block in `public/workflow.js`:

```js
export const PIPELINE = Object.freeze({
  extract: extractBroken,
  price: priceBroken,
  invoice: invoiceBroken,
  reply: replyBroken,
});
```

Use [Visual Studio Code](https://code.visualstudio.com/) or another text editor.

For each checkpoint, use the same debugging loop:

- **PASS:** the pipeline reached this stage and its result matches the pass condition.
- **NEEDS WORK:** the pipeline reached this stage, but its result is wrong, incomplete, or untrusted.
- **NOT REACHED:** an earlier stage stopped first. Do not diagnose this stage yet.

1. Run the bot.
2. Use the app status and run history to identify the last stage reached.
3. Mark later checkpoints **NOT REACHED**; do not diagnose them yet.
4. Open that checkpoint's numbered stage file to understand its input, risk, and trusted output.
5. Judge the reached checkpoint against its fixed pass condition.
6. In the `PIPELINE` block in [`public/workflow.js`](public/workflow.js), change only that stage's `Broken` name to `Fixed`. If its visible content passed but the pipeline still stopped before trusting it, this switch lets the next checkpoint run without calling the content wrong.
7. Save the file and refresh the browser.
8. Reopen Settings and enter the API key again.
9. Run again.

Make the repairs in this order:

```diff
- extract: extractBroken,
+ extract: extractFixed,
```

```diff
- price: priceBroken,
+ price: priceFixed,
```

```diff
- invoice: invoiceBroken,
+ invoice: invoiceFixed,
```

```diff
- reply: replyBroken,
+ reply: replyFixed,
```

The final reply should keep the order note and pickup request, total RM162, and make no delivery or timing promise.

### What each repair activates

The `PIPELINE` block in [`public/workflow.js`](public/workflow.js) only chooses which version runs. The detailed implementations live in the numbered stage files:

- [`extractFixed` in Checkpoint 1](public/workflow/stages/01-understanding.js) uses the structured `extract-fixed` prompt, parses the model JSON, and validates the order.
- [`priceFixed` in Checkpoint 2](public/workflow/stages/02-money.js) calls `priceOrder`, which calculates every line from `MENU` instead of trusting a model total.
- [`invoiceFixed` in Checkpoint 3](public/workflow/stages/03-handoff.js) calls `buildInvoice`, preserving the priced lines, total, notes, and fulfilment request.
- [`replyFixed` in Checkpoint 4](public/workflow/stages/04-promise.js) calls `buildReply`, producing the customer confirmation from validated invoice facts without another AI call.

The switchboard uses these same stage modules in Fixture and Live API modes. With all four `Fixed` versions activated, Live API uses AI only for extraction; pricing, invoice creation, dashboard reporting, and the final reply are handled by code.

## Reset before the session

Set all four stages back to `Broken`:

```js
extract: extractBroken,
price: priceBroken,
invoice: invoiceBroken,
reply: replyBroken,
```

Save, refresh the browser, and press **Reset**.

## Check the app

Run:

```bash
npm test
```

You should see six passing tests.

## Quick troubleshooting

### `node` or `npm` is not found

Install Node.js LTS. Close and reopen Terminal.

### The browser cannot connect

Make sure `npm start` is still running. Use the exact address shown in Terminal.

### Port 3000 is already in use

Close the older app process, or use another port.

Mac:

```bash
PORT=3001 npm start
```

Windows PowerShell:

```powershell
$env:PORT=3001; npm start
```

Then open [http://127.0.0.1:3001](http://127.0.0.1:3001).

### The live OpenAI call fails

Check the key, billing, internet connection, and account limits. Switch to Fixture only so a provider, network, or quota problem does not stop the session.

### The page did not change after editing

Save the file you edited—normally [`public/workflow.js`](public/workflow.js)—then refresh the browser. Refresh clears the in-memory API key, so enter it again in Settings before rerunning.

## Files

```text
server.mjs                                  Local server and live provider calls
public/index.html                           Chat window
public/app.js                               Buttons, Settings, status, and dashboard
public/styles.css                           App design
public/workflow.js                          Start-here switchboard
public/workflow/order.js                    Menu, demo order, and validation
public/workflow/pipeline.js                 Four-stage runner and stop-first reports
public/workflow/fixtures.js                 Fixture-only fallback responses
public/workflow/stages/01-understanding.js  Checkpoint 1 · customer text → validated order
public/workflow/stages/02-money.js          Checkpoint 2 · validated order → trusted total
public/workflow/stages/03-handoff.js        Checkpoint 3 · priced order → complete invoice
public/workflow/stages/04-promise.js        Checkpoint 4 · invoice → fact-based reply
test/workflow.test.mjs                      Workflow sequence checks
```

During the workshop, begin with and edit only the four `PIPELINE` lines in [`public/workflow.js`](public/workflow.js). The numbered stage files are there to explain what each checkpoint owns; participants do not need to edit them.
