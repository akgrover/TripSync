"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

// Global connectivity toast for the Studio portal. Watches the browser's online/offline events and
// shows a persistent banner while the device is offline, so a failed login/upload/toggle reads as
// "you're offline" rather than a mysterious error. Rendered once in the Studio layout.
//
// `navigator.onLine` is only trustworthy for the offline=true signal (true can be a false positive
// when there's a LAN but no internet), but it's the right tool for the "no connection at all" case
// the user asked about — and the API's own retry/error paths still cover captive-portal cases.
export function NetworkToast() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // Read the real value on mount (SSR/static export can't touch navigator), then track changes.
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4"
    >
      <div className="flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
        <WifiOff className="h-4 w-4 shrink-0 text-amber-400" />
        No network connection. Please connect to the internet and try again.
      </div>
    </div>
  );
}
