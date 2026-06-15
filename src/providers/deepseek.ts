import { Provider, ProviderBalance } from './types';

interface DeepSeekBalanceResponse {
    is_available: boolean;
    balance_infos: Array<{
        currency: string;
        total_balance: string;
        granted_balance: string;
        topped_up_balance: string;
    }>;
}

export const deepseekProvider: Provider = {
    id: 'deepseek',
    displayName: 'DeepSeek',
    billingUrl: 'https://platform.deepseek.com/usage',

    async fetchBalance(apiKey: string): Promise<ProviderBalance> {
        const resp = await fetch('https://api.deepseek.com/user/balance', {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: 'application/json',
            },
        });

        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }

        const data = await resp.json() as DeepSeekBalanceResponse;

        if (!data.is_available || !data.balance_infos?.length) {
            throw new Error('Account balance unavailable');
        }

        const info = data.balance_infos[0];
        return {
            balance: parseFloat(info.total_balance),
            currency: info.currency,
        };
    },
};
