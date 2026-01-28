# HeyTeX Enhanced Upload System

## Overview
Upgraded HeyTeX's file upload functionality to match Overleaf CE capabilities, providing a professional and powerful upload experience for LaTeX/Typst projects.

## New Features

### Backend Improvements

#### 1. UploadManager Service (`server/src/services/UploadManager.ts`)
- **File Validation**: Size limits, type restrictions, security checks
- **Batch Upload Support**: Handle multiple files simultaneously
- **Zip Extraction**: Extract and process zip archives
- **Path Sanitization**: Prevent directory traversal attacks
- **MIME Type Detection**: Automatic content-type detection

**Key Methods:**
- `validateFile()`: Validate individual file
- `validateBatch()`: Validate multiple files at once
- `extractZip()`: Extract contents from zip archive
- `sanitizePath()`: Clean and secure file paths

#### 2. Advanced Upload Routes (`server/src/routes/upload.ts`)
New endpoints:
- `POST /api/upload/files`: Upload multiple files
- `POST /api/upload/zip`: Upload and extract zip archives
- `POST /api/upload/validate`: Validate files before upload (dry run)

**Features:**
- Multi-file upload with progress tracking
- Zip file extraction with folder structure preservation
- Conflict detection and reporting
- Error handling per file
- Local storage + MinIO sync

#### 3. Upload Middleware (`server/src/middleware/upload.ts`)
- **Rate Limiting**: Prevent abuse
  - File uploads: 500 per 15 minutes
  - Zip uploads: 20 per minute
- **Request Validation**: Check content-type
- **Activity Logging**: Track upload operations

### Frontend Enhancements

#### UploadModal Component (`client/src/components/UploadModal.tsx`)
Modern, user-friendly upload interface similar to Overleaf:

**Features:**
- ✅ **Drag & Drop Zone**: Intuitive file dropping
- ✅ **Multiple File Selection**: Upload many files at once
- ✅ **Zip File Support**: Automatic extraction
- ✅ **Progress Tracking**: Real-time upload status
- ✅ **File Preview**: See files before uploading
- ✅ **Size Display**: Human-readable file sizes
- ✅ **Error Handling**: Clear error messages
- ✅ **Conflict Detection**: Warning for existing files

**UI Elements:**
- Large drop zone with visual feedback
- File list with status indicators
- Progress bars for each file
- Remove button for pending files
- Success/error indicators

## Security Features

### File Type Restrictions
Blocked dangerous file types:
- Executables: `.exe`, `.dll`, `.so`, `.dylib`
- Scripts: `.bat`, `.cmd`, `.sh`
- Packages: `.app`, `.deb`, `.rpm`, `.dmg`, `.pkg`, `.msi`

### Size Limits
- **Per File**: 50MB (configurable)
- **Total Batch**: 300MB (configurable)
- **Max Files**: 2000 files per upload

### Path Security
- Directory traversal prevention
- Path normalization
- Absolute path blocking
- Hidden file filtering (e.g., `__MACOSX`)

## Usage Examples

### Upload Multiple Files
```typescript
const formData = new FormData();
files.forEach(file => formData.append('files', file));
formData.append('projectId', projectId);
formData.append('targetPath', '/images');

const response = await fetch('/api/upload/files', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
});
```

### Upload Zip Archive
```typescript
const formData = new FormData();
formData.append('zipfile', zipFile);
formData.append('projectId', projectId);
formData.append('extractToFolder', 'true');

const response = await fetch('/api/upload/zip', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
});
```

### Validate Before Upload
```typescript
const response = await fetch('/api/upload/validate', {
    method: 'POST',
    headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        projectId,
        files: files.map(f => ({ name: f.name, size: f.size }))
    })
});
```

## Installation

### Backend Dependencies
```bash
cd server
npm install multer yauzl
npm install --save-dev @types/multer @types/yauzl
```

### Configuration
The upload system uses multer for handling multipart/form-data. Configuration options:

```typescript
// In server/src/routes/upload.ts
const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
        files: 100, // Max 100 files at once
    },
    fileFilter: (req, file, cb) => {
        // Custom file filtering logic
    }
});
```

## API Response Formats

### Successful Upload Response
```json
{
    "success": true,
    "uploaded": 5,
    "files": [
        {
            "id": "file-id",
            "name": "document.tex",
            "path": "/document.tex",
            "size": 1024,
            "mimeType": "text/x-tex"
        }
    ],
    "errors": []
}
```

### Zip Upload Response
```json
{
    "success": true,
    "extractedFiles": 15,
    "uploaded": 14,
    "files": [...],
    "conflicts": [
        {
            "file": "main.tex",
            "path": "/main.tex"
        }
    ],
    "totalSize": 245760
}
```

### Validation Response
```json
{
    "valid": true,
    "conflicts": [],
    "totalSize": 102400
}
```

## Error Handling

### Common Error Codes
- `400`: Bad request (missing fields, invalid data)
- `404`: Project not found
- `413`: File too large
- `422`: Validation failed
- `429`: Rate limit exceeded
- `500`: Internal server error

### Error Response Format
```json
{
    "error": "Error message",
    "details": "Detailed error description",
    "conflicts": [...],  // If applicable
    "errors": [...]      // Per-file errors
}
```

## Comparison with Overleaf CE

| Feature | HeyTeX | Overleaf CE | Status |
|---------|--------|-------------|--------|
| Multiple file upload | ✅ | ✅ | ✅ Complete |
| Zip file upload | ✅ | ✅ | ✅ Complete |
| Drag & drop | ✅ | ✅ | ✅ Complete |
| Progress tracking | ✅ | ✅ | ✅ Complete |
| Conflict detection | ✅ | ✅ | ✅ Complete |
| Rate limiting | ✅ | ✅ | ✅ Complete |
| File validation | ✅ | ✅ | ✅ Complete |
| Folder structure | ✅ | ✅ | ✅ Complete |

## Future Enhancements

### Planned Features
- [ ] **Resume Upload**: Handle interrupted uploads
- [ ] **Chunked Upload**: Upload large files in chunks
- [ ] **Background Processing**: Process uploads asynchronously
- [ ] **Thumbnail Generation**: Generate previews for images
- [ ] **Compression**: Auto-compress large files
- [ ] **Cloud Storage Integration**: Support S3, GCS, etc.
- [ ] **Version Control**: Track file versions
- [ ] **Batch Operations**: Delete/move multiple files

### Performance Optimizations
- [ ] Streaming file processing
- [ ] Parallel extraction for zip files
- [ ] Connection pooling for MinIO
- [ ] Caching for frequently accessed files
- [ ] CDN integration for static assets

## Testing

### Manual Testing Checklist
- [ ] Upload single file
- [ ] Upload multiple files (< 100)
- [ ] Upload zip archive
- [ ] Test file size limits
- [ ] Test file type restrictions
- [ ] Test conflict detection
- [ ] Test rate limiting
- [ ] Test error handling
- [ ] Test drag & drop
- [ ] Test progress tracking

### Test Files
Create test files in `server/test/fixtures/`:
- `test-project.zip`: Sample LaTeX project
- `large-file.pdf`: File > 50MB
- `invalid-file.exe`: Blocked file type
- `empty.zip`: Empty archive

## Troubleshooting

### Common Issues

**Issue**: "File type not allowed"
- **Solution**: Check file extension against blocked list
- **Fix**: Update `BLOCKED_EXTENSIONS` in UploadManager

**Issue**: "Rate limit exceeded"
- **Solution**: Wait before retrying
- **Fix**: Adjust rate limits in upload middleware

**Issue**: "Zip extraction failed"
- **Solution**: Check zip file integrity
- **Fix**: Ensure zip is not corrupted or password-protected

**Issue**: "Upload hangs"
- **Solution**: Check file size and network
- **Fix**: Implement timeout handling

## Contributing

When contributing to upload functionality:
1. Test with various file types and sizes
2. Check security implications
3. Update documentation
4. Add tests for new features
5. Follow existing code patterns

## License

Same as HeyTeX main project (AGPL-3.0)
