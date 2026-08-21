import { authClient } from './auth';

export async function signInWithOAuthPopup(
  provider: 'google' | 'github',
  callbackURL: string = '/booking'
): Promise<void> {
  const width = 500;
  const height = 620;
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

  // 1. Open popup window synchronously on user gesture to avoid popup blockers
  const popup = window.open(
    'about:blank',
    `oauth_${provider}_popup`,
    `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
  );

  if (popup) {
    try {
      popup.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Signing in...</title>
            <style>
              body { background: #0a0a0a; color: #fff; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .spinner { width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #C5A059; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px; }
              @keyframes spin { to { transform: rotate(360deg); } }
              .container { text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="spinner"></div>
              <div style="font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; color: #aaa;">Connecting to ${provider === 'google' ? 'Google' : 'GitHub'}...</div>
            </div>
          </body>
        </html>
      `);
    } catch {
      // ignore cross-origin write notice
    }
  }

  try {
    // 2. Request authorization URL without redirecting parent window
    const fullCallbackURL = callbackURL.startsWith('http') 
      ? callbackURL 
      : `${window.location.origin}${callbackURL.startsWith('/') ? '' : '/'}${callbackURL}`;

    const res = await authClient.signIn.social({
      provider,
      callbackURL: fullCallbackURL,
      disableRedirect: true,
    });

    const targetUrl = (res as any)?.data?.url;

    if (targetUrl && popup && !popup.closed) {
      popup.location.href = targetUrl;
    } else if (targetUrl) {
      window.location.href = targetUrl;
      return;
    }

    // 3. Monitor popup and session until authentication completes
    const pollInterval = setInterval(async () => {
      try {
        const session = await (authClient as any).getSession({ query: {} });
        if (session?.data?.user) {
          clearInterval(pollInterval);
          if (popup && !popup.closed) {
            popup.close();
          }
          window.location.href = callbackURL;
          return;
        }

        if (popup?.closed) {
          clearInterval(pollInterval);
          // Check one final time
          const finalSession = await (authClient as any).getSession({ query: {} });
          if (finalSession?.data?.user) {
            window.location.href = callbackURL;
          }
        }
      } catch {
        // ignore polling errors
      }
    }, 500);

    // Timeout after 3 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 180000);
  } catch (err) {
    console.error('Error opening OAuth popup:', err);
    if (popup && !popup.closed) {
      popup.close();
    }
    // Fallback to standard redirect if popup flow fails
    await authClient.signIn.social({
      provider,
      callbackURL,
    });
  }
}
