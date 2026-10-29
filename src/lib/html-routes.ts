import config from './config';
import {
  articlesFor,
  referralsFor,
  articleHref,
  textEntriesFor,
  taxonomy,
  isIntroOnly,
  encodedSlug,
} from './content';
import { href } from './i18n';
import { publicRoute } from './public-routes';
import type { Locale } from '../types/config';

/** Actual rendered HTML destinations, including unlisted but routable content. */
export async function htmlRoutes(lang: Locale): Promise<string[]> {
  const paths = [
    '',
    publicRoute('posts'),
    publicRoute('referrals'),
    publicRoute('archives'),
    publicRoute('links'),
    'search',
    publicRoute('categories'),
    publicRoute('tags'),
  ].map((route) => href(lang, route ? `${route}/` : ''));
  for (const entry of [
    ...(await articlesFor(lang, true)),
    ...(await referralsFor(lang, true)),
  ])
    paths.push(articleHref(entry, lang));
  for (const [route, count] of [
    ['posts', (await articlesFor(lang)).length],
    ['referrals', (await referralsFor(lang)).length],
  ] as const) {
    const pages = Math.ceil(count / config.posts.perPage);
    for (let page = 2; page <= pages; page++)
      paths.push(href(lang, `${publicRoute(route)}/page/${page}/`));
  }
  for (const page of await textEntriesFor('pages', lang))
    if (!isIntroOnly(page.data.slug))
      paths.push(href(lang, `${encodedSlug(page.data.slug)}/`));
  for (const kind of ['categories', 'tags'] as const) {
    const prefix = publicRoute(kind);
    for (const group of await taxonomy(kind, lang, true))
      paths.push(href(lang, `${prefix}/${encodedSlug(group.slug)}/`));
  }
  return paths;
}
