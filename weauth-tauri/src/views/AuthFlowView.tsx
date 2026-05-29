import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { MessageCircle, Copy, Check, Terminal, ShieldCheck, User, Key } from "lucide-react";
import { EmeraldSpinner } from "../components/EmeraldSpinner";

interface LogEntry { time: string; type: number; msg: string; }
interface TokenData { access_token: string; refresh_token: string; openid: string; unionid: string; }

// --- 优雅的复用组件：可复制输入框 ---
const CopyableInput = ({ label, value, placeholder }: { label: string; value: string; placeholder: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-1">{label}</span>
            <div className="relative">
                <input
                    readOnly
                    value={value}
                    placeholder={placeholder}
                    className={`w-full bg-slate-50 border ${value ? 'border-emerald-200 text-slate-700' : 'border-slate-100 text-slate-400'} font-mono text-xs rounded-xl px-3 py-2.5 pr-10 focus:outline-none transition-colors`}
                />
                <button
                    onClick={handleCopy}
                    disabled={!value}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${value ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};

export default function AuthFlowView({ onBack }: { onBack: () => void }) {
    const [status, setStatus] = useState("正在初始化引擎...");
    const [qrBase64, setQrBase64] = useState("");
    const [nickname, setNickname] = useState("");

    const [authCode, setAuthCode] = useState("");
    const [tokens, setTokens] = useState<TokenData | null>(null);
    const [isCompleted, setIsCompleted] = useState(false);

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [showLogs, setShowLogs] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (showLogs) logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs, showLogs]);

    const startFlow = () => {
        setStatus("正在初始化引擎...");
        setQrBase64("");
        setNickname("");
        setAuthCode("");
        setTokens(null);
        setIsCompleted(false);
        invoke("start_weauth_flow").catch(console.error);
    };

    const handleReset = () => {
        startFlow();
    };

    // 核心：当获取到 authCode 时，自动向 Rust 请求 Token
    useEffect(() => {
        if (!authCode) return;

        setStatus("正在换取微信 Access Token...");
        invoke<TokenData>("exchange_token", { code: authCode })
            .then((data) => {
                setTokens(data);
                setStatus("全流程验证通过，数据已就绪！");
                setIsCompleted(true);
            })
            .catch((err) => {
                setStatus("Token换取失败");
                console.error(err);
            });
    }, [authCode]);

    useEffect(() => {
        const unlisten = listen<{ event_type: number; message: string }>("weauth-event", (event) => {
            const { event_type, message } = event.payload;
            const now = new Date().toLocaleTimeString();
            setLogs(prev => [...prev, { time: now, type: event_type, msg: message }]);

            switch (event_type) {
                case 0: setStatus(message); break;
                case 1: setQrBase64(message); setStatus("请使用微信扫描二维码"); break;
                case 2:
                    setStatus(message);
                    const match = message.match(/\(用户:\s*(.*?)\)/);
                    if (match && match[1]) setNickname(match[1]);
                    break;
                case 3: setStatus("获取底层鉴权令牌成功"); break;
                case 4:
                    const code = message.replace("授权码:", "").trim();
                    setAuthCode(code);
                    break;
                case -1:
                    setStatus(`错误: ${message}，正在重试...`);
                    setTimeout(() => {
                        invoke("start_weauth_flow").catch(console.error);
                    }, 2000);
                    break;
            }
        });

        startFlow();
        return () => { unlisten.then(f => f()); };
    }, []);

    return (
        <div className="w-full max-w-5xl px-4 flex flex-col items-center">
            {/* 顶栏控制 */}
            <div className="w-full flex justify-between items-center mb-6">
                <button onClick={onBack} className="text-slate-500 hover:text-emerald-600 transition-colors">← 返回主页</button>
                <div className="flex items-center space-x-3">
                    {isCompleted && (
                        <button
                            onClick={handleReset}
                            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-sm hover:bg-emerald-500 transition-all"
                        >
                            <span>重新开始</span>
                        </button>
                    )}
                    <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        <span className="font-semibold text-slate-700">Developer Mode</span>
                    </div>
                </div>
            </div>

            {/* 核心玻璃态卡片 */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">

                {/* 左半部分：状态与扫码区 */}
                <div className="w-full md:w-[45%] p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200/60 bg-gradient-to-b from-white to-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">连接验证</h2>
                    <p className="text-emerald-600 font-medium mb-8 h-6 text-center">{status}</p>

                    <div className="relative w-64 h-64 bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center p-2 mb-6">
                        <AnimatePresence mode="wait">
                            {!qrBase64 ? (
                                <motion.div key="spinner" exit={{ opacity: 0 }} className="flex flex-col items-center">
                                    <EmeraldSpinner />
                                    <span className="mt-4 text-sm text-slate-400">正在生成验证码...</span>
                                </motion.div>
                            ) : (
                                <motion.img key="qr" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} src={`data:image/png;base64,${qrBase64}`} className="w-full h-full object-contain rounded-xl shadow-sm" alt="Wechat QR" />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* 用户身份展示 */}
                    <div className="w-full flex items-center space-x-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner shrink-0">
                            {nickname ? <User className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                        </div>
                        <div className="min-w-0 overflow-hidden">
                            <p className="text-slate-800 font-bold text-base truncate">{nickname || "等待扫码接入..."}</p>
                            <p className="text-slate-400 text-xs">WeChat Identity Session</p>
                        </div>
                    </div>
                </div>

                {/* 右半部分：凭据展示区 (紧凑排列) */}
                <div className="w-full md:w-[55%] p-8 bg-slate-50/30">
                    <div className="flex items-center space-x-2 mb-6">
                        <Key className="w-5 h-5 text-slate-400" />
                        <h3 className="font-bold text-slate-700">Authentication Credentials</h3>
                    </div>

                    <div className="space-y-1">
                        <CopyableInput label="Oauth Auth Code" value={authCode} placeholder="等待扫码下发..." />
                        <CopyableInput label="Access Token" value={tokens?.access_token || ""} placeholder="等待换取..." />
                        <CopyableInput label="Refresh Token" value={tokens?.refresh_token || ""} placeholder="等待换取..." />

                        {/* OpenID 和 UnionID 并排显示节省空间 */}
                        <div className="flex space-x-3">
                            <div className="flex-1">
                                <CopyableInput label="Open ID" value={tokens?.openid || ""} placeholder="等待换取..." />
                            </div>
                            <div className="flex-1">
                                <CopyableInput label="Union ID" value={tokens?.unionid || ""} placeholder="等待换取..." />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 终端日志切换与面板 (保持你之前的原样即可，为了精简回答这里省略了展开面板代码) */}
            <div className="w-full mt-4 flex justify-end">
                <button onClick={() => setShowLogs(!showLogs)} className="flex items-center space-x-2 text-sm text-slate-500 hover:text-emerald-600 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 transition-all">
                    <Terminal className="w-4 h-4" />
                    <span>{showLogs ? "隐藏详细日志" : "查看执行日志"}</span>
                </button>
            </div>

            {/* 终端日志面板 */}
            <AnimatePresence>
                {showLogs && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full mt-4 bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800"
                    >
                        <div className="bg-slate-950 px-4 py-2 flex items-center space-x-2">
                            <div className="flex space-x-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                            </div>
                            <span className="text-slate-500 text-xs font-mono ml-2">weauth-core-stdout</span>
                        </div>
                        <div className="p-4 h-48 overflow-y-auto font-mono text-sm space-y-1">
                            {logs.map((log, i) => (
                                <div key={i} className="flex space-x-3">
                                    <span className="text-slate-600 shrink-0">[{log.time}]</span>
                                    {log.type === -1 ? (
                                        <span className="text-red-400">{log.msg}</span>
                                    ) : log.type === 1 || log.type === 3 ? (
                                        <span className="text-blue-400/70 italic">[Binary Data Hidden]</span>
                                    ) : (
                                        <span className="text-emerald-400/90">{log.msg}</span>
                                    )}
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}