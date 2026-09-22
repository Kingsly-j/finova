import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';

const root = 'https://iwebbtech.com.ng/sefton';
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
try {
  await page.goto(root + '/login');
  await page.locator('input[name=email]').fill(process.env.REFERENCE_EMAIL);
  await page.locator('input[name=password]').fill(process.env.REFERENCE_PASSWORD);
  await Promise.all([page.waitForURL('**/dashboard/pin'), page.getByRole('button', {name:'Sign In to Account'}).click()]);
  await page.locator('#desktop-pin').fill(process.env.REFERENCE_PIN);
  const verification = await page.evaluate(async pin => {
    const response = await fetch('https://iwebbtech.com.ng/sefton/dashboard/pinstatus', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]').content }, body: JSON.stringify({pin}) });
    return response.json();
  }, process.env.REFERENCE_PIN);
  if (!verification.success) throw Error('PIN verification failed');
  await page.goto(root + '/dashboard');
  await page.waitForTimeout(1200);
  const links = await page.locator('a[href]').evaluateAll(elements => elements.map(a => ({label:a.innerText.trim(), url:a.href})).filter(a => a.url.includes('/sefton/dashboard')));
  const unique = [...new Map(links.map(link => [link.url, link])).values()].filter(link => !/logout|delete|remove|cancel|activate|freeze/i.test(link.url));
  if (process.env.REFERENCE_DETAILS) {
    const states = [];
    async function capture(label) {
      await page.waitForTimeout(1200);
      const data = await page.evaluate(() => ({
        text:document.body.innerText,
        fields:[...document.querySelectorAll('input,select,textarea')].filter(e=>e.type!=='hidden'&&e.getBoundingClientRect().width).map(e=>({name:e.name,type:e.type,label:e.closest('label')?.innerText,placeholder:e.placeholder,disabled:e.disabled,options:e.tagName==='SELECT'?[...e.options].map(o=>o.text):undefined})),
        links:[...document.querySelectorAll('a[href]')].map(a=>({text:a.innerText.trim(),url:a.href})).filter(a=>a.text)
      }));
      states.push({label,url:page.url(),...data});
      console.log('STATE',label);
      await fs.writeFile('artifacts/reference-pages/details.json',JSON.stringify(states,null,2));
    }
    for (const route of ['/account-settings','/manage-account-security','/grant-application/20']) {
      await page.goto(root+'/dashboard'+route,{waitUntil:'domcontentloaded'});
      await page.waitForTimeout(2500);
      await capture(route);
      if (route==='/account-settings') for(const label of ['Password Settings','Two-Factor Authentication','Transaction PIN']) {
        await page.goto(root+'/dashboard/account-settings',{waitUntil:'domcontentloaded'});
        await page.waitForTimeout(2500);
        const button=page.getByText(label,{exact:true}).filter({visible:true}).first();
        if(await button.count()) {await button.click();await capture(label);}
      }
      if(route==='/internationaltransfer') for(const label of ['Wire Transfer','Cryptocurrency','PayPal','More Options']) {
        await page.goto(root+'/dashboard'+route,{waitUntil:'domcontentloaded'});
        await page.waitForTimeout(2500);
        const button=page.getByText(label,{exact:true}).filter({visible:true}).first();
        if(await button.count()) {await button.click();await capture(label);}
      }
      if(route==='/cards'){
        const apply=page.getByText('Apply for Card',{exact:true}).filter({visible:true}).first();
        if(await apply.count()){await apply.click();await capture('Card application');}
      }
    }
    process.exitCode=0;
    await browser.close();
    process.exit();
  }
  console.log('LINKS', JSON.stringify(unique));
  await fs.mkdir('artifacts/reference-pages', {recursive:true});
  const results = [];
  for (const link of unique.slice(0,35)) {
    try {
      const response = await page.goto(link.url, {waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForTimeout(1000);
      const info = await page.evaluate(() => ({
        title:document.title,
        text:document.body.innerText,
        fields:[...document.querySelectorAll('input,select,textarea')].filter(e=>!['hidden','password'].includes(e.type)).map(e=>({tag:e.tagName,type:e.type,name:e.name,placeholder:e.placeholder,options:e.tagName==='SELECT'?[...e.options].map(o=>({text:o.text,value:o.value})):undefined})),
        buttons:[...document.querySelectorAll('button')].map(e=>e.innerText.trim()).filter(Boolean),
        forms:[...document.querySelectorAll('form')].map(f=>({action:f.action,method:f.method})),
        links:[...document.querySelectorAll('main a[href], .main-content a[href]')].map(a=>({label:a.innerText.trim(),url:a.href}))
      }));
      const slug = new URL(link.url).pathname.replace(/[^a-z0-9]/gi,'-');
      await page.screenshot({path:'artifacts/reference-pages/'+slug+'.png',fullPage:true});
      results.push({...link,status:response.status(),...info});
      console.log('INSPECTED',link.url,response.status(),info.title,info.fields.map(f=>f.name).join(','));
    } catch(e) { results.push({...link,error:e.message}); }
  }
  await fs.writeFile('artifacts/reference-pages/inventory.json',JSON.stringify(results,null,2));
} finally { await browser.close(); }
