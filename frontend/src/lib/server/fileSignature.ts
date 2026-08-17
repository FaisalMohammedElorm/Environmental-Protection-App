/**
 * The client-declared File.type is trivially spoofable (a malicious file can simply
 * declare "image/jpeg"). This checks the actual leading bytes of the uploaded buffer
 * against known image signatures, so a mislabeled or disguised file is rejected
 * regardless of what the client claimed. Server-only — used by report-image upload
 * Server Actions before writing to Supabase Storage.
 */
const SIGNATURES: Array<{ mime: string; check: (buf: Buffer) => boolean }> = [
  { mime: "image/jpeg", check: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff },
  {
    mime: "image/png",
    check: (buf) =>
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
  },
  {
    mime: "image/webp",
    check: (buf) =>
      buf.length >= 12 &&
      buf.subarray(0, 4).toString("ascii") === "RIFF" &&
      buf.subarray(8, 12).toString("ascii") === "WEBP"
  }
];

export function isValidImageBuffer(buffer: Buffer): boolean {
  return SIGNATURES.some((sig) => sig.check(buffer));
}
