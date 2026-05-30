import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Zap, Shield, Cpu, ChevronRight, Download, Laptop, AlertCircle, X } from "lucide-react";
import { FaGithub, FaQq } from "react-icons/fa";
import { SharedLayout } from "./components/SharedLayout";

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

const Navbar = () => (
    <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-white/30 border-b border-white/20"
    >
        <div className="flex items-center space-x-2 group">
            <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-10 h-10 rounded-xl shadow-lg shadow-emerald-600/10 group-hover:rotate-12 transition-transform" 
            />
            <span className="text-xl font-black tracking-tighter text-slate-800">
                WE<span className="text-emerald-600">AUTH</span>
            </span>
        </div>

        <div className="flex items-center space-x-4 md:space-x-6">
            <a 
                href="https://github.com/FunnyNoRun/WeAuth" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm"
            >
                <FaGithub className="w-5 h-5" />
                <span className="hidden sm:inline">GitHub</span>
            </a>
            <div className="h-4 w-[1px] bg-slate-200" />
            <a 
                href="tencent://groupwpa/?subcmd=all&param=7B2267726F757055696E223A2231303930333936303730222C2274696D655374616D70223A313738303130363535303734322C22617574684B6579223A223754665656686F5A6263454D446274564559716873337958385A4F374C337A68486A345944436C76636C574A2B744D324F5069626C412B5655774B6D5A4C6371222C2261757468223A22227D"
                className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 transition-colors"
            >
                <FaQq className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">QQ 交流</span>
            </a>
        </div>
    </motion.nav>
);

export default function App() {
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Device detection
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            return /android|iphone|ipad|ipod/i.test(userAgent.toLowerCase());
        };
        
        const mobile = checkMobile();
        setIsMobile(mobile);

        // Deep Link logic
        const params = new URLSearchParams(window.location.search);
        const uuid = params.get("uuid");

        if (uuid && !mobile) {
            const deepLink = `weauth://wechat-oauth?uuid=${uuid}`;
            let hasBlurred = false;

            const handleBlur = () => {
                hasBlurred = true;
            };

            window.addEventListener('blur', handleBlur);

            // Attempt to redirect
            window.location.href = deepLink;

            // Timeout to show prompt if app didn't open
            const timer = setTimeout(() => {
                if (!hasBlurred) {
                    setShowInstallPrompt(true);
                }
                window.removeEventListener('blur', handleBlur);
            }, 2500);

            return () => {
                clearTimeout(timer);
                window.removeEventListener('blur', handleBlur);
            };
        }
        }, []);

        // Auto-hide prompt after 10 seconds
        useEffect(() => {
        if (showInstallPrompt) {
            const timer = setTimeout(() => {
                setShowInstallPrompt(false);
            }, 10000);
            return () => clearTimeout(timer);
        }
        }, [showInstallPrompt]);
    return (
        <SharedLayout>
            <Navbar />

            <main className="w-full max-w-7xl px-6 md:px-8 pt-24 pb-12 flex flex-col items-center">
                <AnimatePresence>
                    {showInstallPrompt && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20, x: "-50%" }}
                            animate={{ opacity: 1, y: 0, x: "-50%" }}
                            exit={{ opacity: 0, y: -20, x: "-50%" }}
                            className="fixed top-24 left-1/2 z-[100] w-[calc(100%-3rem)] max-w-2xl p-4 bg-white/90 backdrop-blur-xl border border-amber-200 rounded-2xl flex items-start space-x-4 shadow-2xl"
                        >
                            <div className="bg-amber-100 p-2 rounded-xl">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900">无法打开 WeAuth 客户端</h3>
                                <p className="text-sm text-slate-500 leading-relaxed mt-1">
                                    如果您已经安装了 WeAuth，请在浏览器弹窗中选择“允许”。如果尚未安装，请点击下方按钮前往下载最新版本。
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowInstallPrompt(false)}
                                className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-900"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="w-full flex flex-col items-center">
                    {/* Hero Section */}
                    <div className="w-full flex flex-col md:flex-row items-center justify-between py-8 md:py-16 gap-12">
                        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-8 max-w-2xl w-full">
                            <div className="space-y-4">
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold uppercase tracking-widest"
                                >
                                    <Zap className="w-3 h-3 fill-emerald-600" />
                                    <span>Next-Gen WeChat OAuth SDK</span>
                                </motion.div>
                                
                                <motion.h1 
                                    initial={{ opacity: 0, y: 20 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1] md:leading-[0.9]"
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
                                transition={{ delay: 0.5 }}
                                className="w-full max-w-lg p-4 rounded-xl bg-slate-900 shadow-2xl border border-slate-800 text-left"
                            >
                                <TypewriterText text="weauth.init_protocol_oauth('lptiyu-wechat')" />
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                transition={{ delay: 0.8 }} 
                                className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full"
                            >
                                <a
                                    href="https://github.com/FunnyNoRun/WeAuth/releases/latest"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group w-full sm:w-auto relative px-10 py-5 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 hover:-translate-y-1 transition-all flex items-center justify-center space-x-3 overflow-hidden"
                                >
                                    <Download className="w-5 h-5" />
                                    <span>立即下载 WeAuth</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                </a>

                                <div className="flex items-center space-x-2 text-slate-400 font-medium">
                                    <Laptop className="w-4 h-4" />
                                    <span className="text-sm">支持 Windows x64</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Side Visual */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1 }}
                            className="relative flex-1 flex justify-center items-center w-full"
                        >
                            <div className="relative w-64 h-64 md:w-96 md:h-96">
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
                                    <div className="p-6 md:p-8 bg-white rounded-[2rem] shadow-2xl border border-slate-100 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                                        <div className="w-40 h-40 md:w-64 md:h-64 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100">
                                            <img src="/logo.png" alt="Logo" className="w-2/3 h-2/3 opacity-80 rounded-3xl" />
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="h-2 w-20 md:w-24 bg-slate-100 rounded-full" />
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
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 md:mt-24">
                        <FeatureCard 
                            icon={Cpu}
                            title="Protocol Level"
                            desc="Deep reverse engineering of WeChat OAuth flow, providing direct protocol-based authentication without browser overhead."
                            delay={0.2}
                        />
                        <FeatureCard 
                            icon={Shield}
                            title="Secure & Private"
                            desc="Local execution with zero data storage on our servers. Your tokens and session data remain under your total control."
                            delay={0.4}
                        />
                        <FeatureCard 
                            icon={Zap}
                            title="Lightning Fast"
                            desc="Optimized Rust core ensures minimal latency and maximum reliability for your automation and bot workflows."
                            delay={0.6}
                        />
                    </div>
                </div>
            </main>
            
            <footer className="w-full py-12 px-8 flex flex-col items-center border-t border-slate-100 mt-24">
                <div className="flex items-center space-x-2 opacity-50 mb-4">
                    <img src="/logo.png" className="w-6 h-6 grayscale rounded-md" alt="" />
                    <span className="font-bold text-slate-900 tracking-tighter">WEAUTH</span>
                </div>
                <p className="text-slate-400 text-xs font-medium">
                    &copy; {new Date().getFullYear()} WeAuth Protocol SDK. Released under MIT License.
                </p>
            </footer>
        </SharedLayout>
    );
}
