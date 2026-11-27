"use client";
import { useState } from "react";
import { UploadManagerProvider, useUploadManager, useUploadRevision } from "@/components/studio/upload-manager-provider";
import { GlobalUploadPanel } from "@/components/studio/global-upload-panel";
import { PhotoGrid } from "@/components/studio/photo-grid";
import { setTokens } from "@/lib/studio/auth";
function Fixture() {
  const manager = useUploadManager();
  const reload = useUploadRevision("qa-trip");
  const [folder, setFolder] = useState<string | undefined>();
  const [shown, setShown] = useState(false);
  function queue(count: number) {
    const bytes = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII="), c => c.charCodeAt(0));
    manager.enqueue({ tripId: "qa-trip", tripName: "Local QA event" }, Array.from({ length: count }, (_, i) => new File([bytes], `qa-${i}.png`, { type: "image/png" })));
  }
  return <main className="mx-auto max-w-4xl p-8">
    <div className="mb-6 flex flex-wrap gap-4">
      <button onClick={() => { setTokens({ accessToken: "qa.eyJzdWIiOiJxYS11c2VyIn0.qa" }); setShown(true); }}>Local login</button>
      <button onClick={() => queue(6000)}>Select 6000</button>
      <button onClick={() => queue(30)}>Select 30</button>
      <button onClick={() => setShown(!shown)}>Toggle gallery route</button>
      <button onClick={() => setFolder(folder ? undefined : "empty-folder")}>Switch folder</button>
    </div>
    {shown ? <PhotoGrid tripId="qa-trip" folder={folder} reload={reload} /> : <p>Another route</p>}
    <GlobalUploadPanel />
  </main>;
}
export default function QA() { return <UploadManagerProvider><Fixture /></UploadManagerProvider>; }
