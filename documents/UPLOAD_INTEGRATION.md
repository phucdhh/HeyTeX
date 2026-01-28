# Integration Guide: UploadModal in EditorPage

## Quick Integration

Add the following to `client/src/pages/EditorPage.tsx`:

### 1. Import UploadModal
```typescript
import { UploadModal } from '../components/UploadModal';
```

### 2. Add State
```typescript
const [showUploadModal, setShowUploadModal] = useState(false);
```

### 3. Replace handleUpload Function
Replace the existing `handleUpload` function with:

```typescript
const handleUpload = () => {
    setShowUploadModal(true);
};
```

### 4. Remove Old Upload Logic
Remove or comment out the old `handleFileInputChange` function and hidden file input.

### 5. Add UploadModal Component
Add before the closing `</div>` of the main component:

```typescript
{showUploadModal && currentProject && (
    <UploadModal
        projectId={currentProject.id}
        targetPath="/"
        onClose={() => setShowUploadModal(false)}
        onSuccess={async () => {
            // Reload files after upload
            const { project } = await api.getProject(currentProject.id);
            setFiles(project.files || []);
        }}
    />
)}
```

## Full Example

```typescript
export function EditorPage() {
    // ... existing code ...
    
    const [showUploadModal, setShowUploadModal] = useState(false);
    
    // Replace old upload handler
    const handleUpload = () => {
        setShowUploadModal(true);
    };
    
    // ... existing code ...
    
    return (
        <div className="editor-page">
            {/* ... existing JSX ... */}
            
            {/* Add before closing div */}
            {showUploadModal && currentProject && (
                <UploadModal
                    projectId={currentProject.id}
                    targetPath="/"
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={async () => {
                        const { project } = await api.getProject(currentProject.id);
                        setFiles(project.files || []);
                    }}
                />
            )}
        </div>
    );
}
```

## Testing the Integration

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the frontend dev server:**
   ```bash
   cd client
   npm run dev
   ```

3. **Test upload features:**
   - Click the Upload button in the editor
   - Try dragging files into the drop zone
   - Try uploading a zip file
   - Test multiple file upload
   - Verify file conflict detection

## Troubleshooting

### UploadModal not showing
- Check if `showUploadModal` state is set to `true`
- Verify `currentProject` is not null
- Check browser console for errors

### Upload fails
- Verify backend server is running
- Check API endpoint `/api/upload/files` is accessible
- Verify authentication token is valid
- Check file size limits

### Files don't appear after upload
- Ensure `onSuccess` callback reloads files
- Check if files are saved to database
- Verify file permissions

## Advanced Configuration

### Custom Target Path
```typescript
<UploadModal
    projectId={currentProject.id}
    targetPath="/images"  // Upload to specific folder
    onClose={() => setShowUploadModal(false)}
    onSuccess={async () => {
        // Custom success handler
    }}
/>
```

### With Folder Selection
```typescript
const [selectedFolder, setSelectedFolder] = useState('/');

<UploadModal
    projectId={currentProject.id}
    targetPath={selectedFolder}
    onClose={() => setShowUploadModal(false)}
    onSuccess={async () => {
        // Reload and expand selected folder
        await loadFiles();
        setExpandedFolders(prev => new Set([...prev, selectedFolder]));
    }}
/>
```

## Next Steps

1. Test the upload functionality thoroughly
2. Add keyboard shortcuts (e.g., Ctrl+U for upload)
3. Implement upload progress in the status bar
4. Add upload history/activity log
5. Implement file preview before upload
