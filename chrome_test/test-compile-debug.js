import { createBrowser, createPage, sleep, TEST_USER, BASE_URL, waitAndType, waitAndClick, takeScreenshot } from './utils.js';

async function loginUser(page) {
    console.log('Logging in...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });

    await waitAndType(page, 'input[type="email"]', TEST_USER.email);
    await waitAndType(page, 'input[type="password"]', TEST_USER.password);

    // Try to click submit
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
        await submitBtn.click();
        await sleep(2000);
    }

    // Check if we are redirected to dashboard. If not, register.
    if (!page.url().includes('/dashboard')) {
        console.log('Login failed (user might not exist), trying to register...');
        await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle0' });

        await waitAndType(page, 'input[placeholder="Nguyễn Văn A"]', TEST_USER.name);
        await waitAndType(page, 'input[placeholder="email@example.com"]', TEST_USER.email);

        const passwordInputs = await page.$$('input[type="password"]');
        if (passwordInputs.length > 0) await passwordInputs[0].type(TEST_USER.password);
        if (passwordInputs.length > 1) await passwordInputs[1].type(TEST_USER.password);

        const regSubmit = await page.$('button[type="submit"]');
        if (regSubmit) {
            await regSubmit.click();
            await sleep(2000);
        }
    }

    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => { });

    // Final check
    if (page.url().includes('/dashboard')) {
        console.log('Logged in successfully');
    } else {
        console.log('Login/Register potentially failed, current URL:', page.url());
        const btnTexts = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.innerText));
        console.log('Buttons on page:', btnTexts);
    }
}

(async () => {
    const browser = await createBrowser();
    const page = await createPage(browser);

    try {
        console.log('Starting compilation debug test...');

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

        await loginUser(page);

        // Wait for dashboard
        await page.waitForSelector('h1', { timeout: 10000 }).catch(() => { });

        // Check for existing projects
        const existingProject = await page.$('h3.font-semibold');
        if (existingProject) {
            console.log('Found existing project, clicking...');
            await existingProject.click();
        } else {
            // Create a new project via UI
            console.log('Creating temp project via UI...');

            await page.waitForSelector('button');

            const newProjectBtn = await page.evaluateHandle(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(b => b.innerText.includes('Tạo dự án') || b.querySelector('svg.lucide-plus'));
            });

            if (newProjectBtn.asElement()) {
                await newProjectBtn.asElement().click();
                await sleep(1000);
            } else {
                console.log('New Project button not found');
                const btnTexts = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.innerText));
                console.log('Available buttons:', btnTexts);
                throw new Error('Cannot find New Project button');
            }

            // Wait for modal
            await page.waitForSelector('input[placeholder="Luận văn tốt nghiệp"]', { timeout: 5000 });
            await page.type('input[placeholder="Luận văn tốt nghiệp"]', 'MemFSTestProject');

            // Click submit using evaluate to avoid selector issues
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const submitBtn = buttons.find(b => b.type === 'submit' && b.innerText.includes('Tạo dự án')) || document.querySelector('form button:last-child');
                if (submitBtn) submitBtn.click();
                else throw new Error('Create submit button not found');
            });
        }

        // Wait for editor
        await page.waitForSelector('.monaco-editor', { timeout: 10000 });
        console.log('Editor loaded');

        // Wait for engine
        console.log('Waiting for engine...');
        await sleep(5000);

        // Trigger compilation (which writes file)
        console.log('Triggering compilation...');
        const compileBtn = await page.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Biên dịch'));
        });
        if (compileBtn.asElement()) await compileBtn.asElement().click();

        // Wait a bit
        await sleep(2000);

        // Dump directory
        console.log('Dumping MemFS directory...');
        await page.evaluate(async () => {
            if (window.currentEngine) {
                try {
                    const files = await window.currentEngine.dumpDirectory('/');
                    console.log('MemFS Content:', JSON.stringify(files));
                } catch (e) {
                    console.error('dumpDirectory failed:', e);
                }
            } else {
                console.error('window.currentEngine is undefined');
            }
        });

        await sleep(5000);

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await browser.close();
    }
})();
