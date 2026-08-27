import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showRestored, setShowRestored] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showRestored) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 transition-all animate-in slide-in-from-bottom-3 duration-200 ${
        isOnline
          ? 'bg-emerald-600 text-white border-emerald-500'
          : 'bg-amber-600 text-white border-amber-500'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>{t('offline.online')}</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>{t('offline.offline')}</span>
        </>
      )}
    </div>
  );
};
