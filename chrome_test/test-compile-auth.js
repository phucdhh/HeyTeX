/**
 * Test compilation with authentication
 * Kiểm tra xem compile API có nhận token đúng không
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

async function testCompileAuth() {
    log('Starting compile authentication test', 'test');
    
    const browser = await createBrowser();
    const page = await createPage(browser);
    
    // Enable console logging
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('[Compile]') || text.includes('401') || text.includes('Unauthorized')) {
            console.log('Browser console:', text);
        }
    });
    
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
        
        // Check token in localStorage
        log('Test 2: Checking token in localStorage...');
        const token = await page.evaluate(() => localStorage.getItem('token'));
        if (token) {
            log(`Token found: ${token.substring(0, 20)}...`, 'success');
        } else {
            log('No token found in localStorage!', 'error');
            await takeScreenshot(page, '02-no-token');
            return false;
        }
        
        // Navigate to editor
        log('Test 3: Opening editor...');
        await page.goto(`${BASE_URL}/editor/${PROJECT_ID}`, { waitUntil: 'networkidle0' });
        await sleep(2000);
        log('Editor opened', 'success');
        await takeScreenshot(page, '03-editor-opened');
        
        // Wait for file tree
        log('Test 4: Waiting for file tree...');
        await page.waitForSelector('[class*="file-tree"]', { timeout: 10000 });
        log('File tree loaded', 'success');
        
        // Select book.tex
        log('Test 5: Selecting book.tex...');
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
        
        if (!bookTexFound) {
            log('book.tex not found in file tree', 'warn');
        } else {
            log('book.tex selected', 'success');
            await sleep(1500);
            await takeScreenshot(page, '04-book-tex-selected');
        }
        
        // Intercept network requests to check headers
        log('Test 6: Setting up network interception...');
        await page.setRequestInterception(true);
        
        let compileRequestFound = false;
        let compileRequestHasAuth = false;
        let compileRequestToken = '';
        
        page.on('request', request => {
            const url = request.url();
            if (url.includes('/api/compile') && request.method() === 'POST') {
                compileRequestFound = true;
                const headers = request.headers();
                if (headers.authorization) {
                    compileRequestHasAuth = true;
                    compileRequestToken = headers.authorization;
                    log(`Compile request has Authorization header: ${headers.authorization.substring(0, 30)}...`, 'success');
                } else {
                    log('Compile request MISSING Authorization header!', 'error');
                }
            }
            request.continue();
        });
        
        page.on('response', async response => {
            const url = response.url();
            if (url.includes('/api/compile')) {
                const status = response.status();
                log(`Compile response status: ${status}`, status === 201 ? 'success' : 'error');
                
                if (status === 401) {
                    log('Got 401 Unauthorized!', 'error');
                    try {
                        const body = await response.text();
                        log(`Response body: ${body}`, 'error');
                    } catch (e) {
                        log('Could not read response body', 'warn');
                    }
                }
            }
        });
        
        // Click compile button
        log('Test 7: Looking for compile button...');
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
            await takeScreenshot(page, '05-no-compile-button');
            return false;
        }
        
        log('Compile button clicked', 'success');
        await sleep(3000);
        await takeScreenshot(page, '06-after-compile-click');
        
        // Check results
        log('Test 8: Checking compile request...');
        if (!compileRequestFound) {
            log('No compile request was sent!', 'error');
            return false;
        }
        
        if (!compileRequestHasAuth) {
            log('Compile request did NOT include Authorization header!', 'error');
            await takeScreenshot(page, '07-no-auth-header');
            return false;
        }
        
        // Check if token matches
        const expectedAuth = `Bearer ${token}`;
        if (compileRequestToken === expectedAuth) {
            log('Authorization header matches localStorage token!', 'success');
        } else {
            log('Authorization header does NOT match localStorage token!', 'error');
            log(`Expected: ${expectedAuth.substring(0, 40)}...`, 'error');
            log(`Got: ${compileRequestToken.substring(0, 40)}...`, 'error');
        }
        
        await sleep(2000);
        await takeScreenshot(page, '08-final');
        
        log('Test completed!', 'success');
        return compileRequestFound && compileRequestHasAuth;
        
    } catch (error) {
        log(`Test failed: ${error.message}`, 'error');
        console.error(error);
        await takeScreenshot(page, 'error');
        throw error;
    } finally {
        await browser.close();
    }
}

// Run test
testCompileAuth().then((success) => {
    if (success) {
        log('\n✅ All tests passed - Compile request has proper authentication!', 'success');
        process.exit(0);
    } else {
        log('\n❌ Authentication test failed!', 'error');
        process.exit(1);
    }
}).catch(error => {
    log(`\n❌ Test execution failed: ${error.message}`, 'error');
    process.exit(1);
});
