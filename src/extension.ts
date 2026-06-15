import * as vscode from 'vscode';
import { BudgetManager } from './budgetManager';

let manager: BudgetManager | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    manager = new BudgetManager(context);

    context.subscriptions.push(
        vscode.commands.registerCommand('byokDeepSeekCredits.refresh', () => {
            void manager?.refresh();
        }),
        vscode.commands.registerCommand('byokDeepSeekCredits.setApiKey', () => {
            void manager?.setApiKey();
        }),
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('byokDeepSeekCredits')) {
                manager?.onConfigurationChanged();
            }
        })
    );

    await manager.initialize();
}

export function deactivate(): void {
    manager?.dispose();
    manager = undefined;
}
