import type { MetadataRoute } from 'next';

const base='https://www.smre.info';
const paths=['/','/about','/agents','/listings','/valuation','/contact','/guides','/testimonials','/communities/st-marys','/communities/wamego','/communities/rossville','/communities/silver-lake','/communities/manhattan','/communities/topeka'];

export default function sitemap():MetadataRoute.Sitemap{
  return paths.map(path=>({
    url:base+path,
    lastModified:new Date(),
    changeFrequency:path.startsWith('/communities/')?'monthly':'weekly',
    priority:path==='/'?1:path.startsWith('/communities/') ? 0.7 : 0.6
  }));
}
