import puppeteer from 'puppeteer';

(async () => {
    console.log('=== Quick XeTeX Asset Load Test ===\n');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Track all network requests
    const loadedResources = [];
    const failedResources = [];
    
    page.on('response', response => {
        const url = response.url();
        const status = response.status();
        
        if (url.includes('XeTeX') || url.includes('swiftlatex') || url.includes('core/swift')) {
            if (status >= 200 && status < 300) {
                loadedResources.push(url);
                console.log(`✓ [${status}] ${url.split('/').pop()}`);
            } else {
                failedResources.push({url, status});
                console.log(`✗ [${status}] ${url.split('/').pop()}`);
            }
        }
    });
    
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('XeTeX') || text.includes('Engine') || text.includes('Failed to load')) {
            console.log('PAGE:', text);
        }
    });
    
    try {
        console.log('Loading homepage...');
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 10000 });
        console.log('Homepage loaded\n');
        
        // Try to manually trigger XeTeX script load by executing in page context
        console.log('Attempting to load XeTeX scripts manually...\n');
        
        const result = await page.evaluate(async () => {
            const loadScript = (src) => {
                return new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = src;
                    script.onload = () => resolve({success: true, src});
                    script.onerror = (err) => reject({success: false, src, error: err.toString()});
                    document.head.appendChild(script);
                });
            };
            
            try {
                // Try to load setup script
                const setup = await loadScript('/core/swiftlatex/TexlyreXeTeXEngineSetup.js');
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
                
                return {
                    setupLoaded: true,
                    hasXeTeXEngine: typeof window.XeTeXEngine !== 'undefined',
                    enginePath: window.ENGINE_PATH || 'not set',
                    scripts: Array.from(document.scripts).map(s => s.src).filter(s => s.includes('XeTeX') || s.includes('swift'))
                };
            } catch (error) {
                return {
                    setupLoaded: false,
                    error: error.toString(),
                    hasXeTeXEngine: false
                };
            }
        });
        
        console.log('\n=== Test Results ===');
        console.log('Setup script loaded:', result.setupLoaded);
        console.log('XeTeXEngine available:', result.hasXeTeXEngine);
        console.log('ENGINE_PATH:', result.enginePath);
        console.log('Loaded scripts:', result.scripts);
        
        console.log('\nSuccessfully loaded resources:', loadedResources.length);
        console.log('Failed resources:', failedResources.length);
        
        if (failedResources.length > 0) {
            console.log('\nFailed to load:');
            failedResources.forEach(r => console.log(`  - [${r.status}] ${r.url}`));
        }
        
        if (result.hasXeTeXEngine) {
            console.log('\n✓✓✓ SUCCESS: XeTeXEngine loaded successfully! ✓✓✓');
        } else {
            console.log('\n✗✗✗ FAILED: XeTeXEngine not available ✗✗✗');
            if (result.error) {
                console.log('Error:', result.error);
            }
        }
        
    } catch (error) {
        console.error('Test error:', error.message);
    } finally {
        await browser.close();
    }
})();
