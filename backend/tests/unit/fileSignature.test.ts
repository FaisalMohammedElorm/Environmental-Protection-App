import { isValidImageBuffer } from "../../src/utils/fileSignature";

describe("isValidImageBuffer", () => {
  it("accepts a valid JPEG signature", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(isValidImageBuffer(jpeg)).toBe(true);
  });

  it("accepts a valid PNG signature", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(isValidImageBuffer(png)).toBe(true);
  });

  it("accepts a valid WEBP signature", () => {
    const webp = Buffer.concat([
      Buffer.from("RIFF", "ascii"),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from("WEBP", "ascii")
    ]);
    expect(isValidImageBuffer(webp)).toBe(true);
  });

  it("rejects a file whose content doesn't match any known image signature", () => {
    // A file that merely claims to be a JPEG (e.g. via a spoofed Content-Type) but is
    // actually a script — this is exactly what magic-byte checking exists to catch.
    const disguisedScript = Buffer.from("#!/bin/sh\necho pwned\n", "ascii");
    expect(isValidImageBuffer(disguisedScript)).toBe(false);
  });

  it("rejects an empty buffer", () => {
    expect(isValidImageBuffer(Buffer.alloc(0))).toBe(false);
  });
});
