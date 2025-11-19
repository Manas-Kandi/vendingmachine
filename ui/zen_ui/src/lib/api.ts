const API_BASE_URL = 'http://localhost:8001';

export interface MarketState {
    last_prices: Record<string, number>;
    history_len: number;
    books: Record<string, {
        bids: number;
        asks: number;
        best_bid: number | null;
        best_ask: number | null;
    }>;
}

export interface AgentView {
    id: string;
    persona: string;
    cash: number;
    assets: Record<string, number>;
    total_value: number;
}

export interface Trade {
    id: string;
    asset: string;
    price: number;
    qty: number;
    buyer: string;
    seller: string;
    time: string;
}

export interface EconomySnapshot {
    generated_at: string;
    market_state: MarketState;
    agents: AgentView[];
    trades: Trade[];
    status: string;
}

export async function fetchTelemetry(): Promise<EconomySnapshot> {
    const response = await fetch(`${API_BASE_URL}/telemetry`, {
        cache: 'no-store',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch telemetry');
    }
    return response.json();
}
