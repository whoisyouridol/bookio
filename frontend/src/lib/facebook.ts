declare global {
  interface Window {
    FB: {
      init(params: { appId: string; cookie: boolean; xfbml: boolean; version: string }): void;
      login(
        callback: (response: { authResponse?: { accessToken: string } }) => void,
        options: { scope: string }
      ): void;
    };
    fbAsyncInit: () => void;
  }
}

let initialized = false;

export function initFacebookSDK(): Promise<void> {
  if (initialized) return Promise.resolve();

  const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
  if (!appId) return Promise.resolve();

  return new Promise(resolve => {
    window.fbAsyncInit = () => {
      window.FB.init({ appId, cookie: true, xfbml: false, version: 'v25.0' });
      initialized = true;
      resolve();
    };

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  });
}
