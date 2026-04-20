import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Search } from "lucide-react";
import ScanResultModal from "./ScanResultModal";
const OrbOverlay = () => {
    const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const handleOrbClick = () => {
        if (isDragging)
            return;
        performScan();
    };
    const performScan = async () => {
        setIsScanning(true);
        // Extract page data
        const pageData = {
            url: window.location.href,
            title: document.title,
            elements: extractPageEntities()
        };
        chrome.runtime.sendMessage({ action: "runScan", data: pageData }, (response) => {
            setIsScanning(false);
            if (response.success) {
                setScanResult(response.data);
                announceVerdict(response.data.outputData?.riskLevel || "Safe");
            }
        });
    };
    const extractPageEntities = () => {
        const text = document.body.innerText;
        return {
            contracts: text.match(/0x[a-fA-F0-9]{40}/g) || [],
            handles: text.match(/@([a-zA-Z0-9_]+)/g) || [],
            tickers: text.match(/\$[A-Z]{2,6}/g) || []
        };
    };
    const announceVerdict = (risk) => {
        const utterance = new SpeechSynthesisUtterance(`ScamSniff detection complete. Risk level is ${risk}`);
        window.speechSynthesis.speak(utterance);
    };
    return (_jsxs(_Fragment, { children: [_jsx(motion.div, { drag: true, dragMomentum: false, onDragStart: () => setIsDragging(true), onDragEnd: () => setTimeout(() => setIsDragging(false), 100), style: { position: "fixed", left: position.x, top: position.y, zIndex: 99999 }, whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 }, children: _jsxs("div", { onClick: handleOrbClick, className: `w-16 h-16 rounded-full flex items-center justify-center cursor-pointer shadow-2xl transition-all duration-500 bg-[#f5a623] border-4 border-black/20 ${isScanning ? 'animate-spin' : 'animate-pulse'}`, children: [isScanning ? _jsx(Search, { size: 24, className: "text-black" }) : _jsx(ShieldAlert, { size: 24, className: "text-black" }), _jsx("div", { className: "absolute -top-1 -right-1 bg-black text-[#f5a623] text-[9px] font-bold px-1.5 rounded-full border border-[#f5a623]/30", children: "50" })] }) }), scanResult && (_jsx(ScanResultModal, { result: scanResult, onClose: () => setScanResult(null) }))] }));
};
export default OrbOverlay;
