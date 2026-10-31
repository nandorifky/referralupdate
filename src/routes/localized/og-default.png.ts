import type { APIRoute } from 'astro';
import config from '../../lib/config';
import { localize, pageLocale } from '../../lib/i18n';
import { shareCover } from '../../lib/share-cover';

/** Site-wide fallback share image for pages without their own cover. */
export const GET: APIRoute = async ({ routePattern }) => {
  const lang = pageLocale(routePattern);
  return new Response(
    new Uint8Array(
      await shareCover(
        localize(config.text.homeTitle, lang),
        localize(config.text.siteDescription, lang),
        config,
        lang,
      ),
    ),
    { headers: { 'Content-Type': 'image/png' } },
  );
};
