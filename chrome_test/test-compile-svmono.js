/**
 * Test compilation with svmono.cls project
 * Kiểm tra compilation có tìm thấy svmono.cls và các file khác không
 */

import { createBrowser, createPage, waitAndClick, waitAndType, takeScreenshot, log, sleep } from './utils.js';
import fs from 'fs';

// Configuration
const BASE_URL = 'https://heytex.truyenthong.edu.vn';
const TEST_CREDENTIALS = {
    email: 'phuc@gmail.com',
    password: 'phuc@123'
};
const PROJECT_ID = 'e224b352-0569-4c7a-8a3c-6c73bda023ce';

// Create screenshots directory
if (!fs.existsSync('./screenshots')) {
    fs.mkdirSync('./screenshots', { recursive: true });
}

async function testCompilation() {
    log('Starting compilation test for svmono project', 'test');
    
    const browser = await createBrowser();
    const page = await createPage(browser);
    
    try {
        // Login
        log('Test 1: Logging in...');
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
        await waitAndType(page, 'input[type="email"]', TEST_CREDENTIALS.email);
        await waitAndType(page, 'input[type="password"]', TEST_CREDENTIALS.password);
        await Promise.all([
            waitAndClick(page, 'button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle0' })
        ]);
        log('Logged in successfully', 'success');
        await takeScreenshot(page, '01-logged-in');
        
        // Navigate to editor
        log('Test 2: Opening editor...');
        await page.goto(`${BASE_URL}/editor/${PROJECT_ID}`, { waitUntil: 'networkidle0' });
        await sleep(2000);
        log('Editor opened', 'success');
        await takeScreenshot(page, '02-editor-opened');
        
        // Wait for file tree
        log('Test 3: Waiting for file tree...');
        await page.waitForSelector('[class*="file-tree"]', { timeout: 10000 });
        log('File tree loaded', 'success');
        
        // Select book.tex
        log('Test 4: Selecting book.tex...');
        const bookTexFound = await page.evaluate(() => {
            const items = document.querySelectorAll('[class*="file-item"]');
            for (const item of items) {
                if (item.textContent.includes('book.tex')) {
                    item.click();
                    return true;
                }
            }
            return false;
        });
        
        if (bookTexFound) {
            log('book.tex selected', 'success');
            await sleep(1500);
            await takeScreenshot(page, '03-book-tex-selected');
        } else {
            log('book.tex not found in file tree', 'warn');
        }
        
        // Find compile button
        log('Test 5: Looking for compile button...');
        
        // Log all buttons first
        const buttons = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.map((btn, idx) => ({
                index: idx,
                text: btn.textContent.trim(),
                class: btn.className,
                title: btn.title
            }));
        });
        
        log(`Found ${buttons.length} buttons:`, 'info');
        buttons.forEach(btn => {
            if (btn.text) {
                console.log(`  [${btn.index}] "${btn.text}" (${btn.title || 'no title'})`);
            }
        });
        
        // Click compile button
        const compileClicked = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const compileBtn = btns.find(btn => 
                btn.textContent.includes('Compile') || 
                btn.textContent.includes('Biên dịch') ||
                btn.title?.includes('Compile')
            );
            if (compileBtn) {
                compileBtn.click();
                return true;
            }
            return false;
        });
        
        if (!compileClicked) {
            log('Compile button not found!', 'error');
            await takeScreenshot(page, '04-no-compile-button');
            log('Test stopped - cannot proceed without compile button', 'error');
            return false;
        }
        
        log('Compile button clicked', 'success');
        await sleep(2000);
        await takeScreenshot(page, '05-compile-clicked');
        
        // Wait for compilation
        log('Test 6: Waiting for compilation (10 seconds)...');
        await sleep(10000);
        await takeScreenshot(page, '06-after-compilation');
        
        // Check page text for errors
        log('Test 7: Checking for errors...');
        const pageText = await page.evaluate(() => document.body.innerText);
        
        let hasError = false;
        const errors = [];
        
        if (pageText.includes('svmono.cls')) {
            errors.push('svmono.cls mentioned in page');
            hasError = true;
        }
        
        if (pageText.includes('File') && pageText.includes('not found')) {
            errors.push('"File not found" error detected');
            hasError = true;
        }
        
        if (pageText.includes('LaTeX Error')) {
            errors.push('LaTeX Error detected');
            hasError = true;
        }
        
        if (pageText.includes('Emergency stop')) {
            errors.push('Emergency stop detected');
            hasError = true;
        }
        
        if (hasError) {
            log('Compilation errors found:', 'error');
            errors.forEach(err => log(`  - ${err}`, 'error'));
            await takeScreenshot(page, '07-compilation-errors');
        } else if (pageText.includes('completed') || pageText.includes('thành công') || pageText.includes('success')) {
            log('Compilation appears successful!', 'success');
            await takeScreenshot(page, '07-compilation-success');
        } else {
            log('Compilation status unknown', 'warn');
            await takeScreenshot(page, '07-compilation-unknown');
        }
        
        await takeScreenshot(page, '08-final');
        
        log('Test completed!', 'success');
        return !hasError;
        
    } catch (error) {
        log(`Test failed: ${error.message}`, 'error');
        await takeScreenshot(page, 'error');
        throw error;
    } finally {
        await browser.close();
    }
}

// Run test
testCompilation().then((success) => {
    if (success) {
        log('\n✅ All tests passed - No compilation errors found!', 'success');
        process.exit(0);
    } else {
        log('\n❌ Compilation errors detected!', 'error');
        process.exit(1);
    }
}).catch(error => {
    log(`\n❌ Test execution failed: ${error.message}`, 'error');
    process.exit(1);
});
