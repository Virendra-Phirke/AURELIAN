/// <reference types="vite/client" />
import { createAuthClient } from "better-auth/react";
import { twoFactorClient, emailOTPClient, oneTapClient, oauthPopupClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_APP_URL || "http://localhost:3000",
  plugins: [
    twoFactorClient(),
    emailOTPClient(),
    oauthPopupClient(),
    ...(import.meta.env.VITE_ENABLE_GOOGLE_ONE_TAP === "true" && import.meta.env.VITE_GOOGLE_CLIENT_ID ? [
      oneTapClient({
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        autoSelect: false,
        cancelOnTapOutside: true,
        context: "signin",
      })
    ] : [])
  ]
});
