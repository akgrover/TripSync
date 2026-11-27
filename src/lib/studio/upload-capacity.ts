export type UploadCapacity = {
  policy: "hard" | "grace";
  remainingBytes: number | null;
  remainingPhotos: number | null;
};

const EXT_TO_TYPE: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
};

// Shared by estimation and the runner so unsupported files don't consume estimated capacity.
export function contentTypeFor(file: File): string {
  if (Object.values(EXT_TO_TYPE).includes(file.type)) return file.type;
  if (file.type && file.type !== "application/octet-stream") return "";
  return EXT_TO_TYPE[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? "";
}

export function capacityProblem(capacity: UploadCapacity, files: File[]): string | undefined {
  const validLimit = (value: unknown) => value === null || (typeof value === "number" && Number.isSafeInteger(value) && value >= 0);
  if (!capacity || !["hard", "grace"].includes(capacity.policy) || !validLimit(capacity.remainingBytes) || !validLimit(capacity.remainingPhotos)) {
    throw new Error("The server returned an invalid capacity response. Please try again.");
  }
  if (capacity.policy === "grace") return;
  const accepted = files.filter((file) => contentTypeFor(file));
  const bytes = accepted.reduce((sum, file) => sum + file.size, 0);
  const issues: string[] = [];
  if (capacity.remainingPhotos !== null && accepted.length > capacity.remainingPhotos) {
    issues.push(`${accepted.length.toLocaleString()} selected photos; room for ${capacity.remainingPhotos.toLocaleString()} more`);
  }
  if (capacity.remainingBytes !== null && bytes > capacity.remainingBytes) {
    const mb = (n: number) => (n / 1024 / 1024).toLocaleString(undefined, { maximumFractionDigits: 1 });
    issues.push(`${mb(bytes)} MB selected; ${mb(capacity.remainingBytes)} MB available`);
  }
  if (issues.length) return `${issues.join(". ")}. These limits are shared across the host’s events. Choose fewer photos, free space, or upgrade the host’s plan. This estimate treats every selected photo as new, including possible duplicates.`;
}
