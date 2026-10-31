import puppeteer, { type Browser } from "puppeteer";
import { HttpError } from "../common/http.js";
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
      // Usually Chromium isn't installed (local dev without the Puppeteer download). Only PDF export and
      // seed avatars need it, so report a clear 503 instead of a generic 500.
      console.error(`[pdf] Could not start Chromium: ${String(err?.message).split("\n")[0]}`);
      throw new HttpError(
        503,
        "PDF export isn't available: Chromium isn't installed on the server. Run `npx puppeteer browsers install chrome` in server/ or set PUPPETEER_EXECUTABLE_PATH.",
      );
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
