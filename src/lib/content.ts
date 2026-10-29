import { postPath } from './post-path';
import { getCollection, type CollectionEntry } from 'astro:content';
import config from './config';
import type { Locale } from '../types/config';
import { canDiscover, canRender } from './policy';
import {
  chooseVariants,
  assertUniqueSlugs,
  assertMatchingSlugs,
} from './content-variants';
import { href } from './i18n';
import { introPageSlug, introRoutes } from './intro-config';
import { publicRoute } from './public-routes';
import { articleBrand, referralIndustry } from './referral';

export type Post = CollectionEntry<'posts'>;
export type Referral = CollectionEntry<'referrals'>;
/** Any routable article: a supporting post or a referral code page. */
export type Entry = Post | Referral;
type TermKind = 'categories' | 'tags';
export type TextEntry =
  | CollectionEntry<'pages'>
  | CollectionEntry<'categories'>
  | CollectionEntry<'tags'>;
const choose = <
  T extends { data: { _key: string; _locale?: string; slug: string } },
>(
  entries: T[],
  lang: Locale,
  kind: string,
) =>
  assertUniqueSlugs(
    chooseVariants(
      entries,
      lang,
      config.site.defaultLocale,
      config.site.locales,
    ),
    `${lang}/${kind}`,
  );
export async function articlesFor(
  lang: Locale,
  includeHidden = false,
): Promise<Post[]> {
  const posts = assertMatchingSlugs(await getCollection('posts')).filter(
    (post) =>
      canRender(post.data, import.meta.env.DEV, config.posts.showDraftsInDev),
  );
  return choose(posts, lang, 'posts')
    .filter((post) => includeHidden || !post.data.hidden)
    .sort(
      (a, b) =>
        Number(b.data.featured) - Number(a.data.featured) ||
        b.data.date.getTime() - a.data.date.getTime(),
    );
}
export async function referralsFor(
  lang: Locale,
  includeHidden = false,
): Promise<Referral[]> {
  const referrals = assertMatchingSlugs(
    await getCollection('referrals'),
  ).filter((entry) =>
    canRender(entry.data, import.meta.env.DEV, config.posts.showDraftsInDev),
  );
  return choose(referrals, lang, 'referrals')
    .filter((entry) => includeHidden || !entry.data.hidden)
    .sort(
      (a, b) =>
        Number(b.data.featured) - Number(a.data.featured) ||
        b.data.date.getTime() - a.data.date.getTime(),
    );
}
/** Referral pages and supporting articles share feeds, hubs, and search. */
export async function entriesFor(
  lang: Locale,
  includeHidden = false,
): Promise<Entry[]> {
  const [articles, referrals] = await Promise.all([
    articlesFor(lang, includeHidden),
    referralsFor(lang, includeHidden),
  ]);
  return [...articles, ...referrals].sort(
    (a, b) =>
      Number(b.data.featured) - Number(a.data.featured) ||
      b.data.date.getTime() - a.data.date.getTime(),
  );
}
export function isReferral(entry: Entry): entry is Referral {
  return entry.collection === 'referrals';
}
export async function textEntriesFor<K extends 'pages' | TermKind>(
  kind: K,
  lang: Locale,
) {
  const entries = assertMatchingSlugs(await getCollection(kind));
  return choose(
    entries.filter(
      (entry) =>
        !entry.data.draft ||
        (import.meta.env.DEV && config.posts.showDraftsInDev),
    ),
    lang,
    kind,
  );
}
export async function pageFor(slug: string, lang: Locale) {
  const pages = await textEntriesFor('pages', lang);
  return pages.find((page) => page.data.slug === slug);
}
function introSlug(route: string): string | undefined {
  return introPageSlug(config, route);
}
export async function introFor(route: string, lang: Locale) {
  const slug = introSlug(route);
  if (!slug) return undefined;
  const page = await pageFor(slug, lang);
  if (!page)
    throw new Error(`Missing pages content for ${route}: ${slug} (${lang}).`);
  return page;
}
export function isReservedPage(slug: string) {
  return /^(404|posts|kode-referral|referrals|categories|kategori|tags|search|archives|arsip|links|tautan|page-og|og|rss\.xml|search-data\.json)(\/|$)/.test(
    slug,
  );
}
export function isIntroOnly(slug: string) {
  return introRoutes.some(
    (route) => introSlug(route) === slug || publicRoute(route) === slug,
  );
}
export async function discoverableArticles(lang: Locale): Promise<Post[]> {
  return (await articlesFor(lang)).filter((post) => canDiscover(post.data));
}
/** Public articles of both types, used by home, search, and navigation. */
export async function discoverableEntries(lang: Locale): Promise<Entry[]> {
  return (await entriesFor(lang)).filter((entry) => canDiscover(entry.data));
}
export const encodedSlug = (slug: string) =>
  slug.split('/').map(encodeURIComponent).join('/');
export function postHref(post: Post, lang: Locale): string {
  return href(
    lang,
    `posts/${encodedSlug(postPath(post.data, config.posts.pathPrefix, config.site.timezone))}/`,
  );
}
export function referralHref(referral: Referral, lang: Locale): string {
  return href(
    lang,
    `${publicRoute('referrals')}/${encodedSlug(referral.data.slug)}/`,
  );
}
/** Route an article to `/posts/` or `/kode-referral/` without callers branching. */
export function articleHref(entry: Entry, lang: Locale): string {
  return isReferral(entry)
    ? referralHref(entry, lang)
    : postHref(entry, lang);
}
export function readingMinutes(post: { body?: string }): number {
  const body = post.body ?? '';
  const chinese = (body.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const words = body
    .replace(/[\u4e00-\u9fff]/g, '')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(chinese / 350 + words / 220));
}
export async function taxonomy(
  kind: TermKind,
  lang: Locale,
  includeHidden = false,
) {
  const definitions = await textEntriesFor(kind, lang);
  const groups = new Map<string, Entry[]>(
    definitions.map((entry) => [entry.data.slug, []]),
  );
  const hiddenReferences = new Set<string>();
  for (const entry of await entriesFor(lang, true))
    for (const key of entry.data[kind]) {
      if (!groups.has(key)) groups.set(key, []);
      if (entry.data.hidden) hiddenReferences.add(key);
      else groups.get(key)!.push(entry);
    }
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, posts]) => {
      const entry = definitions.find((entry) => entry.data.slug === slug);
      return {
        slug,
        // A brand hub always leads with its referral page.
        posts: [...posts].sort(
          (a, b) => Number(isReferral(b)) - Number(isReferral(a)),
        ),
        entry,
        hidden:
          !!entry?.data.hidden ||
          (hiddenReferences.has(slug) && posts.length === 0),
      };
    })
    .filter((group) => includeHidden || !group.hidden);
}
export async function taxonomyLabels(lang: Locale) {
  const result: {
    categories: Record<string, string>;
    tags: Record<string, string>;
  } = { categories: Object.create(null), tags: Object.create(null) };
  for (const kind of ['categories', 'tags'] as const)
    for (const entry of await textEntriesFor(kind, lang))
      result[kind][entry.data.slug] = entry.data.title;
  return result;
}

/** The referral page a supporting article belongs to, if its brand has one. */
export async function referralFor(post: Post, lang: Locale) {
  const brand = articleBrand(post.data);
  if (!brand) return undefined;
  return (await referralsFor(lang, true)).find(
    (entry) => entry.data.slug === brand,
  );
}

/** Supporting articles of the same brand, used to link downward from a page. */
export async function supportsFor(referral: Referral, lang: Locale) {
  const brand = referral.data.slug;
  return (await articlesFor(lang)).filter(
    (entry) =>
      entry.data.referral &&
      canDiscover(entry.data) &&
      articleBrand(entry.data) === brand,
  );
}

/** Industry a brand belongs to, taken from its referral page. */
export async function industryForBrand(brand: string, lang: Locale) {
  const referral = (await referralsFor(lang, true)).find(
    (entry) => entry.data.slug === brand,
  );
  return referral ? referralIndustry(referral.data) : undefined;
}
