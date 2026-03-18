import { useEffect, useRef, useCallback } from 'react';
import { openGooglePopup, POST_MESSAGE_TYPE } from '@/lib/google-oauth-popup';
import { getMainDomainUrl } from '@/lib/subdomain';

/**
 * Hook for Google OAuth via popup (used on subdomains).
 * Returns a function to open the popup.
 * Calls `onCredential` when the Google id_token arrives from the popup.
 */
export function useGooglePopupLogin(
  onCredential: (credential: string) => void,
  onError?: (error: string) => void,
) {
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  onCredentialRef.current = onCredential;
  onErrorRef.current = onError;

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.data || event.data.type !== POST_MESSAGE_TYPE) return;

      // Validate origin — must be our main domain
      const mainDomainUrl = getMainDomainUrl();
      if (event.origin !== mainDomainUrl) return;

      if (event.data.error) {
        onErrorRef.current?.(event.data.error);
        return;
      }

      if (event.data.credential) {
        onCredentialRef.current(event.data.credential);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const openPopup = useCallback(() => {
    const mainDomainUrl = getMainDomainUrl();
    const returnTo = window.location.origin;
    openGooglePopup(mainDomainUrl, returnTo);
  }, []);

  return openPopup;
}
