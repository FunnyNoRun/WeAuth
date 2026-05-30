import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { Copy, Check, Terminal, ShieldCheck, User, Key, ArrowLeft, RefreshCw, QrCode, Fingerprint, X } from "lucide-react";
import { EmeraldSpinner } from "../components/EmeraldSpinner";

interface LogEntry { time: string; type: number; msg: string; }
interface TokenData { access_token: string; refresh_token: string; openid: string; unionid: string; }

const CopyableInput = ({ label, value, placeholder, icon: Icon }: { label: string; value: string; placeholder: string, icon: any }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value).then(_ => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col mb-5">
            <div className="flex items-center space-x-2 mb-2 pl-1">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
            </div>
            <div className="group relative">
                <input
                    readOnly
                    value={value}
                    placeholder={placeholder}
                    className={`w-full bg-white border ${value ? 'border-emerald-100 text-slate-700 shadow-sm' : 'border-slate-100 text-slate-400'} font-mono text-sm rounded-xl px-4 py-3.5 pr-12 focus:outline-none transition-all duration-300 group-hover:border-emerald-200`}
                />
                <button
                    onClick={handleCopy}
                    disabled={!value}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${value ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer' : 'text-slate-200 cursor-not-allowed'}`}
                >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};

export default function AuthFlowView({ onBack, uuid: externalUuid }: { onBack: () => void; uuid: string | null }) {
    const [status, setStatus] = useState("Initializing Engine...");
    const [qrBase64, setQrBase64] = useState("");
    const [nickname, setNickname] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    const [authCode, setAuthCode] = useState("");
    const [tokens, setTokens] = useState<TokenData | null>(null);

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [showLogs, setShowLogs] = useState(false);
    const [scannedUser, setScannedUser] = useState("");
    const hasInitialized = useRef(false);

    const [funnybotResponse, setFunnybotResponse] = useState<any>(null);
    const uuidUsed = useRef(false);

    const startFlow = () => {
        setStatus("Initializing...");
        setQrBase64("");
        setNickname("");
        setAvatarUrl("");
        setAuthCode("");
        setTokens(null);
        setFunnybotResponse(null);
        invoke("start_weauth_flow").catch(console.error);
    };

    const handleReset = () => {
        uuidUsed.current = false;
        setFunnybotResponse(null);
        startFlow();
    };

    useEffect(() => {
        if (!authCode) return;
        setStatus("Exchanging tokens...");
        invoke<TokenData>("exchange_token", { code: authCode })
            .then(async (data) => {
                setTokens(data);
                setStatus("Verification Success");

                if (externalUuid && !uuidUsed.current && data.refresh_token) {
                    uuidUsed.current = true;
                    setStatus("Sending to FunnyBot...");
                    try {
                        const response = await fetch("http://funnybot.h3cof6.com/wx/check-login", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ uuid: externalUuid, refresh_token: data.refresh_token })
                        });
                        const result = await response.json();
                        setFunnybotResponse(result);
                        setStatus(result.success ? "FunnyBot: Success" : "FunnyBot: Failed");
                    } catch (err) {
                        setFunnybotResponse({ success: false, msg: "Network error" });
                        setStatus("FunnyBot: Network Error");
                    }
                }
            })
            .catch((err) => {
                setStatus("Exchange Failed");
                console.error(err);
            });
    }, [authCode, externalUuid]);

    useEffect(() => {
        const unlisten = listen<{ event_type: number; message: string }>("weauth-event", (event) => {
            const { event_type, message } = event.payload;
            const now = new Date().toLocaleTimeString();

            setLogs(prev => {
                const lastLog = prev[prev.length - 1];
                if (lastLog && Math.abs(new Date(`1970-01-01 ${now}`).getTime() - new Date(`1970-01-01 ${lastLog.time}`).getTime()) < 1000) {
                    if (message.includes("等待扫码") || message.includes("等待确认")) return prev;
                    if ((lastLog.msg.includes("等待扫码") || lastLog.msg.includes("等待确认")) && !(message.includes("等待扫码") || message.includes("等待确认"))) {
                        return [...prev.slice(0, -1), { time: now, type: event_type, msg: message }];
                    }
                }
                return [...prev, { time: now, type: event_type, msg: message }];
            });

            switch (event_type) {
                case 0: setStatus(message); break;
                case 1: setQrBase64(message); setStatus("Please Scan QR Code"); break;
                case 2:
                    const userMatch = message.match(/\(用户:\s*(.*?)\)/);
                    const avatarMatch = message.match(/\|头像:\s*(.+)/);
                    if (userMatch && userMatch[1]) {
                        const currentUser = userMatch[1];
                        if (scannedUser !== currentUser) {
                            setScannedUser(currentUser);
                            setNickname(currentUser);
                            setStatus(`User: ${currentUser} (Awaiting Confirmation)`);
                        }
                    }
                    if (avatarMatch && avatarMatch[1] && avatarMatch[1] !== "无头像") setAvatarUrl(avatarMatch[1]);
                    break;
                case 3: setStatus("Auth Token Acquired"); break;
                case 4: setAuthCode(message.replace("授权码:", "").trim()); break;
                case -1:
                    setStatus(`Error: ${message}`);
                    setTimeout(() => invoke("start_weauth_flow").catch(console.error), 2000);
                    break;
            }
        });

        if (!hasInitialized.current) {
            hasInitialized.current = true;
            startFlow();
        }

        return () => {
            unlisten.then((f: UnlistenFn) => f());
        };
    }, []);

    return (
        <div className="w-full max-w-6xl px-4 flex flex-col items-center">
            {/* Action Bar */}
            <div className="w-full flex justify-between items-center mb-8">
                <button 
                    onClick={onBack} 
                    className="flex items-center space-x-2 text-slate-400 hover:text-emerald-600 transition-all font-bold text-sm uppercase tracking-widest group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Home</span>
                </button>
                
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleReset}
                        className="flex items-center space-x-2 bg-white text-slate-600 px-5 py-2.5 rounded-xl shadow-sm border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 transition-all text-sm font-bold"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Reset Session</span>
                    </button>
                    <div className="flex items-center space-x-3 bg-slate-900 text-white px-5 py-2.5 rounded-xl shadow-xl border border-slate-800">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-black uppercase tracking-widest">Secure Console</span>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="w-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden flex flex-col lg:flex-row min-h-150"
            >
                {/* Left: Identity & Scan */}
                <div className="w-full lg:w-[40%] p-12 flex flex-col items-center border-b lg:border-b-0 lg:border-r border-slate-50 bg-slate-50/30">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-black text-slate-800 mb-2">WeChat Verification</h2>
                        <div className="flex items-center justify-center space-x-2">
                            <motion.div 
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-2 h-2 rounded-full bg-emerald-500" 
                            />
                            <span className="text-emerald-600 font-bold text-sm uppercase tracking-wider italic">{status}</span>
                        </div>
                    </div>

                    <div className="relative group">
                        {/* QR Scanner Decoration */}
                        <div className="absolute -inset-4 border border-emerald-500/10 rounded-4xl pointer-events-none group-hover:border-emerald-500/20 transition-colors" />
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-emerald-500 rounded-tl-xl" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-emerald-500 rounded-tr-xl" />
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-emerald-500 rounded-bl-xl" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-emerald-500 rounded-br-xl" />

                        <div className="relative w-64 h-64 bg-white rounded-2xl shadow-inner flex items-center justify-center p-3 overflow-hidden">
                            <AnimatePresence mode="wait">
                                {!qrBase64 ? (
                                    <motion.div key="spinner" exit={{ opacity: 0 }} className="flex flex-col items-center">
                                        <EmeraldSpinner />
                                        <QrCode className="w-8 h-8 text-slate-200 mt-4 animate-pulse" />
                                    </motion.div>
                                ) : (
                                    <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full h-full">
                                        <img src={`data:image/png;base64,${qrBase64}`} className="w-full h-full object-contain rounded-lg" alt="QR" />
                                        {/* Scan Line Animation */}
                                        <motion.div 
                                            animate={{ top: ["0%", "100%", "0%"] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                            className="absolute left-0 right-0 h-0.5 bg-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.5)] z-10"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="mt-12 w-full max-w-xs">
                        <div className="relative p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 overflow-hidden">
                            <div className="absolute top-0 right-0 p-2">
                                <Fingerprint className="w-10 h-10 text-slate-50 opacity-10" />
                            </div>
                            <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 overflow-hidden shrink-0">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="User" className="w-full h-full object-cover scale-110" />
                                ) : (
                                    <User className="w-7 h-7 text-slate-300" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-slate-800 font-black text-lg truncate leading-tight">{nickname || "Scanning..."}</p>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Protocol Session</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Data & Results */}
                <div className="w-full lg:w-[60%] p-12 bg-white flex flex-col">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                            <Key className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Access Tokens</h3>
                            <p className="text-slate-400 text-xs font-medium">Derived protocol credentials and session identifiers.</p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-2">
                        <CopyableInput icon={Terminal} label="Authorization Code" value={authCode} placeholder="Awaiting manual scan..." />
                        <CopyableInput icon={ShieldCheck} label="Access Token" value={tokens?.access_token || ""} placeholder="Waiting for code exchange..." />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CopyableInput icon={User} label="OpenID" value={tokens?.openid || ""} placeholder="Waiting..." />
                            <CopyableInput icon={Fingerprint} label="UnionID" value={tokens?.unionid || ""} placeholder="Waiting..." />
                        </div>
                        
                        <div className="pt-2">
                            <CopyableInput icon={RefreshCw} label="Refresh Token" value={tokens?.refresh_token || ""} placeholder="Waiting..." />
                        </div>

                        {funnybotResponse && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mt-6 p-4 rounded-xl border ${funnybotResponse.success ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${funnybotResponse.success ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                                        {funnybotResponse.success ? (
                                            <Check className="w-5 h-5 text-emerald-600" />
                                        ) : (
                                            <X className="w-5 h-5 text-rose-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`font-bold text-sm ${funnybotResponse.success ? 'text-emerald-900' : 'text-rose-900'}`}>
                                            FunnyBot Response
                                        </h4>
                                        <p className={`text-xs mt-1 ${funnybotResponse.success ? 'text-emerald-700' : 'text-rose-700'}`}>
                                            {funnybotResponse.msg || 'No message'}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-slate-300">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted Session</span>
                        </div>
                        <button 
                            onClick={() => setShowLogs(!showLogs)}
                            className="text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors flex items-center space-x-2"
                        >
                            <Terminal className="w-3.5 h-3.5" />
                            <span>System Logs</span>
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Log Console Overlay */}
            <AnimatePresence>
                {showLogs && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="w-full mt-6 bg-slate-900 rounded-4xl overflow-hidden shadow-2xl border border-slate-800 ring-1 ring-white/10"
                    >
                        <div className="bg-slate-950/50 px-6 py-4 flex items-center justify-between border-b border-slate-800">
                            <div className="flex items-center space-x-3">
                                <div className="flex space-x-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                                </div>
                                <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] ml-2">Console Output</span>
                            </div>
                            <button onClick={() => setShowLogs(false)} className="text-slate-500 hover:text-white transition-colors">
                                <Check className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 h-64 overflow-y-auto font-mono text-xs space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            {logs.map((log, i) => (
                                <div key={i} className="flex space-x-4 group">
                                    <span className="text-slate-600 shrink-0 font-medium tabular-nums opacity-50 group-hover:opacity-100 transition-opacity">{log.time}</span>
                                    <div className="flex-1">
                                        {log.type === -1 ? (
                                            <span className="text-rose-400 font-medium tracking-tight">! ERROR: {log.msg}</span>
                                        ) : log.type === 1 || log.type === 3 ? (
                                            <span className="text-emerald-500/40 italic flex items-center space-x-2">
                                                <Key className="w-3 h-3" />
                                                <span>[PROTECTED BINARY DATA]</span>
                                            </span>
                                        ) : (
                                            <span className="text-slate-300 leading-relaxed">{log.msg}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
