'use client';

import { Metric } from '@/lib/api';
import { TrendUp, TrendDown, Minus } from '@phosphor-icons/react';
import clsx from 'clsx';

interface TelemetryPanelProps {
    metrics: Metric[];
}

export default function TelemetryPanel({ metrics }: TelemetryPanelProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 p-8 bg-[#1a1a1a]/60 backdrop-blur-md rounded-none border-t border-[#f2f0e9]/10">
            {metrics.map((metric) => (
                <div key={metric.id} className="flex flex-col gap-2">
                    <span className="text-[10px] font-sans font-medium text-[#8c6b5d] uppercase tracking-[0.2em]">
                        {metric.label}
                    </span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-serif text-[#f2f0e9]">
                            {metric.value}
                        </span>
                        <span className="text-xs font-sans text-[#f2f0e9]/40">{metric.unit}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        {metric.delta > 0 ? (
                            <TrendUp className="w-3 h-3 text-[#4a5d4e]" />
                        ) : metric.delta < 0 ? (
                            <TrendDown className="w-3 h-3 text-[#8c6b5d]" />
                        ) : (
                            <Minus className="w-3 h-3 text-[#f2f0e9]/20" />
                        )}
                        <span
                            className={clsx(
                                'text-xs font-mono',
                                metric.delta > 0
                                    ? 'text-[#4a5d4e]'
                                    : metric.delta < 0
                                        ? 'text-[#8c6b5d]'
                                        : 'text-[#f2f0e9]/20'
                            )}
                        >
                            {Math.abs(metric.delta)}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
