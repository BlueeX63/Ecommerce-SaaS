/**
 * Prepares a picture chosen in the store editor before it is stored or uploaded.
 *
 * Phone and camera photos are several MB, while the storefront shows them a few hundred pixels wide. Sending them
 * as-is made store content huge (and deploys fail with "customization data is too large"), and an unconstrained
 * logo could be any shape or size. So every picture is decoded, scaled down to what the storefront can actually use
 * (never up), and re-encoded to a small file.
 *
 *  - logo:  fits inside 480 x 160 (shown ~32 px tall, so that is 3-5x sharp), keeps transparency (PNG), a few tens of KB.
 *  - photo: fits inside 1600 x 1600, WebP/JPEG, about 250 KB at most.
 */

export type ImageKind = "logo" | "photo";

const LIMITS: Record<ImageKind, { maxWidth: number; maxHeight: number; maxBytes: number }> = {
  logo: { maxWidth: 480, maxHeight: 160, maxBytes: 90 * 1024 },
  photo: { maxWidth: 1600, maxHeight: 1600, maxBytes: 260 * 1024 },
};

/** Largest file we are willing to read at all. */
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

export interface PreparedImage {
  blob: Blob;
  width: number;
  height: number;
}

export function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function load(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as a picture. Try a PNG, JPG, WebP or SVG."));
    };
    img.src = url;
  });
}

function encode(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function draw(img: HTMLImageElement, width: number, height: number, background?: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process this image.");
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

function hasTransparency(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  // Sampling a down-scaled copy is plenty to know whether any pixel is see-through.
  const probe = document.createElement("canvas");
  probe.width = Math.min(64, canvas.width);
  probe.height = Math.min(64, canvas.height);
  const pctx = probe.getContext("2d");
  if (!pctx) return false;
  pctx.drawImage(canvas, 0, 0, probe.width, probe.height);
  const data = pctx.getImageData(0, 0, probe.width, probe.height).data;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 250) return true;
  return false;
}

export async function prepareImage(file: File, kind: ImageKind): Promise<PreparedImage> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file (PNG, JPG, WebP or SVG).");
  if (file.size > MAX_INPUT_BYTES) throw new Error("That image is too large. Please choose one under 25 MB.");

  const limit = LIMITS[kind];
  const img = await load(file);
  // SVG logos may report no intrinsic size.
  const naturalWidth = img.naturalWidth || (kind === "logo" ? 480 : 1200);
  const naturalHeight = img.naturalHeight || (kind === "logo" ? 160 : 800);
  if (!naturalWidth || !naturalHeight) throw new Error("That image has no size. Please choose another.");

  let scale = Math.min(1, limit.maxWidth / naturalWidth, limit.maxHeight / naturalHeight);
  // A small image is never enlarged; an SVG (vector) is rasterised at the target size.
  if (file.type === "image/svg+xml") scale = Math.min(limit.maxWidth / naturalWidth, limit.maxHeight / naturalHeight);

  for (let attempt = 0; attempt < 7; attempt++) {
    const width = Math.max(1, Math.round(naturalWidth * scale));
    const height = Math.max(1, Math.round(naturalHeight * scale));
    const canvas = draw(img, width, height);
    const transparent = hasTransparency(canvas);

    let blob: Blob | null = null;
    if (kind === "logo" && transparent) {
      blob = await encode(canvas, "image/png");
    } else {
      // WebP where the browser can encode it (it falls back to PNG when it cannot), otherwise JPEG on white.
      for (const quality of [0.86, 0.76, 0.66, 0.56]) {
        let candidate = await encode(canvas, "image/webp", quality);
        if (!candidate || candidate.type !== "image/webp") {
          const flat = transparent ? draw(img, width, height, "#ffffff") : canvas;
          candidate = await encode(flat, "image/jpeg", quality);
        }
        blob = candidate;
        if (blob && blob.size <= limit.maxBytes) break;
      }
    }
    if (!blob) throw new Error("Your browser could not process this image.");
    if (blob.size <= limit.maxBytes || attempt === 6) {
      if (blob.size > limit.maxBytes * 3) throw new Error("This image is too detailed to shrink enough. Try a simpler picture.");
      return { blob, width, height };
    }
    scale *= 0.8; // still too heavy: try a smaller size
  }
  throw new Error("Your browser could not process this image.");
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the prepared image."));
    reader.readAsDataURL(blob);
  });
}

export const isLogoField = (field: { name: string }) => field.name === "logoUrl";
