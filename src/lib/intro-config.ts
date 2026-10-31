import type { BlogConfig } from '../types/config';

export const introRoutes = [
  'posts',
  'referrals',
  'categories',
  'tags',
  'archives',
  'links',
] as const;
export function introPageSlug(
  config: BlogConfig,
  route: string,
): string | undefined {
  const item = [...config.sidebar.items, ...config.sidebar.menu].find(
    (item) => item.type === 'builtin' && item.route === route && item.page,
  );
  if (item?.type === 'builtin') return item.page;
  // Tags has no sidebar entry; its intro page uses the route name.
  return introRoutes.includes(route as (typeof introRoutes)[number])
    ? route
    : undefined;
}
