import React, { useEffect } from 'react';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '746469864617-u982sdj01nksir0dqgohgmkj8op44bdj.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: any;
    __handleGoogleOneTapCallback?: (response: any) => Promise<void>;
  }
}

interface GoogleOneTapProps {
  callbackURL?: string;
}

export default function GoogleOneTap({ callbackURL = '/booking' }: GoogleOneTapProps) {
  useEffect(() => {
    let isMounted = true;

    // Clear Google One Tap cooldown cookie (g_state) to prevent suppression in dev
    try {
      document.cookie = 'g_state=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT';
    } catch {
      // ignore
    }

    const handleCredentialResponse = async (response: any) => {
      if (!response?.credential) return;
      try {
        console.log('[Google One Tap] ID token received, verifying with backend...');
        const res = await fetch('/api/auth/one-tap/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: response.credential,
            callbackURL,
          }),
        });

        if (res.ok) {
          console.log('[Google One Tap] Authentication successful! Redirecting...');
          window.location.href = callbackURL;
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error('[Google One Tap] Backend error:', errData);
        }
      } catch (err) {
        console.error('[Google One Tap] Error during credential callback:', err);
      }
    };

    window.__handleGoogleOneTapCallback = handleCredentialResponse;

    const setupGoogleAuth = () => {
      if (!window.google?.accounts?.id) {
        return false;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
          context: 'signin',
          itp_support: true,
          use_fedcm_for_prompt: true,
        });

        window.google.accounts.id.prompt((notification: any) => {
          if (!isMounted) return;

          if (notification.isNotDisplayed?.()) {
            const reason = notification.getNotDisplayedReason?.();
            if (reason === 'opt_out_or_no_session' || reason === 'suppressed_by_user' || reason === 'unknown_reason') {
              try {
                window.google.accounts.id.initialize({
                  client_id: GOOGLE_CLIENT_ID,
                  callback: handleCredentialResponse,
                  auto_select: false,
                  cancel_on_tap_outside: false,
                  context: 'signin',
                  itp_support: true,
                  use_fedcm_for_prompt: false,
                });
                window.google.accounts.id.prompt();
              } catch {
                // ignore
              }
            }
          }
        });

        return true;
      } catch (err) {
        console.error('[Google One Tap] Initialization error:', err);
        return false;
      }
    };

    if (!setupGoogleAuth()) {
      const interval = setInterval(() => {
        if (setupGoogleAuth()) {
          clearInterval(interval);
        }
      }, 300);

      const timeout = setTimeout(() => {
        clearInterval(interval);
      }, 6000);

      return () => {
        isMounted = false;
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [callbackURL]);

  return (
    <div
      id="g_id_onload"
      data-client_id={GOOGLE_CLIENT_ID}
      data-context="signin"
      data-callback="__handleGoogleOneTapCallback"
      data-auto_select="false"
      data-cancel_on_tap_outside="false"
      data-itp_support="true"
      style={{ display: 'none' }}
    />
  );
}
