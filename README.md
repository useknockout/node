# @useknockout/node

> Official TypeScript / Node.js client for [useknockout](https://github.com/useknockout/api) — state-of-the-art background removal API.

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

```ts
import { writeFile } from "node:fs/promises";
import { Knockout } from "@useknockout/node";

const client = new Knockout({ token: process.env.KNOCKOUT_TOKEN! });

// 1. From a local file path
const png = await client.remove({ file: "./input.jpg" });
await writeFile("./output.png", png);

// 2. From a Buffer (e.g. uploaded via multer)
const buf = await fs.readFile("./input.jpg");
const out = await client.remove({ file: buf, filename: "input.jpg" });

// 3. From a remote URL
const url = await client.removeUrl({ url: "https://example.com/cat.jpg" });
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
