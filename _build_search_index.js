// Build client-side search index for the static site
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();

const EXCLUDE = [
  /^wp-json\//, /^search\//, /^feed\//, /^comments\//,
  /^hello-world(-2)?\//, /^author\//, /^brand\//, /^our-teams\//, /^team\//,
  /^category\//, /^product-tag\//, /^tag\//, /^cart\//, /^checkout\//,
  /^my-account\//, /^coming-soon\//, /^home-page\//,
];
const index = [];

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules' || e.name === 'search') continue;
    const f = path.join(dir, e.name);
    const rel = path.relative(ROOT, f).split(path.sep).join('/');
    if (e.isDirectory()) { walk(f); continue; }
    if (!/\.html?$/i.test(e.name)) continue;
    if (rel.includes('@')) continue;
    if (EXCLUDE.some(re => re.test(rel + '/'))) continue;
    const html = fs.readFileSync(f, 'utf8');
    const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || rel;
    let desc = '';
    const og1 = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i);
    const og2 = html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"/i);
    if (og1) desc = og1[1]; else if (og2) desc = og2[1];
    if (!desc) {
      const md = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i);
      if (md) desc = md[1];
    }
    desc = desc.replace(/<[^>]*>/g, '').replace(/&hellip;|&#8230;/g, '...').replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"').replace(/&#8217;|&rsquo;/g, "'").replace(/\s+/g, ' ').trim().slice(0, 140);
    const clean = title.replace(/\s*-\s*Maa Furniture\s*$/i, '').trim() || 'Maa Furniture';
    // url path from site root (for links from search/index.html -> prefix ../)
    const url = rel.replace(/index\.html?$/i, '');
    index.push({ t: clean, u: url, d: desc });
  }
}
walk(ROOT);
index.sort((a, b) => a.t.localeCompare(b.t));
fs.mkdirSync(path.join(ROOT, 'search'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'search', 'search-index.json'), JSON.stringify(index));
console.log('Search index built:', index.length, 'pages ->', 'search/search-index.json');
