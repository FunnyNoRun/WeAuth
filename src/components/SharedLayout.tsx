import { ReactNode, useState, useEffect } from "react";


export function SharedLayout({ children }: { children: ReactNode }) {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const rotateX = (mousePos.y - centerY) / 100;
    const rotateY = (centerX - mousePos.x) / 100;

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-[#fafafa] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-100 dark:selection:bg-emerald-900/30 selection:text-emerald-900 dark:selection:text-emerald-100">
            {/* Background Base */}
            <div className="fixed inset-0 z-0">
                {/* Modern Grid */}
                <div 
                    className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
                    style={{ 
                        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                        transition: 'transform 0.1s ease-out'
                    }}
                />
                
                {/* Floating Blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-200/20 dark:bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-200/20 dark:bg-teal-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                
                {/* Subtle Glow */}
                <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[60%] h-[20%] bg-linear-to-b from-emerald-50/50 dark:from-emerald-950/20 to-transparent opacity-50" />
            </div>

            {/* Content Area */}
            <div className="relative z-10 w-full min-h-screen flex flex-col items-center">
                {children}
            </div>

            {/* Subtle Noise Texture overlay */}
            <div className="fixed inset-0 z-1 pointer-events-none opacity-[0.03] mix-blend-overlay">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <filter id="noise">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noise)" />
                </svg>
            </div>
        </div>
    );
}
