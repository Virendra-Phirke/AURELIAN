/// <reference types="vite/client" />
import { createAuthClient } from "better-auth/react";
import { twoFactorClient, emailOTPClient, oneTapClient, oauthPopupClient } from "better-auth/client/plugins";

const getClientBaseURL = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return import.meta.env.VITE_APP_URL || "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getClientBaseURL(),
  plugins: [
    twoFactorClient(),
    emailOTPClient(),
    oauthPopupClient(),
    oneTapClient({
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
      autoSelect: false,
      cancelOnTapOutside: true,
      context: "signin",
    })
  ]
});
