import React, { useState, useRef } from 'react';
import { X, Download, Copy, Check, Upload, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  generateBackupPayload,
  downloadBackupFile,
  restoreFavoritesFromJson,
} from '../../utils/favoritesBackup';

interface FavoritesBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const FavoritesBackupModal: React.FC<FavoritesBackupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      const payload = generateBackupPayload();
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
        executeImport(content, importMode);
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be chosen again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const executeImport = (rawJson: string, mode: 'merge' | 'overwrite') => {
    if (!rawJson.trim()) {
      setFeedback({ type: 'error', message: t('fav.import_error') });
      return;
    }

    const result = restoreFavoritesFromJson(rawJson, mode);
    if (result.success) {
      setFeedback({
        type: 'success',
        message: `${t('fav.import_success')} (${result.count?.teams} 隊, ${result.count?.players} 球員)`,
      });
      setImportText('');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1500);
    } else {
      setFeedback({
        type: 'error',
        message: `${t('fav.import_error')} (${result.error || ''})`,
      });
    }
  };

  const handleManualImport = (e: React.FormEvent) => {
    e.preventDefault();
    executeImport(importText, importMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-page/40">
          <h2 className="text-base font-black text-main flex items-center gap-2">
            <span>⭐</span>
            <span>{t('fav.backup_modal_title')}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-main rounded-lg hover:bg-card-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1 text-sm">
          <p className="text-xs text-muted leading-relaxed">
            {t('fav.backup_modal_desc')}
          </p>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* 1. Export Section */}
          <div className="space-y-2.5 bg-page/60 border border-border/80 rounded-xl p-4">
            <h3 className="font-bold text-xs text-main tracking-wider uppercase">
              {t('fav.export_section')}
            </h3>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={downloadBackupFile}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-team-primary text-white font-bold text-xs hover:opacity-90 transition-opacity shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>{t('fav.export_download')}</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border hover:border-team-primary text-xs font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-500 font-bold">{t('fav.copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-muted" />
                    <span>{t('fav.export_copy')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. Import Section */}
          <form onSubmit={handleManualImport} className="space-y-3 bg-page/60 border border-border/80 rounded-xl p-4">
            <h3 className="font-bold text-xs text-main tracking-wider uppercase">
              {t('fav.import_section')}
            </h3>

            {/* Mode selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted">
                {t('fav.import_mode_label')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-all ${
                    importMode === 'merge'
                      ? 'bg-team-primary/10 border-team-primary text-team-primary font-bold shadow-xs'
                      : 'bg-card border-border text-muted hover:text-main'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="truncate">{t('fav.import_mode_merge')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('overwrite')}
                  className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-all ${
                    importMode === 'overwrite'
                      ? 'bg-team-primary/10 border-team-primary text-team-primary font-bold shadow-xs'
                      : 'bg-card border-border text-muted hover:text-main'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="truncate">{t('fav.import_mode_overwrite')}</span>
                </button>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={t('fav.import_placeholder')}
              rows={3}
              className="w-full text-xs bg-card border border-border rounded-xl p-2.5 font-mono text-main placeholder:text-muted/60 focus:outline-none focus:border-team-primary transition-colors"
            />

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border hover:border-team-primary text-xs font-medium transition-colors"
              >
                <Upload className="w-4 h-4 text-team-primary" />
                <span>{t('fav.import_file_btn')}</span>
              </button>

              <button
                type="submit"
                disabled={!importText.trim()}
                className="px-4 py-2 rounded-xl bg-team-primary text-white font-bold text-xs hover:opacity-90 disabled:opacity-40 transition-all shadow-sm"
              >
                {t('fav.import_submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
