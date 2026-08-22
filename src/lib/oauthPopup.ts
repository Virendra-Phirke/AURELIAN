import { authClient } from './auth';

/**
 * Opens a centered popup for OAuth consent. After Google/GitHub redirects back,
 * the popup auto-closes and the *original* tab navigates to callbackURL.
 */
export async function signInWithOAuthPopup(
  provider: 'google' | 'github',
  callbackURL: string = '/booking'
): Promise<void> {
  const width = 500;
  const height = 620;
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

  // 1. Open a blank popup synchronously (must be on user gesture to avoid blockers)
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
      // ignore cross-origin write errors
    }
  }

  try {
    // 2. Get the OAuth authorization URL from Better Auth without redirecting
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
      // 3. Navigate the popup to the OAuth provider
      popup.location.href = targetUrl;
    } else if (targetUrl) {
      // Popup was blocked — fall back to full redirect
      window.location.href = targetUrl;
      return;
    }

    // 4. Wait for the popup to close OR for a postMessage signal
    return new Promise<void>((resolve) => {
      let resolved = false;
      const cleanup = () => {
        if (resolved) return;
        resolved = true;
        window.removeEventListener('message', onMessage);
        clearInterval(closedPoll);
        clearTimeout(timeout);
      };

      // Listen for the postMessage sent by the popup (from App.tsx popup detector)
      const onMessage = (e: MessageEvent) => {
        if (e.data?.type === 'oauth_popup_done') {
          cleanup();
          window.location.href = callbackURL;
          resolve();
        }
      };
      window.addEventListener('message', onMessage);

      // Also poll: if user manually closes popup, check session
      const closedPoll = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(closedPoll);
          // Give cookies a moment to propagate
          await new Promise((r) => setTimeout(r, 300));
          try {
            const session = await (authClient as any).getSession({ query: {} });
            if (session?.data?.user) {
              cleanup();
              window.location.href = callbackURL;
              resolve();
              return;
            }
          } catch {}
          // If no session after popup closed, just resolve (user cancelled)
          cleanup();
          resolve();
        }
      }, 600);

      // Timeout safety net: 3 minutes
      const timeout = setTimeout(() => {
        cleanup();
        resolve();
      }, 180000);
    });
  } catch (err) {
    console.error('Error opening OAuth popup:', err);
    if (popup && !popup.closed) {
      popup.close();
    }
    // Fallback to standard redirect
    await authClient.signIn.social({
      provider,
      callbackURL,
    });
  }
}
