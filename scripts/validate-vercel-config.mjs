import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { config, getRenderApiOrigin } from '../vercel.ts';

assert.match(
  JSON.stringify(config.rewrites),
  /https:\/\/bughunter-api-2o5c\.onrender\.com\/api\/:path\*/,
);
assert.equal(getRenderApiOrigin('https://api.example.com'), 'https://api.example.com');
assert.throws(() => getRenderApiOrigin('http://api.example.com'), /must use HTTPS/);
assert.throws(() => getRenderApiOrigin('https://api.example.com/api'), /without a path/);

const renderBlueprint = readFileSync(new URL('../render.yaml', import.meta.url), 'utf8');
assert.match(
  renderBlueprint,
  /- key: WEB_ORIGIN\s+value: https:\/\/debugrove\.vercel\.app/,
  'Render WEB_ORIGIN must match the production Vercel web origin.',
);
assert.doesNotMatch(renderBlueprint, /WEB_ORIGINS/);
assert.match(renderBlueprint, /healthCheckPath: \/api\/health/);
assert.match(renderBlueprint, /maxShutdownDelaySeconds: 300/);

const webIndex = readFileSync(new URL('../apps/web/index.html', import.meta.url), 'utf8');
assert.match(webIndex, /<link rel="canonical" href="https:\/\/debugrove\.vercel\.app\/"/);
assert.match(webIndex, /<title>Debugrove \| 파이썬 디버깅 학습 온라인 저지<\/title>/);
assert.match(webIndex, /<script type="application\/ld\+json">/);
assert.match(webIndex, /"@type": "WebSite"/);

const robots = readFileSync(new URL('../apps/web/public/robots.txt', import.meta.url), 'utf8');
assert.match(robots, /Sitemap: https:\/\/debugrove\.vercel\.app\/sitemap\.xml/);

const sitemap = readFileSync(new URL('../apps/web/public/sitemap.xml', import.meta.url), 'utf8');
assert.match(sitemap, /<loc>https:\/\/debugrove\.vercel\.app\/<\/loc>/);

const googleVerification = readFileSync(
  new URL('../apps/web/public/google53b40843105df040.html', import.meta.url),
  'utf8',
);
assert.equal(googleVerification.trim(), 'google-site-verification: google53b40843105df040.html');

process.stdout.write('Vercel deployment config validation passed.\n');
