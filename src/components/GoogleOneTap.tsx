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
  buttonContainerId?: string;
}

export default function GoogleOneTap({
  callbackURL = '/booking',
  buttonContainerId = 'google-signin-button-container',
}: GoogleOneTapProps) {
  useEffect(() => {
    let isMounted = true;

    // 1. Clear Google One Tap cooldown cookie (g_state) to prevent suppression in dev
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
        // Initialize Google Identity Services
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
          context: 'signin',
          itp_support: true,
          use_fedcm_for_prompt: true,
        });

        // 1. Render Google Sign In Button (Guaranteed to work in Firefox, Safari, Edge, Chrome)
        if (buttonContainerId) {
          const container = document.getElementById(buttonContainerId);
          if (container) {
            container.innerHTML = '';
            window.google.accounts.id.renderButton(container, {
              type: 'standard',
              theme: 'filled_black',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: 180,
            });
          }
        }

        // 2. Trigger One Tap floating prompt (supported in Chrome/Chromium)
        window.google.accounts.id.prompt((notification: any) => {
          if (!isMounted) return;

          if (notification.isNotDisplayed?.()) {
            const reason = notification.getNotDisplayedReason?.();
            console.log('[Google One Tap] Prompt not displayed (Reason:', reason, '). Official Google button rendered as fallback.');

            // Fallback retry without FedCM if suppressed
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
          } else if (notification.isSkippedMoment?.()) {
            console.log('[Google One Tap] Prompt skipped:', notification.getSkippedReason?.());
          } else if (notification.isDismissedMoment?.()) {
            console.log('[Google One Tap] Prompt dismissed:', notification.getDismissedReason?.());
          } else {
            console.log('[Google One Tap] Floating prompt active.');
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
  }, [callbackURL, buttonContainerId]);

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
