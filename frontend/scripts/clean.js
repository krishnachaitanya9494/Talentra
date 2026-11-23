import fs from 'fs';

try {
  fs.rmSync('.next', { recursive: true, force: true });
  console.log('[Talentra] Cleaned .next build directory.');
} catch (err) {
  // Ignore if already deleted
}
