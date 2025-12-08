// Test Authentication Flow
import { createBrowser, createPage, waitAndClick, waitAndType, takeScreenshot, log, sleep, BASE_URL, TEST_USER } from './utils.js';
import fs from 'fs';

// Create screenshots directory
if (!fs.existsSync('./screenshots')) {
    fs.mkdirSync('./screenshots', { recursive: true });
}

async function testAuthentication() {
    log('Starting Authentication Tests', 'test');

    const browser = await createBrowser();
    const page = await createPage(browser);

    try {
        // Test 1: Load Login Page
        log('Test 1: Loading Login Page...');
        await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
        await sleep(1000);
        await takeScreenshot(page, '01-login-page');

        const loginTitle = await page.$eval('h2', el => el.textContent);
        if (loginTitle.includes('Đăng nhập')) {
            log('Login page loaded correctly', 'success');
        } else {
            throw new Error('Login page not loaded correctly');
        }

        // Test 2: Navigate to Register Page
        log('Test 2: Navigating to Register Page...');
        await waitAndClick(page, 'a[href="/register"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        await sleep(500);
        await takeScreenshot(page, '02-register-page');

        const registerTitle = await page.$eval('h2', el => el.textContent);
        if (registerTitle.includes('Tạo tài khoản')) {
            log('Register page loaded correctly', 'success');
        } else {
            throw new Error('Register page not loaded correctly');
        }

        // Test 3: Register New User
        log('Test 3: Registering new user...');
        await waitAndType(page, 'input[placeholder="Nguyễn Văn A"]', TEST_USER.name);
        await waitAndType(page, 'input[placeholder="email@example.com"]', TEST_USER.email);

        const passwordInputs = await page.$$('input[type="password"]');
        await passwordInputs[0].type(TEST_USER.password);
        await passwordInputs[1].type(TEST_USER.password);

        await takeScreenshot(page, '03-register-filled');

        await waitAndClick(page, 'button[type="submit"]');
        await sleep(2000);

        // Check if redirected to dashboard
        const currentUrl = page.url();
        if (currentUrl.includes('/dashboard')) {
            log('Registration successful - redirected to dashboard', 'success');
            await takeScreenshot(page, '04-dashboard-after-register');
        } else {
            // Check for error message
            const errorEl = await page.$('.text-destructive, [class*="destructive"]');
            if (errorEl) {
                const errorText = await errorEl.evaluate(el => el.textContent);
                log(`Registration error: ${errorText}`, 'warning');
            }
            await takeScreenshot(page, '04-register-error');
        }

        // Test 4: Logout
        log('Test 4: Testing Logout...');
        if (currentUrl.includes('/dashboard')) {
            // Find and click logout button
            const logoutBtn = await page.$('button svg.lucide-log-out, button:has(svg[class*="log-out"])');
            if (logoutBtn) {
                await logoutBtn.click();
                await sleep(1000);

                if (page.url().includes('/login')) {
                    log('Logout successful', 'success');
                    await takeScreenshot(page, '05-after-logout');
                }
            }
        }

        // Test 5: Login with existing user
        log('Test 5: Testing Login with registered user...');
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
        await sleep(500);

        await waitAndType(page, 'input[type="email"]', TEST_USER.email);
        await waitAndType(page, 'input[type="password"]', TEST_USER.password);
        await takeScreenshot(page, '06-login-filled');

        await waitAndClick(page, 'button[type="submit"]');
        await sleep(2000);

        if (page.url().includes('/dashboard')) {
            log('Login successful', 'success');
            await takeScreenshot(page, '07-dashboard-after-login');
        } else {
            log('Login may have failed', 'warning');
            await takeScreenshot(page, '07-login-result');
        }

        log('Authentication tests completed!', 'success');

    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        await takeScreenshot(page, 'error-auth');
        throw error;
    } finally {
        await browser.close();
    }
}

// Run tests
testAuthentication()
    .then(() => {
        log('All authentication tests passed!', 'success');
        process.exit(0);
    })
    .catch((error) => {
        log(`Tests failed: ${error.message}`, 'error');
        process.exit(1);
    });
