/**
 * Template for new test cases
 * Copy this file and modify for your specific test
 */

const { setupBrowser, login, takeScreenshot, delay } = require('./utils');

const BASE_URL = 'https://heytex.truyenthong.edu.vn';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password';

async function testFeatureName() {
    console.log('🧪 Testing: [Feature Name]');
    
    const { browser, page } = await setupBrowser();
    
    try {
        // Step 1: Login
        console.log('📝 Step 1: Login');
        await login(page, TEST_EMAIL, TEST_PASSWORD);
        await delay(2000);
        
        // Step 2: Navigate to feature
        console.log('📝 Step 2: Navigate to feature');
        await page.goto(`${BASE_URL}/path-to-feature`);
        await delay(2000);
        
        // Step 3: Test main functionality
        console.log('📝 Step 3: Test main functionality');
        
        // Example: Click a button
        const button = await page.$('.some-button');
        if (!button) {
            throw new Error('Button not found');
        }
        await button.click();
        await delay(1000);
        
        // Example: Check for expected element
        const resultElement = await page.$('.expected-result');
        if (!resultElement) {
            throw new Error('Expected result not found');
        }
        
        // Example: Verify text content
        const text = await page.$eval('.result-text', el => el.textContent);
        if (!text.includes('expected text')) {
            throw new Error(`Unexpected text: ${text}`);
        }
        
        // Success screenshot
        await takeScreenshot(page, 'feature-name-success');
        
        console.log('✅ Test passed: [Feature Name]');
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await takeScreenshot(page, 'feature-name-error');
        throw error;
        
    } finally {
        await browser.close();
    }
}

// Run the test
if (require.main === module) {
    testFeatureName()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = testFeatureName;
