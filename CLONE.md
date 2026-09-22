# Sefton homepage

The homepage recreates https://iwebbtech.com.ng/sefton using React and local Tailwind CSS. Images, Inter fonts, and Font Awesome icons are served from `public/sefton`.

Run `npm run dev` and visit the URL printed by Next.js. `npm run build` creates the production build. `npm run lint` checks source files.

The homepage includes responsive navigation, a persistent light/dark theme, service anchors, and home-screen shortcut instructions. Login and registration open the existing Finova banking application at `/banking`; its Firebase configuration and account behavior are preserved. Secondary privacy/terms links still point to the reference site. Rates and testimonials reproduce reference content and are not live financial data.

Browser verification: with the development server on port 3001, run `node scripts/check-clone.mjs`. This uses installed Microsoft Edge and saves desktop/mobile screenshots under `artifacts`.
