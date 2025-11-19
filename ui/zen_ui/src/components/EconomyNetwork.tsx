'use client';

import { useEffect, useRef, useState } from 'react';
import { AgentView, Trade } from '@/lib/api';
import clsx from 'clsx';

interface EconomyNetworkProps {
    agents: AgentView[];
    trades: Trade[];
}

export default function EconomyNetwork({ agents, trades }: EconomyNetworkProps) {
    // Simple circular layout for agents
    const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || agents.length === 0) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        const radius = Math.min(width, height) * 0.35;
        const centerX = width / 2;
        const centerY = height / 2;

        const newPositions: Record<string, { x: number; y: number }> = {};
        agents.forEach((agent, index) => {
            const angle = (index / agents.length) * 2 * Math.PI - Math.PI / 2;
            newPositions[agent.id] = {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });
        setPositions(newPositions);
    }, [agents.length]);

    // Visualize recent trades as flying particles
    const [particles, setParticles] = useState<Array<{ id: string; start: { x: number, y: number }; end: { x: number, y: number }; color: string }>>([]);

    useEffect(() => {
        // Detect new trades
        const recent = trades.slice(0, 3); // Just animate last few
        const newParticles = recent.map(t => {
            const start = positions[t.seller_id];
            const end = positions[t.buyer_id];
            if (!start || !end) return null;

            return {
                id: t.id,
                start,
                end,
                color: t.asset === 'COMPUTE' ? '#60a5fa' : t.asset === 'DATA' ? '#34d399' : '#f472b6'
            };
        }).filter(Boolean) as any[];

        setParticles(newParticles);

        const timer = setTimeout(() => setParticles([]), 1000); // Clear after animation
        return () => clearTimeout(timer);
    }, [trades, positions]);

    return (
        <div ref={containerRef} className="relative w-full h-[600px] bg-[#0a0a0a] rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Connection Lines (All-to-All faint) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                {agents.map((a1, i) =>
                    agents.slice(i + 1).map(a2 => {
                        const p1 = positions[a1.id];
                        const p2 = positions[a2.id];
                        if (!p1 || !p2) return null;
                        return (
                            <line
                                key={`${a1.id}-${a2.id}`}
                                x1={p1.x} y1={p1.y}
                                x2={p2.x} y2={p2.y}
                                stroke="#ffffff"
                                strokeWidth="1"
                            />
                        );
                    })
                )}
            </svg>

            {/* Trade Particles */}
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] z-20 animate-ping"
                    style={{
                        left: 0,
                        top: 0,
                        backgroundColor: p.color,
                        color: p.color,
                        transform: `translate(${p.start.x}px, ${p.start.y}px)`,
                        animation: `fly 1s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                        // Note: complex animation usually needs keyframes in CSS or WAAPI
                        // For simplicity in this step, we rely on a basic transition or just static placement
                        // To make it fly, we'd need dynamic style injection or a library like Framer Motion.
                        // Let's use a simple transition approach for now.
                    }}
                />
            ))}

            {/* Agents */}
            {agents.map(agent => {
                const pos = positions[agent.id];
                if (!pos) return null;

                return (
                    <div
                        key={agent.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer transition-all duration-500"
                        style={{ left: pos.x, top: pos.y }}
                    >
                        {/* Node */}
                        <div className={clsx(
                            "w-16 h-16 rounded-full bg-black border-2 flex items-center justify-center relative z-10 transition-all duration-300 group-hover:scale-110",
                            agent.persona === 'Whale' ? "border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.4)]" :
                                agent.persona === 'Scalper' ? "border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]" :
                                    "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                        )}>
                            <div className="text-[10px] font-mono text-white/80 text-center leading-tight">
                                {agent.persona}<br />
                                <span className="text-[8px] opacity-50">{agent.id.slice(0, 4)}</span>
                            </div>
                        </div>

                        {/* Stats Tooltip */}
                        <div className="absolute top-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur border border-white/10 p-3 rounded-lg w-48 pointer-events-none z-30">
                            <div className="text-xs font-mono text-white mb-2 border-b border-white/10 pb-1">Portfolio Value: ${agent.total_value.toLocaleString()}</div>
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-white/60">
                                <div>Cash: ${Math.round(agent.cash)}</div>
                                {Object.entries(agent.assets).map(([k, v]) => (
                                    <div key={k}>{k}: {v}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Central Hub Label */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="text-4xl font-bold text-white/5 tracking-[0.5em] font-serif">AGORA</div>
            </div>
        </div>
    );
}
