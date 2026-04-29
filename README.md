<div align="center">

  # 🥊 @useknockout/node

  **Official TypeScript / Node.js client for [useknockout](https://github.com/useknockout/api) — state-of-the-art background removal API.**

  [![MIT License](https://img.shields.io/badge/license-MIT-3da639)](./LICENSE)
  [![npm version](https://img.shields.io/npm/v/@useknockout/node?color=cb3837)](https://www.npmjs.com/package/@useknockout/node)
  [![npm downloads](https://img.shields.io/npm/dm/@useknockout/node?color=cb3837)](https://www.npmjs.com/package/@useknockout/node)
  [![GitHub stars](https://img.shields.io/github/stars/useknockout/node?style=social)](https://github.com/useknockout/node)
  [![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Node](https://img.shields.io/badge/node-%E2%89%A518-339933?logo=node.js&logoColor=white)](https://nodejs.org)
  [![Zero deps](https://img.shields.io/badge/runtime%20deps-0-success)](./package.json)

  [**Install**](#install) · [**Quick Start**](#quick-start) · [**API**](#api) · [**Framework examples**](#framework-examples) · [**API repo**](https://github.com/useknockout/api)

  <br/>

  <img src="https://raw.githubusercontent.com/useknockout/api/main/docs/hero.png" alt="useknockout before/after — background removal demo" width="800"/>

  <br/>

  *One method call. Transparent PNG out. ~200ms per image.*

</div>

---

- **Zero runtime dependencies** — uses the native `fetch` built into Node 18+
- **First-class TypeScript** — full types, no `any`s in the public API
- **Works anywhere `fetch` works** — Node, Bun, Deno, Vercel/Cloudflare Workers, serverless
- **MIT licensed**

---

## Install

```bash
npm install @useknockout/node
# or
pnpm add @useknockout/node
# or
yarn add @useknockout/node
```

Requires **Node 18+** (for global `fetch` and `FormData`).

## Quick start

### Public beta token

During the public beta, anyone can use this shared bearer token:

```
kno_public_beta_4d7e9f1a3c5b2e8d6a9f7c1b3e5d8a2f
```

No signup — copy, paste, call the API. Need your own key / production limits? DM [@useknockout](https://x.com/useknockout) on X.

### One-minute example

```ts
import { writeFile } from "node:fs/promises";
import { Knockout } from "@useknockout/node";

const client = new Knockout({ token: "kno_public_beta_4d7e9f1a3c5b2e8d6a9f7c1b3e5d8a2f" });

// Remove background — returns transparent PNG buffer
const png = await client.remove({ file: "./input.jpg" });
await writeFile("out.png", png);

// Replace background with a hex color
const jpg = await client.replaceBackground({
  file: "./input.jpg",
  bgColor: "#FF5733",
  format: "jpg",
});
await writeFile("out.jpg", jpg);

// Replace background with a remote image
const composed = await client.replaceBackground({
  file: "./input.jpg",
  bgUrl: "https://example.com/beach.jpg",
});

// Batch — remove bg from up to 10 URLs in one call
const batch = await client.removeBatchUrl({
  urls: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
});
for (const r of batch.results) {
  if (r.success) {
    await writeFile(`out.png`, Buffer.from(r.data_base64!, "base64"));
  }
}
```

### From a Buffer or remote URL

```ts
// From a Buffer (e.g. uploaded via multer)
const buf = await fs.readFile("./input.jpg");
const out = await client.remove({ file: buf, filename: "input.jpg" });

// From a remote URL
const png = await client.removeUrl({ url: "https://example.com/cat.jpg" });
```

### New in 0.0.5 — presets

```ts
// Sticker — thick outline, transparent bg (iMessage / WhatsApp style)
const sticker = await client.sticker({ file: "./photo.jpg", strokeWidth: 24 });

// Outline — thin stroke around subject
const outlined = await client.outline({ file: "./photo.jpg", outlineColor: "#000000", outlineWidth: 4 });

// Smart crop — auto-crop to subject bbox + padding
const cropped = await client.smartCrop({ file: "./photo.jpg", padding: 32 });

// Shadow — drop shadow on a new background
const withShadow = await client.shadow({ file: "./photo.jpg", bgColor: "#F3F4F6" });

// Studio shot — e-commerce preset (centered subject, white bg, shadow, square)
const studio = await client.studioShot({ file: "./photo.jpg", aspect: "1:1" });

// Compare — before/after side-by-side image
const preview = await client.compare({ file: "./photo.jpg" });

// Mask — just the black/white mask for your own pipeline
const mask = await client.mask({ file: "./photo.jpg" });
```

## API

### `new Knockout(options?)`

| Option | Type | Default | Description |
|---|---|---|---|
| `token` | `string` | — | Bearer token. Required unless self-hosting without auth. |
| `baseUrl` | `string` | `https://useknockout--api.modal.run` | Override the API endpoint. |
| `timeoutMs` | `number` | `60_000` | Per-request timeout. |
| `fetch` | `typeof fetch` | `globalThis.fetch` | Custom fetch (for edge runtimes or polyfills). |

### `client.remove(input)`

Remove the background from a local file or in-memory buffer.

| Field | Type | Description |
|---|---|---|
| `file` | `string \| Buffer \| Blob \| ArrayBuffer \| Uint8Array` | File path or raw image bytes. |
| `filename` | `string?` | Optional override — auto-inferred from path if omitted. |
| `format` | `"png" \| "webp"` | Output format. Default `"png"`. |

Returns: `Buffer` of the processed image (PNG or WebP with transparent alpha).

### `client.removeUrl(input)`

Remove the background from a remote image URL.

| Field | Type | Description |
|---|---|---|
| `url` | `string` | Remote image URL. |
| `format` | `"png" \| "webp"` | Output format. Default `"png"`. |

Returns: `Buffer` of the processed image.

### `client.replaceBackground(input)`

Remove the background and composite the subject onto a new background — solid color or remote image.

| Field | Type | Description |
|---|---|---|
| `file` | `string \| Buffer \| Blob \| ArrayBuffer \| Uint8Array` | Foreground image (path or bytes). |
| `filename` | `string?` | Optional filename. |
| `bgColor` | `string?` | Hex color for the new background. Default `"#FFFFFF"`. Ignored if `bgUrl` is set. |
| `bgUrl` | `string?` | Remote URL of a background image. Takes precedence over `bgColor`. |
| `format` | `"png" \| "webp" \| "jpg"` | Output format. Default `"png"`. `"jpg"` for smallest file. |

Returns: `Buffer` of the composited image. Edges refined via closed-form foreground matting (no halos).

### `client.removeBatch(input)`

Remove backgrounds from up to 10 images in a single call.

| Field | Type | Description |
|---|---|---|
| `files` | `Array<string \| Buffer \| Blob \| ArrayBuffer \| Uint8Array>` | 1–10 file paths or buffers. |
| `filenames` | `string[]?` | Optional filename aligned to each file. |
| `format` | `"png" \| "webp"` | Output format. Default `"png"`. |

Returns: `BatchResponse` — `{ count, format, results: [{ filename, success, format, size_bytes, data_base64 | error }] }`. Decode `data_base64` with `Buffer.from(b64, "base64")`.

### `client.removeBatchUrl(input)`

Same as `removeBatch` but takes a JSON array of remote URLs.

| Field | Type | Description |
|---|---|---|
| `urls` | `string[]` | 1–10 remote image URLs. |
| `format` | `"png" \| "webp"` | Output format. Default `"png"`. |

Returns: `BatchResponse` with `url` in place of `filename` in each result.

### `client.mask(input)`

Return just the black/white alpha mask as a grayscale PNG/WebP.

| Field | Type | Description |
|---|---|---|
| `file` | `FileInput` | Image to process. |
| `format` | `"png" \| "webp"` | Default `"png"`. |

Returns: `Buffer` of a grayscale image (0 = bg, 255 = subject).

### `client.smartCrop(input)`

Auto-crop to the subject's tight bounding box + padding.

| Field | Type | Description |
|---|---|---|
| `file` | `FileInput` | Image to process. |
| `padding` | `number` | Padding in pixels. Default `24`. |
| `transparent` | `boolean` | `true` → transparent cutout. `false` → cropped from original. Default `true`. |
| `format` | `"png" \| "webp" \| "jpg"` | Default `"png"` (or `"jpg"` when `transparent=false`). |

### `client.shadow(input)`

Composite subject onto a new background with a configurable drop shadow.

| Field | Type | Description |
|---|---|---|
| `file` | `FileInput` | Image to process. |
| `bgColor` | `string` | Hex color. Default `"#FFFFFF"`. |
| `bgUrl` | `string` | Remote URL. Takes precedence over `bgColor`. |
| `shadowColor` | `string` | Default `"#000000"`. |
| `shadowOffsetX` | `number` | Default `8`. |
| `shadowOffsetY` | `number` | Default `12`. |
| `shadowBlur` | `number` | Default `14`. |
| `shadowOpacity` | `number` | 0.0–1.0. Default `0.45`. |
| `format` | `"png" \| "webp" \| "jpg"` | Default `"png"`. |

### `client.sticker(input)`

Subject with a thick outline on transparent background — sticker style.

| Field | Type | Description |
|---|---|---|
| `file` | `FileInput` | Image to process. |
| `strokeColor` | `string` | Default `"#FFFFFF"`. |
| `strokeWidth` | `number` | Pixels. Default `20`, capped at `80`. |
| `format` | `"png" \| "webp"` | Default `"png"`. |

### `client.outline(input)`

Subject with a thin outline on transparent background.

| Field | Type | Description |
|---|---|---|
| `file` | `FileInput` | Image to process. |
| `outlineColor` | `string` | Default `"#000000"`. |
| `outlineWidth` | `number` | Pixels. Default `4`, capped at `60`. |
| `format` | `"png" \| "webp"` | Default `"png"`. |

### `client.studioShot(input)`

E-commerce preset: cutout + centered on canvas + optional drop shadow + standardized aspect ratio.

| Field | Type | Description |
|---|---|---|
| `file` | `FileInput` | Image to process. |
| `bgColor` | `string` | Canvas color. Default `"#FFFFFF"`. |
| `aspect` | `string` | `"W:H"` format, e.g. `"1:1"`, `"4:5"`, `"16:9"`. Default `"1:1"`. |
| `padding` | `number` | Padding in pixels. Default `48`. |
| `shadow` | `boolean` | Include drop shadow. Default `true`. |
| `format` | `"png" \| "webp" \| "jpg"` | Default `"jpg"`. |

### `client.compare(input)`

Before/after side-by-side preview — original on the left, transparent cutout (on a checkerboard) on the right.

| Field | Type | Description |
|---|---|---|
| `file` | `FileInput` | Image to process. |
| `format` | `"png" \| "webp"` | Default `"png"`. |

### `client.headshot(input)` — v0.4.0

Studio-quality professional headshot — background removed, neutral studio backdrop, optional soft drop shadow, smart crop to bust framing.

| Field | Type | Description |
|---|---|---|
| `file` | `FileInput` | Source portrait. |
| `bgColor` | `string` | Studio backdrop hex. Default `"#f5f5f5"`. |
| `addShadow` | `boolean` | Soft drop shadow. Default `true`. |
| `crop` | `"bust" \| "head" \| "full"` | Default `"bust"`. |
| `format` | `"png" \| "webp" \| "jpg"` | Default `"png"`. |

### `client.preview(input)` — v0.4.0

Cheap, fast low-res preview — 512px max, ~1.5s. Use for thumbnail UI before user pays for full-res.

| Field | Type | Description |
|---|---|---|
| `file` | `FileInput` | Source image. |
| `maxSize` | `number` | Max edge length. Default `512`. |
| `watermark` | `boolean` | Add `useknockout` watermark. Default `false`. |

### `client.estimate(input)` — v0.4.0

Returns expected processing time + output size **without running the model**. Show users "this'll take ~3s, ~1.2 MB" before they hit submit.

```ts
const est = await client.estimate({ width: 2048, height: 1536, endpoint: "remove" });
// { estimated_seconds: 2.4, estimated_output_kb: 1180, warm: true }
```

### `client.stats()` — v0.4.0

Public stats — total images processed, last-24h count, last-7d trend. Powered by Modal Dict cross-container counter. No auth required.

```ts
const stats = await client.stats();
// { total: 12340, last_24h: 312, last_7d: [...] }
```

### `client.upscale(input)` — v0.6.0

**Swin2SR / Real-ESRGAN x2/x4 super-resolution.** Defaults to **Swin2SR** (SwinV2 Transformer) — sharper detail and natural texture on real photos. Pass `model: "realesrgan"` for the legacy backend (better on anime / illustrations).

```ts
const big = await client.upscale({ file: "./small.jpg", scale: 4 });
const anime = await client.upscale({ file: "./art.png", scale: 4, model: "realesrgan" });
```

| Field | Type | Description |
|---|---|---|
| `file` | `FileInput` | Source image. |
| `scale` | `2 \| 4` | Default `4`. |
| `model` | `"swin2sr" \| "realesrgan"` | Default `"swin2sr"`. |
| `format` | `"png" \| "webp" \| "jpg"` | Default `"png"`. |

### `client.faceRestore(input)` — v0.5.0

**GFPGAN v1.4 face restoration.** Detects faces, restores blurred/compressed/damaged ones while preserving identity. Background also upscaled. Multi-face safe.

```ts
const restored = await client.faceRestore({ file: "./blurry-portrait.jpg" });
```

| Field | Type | Description |
|---|---|---|
| `file` | `FileInput` | Image with one or more faces. |
| `format` | `"png" \| "webp" \| "jpg"` | Default `"png"`. |

### `client.health()`

Returns: `Promise<{ status: string; model: string }>`. No auth required.

### `KnockoutError`

Thrown on any non-2xx response. Fields:

- `status` — HTTP status code
- `code` — `"auth" | "rate_limit" | "bad_request" | "payload_too_large" | "server" | "unknown"`
- `body` — raw response body string

```ts
import { KnockoutError } from "@useknockout/node";

try {
  await client.remove({ file: "./huge.jpg" });
} catch (err) {
  if (err instanceof KnockoutError && err.code === "payload_too_large") {
    // retry with a resized image
  }
  throw err;
}
```

## Framework examples

### Next.js App Router

```ts
// app/api/remove/route.ts
import { Knockout } from "@useknockout/node";

const client = new Knockout({ token: process.env.KNOCKOUT_TOKEN! });

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File;
  const buf = Buffer.from(await file.arrayBuffer());

  const png = await client.remove({ file: buf, filename: file.name });

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
}
```

### Express

```ts
import express from "express";
import multer from "multer";
import { Knockout } from "@useknockout/node";

const app = express();
const upload = multer();
const client = new Knockout({ token: process.env.KNOCKOUT_TOKEN! });

app.post("/remove", upload.single("file"), async (req, res) => {
  const png = await client.remove({
    file: req.file!.buffer,
    filename: req.file!.originalname,
  });
  res.type("image/png").send(png);
});
```

### Cloudflare Workers / Vercel Edge

```ts
import { Knockout } from "@useknockout/node";

const client = new Knockout({ token: env.KNOCKOUT_TOKEN });

export default {
  async fetch(req: Request) {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get("url")!;
    const png = await client.removeUrl({ url: imageUrl });
    return new Response(new Uint8Array(png), {
      headers: { "Content-Type": "image/png" },
    });
  },
};
```

## Self-hosting

Point the SDK at your own Modal deployment:

```ts
const client = new Knockout({
  token: "your-self-hosted-token",
  baseUrl: "https://YOUR_WORKSPACE--api.modal.run",
});
```

See [useknockout/api](https://github.com/useknockout/api) for the Modal deployment.

## License

MIT — see [LICENSE](./LICENSE).
