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
const SDK_VERSION = "0.0.1";

export type OutputFormat = "png" | "webp";

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
  input: RemoveInput
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

function inferFilename(file: RemoveInput["file"]): string {
  if (typeof file === "string") return basename(file) || "image";
  return "image";
}

export default Knockout;
