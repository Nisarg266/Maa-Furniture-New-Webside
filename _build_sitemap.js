// Generate sitemap.xml from the same page set as the search index
// IMPORTANT: replace the placeholder domain below with the real domain
// when the site goes live, then re-run: node _build_sitemap.js
const DOMAIN = 'https://YOUR-DOMAIN.com/';
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();

const EXCLUDE = [
  /^wp-json\//, /^search\//, /^feed\//, /^comments\//,
  /^hello-world(-2)?\//, /^author\//, /^brand\//, /^our-teams\//, /^team\//,
  /^category\//, /^product-tag\//, /^tag\//, /^cart\//, /^checkout\//,
  /^my-account\//, /^coming-soon\//, /^home-page\//,
];
const urls = [];

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules' || e.name === 'search') continue;
    const f = path.join(dir, e.name);
    const rel = path.relative(ROOT, f).split(path.sep).join('/');
    if (e.isDirectory()) { walk(f); continue; }
    if (!/\.html?$/i.test(e.name)) continue;
    if (rel.includes('@')) continue;
    if (EXCLUDE.some(re => re.test(rel + '/'))) continue;
    if (rel === '404.html') continue;
    urls.push(rel.replace(/index\.html?$/i, ''));
  }
}
walk(ROOT);
// homepage first
urls.sort((a, b) => (a === '' ? -1 : b === '' ? 1 : a.localeCompare(b)));
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<!-- Replace YOUR-DOMAIN.com with the live domain (search & replace), then submit to Google Search Console -->',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(u => '  <url><loc>' + DOMAIN + u + '</loc></url>'),
  '</urlset>',
  '',
].join('\n');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log('sitemap.xml written with', urls.length, 'URLs (placeholder domain:', DOMAIN + ')');
