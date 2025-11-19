'use client';

import { InventoryItem } from '@/lib/api';
import clsx from 'clsx';

interface VendingMachineProps {
    inventory: InventoryItem[];
    status: string; // "thinking", "idle", "restocking"
    thought: string;
}

export default function VendingMachine({ inventory, status, thought }: VendingMachineProps) {
    return (
        <div className="relative w-[512px] h-[896px] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-1000 bg-[#1a1a1a]">
            {/* Background Image - Darkened for contrast */}
            <img
                src="/zen_machine_bg.png"
                alt="Zen Vending Machine"
                className="absolute inset-0 w-full h-full object-cover opacity-80"
            />

            {/* Glass Reflection Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/5 pointer-events-none mix-blend-overlay" />

            {/* Inventory Overlay Area */}
            <div className="absolute top-[28%] left-[22%] right-[22%] bottom-[35%] flex flex-col justify-center gap-8 p-4">
                {inventory.map((item) => (
                    <div key={item.sku} className="relative group flex items-center justify-between">
                        {/* Product Label */}
                        <div className="flex flex-col">
                            <span className="text-[#f2f0e9] text-xs tracking-[0.2em] uppercase font-sans font-light opacity-90">{item.sku}</span>
                            <span className="text-[#8c6b5d] text-[10px] font-sans tracking-widest mt-1">${item.msrp.toFixed(2)}</span>
                        </div>

                        {/* Minimal Stock Indicators */}
                        <div className="flex gap-1.5">
                            {Array.from({ length: 5 }).map((_, i) => {
                                const filled = i < Math.ceil((item.stock / 20) * 5);
                                return (
                                    <div
                                        key={i}
                                        className={clsx(
                                            "w-1 h-4 rounded-full transition-all duration-700",
                                            filled ? "bg-[#f2f0e9] opacity-80" : "bg-[#2d2d2d] opacity-50"
                                        )}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Editorial Display Overlay */}
            <div className="absolute bottom-[18%] left-[20%] right-[20%] h-24 flex items-center justify-center">
                <div className="w-full flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-[1px] bg-[#4a5d4e] opacity-50 mb-2" />
                    <div className="font-serif text-sm text-[#f2f0e9] italic text-center opacity-90 leading-relaxed max-w-[80%]">
                        "{thought || "System Standby"}"
                    </div>
                </div>
            </div>
        </div>
    );
}
