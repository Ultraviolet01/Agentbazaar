import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, ShieldAlert, ShieldX, Info } from "lucide-react";
const ScanResultModal = ({ result, onClose }) => {
    const { status, outputData } = result;
    const getRiskDetails = (score) => {
        if (score < 20)
            return { label: "Safe", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: ShieldCheck };
        if (score < 50)
            return { label: "Caution", color: "text-amber-500", bg: "bg-amber-500/10", icon: Info };
        if (score < 80)
            return { label: "Warning", color: "text-orange-500", bg: "bg-orange-500/10", icon: ShieldAlert };
        return { label: "Danger", color: "text-red-500", bg: "bg-red-500/10", icon: ShieldX };
    };
    const risk = getRiskDetails(outputData?.riskScore || 0);
    const Icon = risk.icon;
    return (_jsx(AnimatePresence, { children: _jsxs("div", { className: "fixed inset-0 flex items-center justify-center z-[100000] font-sans", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0 bg-black/80 backdrop-blur-sm", onClick: onClose }), _jsxs(motion.div, { initial: { scale: 0.9, y: 20 }, animate: { scale: 1, y: 0 }, exit: { scale: 0.9, y: 20 }, className: "bg-[#0a0b0d] border border-white/10 w-full max-w-md p-8 rounded-[12px] relative z-10 shadow-2xl", children: [_jsx("button", { onClick: onClose, className: "absolute top-4 right-4 text-white/50 hover:text-white", children: _jsx(X, { size: 20 }) }), _jsxs("div", { className: "flex flex-col items-center space-y-6", children: [_jsx("div", { className: `w-20 h-20 rounded-full flex items-center justify-center ${risk.bg} border border-${risk.color}/20`, children: _jsx(Icon, { className: risk.color, size: 40 }) }), _jsxs("div", { className: "text-center", children: [_jsxs("p", { className: `text-sm font-bold uppercase tracking-widest ${risk.color}`, children: [risk.label, " Detected"] }), _jsxs("h2", { className: "text-3xl font-black text-white mt-1", children: ["Authenticity: ", 100 - (outputData?.riskScore || 0), "%"] })] }), _jsxs("div", { className: "w-full bg-[#13151a] p-5 rounded-[12px] border border-white/5 space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2", children: "Detected Entities" }), _jsx("div", { className: "flex flex-wrap gap-2", children: Object.entries(result.inputData?.elements || {}).map(([key, val]) => (val.length > 0 && _jsxs("span", { className: "bg-white/5 px-2 py-1 rounded text-[10px] text-white/70 border border-white/5", children: [val.length, " ", key] }, key))) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2", children: "Verdict Details" }), _jsx("ul", { className: "space-y-2", children: (outputData?.detections || ["All signals appear legitimate"]).map((d, i) => (_jsxs("li", { className: "text-xs text-white/80 flex items-start space-x-2", children: [_jsx("div", { className: "w-1 h-1 rounded-full bg-[#f5a623] mt-1.5" }), _jsx("span", { children: d })] }, i))) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 w-full pt-2", children: [_jsx("button", { className: "bg-[#f5a623] hover:bg-[#ff8c00] text-black font-bold py-3 rounded-[8px] text-sm transition-all transform active:scale-95", children: "Save to Project" }), _jsx("button", { onClick: onClose, className: "bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-[8px] text-sm border border-white/10 transition-all", children: "Run another scan" })] })] })] })] }) }));
};
export default ScanResultModal;
