// Rasterize public/og-image.svg into public/og-image.png at 1200x630.
// Runs in the npm "prebuild" hook so Netlify regenerates the PNG on every deploy.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, "..", "public");

const svg = await readFile(join(pub, "og-image.svg"), "utf8");
const png = new Resvg(svg, {
  fitTo: { mode: "width", value: 1200 },
}).render().asPng();
await writeFile(join(pub, "og-image.png"), png);
console.log(`og-image.png written (${png.byteLength} bytes)`);
