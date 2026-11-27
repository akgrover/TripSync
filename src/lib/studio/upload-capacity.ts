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
  if (file.type && file.type.startsWith("image/") && file.type !== "image/heic" && file.type !== "image/heif") return file.type;
  return EXT_TO_TYPE[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? "";
}

export function capacityProblem(capacity: UploadCapacity, files: File[]): string | undefined {
  if (capacity.policy !== "hard") return;
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
