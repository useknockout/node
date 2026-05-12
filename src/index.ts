/**
 * @useknockout/node — official TypeScript / Node.js client for the useknockout API.
 *
 * Quick start:
 *
 *   import { Knockout } from "@useknockout/node";
 *
 *   const client = new Knockout({ token: process.env.KNOCKOUT_TOKEN! });
 *   const png = await client.remove({ file: "./input.jpg" });   // Buffer of PNG bytes
 *   await writeFile("out.png", png);
 */

import { readFile } from "node:fs/promises";
import { basename } from "node:path";

export const DEFAULT_BASE_URL = "https://useknockout--api.modal.run";
const SDK_VERSION = "0.2.0";

export type OutputFormat = "png" | "webp";
export type OpaqueFormat = "png" | "webp" | "jpg";

type FileInput = string | Buffer | Blob | ArrayBuffer | Uint8Array;

export interface KnockoutOptions {
  /** API bearer token. Required unless your self-hosted instance has no auth. */
  token?: string;
  /** Override the API base URL. Defaults to the hosted endpoint. */
  baseUrl?: string;
  /** Per-request timeout in milliseconds. Default 60_000. */
  timeoutMs?: number;
  /** Custom fetch (useful for edge runtimes / polyfills). Defaults to global fetch. */
  fetch?: typeof fetch;
}

export interface RemoveInput {
  /** Local file path, Buffer, Blob, or ArrayBuffer of the image. */
  file: string | Buffer | Blob | ArrayBuffer | Uint8Array;
  /** Optional filename — inferred from path when `file` is a string. */
  filename?: string;
  /** Output format. Default "png". */
  format?: OutputFormat;
}

export interface RemoveUrlInput {
  /** Remote URL of the image to process. */
  url: string;
  /** Output format. Default "png". */
  format?: OutputFormat;
}

export interface ReplaceBgInput {
  /** Local file path, Buffer, Blob, or ArrayBuffer of the foreground image. */
  file: string | Buffer | Blob | ArrayBuffer | Uint8Array;
  /** Optional filename — inferred from path when `file` is a string. */
  filename?: string;
  /** Hex color for the new background. Default "#FFFFFF". Ignored if `bgUrl` is set. */
  bgColor?: string;
  /** Remote URL of an image to use as the new background. Takes precedence over `bgColor`. */
  bgUrl?: string;
  /** Output format. "jpg" is smallest. Default "png". */
  format?: OpaqueFormat;
}

export interface BatchInput {
  /** Array of local paths / buffers / blobs. Up to 10. */
  files: Array<string | Buffer | Blob | ArrayBuffer | Uint8Array>;
  /** Optional filenames aligned to `files`. */
  filenames?: string[];
  /** Output format for each image. Default "png". */
  format?: OutputFormat;
}

export interface BatchUrlInput {
  /** Remote URLs to process. Up to 10. */
  urls: string[];
  /** Output format for each image. Default "png". */
  format?: OutputFormat;
}

export interface BatchResultItem {
  filename?: string;
  url?: string;
  success: boolean;
  format?: OutputFormat;
  size_bytes?: number;
  data_base64?: string;
  error?: string;
}

export interface BatchResponse {
  count: number;
  format: OutputFormat;
  results: BatchResultItem[];
}

export interface MaskInput {
  file: FileInput;
  filename?: string;
  format?: OutputFormat;
}

export interface SmartCropInput {
  file: FileInput;
  filename?: string;
  /** Padding around the subject bbox, in pixels. Default 24. */
  padding?: number;
  /** Return transparent cutout (true) or cropped region from original (false). Default true. */
  transparent?: boolean;
  format?: OpaqueFormat;
}

export interface ShadowInput {
  file: FileInput;
  filename?: string;
  bgColor?: string;
  bgUrl?: string;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  shadowOpacity?: number;
  format?: OpaqueFormat;
}

export interface StickerInput {
  file: FileInput;
  filename?: string;
  /** Hex color for the outline. Default "#FFFFFF". */
  strokeColor?: string;
  /** Outline width in pixels. Default 20. */
  strokeWidth?: number;
  format?: OutputFormat;
}

export interface OutlineInput {
  file: FileInput;
  filename?: string;
  /** Hex color for the outline. Default "#000000". */
  outlineColor?: string;
  /** Outline width in pixels. Default 4. */
  outlineWidth?: number;
  format?: OutputFormat;
}

export interface StudioShotInput {
  file: FileInput;
  filename?: string;
  bgColor?: string;
  /** e.g. "1:1", "4:5", "16:9". Default "1:1". */
  aspect?: string;
  padding?: number;
  shadow?: boolean;
  format?: OpaqueFormat;
}

export interface CompareInput {
  file: FileInput;
  filename?: string;
  format?: OutputFormat;
}

export interface HeadshotInput {
  file: FileInput;
  filename?: string;
  /** Hex color for the background. Default "#FFFFFF". Ignored if `bgBlur` is true. */
  bgColor?: string;
  /** Use a blurred copy of the original image as the background. Default false. */
  bgBlur?: boolean;
  /** Gaussian blur radius for the background when `bgBlur` is true. Default 20. */
  blurRadius?: number;
  /** Output aspect "W:H". Default "4:5" (portrait). */
  aspect?: string;
  /** Padding around the subject bbox, in pixels. Default 64. */
  padding?: number;
  /** Vertical headroom as a ratio of canvas height (0–0.5). Default 0.18. */
  headTopRatio?: number;
  format?: OpaqueFormat;
}

export interface PreviewInput {
  file: FileInput;
  filename?: string;
  /** Long-edge cap in pixels (64–1024). Default 512. */
  maxDim?: number;
  format?: OutputFormat;
}

export interface UpscaleInput {
  file: FileInput;
  filename?: string;
  /** Upscale factor: 2 or 4. Default 4. */
  scale?: 2 | 4;
  /**
   * Backend. `swin2sr` (default, v0.6.0+) is sharper on real photos.
   * `realesrgan` is the legacy backend — better on anime/illustrations.
   */
  model?: "swin2sr" | "realesrgan";
  /** Route through GFPGAN to fix facial detail. Slower, use for portraits. Implies realesrgan. */
  faceEnhance?: boolean;
  format?: OpaqueFormat;
}

export interface FaceRestoreInput {
  file: FileInput;
  filename?: string;
  /** Restore only the most prominent face (faster). Default false (all faces). */
  onlyCenterFace?: boolean;
  format?: OpaqueFormat;
}

export interface ColorizeInput {
  file: FileInput;
  filename?: string;
  format?: OpaqueFormat;
}

export interface SilhouetteInput {
  file: FileInput;
  filename?: string;
  /** Hex color for the subject silhouette. Default "#7C3AED" (purple). */
  subjectColor?: string;
  /** Hex color for the background. Default "#FFFFFF" (white). */
  bgColor?: string;
  format?: OpaqueFormat;
}

export interface InpaintBbox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface InpaintInput {
  file: FileInput;
  filename?: string;
  /**
   * Optional mask. White pixels = inpaint, black = keep. If omitted (and no
   * `bbox`), auto-subject mode runs BiRefNet on the input and inverts the
   * subject mask.
   */
  mask?: FileInput;
  maskFilename?: string;
  /** Rectangular region to inpaint. Mutually exclusive with `mask`. */
  bbox?: InpaintBbox;
  /** Mask dilation in pixels. Default 8, range 0..32. */
  dilation?: number;
  format?: OpaqueFormat;
}

export interface EstimateInput {
  /** Endpoint name without leading slash, e.g. "remove" or "headshot". */
  endpoint: string;
  width: number;
  height: number;
}

export interface EstimateResponse {
  endpoint: string;
  image_pixels: number;
  est_latency_ms_warm: number;
  est_latency_ms_cold: number;
  est_cost_usd: number;
  free_during_beta: boolean;
  note: string;
}

export interface StatsDay {
  date: string;
  count: number;
}

export interface StatsResponse {
  total_processed: number;
  today: number;
  last_7_days: StatsDay[];
  error?: string;
  detail?: string;
}

export interface HealthResponse {
  status: string;
  model: string;
}

/**
 * Error thrown when the API returns a non-2xx response.
 */
export class KnockoutError extends Error {
  public readonly status: number;
  public readonly code: "auth" | "rate_limit" | "bad_request" | "payload_too_large" | "server" | "unknown";
  public readonly body: string;

  constructor(status: number, body: string) {
    const code = KnockoutError.classify(status);
    super(`Knockout API error ${status} (${code}): ${body || "no body"}`);
    this.name = "KnockoutError";
    this.status = status;
    this.code = code;
    this.body = body;
  }

  private static classify(status: number): KnockoutError["code"] {
    if (status === 401 || status === 403) return "auth";
    if (status === 429) return "rate_limit";
    if (status === 413) return "payload_too_large";
    if (status >= 400 && status < 500) return "bad_request";
    if (status >= 500) return "server";
    return "unknown";
  }
}

/**
 * useknockout API client.
 *
 * All methods return a `Buffer` (Node) of the processed image bytes.
 * Use `.toString("base64")` or `writeFile(path, buf)` to persist.
 */
export class Knockout {
  private readonly baseUrl: string;
  private readonly token: string | undefined;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: KnockoutOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.token = options.token;
    this.timeoutMs = options.timeoutMs ?? 60_000;
    const fetchRef = options.fetch ?? globalThis.fetch;
    if (!fetchRef) {
      throw new Error(
        "Global fetch is unavailable. Provide `options.fetch` or use Node 18+."
      );
    }
    this.fetchImpl = fetchRef.bind(globalThis);
  }

  /** Hit GET /health — no auth required. */
  async health(): Promise<HealthResponse> {
    const res = await this.request("GET", "/health");
    const body = await res.text();
    if (!res.ok) throw new KnockoutError(res.status, body);
    return JSON.parse(body) as HealthResponse;
  }

  /**
   * Public usage counter — total images processed all-time, today, and a 7-day breakdown.
   * Use for landing-page social proof. Eventually consistent across containers.
   */
  async stats(): Promise<StatsResponse> {
    const res = await this.request("GET", "/stats");
    const body = await res.text();
    if (!res.ok) throw new KnockoutError(res.status, body);
    return JSON.parse(body) as StatsResponse;
  }

  /**
   * Predict latency + cost for an endpoint and image size without doing any GPU work.
   *
   * @example
   *   const est = await client.estimate({ endpoint: "remove", width: 1024, height: 1024 });
   */
  async estimate(input: EstimateInput): Promise<EstimateResponse> {
    const res = await this.request("POST", "/estimate", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: input.endpoint,
        width: input.width,
        height: input.height,
      }),
    });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return (await res.json()) as EstimateResponse;
  }

  /**
   * Remove the background from an image, returning the cleaned PNG/WebP bytes.
   *
   * @example
   *   const png = await client.remove({ file: "./input.jpg" });
   */
  async remove(input: RemoveInput): Promise<Buffer> {
    const format: OutputFormat = input.format ?? "png";
    const { blob, filename } = await toBlob(input);

    const form = new FormData();
    form.append("file", blob, filename);

    const res = await this.request("POST", `/remove?format=${format}`, {
      body: form,
    });

    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Remove the background from a remote URL, returning the cleaned PNG/WebP bytes.
   *
   * @example
   *   const png = await client.removeUrl({ url: "https://example.com/cat.jpg" });
   */
  async removeUrl(input: RemoveUrlInput): Promise<Buffer> {
    const format: OutputFormat = input.format ?? "png";
    const res = await this.request("POST", "/remove-url", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: input.url, format }),
    });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Replace the background with a solid color or a remote image.
   *
   * @example Solid color
   *   const jpg = await client.replaceBackground({ file: "./cat.jpg", bgColor: "#FF5733", format: "jpg" });
   *
   * @example Remote image as new background
   *   const png = await client.replaceBackground({
   *     file: "./cat.jpg",
   *     bgUrl: "https://example.com/beach.jpg",
   *   });
   */
  async replaceBackground(input: ReplaceBgInput): Promise<Buffer> {
    const format: OpaqueFormat = input.format ?? "png";
    const { blob, filename } = await toBlob({ file: input.file, filename: input.filename });

    const form = new FormData();
    form.append("file", blob, filename);

    const params = new URLSearchParams({ format });
    if (input.bgUrl) params.set("bg_url", input.bgUrl);
    if (input.bgColor) params.set("bg_color", input.bgColor);

    const res = await this.request("POST", `/replace-bg?${params.toString()}`, {
      body: form,
    });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Remove the background from up to 10 images in a single call.
   * Returns a JSON object with base64-encoded result bytes per image.
   *
   * @example
   *   const batch = await client.removeBatch({
   *     files: ["./a.jpg", "./b.jpg", "./c.jpg"],
   *     format: "png",
   *   });
   *   for (const r of batch.results) {
   *     if (r.success) await writeFile(r.filename!, Buffer.from(r.data_base64!, "base64"));
   *   }
   */
  async removeBatch(input: BatchInput): Promise<BatchResponse> {
    const format: OutputFormat = input.format ?? "png";
    if (input.files.length === 0) throw new Error("At least one file required");
    if (input.files.length > 10) throw new Error("Max 10 files per batch");

    const form = new FormData();
    for (let i = 0; i < input.files.length; i++) {
      const name = input.filenames?.[i];
      const { blob, filename } = await toBlob({ file: input.files[i]!, filename: name });
      form.append("files", blob, filename);
    }

    const res = await this.request("POST", `/remove-batch?format=${format}`, {
      body: form,
    });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return (await res.json()) as BatchResponse;
  }

  /**
   * Return only the alpha mask as a grayscale PNG/WebP.
   * Useful when chaining into your own compositing pipeline.
   */
  async mask(input: MaskInput): Promise<Buffer> {
    const format: OutputFormat = input.format ?? "png";
    const { blob, filename } = await toBlob({ file: input.file, filename: input.filename });
    const form = new FormData();
    form.append("file", blob, filename);
    form.append("format", format);
    const res = await this.request("POST", "/mask", { body: form });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Auto-crop to the subject's tight bounding box with configurable padding.
   * Returns either a transparent cutout or a cropped region from the original image.
   */
  async smartCrop(input: SmartCropInput): Promise<Buffer> {
    const transparent = input.transparent ?? true;
    const format: OpaqueFormat =
      (input.format as OpaqueFormat | undefined) ?? (transparent ? "png" : "jpg");
    const { blob, filename } = await toBlob({ file: input.file, filename: input.filename });
    const form = new FormData();
    form.append("file", blob, filename);
    form.append("padding", String(input.padding ?? 24));
    form.append("transparent", transparent ? "true" : "false");
    form.append("format", format);
    const res = await this.request("POST", "/smart-crop", { body: form });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Composite subject onto a new background with a configurable drop shadow.
   */
  async shadow(input: ShadowInput): Promise<Buffer> {
    const format: OpaqueFormat = input.format ?? "png";
    const { blob, filename } = await toBlob({ file: input.file, filename: input.filename });
    const form = new FormData();
    form.append("file", blob, filename);
    if (input.bgColor) form.append("bg_color", input.bgColor);
    if (input.bgUrl) form.append("bg_url", input.bgUrl);
    if (input.shadowColor) form.append("shadow_color", input.shadowColor);
    if (input.shadowOffsetX !== undefined) form.append("shadow_offset_x", String(input.shadowOffsetX));
    if (input.shadowOffsetY !== undefined) form.append("shadow_offset_y", String(input.shadowOffsetY));
    if (input.shadowBlur !== undefined) form.append("shadow_blur", String(input.shadowBlur));
    if (input.shadowOpacity !== undefined) form.append("shadow_opacity", String(input.shadowOpacity));
    form.append("format", format);
    const res = await this.request("POST", "/shadow", { body: form });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Sticker style — subject with a thick outline on transparent background.
   * Perfect for WhatsApp / iMessage / Telegram stickers.
   */
  async sticker(input: StickerInput): Promise<Buffer> {
    const format: OutputFormat = input.format ?? "png";
    const { blob, filename } = await toBlob({ file: input.file, filename: input.filename });
    const form = new FormData();
    form.append("file", blob, filename);
    if (input.strokeColor) form.append("stroke_color", input.strokeColor);
    if (input.strokeWidth !== undefined) form.append("stroke_width", String(input.strokeWidth));
    form.append("format", format);
    const res = await this.request("POST", "/sticker", { body: form });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Subject on transparent background with a thin configurable outline.
   */
  async outline(input: OutlineInput): Promise<Buffer> {
    const format: OutputFormat = input.format ?? "png";
    const { blob, filename } = await toBlob({ file: input.file, filename: input.filename });
    const form = new FormData();
    form.append("file", blob, filename);
    if (input.outlineColor) form.append("outline_color", input.outlineColor);
    if (input.outlineWidth !== undefined) form.append("outline_width", String(input.outlineWidth));
    form.append("format", format);
    const res = await this.request("POST", "/outline", { body: form });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * E-commerce preset — cutout + tight crop + centered + optional shadow on a standard aspect canvas.
   */
  async studioShot(input: StudioShotInput): Promise<Buffer> {
    const format: OpaqueFormat = input.format ?? "jpg";
    const { blob, filename } = await toBlob({ file: input.file, filename: input.filename });
    const form = new FormData();
    form.append("file", blob, filename);
    if (input.bgColor) form.append("bg_color", input.bgColor);
    if (input.aspect) form.append("aspect", input.aspect);
    if (input.padding !== undefined) form.append("padding", String(input.padding));
    if (input.shadow !== undefined) form.append("shadow", input.shadow ? "true" : "false");
    form.append("format", format);
    const res = await this.request("POST", "/studio-shot", { body: form });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Before/after side-by-side preview — original on left, transparent cutout (on a checkerboard) on right.
   */
  async compare(input: CompareInput): Promise<Buffer> {
    const format: OutputFormat = input.format ?? "png";
    const { blob, filename } = await toBlob({ file: input.file, filename: input.filename });
    const form = new FormData();
    form.append("file", blob, filename);
    form.append("format", format);
    const res = await this.request("POST", "/compare", { body: form });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * LinkedIn-ready headshot preset — bg removal + portrait crop + center face + bg color or blur.
   *
   * @example Solid bg
   *   const jpg = await client.headshot({ file: "./photo.jpg", bgColor: "#0A0A0A" });
   *
   * @example Blurred original as bg
   *   const jpg = await client.headshot({ file: "./photo.jpg", bgBlur: true, blurRadius: 24 });
   */
  async headshot(input: HeadshotInput): Promise<Buffer> {
    const format: OpaqueFormat = input.format ?? "jpg";
    const { blob, filename } = await toBlob({ file: input.file, filename: input.filename });
    const form = new FormData();
    form.append("file", blob, filename);
    if (input.bgColor) form.append("bg_color", input.bgColor);
    if (input.bgBlur !== undefined) form.append("bg_blur", input.bgBlur ? "true" : "false");
    if (input.blurRadius !== undefined) form.append("blur_radius", String(input.blurRadius));
    if (input.aspect) form.append("aspect", input.aspect);
    if (input.padding !== undefined) form.append("padding", String(input.padding));
    if (input.headTopRatio !== undefined) form.append("head_top_ratio", String(input.headTopRatio));
    form.append("format", format);
    const res = await this.request("POST", "/headshot", { body: form });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Fast low-res preview cutout (~80ms warm). Skips pymatting refinement and downscales
   * input to `maxDim` (default 512px on the long edge). Use for UX progress indicators.
   */
  async preview(input: PreviewInput): Promise<Buffer> {
    const format: OutputFormat = input.format ?? "png";
    const { blob, filename } = await toBlob({ file: input.file, filename: input.filename });
    const form = new FormData();
    form.append("file", blob, filename);
    form.append("max_dim", String(input.maxDim ?? 512));
    form.append("format", format);
    const res = await this.request("POST", "/preview", { body: form });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * 2x / 4x super-resolution. Defaults to Swin2SR (SwinV2 transformer) for sharper
   * detail on real photos. Pass `model: "realesrgan"` for the legacy backend
   * (better on anime / illustrations). `faceEnhance: true` routes portraits
   * through GFPGAN.
   *
   * @example Cutout → 4x upscale (print-ready)
   *   const png = await client.remove({ file: "./photo.jpg" });
   *   const big = await client.upscale({ file: png, scale: 4 });
   */
  async upscale(input: UpscaleInput): Promise<Buffer> {
    const format: OpaqueFormat = input.format ?? "png";
    const { blob, filename } = await toBlob({ file: input.file, filename: input.filename });
    const form = new FormData();
    form.append("file", blob, filename);
    form.append("scale", String(input.scale ?? 4));
    form.append("model", input.model ?? "swin2sr");
    if (input.faceEnhance !== undefined) {
      form.append("face_enhance", input.faceEnhance ? "true" : "false");
    }
    form.append("format", format);
    const res = await this.request("POST", "/upscale", { body: form });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * GFPGAN v1.4 portrait restoration — fix blurry / damaged / low-res faces.
   * Background is upscaled 2x by Real-ESRGAN. Pairs with /headshot.
   */
  async faceRestore(input: FaceRestoreInput): Promise<Buffer> {
    const format: OpaqueFormat = input.format ?? "png";
    const { blob, filename } = await toBlob({ file: input.file, filename: input.filename });
    const form = new FormData();
    form.append("file", blob, filename);
    if (input.onlyCenterFace !== undefined) {
      form.append("only_center_face", input.onlyCenterFace ? "true" : "false");
    }
    form.append("format", format);
    const res = await this.request("POST", "/face-restore", { body: form });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Colorize a black-and-white or grayscale photo (DDColor v0.7.0+).
   *
   * Apache-2.0 model, single feed-forward (no diffusion), ~500ms warm on L4.
   * Works on any input — color photos are converted to grayscale internally
   * before color is predicted, which makes round-trip recoloring easy too.
   *
   * @example
   *   const buf = await client.colorize({ file: "./old-photo.jpg" });
   *   await writeFile("colorized.png", buf);
   */
  async colorize(input: ColorizeInput): Promise<Buffer> {
    const format: OpaqueFormat = input.format ?? "png";
    const { blob, filename } = await toBlob({ file: input.file, filename: input.filename });
    const form = new FormData();
    form.append("file", blob, filename);
    form.append("format", format);
    const res = await this.request("POST", "/colorize", { body: form });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Inpaint a region of an image using LaMa (Apache-2.0). Three modes,
   * auto-detected from what you pass:
   *
   * 1. **auto-subject** — pass only `file`. BiRefNet derives the subject
   *    mask, inverts it, and LaMa fills the subject region with plausible
   *    background. Drop in a photo, get the subject erased.
   * 2. **mask** — pass `file` + `mask` (any image, white = inpaint).
   * 3. **bbox** — pass `file` + `bbox: { x, y, w, h }`. Rectangular region.
   *
   * `dilation` (0..32, default 8) expands the mask before LaMa runs to
   * reduce ghost outlines from tight masks.
   *
   * @example Auto-erase subject
   *   const png = await client.inpaint({ file: "./photo.jpg" });
   *
   * @example Erase a rectangular region
   *   const png = await client.inpaint({ file: "./photo.jpg", bbox: { x: 100, y: 100, w: 300, h: 400 } });
   */
  async inpaint(input: InpaintInput): Promise<Buffer> {
    const format: OpaqueFormat = input.format ?? "png";
    const { blob, filename } = await toBlob({ file: input.file, filename: input.filename });
    const form = new FormData();
    form.append("file", blob, filename);
    if (input.mask !== undefined) {
      const { blob: maskBlob, filename: maskFilename } = await toBlob({
        file: input.mask,
        filename: input.maskFilename ?? "mask.png",
      });
      form.append("mask", maskBlob, maskFilename);
    }
    if (input.bbox) {
      form.append("x", String(input.bbox.x));
      form.append("y", String(input.bbox.y));
      form.append("w", String(input.bbox.w));
      form.append("h", String(input.bbox.h));
    }
    if (input.dilation !== undefined) form.append("dilation", String(input.dilation));
    form.append("format", format);
    const res = await this.request("POST", "/inpaint", { body: form });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Two-tone silhouette portrait — subject in one solid color, bg in another.
   * Apple Music / Spotify avatar aesthetic. Reuses BiRefNet mask path; no new
   * model load, fast.
   *
   * @example
   *   const png = await client.silhouette({
   *     file: "./portrait.jpg",
   *     subjectColor: "#1E2960",
   *     bgColor: "#F0857C",
   *   });
   */
  async silhouette(input: SilhouetteInput): Promise<Buffer> {
    const format: OpaqueFormat = input.format ?? "png";
    const { blob, filename } = await toBlob({ file: input.file, filename: input.filename });
    const form = new FormData();
    form.append("file", blob, filename);
    if (input.subjectColor) form.append("subject_color", input.subjectColor);
    if (input.bgColor) form.append("bg_color", input.bgColor);
    form.append("format", format);
    const res = await this.request("POST", "/silhouette", { body: form });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Remove the background from up to 10 remote image URLs in a single call.
   *
   * @example
   *   const batch = await client.removeBatchUrl({
   *     urls: ["https://a.jpg", "https://b.jpg"],
   *   });
   */
  async removeBatchUrl(input: BatchUrlInput): Promise<BatchResponse> {
    const format: OutputFormat = input.format ?? "png";
    if (input.urls.length === 0) throw new Error("At least one URL required");
    if (input.urls.length > 10) throw new Error("Max 10 URLs per batch");

    const res = await this.request("POST", "/remove-batch-url", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: input.urls, format }),
    });
    if (!res.ok) throw new KnockoutError(res.status, await res.text());
    return (await res.json()) as BatchResponse;
  }

  private async request(
    method: "GET" | "POST",
    path: string,
    init: { headers?: Record<string, string>; body?: BodyInit } = {}
  ): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "User-Agent": `useknockout-node/${SDK_VERSION}`,
      ...(init.headers ?? {}),
    };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetchImpl(url, {
        method,
        headers,
        body: init.body,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }
}

async function toBlob(
  input: { file: string | Buffer | Blob | ArrayBuffer | Uint8Array; filename?: string }
): Promise<{ blob: Blob; filename: string }> {
  const { file } = input;
  const filename = input.filename ?? inferFilename(file);

  if (typeof file === "string") {
    const data = await readFile(file);
    return { blob: new Blob([new Uint8Array(data)]), filename };
  }
  if (file instanceof Blob) {
    return { blob: file, filename };
  }
  if (file instanceof ArrayBuffer) {
    return { blob: new Blob([new Uint8Array(file)]), filename };
  }
  if (file instanceof Uint8Array) {
    return { blob: new Blob([new Uint8Array(file)]), filename };
  }
  if (Buffer.isBuffer(file)) {
    return {
      blob: new Blob([new Uint8Array(file)]),
      filename,
    };
  }
  throw new TypeError("Unsupported `file` input. Provide a path, Buffer, Blob, ArrayBuffer, or Uint8Array.");
}

function inferFilename(file: string | Buffer | Blob | ArrayBuffer | Uint8Array): string {
  if (typeof file === "string") return basename(file) || "image";
  return "image";
}

export default Knockout;
