import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const importConfigScript = `
  import('./vercel.ts').then(({ config }) => {
    process.stdout.write(JSON.stringify(config.rewrites));
  });
`;

function loadConfig(renderApiOrigin) {
  const env = { ...process.env };
  if (renderApiOrigin === undefined) {
    delete env.RENDER_API_ORIGIN;
  } else {
    env.RENDER_API_ORIGIN = renderApiOrigin;
  }

  return spawnSync(
    process.execPath,
    ['--no-warnings', '--experimental-strip-types', '--eval', importConfigScript],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      env,
    },
  );
}

const defaultOrigin = loadConfig();
assert.equal(defaultOrigin.status, 0, defaultOrigin.stderr);
assert.match(defaultOrigin.stdout, /https:\/\/bughunter-api-2o5c\.onrender\.com\/api\/:path\*/);

const validOrigin = loadConfig('https://api.example.com');
assert.equal(validOrigin.status, 0, validOrigin.stderr);
assert.match(validOrigin.stdout, /https:\/\/api\.example\.com\/api\/:path\*/);

const insecureOrigin = loadConfig('http://api.example.com');
assert.notEqual(insecureOrigin.status, 0);
assert.match(insecureOrigin.stderr, /must use HTTPS/);

const originWithPath = loadConfig('https://api.example.com/api');
assert.notEqual(originWithPath.status, 0);
assert.match(originWithPath.stderr, /without a path/);

const renderBlueprint = readFileSync(new URL('../render.yaml', import.meta.url), 'utf8');
assert.match(
  renderBlueprint,
  /- key: WEB_ORIGIN\s+value: https:\/\/codetrace-lab\.vercel\.app/,
  'Render WEB_ORIGIN must match the production Vercel web origin.',
);

const webIndex = readFileSync(new URL('../apps/web/index.html', import.meta.url), 'utf8');
assert.match(webIndex, /<link rel="canonical" href="https:\/\/codetrace-lab\.vercel\.app\/"/);
assert.match(webIndex, /<script type="application\/ld\+json">/);

const robots = readFileSync(new URL('../apps/web/public/robots.txt', import.meta.url), 'utf8');
assert.match(robots, /Sitemap: https:\/\/codetrace-lab\.vercel\.app\/sitemap\.xml/);

const sitemap = readFileSync(new URL('../apps/web/public/sitemap.xml', import.meta.url), 'utf8');
assert.match(sitemap, /<loc>https:\/\/codetrace-lab\.vercel\.app\/<\/loc>/);

const googleVerification = readFileSync(
  new URL('../apps/web/public/google53b40843105df040.html', import.meta.url),
  'utf8',
);
assert.equal(
  googleVerification.trim(),
  'google-site-verification: google53b40843105df040.html',
);

process.stdout.write('Vercel deployment config validation passed.\n');
