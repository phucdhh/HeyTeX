// Test utilities for HeyTeX
import puppeteer from 'puppeteer';

export const BASE_URL = 'http://localhost';
export const API_URL = 'http://localhost:3001/api';

export const TEST_USER = {
    name: 'Test User',
    email: `test${Date.now()}@heytex.com`,
    password: process.env.TEST_PASSWORD || 'test-password-123'
};

export async function createBrowser() {
    return puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
        ],
    });
}

export async function createPage(browser) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    return page;
}

export async function waitAndClick(page, selector, timeout = 10000) {
    await page.waitForSelector(selector, { timeout, visible: true });
    await page.click(selector);
}

export async function waitAndType(page, selector, text, timeout = 10000) {
    await page.waitForSelector(selector, { timeout, visible: true });
    await page.type(selector, text);
}

export async function takeScreenshot(page, name) {
    const screenshotsDir = './screenshots';
    await page.screenshot({
        path: `${screenshotsDir}/${name}.png`,
        fullPage: true
    });
    console.log(`📸 Screenshot saved: ${name}.png`);
}

export function log(message, status = 'info') {
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️',
        test: '🧪'
    };
    console.log(`${icons[status] || 'ℹ️'} ${message}`);
}

export async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
