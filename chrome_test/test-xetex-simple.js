import { createBrowser, createPage, sleep, TEST_USER } from './utils.js';

const BASE_URL = 'http://localhost:5173';

async function loginUser(page) {
    console.log('Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });

    await page.type('input[type="email"]', TEST_USER.email);
    await page.type('input[type="password"]', TEST_USER.password);

    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
        await submitBtn.click();
        await sleep(2000);
    }

    if (!page.url().includes('/dashboard')) {
        console.log('User not exists, registering...');
        await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle0' });

        await page.type('input[placeholder="Nguyễn Văn A"]', TEST_USER.name);
        await page.type('input[placeholder="email@example.com"]', TEST_USER.email);

        const passwordInputs = await page.$$('input[type="password"]');
        if (passwordInputs.length > 0) await passwordInputs[0].type(TEST_USER.password);
        if (passwordInputs.length > 1) await passwordInputs[1].type(TEST_USER.password);

        const regSubmit = await page.$('button[type="submit"]');
        if (regSubmit) {
            await regSubmit.click();
            await sleep(2000);
        }
    }

    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    console.log('Logged in, current URL:', page.url());
}

(async () => {
    const browser = await createBrowser();
    const page = await createPage(browser);

    try {
        console.log('=== XeTeX Engine Load Test ===\n');

        // Enable console logging from page
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('XeTeX') || text.includes('Engine') || text.includes('Failed')) {
                console.log('PAGE:', text);
            }
        });

        page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));

        // Track network requests
        page.on('response', response => {
            const url = response.url();
            if (url.includes('XeTeX') || url.includes('core/swift')) {
                console.log(`[${response.status()}] ${url}`);
            }
        });

        await loginUser(page);

        // Go to dashboard
        await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
        console.log('Dashboard loaded');
        await sleep(2000);

        // Find and click first project or create new one
        const projectCards = await page.$$('h3.font-semibold');
        
        if (projectCards.length > 0) {
            console.log(`Found ${projectCards.length} existing project(s), clicking first...`);
            await projectCards[0].click();
            await sleep(3000);
        } else {
            console.log('No projects found, creating new LaTeX project...');
            
            // Click new project button
            const buttons = await page.$$('button');
            for (const btn of buttons) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text.includes('Tạo dự án') || text.includes('New')) {
                    await btn.click();
                    await sleep(1000);
                    break;
                }
            }

            // Fill in project form
            await page.waitForSelector('input[placeholder="Luận văn tốt nghiệp"]', { timeout: 5000 });
            await page.type('input[placeholder="Luận văn tốt nghiệp"]', 'XeTeX Test Project');
            
            // Select LaTeX engine
            const radioButtons = await page.$$('input[type="radio"]');
            if (radioButtons.length > 0) {
                await radioButtons[0].click(); // Select first option (should be LaTeX)
            }

            // Submit form
            await page.evaluate(() => {
                const submitBtn = document.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.click();
            });

            await sleep(3000);
        }

        // Wait for editor page
        console.log('\nWaiting for editor to load...');
        await page.waitForSelector('.monaco-editor', { timeout: 15000 });
        console.log('✓ Monaco Editor loaded');

        // Wait for engine initialization
        console.log('\nWaiting 10s for XeTeX engine initialization...');
        await sleep(10000);

        // Check if XeTeX scripts loaded
        const engineStatus = await page.evaluate(() => {
            return {
                hasXeTeXEngine: typeof window.XeTeXEngine !== 'undefined',
                hasCurrentEngine: typeof window.currentEngine !== 'undefined',
                engineStatus: window.currentEngine?.getStatus ? window.currentEngine.getStatus() : 'unknown',
                scripts: Array.from(document.scripts).map(s => s.src).filter(src => src.includes('XeTeX') || src.includes('swift'))
            };
        });

        console.log('\n=== Engine Status ===');
        console.log('XeTeXEngine available:', engineStatus.hasXeTeXEngine);
        console.log('currentEngine available:', engineStatus.hasCurrentEngine);
        console.log('Engine status:', engineStatus.engineStatus);
        console.log('Loaded scripts:', engineStatus.scripts);

        if (engineStatus.hasXeTeXEngine) {
            console.log('\n✓✓✓ SUCCESS: XeTeXEngine loaded successfully! ✓✓✓');
        } else {
            console.log('\n✗✗✗ FAIL: XeTeXEngine not loaded ✗✗✗');
        }

        // Try to trigger compilation
        if (engineStatus.hasCurrentEngine && engineStatus.engineStatus === 'ready') {
            console.log('\nAttempting test compilation...');
            
            const compileButtons = await page.$$('button');
            for (const btn of compileButtons) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text.includes('Biên dịch') || text.includes('Compile')) {
                    console.log('Clicking compile button...');
                    await btn.click();
                    await sleep(5000);
                    
                    // Check compilation result
                    const result = await page.evaluate(() => {
                        return {
                            hasPDF: document.querySelector('canvas[data-page-number]') !== null,
                            errors: document.querySelector('.error') !== null
                        };
                    });
                    
                    console.log('Compilation result:', result);
                    break;
                }
            }
        }

        // Take screenshot
        await page.screenshot({ path: '/root/heytex/chrome_test/screenshots/xetex-test.png', fullPage: true });
        console.log('\nScreenshot saved to screenshots/xetex-test.png');

    } catch (error) {
        console.error('\n✗✗✗ Test failed:', error.message);
        await page.screenshot({ path: '/root/heytex/chrome_test/screenshots/error.png', fullPage: true });
    } finally {
        await browser.close();
        console.log('\nTest completed.');
    }
})();
