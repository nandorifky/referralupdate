/**
 * Referral content rules.
 *
 * A referral page owns a brand and declares two categories: `[industry, brand]`.
 * Its slug must match the brand, so one brand always maps to one stable URL:
 * `/kode-referral/<brand>/`. Supporting articles stay ordinary posts, declare
 * only `[brand]`, and opt into validation with `referral: true`.
 */

export const benefitTypes = [
  'cashback',
  'diskon',
  'saldo',
  'poin',
  'komisi',
] as const;
export type BenefitType = (typeof benefitTypes)[number];

export const referralStatuses = ['aktif', 'habis'] as const;
export type ReferralStatus = (typeof referralStatuses)[number];

export const referralFieldNames = [
  'code',
  'referralUrl',
  'benefit',
  'benefitType',
  'expires',
  'status',
  'verifiedAt',
] as const;

export interface ReferralData {
  slug?: string;
  /** Marks a supporting article; referral pages use their own collection. */
  referral?: boolean;
  /** Legacy field, detected only so migration mistakes fail loudly. */
  pillar?: boolean;
  categories?: string[];
  code?: string;
  referralUrl?: string;
  benefit?: string;
  benefitType?: BenefitType;
  expires?: Date;
  status?: ReferralStatus;
  verifiedAt?: Date;
}

const categoriesOf = (data: ReferralData) => data.categories ?? [];

/** Referral pages keep the industry in the first category. */
export function referralIndustry(data: ReferralData): string | undefined {
  const categories = categoriesOf(data);
  return categories.length === 2 ? categories[0] : undefined;
}

/** Referral pages keep the brand in the second category. */
export function referralBrand(data: ReferralData): string | undefined {
  const categories = categoriesOf(data);
  return categories.length === 2 ? categories[1] : undefined;
}

/** Supporting articles keep their only category, the brand. */
export function articleBrand(data: ReferralData): string | undefined {
  return categoriesOf(data)[0];
}

export function referralFieldsPresent(data: ReferralData): string[] {
  return referralFieldNames.filter((field) => data[field] !== undefined);
}

/**
 * Validate every referral page. The URL slug doubles as the brand key, which
 * keeps `/kode-referral/<brand>/` stable when codes change.
 */
export function validateReferralEntries(
  referrals: { id: string; data: ReferralData }[],
  file: (id: string) => string,
  warn: (message: string) => void,
): void {
  const errors: string[] = [];
  const brands = new Map<string, string>();

  for (const { id, data } of referrals) {
    const where = file(id);
    if (data.pillar !== undefined)
      errors.push(
        `${where}: "pillar" is no longer supported. Move this file to content/referrals/<brand>/index.mdx and remove the field.`,
      );
    const categories = categoriesOf(data);
    if (categories.length !== 2)
      errors.push(
        `${where}: referral pages must declare exactly two categories, [industry, brand]. Received ${categories.length}.`,
      );
    const brand = referralBrand(data);
    if (!brand && categories.length >= 2)
      errors.push(`${where}: referral pages must name a brand category.`);
    if (brand && data.slug && data.slug !== brand)
      errors.push(
        `${where}: referral page slug must match the brand category ("${brand}"). Received "${data.slug}".`,
      );
    const existing = brand ? brands.get(brand) : undefined;
    if (brand && existing && existing !== data.slug)
      errors.push(
        `${where}: brand "${brand}" already has a referral page (${existing}). Each brand keeps one page.`,
      );
    else if (brand) brands.set(brand, data.slug ?? id);
    if (!data.code && !data.referralUrl)
      errors.push(
        `${where}: referral pages need a "code" or a "referralUrl".`,
      );
    if (!data.benefit)
      errors.push(`${where}: referral pages need "benefit".`);
    if (!data.status)
      errors.push(`${where}: referral pages need "status" (aktif|habis).`);
    if (!data.verifiedAt)
      errors.push(`${where}: referral pages need "verifiedAt".`);
  }

  for (const message of errors) warn(message);
  if (errors.length)
    throw new Error(
      `Invalid referral content:\n${errors.map((line) => `  - ${line}`).join('\n')}`,
    );
}

/**
 * Validate posts that belong to a brand silo. A post joins when it opts in with
 * `referral: true` or uses the category of a brand that already has a referral
 * page. Ordinary articles are left untouched.
 */
export function validateSupportingArticles(
  articles: { id: string; data: ReferralData }[],
  brands: ReadonlySet<string>,
  file: (id: string) => string,
  warn: (message: string) => void,
): void {
  const errors: string[] = [];

  for (const { id, data } of articles) {
    const where = file(id);
    if (data.pillar !== undefined)
      errors.push(
        `${where}: "pillar" is no longer supported. Referral pages live in content/referrals/<brand>/index.mdx.`,
      );
    const fields = referralFieldsPresent(data);
    if (fields.length)
      errors.push(
        `${where}: only referral pages carry referral details; remove ${fields.map((field) => `"${field}"`).join(', ')} here.`,
      );
    const brand = articleBrand(data);
    const inSilo = Boolean(data.referral) || (brand && brands.has(brand));
    if (!inSilo) continue;
    if (!data.referral)
      errors.push(
        `${where}: supporting articles must set "referral: true" when their brand has a referral page.`,
      );
    const categories = categoriesOf(data);
    if (categories.length !== 1)
      errors.push(
        `${where}: supporting articles must declare exactly one category (the brand). Received ${categories.length}.`,
      );
    if (!brand)
      errors.push(`${where}: supporting articles must name a brand category.`);
    else if (!brands.has(brand))
      errors.push(
        `${where}: brand "${brand}" has no referral page yet. Create content/referrals/${brand}/index.mdx first.`,
      );
  }

  for (const message of errors) warn(message);
  if (errors.length)
    throw new Error(
      `Invalid referral articles:\n${errors.map((line) => `  - ${line}`).join('\n')}`,
    );
}
