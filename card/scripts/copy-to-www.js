import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(__dirname, '../dist/botslab-vacuum-map-card.js');
const dest = path.resolve(__dirname, '../../custom_components/botslab_vacuum/www/botslab-vacuum-map-card.js');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} -> ${dest}`);
} else {
  console.error(`Build output not found at ${src}`);
  process.exit(1);
}
