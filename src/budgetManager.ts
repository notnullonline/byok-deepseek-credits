import * as vscode from "vscode";
import { ALL_PROVIDERS } from "./providers";
import type { Provider } from "./providers";

const SECRET_KEY_PREFIX = "byokDeepSeekCredits.apiKey.";
const CONFIG_SECTION = "byokDeepSeekCredits";

interface ProviderEntry {
  provider: Provider;
  statusBarItem: vscode.StatusBarItem;
}

export class BudgetManager {
  private entries: ProviderEntry[] = [];
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {}

  async initialize(): Promise<void> {
    this.syncProviders();
    await this.refresh();
    this.startAutoRefresh();
  }

  async refresh(): Promise<void> {
    await Promise.allSettled(
      this.entries.map((entry) => this.fetchAndUpdate(entry)),
    );
  }

  async setApiKey(providerId?: string): Promise<void> {
    let provider: Provider | undefined;

    if (providerId) {
      provider = ALL_PROVIDERS.find((p) => p.id === providerId);
    } else {
      const picks = ALL_PROVIDERS.map((p) => ({
        label: p.displayName,
        id: p.id,
      }));
      const selected = await vscode.window.showQuickPick(picks, {
        placeHolder: "Select a provider to configure",
      });
      if (!selected) {
        return;
      }
      provider = ALL_PROVIDERS.find((p) => p.id === selected.id);
    }

    if (!provider) {
      return;
    }

    const apiKey = await vscode.window.showInputBox({
      title: `API Key – ${provider.displayName}`,
      prompt: `Enter your ${provider.displayName} API key`,
      password: true,
      ignoreFocusOut: true,
    });

    if (apiKey === undefined) {
      return; // User cancelled
    }

    const secretKey = `${SECRET_KEY_PREFIX}${provider.id}`;
    if (apiKey === "") {
      await this.context.secrets.delete(secretKey);
      vscode.window.showInformationMessage(
        `${provider.displayName} API key removed.`,
      );
    } else {
      await this.context.secrets.store(secretKey, apiKey);
      // Ensure provider is enabled when a key is saved
      const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
      await config.update(
        `providers.${provider.id}.enabled`,
        true,
        vscode.ConfigurationTarget.Global,
      );
      vscode.window.showInformationMessage(
        `${provider.displayName} API key saved.`,
      );
    }

    await this.refresh();
  }

  onConfigurationChanged(): void {
    this.syncProviders();
    this.startAutoRefresh();
    void this.refresh();
  }

  dispose(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    for (const entry of this.entries) {
      entry.statusBarItem.dispose();
    }
    this.entries = [];
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private syncProviders(): void {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const enabledIds = new Set(
      ALL_PROVIDERS.filter((p) =>
        config.get<boolean>(`providers.${p.id}.enabled`, false),
      ).map((p) => p.id),
    );

    // Dispose status bar items for providers that were just disabled
    const toRemove = this.entries.filter((e) => !enabledIds.has(e.provider.id));
    for (const entry of toRemove) {
      entry.statusBarItem.dispose();
    }
    this.entries = this.entries.filter((e) => enabledIds.has(e.provider.id));

    // Add status bar items for newly enabled providers
    const existingIds = new Set(this.entries.map((e) => e.provider.id));
    for (const provider of ALL_PROVIDERS) {
      if (enabledIds.has(provider.id) && !existingIds.has(provider.id)) {
        this.entries.push({
          provider,
          statusBarItem: this.createStatusBarItem(provider),
        });
      }
    }
  }

  private async fetchAndUpdate(entry: ProviderEntry): Promise<void> {
    const { provider, statusBarItem } = entry;
    statusBarItem.text = `$(sync~spin) ${provider.displayName}:`;
    statusBarItem.tooltip = "Fetching balance…";

    const apiKey = await this.context.secrets.get(
      `${SECRET_KEY_PREFIX}${provider.id}`,
    );
    if (!apiKey) {
      statusBarItem.text = `$(key) ${provider.displayName}:`;
      const tip = new vscode.MarkdownString(
        `**${provider.displayName}**: API key not set.\n\nRun **BYOK DeepSeek Credits: Set API Key** to configure.\n\n[Open billing page](${provider.billingUrl})`,
      );
      tip.isTrusted = true;
      statusBarItem.tooltip = tip;
      return;
    }

    try {
      const result = await provider.fetchBalance(apiKey);
      const balanceStr =
        result.currency === "USD"
          ? `$${result.balance.toFixed(2)}`
          : `${result.balance.toFixed(2)} ${result.currency}`;
      statusBarItem.text = `$(cloud) ${provider.displayName}: ${balanceStr}`;
      const tip = new vscode.MarkdownString(
        `**${provider.displayName}**\nRemaining balance: **${balanceStr}**\n\nClick to refresh. [Open billing page](${provider.billingUrl})`,
      );
      tip.isTrusted = true;
      statusBarItem.tooltip = tip;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      statusBarItem.text = `$(warning) ${provider.displayName}:`;
      const tip = new vscode.MarkdownString(
        `**${provider.displayName}**: ${msg}\n\nClick to retry. [Open billing page](${provider.billingUrl})`,
      );
      tip.isTrusted = true;
      statusBarItem.tooltip = tip;
    }
  }

  private createStatusBarItem(provider: Provider): vscode.StatusBarItem {
    const item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100,
    );
    item.command = {
      command: "byokDeepSeekCredits.refresh",
      title: "Refresh balance",
    };
    item.text = `$(sync~spin) ${provider.displayName}:`;
    item.tooltip = "Loading…";
    item.show();
    this.context.subscriptions.push(item);
    return item;
  }

  private startAutoRefresh(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    if (this.entries.length === 0) {
      return;
    }
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const intervalMinutes = config.get<number>("refreshIntervalMinutes", 30);
    this.timer = setInterval(
      () => {
        void this.refresh();
      },
      intervalMinutes * 60 * 1000,
    );
  }
}
