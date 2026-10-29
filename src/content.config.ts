import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob, type Loader } from 'astro/loaders';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import config from './lib/config';
import { safeSlug, validateContentSlugs } from './lib/policy';
import {
  contentFiles,
  frontmatter,
  type ContentKind,
} from './lib/content-files';
import {
  dateFields,
  dateRule,
  validContentDate,
  parseContentDate,
  validateContentDates,
} from './lib/content-dates';
import { fileIdentity, assertMatchingSlugs } from './lib/content-variants';
import { contentLocales } from './lib/translations';
import { canonicalLocale } from './lib/locale';
import {
  benefitTypes,
  referralStatuses,
  validateReferralEntries,
  validateSupportingArticles,
  type ReferralData,
} from './lib/referral';
const supportedLocales = contentLocales(config.site.locales);

function stringList(value: unknown): string[] {
  return (Array.isArray(value) ? value : value === undefined ? [] : [value]).filter(
    (item): item is string => typeof item === 'string',
  );
}

function asReferralData(
  source: Record<string, unknown>,
  slug: string,
): ReferralData {
  const text = (value: unknown) =>
    typeof value === 'string' ? value : undefined;
  const optionalDate = (value: unknown) =>
    validContentDate(value) ? parseContentDate(value) : undefined;
  return {
    slug,
    ...(typeof source.referral === 'boolean'
      ? { referral: source.referral }
      : {}),
    ...(typeof source.pillar === 'boolean' ? { pillar: source.pillar } : {}),
    categories: [
      ...new Set([...stringList(source.category), ...stringList(source.categories)]),
    ],
    code: text(source.code),
    referralUrl: text(source.referralUrl),
    benefit: text(source.benefit),
    benefitType: benefitTypes.includes(source.benefitType as never)
      ? (source.benefitType as ReferralData['benefitType'])
      : undefined,
    expires: optionalDate(source.expires),
    status: referralStatuses.includes(source.status as never)
      ? (source.status as ReferralData['status'])
      : undefined,
    verifiedAt: optionalDate(source.verifiedAt),
  };
}

/** Brand keys available to post validation, read before Astro transforms data. */
async function referralBrands(root: URL): Promise<Set<string>> {
  const base = fileURLToPath(new URL('content/referrals/', root));
  const brands = new Set<string>();
  for (const file of await contentFiles(base, supportedLocales)) {
    const data = frontmatter(await readFile(path.join(base, file), 'utf8'));
    const categories = [
      ...new Set([...stringList(data.category), ...stringList(data.categories)]),
    ];
    if (categories.length === 2) brands.add(categories[1]);
  }
  return brands;
}

function loader(kind: ContentKind): Loader {
  return {
    name: `bloggpt-${kind}`,
    async load(context) {
      const base = fileURLToPath(
        new URL(`content/${kind}/`, context.config.root),
      );
      const sync = async () => {
        const files = await contentFiles(base, supportedLocales);
        // Astro's YAML parser coerces unquoted ISO dates into Date objects.
        // Read the original scalar types before that coercion can hide bad input.
        const sources = new Map(
          await Promise.all(
            files.map(
              async (file) =>
                [
                  file,
                  frontmatter(await readFile(path.join(base, file), 'utf8')),
                ] as const,
            ),
          ),
        );
        for (const [file, data] of sources)
          validateContentDates(data, `content/${kind}/${file}`, (message) =>
            context.logger.warn(message),
          );
        const variants: {
          id: string;
          data: { _key: string; _locale?: string; slug: string };
          referral: ReferralData;
        }[] = [];
        await glob({
          base: `./content/${kind}`,
          pattern: files.length
            ? files.map((file) => file.replace(/[()[\]{}*?!]/g, '\\$&'))
            : '__empty_collection__',
          generateId: ({ entry, data }) => {
            const source = sources.get(entry)!;
            for (const field of dateFields)
              if (Object.hasOwn(source, field)) data[field] = source[field];
            const identity = fileIdentity(entry, supportedLocales);
            data._key = identity.key;
            data._locale = identity.locale;
            data.lang = identity.locale ?? config.site.defaultLocale;
            data.slug ??= identity.bundle
              ? path.posix.basename(path.posix.dirname(identity.key))
              : path.posix.basename(identity.key);
            validateContentSlugs(
              data,
              `content/${kind}/${entry}`,
              (message) => context.logger.warn(message),
              kind === 'posts' || kind === 'referrals',
            );
            variants.push({
              id: `content/${kind}/${entry}`,
              data: {
                _key: identity.key,
                _locale: identity.locale,
                slug: data.slug as string,
              },
              // Keep the raw frontmatter: schema transforms drop or coerce the
              // referral fields the silo rules need to compare.
              referral: asReferralData(source, data.slug as string),
            });
            data.image ??= data.cover;
            return entry;
          },
        }).load({ ...context, watcher: undefined });
        assertMatchingSlugs(variants, (message) =>
          context.logger.warn(message),
        );
        if (kind === 'referrals')
          validateReferralEntries(
            variants.map((variant) => ({
              id: variant.id,
              data: variant.referral,
            })),
            (id) => `content/${id.replace(/^content\//, '')}`,
            (message) => context.logger.warn(message),
          );
        if (kind === 'posts')
          validateSupportingArticles(
            variants.map((variant) => ({
              id: variant.id,
              data: variant.referral,
            })),
            await referralBrands(context.config.root),
            (id) => `content/${id.replace(/^content\//, '')}`,
            (message) => context.logger.warn(message),
          );
      };
      await sync();
      if (context.watcher) {
        context.watcher.add(base);
        let pending: ReturnType<typeof setTimeout> | undefined;
        let queue = Promise.resolve();
        const update = (file: string) => {
          const relative = path.relative(base, file);
          if (
            relative.startsWith('..') ||
            path.isAbsolute(relative) ||
            !/\.(md|mdx)$/i.test(file)
          )
            return;
          clearTimeout(pending);
          pending = setTimeout(() => {
            queue = queue
              .then(sync)
              .then(() => {
                context.logger.info(`Reloaded ${kind} content.`);
              })
              .catch((error) => context.logger.error(String(error)));
          }, 100);
        };
        context.watcher
          .on('add', update)
          .on('change', update)
          .on('unlink', update);
      }
    },
  };
}
const list = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => (typeof value === 'string' ? [value] : (value ?? [])));
const date = z
  .string()
  .refine(validContentDate, dateRule)
  .transform(parseContentDate)
  .optional();
const common = z.object({
  title: z.string(),
  description: z.string().default(''),
  /** Optional key-facts panel rendered above the article body. */
  summary: z.string().optional(),
  slug: z.string().transform(safeSlug),
  lang: z.string().transform(canonicalLocale),
  _key: z.string(),
  _locale: z.string().transform(canonicalLocale).optional(),
  image: z.string().optional(),
  draft: z.boolean().default(false),
  hidden: z.boolean().default(false),
  math: z.boolean().optional(),
  mermaid: z.boolean().optional(),
  lightbox: z.boolean().optional(),
  callouts: z.boolean().optional(),
  toc: z.boolean().optional(),
  shareCover: z.boolean().optional(),
  display: z
    .object({
      author: z.boolean().optional(),
      published: z.boolean().optional(),
      readingTime: z.boolean().optional(),
      updated: z.boolean().optional(),
      tags: z.boolean().optional(),
      share: z.boolean().optional(),
      navigation: z.boolean().optional(),
      title: z.boolean().optional(),
    })
    .optional(),
  coverStyle: z.enum(['thumbnail', 'fade', 'background']).optional(),
});
const posts = defineCollection({
  loader: loader('posts'),
  schema: common
    .extend({
      date,
      published: date,
      pubDatetime: date,
      updated: date,
      modDatetime: date,
      lastmod: date,
      category: list,
      categories: list,
      tags: list,
      featured: z.boolean().default(false),
      /** Opts a supporting article into referral-silo validation. */
      referral: z.boolean().default(false),
    })
    .refine(
      (value) => value.date || value.published || value.pubDatetime,
      'A publication date is required (date, published, or pubDatetime).',
    )
    .transform((value) => ({
      ...value,
      date: (value.date ?? value.published ?? value.pubDatetime)!,
      updated: value.updated ?? value.modDatetime ?? value.lastmod,
      categories: [...new Set([...value.category, ...value.categories])].map(
        safeSlug,
      ),
      tags: [...new Set(value.tags)].map(safeSlug),
    })),
});
const referrals = defineCollection({
  loader: loader('referrals'),
  schema: common
    .extend({
      date,
      published: date,
      pubDatetime: date,
      updated: date,
      modDatetime: date,
      lastmod: date,
      category: list,
      categories: list,
      tags: list,
      featured: z.boolean().default(false),
      code: z.string().optional(),
      referralUrl: z.string().url().optional(),
      benefit: z.string().optional(),
      benefitType: z.enum(benefitTypes).optional(),
      expires: date,
      status: z.enum(referralStatuses).optional(),
      verifiedAt: date,
    })
    .refine(
      (value) => value.date || value.published || value.pubDatetime,
      'A publication date is required (date, published, or pubDatetime).',
    )
    .transform((value) => ({
      ...value,
      date: (value.date ?? value.published ?? value.pubDatetime)!,
      updated: value.updated ?? value.modDatetime ?? value.lastmod,
      categories: [...new Set([...value.category, ...value.categories])].map(
        safeSlug,
      ),
      tags: [...new Set(value.tags)].map(safeSlug),
    })),
});
const pages = defineCollection({
  loader: loader('pages'),
  schema: common
    .extend({
      date,
      published: date,
      pubDatetime: date,
      updated: date,
      modDatetime: date,
      lastmod: date,
    })
    .transform((value) => ({
      ...value,
      date: value.date ?? value.published ?? value.pubDatetime,
      updated: value.updated ?? value.modDatetime ?? value.lastmod,
    })),
});
const categories = defineCollection({
  loader: loader('categories'),
  schema: common,
});
const tags = defineCollection({ loader: loader('tags'), schema: common });

export const collections = { posts, referrals, pages, categories, tags };
