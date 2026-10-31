import config from './config.ts';
import { localize } from './i18n.ts';
import type { Locale } from '../types/config.ts';

/** Absolute URL for a site-relative path, honouring the deployment directory. */
export function absoluteUrl(path = ''): string {
  return new URL(path.replace(/^\/+/, ''), config.site.baseUrl).href;
}

export type SeoImage = {
  url: string;
  width?: number;
  height?: number;
  type?: string;
  alt?: string;
};

const IMAGE_EXTENSIONS: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

/** Basic intrinsic size for locally generated cover art; custom images omit it. */
const KNOWN_SIZES: Record<string, [number, number]> = {
  '.png': [1200, 630],
};

export function imageType(url: string): string | undefined {
  const extension = /\.([a-z\d]+)(?:[?#]|$)/i.exec(url)?.[1]?.toLowerCase();
  return extension ? IMAGE_EXTENSIONS[extension] : undefined;
}

/**
 * Normalize a content image or generated cover into Open Graph metadata.
 * Relative bundle paths are resolved against the page that owns them.
 */
export function seoImage(
  image: string | undefined,
  alt: string | undefined,
  route?: string,
): SeoImage | undefined {
  if (!image) return undefined;
  const absolute = /^https?:/i.test(image)
    ? image
    : /^(data:|\/\/)/i.test(image)
      ? undefined
      : absoluteUrl(
          /^\//.test(image)
            ? image
            : new URL(image, absoluteUrl(route ?? '')).pathname,
        );
  if (!absolute) return undefined;
  const generated =
    /\.png$/i.test(absolute) &&
    (/\/(?:page-)?og\/[^/]+\.png$/i.test(absolute) ||
      /\/og-default\.png$/i.test(absolute));
  const size = generated ? KNOWN_SIZES['.png'] : undefined;
  return {
    url: absolute,
    width: size?.[0],
    height: size?.[1],
    type: imageType(absolute),
    alt,
  };
}

/** Resolve the configured fallback share image, if any. */
export function defaultSeoImage(alt: string): SeoImage | undefined {
  return seoImage(config.seo?.defaultImage, alt);
}

/** Open Graph locale identifiers such as `id_ID`. */
export function ogLocale(lang: Locale): string {
  const [language, region] = lang.split('-');
  if (!region) {
    const defaults: Record<string, string> = {
      id: 'ID',
      en: 'US',
      zh: 'CN',
      ja: 'JP',
      ko: 'KR',
      ms: 'MY',
      de: 'DE',
      fr: 'FR',
      es: 'ES',
      ru: 'RU',
      pt: 'BR',
      it: 'IT',
      ar: 'SA',
      th: 'TH',
      vi: 'VN',
    };
    return `${language}_${defaults[language] ?? language.toUpperCase()}`;
  }
  return `${language}_${region.toUpperCase()}`;
}

export type Breadcrumb = { name: string; url: string };

export function breadcrumbJsonLd(items: Breadcrumb[]) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${items[0]?.url ?? absoluteUrl()}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function personId(): string {
  return `${absoluteUrl()}#person`;
}

function organizationId(): string {
  return `${absoluteUrl()}#organization`;
}

function webSiteId(): string {
  return `${absoluteUrl()}#website`;
}

export function personJsonLd(lang: Locale) {
  const socials = config.author.socials
    .map((social) => social.href)
    .filter((href) => /^https?:/i.test(href));
  return {
    '@type': 'Person',
    '@id': personId(),
    name: localize(config.author.name, lang),
    description: localize(config.author.bio, lang),
    image: /^https?:/i.test(config.author.avatar)
      ? config.author.avatar
      : absoluteUrl(config.author.avatar),
    ...(socials.length ? { sameAs: socials } : {}),
  };
}

/** Brand-level identity; the site publishes as an organization, not a person. */
export function organizationJsonLd(lang: Locale) {
  const socials = config.author.socials
    .map((social) => social.href)
    .filter((href) => /^https?:/i.test(href));
  const logo = /^https?:/i.test(config.author.avatar)
    ? config.author.avatar
    : absoluteUrl(config.author.avatar);
  return {
    '@type': 'Organization',
    '@id': organizationId(),
    name: localize(config.site.title, lang),
    url: absoluteUrl(),
    logo: { '@type': 'ImageObject', url: logo },
    ...(socials.length ? { sameAs: socials } : {}),
  };
}

export function webSiteJsonLd(lang: Locale) {
  return {
    '@type': 'WebSite',
    '@id': webSiteId(),
    url: absoluteUrl(),
    name: localize(config.site.title, lang),
    description: localize(config.text.siteDescription, lang),
    inLanguage: lang,
    publisher: { '@id': organizationId() },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${absoluteUrl(`${lang === config.site.defaultLocale ? '' : `${lang}/`}search/`)}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export type PageJsonLdInput = {
  lang: Locale;
  url: string;
  title: string;
  description?: string;
  image?: SeoImage;
  type: 'website' | 'article';
  publishedTime?: Date;
  modifiedTime?: Date;
  section?: string;
  tags?: string[];
  breadcrumbs?: Breadcrumb[];
};

/** Full `@graph` payload shared by every page type. */
export function pageJsonLd({
  lang,
  url,
  title,
  description,
  image,
  type,
  publishedTime,
  modifiedTime,
  section,
  tags,
  breadcrumbs,
}: PageJsonLdInput) {
  const page = {
    '@type': type === 'article' ? 'Article' : 'WebPage',
    '@id': `${url}#page`,
    url,
    name: title,
    ...(description ? { description } : {}),
    inLanguage: lang,
    isPartOf: { '@id': webSiteId() },
    ...(image?.url
      ? {
          primaryImageOfPage: {
            '@type': 'ImageObject',
            url: image.url,
            ...(image.width ? { width: image.width } : {}),
            ...(image.height ? { height: image.height } : {}),
          },
        }
      : {}),
    ...(breadcrumbs?.length
      ? { breadcrumb: { '@id': `${url}#breadcrumb` } }
      : {}),
    ...(type === 'article'
      ? {
          headline: title,
          datePublished: publishedTime?.toISOString(),
          dateModified: (modifiedTime ?? publishedTime)?.toISOString(),
          author: { '@id': personId() },
          publisher: { '@id': organizationId() },
          ...(section ? { articleSection: section } : {}),
          ...(tags?.length ? { keywords: tags.join(', ') } : {}),
          ...(image?.url
            ? {
                image: {
                  '@type': 'ImageObject',
                  url: image.url,
                  ...(image.width ? { width: image.width } : {}),
                  ...(image.height ? { height: image.height } : {}),
                },
              }
            : {}),
        }
      : {}),
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      webSiteJsonLd(lang),
      organizationJsonLd(lang),
      personJsonLd(lang),
      page,
      ...(breadcrumbs?.length ? [breadcrumbJsonLd(breadcrumbs)] : []),
    ],
  };
}
