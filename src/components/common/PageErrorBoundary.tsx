import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { useLanguage } from '../../hooks/useLanguage';
import { isChunkLoadError, pageReloader, reloadForNewBuild } from '../../utils/staleBuild';

const PageError: React.FC<{ error: Error }> = ({ error }) => {
  const { t } = useLanguage();
  const updating = isChunkLoadError(error);
  return (
    <div role="alert" className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
      {updating ? (
        <RefreshCw className="w-8 h-8 mx-auto text-team-primary animate-spin" />
      ) : (
        <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
      )}
      <h1 className="text-lg font-bold text-main">{updating ? t('error.updating') : t('error.title')}</h1>
      {!updating && <p className="text-sm text-muted">{t('error.body')}</p>}
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={() => pageReloader.reload()}
          className="px-4 py-2 rounded-lg bg-team-primary text-white text-sm font-semibold"
        >
          {t('error.reload')}
        </button>
        <Link to="/" className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-main">
          {t('error.home')}
        </Link>
      </div>
    </div>
  );
};

/**
 * Keeps an error on one page to that page: the navbar stays, the page shows
 * what went wrong, and moving to another route clears it. A page whose code
 * file is gone (the site was redeployed under an open tab) reloads once to
 * pick up the new build.
 */
export const PageErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <ErrorBoundary
      resetKey={location.pathname}
      onError={(error) => {
        if (isChunkLoadError(error)) reloadForNewBuild();
      }}
      fallback={(error) => <PageError error={error} />}
    >
      {children}
    </ErrorBoundary>
  );
};
