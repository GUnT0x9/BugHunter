import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

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

process.stdout.write('Vercel deployment config validation passed.\n');
