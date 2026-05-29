import { motion } from "framer-motion";

export function EmeraldSpinner() {
    return (
        <div className="relative w-16 h-16 flex items-center justify-center">
            {/* 外层虚线发光环 */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-[3px] border-emerald-500/30 border-t-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                style={{ borderStyle: 'dashed solid solid solid' }}
            />
            {/* 内层反向实体环 */}
            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 rounded-full border-2 border-emerald-300 border-b-transparent opacity-80"
            />
            {/* 中心绿点呼吸 */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 bg-emerald-500 rounded-full"
            />
        </div>
    );
}