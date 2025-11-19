'use client';

import clsx from 'clsx';

interface AtmosphereProps {
    temperature: number;
    rain: number;
    hour: number;
}

export default function Atmosphere({ temperature, rain, hour }: AtmosphereProps) {
    // Determine time of day class
    const isNight = hour < 6 || hour > 19;
    const isSunset = hour >= 17 && hour <= 19;
    const isSunrise = hour >= 5 && hour <= 7;

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden transition-colors duration-[2000ms]">
            {/* Sky Gradient */}
            <div
                className={clsx(
                    "absolute inset-0 transition-all duration-[3000ms]",
                    isNight ? "bg-gradient-to-b from-slate-900 via-slate-800 to-stone-900" :
                        isSunset ? "bg-gradient-to-b from-indigo-900 via-purple-800 to-orange-300" :
                            isSunrise ? "bg-gradient-to-b from-blue-900 via-blue-400 to-orange-200" :
                                rain > 5 ? "bg-gradient-to-b from-slate-400 via-slate-300 to-stone-300" :
                                    "bg-gradient-to-b from-blue-400 via-blue-200 to-stone-100"
                )}
            />

            {/* Rain Effect */}
            {rain > 0 && (
                <div className="absolute inset-0 opacity-50 pointer-events-none">
                    {/* Simple CSS rain could go here, using a background image or multiple divs */}
                    <div className="absolute inset-0 bg-[url('https://raw.githubusercontent.com/manaskandimalla/assets/main/rain.png')] animate-rain" />
                </div>
            )}

            {/* Sun/Moon */}
            <div
                className={clsx(
                    "absolute w-32 h-32 rounded-full blur-2xl transition-all duration-[5000ms]",
                    isNight ? "bg-stone-100/20 top-10 right-20" :
                        "bg-yellow-200/60 top-10 left-20"
                )}
            />

            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://raw.githubusercontent.com/manaskandimalla/assets/main/noise.png')] bg-repeat" />

            {/* Fog/Mist for Zen feel */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/30 to-transparent blur-xl" />
        </div>
    );
}
