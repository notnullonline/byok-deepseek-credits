# Product Requirements Document: BYOK DeepSeek Credits — VS Code Extension

## Overview

**BYOK DeepSeek Credits** is a Visual Studio Code extension that displays the remaining API credit balance (in USD) for your DeepSeek Bring-Your-Own-Key (BYOK) account directly in the VS Code status bar. It helps developers monitor their DeepSeek API credit without leaving the editor.

---

## Goals

- Give developers at-a-glance visibility into their remaining DeepSeek API balance.
- Require zero manual steps after entering the API key.
- Store API keys securely — never in plaintext.

---

## Non-Goals

- Supporting AI providers other than DeepSeek (no public balance API exists for Anthropic, GitHub Copilot, or Google AI).
- Managing or topping up API credits.
- Supporting enterprise/SSO-based accounts or team billing.
- Tracking usage history or analytics.

---

## Supported AI Providers

| Provider | API Balance Endpoint | Notes |
|---|---|---|
| DeepSeek | `GET https://api.deepseek.com/user/balance` | Fully implemented |

> Anthropic, GitHub Copilot, and Google AI do not expose a credit balance endpoint accessible via API key and are therefore out of scope.

---

## Features

### 1. Status Bar Display

- Show the remaining balance for each configured provider in the VS Code status bar.
- Each provider entry displays its name and remaining balance, e.g. `DeepSeek: $4.82`.
- Clicking a status bar item opens the provider's billing page in the browser.

### 2. API Key Management

- API key is stored securely via VS Code `SecretStorage` — never written to `settings.json`.
- Run **BYOK DeepSeek Credits: Set API Key** from the Command Palette to enter or update the key.
- Entering an empty value removes the stored key.
- Saving a key automatically enables the status bar item (no manual settings step required).

### 3. Balance Refresh

- Balances are fetched on extension activation and refreshed on a configurable interval (default: every 30 minutes).
- A manual "Refresh" command is available from the Command Palette.

### 4. Error Handling

- If a provider's API call fails (invalid key, network error, etc.), the status bar item shows an error indicator, e.g. `DeepSeek: ⚠`.
- Hovering over the error indicator shows a tooltip with the error detail.

---

## Settings Schema

```jsonc
{
  // Enable/disable the DeepSeek status bar item (default: true)
  "byokDeepSeekCredits.providers.deepseek.enabled": true,

  // Auto-refresh interval in minutes (default: 30)
  "byokDeepSeekCredits.refreshIntervalMinutes": 30
}
```

The API key is **not** stored in settings — it is managed via the **Set API Key** command.

---

## Commands

| Command | Description |
|---|---|
| `BYOK DeepSeek Credits: Refresh Balances` | Manually refresh the DeepSeek balance |
| `BYOK DeepSeek Credits: Set API Key` | Enter or update the DeepSeek API key |

---

## User Stories

1. **As a developer**, I want to see my remaining DeepSeek credit in the status bar so I know when I'm running low.
2. **As a developer**, I want balances to refresh automatically so I don't have to check manually.
3. **As a developer**, I want to be notified when a balance fetch fails so I can fix my API key.
4. **As a developer**, I want my API key stored securely so it is never exposed in plaintext.

---

## Technical Constraints

- Built as a standard VS Code extension (TypeScript).
- API keys must be stored securely (VS Code `SecretStorage` API).
- All provider API calls are made client-side from the user's machine; no backend or proxy server is involved.
- Must comply with each provider's API terms of service.

---

## Success Metrics

- Extension activates without errors for all configured providers.
- Status bar updates reflect accurate balances within the configured refresh interval.
- Zero plaintext API key storage in `settings.json` (keys use `SecretStorage`).
