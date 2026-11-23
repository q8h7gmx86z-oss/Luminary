// Turns the Expo web export in dist/ into one self-contained HTML file
// (preview/luminary.html) so it can be shared as a live preview page.
import fs from 'node:fs';
import path from 'node:path';

const dist = 'dist';
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const scripts = [...html.matchAll(/<script src="([^"]+)"[^>]*><\/script>/g)].map((m) => m[1]);
if (scripts.length === 0) throw new Error('No scripts found in dist/index.html');

const inlineJs = scripts
  .map((src) => fs.readFileSync(path.join(dist, src.replace(/^\//, '')), 'utf8').replace(/<\/script/gi, '<\\/script'))
  .map(inlineAssets)
  .map((js) => `<script>${js}</script>`)
  .join('\n');

// Images from the export are referenced by absolute path, which the preview host
// cannot serve. Swap each one for a data URI.
function inlineAssets(js) {
  return js.replace(/"(\/assets\/[^"]+\.(png|jpg|jpeg|gif))"/g, (whole, url, ext) => {
    const file = path.join(dist, decodeURIComponent(url));
    if (!fs.existsSync(file)) return whole;
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    return JSON.stringify(`data:image/${mime};base64,${fs.readFileSync(file).toString('base64')}`);
  });
}

const styles = [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0]).join('\n');

const page = `<title>Luminary</title>
<meta name="description" content="Live preview of the Luminary app">
<style>
:root { --bg: #F6F5F2; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #12151C; color-scheme: dark } }
:root[data-theme="dark"] { --bg: #12151C; color-scheme: dark }
html, body { height: 100%; }
body { background: var(--bg); overflow: hidden; }
#root { display: flex; height: 100%; flex: 1; }
</style>
${styles}
<div id="root"></div>
<script>
// The preview is hosted under its own path. Start the router at the app's home screen.
try { if (location.pathname !== '/') history.replaceState(null, '', '/' + location.hash); } catch (e) {}
</script>
${inlineJs}
`;

fs.mkdirSync('preview', { recursive: true });
fs.writeFileSync('preview/luminary.html', page);
console.log(`preview/luminary.html written (${Math.round(page.length / 1024)} KB, ${scripts.length} script(s))`);
