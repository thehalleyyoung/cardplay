/**
 * Capture notation HTML as PNG using Puppeteer
 */

import puppeteer from 'puppeteer';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const outputDir = path.join(__dirname, '..', '..', 'test-output');
  
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 2 });
  
  // Capture professional version
  const htmlProPath = path.join(outputDir, 'notation_professional.html');
  const pngProPath = path.join(outputDir, 'notation_professional.png');
  
  console.log(`Loading ${htmlProPath}...`);
  await page.goto(`file://${htmlProPath}`, { waitUntil: 'networkidle0' });
  
  // Wait for fonts to load using document.fonts.ready
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Additional wait to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 500));
  });
  
  // Verify font loaded
  const fontLoaded = await page.evaluate(() => {
    return document.fonts.check('40px Leland');
  });
  console.log(`Leland font loaded: ${fontLoaded}`);
  
  // Find the first notation container and capture it
  const element = await page.$('.notation-container');
  if (element) {
    console.log('Capturing professional notation...');
    await element.screenshot({ path: pngProPath });
    console.log(`Saved professional PNG to: ${pngProPath}`);
  } else {
    console.log('Capturing full page...');
    await page.screenshot({ path: pngProPath, fullPage: true });
  }
  
  // Also capture basic version for comparison
  const htmlPath = path.join(outputDir, 'notation_complex.html');
  const pngPath = path.join(outputDir, 'notation_complex.png');
  
  console.log(`Loading ${htmlPath}...`);
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  const basicElement = await page.$('.notation-container');
  if (basicElement) {
    console.log('Capturing basic notation...');
    await basicElement.screenshot({ path: pngPath });
    console.log(`Saved basic PNG to: ${pngPath}`);
  }
  
  await browser.close();
  console.log('\nDone! Compare the two PNG files to see the improvement.');
}

main().catch(console.error);
