import { GoogleLogin } from '@react-oauth/google';
import { POST_MESSAGE_TYPE } from '@/lib/google-oauth-popup';

/**
 * Opened in a popup window on the main domain (from a subdomain opener).
 * Shows a prominent GoogleLogin button. When clicked, Google handles auth
 * in its own flow, returns an id_token, which we postMessage back to the opener.
 */
export default function GooglePopupRedirectPage() {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get('returnTo') || '';

  const sendAndClose = (type: string, payload: Record<string, string>) => {
    if (window.opener) {
      window.opener.postMessage({ type, ...payload }, returnTo || '*');
    }
    window.close();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Sign in with Google</h2>
        <p className="text-sm text-gray-500 mt-1">Click below to continue</p>
      </div>
      <GoogleLogin
        onSuccess={(res) => {
          if (res.credential) {
            sendAndClose(POST_MESSAGE_TYPE, { credential: res.credential });
          }
        }}
        onError={() => {
          sendAndClose(POST_MESSAGE_TYPE, { error: 'Google sign-in failed' });
        }}
        size="large"
        text="signin_with"
        shape="rectangular"
        width="300"
      />
    </div>
  );
}
