import { GoogleLogin } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import { POST_MESSAGE_TYPE } from '@/lib/google-oauth-popup';

/**
 * Opened in a popup window on the main domain (from a subdomain opener).
 * Shows a prominent GoogleLogin button. When clicked, Google handles auth
 * in its own flow, returns an id_token, which we postMessage back to the opener.
 */
export default function GooglePopupRedirectPage() {
  const { t } = useTranslation();
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get('returnTo') || '';

  const sendAndClose = (type: string, payload: Record<string, string>) => {
    if (window.opener) {
      window.opener.postMessage({ type, ...payload }, returnTo || '*');
    }
    window.close();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-surface)] px-4 transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-heading)' }}>{t('googlePopup.title')}</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">{t('googlePopup.clickToContinue')}</p>
      </div>
      <GoogleLogin
        onSuccess={(res) => {
          if (res.credential) {
            sendAndClose(POST_MESSAGE_TYPE, { credential: res.credential });
          }
        }}
        onError={() => {
          sendAndClose(POST_MESSAGE_TYPE, { error: t('auth.googleSignInFailed') });
        }}
        size="large"
        text="signin_with"
        shape="rectangular"
        width="300"
      />
    </div>
  );
}
