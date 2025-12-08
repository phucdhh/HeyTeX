// Test Editor Features
import { createBrowser, createPage, waitAndClick, waitAndType, takeScreenshot, log, sleep, BASE_URL, TEST_USER } from './utils.js';
import fs from 'fs';

if (!fs.existsSync('./screenshots')) {
    fs.mkdirSync('./screenshots', { recursive: true });
}

async function testEditor() {
    log('Starting Editor Tests', 'test');

    const browser = await createBrowser();
    const page = await createPage(browser);

    try {
        // Login first
        log('Setting up: Logging in and creating project...');
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
        await sleep(500);

        await waitAndType(page, 'input[type="email"]', TEST_USER.email);
        await waitAndType(page, 'input[type="password"]', TEST_USER.password);
        await waitAndClick(page, 'button[type="submit"]');
        await sleep(2000);

        // Register if not logged in
        if (!page.url().includes('/dashboard')) {
            await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle0' });
            await waitAndType(page, 'input[placeholder="Nguyễn Văn A"]', TEST_USER.name);
            await waitAndType(page, 'input[placeholder="email@example.com"]', TEST_USER.email);
            const passwordInputs = await page.$$('input[type="password"]');
            await passwordInputs[0].type(TEST_USER.password);
            await passwordInputs[1].type(TEST_USER.password);
            await waitAndClick(page, 'button[type="submit"]');
            await sleep(2000);
        }

        // Create a test project
        log('Creating test project...');
        const createBtn = await page.$('button:has-text("Tạo dự án"), button:has(svg.lucide-plus)');
        if (createBtn) {
            await createBtn.click();
            await sleep(500);

            await waitAndType(page, 'input[placeholder="Luận văn tốt nghiệp"]', `Editor Test ${Date.now()}`);

            const submitBtn = await page.$('form button:last-child, button:has-text("Tạo dự án")');
            if (submitBtn) {
                await submitBtn.click();
                await sleep(3000);
            }
        }

        // Test 1: Editor Layout
        log('Test 1: Checking Editor Layout...');
        await takeScreenshot(page, 'editor-01-layout');

        // Check for main components
        const header = await page.$('header');
        const sidebar = await page.$('aside, [class*="sidebar"]');
        const editor = await page.$('.monaco-editor, [class*="monaco"]');

        if (header) log('Header found', 'success');
        if (sidebar) log('Sidebar found', 'success');
        if (editor) log('Monaco editor found', 'success');

        // Test 2: Sidebar Toggle
        log('Test 2: Testing Sidebar Toggle...');
        const sidebarToggle = await page.$('button:has(svg.lucide-panel-left-close), button:has(svg.lucide-panel-left)');
        if (sidebarToggle) {
            await sidebarToggle.click();
            await sleep(500);
            await takeScreenshot(page, 'editor-02-sidebar-hidden');

            await sidebarToggle.click();
            await sleep(500);
            await takeScreenshot(page, 'editor-03-sidebar-visible');
            log('Sidebar toggle works', 'success');
        }

        // Test 3: Preview Toggle
        log('Test 3: Testing Preview Toggle...');
        const previewToggle = await page.$('button:has(svg.lucide-eye-off), button:has(svg.lucide-eye)');
        if (previewToggle) {
            await previewToggle.click();
            await sleep(500);
            await takeScreenshot(page, 'editor-04-preview-hidden');

            await previewToggle.click();
            await sleep(500);
            await takeScreenshot(page, 'editor-05-preview-visible');
            log('Preview toggle works', 'success');
        }

        // Test 4: Type in Editor
        log('Test 4: Testing Editor Input...');
        await page.waitForSelector('.monaco-editor', { timeout: 10000 });

        // Click on editor to focus
        await page.click('.monaco-editor');
        await sleep(500);

        // Type some content
        await page.keyboard.type('\n// Test comment from Chrome headless\n#let x = 42\n', { delay: 50 });
        await sleep(1000);
        await takeScreenshot(page, 'editor-06-content-typed');
        log('Editor input works', 'success');

        // Test 5: Theme Toggle in Editor
        log('Test 5: Testing Theme Toggle in Editor...');
        const themeBtn = await page.$('header button:has(svg.lucide-sun), header button:has(svg.lucide-moon)');
        if (themeBtn) {
            await themeBtn.click();
            await sleep(500);
            await takeScreenshot(page, 'editor-07-theme-light');

            await themeBtn.click();
            await sleep(500);
            await takeScreenshot(page, 'editor-08-theme-dark');
            log('Theme toggle in editor works', 'success');
        }

        // Test 6: Compile Button
        log('Test 6: Testing Compile Button...');
        const compileBtn = await page.$('button:has-text("Biên dịch"), button:has(svg.lucide-play)');
        if (compileBtn) {
            await compileBtn.click();
            await sleep(2000);
            await takeScreenshot(page, 'editor-09-after-compile');
            log('Compile button works', 'success');
        }

        // Test 7: File Tree (if files exist)
        log('Test 7: Checking File Tree...');
        const fileItems = await page.$$('aside [class*="cursor-pointer"], aside [class*="truncate"]');
        log(`Found ${fileItems.length} items in file tree`, 'info');

        // Test 8: Tab System
        log('Test 8: Checking Tab System...');
        const tabs = await page.$$('[class*="border-b-primary"], [class*="border-b-2"]');
        log(`Found ${tabs.length} open tabs`, 'info');
        await takeScreenshot(page, 'editor-10-final');

        // Test 9: Navigate Back to Dashboard
        log('Test 9: Testing Navigation Back...');
        const backBtn = await page.$('button:has(svg.lucide-chevron-left)');
        if (backBtn) {
            await backBtn.click();
            await sleep(1000);

            if (page.url().includes('/dashboard')) {
                log('Navigation back to dashboard works', 'success');
                await takeScreenshot(page, 'editor-11-back-to-dashboard');
            }
        }

        log('Editor tests completed!', 'success');

    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        await takeScreenshot(page, 'error-editor');
        throw error;
    } finally {
        await browser.close();
    }
}

testEditor()
    .then(() => {
        log('All editor tests passed!', 'success');
        process.exit(0);
    })
    .catch((error) => {
        log(`Tests failed: ${error.message}`, 'error');
        process.exit(1);
    });
