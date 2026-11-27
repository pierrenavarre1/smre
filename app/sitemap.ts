import type { MetadataRoute } from 'next';

const base = 'https://www.smre.info';

// Keep this list limited to stable, public pages with useful content.
// Do not generate lastModified from the current time: it would tell search
// engines that every page changed on every request.
const paths = [
  '/',
  '/about',
  '/agents',
  '/listings',
  '/valuation',
  '/contact',
  '/guides',
  '/local-resources',
  '/communities',
  '/testimonials',
  '/communities/st-marys',
  '/communities/wamego',
  '/communities/rossville',
  '/communities/silver-lake',
  '/communities/manhattan',
  '/communities/topeka',
];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({
    url: `${base}${path}`,
  }));
}
