'use client';

import { Brain, Truck, Package } from '@phosphor-icons/react';

interface AgentStatusProps {
    reasoning: string;
    orders: any[];
    inventory: any[];
}

export default function AgentStatus({ reasoning, orders, inventory }: AgentStatusProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Zen Agent Mind */}
            <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-3 border-b border-stone-100 pb-4">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <Brain className="w-6 h-6 text-indigo-600" weight="duotone" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-stone-800">Zen Mind</h3>
                        <p className="text-xs text-stone-500">Optimization Engine & LLM</p>
                    </div>
                </div>

                <div className="prose prose-stone">
                    <p className="text-stone-600 italic leading-relaxed">
                        "{reasoning}"
                    </p>
                </div>

                <div className="pt-4">
                    <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                        Current Inventory
                    </h4>
                    <div className="space-y-3">
                        {inventory.map((item) => (
                            <div key={item.sku} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-2 h-2 rounded-full bg-stone-300" />
                                    <span className="text-sm text-stone-600 font-medium capitalize">
                                        {item.sku}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <span className="block text-sm font-bold text-stone-800">
                                            {item.stock}
                                        </span>
                                        <span className="text-[10px] text-stone-400">UNITS</span>
                                    </div>
                                    <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, (item.stock / 50) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Store Agent Activity */}
            <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-3 border-b border-stone-100 pb-4">
                    <div className="p-2 bg-amber-50 rounded-lg">
                        <Truck className="w-6 h-6 text-amber-600" weight="duotone" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-stone-800">Supply Chain</h3>
                        <p className="text-xs text-stone-500">Store Agent & Logistics</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-stone-400">
                            <Package className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">No active orders</p>
                        </div>
                    ) : (
                        orders.map((order, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-stone-200 text-xs font-bold text-stone-600">
                                        {order.qty}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-stone-800 capitalize">{order.sku}</p>
                                        <p className="text-xs text-stone-500">
                                            ETA: {order.deliveryDays} days
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-sm font-bold text-stone-800">
                                        ${order.quotePrice.toFixed(2)}
                                    </span>
                                    <span className="text-[10px] text-stone-400">
                                        CONF: {(order.confidence * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
