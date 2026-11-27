"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";

import { getSessionAccountId, STUDIO_AUTH_CHANGED } from "@/lib/studio/auth";
import { runUpload } from "@/lib/studio/upload";
import { studioApi } from "@/lib/studio/api";
import { capacityProblem } from "@/lib/studio/upload-capacity";
import { createUploadManager, type UploadManager } from "@/lib/studio/upload-manager";

const UploadContext = createContext<UploadManager | null>(null);

export function UploadManagerProvider({ children }: { children: React.ReactNode }) {
  // One instance per mounted Studio layout, not a module singleton shared by SSR requests.
  const [manager] = useState(() => createUploadManager(runUpload, async (tripId, files, signal) =>
    capacityProblem(await studioApi.getUploadCapacity(tripId, signal), files),
  ));

  useEffect(() => {
    let accountId = getSessionAccountId();
    const syncAccount = () => {
      const next = getSessionAccountId();
      if (next !== accountId || next === null) manager.reset();
      accountId = next;
    };
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    let guarding = false;
    const syncGuard = () => {
      const unfinished = manager.getSnapshot().jobs.some((job) => job.status !== "finished" || job.retryCount > 0);
      if (unfinished === guarding) return;
      guarding = unfinished;
      if (guarding) window.addEventListener("beforeunload", warnBeforeUnload);
      else window.removeEventListener("beforeunload", warnBeforeUnload);
    };
    const unsubscribe = manager.subscribe(syncGuard);
    syncGuard();
    window.addEventListener("storage", syncAccount);
    window.addEventListener(STUDIO_AUTH_CHANGED, syncAccount);
    return () => {
      unsubscribe();
      window.removeEventListener("beforeunload", warnBeforeUnload);
      window.removeEventListener("storage", syncAccount);
      window.removeEventListener(STUDIO_AUTH_CHANGED, syncAccount);
      manager.reset();
    };
  }, [manager]);

  return <UploadContext.Provider value={manager}>{children}</UploadContext.Provider>;
}

export function useUploadManager() {
  const manager = useContext(UploadContext);
  if (!manager) throw new Error("UploadManagerProvider is missing");
  return manager;
}

export function useUploadJobs() {
  const manager = useUploadManager();
  return useSyncExternalStore(
    manager.subscribe,
    () => manager.getSnapshot().jobs,
    () => manager.getServerSnapshot().jobs,
  );
}

export function useUploadRevision(tripId: string | null) {
  const manager = useUploadManager();
  return useSyncExternalStore(
    manager.subscribe,
    () => tripId ? manager.getSnapshot().revisions[tripId] ?? 0 : 0,
    () => 0,
  );
}
