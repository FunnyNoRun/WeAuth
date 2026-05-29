import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {Code2, Bot, ShieldCheck} from "lucide-react";
import { SharedLayout } from "./components/SharedLayout";
import AuthFlowView from "./views/AuthFlowView";

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
    // 简单的页面路由状态
    const [currentView, setCurrentView] = useState<"home" | "developer" | "bot">("home");

    return (
        <SharedLayout>
            {currentView === "home" && (
                <div className="w-full max-w-7xl px-8 flex flex-col md:flex-row items-center justify-between">
                    {/* 左侧文字与操作区 (原样保留) */}
                    <div className="flex flex-col items-start space-y-8 max-w-2xl">
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="flex items-center space-x-4">
                            <div className="p-3 bg-emerald-100 rounded-2xl">
                                <ShieldCheck className="w-12 h-12 text-emerald-600" />
                            </div>
                            <h1 className="text-6xl font-extrabold tracking-tight text-slate-800">
                                We<span className="text-emerald-600">Auth</span>
                            </h1>
                        </motion.div>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
                            <TypewriterText text="Wechat Oauth SDK Reverse | Implement Lptiyu-Wechat Oauth by Protocol" />
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.8, duration: 0.5 }} className="flex items-center space-x-6 pt-4">

                            {/* 点击进入开发者模式 */}
                            <button
                                onClick={() => setCurrentView("developer")}
                                className="group relative px-8 py-4 bg-white text-slate-600 font-medium rounded-xl shadow-sm border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 hover:shadow-md transition-all flex items-center space-x-2"
                            >
                                <Code2 className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                <span>我是开发者</span>
                            </button>

                            <button
                                onClick={() => setCurrentView("bot")}
                                className="group relative px-8 py-4 bg-emerald-600 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 hover:-translate-y-1 hover:shadow-emerald-500/40 transition-all flex items-center space-x-2">
                                <Bot className="w-5 h-5" />
                                <span>用于机器人</span>
                            </button>
                        </motion.div>
                    </div>
                </div>
            )}

            {currentView === "developer" && (
                <AuthFlowView onBack={() => setCurrentView("home")} />
            )}

            {currentView === "bot" && (
                <div className="w-full max-w-3xl px-4 flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-xl p-12 text-center"
                    >
                        <div className="text-8xl mb-6">🤖</div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-4">功能开发中</h2>
                        <p className="text-slate-500 mb-8">机器人集成功能即将上线，敬请期待！</p>
                        <button
                            onClick={() => setCurrentView("home")}
                            className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-500 transition-all"
                        >
                            返回主页
                        </button>
                    </motion.div>
                </div>
            )}
        </SharedLayout>
    );
}