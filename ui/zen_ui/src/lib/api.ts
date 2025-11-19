const API_BASE_URL = 'http://localhost:8001';

export interface TelemetrySnapshot {
    metrics: Metric[];
    marginSeries: number[];
    timeline: TimelineEvent[];
    reasoning: string;
    inventory: InventoryItem[];
    orders: OrderSummary[];
    status: SystemStatus;
    generatedAt: string;
}

export interface Metric {
    id: string;
    label: string;
    value: number;
    delta: number;
    unit: string;
}

export interface TimelineEvent {
    timestamp: string;
    margin: number;
    adversaryPulse: number;
}

export interface InventoryItem {
    sku: string;
    stock: number;
    msrp: number;
}

export interface OrderSummary {
    sku: string;
    qty: number;
    quotePrice: number;
    deliveryDays: number;
    confidence: number;
}

export interface SystemStatus {
    revenue: number;
    costs: number;
    latencyMs: number;
    uptime: number;
}

export async function fetchTelemetry(): Promise<TelemetrySnapshot> {
    try {
        const response = await fetch(`${API_BASE_URL}/telemetry`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch telemetry:', error);
        throw error;
    }
}
