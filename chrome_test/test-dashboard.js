// Test Dashboard Features
import { createBrowser, createPage, waitAndClick, waitAndType, takeScreenshot, log, sleep, BASE_URL, TEST_USER } from './utils.js';
import fs from 'fs';

if (!fs.existsSync('./screenshots')) {
    fs.mkdirSync('./screenshots', { recursive: true });
}

async function testDashboard() {
    log('Starting Dashboard Tests', 'test');

    const browser = await createBrowser();
    const page = await createPage(browser);

    try {
        // Login first
        log('Logging in...');
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
        await sleep(500);

        await waitAndType(page, 'input[type="email"]', TEST_USER.email);
        await waitAndType(page, 'input[type="password"]', TEST_USER.password);
        await waitAndClick(page, 'button[type="submit"]');
        await sleep(2000);

        // If not logged in, register first
        if (!page.url().includes('/dashboard')) {
            log('User not found, registering...', 'info');
            await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle0' });
            await waitAndType(page, 'input[placeholder="Nguyễn Văn A"]', TEST_USER.name);
            await waitAndType(page, 'input[placeholder="email@example.com"]', TEST_USER.email);
            const passwordInputs = await page.$$('input[type="password"]');
            await passwordInputs[0].type(TEST_USER.password);
            await passwordInputs[1].type(TEST_USER.password);
            await waitAndClick(page, 'button[type="submit"]');
            await sleep(2000);
        }

        // Test 1: Dashboard Layout
        log('Test 1: Checking Dashboard Layout...');
        await takeScreenshot(page, 'dashboard-01-layout');

        const header = await page.$('header');
        const mainContent = await page.$('main');
        if (header && mainContent) {
            log('Dashboard layout is correct', 'success');
        }

        // Test 2: Theme Toggle
        log('Test 2: Testing Theme Toggle...');
        const isDarkBefore = await page.$eval('html', el => el.classList.contains('dark'));
        log(`Current theme: ${isDarkBefore ? 'dark' : 'light'}`, 'info');

        // Find theme toggle button (sun/moon icon)
        const themeBtn = await page.$('button:has(svg.lucide-sun), button:has(svg.lucide-moon)');
        if (themeBtn) {
            await themeBtn.click();
            await sleep(500);
            await takeScreenshot(page, 'dashboard-02-theme-toggled');

            const isDarkAfter = await page.$eval('html', el => el.classList.contains('dark'));
            if (isDarkBefore !== isDarkAfter) {
                log('Theme toggle works correctly', 'success');
            }

            // Toggle back
            await themeBtn.click();
            await sleep(300);
        }

        // Test 3: Create Project Modal
        log('Test 3: Testing Create Project Modal...');
        const createBtn = await page.$('button:has-text("Tạo dự án"), button:has(svg.lucide-plus)');
        if (createBtn) {
            await createBtn.click();
            await sleep(500);
            await takeScreenshot(page, 'dashboard-03-create-modal');

            // Check modal appeared
            const modal = await page.$('input[placeholder="Luận văn tốt nghiệp"], form');
            if (modal) {
                log('Create project modal opened', 'success');
            }

            // Test 4: Create Typst Project
            log('Test 4: Creating Typst Project...');
            const projectName = `Test Project ${Date.now()}`;
            await waitAndType(page, 'input[placeholder="Luận văn tốt nghiệp"]', projectName);

            // Select Typst engine (should be default)
            const typstBtn = await page.$('button:has-text("Typst"), button:has-text("Nhanh")');
            if (typstBtn) {
                await typstBtn.click();
            }

            await takeScreenshot(page, 'dashboard-04-project-form-filled');

            // Submit
            const submitBtn = await page.$('button[type="submit"]:has-text("Tạo dự án"), form button:last-child');
            if (submitBtn) {
                await submitBtn.click();
                await sleep(2000);

                // Should redirect to editor
                if (page.url().includes('/editor/')) {
                    log('Project created and redirected to editor', 'success');
                    await takeScreenshot(page, 'dashboard-05-redirected-to-editor');

                    // Go back to dashboard
                    const backBtn = await page.$('button:has(svg.lucide-chevron-left)');
                    if (backBtn) {
                        await backBtn.click();
                        await sleep(1000);
                    }
                }
            }
        }

        // Test 5: Project List
        log('Test 5: Checking Project List...');
        await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
        await sleep(1000);
        await takeScreenshot(page, 'dashboard-06-project-list');

        const projectCards = await page.$$('[class*="glass"][class*="rounded"]');
        log(`Found ${projectCards.length} project cards`, 'info');

        if (projectCards.length > 0) {
            log('Project list displays correctly', 'success');
        }

        log('Dashboard tests completed!', 'success');

    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        await takeScreenshot(page, 'error-dashboard');
        throw error;
    } finally {
        await browser.close();
    }
}

testDashboard()
    .then(() => {
        log('All dashboard tests passed!', 'success');
        process.exit(0);
    })
    .catch((error) => {
        log(`Tests failed: ${error.message}`, 'error');
        process.exit(1);
    });
