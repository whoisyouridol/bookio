/**
 * Google OAuth popup flow for subdomain login.
 *
 * On subdomains, GoogleLogin component fails because the origin isn't registered.
 * Instead, we open a popup on the main domain where GSI works (registered JS origin),
 * and send the credential back via postMessage.
 */

export const GOOGLE_POPUP_PATH = '/auth/google-popup';
export const POST_MESSAGE_TYPE = 'google-oauth-credential';

/**
 * Open a centered popup window on the main domain for Google sign-in.
 * Must be called synchronously from a click handler to avoid popup blockers.
 */
export function openGooglePopup(mainDomainUrl: string, returnTo: string): Window | null {
  const url = `${mainDomainUrl}${GOOGLE_POPUP_PATH}?returnTo=${encodeURIComponent(returnTo)}`;
  const w = 500;
  const h = 600;
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;
  return window.open(url, 'googleAuth', `width=${w},height=${h},left=${left},top=${top}`);
}
