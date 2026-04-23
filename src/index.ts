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
const SDK_VERSION = "0.0.3";

export type OutputFormat = "png" | "webp";
export type OpaqueFormat = "png" | "webp" | "jpg";

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
