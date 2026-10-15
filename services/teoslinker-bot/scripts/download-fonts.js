const https = require('https');
const fs = require('fs');
const path = require('path');

const FONTS_DIR = path.join(__dirname, '..', 'fonts');

const FONT_URLS = [
  ['Inter-Regular.ttf', 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf'],
  ['Inter-Bold.ttf', 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf'],
  ['Inter-Italic.ttf', 'https://fonts.gstatic.com/s/inter/v20/UcCM3FwrK3iLTcvneQg7Ca725JhhKnNqk4j1ebLhAm8SrXTc2dthjQ.ttf'],
  ['Inter-BoldItalic.ttf', 'https://fonts.gstatic.com/s/inter/v20/UcCM3FwrK3iLTcvneQg7Ca725JhhKnNqk4j1ebLhAm8SrXTcPtxhjQ.ttf'],
  ['JetBrainsMono-Regular.ttf', 'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Regular.ttf'],
  ['JetBrainsMono-Bold.ttf', 'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Bold.ttf'],
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        https.get(res.headers.location, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (r) => {
          r.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(FONTS_DIR)) {
    fs.mkdirSync(FONTS_DIR, { recursive: true });
  }

  let allOk = true;
  for (const [name, url] of FONT_URLS) {
    const dest = path.join(FONTS_DIR, name);
    if (fs.existsSync(dest)) {
      continue;
    }
    try {
      await download(url, dest);
      const buf = fs.readFileSync(dest);
      const header = buf.slice(0, 4).toString('hex');
      if (header !== '00010000' && header !== '4f54544f' && header !== '74727565') {
        fs.unlinkSync(dest);
        allOk = false;
      }
    } catch {
      allOk = false;
    }
  }

  if (!allOk) {
    process.exit(1);
  }
}

main();
