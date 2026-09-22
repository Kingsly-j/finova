import { chromium, expect } from "@playwright/test";

const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const base = process.env.DASHBOARD_URL || "http://localhost:3000";

try {
  await page.goto(`${base}/dashboard`, { waitUntil: "networkidle" });
  await page.waitForURL(/\/banking\?mode=login/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();

  await page.goto(`${base}/dashboard/deposits`, { waitUntil: "networkidle" });
  await page.waitForURL(/\/banking\?mode=login/, { timeout: 10_000 });

  await page.goto(`${base}/banking?mode=register`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Create your Finova account" })).toBeVisible();
  await expect(page.getByLabel("First Name *")).toBeVisible();

  await page.goto(`${base}/admin`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Secure area" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Admin sign-in required" })).toHaveCount(0);

  await page.goto(`${base}/finova-control`, { waitUntil: "networkidle" });
  await page.waitForURL(/\/admin\?access=finova/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { name: "Admin sign-in required" })).toBeVisible();

  console.log("PASS dashboard protection, registration entry, and hidden admin gate");
} finally {
  await browser.close();
}
