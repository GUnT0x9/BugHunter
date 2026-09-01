import { routes, type VercelConfig } from '@vercel/config/v1';

const DEFAULT_RENDER_API_ORIGIN = 'https://bughunter-api-2o5c.onrender.com';

function getRenderApiOrigin(value: string | undefined): string {
  const url = new URL(value ?? DEFAULT_RENDER_API_ORIGIN);
  if (url.protocol !== 'https:') {
    throw new Error('RENDER_API_ORIGIN must use HTTPS.');
  }
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('RENDER_API_ORIGIN must contain only an origin without a path.');
  }
  return url.origin;
}

const renderApiOrigin = getRenderApiOrigin(process.env.RENDER_API_ORIGIN);

export const config: VercelConfig = {
  framework: 'vite',
  installCommand: 'pnpm install --frozen-lockfile',
  buildCommand: 'pnpm --filter @bughunter/contracts build && pnpm --filter @bughunter/web build',
  outputDirectory: 'apps/web/dist',
  rewrites: [
    routes.rewrite('/api/:path*', `${renderApiOrigin}/api/:path*`),
    routes.rewrite('/(.*)', '/index.html'),
  ],
  headers: [
    ...['/learn', '/problems', '/problems/(.*)', '/bugdex', '/my', '/statistics', '/community', '/admin/(.*)'].map(
      (source) => ({
        source,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      }),
    ),
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
};
