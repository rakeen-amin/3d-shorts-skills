// Headless renderer: loads engine/index.html in Chrome (software GL), calls window.grab(t) per frame,
// pipes JPEG frames into ffmpeg. Works without a GPU.
//
//   node engine/render.mjs stills 0.5,4.2,11          → engine/stills/t0.50.jpg …
//   node engine/render.mjs video 0 7 out/beat1.mp4     → seconds 0–7 at 30 fps
//   node engine/render.mjs beats beat_sheet.json out/  → one MP4 per beat (skips ones that exist)
//
// env: CHROME_PATH (optional), FPS (default 30), W/H (default 1080x1920)
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const FPS = +(process.env.FPS || 30), W = +(process.env.W || 1080), H = +(process.env.H || 1920);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); res.end(d); });
}).listen(0);

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', e => console.error('PAGE ERROR:', e.message));
await page.goto(`http://localhost:${server.address().port}/engine/index.html`);
await page.waitForFunction('window.ready === true', null, { timeout: 60000 });
const grab = async t => Buffer.from((await page.evaluate(t => window.grab(t), t)).split(',')[1], 'base64');

async function video(t0, t1, out) {
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  const tmp = out.replace(/\.mp4$/, '.tmp.mp4');   // rename only on success, so a stopped render never looks finished
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
  const f0 = Math.round(t0 * FPS), f1 = Math.round(t1 * FPS), start = Date.now();
  for (let f = f0; f < f1; f++) {
    const buf = await grab(f / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 90 === 0) console.log(out, `frame ${f - f0}/${f1 - f0}`, ((Date.now() - start) / (f - f0 + 1)).toFixed(0), 'ms/frame');
  }
  ff.stdin.end();
  if (await new Promise(r => ff.on('close', r)) === 0) fs.renameSync(tmp, out); else throw new Error('ffmpeg failed for ' + out);
}

const [mode, a, b, c] = process.argv.slice(2);
if (mode === 'stills') {
  const dir = path.join(here, 'stills'); fs.mkdirSync(dir, { recursive: true });
  for (const t of a.split(',').map(Number)) { fs.writeFileSync(path.join(dir, `t${t.toFixed(2)}.jpg`), await grab(t)); console.log('still', t); }
} else if (mode === 'video') {
  await video(+a, +b, c);
} else if (mode === 'beats') {
  const sheet = JSON.parse(fs.readFileSync(a, 'utf8'));
  for (const [i, beat] of sheet.beats.entries()) {
    const out = path.join(b, `beat${i + 1}.mp4`);
    if (fs.existsSync(out)) { console.log('exists', out); continue; }
    await video(beat.start, beat.end, out);
  }
  fs.writeFileSync(path.join(b, 'list.txt'), sheet.beats.map((_, i) => `file 'beat${i + 1}.mp4'`).join('\n') + '\n');
  console.log('join with: ffmpeg -f concat -safe 0 -i', path.join(b, 'list.txt'), '-c copy video_nocap.mp4');
}
await browser.close(); server.close();
