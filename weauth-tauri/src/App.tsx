import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {Code2, Bot, ShieldCheck} from "lucide-react";

const TypewriterText = ({ text }: { text: string }) => {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(text.slice(0, i + 1));
                i++;
            } else {
                clearInterval(timer);
            }
        }, 40);
        return () => clearInterval(timer);
    }, [text]);

    return (
        <div className="font-mono text-gray-500 text-lg md:text-xl border-r-2 border-emerald-500 pr-1 animate-pulse h-8">
            {displayedText}
        </div>
    );
};

export default function App() {
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
    const rotateX = (mousePos.y - centerY) / 20;
    const rotateY = (centerX - mousePos.x) / 20;

    const gridTransform = {
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`,
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center">
            {/* 1. 底层背景：网格 + 右侧极光渐变 */}
            <div className="absolute inset-0 bg-grid-pattern z-0" style={gridTransform} />
            <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-emerald-100/80 to-transparent z-0" />

            {/* 2. 核心内容区 */}
            <div className="relative z-10 w-full max-w-7xl px-8 flex flex-col md:flex-row items-center justify-between mt-[-10vh]">

                {/* 左侧文字与操作区 */}
                <div className="flex flex-col items-start space-y-8 max-w-2xl">

                    {/* Logo 与 大标题 (滑入动画) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex items-center space-x-4"
                    >
                        <div className="p-3 bg-emerald-100 rounded-2xl">
                            <img src="/logo.png" alt="WeAuth Logo" className="w-12 h-12" />
                        </div>
                        <h1 className="text-6xl font-extrabold tracking-tight text-slate-800">
                            We<span className="text-emerald-600">Auth</span>
                        </h1>
                    </motion.div>

                    {/* 副标题 (打字机动画) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        <TypewriterText text="Wechat Oauth SDK Reverse | Implement Lptiyu-Wechat Oauth by Protocol" />
                    </motion.div>

                    {/* 按钮组 (弹现动画) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.8, duration: 0.5 }} // 等打字机差不多打完再显示
                        className="flex items-center space-x-6 pt-4"
                    >
                        {/* 左侧白色按钮：我是开发者 */}
                        <button className="group relative px-8 py-4 bg-white text-slate-600 font-medium rounded-xl shadow-sm border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 hover:shadow-md transition-all flex items-center space-x-2">
                            <Code2 className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                            <span>我是开发者</span>
                        </button>

                        {/* 右侧绿色按钮：用于机器人 */}
                        <button className="group relative px-8 py-4 bg-emerald-600 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 hover:-translate-y-1 hover:shadow-emerald-500/40 transition-all flex items-center space-x-2">
                            <Bot className="w-5 h-5" />
                            <span>用于机器人</span>
                        </button>
                    </motion.div>
                </div>

                {/* 右侧巨大 Logo 背景 (无限呼吸浮动动画) */}
                {/*<motion.div*/}
                {/*    animate={{ y: [0, -30, 0] }} // 上下浮动*/}
                {/*    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}*/}
                {/*    className="hidden md:block absolute right-0 z-[1]"*/}
                {/*>*/}
                {/*    <img src="/big_logo.png" alt="WeAuth Background" className="w-[600px] h-[600px] opacity-60 drop-shadow-2xl" />*/}
                {/*</motion.div>*/}

                <motion.div
                    animate={{ y: [0, -30, 0] }} // 上下浮动
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="hidden md:block absolute right-0 -z-10"
                >
                    <ShieldCheck
                        className="w-[600px] h-[600px] text-emerald-600 opacity-10"
                        strokeWidth={0.5}
                    />
                </motion.div>

            </div>
        </div>
    );
}