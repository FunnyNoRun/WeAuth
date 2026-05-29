import { ReactNode, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

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
    const rotateX = (mousePos.y - centerY) / 40;
    const rotateY = (centerX - mousePos.x) / 40;

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-slate-50">
            {/* 网格背景带鼠标视差 */}
            <div
                className="absolute inset-0 bg-grid-pattern z-0"
                style={{ transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)` }}
            />
            <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-emerald-100/60 to-transparent z-0 pointer-events-none" />

            <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="hidden md:block absolute right-[-5%] top-[10%] -z-10 pointer-events-none"
            >
                <ShieldCheck className="w-[800px] h-[800px] text-emerald-600 opacity-5" strokeWidth={0.5} />
            </motion.div>

            <motion.div
                animate={{ y: [0, -30, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 z-[1]"
            >
                <ShieldCheck
                    className="w-[600px] h-[600px] text-emerald-600 opacity-10"
                    strokeWidth={0.5}
                />
            </motion.div>

            {/* 内容区 */}
            <div className="relative z-10 w-full min-h-screen flex items-center justify-center">
                {children}
            </div>
        </div>
    );
}