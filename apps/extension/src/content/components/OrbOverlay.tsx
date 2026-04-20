import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Search } from "lucide-react";
import ScanResultModal from "./ScanResultModal";

const OrbOverlay = () => {
  const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleOrbClick = () => {
    if (isDragging) return;
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

  const announceVerdict = (risk: string) => {
    const utterance = new SpeechSynthesisUtterance(`ScamSniff detection complete. Risk level is ${risk}`);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
        style={{ position: "fixed", left: position.x, top: position.y, zIndex: 99999 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <div 
          onClick={handleOrbClick}
          className={`w-16 h-16 rounded-full flex items-center justify-center cursor-pointer shadow-2xl transition-all duration-500 bg-[#f5a623] border-4 border-black/20 ${isScanning ? 'animate-spin' : 'animate-pulse'}`}
        >
          {isScanning ? <Search size={24} className="text-black" /> : <ShieldAlert size={24} className="text-black" />}
          
          <div className="absolute -top-1 -right-1 bg-black text-[#f5a623] text-[9px] font-bold px-1.5 rounded-full border border-[#f5a623]/30">
            50
          </div>
        </div>
      </motion.div>

      {scanResult && (
        <ScanResultModal 
          result={scanResult} 
          onClose={() => setScanResult(null)} 
        />
      )}
    </>
  );
};

export default OrbOverlay;
