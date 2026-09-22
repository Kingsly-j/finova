import { chromium } from '@playwright/test';
import fs from 'node:fs';
import { expect } from '@playwright/test';
fs.mkdirSync('artifacts', { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
try {
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'artifacts/desktop.png', fullPage: true });
await page.getByRole('button', { name: 'Toggle color theme', exact: true }).filter({ visible: true }).click();
if (!(await page.locator('html').getAttribute('class')).includes('dark')) throw new Error('Theme toggle failed');
await page.reload({waitUntil:'networkidle'});
if (!(await page.locator('html').getAttribute('class')).includes('dark')) throw new Error('Theme persistence failed');
await page.getByRole('button', { name: 'Toggle color theme', exact: true }).filter({ visible: true }).click();
await page.locator('#installPWA').click();
if (!(await page.locator('dialog').isVisible())) throw new Error('Install dialog did not open');
await page.getByRole('button', {name:'Got it'}).click();
const imageFailures = await page.locator('img').evaluateAll(images => images.filter(img => !img.complete || !img.naturalWidth).map(img => img.src));
if (imageFailures.length) throw new Error('Broken images: '+imageFailures.join(', '));
await page.setViewportSize({width:390,height:844});
await page.goto('http://localhost:3001', {waitUntil:'networkidle'});
await page.screenshot({ path: 'artifacts/mobile.png', fullPage:true });
await page.getByRole('button', {name:'Toggle navigation'}).click();
await expect(page.getByRole('button', {name:'Toggle navigation'})).toHaveAttribute('aria-expanded', 'true');
await expect(page.locator('nav a[href="#about"]').last()).toBeVisible();
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
if (overflow) throw new Error('Mobile page overflows horizontally');
await page.goto('http://localhost:3001/banking?mode=register',{waitUntil:'networkidle'});
await page.getByRole('heading',{name:'Start with Finova'}).waitFor();
await page.goto('http://localhost:3001/banking?mode=login',{waitUntil:'networkidle'});
await page.getByRole('heading',{name:'Sign in to Finova'}).waitFor();
if (errors.length) throw new Error(errors.join('\n'));
console.log('PASS: desktop and mobile rendering, images, theme persistence, mobile navigation, installation dialog, and local login/register routes.');
} finally { await browser.close(); }

