#!/usr/bin/env node
/**
 * Interactive content generator with menu system.
 * Usage: node tools/new-content.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentRoot = path.join(__dirname, '..', 'content');
const publicRoot = path.join(__dirname, '..', 'public', 'images');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

const select = async (question, options) => {
  console.log(`\n${question}`);
  options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt.label}`));
  let choice;
  while (true) {
    choice = await prompt('\nPilih nomor: ');
    if (choice >= 1 && choice <= options.length) {
      return options[choice - 1];
    }
    console.log('Input tidak valid.');
  }
};

const confirm = async (question) => {
  const answer = await prompt(`\n${question} (y/n): `);
  return answer.toLowerCase() === 'y';
};

function formatDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function promptField(name, description, options = {}) {
  const { required = true, defaultValue = '', multiline = false } = options;
  let value = '';

  while (true) {
    if (multiline) {
      console.log(`\n${description} (tekan Enter 2x ketika selesai):`);
      let lines = [];
      let emptyCount = 0;
      while (emptyCount < 2) {
        const line = await prompt('> ');
        if (!line) {
          emptyCount++;
        } else {
          emptyCount = 0;
          lines.push(line);
        }
      }
      value = lines.join('\n').trim();
    } else {
      const suffix = defaultValue ? ` [${defaultValue}]` : required ? ' *' : '';
      value = await prompt(`${description}${suffix}: `);
      if (!value && defaultValue) value = defaultValue;
    }

    if (required && !value) {
      console.log('⚠️  Wajib diisi.');
      continue;
    }
    break;
  }
  return value;
}

/** Normalisasi input path: strip quote, ganti backslash, handle drive letter. */
function normalizePath(input) {
  let p = (input || '').trim();
  // Buang quote pembungkus
  if (
    (p.startsWith('"') && p.endsWith('"')) ||
    (p.startsWith("'") && p.endsWith("'"))
  ) {
    p = p.slice(1, -1).trim();
  }
  // Windows backslash -> forward slash
  p = p.replace(/\\/g, '/');
  // Pastikan drive letter format: C:/Users/... (bukan C:/Users)
  return p;
}

const ALLOWED_EXT = new Set([
  '.webp',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.avif',
  '.gif',
]);

async function uploadOneImage(context) {
  const imagePathRaw = await promptField(
    'imagePath',
    'Path file gambar (cth: C:/Users/DESKTOP/Downloads/gambar.webp)',
    { required: true },
  );

  const imagePath = normalizePath(imagePathRaw);
  const ext = path.extname(imagePath).toLowerCase();

  if (!ALLOWED_EXT.has(ext)) {
    console.error(
      `❌ Format tidak didukung: ${ext || '(tanpa ekstensi)'}. Pakai webp/png/jpg/jpeg/svg/avif/gif.`,
    );
    return null;
  }

  const fullPath = path.isAbsolute(imagePath)
    ? imagePath
    : path.resolve(process.cwd(), imagePath);

  try {
    await fs.access(fullPath, fs.constants.R_OK);
  } catch {
    console.error(`❌ File tidak ditemukan atau tidak bisa dibaca: ${fullPath}`);
    return null;
  }

  try {
    const imageData = await fs.readFile(fullPath);
    const fileName = path.basename(fullPath);

    let subdir = 'general';
    if (context) subdir = context.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const destDir = path.join(publicRoot, subdir);
    await fs.mkdir(destDir, { recursive: true });

    const base = path.basename(fileName, ext);
    const destPath = path.join(destDir, fileName);
    let finalName = fileName;
    if (
      await fs
        .access(destPath)
        .then(() => true)
        .catch(() => false)
    ) {
      finalName = `${base}-${Date.now()}${ext}`;
      console.log(`⚠️  Nama sudah ada, rename ke ${finalName}`);
    }

    await fs.writeFile(path.join(destDir, finalName), imageData);

    const mdPath = `/images/${subdir}/${finalName}`;
    const altText = await promptField('altText', 'Alt text gambar', {
      required: false,
      defaultValue: base,
    });

    return {
      path: mdPath,
      alt: altText || base,
    };
  } catch (err) {
    console.error(`❌ Upload gambar gagal: ${err.message}`);
    return null;
  }
}

/** Loop upload banyak gambar. Return array {path, alt}. */
async function uploadImages(context) {
  const images = [];
  if (!(await confirm('Tambah gambar?'))) return images;

  while (true) {
    const img = await uploadOneImage(context);
    if (img) {
      images.push(img);
      console.log(`✅ Gambar diupload: ${img.path}`);
    }
    if (!(await confirm('Tambah gambar lagi?'))) break;
  }
  return images;
}

/** Sisipkan gambar ke badan artikel (setelah heading # pertama). */
function embedImages(body, images) {
  if (!images.length) return body;
  const gallery = images
    .map((img) => `![${img.alt}](${img.path})`)
    .join('\n\n');
  const lines = body.split('\n');
  const headingIdx = lines.findIndex((l) => l.startsWith('# '));
  if (headingIdx === -1) return `${gallery}\n\n${body}`;
  lines.splice(headingIdx + 1, 0, '', gallery, '');
  return lines.join('\n');
}

async function createReferral() {
  console.log('\n═══ BUAT KODE REFERRAL ═══\n');

  const industry = await promptField(
    'industry',
    'Industri (cth: keuangan, investasi, e-commerce)',
    { required: true },
  );

  const brand = await promptField('brand', 'Brand/Nama platform (slug)', {
    required: true,
  });

  const title = await promptField('title', 'Judul lengkap', { required: true });
  const description = await promptField('description', 'Meta description', {
    required: true,
  });
  const summary = await promptField(
    'summary',
    'Summary/ringkasan poin kunci',
    { required: true, multiline: true },
  );

  const code = await promptField(
    'code',
    'Kode referral (atau kosongkan untuk URL saja)',
    { required: false },
  );
  const referralUrl = await promptField(
    'referralUrl',
    'URL referral (atau kosongkan untuk kode saja)',
    { required: false },
  );

  if (!code && !referralUrl) {
    console.error('❌ Minimal perlu kode atau URL.');
    return;
  }

  const benefit = await promptField('benefit', 'Deskripsi benefit', {
    required: true,
  });

  const benefitTypeOpt = await select('Tipe benefit:', [
    { label: 'Saldo' },
    { label: 'Cashback' },
    { label: 'Diskon' },
    { label: 'Poin' },
    { label: 'Komisi' },
    { label: 'Promo' }
  ]);
  const benefitType = benefitTypeOpt.label.toLowerCase();

  const statusOpt = await select('Status kode:', [
    { label: 'Aktif' },
    { label: 'Habis' },
  ]);
  const status = statusOpt.label.toLowerCase();

  const now = formatDate();

  const frontmatter = `---
title: '${title}'
description: '${description}'
slug: '${brand}'
date: '${now}'
categories: ['${industry}', '${brand}']
tags: ['referral-program']
featured: true
draft: true
summary: |
  ${summary}
code: '${code || ''}'
referralUrl: '${referralUrl || ''}'
benefit: '${benefit}'
benefitType: '${benefitType}'
status: '${status}'
verifiedAt: '${now}'
mermaid: true
toc: true
lightbox: true
coverStyle: 'thumbnail'
---

# ${title}

Jelaskan program referral secara umum.

## Kode Referral

${code ? `Gunakan kode: **${code}**` : `Gunakan link: [${referralUrl}](${referralUrl})`}

## Keuntungan Program

### 1. Bonus Pertama

Jelaskan tahap pertama bonus dan persyaratan.

### 2. Bonus Tambahan

Jelaskan tahap kedua bonus dan persyaratan lanjutan.

### 3. Total Bonus

Ringkas total bonus jika semua persyaratan terpenuhi.

| Tahapan | Persyaratan | Bonus |
|---------|-------------|-------|
| Tahap 1 | [Persyaratan] | [Nominal] |
| Tahap 2 | [Persyaratan] | [Nominal] |
| **Total** | Lengkap semua | **[Total]** |

## Alur Klaim Bonus

\`\`\`mermaid
flowchart TD
    A["Daftar dengan kode/link referral"] --> B["Selesaikan verifikasi identitas"]
    B --> C["Bonus tahap pertama"]
    C --> D["Penuhi persyaratan lanjutan"]
    D --> E["Klaim bonus tahap kedua"]
    E --> F["Total bonus diterima"]
\`\`\`

## Syarat Mendapatkan Bonus

1. Daftar akun baru menggunakan kode referral.
2. Selesaikan verifikasi identitas (KYC).
3. Penuhi persyaratan lanjutan (deposit, trading, dll).
4. Jangan melakukan aktivitas yang melanggar ketentuan.

## Cara Mendaftar dan Verifikasi

1. Buka platform resmi.
2. Pilih menu Daftar/Register.
3. Masukkan kode referral${code ? `: **${code}**` : ' dari link'}.
4. Lengkapi informasi kontak.
5. Selesaikan verifikasi identitas (KYC).

## Cara Klaim Bonus

1. Masuk ke akun.
2. Buka menu Reward/Hadiah/Bonus.
3. Cek bonus yang tersedia untuk diklaim.
4. Klik tombol klaim atau claim reward.

## FAQ

### Berapa total bonus yang bisa didapat?

Lihat tabel di atas untuk detail nominal bonus setiap tahap.

### Berapa lama bonus masuk?

Biasanya bonus muncul dalam 3 hari setelah persyaratan terpenuhi.

### Bagaimana jika bonus belum masuk?

Periksa status di menu Reward. Hubungi layanan pelanggan jika ada masalah.

## Kesimpulan

Gunakan kode referral untuk mendapatkan bonus hingga sesuai nominal. Pastikan semua persyaratan terpenuhi agar bonus dapat diklaim dengan lancar.
`;

  const images = await uploadImages(brand);
  const body = embedImages(frontmatter, images);

  const dir = path.join(contentRoot, 'referrals', brand);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, 'index.mdx');

  await fs.writeFile(filePath, body);
  console.log(`\n✅ Referral page dibuat: ${filePath}`);
  console.log(
    images.length
      ? `✅ ${images.length} gambar disisipkan ke artikel.`
      : 'ℹ️  Tidak ada gambar.',
  );
}

async function createPost() {
  console.log('\n═══ BUAT ARTIKEL PENDUKUNG ═══\n');

  const brand = await promptField('brand', 'Brand/kategori utama (slug)', {
    required: true,
  });
  const slug = await promptField('slug', 'Slug artikel (URL path)', {
    required: true,
  });
  const title = await promptField('title', 'Judul artikel', { required: true });
  const description = await promptField('description', 'Meta description', {
    required: true,
  });
  const summary = await promptField(
    'summary',
    'Summary poin-poin kunci',
    { required: true, multiline: true },
  );

  const tagsInput = await promptField('tags', 'Tags (comma-separated)', {
    required: false,
    defaultValue: 'tips',
  });
  const tags = tagsInput
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const now = formatDate();

  const frontmatter = `---
title: '${title}'
slug: '${slug}'
date: '${now}'
description: '${description}'
summary: |
  ${summary}
categories: ['${brand}']
tags: [${tags.map((t) => `'${t}'`).join(', ')}]
referral: true
featured: false
draft: true
mermaid: false
toc: true
callouts: true
lightbox: true
display:
  author: true
  published: true
  readingTime: true
  updated: false
  tags: true
  share: true
  navigation: true
---

# ${title}

Jelaskan konteks atau latar belakang topik artikel.

## Poin Utama 1

Jelaskan detail poin pertama dengan contoh konkret.

## Poin Utama 2

Jelaskan detail poin kedua dengan contoh konkret.

## Poin Utama 3

Jelaskan detail poin ketiga dengan contoh konkret.

## FAQ

### Pertanyaan 1?

Jawaban singkat.

### Pertanyaan 2?

Jawaban singkat.

## Kesimpulan

Rangkum poin-poin penting dan berikan rekomendasi untuk pembaca.
`;

  const images = await uploadImages(brand);
  const body = embedImages(frontmatter, images);

  const dir = path.join(contentRoot, 'posts', brand);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${slug}.md`);

  await fs.writeFile(filePath, body);
  console.log(`\n✅ Artikel dibuat: ${filePath}`);
  console.log(
    images.length
      ? `✅ ${images.length} gambar disisipkan ke artikel.`
      : 'ℹ️  Tidak ada gambar.',
  );
}

async function createPage() {
  console.log('\n═══ BUAT HALAMAN STATIS ═══\n');

  const slug = await promptField('slug', 'Slug halaman (URL path)', {
    required: true,
  });
  const title = await promptField('title', 'Judul halaman', { required: true });
  const description = await promptField('description', 'Meta description', {
    required: false,
  });

  const frontmatter = `---
title: '${title}'
slug: '${slug}'
description: '${description}'
draft: true
toc: false
---

# ${title}

Tuliskan konten halaman di sini.

## Bagian 1

Jelaskan konten bagian pertama.

## Bagian 2

Jelaskan konten bagian kedua.
`;

  const images = await uploadImages(slug);
  const body = embedImages(frontmatter, images);

  const dir = path.join(contentRoot, 'pages', slug);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, 'index.md');

  await fs.writeFile(filePath, body);
  console.log(`\n✅ Halaman dibuat: ${filePath}`);
  console.log(
    images.length
      ? `✅ ${images.length} gambar disisipkan ke artikel.`
      : 'ℹ️  Tidak ada gambar.',
  );
}

async function main() {
  console.log('\n╔════════════════════════════════╗');
  console.log('║   Content Generator - ref-update   ║');
  console.log('╚════════════════════════════════╝');

  const typeOpt = await select('Apa yang ingin dibuat?', [
    { label: 'Kode Referral (Referral Page)' },
    { label: 'Artikel Pendukung (Supporting Post)' },
    { label: 'Halaman Statis (Page)' },
  ]);

  try {
    if (typeOpt.label.includes('Referral')) await createReferral();
    else if (typeOpt.label.includes('Pendukung')) await createPost();
    else if (typeOpt.label.includes('Statis')) await createPage();
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }

  console.log('\n✨ Selesai! File siap untuk diedit dan dipublikasikan.\n');
}

main();
