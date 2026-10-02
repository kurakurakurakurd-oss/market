import React, { useState } from 'react';
import { Download, MonitorSmartphone, WifiOff, Share2 } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { PublishSellGuideModal } from './PublishSellGuideModal';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showGuideModal, setShowGuideModal] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Offline indicator */}
        {!isOnline && (
          <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2 py-1 rounded-xl text-[11px] font-medium animate-pulse">
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ئۆفلاین (داتا پارێزراوە)</span>
          </div>
        )}

        {/* Direct Install prompt button if available */}
        {isInstallable && !isInstalled && (
          <button
            onClick={install}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)] border border-emerald-500 transition-all active:scale-95"
            title="دابەزاندنی بەرنامە لەسەر کۆمپیوتەر یان مۆبایل"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">داگرتنی ئەپ</span>
          </button>
        )}

        {/* Button to open Guide & Instructions Modal */}
        <button
          onClick={() => setShowGuideModal(true)}
          className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-900/40 hover:border-emerald-600/60 shadow-inner transition-all active:scale-95"
          title="Connect to Device (PC & مۆبایل & GitHub)"
        >
          <MonitorSmartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Connect to Device</span>
          <span className="sm:hidden">Connect</span>
        </button>
      </div>

      <PublishSellGuideModal 
        isOpen={showGuideModal} 
        onClose={() => setShowGuideModal(false)} 
      />
    </>
  );
};
