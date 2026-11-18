import type { MetadataRoute } from 'next';

export default function robots():MetadataRoute.Robots{
  return {
    rules:{userAgent:'*',allow:'/',disallow:['/admin','/api/']},
    sitemap:'https://www.smre.info/sitemap.xml',
    host:'https://www.smre.info'
  };
}
