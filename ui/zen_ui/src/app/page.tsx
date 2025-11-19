'use client';

import { useEffect, useState } from 'react';
import { fetchTelemetry, TelemetrySnapshot } from '@/lib/api';
import VendingMachine from '@/components/VendingMachine';
import TelemetryPanel from '@/components/TelemetryPanel';
import { CircleNotch, Info } from '@phosphor-icons/react';

export default function Home() {
  const [data, setData] = useState<TelemetrySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMetrics, setShowMetrics] = useState(false);

  useEffect(() => {
    const poll = async () => {
      try {
        const snapshot = await fetchTelemetry();
        setData(snapshot);
      } catch (err) {
        // Silent fail in zen mode
      } finally {
        setLoading(false);
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <CircleNotch className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  const currentTemp = data?.metrics.find(m => m.id === 'temperature')?.value || 20;
  const currentRain = data?.metrics.find(m => m.id === 'rain')?.value || 0;
  // Parse hour from ISO string if needed, or assume backend sends it. 
  // The backend sends 'generatedAt', so we can parse that.
  const currentHour = data ? new Date(data.generatedAt).getHours() : 12;

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-[#1a1a1a]">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/zen_machine_bg.png"
          alt="Background"
          className="w-full h-full object-cover opacity-20 blur-3xl scale-110 grayscale-[0.5]"
        />
        <div className="absolute inset-0 bg-[#1a1a1a]/80 mix-blend-multiply" />
        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('https://raw.githubusercontent.com/manaskandimalla/assets/main/noise.png')] bg-repeat mix-blend-overlay" />
      </div>

      {/* Main Vending Machine */}
      <div className="z-10 relative animate-in fade-in zoom-in duration-1000">
        {data && (
          <VendingMachine
            inventory={data.inventory}
            status="idle"
            thought={data.reasoning}
          />
        )}
      </div>

      {/* Toggle Metrics */}
      <button
        onClick={() => setShowMetrics(!showMetrics)}
        className="absolute top-8 right-8 z-20 p-3 rounded-full text-[#f2f0e9]/40 hover:text-[#f2f0e9] hover:bg-[#f2f0e9]/5 transition-all duration-500"
      >
        <Info size={20} weight="light" />
      </button>

      {/* Metrics Overlay */}
      {showMetrics && data && (
        <div className="absolute inset-0 z-30 bg-[#1a1a1a]/90 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-500" onClick={() => setShowMetrics(false)}>
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <TelemetryPanel metrics={data.metrics} />
            <div className="mt-12 text-center text-[#f2f0e9]/30 text-[10px] font-sans tracking-[0.3em] uppercase">
              Tap anywhere to close
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
