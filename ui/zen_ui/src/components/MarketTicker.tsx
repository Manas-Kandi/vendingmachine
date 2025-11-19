'use client';

import { Trade, MarketState } from '@/lib/api';
import { ArrowUp, ArrowDown, Minus } from '@phosphor-icons/react';

interface MarketTickerProps {
    trades: Trade[];
    marketState: MarketState;
}

export default function MarketTicker({ trades, marketState }: MarketTickerProps) {
    return (
        <div className="w-full bg-black border-y border-white/10 h-12 flex items-center overflow-hidden relative">
            <div className="flex items-center gap-12 animate-scroll whitespace-nowrap px-4">
                {/* Asset Prices */}
                {Object.entries(marketState.last_prices).map(([asset, price]) => (
                    <div key={asset} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-white/40 tracking-widest">{asset}</span>
                        <span className="text-sm font-mono text-white">${price.toFixed(2)}</span>
                    </div>
                ))}

                {/* Separator */}
                <div className="w-[1px] h-4 bg-white/20" />

                {/* Recent Trades */}
                {trades.map((trade) => (
                    <div key={trade.id} className="flex items-center gap-2 text-xs font-mono">
                        <span className={trade.asset === 'COMPUTE' ? 'text-blue-400' : trade.asset === 'DATA' ? 'text-emerald-400' : 'text-pink-400'}>
                            {trade.asset}
                        </span>
                        <span className="text-white/60">
                            {trade.qty} @ {trade.price.toFixed(2)}
                        </span>
                        <span className="text-white/30 text-[10px]">
                            {trade.time.split('T')[1].split('.')[0]}
                        </span>
                    </div>
                ))}
            </div>

            {/* Gradient Fade Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black to-transparent pointer-events-none" />
        </div>
    );
}
