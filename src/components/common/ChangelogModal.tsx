import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { CHANGELOG } from '../../constants/changelog';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const { lang, t } = useLanguage();
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape while open
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Move focus into the dialog when it opens
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="changelog-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-left focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-page/40">
          <h2 id="changelog-modal-title" className="text-base font-black text-main flex items-center gap-2">
            <span>📝</span>
            <span>{t('changelog.title')}</span>
          </h2>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="p-1.5 text-muted hover:text-main rounded-lg hover:bg-card-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Release list, newest first */}
        <ol className="p-5 space-y-6 overflow-y-auto flex-1 text-sm">
          {CHANGELOG.map((entry, i) => (
            <li key={entry.version} className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="font-black text-main">v{entry.version}</span>
                {i === 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-team-primary/15 text-team-primary">
                    {t('changelog.latest')}
                  </span>
                )}
                <time dateTime={entry.date} className="ml-auto text-xs text-muted tabular-nums">
                  {entry.date}
                </time>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-muted leading-relaxed">
                {entry.changes[lang].map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
