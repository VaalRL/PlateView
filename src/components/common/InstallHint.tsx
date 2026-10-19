import React, { useSyncExternalStore } from 'react';
import { MonitorDown } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { canPromptInstall, isIos, isStandalone, promptInstall, subscribeInstallPrompt } from '../../utils/installPrompt';

/**
 * Footer line offering to add the site to the home screen: a button where
 * the browser can install it, a how-to on iOS, nothing once installed.
 */
export const InstallHint: React.FC = () => {
  const { t } = useLanguage();
  const installable = useSyncExternalStore(subscribeInstallPrompt, canPromptInstall, () => false);

  if (isStandalone()) return null;
  if (installable) {
    return (
      <button
        type="button"
        onClick={() => promptInstall()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted hover:text-main hover:border-team-primary/50 transition-colors"
      >
        <MonitorDown className="w-3.5 h-3.5" />
        {t('install.button')}
      </button>
    );
  }
  if (isIos()) return <p className="text-xs text-muted">{t('install.ios_hint')}</p>;
  return null;
};
