# Content generator CLI tool

## Usage

```bash
pnpm new:content
```

atau

```bash
node tools/new-content.mjs
```

## Features

✅ **Menu interaktif** — pilih tipe konten (referral, post, atau page)
✅ **Frontmatter otomatis** — semua field terisi sesuai skema
✅ **Upload gambar** — opsi tambah & upload gambar ke `public/images/`
✅ **Template siap pakai** — konten sudah include struktur dasar

## Tipe Konten

### 1. Kode Referral (Referral Page)
- Path: `content/referrals/<brand>/index.mdx`
- Includes: kode, URL, benefit, status, mermaid diagram
- Category: `[industry, brand]` (2 kategori wajib)

### 2. Artikel Pendukung (Post)
- Path: `content/posts/<brand>/<slug>.md`
- Includes: summary, tags, FAQ section
- Category: `[brand]` (1 kategori untuk silo)
- Flag: `referral: true`

### 3. Halaman Statis (Page)
- Path: `content/pages/<slug>/index.md`
- Minimal frontmatter, no date required

## Workflow

1. Jalankan `pnpm new:content`
2. Pilih jenis konten
3. Isi field interaktif di CLI
4. Optional: upload gambar saat prompt
5. File otomatis dibuat di folder yang tepat
6. Edit konten, ubah `draft: true` → `draft: false` saat siap publikasi

## File yang dihasilkan

- Content file: `content/<type>/<path>/index.md` atau `.md`
- Images (jika diupload): `public/images/<brand>/nama-file`
- Semua frontmatter sudah valid sesuai schema
