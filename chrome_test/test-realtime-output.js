import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://heytex.truyenthong.edu.vn';
const EMAIL = 'phuc@gmail.com';
const PASSWORD = 'phuc@123';
const PROJECT_ID = 'e224b352-0569-4c7a-8a3c-6c73bda023ce';

async function testRealtimeOutput() {
    console.log('🚀 Starting real-time compilation output test...\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security'
        ],
        defaultViewport: { width: 1920, height: 1080 },
        protocolTimeout: 180000 // 3 minutes
    });

    const page = await browser.newPage();
    
    try {
        
        // Enable console logging from page
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            if (type === 'log' && text.includes('[Compile]')) {
                console.log(`📝 [Page]: ${text}`);
            }
        });

        // 1. Login
        console.log('1️⃣ Logging in...');
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
        await page.type('input[type="email"]', EMAIL);
        await page.type('input[type="password"]', PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log('✅ Logged in\n');

        // 2. Navigate to project editor
        console.log('2️⃣ Opening project editor...');
        await page.goto(`${BASE_URL}/editor/${PROJECT_ID}`, { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000); // Wait for editor to load
        console.log('✅ Editor loaded\n');

        // 3. Take screenshot before compile
        await page.screenshot({ 
            path: path.join(__dirname, 'screenshots', 'before-compile.png'),
            fullPage: true 
        });
        console.log('📸 Screenshot: before-compile.png\n');

        // 4. Click compile button
        console.log('3️⃣ Starting compilation...');
        const compileButton = await page.waitForSelector('button:has-text("Biên dịch")', { timeout: 5000 });
        await compileButton.click();
        console.log('✅ Compile button clicked\n');

        // 5. Monitor compilation output in real-time
        console.log('4️⃣ Monitoring compilation output...\n');
        
        let outputCaptures = [];
        let captureCount = 0;
        const maxCaptures = 10;
        const captureInterval = 1000; // Every 1 second

        for (let i = 0; i < maxCaptures; i++) {
            await page.waitForTimeout(captureInterval);
            
            // Check if compilation terminal is visible
            const terminalVisible = await page.evaluate(() => {
                const terminal = document.querySelector('pre');
                return terminal && terminal.textContent.includes('LaTeX') || 
                       terminal && terminal.textContent.includes('Compilation Output');
            });

            if (terminalVisible) {
                // Get terminal content
                const output = await page.evaluate(() => {
                    const terminal = document.querySelector('pre');
                    return terminal ? terminal.textContent : 'No output';
                });

                console.log(`\n📊 Capture ${i + 1}/${maxCaptures} (${captureInterval * i}ms):`);
                console.log('─'.repeat(80));
                
                // Show last 10 lines
                const lines = output.split('\n').filter(l => l.trim());
                const lastLines = lines.slice(-10);
                lastLines.forEach(line => {
                    console.log(`  ${line}`);
                });
                console.log('─'.repeat(80));

                outputCaptures.push({
                    time: captureInterval * i,
                    output: output,
                    lineCount: lines.length
                });

                // Take screenshot
                await page.screenshot({ 
                    path: path.join(__dirname, 'screenshots', `compile-${i + 1}.png`) 
                });
                captureCount++;
            }

            // Check if compilation is done
            const isDone = await page.evaluate(() => {
                const status = document.body.textContent;
                return status.includes('Compilation completed successfully') ||
                       status.includes('Compilation failed');
            });

            if (isDone) {
                console.log('\n✅ Compilation finished!\n');
                break;
            }
        }

        // 6. Final screenshot
        await page.waitForTimeout(2000);
        await page.screenshot({ 
            path: path.join(__dirname, 'screenshots', 'after-compile.png'),
            fullPage: true 
        });
        console.log('📸 Screenshot: after-compile.png\n');

        // 7. Analysis
        console.log('\n📈 Analysis:');
        console.log(`─ Total captures: ${captureCount}`);
        if (outputCaptures.length > 1) {
            const firstLineCount = outputCaptures[0].lineCount;
            const lastLineCount = outputCaptures[outputCaptures.length - 1].lineCount;
            const growth = lastLineCount - firstLineCount;
            
            console.log(`─ Initial output lines: ${firstLineCount}`);
            console.log(`─ Final output lines: ${lastLineCount}`);
            console.log(`─ Growth: +${growth} lines`);
            
            if (growth > 0) {
                console.log('\n✅ REAL-TIME OUTPUT IS WORKING! Output grew over time.');
            } else {
                console.log('\n❌ REAL-TIME OUTPUT NOT WORKING! Output is static.');
            }
        } else {
            console.log('⚠️  Not enough captures to analyze');
        }

        console.log(`\n📸 ${captureCount} screenshots saved to screenshots/\n`);

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

// Run test
testRealtimeOutput()
    .then(() => {
        console.log('✅ Test completed successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Test failed:', err);
        process.exit(1);
    });
