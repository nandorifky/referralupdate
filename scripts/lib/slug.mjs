export const validSlug = (value) =>
  typeof value === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(value);

export const slugRule =
  'Use only lowercase ASCII letters (a-z), digits (0-9), and hyphens (-), starting with a letter or digit.';

/** Source folders such as `referral/shopeepay/`; every segment obeys the slug rule. */
export const validSlugPath = (value) =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.split('/').every((segment) => validSlug(segment));

export const slugPathRule = `${slugRule} Separate nested source folders with "/", for example referral/shopeepay/kode-referral-shopeepay.`;

export const finalSlug = (value) => value.split('/').at(-1);
