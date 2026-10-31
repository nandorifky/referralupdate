import { pageLocale } from '../../lib/i18n';
import { localeInfo } from '../../lib/translations';
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import config from '../../lib/config';
import {
  discoverableEntries,
  articleHref,
  isReferral,
} from '../../lib/content';
import { localize } from '../../lib/i18n';
export const GET: APIRoute = async ({ routePattern }) => {
  const lang = pageLocale(routePattern);
  const entries = (await discoverableEntries(lang))
    .filter((entry) => !(isReferral(entry) && entry.data.status === 'habis'))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  return rss({
    title: localize(config.site.title, lang),
    description: localize(config.text.siteDescription, lang),
    site: config.site.url,
    items: entries.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.date,
      link: articleHref(entry, lang),
    })),
    customData: `<language>${localeInfo(lang).lang}</language>`,
  });
};
