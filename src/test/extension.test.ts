import * as assert from 'assert';
import * as vscode from 'vscode';
import { BudgetManager } from '../budgetManager';

suite('Extension Test Suite', () => {
	test('activates and registers commands', async () => {
		const extension = vscode.extensions.all.find((candidate) => {
			const packageJson = (candidate as vscode.Extension<unknown> & {
				packageJSON?: { name?: string };
			}).packageJSON;
			return packageJson?.name === 'byok-deepseek-credits';
		});

		assert.ok(extension, 'Expected extension under test to be installed');

		await extension?.activate();

		assert.strictEqual(extension?.isActive, true);

		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('byokDeepSeekCredits.refresh'));
		assert.ok(commands.includes('byokDeepSeekCredits.setApiKey'));
	});

	test('shows a status bar item when the provider is enabled', async () => {
		type RecordedStatusBarItem = {
			text: string;
			tooltip: string | vscode.MarkdownString | undefined;
			showCalled: boolean;
			disposeCalled: boolean;
			command?: string | vscode.Command;
			show: () => void;
			hide: () => void;
			dispose: () => void;
		};

		const createdItems: RecordedStatusBarItem[] = [];

		const fakeItem: RecordedStatusBarItem = {
			text: '',
			tooltip: '',
			showCalled: false,
			disposeCalled: false,
			command: undefined,
			show: () => {
				fakeItem.showCalled = true;
			},
			hide: () => undefined,
			dispose: () => {
				fakeItem.disposeCalled = true;
			},
		};

		const originalCreateStatusBarItem = vscode.window.createStatusBarItem;
		const originalGetConfiguration = vscode.workspace.getConfiguration;
		const secretChanges = new vscode.EventEmitter<vscode.SecretStorageChangeEvent>();

		Object.defineProperty(vscode.window, 'createStatusBarItem', {
			configurable: true,
			value: () => {
				createdItems.push(fakeItem);
				return fakeItem as unknown as vscode.StatusBarItem;
			},
		});

		Object.defineProperty(vscode.workspace, 'getConfiguration', {
			configurable: true,
			value: () => ({
				get<T>(key: string, defaultValue?: T): T {
					if (key === 'providers.deepseek.enabled') {
						return true as T;
					}

					return defaultValue as T;
				},
				update: async () => undefined,
			}),
		});

		const context = {
			subscriptions: [],
			secrets: {
				get: async () => undefined,
				store: async () => undefined,
				delete: async () => undefined,
				onDidChange: secretChanges.event,
			},
		} as unknown as vscode.ExtensionContext;

		const manager = new BudgetManager(context);

		try {
			await manager.initialize();

			assert.strictEqual(createdItems.length, 1);
			assert.strictEqual(fakeItem.showCalled, true);
			assert.deepStrictEqual(fakeItem.command, {
				command: 'byokDeepSeekCredits.refresh',
				title: 'Refresh balance',
			});
			assert.strictEqual(fakeItem.text, '$(key) DeepSeek:');
		} finally {
			manager.dispose();
			secretChanges.dispose();

			Object.defineProperty(vscode.window, 'createStatusBarItem', {
				configurable: true,
				value: originalCreateStatusBarItem,
			});

			Object.defineProperty(vscode.workspace, 'getConfiguration', {
				configurable: true,
				value: originalGetConfiguration,
			});
		}

		assert.strictEqual(fakeItem.disposeCalled, true);
	});
});
