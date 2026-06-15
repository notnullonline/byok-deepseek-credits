export interface ProviderBalance {
    balance: number;
    currency: string;
}

export interface Provider {
    readonly id: string;
    readonly displayName: string;
    readonly billingUrl: string;
    fetchBalance(apiKey: string): Promise<ProviderBalance>;
}
