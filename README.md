# Save the Build

A small workshop app for **[DEBUG] Save the Build** at AI Malaysia Takeover.

You do not need AI or coding experience. The app shows one bakery order, one broken reply, and four simple repairs.

## What you need

- A Mac or Windows computer
- A browser
- Node.js
- This project folder

Use an **OpenAI API key** for the live demo. This is the recommended setup.

If the key or internet connection fails, switch to **Fixture** mode. Fixture mode needs no key.

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

## 5. Get an OpenAI API key — recommended

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
- API use may cost money.

The app sends the key only to the local server and then to OpenAI for that request. It does not save the key.

## Run without an API key

1. Open Settings.
2. Choose **Fixture**.
3. Close Settings.
4. Press **Run bot**.

Fixture mode gives the same controlled responses every time. Use it as the stage backup.

The first bad response is deliberate. It means the demo is working.

## Run the workshop

Participants only need to answer:

> Did the bot lose something, get something wrong, or make something up?

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

For each round:

1. Run the bot.
2. Let the audience find the problem.
3. Change one `Broken` word to `Fixed`.
4. Save the file.
5. Refresh the browser.
6. Run again.

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

You should see four passing tests.

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

Check the key, billing, internet connection, and account limits. Switch to Fixture mode so the session can continue.

### The page did not change after editing

Save `public/workflow.js`, then refresh the browser.

## Files

```text
server.mjs             Starts the local app and calls providers
public/index.html      Chat window
public/app.js          Buttons and Settings
public/styles.css      Design
public/workflow.js     The four workshop repairs
test/workflow.test.mjs Checks the sequence
```

Only edit `public/workflow.js` during the workshop.
