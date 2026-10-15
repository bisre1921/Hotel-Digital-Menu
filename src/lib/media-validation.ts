/** Check file signatures before serving user media from our origin. SVG is deliberately excluded. */
export function matchesMediaType(bytes: Uint8Array, type: string): boolean {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  const starts = (...values: number[]) => values.every((value, i) => bytes[i] === value);
  switch (type) {
    case "image/jpeg": return starts(0xff, 0xd8, 0xff);
    case "image/png": return starts(137, 80, 78, 71, 13, 10, 26, 10);
    case "image/gif": return ["GIF87a", "GIF89a"].includes(ascii(0, 6));
    case "image/webp": return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "image/avif": return ascii(4, 8) === "ftyp" && /avif|avis/.test(ascii(8, 32));
    case "video/mp4": return ascii(4, 8) === "ftyp" && /isom|iso[2-9]|mp4[12]|avc1|M4V |dash/.test(ascii(8, 40));
    case "video/quicktime": return ascii(4, 8) === "ftyp" && ascii(8, 12) === "qt  ";
    case "video/webm": return starts(0x1a, 0x45, 0xdf, 0xa3) && /webm/.test(ascii(0, 128));
    case "application/pdf": return ascii(0, 5) === "%PDF-";
    default: return false;
  }
}
