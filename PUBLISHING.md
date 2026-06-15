# Publishing BYOK DeepSeek Credits to the VS Code Marketplace

Follow these steps in order. Steps marked **required** will block publishing if skipped.

---

## Step 1 — Create a publisher account (required)

1. Sign in at https://marketplace.visualstudio.com/manage with your Microsoft account.
2. Click **Create publisher**.
3. Choose a publisher ID (e.g. `yourname` or your company handle). You cannot change this later.
4. Add `"publisher": "<your-publisher-id>"` to `package.json`.

---

## Step 2 — Create a Personal Access Token (required)

You need a PAT to authenticate `vsce` against the Marketplace.

1. Go to https://dev.azure.com and sign in with the **same** Microsoft account.
2. Click your avatar (top-right) → **Personal access tokens** → **New Token**.
3. Set the following:
   - **Name**: anything, e.g. `vsce-publish`
   - **Organization**: All accessible organizations
   - **Expiration**: your preference (max 1 year)
   - **Scopes**: select **Custom defined** → check **Marketplace → Manage**
4. Click **Create** and **copy the token now** — it won't be shown again.

---

## Step 3 — Fill in remaining package.json fields (required)

Open `package.json` and add/update:

```jsonc
{
  "publisher": "<your-publisher-id>",   // from Step 1
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/notnullonline/byok-deepseek-credits"
  },
  "keywords": ["deepseek", "ai", "budget", "byok", "balance", "status bar"],
  "categories": ["Other"],
  "icon": "images/icon.png"             // after Step 4
}
```

---

## Step 4 — Add an icon (strongly recommended)

The Marketplace will show a grey placeholder without one.

1. Create a folder: `images/`
2. Add a **128×128 PNG** named `icon.png` inside it.
3. Add `"icon": "images/icon.png"` to `package.json`.

> Tip: Use a simple DeepSeek logo or any square icon. Free tools: Figma, Canva, or DALL·E.

---

## Step 5 — Write a proper README.md (required)

The README is the extension's Marketplace page. Replace the scaffold content with at minimum:

- What the extension does
- How to install & configure it (set API key, enable in settings)
- A screenshot of the status bar item
- Where to get a DeepSeek API key: https://platform.deepseek.com/api_keys

---

## Step 6 — Update CHANGELOG.md

Document the initial release:

```markdown
## [0.0.1] - 2026-06-14

### Added
- DeepSeek balance shown in the VS Code status bar
- Secure API key storage via VS Code SecretStorage
- Auto-refresh on configurable interval (default 30 min)
- Commands: Refresh Balances, Set API Key
```

---

## Step 7 — Install vsce (required)

```bash
npm install -g @vscode/vsce
```

---

## Step 8 — Add your publisher to vsce

```bash
vsce login <your-publisher-id>
# Paste the PAT from Step 2 when prompted
```

---

## Step 9 — Test the package locally (recommended)

Build a `.vsix` file and install it manually before publishing:

```bash
vsce package
# Produces: byok-deepseek-credits-0.0.1.vsix
```

Install it in VS Code:

```bash
code --install-extension byok-deepseek-credits-0.0.1.vsix
```

Verify the status bar item appears and the commands work in the Command Palette.

---

## Step 10 — Publish (required)

```bash
vsce publish
```

Or bump the version and publish in one command:

```bash
vsce publish patch   # 0.0.1 → 0.0.2
vsce publish minor   # 0.0.1 → 0.1.0
vsce publish major   # 0.0.1 → 1.0.0
```

After ~5 minutes the extension will be live at:
`https://marketplace.visualstudio.com/items?itemName=<your-publisher-id>.byok-deepseek-credits`

---

## Checklist

- [ ] Publisher account created ← **do this first (browser)**
- [ ] PAT created with Marketplace → Manage scope ← **do this second (browser)**
- [ ] `publisher` added to `package.json` ← **add after Step 1**
- [ ] `repository` added to `package.json` ← **add your GitHub URL**
- [x] Icon added (`images/icon.png`)
- [x] `license`, `keywords` added to `package.json`
- [x] `LICENSE` file created (MIT)
- [x] `README.md` written
- [x] `CHANGELOG.md` updated
- [x] `vsce` installed
