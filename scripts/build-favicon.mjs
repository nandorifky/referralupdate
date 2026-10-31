// Rasterize public/favicon.svg into the PNG sizes browsers/devices expect.
// Run after editing the SVG, before building: `node scripts/build-favicon.mjs`
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '..', 'public');
const svgPath = join(publicDir, 'favicon.svg');

const svg = await readFile(svgPath);

const sizes = [16, 32, 180, 192, 512];

await Promise.all(
  sizes.map(async (size) => {
    const out = join(publicDir, `favicon-${size}.png`);
    await sharp(svg, { density: 384 })
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log(`wrote ${out}`);
  }),
);

// apple-touch-icon must be named exactly that for older iOS.
await sharp(svg, { density: 384 })
  .resize(180, 180)
  .png({ compressionLevel: 9 })
  .toFile(join(publicDir, 'apple-touch-icon.png'));
console.log('wrote apple-touch-icon.png');

// Optimized webmanifest icon set (192 + 512) already covered above.
const manifest = {
  name: 'Referral Update',
  short_name: 'RefUpdate',
  description:
    'Kode referral terbaru dari berbagai platform dengan informasi bonus dan validasi berkala.',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#171717',
  theme_color: '#171717',
  icons: [
    { src: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/favicon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
  ],
};

await writeFile(
  join(publicDir, 'site.webmanifest'),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log('wrote site.webmanifest');
