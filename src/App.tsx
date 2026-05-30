import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Bot, ExternalLink, Zap, Shield, Cpu, ChevronRight } from "lucide-react";
import { FaGithub } from "react-icons/fa";
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
        }, 30);
        return () => clearInterval(timer);
    }, [text]);

    return (
        <div className="font-mono text-emerald-600/80 text-sm md:text-base pr-1 h-6 flex items-center">
            <span className="mr-2 text-slate-400">$</span>
            {displayedText}
            <motion.span 
                animate={{ opacity: [1, 0] }} 
                transition={{ duration: 0.8, repeat: Infinity }}
                className="w-2 h-4 bg-emerald-500 ml-1"
            />
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="group p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-200/50 hover:border-emerald-500/30 hover:bg-white/80 transition-all duration-300 shadow-sm hover:shadow-md"
    >
        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </motion.div>
);

const Navbar = ({ onHome }: { onHome: () => void }) => (
    <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between"
    >
        <div 
            onClick={onHome}
            className="flex items-center space-x-2 cursor-pointer group"
        >
            <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-10 h-10 rounded-xl shadow-lg shadow-emerald-600/10 group-hover:rotate-12 transition-transform" 
            />
            <span className="text-xl font-black tracking-tighter text-slate-800">
                WE<span className="text-emerald-600">AUTH</span>
            </span>
        </div>

        <div className="flex items-center space-x-6">
            <a 
                href="https://github.com/FunnyNoRun/WeAuth" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm"
            >
                <FaGithub className="w-5 h-5" />
                <span>GitHub</span>
            </a>
            <div className="h-4 w-[1px] bg-slate-200" />
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                v0.1.0-alpha
            </span>
        </div>
    </motion.nav>
);

export default function App() {
    const [currentView, setCurrentView] = useState<"home" | "developer" | "bot">("home");

    return (
        <SharedLayout>
            <Navbar onHome={() => setCurrentView("home")} />

            <main className="w-full max-w-7xl px-8 pt-24 pb-12 flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    {currentView === "home" && (
                        <motion.div 
                            key="home"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full flex flex-col items-center"
                        >
                            {/* Hero Section */}
                            <div className="w-full flex flex-col md:flex-row items-center justify-between py-12 gap-12">
                                <div className="flex flex-col items-start space-y-8 max-w-2xl">
                                    <div className="space-y-4">
                                        <motion.div 
                                            initial={{ opacity: 0, x: -20 }} 
                                            animate={{ opacity: 1, x: 0 }} 
                                            transition={{ duration: 0.6 }}
                                            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold uppercase tracking-widest"
                                        >
                                            <Zap className="w-3 h-3 fill-emerald-600" />
                                            <span>Next-Gen WeChat OAuth SDK</span>
                                        </motion.div>
                                        
                                        <motion.h1 
                                            initial={{ opacity: 0, y: 20 }} 
                                            animate={{ opacity: 1, y: 0 }} 
                                            transition={{ delay: 0.2, duration: 0.8 }}
                                            className="text-7xl font-black tracking-tight text-slate-900 leading-[0.9]"
                                        >
                                            Simplify Your <br />
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                                                Auth Flow
                                            </span>
                                        </motion.h1>
                                    </div>

                                    <motion.div 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        transition={{ delay: 0.8 }}
                                        className="w-full max-w-lg p-4 rounded-xl bg-slate-900 shadow-2xl border border-slate-800"
                                    >
                                        <TypewriterText text="weauth.init_protocol_oauth('lptiyu-wechat')" />
                                    </motion.div>

                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        transition={{ delay: 1.2, duration: 0.5 }} 
                                        className="flex items-center space-x-4 w-full"
                                    >
                                        <button
                                            onClick={() => setCurrentView("developer")}
                                            className="group relative px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 hover:-translate-y-1 transition-all flex items-center space-x-3 overflow-hidden"
                                        >
                                            <Code2 className="w-5 h-5" />
                                            <span>我是开发者</span>
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        </button>

                                        <button
                                            onClick={() => setCurrentView("bot")}
                                            className="group px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-200 hover:text-emerald-600 hover:shadow-md transition-all flex items-center space-x-3"
                                        >
                                            <Bot className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                            <span>用于机器人</span>
                                        </button>
                                    </motion.div>
                                </div>

                                {/* Right Side Visual */}
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4, duration: 1 }}
                                    className="relative flex-1 flex justify-center items-center"
                                >
                                    <div className="relative w-72 h-72 md:w-96 md:h-96">
                                        <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-[80px] animate-pulse" />
                                        <motion.div 
                                            animate={{ 
                                                rotate: 360,
                                                borderRadius: ["30% 70% 70% 30% / 30% 30% 70% 70%", "70% 30% 30% 70% / 70% 70% 30% 30%", "30% 70% 70% 30% / 30% 30% 70% 70%"] 
                                            }}
                                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 border-2 border-emerald-500/20"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="p-8 bg-white rounded-[2rem] shadow-2xl border border-slate-100 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                                                <div className="w-48 h-48 md:w-64 md:h-64 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100">
                                                    <img src="/logo.png" alt="Logo" className="w-2/3 h-2/3 opacity-80 rounded-3xl" />
                                                </div>
                                                <div className="mt-4 flex items-center justify-between">
                                                    <div className="h-2 w-24 bg-slate-100 rounded-full" />
                                                    <div className="h-6 w-6 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                                        <Shield className="w-3 h-3 text-emerald-600" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Features Grid */}
                            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                                <FeatureCard 
                                    icon={Cpu}
                                    title="Protocol Level"
                                    desc="Deep reverse engineering of WeChat OAuth flow, providing direct protocol-based authentication without browser overhead."
                                    delay={1.4}
                                />
                                <FeatureCard 
                                    icon={Shield}
                                    title="Secure & Private"
                                    desc="Local execution with zero data storage on our servers. Your tokens and session data remain under your total control."
                                    delay={1.6}
                                />
                                <FeatureCard 
                                    icon={Zap}
                                    title="Lightning Fast"
                                    desc="Optimized Rust core ensures minimal latency and maximum reliability for your automation and bot workflows."
                                    delay={1.8}
                                />
                            </div>
                        </motion.div>
                    )}

                    {currentView === "developer" && (
                        <motion.div 
                            key="developer"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full"
                        >
                            <AuthFlowView onBack={() => setCurrentView("home")} />
                        </motion.div>
                    )}

                    {currentView === "bot" && (
                        <motion.div
                            key="bot"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-2xl bg-white/70 backdrop-blur-xl border border-white/50 rounded-[3rem] shadow-2xl p-16 text-center"
                        >
                            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                                <Bot className="w-12 h-12 text-emerald-600" />
                            </div>
                            <h2 className="text-4xl font-black text-slate-800 mb-4">Coming Soon</h2>
                            <p className="text-slate-500 text-lg mb-12 max-w-md mx-auto leading-relaxed">
                                Our Bot Integration API is currently under heavy development. 
                                We're building a seamless way to inject tokens directly into your bot instances.
                            </p>
                            <div className="flex flex-col items-center space-y-4">
                                <button
                                    onClick={() => setCurrentView("home")}
                                    className="px-10 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
                                >
                                    Return to Home
                                </button>
                                <a 
                                    href="https://github.com/FunnyNoRun/WeAuth" 
                                    target="_blank" 
                                    className="flex items-center space-x-2 text-slate-400 hover:text-emerald-600 transition-colors text-sm font-medium"
                                >
                                    <span>Follow updates on GitHub</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </SharedLayout>
    );
}
