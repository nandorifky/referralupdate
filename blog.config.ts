import type { BlogConfig } from './src/types/config';

/** Frequent identity, copy and content settings come first; optional services follow reading defaults. */
const config: BlogConfig = {
  site: {
    title: 'Referral Update',
    baseUrl: 'https://referralupdate.com/', // Include the deployment directory, e.g. https://example.com/blog/.
    defaultLocale: 'id',
    locales: ['id'],
    localePrefixPolicy: 'omit-default-prefix',
    timezone: 'Asia/Jakarta',
  },
  author: {
    name: 'Referral Update',
    bio: 'Tim editorial Referral Update membagikan kode referral milik sendiri dari program berbagai platform, dengan informasi bonus dan validasi yang diperbarui secara berkala.',
    avatar: '/images/avatar.webp',
    socials: [
      {
        label: 'GitHub',
        icon: 'simple-icons:github',
        href: '', // Kosongkan untuk menyembunyikan tautan tanpa menghapus datanya.
      },
      {
        label: 'YouTube',
        icon: 'simple-icons:youtube',
        href: '',
      },
      {
        label: 'Email',
        icon: 'lucide:mail',
        href: 'mailto:halo@referralupdate.com',
      },
    ],
  },
  text: {
    siteDescription:
      'Referral Update membagikan kode referral milik tim editorial yang mengikuti program resmi berbagai platform. Temukan informasi bonus, syarat penggunaan, dan hasil validasi kode yang diperbarui secara berkala.',
    tabs: {
      search: 'Halo',
      posts: 'Artikel',
    },
    homeHeading: 'Kode referral apa yang ingin Anda temukan hari ini?',
    searchHeading: 'Masukkan kata kunci untuk menemukan artikel',
    searchPlaceholder: 'Misal, "kode referral X"',
    notFoundMessage: 'Halaman yang Anda cari tidak ditemukan.',
    footerDescription:
      'Kode referral tim editorial, diperiksa dan diperbarui secara berkala.',
  },
  seo: {
    robots: 'index,follow,max-image-preview:large',
    keywords: 'referral update, kode referral',
    twitter: {},
  },
  posts: {
    perPage: 5,
    homeLimit: 4,
    menuLimit: 12, // Plus-menu articles; use 99999 to include all.
    randomLimit: 12, // Independent candidate count for the random button and /random.
    pathPrefix: '', // Optional date directory, e.g. [year]/ or [year]/[month]/.
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    showDraftsInDev: true,
  },
  sidebar: {
    items: [
      {
        id: 'home',
        type: 'builtin',
        route: 'home',
        label: 'Beranda',
        icon: 'square-pen',
      },
      {
        id: 'posts',
        type: 'builtin',
        route: 'posts',
        page: 'posts',
        label: 'Artikel',
        icon: 'files',
      },
      {
        id: 'referrals',
        type: 'builtin',
        route: 'referrals',
        page: 'kode-referral',
        label: 'Kode Referral',
        icon: 'badge-percent',
      },
      {
        id: 'categories',
        type: 'builtin',
        route: 'categories',
        page: 'kategori',
        label: 'Kategori',
        icon: 'shapes',
      },
      {
        id: 'archives',
        type: 'builtin',
        route: 'archives',
        page: 'arsip',
        label: 'Arsip',
        icon: 'archive',
      },
      {
        id: 'links',
        type: 'builtin',
        route: 'links',
        page: 'tautan',
        label: 'Tautan',
        icon: 'link',
      },
      {
        id: 'about',
        type: 'page',
        page: 'tentang',
        label: 'Tentang',
        icon: 'info',
      },
      {
        id: 'curation',
        type: 'page',
        page: 'kurasi-kode-referral',
        label: 'Kurasi Kode',
        icon: 'badge-check',
      },
      {
        id: 'report',
        type: 'page',
        page: 'laporkan-masalah',
        label: 'Laporkan Masalah',
        icon: 'flag',
      },
      {
        id: 'contact',
        type: 'page',
        page: 'kontak',
        label: 'Kontak',
        icon: 'mail',
      },
    ],
    menu: [
      {
        id: 'home',
        type: 'builtin',
        route: 'home',
        label: 'Beranda',
        description: 'Pencarian dan artikel terbaru',
      },
      {
        id: 'posts',
        type: 'builtin',
        route: 'posts',
        page: 'posts',
        label: 'Artikel',
        description: 'Jelajahi semua artikel',
      },
      {
        id: 'referrals',
        type: 'builtin',
        route: 'referrals',
        page: 'kode-referral',
        label: 'Kode Referral',
        description: 'Jelajahi semua kode referral',
      },
      {
        id: 'about',
        type: 'page',
        page: 'tentang',
        label: 'Tentang',
        description: 'Tentang Referral Update',
      },
      {
        id: 'curation',
        type: 'page',
        page: 'kurasi-kode-referral',
        label: 'Kurasi Kode Referral',
        description: 'Proses validasi dan pembaruan kode',
      },
      {
        id: 'report',
        type: 'page',
        page: 'laporkan-masalah',
        label: 'Laporkan Masalah',
        description: 'Laporkan kode atau bonus yang tidak sesuai',
      },
      {
        id: 'contact',
        type: 'page',
        page: 'kontak',
        label: 'Kontak',
        description: 'Hubungi tim editorial',
      },
      {
        id: 'disclaimer',
        type: 'page',
        page: 'disclaimer',
        label: 'Disclaimer',
        description: 'Batasan informasi dan manfaat referral',
      },
      {
        id: 'privacy',
        type: 'page',
        page: 'kebijakan-privasi',
        label: 'Kebijakan Privasi',
        description: 'Pengelolaan data pembaca',
      },
    ],
    width: {
      default: 340,
      min: 240,
      max: 480,
    },
  },
  appearance: {
    defaultTheme: 'system',
    pageTransition: 'fade',
    codeThemes: {
      light: 'github-light',
      dark: 'github-dark',
    },
    showCodeLineNumbers: false,
    categoryCoverStyle: 'thumbnail',
  },
  article: {
    display: {
      author: true,
      published: true,
      readingTime: true,
      updated: true,
      tags: true,
      share: true,
      navigation: true,
      title: true,
    },
    math: true,
    mermaid: true,
    lightbox: true,
    callouts: true,
    toc: {
      enabled: true,
      minDepth: 2,
      maxDepth: 4,
      expandDelay: 1000,
      hideDelay: 800,
    },
    shareCover: {
      enabled: true,
      width: 1200,
      height: 630,
      background: '#f5f5f5',
      foreground: '#171717',
      accent: '#3b82f6',
    },
  },
  footer: {
    since: 2024,
    author: 'Nando Rifky',
    showAttribution: false,
    license: {
      label: 'CC BY-NC-SA 4.0',
      url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    },
  },
  sharing: {
    copyFormat: '{title}\n{description}\n{author} · {blog}\n{url}',
    platforms: [
      {
        name: 'X',
        icon: 'simple-icons:x',
        href: 'https://twitter.com/intent/tweet?text={title}&url={url}',
      },
      {
        name: 'Facebook',
        icon: 'simple-icons:facebook',
        href: 'https://www.facebook.com/sharer/sharer.php?u={url}',
      },
      {
        name: 'LinkedIn',
        icon: 'simple-icons:linkedin',
        href: 'https://www.linkedin.com/sharing/share-offsite/?url={url}',
      },
      {
        name: 'Reddit',
        icon: 'simple-icons:reddit',
        href: 'https://www.reddit.com/submit?url={url}&title={title}',
      },
      {
        name: 'Bluesky',
        icon: 'simple-icons:bluesky',
        href: 'https://bsky.app/intent/compose?text={text}',
      },
      {
        name: 'Threads',
        icon: 'simple-icons:threads',
        href: 'https://www.threads.net/intent/post?text={text}',
      },
      {
        name: 'Telegram',
        icon: 'simple-icons:telegram',
        href: 'https://t.me/share/url?url={url}&text={title}',
      },
      {
        name: 'WhatsApp',
        icon: 'simple-icons:whatsapp',
        href: 'https://wa.me/?text={text}',
      },
      {
        name: 'LINE',
        icon: 'simple-icons:line',
        href: 'https://social-plugins.line.me/lineit/share?url={url}',
      },
      {
        name: 'Weibo',
        icon: 'simple-icons:sinaweibo',
        href: 'https://service.weibo.com/share/share.php?url={url}&title={title}&pic={image}',
      },
      {
        name: 'QQ',
        icon: 'simple-icons:qq',
        href: 'https://connect.qq.com/widget/shareqq/index.html?url={url}&title={title}&summary={description}&desc={description}&site={blog}&pics={image}',
      },
      {
        name: 'QQ Space',
        icon: 'simple-icons:qzone',
        href: 'https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url={url}&title={title}&summary={description}&pics={image}',
      },
      {
        name: 'Tumblr',
        icon: 'simple-icons:tumblr',
        href: 'https://www.tumblr.com/widgets/share/tool?canonicalUrl={url}&title={title}&caption={description}&posttype=link',
      },
      {
        name: 'Pinterest',
        icon: 'simple-icons:pinterest',
        href: 'https://www.pinterest.com/pin/create/button/?url={url}&media={image}&description={title}',
      },
      {
        name: 'Email',
        icon: 'lucide:mail',
        href: 'mailto:?subject={title}&body={text}',
      },
    ],
  },
  statistics: {
    enabled: true,
    articleCount: true,
    wordCount: true,
    days: true,
    languages: true,
    averageWords: true,
    updateFrequency: true,
    firstPublication: true,
    lastUpdate: true,
    heatmap: true,
    recentWords: true,
    recentLimit: 12,
  },
};

export default config;
