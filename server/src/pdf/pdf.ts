import puppeteer, { type Browser } from "puppeteer";
import { renderHtml } from "./templates.js";
import type { CvData } from "./types.js";

let browserPromise: Promise<Browser> | null = null;

// One shared Chromium instance; each render gets its own page.
function getBrowser(): Promise<Browser> {
  browserPromise ??= puppeteer
    .launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    })
    .then((browser) => {
      browser.on("disconnected", () => (browserPromise = null));
      return browser;
    })
    .catch((err) => {
      browserPromise = null;
      throw err;
    });
  return browserPromise;
}

// For one-off scripts (e.g. the seed CLI) that must exit when done.
export async function closeBrowser() {
  const browser = await browserPromise?.catch(() => null);
  await browser?.close();
}

export async function htmlToPdf(html: string): Promise<Uint8Array> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load" });
    return await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
  } finally {
    await page.close();
  }
}

// Screenshot of an HTML snippet at a fixed size, e.g. the generated avatars in the demo seed.
export async function htmlToPng(html: string, width: number, height: number): Promise<Uint8Array> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width, height });
    await page.setContent(html, { waitUntil: "load" });
    return await page.screenshot({ type: "png" });
  } finally {
    await page.close();
  }
}

export async function renderCvPdf(templateId: string, cv: CvData): Promise<Uint8Array> {
  return htmlToPdf(renderHtml(templateId, { cv }));
}
