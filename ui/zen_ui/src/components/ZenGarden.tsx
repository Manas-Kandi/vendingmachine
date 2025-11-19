'use client';

export default function ZenGarden() {
    return (
        <div className="fixed bottom-0 left-0 right-0 h-48 pointer-events-none z-0">
            {/* Sand Gradient */}
            <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-[#E6E2D3] to-transparent opacity-90">
                {/* Raked patterns - subtle lines */}
                <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(90deg,transparent,transparent_49px,#000_50px)]" />
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_50%_100%,#000_0%,transparent_50%)]" />
            </div>
        </div>
    );
}
