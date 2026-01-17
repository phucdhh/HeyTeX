# Chrome Test Suite for HeyTeX

Thư mục này chứa các automated tests để kiểm tra tính năng của HeyTeX trước khi phát triển tính năng mới.

## Cấu trúc

```
chrome_test/
├── package.json           # Dependencies (puppeteer, etc.)
├── utils.js              # Helper functions
├── test-auth.js          # Test authentication flow
├── test-dashboard.js     # Test dashboard features
├── test-editor.js        # Test editor functionality
├── test-compile-debug.js # Test compilation
├── test-xetex-simple.js  # Test XeTeX compilation
├── test-asset-load.js    # Test asset loading
├── test-all.js           # Run all tests
├── test-results.json     # Test results
└── screenshots/          # Test screenshots
```

## Setup

```bash
cd chrome_test
npm install
```

## Sử dụng

### Run tất cả tests:
```bash
npm test
# hoặc
node test-all.js
```

### Run test riêng lẻ:
```bash
node test-auth.js
node test-editor.js
node test-compile-debug.js
```

### Với debug mode:
```bash
DEBUG=1 node test-editor.js
```

## Tests hiện có

### 1. **test-auth.js**
- Login flow
- Token management
- Session persistence

### 2. **test-dashboard.js**
- Project listing
- Project creation
- Project navigation

### 3. **test-editor.js**
- File tree navigation
- Editor loading
- File content editing
- Save functionality

### 4. **test-compile-debug.js**
- Compilation queue
- Error handling
- PDF generation

### 5. **test-xetex-simple.js**
- XeTeX compilation
- Font handling
- Vietnamese text support

### 6. **test-asset-load.js**
- Image loading
- CSS/JS bundle loading
- API endpoint availability

## Thêm test mới

Khi phát triển tính năng mới, tạo file test tương ứng:

```javascript
// test-new-feature.js
const { setupBrowser, login, takeScreenshot, delay } = require('./utils');

async function testNewFeature() {
    const { browser, page } = await setupBrowser();
    
    try {
        // Login first
        await login(page, 'test@example.com', 'password');
        
        // Your test steps here
        await page.goto('https://heytex.truyenthong.edu.vn/editor/PROJECT_ID');
        await delay(2000);
        
        // Test assertions
        const element = await page.$('.your-selector');
        if (!element) {
            throw new Error('Element not found');
        }
        
        await takeScreenshot(page, 'new-feature-success');
        console.log('✅ New feature test passed');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        await takeScreenshot(page, 'new-feature-error');
        throw error;
    } finally {
        await browser.close();
    }
}

testNewFeature();
```

## Best Practices

1. **Luôn login trước khi test tính năng**
2. **Dùng delay() để đợi UI render**
3. **Take screenshot khi có error**
4. **Clean up resources (close browser)**
5. **Test trên cả success và error cases**

## Debugging

Nếu test fail:
1. Check screenshots trong `screenshots/`
2. Check logs trong `test.log`, `debug.log`
3. Check test results trong `test-results.json`
4. Run với `DEBUG=1` để xem browser UI

## CI/CD Integration

Tests có thể chạy trong CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run Chrome Tests
  run: |
    cd chrome_test
    npm install
    npm test
```

## Environment Variables

```bash
# .env (optional)
HEYTEX_URL=https://heytex.truyenthong.edu.vn
TEST_EMAIL=test@example.com
TEST_PASSWORD=password
```

## Notes

- Tests chạy headless by default
- Screenshots lưu vào `screenshots/`
- Test results append vào `test-results.json`
- Logs append vào `test.log`
