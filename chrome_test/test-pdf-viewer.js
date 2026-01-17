/**
 * Test PDF Viewer Toolbar
 * Kiểm tra xem navigation và zoom controls có hiển thị đúng không
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

async function testPDFViewer() {
    log('Starting PDF Viewer toolbar test', 'test');
    
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
        log('Logged in', 'success');
        await takeScreenshot(page, '01-logged-in');
        
        // Navigate to editor
        log('Test 2: Opening editor...');
        await page.goto(`${BASE_URL}/editor/${PROJECT_ID}`, { waitUntil: 'networkidle0' });
        await sleep(2000);
        await takeScreenshot(page, '02-editor-opened');
        
        // Wait for file tree
        log('Test 3: Waiting for file tree...');
        await page.waitForSelector('[class*="file-tree"]', { timeout: 10000 });
        
        // Select book.tex
        log('Test 4: Selecting book.tex...');
        await page.evaluate(() => {
            const items = document.querySelectorAll('[class*="file-item"]');
            for (const item of items) {
                if (item.textContent.includes('book.tex')) {
                    item.click();
                    break;
                }
            }
        });
        await sleep(1500);
        await takeScreenshot(page, '03-book-tex-selected');
        
        // Click compile button
        log('Test 5: Looking for compile button...');
        const compileClicked = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const compileBtn = btns.find(btn => 
                btn.textContent.includes('Biên dịch')
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
            return false;
        }
        
        log('Compile button clicked', 'success');
        await sleep(3000);
        await takeScreenshot(page, '05-compile-started');
        
        // Wait for compilation (max 30s)
        log('Test 6: Waiting for compilation...');
        let compilationDone = false;
        for (let i = 0; i < 30; i++) {
            const status = await page.evaluate(() => {
                return document.body.innerText;
            });
            
            if (status.includes('Thành công') || status.includes('PDF')) {
                compilationDone = true;
                break;
            }
            
            if (status.includes('failed') || status.includes('Lỗi')) {
                log('Compilation failed', 'warn');
                break;
            }
            
            await sleep(1000);
        }
        
        if (!compilationDone) {
            log('Compilation did not complete in time', 'warn');
        } else {
            log('Compilation completed', 'success');
        }
        
        await sleep(2000);
        await takeScreenshot(page, '06-after-compilation');
        
        // Check for PDF viewer toolbar
        log('Test 7: Checking PDF viewer toolbar...');
        
        const toolbarInfo = await page.evaluate(() => {
            // Look for ChevronUp/ChevronDown icons
            const allButtons = Array.from(document.querySelectorAll('button'));
            const upButton = allButtons.find(btn => 
                btn.title?.includes('trước') || btn.title?.includes('↑')
            );
            const downButton = allButtons.find(btn => 
                btn.title?.includes('sau') || btn.title?.includes('↓')
            );
            
            // Look for zoom buttons
            const zoomInBtn = allButtons.find(btn => 
                btn.title?.includes('Phóng to')
            );
            const zoomOutBtn = allButtons.find(btn => 
                btn.title?.includes('Thu nhỏ')
            );
            
            // Check page numbers display
            const pageDisplay = document.body.innerText.match(/\d+\s*\/\s*\d+/);
            
            return {
                hasUpButton: !!upButton,
                hasDownButton: !!downButton,
                hasZoomIn: !!zoomInBtn,
                hasZoomOut: !!zoomOutBtn,
                pageDisplay: pageDisplay ? pageDisplay[0] : null,
                upButtonTitle: upButton?.title || null,
                downButtonTitle: downButton?.title || null,
            };
        });
        
        log('Toolbar info:', 'info');
        console.log(JSON.stringify(toolbarInfo, null, 2));
        
        if (toolbarInfo.hasUpButton && toolbarInfo.hasDownButton) {
            log('✓ Found vertical navigation buttons (↑/↓)', 'success');
        } else {
            log('✗ Vertical navigation buttons NOT found', 'error');
        }
        
        if (toolbarInfo.hasZoomIn && toolbarInfo.hasZoomOut) {
            log('✓ Found zoom controls', 'success');
        } else {
            log('✗ Zoom controls NOT found', 'error');
        }
        
        if (toolbarInfo.pageDisplay) {
            log(`✓ Page display found: ${toolbarInfo.pageDisplay}`, 'success');
        } else {
            log('✗ Page display NOT found', 'error');
        }
        
        await takeScreenshot(page, '07-toolbar-check');
        
        // Check toolbar position (should be at top)
        const toolbarPosition = await page.evaluate(() => {
            const toolbars = Array.from(document.querySelectorAll('[class*="flex"][class*="items-center"]'));
            const pdfToolbar = toolbars.find(toolbar => {
                const text = toolbar.innerText;
                return text.match(/\d+\s*\/\s*\d+/) && text.includes('%');
            });
            
            if (pdfToolbar) {
                const rect = pdfToolbar.getBoundingClientRect();
                return {
                    found: true,
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    html: pdfToolbar.outerHTML.substring(0, 200)
                };
            }
            return { found: false };
        });
        
        log('Toolbar position:', 'info');
        console.log(JSON.stringify(toolbarPosition, null, 2));
        
        if (toolbarPosition.found) {
            log(`✓ Toolbar found at top: ${Math.round(toolbarPosition.top)}px from top`, 'success');
        } else {
            log('✗ Could not find toolbar position', 'error');
        }
        
        await takeScreenshot(page, '08-final');
        
        const allChecksPassed = 
            toolbarInfo.hasUpButton && 
            toolbarInfo.hasDownButton && 
            toolbarInfo.hasZoomIn && 
            toolbarInfo.hasZoomOut &&
            toolbarInfo.pageDisplay &&
            toolbarPosition.found;
        
        return allChecksPassed;
        
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
testPDFViewer().then((success) => {
    if (success) {
        log('\n✅ All checks passed - PDF viewer toolbar is correctly configured!', 'success');
        process.exit(0);
    } else {
        log('\n❌ Some checks failed - toolbar not displaying correctly', 'error');
        process.exit(1);
    }
}).catch(error => {
    log(`\n❌ Test execution failed: ${error.message}`, 'error');
    process.exit(1);
});
