# Save the Build

This is the small web app used for **[DEBUG] Save the Build** at AI Malaysia Takeover.

You do **not** need to know AI or programming to run it. The workshop presents one customer order to a deliberately broken bakery bot. The audience spots what went wrong, and the facilitator repairs one stage at a time.

## What you will see

The app is a single chat window for Kak Nor's Order Bot:

1. A customer message is already filled in.
2. You press **Run bot**.
3. The bot gives a deliberately bad response.
4. During the workshop, the facilitator makes one small code change.
5. The same message is run again, revealing the next problem.
6. After four repairs, the bot produces a safe, correct RM162 response.

The first bad response means the demo is working. It is not an installation error.

## Before you start

You need:

- a Mac, Windows, or Linux computer;
- a web browser such as Chrome, Edge, Firefox, or Safari;
- Node.js installed on the computer;
- this project folder.

You do **not** need:

- an AI account;
- an API key;
- Git or GitHub Desktop;
- a database;
- `npm install`;
- an internet connection after the project is downloaded.

### What is Node.js?

Node.js is the small program that starts this web app on your computer. Installing Node.js also installs the `npm` command used below.

1. Visit the [official Node.js download page](https://nodejs.org/en/download).
2. Choose the version marked **LTS**.
3. Run the downloaded installer and accept the normal options.
4. Close and reopen your Terminal or PowerShell window after installation.

This project supports Node.js 18 or newer. Installing the current LTS version is recommended.

## Download the project without Git

If the folder is already on your computer, skip this section.

1. Open the [AIMTO-STB GitHub page](https://github.com/EigenFunction271/AIMTO-STB).
2. Press the green **Code** button.
3. Choose **Download ZIP**.
4. Open your Downloads folder.
5. Double-click the ZIP file to unpack it.
6. You should now have a folder named something like `AIMTO-STB-main`.

## Start the app

### Step 1: Open a command window in the project folder

The command window may be called **Terminal** or **PowerShell**. It is simply a place where you type short instructions for the computer.

#### macOS

1. Press <kbd>Command</kbd> + <kbd>Space</kbd>.
2. Type `Terminal` and press <kbd>Enter</kbd>.
3. Type `cd `, including the space after `cd`.
4. Drag the unpacked project folder from Finder into the Terminal window.
5. Press <kbd>Enter</kbd>.

#### Windows 11

1. Open the unpacked project folder in File Explorer.
2. Right-click an empty area inside the folder.
3. Choose **Open in Terminal**.

If that option is unavailable, open PowerShell, type `cd `, drag the folder into the window, and press <kbd>Enter</kbd>.

### Step 2: Check Node.js

Type this and press <kbd>Enter</kbd>:

```bash
node --version
```

You should see a version beginning with `v`, such as `v24`. Then check `npm`:

```bash
npm --version
```

If either command says it cannot be found, install Node.js using the instructions above, then reopen the command window.

### Step 3: Run the app

Type:

```bash
npm start
```

You should see:

```text
Save the Build: http://127.0.0.1:3000
```

Keep that command window open. Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser.

To stop the app later, return to the command window and press <kbd>Control</kbd> + <kbd>C</kbd>.

## Try the demo without editing code

1. Leave **Fixture** selected in Settings. It is already the default.
2. Read the customer message.
3. Press **Run bot**.
4. Look for information the bot lost, changed, or invented.

Fixture mode produces controlled workshop responses. It works without an API key and remains reliable if the venue Wi-Fi fails.

## Run the four workshop repairs

This section is for the facilitator. Participants do not need to type code.

### Install a code editor

Any plain-text editor works. [Visual Studio Code](https://code.visualstudio.com/) is a convenient free option.

1. Open Visual Studio Code.
2. Choose **File → Open Folder**.
3. Select the project folder.
4. Open `public/workflow.js`.
5. Search for `PIPELINE`.

You will see this block:

```js
export const PIPELINE = Object.freeze({
  extract: extractBroken,
  price: priceBroken,
  invoice: invoiceBroken,
  reply: replyBroken,
});
```

This is the only block you need to edit during the session.

### The repeated stage loop

For every repair:

1. Let the audience diagnose the visible response.
2. Change one word from `Broken` to `Fixed` in the code editor.
3. Save the file with <kbd>Command</kbd> + <kbd>S</kbd> on Mac or <kbd>Control</kbd> + <kbd>S</kbd> on Windows.
4. Refresh the browser.
5. Press **Run bot** or **Run again**.

Make the repairs in this order:

#### Repair 1: Read the order correctly

```diff
- extract: extractBroken,
+ extract: extractFixed,
```

The next run reaches the pricing failure.

#### Repair 2: Calculate money in code

```diff
- price: priceBroken,
+ price: priceFixed,
```

The next run reaches the information-handoff failure.

#### Repair 3: Preserve every important detail

```diff
- invoice: invoiceBroken,
+ invoice: invoiceFixed,
```

The next run reaches the unreliable customer reply.

#### Repair 4: Do not invent promises

```diff
- reply: replyBroken,
+ reply: replyFixed,
```

The final run should contain:

- two Kek Coklat for RM90;
- one Kaya Puff half-dozen selling unit for RM12;
- one Kek Lapis for RM60;
- a total of RM162;
- the `jangan letak gula lebih` note;
- the requested pickup time, `esok petang`;
- no promise of delivery or a confirmed time.

### Reset before presenting again

Change all four lines back to their `Broken` versions:

```js
extract: extractBroken,
price: priceBroken,
invoice: invoiceBroken,
reply: replyBroken,
```

Save the file, refresh the browser, and press **Reset** in the app.

## Optional: use a real AI provider

The workshop does not require a live provider. Fixture mode is recommended for the main presentation because real model responses can vary.

To rehearse with a real provider:

1. Open **Settings** in the app.
2. Choose **Live API**.
3. Choose OpenAI, Anthropic, or Google Gemini.
4. Paste an API key from that provider.
5. Close Settings and run the bot.

The app fixes the model choice on the local server:

- OpenAI: `gpt-4o-mini`;
- Anthropic: `claude-haiku-4-5-20251001`;
- Gemini: `gemini-3.5-flash-lite`.

API calls may cost money depending on the provider and account.

### API-key safety

- The key is held only in the current browser page's memory.
- Refreshing or closing the page clears it.
- It is sent to the chosen provider through the local server only when you run the bot.
- It is not saved to a file, browser storage, or database.
- Never paste an API key into the code, a screenshot, a chat message, or a Git commit.

## Check that everything works

With the project folder open in Terminal or PowerShell, run:

```bash
npm test
```

You should see four passing tests and zero failures.

These optional checks confirm that the JavaScript files contain valid syntax:

```bash
node --check server.mjs
node --check public/app.js
node --check public/workflow.js
```

## Troubleshooting

### `node` or `npm` is not recognized or not found

Node.js is missing, or the command window was open before Node.js was installed. Install the LTS version from the [official Node.js page](https://nodejs.org/en/download), close the command window, and open it again.

### `EADDRINUSE` or “address already in use”

Another app is already using port 3000. First, close any older Terminal or PowerShell window running this app. If you need a different port:

macOS or Linux:

```bash
PORT=3001 npm start
```

Windows PowerShell:

```powershell
$env:PORT=3001; npm start
```

Then open [http://127.0.0.1:3001](http://127.0.0.1:3001).

### The browser says it cannot connect

- Confirm the command window is still open.
- Confirm it displays `Save the Build: http://127.0.0.1:3000`.
- Use the exact address shown in the command window.
- Do not close the command window while using the app.

### The page shows an older response after a code change

Save `public/workflow.js`, then refresh the browser with <kbd>Command</kbd> + <kbd>R</kbd> on Mac or <kbd>Control</kbd> + <kbd>R</kbd> on Windows.

### A live AI request fails

Return to Settings and choose **Fixture** so the workshop can continue. Later, check that the provider, API key, account balance, quota, and internet connection are correct.

### You changed the code and want the original back

The simplest beginner-safe reset is to download a fresh ZIP from GitHub. If you use Git, run:

```bash
git restore public/workflow.js
```

### Asking someone for help

Share:

- whether you use macOS, Windows, or Linux;
- the exact error text;
- the result of `node --version`;
- a screenshot with any API key hidden.

Never share the API key itself.

## Project map

```text
AIMTO-STB/
├── README.md                 This guide
├── package.json              The three npm commands
├── server.mjs                Local web server and optional provider calls
├── public/
│   ├── index.html            Chat-window structure
│   ├── styles.css            AIMTO visual design
│   ├── app.js                Browser interactions and Settings
│   └── workflow.js           Broken/fixed stages and the editable PIPELINE
└── test/
    └── workflow.test.mjs     Checks the five-run sequence
```

For the workshop, the only file you need to edit is `public/workflow.js`.

## Available commands

| Command | What it does |
|---|---|
| `npm start` | Starts the app normally |
| `npm run dev` | Starts the app and automatically restarts the server when server files change |
| `npm test` | Runs the workflow checks |

There are no production dependencies to install.
