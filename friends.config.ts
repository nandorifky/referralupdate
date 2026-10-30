import type { FriendsConfig } from './src/types/config';

/** Tautan informasi dan bantuan untuk pembaca Referral Update. */
const friends: FriendsConfig = [
  {
    title: 'Tentang dan kurasi',
    description:
      'Kenali sumber kode referral tim editorial dan cara kami memeriksa setiap program.',
    links: [
      {
        name: 'Tentang Referral Update',
        description: 'Sumber kode, tujuan situs, dan manfaat referral.',
        url: '/tentang/',
        icon: 'info',
      },
      {
        name: 'Kurasi Kode Referral',
        description: 'Kriteria publikasi, validasi, dan pembaruan kode.',
        url: '/kurasi-kode-referral/',
        icon: 'badge-check',
      },
    ],
  },
  {
    title: 'Bantuan pembaca',
    description:
      'Hubungi tim editorial atau laporkan kode dan informasi bonus yang tidak sesuai.',
    links: [
      {
        name: 'Laporkan Masalah',
        description: 'Laporkan kode ditolak, bonus berbeda, atau tautan salah.',
        url: '/laporkan-masalah/',
        icon: 'flag',
      },
      {
        name: 'Kontak',
        description: 'Pertanyaan, koreksi informasi, dan kerja sama.',
        url: '/kontak/',
        icon: 'mail',
      },
    ],
  },
  {
    title: 'Ketentuan situs',
    description:
      'Pahami batasan informasi referral dan pengelolaan data pembaca.',
    links: [
      {
        name: 'Disclaimer',
        description: 'Batasan validitas kode, bonus, dan tanggung jawab.',
        url: '/disclaimer/',
        icon: 'file-text',
      },
      {
        name: 'Kebijakan Privasi',
        description: 'Data kunjungan, pesan, penyimpanan lokal, dan hak Anda.',
        url: '/kebijakan-privasi/',
        icon: 'shield-check',
      },
    ],
  },
  {
    title: 'Siapa di balik Referral Update?',
    description:
      'Kenalan dengan pengembang dan penulis konten di balik situs ini.',
    links: [
      {
        name: 'Nando Rifky',
        description:
          'SEO Specialist, pengembang web, dan penulis konten di balik Referral Update.',
        url: 'https://nandorifky.web.id/',
        avatar: '/images/friends/stack.png',
      },
      {
        name: 'Notiska',
        description: 'Penulis dan pengikut program referral dari Pintu.',
        url: '#!',
        avatar: '/images/friends/fuwari.png',
      },
      {
        name: 'Ahmad Fikri',
        description:
          'Perencana dan pencari referral program dari berbagai aplikasi.',
        url: '#!',
        avatar: '/images/friends/astropaper-author.png',
      },
    ],
  },
];

export default friends;
