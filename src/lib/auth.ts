/// <reference types="vite/client" />
import { createAuthClient } from "better-auth/react";
import { twoFactorClient, emailOTPClient, oneTapClient, oauthPopupClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_APP_URL || "http://localhost:3000",
  plugins: [
    twoFactorClient(),
    emailOTPClient(),
    oauthPopupClient(),
    oneTapClient({
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "746469864617-u982sdj01nksir0dqgohgmkj8op44bdj.apps.googleusercontent.com",
      autoSelect: false,
      cancelOnTapOutside: true,
      context: "signin",
    })
  ]
});
