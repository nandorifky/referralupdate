import type { NavigationItem } from '../types/config';

export type BuiltinRoute = Extract<
  NavigationItem,
  { type: 'builtin' }
>['route'];

const publicRoutes: Record<BuiltinRoute, string> = {
  home: '',
  posts: 'posts',
  referrals: 'kode-referral',
  categories: 'kategori',
  tags: 'tags',
  archives: 'arsip',
  links: 'tautan',
};

/** Public URL segment for a built-in route; content keys stay in English. */
export function publicRoute(route: BuiltinRoute): string {
  return publicRoutes[route];
}
