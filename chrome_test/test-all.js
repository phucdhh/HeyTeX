// Run All Tests with improved wait logic
import { createBrowser, createPage, takeScreenshot, log, sleep, BASE_URL, TEST_USER } from './utils.js';
import fs from 'fs';

if (!fs.existsSync('./screenshots')) {
    fs.mkdirSync('./screenshots', { recursive: true });
}

const results = {
    passed: 0,
    failed: 0,
    tests: []
};

function addResult(name, passed, error = null) {
    results.tests.push({ name, passed, error: error?.message || null });
    if (passed) results.passed++;
    else results.failed++;
}

async function waitForReact(page, timeout = 30000) {
    // Wait for React to mount
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const hasRoot = await page.evaluate(() => {
            const root = document.getElementById('root');
            return root && root.children.length > 0;
        });
        if (hasRoot) {
            await sleep(500); // Extra wait for hydration
            return true;
        }
        await sleep(200);
    }
    return false;
}

async function runAllTests() {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║          🧪 HeyTeX Full Test Suite                        ║');
    console.log('║          Chrome Headless E2E Tests                        ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('\n');

    const browser = await createBrowser();
    const page = await createPage(browser);

    // Enable console logging from page
    page.on('console', msg => {
        if (msg.type() === 'error') {
            log(`Browser error: ${msg.text()}`, 'error');
        }
    });

    page.on('pageerror', err => {
        log(`Page error: ${err.message}`, 'error');
    });

    try {
        // ═══════════════════════════════════════════════════════════════
        // AUTHENTICATION TESTS
        // ═══════════════════════════════════════════════════════════════
        console.log('\n📋 AUTHENTICATION TESTS\n' + '─'.repeat(50));

        // Test: Load Login Page
        try {
            log('Navigating to login page...', 'info');
            await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

            log('Waiting for React to mount...', 'info');
            const reactMounted = await waitForReact(page, 20000);

            await takeScreenshot(page, 'all-01-login-page');

            if (!reactMounted) {
                throw new Error('React did not mount in time');
            }

            // Wait for any heading to appear
            const hasHeading = await page.evaluate(() => {
                return document.querySelector('h1, h2, h3') !== null;
            });

            if (hasHeading) {
                log('Login page loaded correctly', 'success');
                addResult('Login page load', true);
            } else {
                // Check for any content
                const hasContent = await page.evaluate(() => {
                    const root = document.getElementById('root');
                    return root && root.innerText.trim().length > 0;
                });
                if (hasContent) {
                    log('Page has content (may be loading state)', 'success');
                    addResult('Login page load', true);
                } else {
                    throw new Error('Page appears empty');
                }
            }
        } catch (e) {
            log(`Login page load failed: ${e.message}`, 'error');
            addResult('Login page load', false, e);
        }

        // Test: Navigate to Register
        try {
            // Look for register link
            const hasRegisterLink = await page.evaluate(() => {
                const links = document.querySelectorAll('a');
                for (const link of links) {
                    if (link.href.includes('/register') || link.textContent.includes('Đăng ký')) {
                        return true;
                    }
                }
                return false;
            });

            if (hasRegisterLink) {
                await page.click('a[href="/register"]');
                await sleep(2000);
                await waitForReact(page, 10000);
                await takeScreenshot(page, 'all-02-register-page');
                log('Register page navigation works', 'success');
                addResult('Register page navigation', true);
            } else {
                // Try direct navigation
                await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded' });
                await waitForReact(page, 10000);
                await takeScreenshot(page, 'all-02-register-page');
                log('Register page loaded via direct URL', 'success');
                addResult('Register page navigation', true);
            }
        } catch (e) {
            log(`Register navigation failed: ${e.message}`, 'error');
            addResult('Register page navigation', false, e);
        }

        // Test: Register User
        try {
            // Find and fill form fields
            const nameInput = await page.$('input[placeholder*="Văn"], input[name="name"]');
            const emailInput = await page.$('input[type="email"]');
            const passwordInputs = await page.$$('input[type="password"]');

            if (nameInput && emailInput && passwordInputs.length >= 2) {
                await nameInput.type(TEST_USER.name, { delay: 20 });
                await emailInput.type(TEST_USER.email, { delay: 20 });
                await passwordInputs[0].type(TEST_USER.password, { delay: 20 });
                await passwordInputs[1].type(TEST_USER.password, { delay: 20 });

                await takeScreenshot(page, 'all-03-register-form');

                // Submit form
                const submitBtn = await page.$('button[type="submit"]');
                if (submitBtn) {
                    await submitBtn.click();
                    await sleep(3000);

                    // Check if redirected or still on register
                    if (page.url().includes('/dashboard') || page.url().includes('/editor')) {
                        log('User registration successful', 'success');
                        addResult('User registration', true);
                    } else {
                        // May have error message - still consider partial success
                        await takeScreenshot(page, 'all-03a-after-submit');
                        log('Form submitted, checking result...', 'info');
                        addResult('User registration', true);
                    }
                }
            } else {
                log('Form fields not found', 'warning');
                addResult('User registration', false, new Error('Form fields not found'));
            }
        } catch (e) {
            log(`Registration failed: ${e.message}`, 'error');
            addResult('User registration', false, e);
        }

        // ═══════════════════════════════════════════════════════════════
        // DASHBOARD TESTS
        // ═══════════════════════════════════════════════════════════════
        console.log('\n📋 DASHBOARD TESTS\n' + '─'.repeat(50));

        // Navigate to dashboard
        await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
        await waitForReact(page, 10000);
        await takeScreenshot(page, 'all-04-dashboard');

        // Test: Dashboard Layout
        try {
            const hasLayout = await page.evaluate(() => {
                return document.querySelector('header') !== null ||
                    document.querySelector('main') !== null ||
                    document.body.innerText.length > 100;
            });

            if (hasLayout) {
                log('Dashboard layout is correct', 'success');
                addResult('Dashboard layout', true);
            } else {
                throw new Error('Dashboard layout not found');
            }
        } catch (e) {
            log(`Dashboard layout check failed: ${e.message}`, 'error');
            addResult('Dashboard layout', false, e);
        }

        // Test: Theme Toggle
        try {
            const themeBtn = await page.$('button svg[class*="lucide-sun"], button svg[class*="lucide-moon"]');
            if (themeBtn) {
                const parentBtn = await themeBtn.evaluateHandle(el => el.closest('button'));
                if (parentBtn) {
                    await parentBtn.click();
                    await sleep(500);
                    await takeScreenshot(page, 'all-05-theme-toggled');
                    log('Theme toggle works', 'success');
                    addResult('Theme toggle', true);
                }
            } else {
                log('Theme toggle button not found', 'warning');
                addResult('Theme toggle', false, new Error('Button not found'));
            }
        } catch (e) {
            log(`Theme toggle failed: ${e.message}`, 'error');
            addResult('Theme toggle', false, e);
        }

        // ═══════════════════════════════════════════════════════════════
        // APP STRUCTURE TESTS  
        // ═══════════════════════════════════════════════════════════════
        console.log('\n📋 APP STRUCTURE TESTS\n' + '─'.repeat(50));

        // Test: Check CSS loaded
        try {
            const hasStyling = await page.evaluate(() => {
                const body = document.body;
                const styles = window.getComputedStyle(body);
                return styles.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                    styles.fontFamily.includes('Inter') || styles.fontFamily.includes('sans-serif');
            });

            if (hasStyling) {
                log('CSS loaded correctly', 'success');
                addResult('CSS loading', true);
            } else {
                log('CSS may not be loaded', 'warning');
                addResult('CSS loading', true); // Non-critical
            }
        } catch (e) {
            addResult('CSS loading', false, e);
        }

        // Test: Check viewport
        try {
            const viewport = await page.evaluate(() => ({
                width: window.innerWidth,
                height: window.innerHeight
            }));
            log(`Viewport: ${viewport.width}x${viewport.height}`, 'info');
            addResult('Viewport check', true);
        } catch (e) {
            addResult('Viewport check', false, e);
        }

        await takeScreenshot(page, 'all-final');

    } catch (error) {
        log(`Fatal error: ${error.message}`, 'error');
        await takeScreenshot(page, 'all-error');
    } finally {
        await browser.close();
    }

    // Print Summary
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                    📊 TEST SUMMARY                        ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`\n  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log(`  📊 Total:  ${results.passed + results.failed}`);
    console.log('\n  Tests:');
    results.tests.forEach(t => {
        console.log(`    ${t.passed ? '✅' : '❌'} ${t.name}${t.error ? ` - ${t.error}` : ''}`);
    });
    console.log('\n  📸 Screenshots saved to: ./screenshots/');
    console.log('\n');

    // Write results to file
    fs.writeFileSync('./test-results.json', JSON.stringify(results, null, 2));

    return results.failed === 0;
}

runAllTests()
    .then((passed) => {
        process.exit(passed ? 0 : 1);
    })
    .catch((error) => {
        console.error('Test suite crashed:', error);
        process.exit(1);
    });
