'use client';

import { useEffect, useState } from 'react';
import { fetchTelemetry, EconomySnapshot } from '@/lib/api';
import EconomyNetwork from '@/components/EconomyNetwork';
import MarketTicker from '@/components/MarketTicker';

export default function Home() {
  const [data, setData] = useState<EconomySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pollTelemetry = async () => {
      try {
        const snapshot = await fetchTelemetry();
        setData(snapshot);
        setError(null);
      } catch (err) {
        setError('Failed to connect to economy engine');
        console.error(err);
      }
    };

    pollTelemetry();
    const interval = setInterval(pollTelemetry, 2000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400 font-mono text-sm">{error}</div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/40 font-mono text-sm animate-pulse">Initializing Economy...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 p-6">
        <h1 className="text-2xl font-serif text-white tracking-wider">The Agora</h1>
        <p className="text-xs font-mono text-white/40 mt-1">Autonomous AI Economy • {data.agents.length} Agents Active</p>
      </div>

      {/* Market Ticker */}
      <MarketTicker trades={data.trades} marketState={data.market_state} />

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Network Visualization */}
          <EconomyNetwork agents={data.agents} trades={data.trades} />

          {/* Agent Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {data.agents.map(agent => (
              <div key={agent.id} className="bg-black border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-mono text-white/80">{agent.persona}</div>
                  <div className="text-[10px] font-mono text-white/30">{agent.id}</div>
                </div>
                <div className="text-2xl font-serif text-white mb-4">
                  ${agent.total_value.toLocaleString()}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Cash</span>
                    <span className="text-white/80 font-mono">${Math.round(agent.cash).toLocaleString()}</span>
                  </div>
                  {Object.entries(agent.assets).map(([asset, qty]) => (
                    <div key={asset} className="flex justify-between text-xs">
                      <span className="text-white/40">{asset}</span>
                      <span className="text-white/80 font-mono">{qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Status */}
      <div className="border-t border-white/10 p-4 text-center text-[10px] font-mono text-white/30">
        System Status: {data.status} • Last Update: {new Date(data.generated_at).toLocaleTimeString()}
      </div>
    </main>
  );
}
