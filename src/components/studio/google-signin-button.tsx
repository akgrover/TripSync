"use client";

import { useEffect, useRef } from "react";

import { GOOGLE_CLIENT_ID } from "@/lib/studio/config";

// Minimal typings for the slice of Google Identity Services we use.
type GsiId = {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    ux_mode?: "popup" | "redirect";
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GsiId } };
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

// Load the GIS script once and resolve when window.google.accounts.id is ready.
function loadGsi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("gsi load failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("gsi load failed"));
    document.head.appendChild(script);
  });
}

// Renders the official Google button and hands the returned ID token (credential) to onCredential.
// Renders nothing when no client ID is configured, so the login page falls back to phone OTP only.
export function GoogleSignInButton({
  onCredential,
  text = "continue_with",
  width = 320,
}: {
  onCredential: (idToken: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  width?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep the latest callback without making it an effect dependency (so we init GIS only once).
  const callbackRef = useRef(onCredential);
  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      return;
    }
    let cancelled = false;
    void loadGsi()
      .then(() => {
        const id = window.google?.accounts?.id;
        if (cancelled || !containerRef.current || !id) {
          return;
        }
        id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => callbackRef.current(response.credential),
          ux_mode: "popup",
        });
        containerRef.current.innerHTML = ""; // avoid a duplicate button if this re-runs
        id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text,
          shape: "pill",
          width,
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [text, width]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }
  return <div ref={containerRef} className="flex justify-center" />;
}
