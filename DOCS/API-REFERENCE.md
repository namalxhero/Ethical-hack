# API Reference - Full Access

## Storage API

### StorageAPI.readFile(path)
Read file contents from any location

```javascript
const content = StorageAPI.readFile('/sdcard/file.txt');
// Returns: file contents as string
// Returns: empty string if file not found
```

### StorageAPI.writeFile(path, content)
Write content to file (creates if doesn't exist)

```javascript
const success = StorageAPI.writeFile('/sdcard/test.txt', 'Hello World');
// Returns: true if successful, false if failed
```

### StorageAPI.deleteFile(path, recursive=false)
Delete file or directory

```javascript
// Delete single file
StorageAPI.deleteFile('/sdcard/file.txt');

// Delete directory with contents
StorageAPI.deleteFile('/sdcard/folder', true);
// Returns: boolean
```

### StorageAPI.listDirectory(path)
List contents of directory

```javascript
const files = StorageAPI.listDirectory('/sdcard');
// Returns: array of filenames
// Example: ['file1.txt', 'file2.txt', 'folder/']
```

### StorageAPI.createDirectory(path)
Create directory

```javascript
const success = StorageAPI.createDirectory('/sdcard/newfolder');
// Returns: true if created, false if failed
```

### StorageAPI.copyFile(source, dest)
Copy file from source to destination

```javascript
const success = StorageAPI.copyFile('/sdcard/source.txt', '/sdcard/backup.txt');
// Returns: boolean
```

### StorageAPI.getFileInfo(path)
Get detailed file information

```javascript
const info = StorageAPI.getFileInfo('/sdcard/file.txt');
// Returns:
// {
//   exists: boolean,
//   isFile: boolean,
//   isDirectory: boolean,
//   size: number (bytes),
//   modified: number (timestamp),
//   readable: boolean,
//   writable: boolean,
//   executable: boolean,
//   absolutePath: string,
//   parentPath: string,
//   name: string
// }
```

### StorageAPI.searchFiles(startPath, pattern)
Search for files by regex pattern

```javascript
const files = StorageAPI.searchFiles('/sdcard', '.*\\.txt');
// Returns: array of matching file paths
// Pattern: regex string
// Example patterns:
//   '.*\\.apk'    → all APK files
//   '.*\\.jpg'    → all JPG files
//   'file.*'      → files starting with 'file'
```

### StorageAPI.getDirectorySize(path)
Get human-readable directory size

```javascript
const size = StorageAPI.getDirectorySize('/sdcard/DCIM');
// Returns: string like '512 MB' or '1.2 GB'
```

### StorageAPI.getAllStoragePaths()
Get all mounted storage paths

```javascript
const paths = StorageAPI.getAllStoragePaths();
// Returns: array of path strings
// Example: ['/storage/emulated/0', '/storage/...']
```

### StorageAPI.getStoragePaths()
Get standard storage paths

```javascript
const paths = StorageAPI.getStoragePaths();
// Returns:
// {
//   sdcard: '/storage/emulated/0',
//   documents: '/storage/emulated/0/Documents',
//   downloads: '/storage/emulated/0/Download',
//   pictures: '/storage/emulated/0/Pictures',
//   music: '/storage/emulated/0/Music',
//   movies: '/storage/emulated/0/Movies',
//   dcim: '/storage/emulated/0/DCIM'
// }
```

### StorageAPI.hasPermissions()
Check if storage permissions granted

```javascript
const hasAccess = StorageAPI.hasPermissions();
// Returns: boolean
```

### StorageAPI.requestPermissions()
Request storage permissions

```javascript
StorageAPI.requestPermissions();
// Shows permission dialog to user
```

---

## Termux API

### TermuxAPI.isAvailable()
Check if Termux installed

```javascript
const available = TermuxAPI.isAvailable();
// Returns: true if Termux installed, false otherwise
```

### TermuxAPI.getInfo()
Get Termux paths information

```javascript
const info = TermuxAPI.getInfo();
// Returns:
// {
//   termux_root: '/data/data/com.termux',
//   termux_home: '/data/data/com.termux/files/home',
//   termux_bin: '/data/data/com.termux/files/usr/bin',
//   termux_usr: '/data/data/com.termux/files/usr',
//   termux_lib: '/data/data/com.termux/files/usr/lib',
//   termux_etc: '/data/data/com.termux/files/usr/etc',
//   termux_databases: '/data/data/com.termux/databases',
//   termux_shared_prefs: '/data/data/com.termux/shared_prefs',
//   termux_cache: '/data/data/com.termux/cache'
// }
```

### TermuxAPI.getPaths()
Get all Termux directory paths

```javascript
const paths = TermuxAPI.getPaths();
// Returns:
// {
//   root, home, bin, usr, lib, lib64, include,
//   share, etc, tmp, opt, databases, shared_prefs, cache
// }
```

### TermuxAPI.getPackages()
Get list of installed packages

```javascript
const packages = TermuxAPI.getPackages();
// Returns: array of package names
// Example: ['bash', 'python3', 'gcc', 'git', ...]
```

### TermuxAPI.getConfig()
Get Termux tool availability

```javascript
const config = TermuxAPI.getConfig();
// Returns:
// {
//   bash_available: boolean,
//   zsh_available: boolean,
//   python3_available: boolean,
//   node_available: boolean,
//   gcc_available: boolean,
//   git_available: boolean,
//   env_file_exists: boolean,
//   error: string (if any)
// }
```

### TermuxAPI.readFile(path)
Read file from Termux

```javascript
const content = TermuxAPI.readFile('/data/data/com.termux/files/home/.bashrc');
// Returns: file contents as string
```

### TermuxAPI.listDirectory(dir)
List Termux directory contents

```javascript
const files = TermuxAPI.listDirectory('/data/data/com.termux/files/usr/bin');
// Returns: array of file/folder names
// Files show as 'filename', directories as 'dirname/'
```

### TermuxAPI.getDatabaseList()
Get list of Termux databases

```javascript
const databases = TermuxAPI.getDatabaseList();
// Returns: array of database file names
// Example: ['app.db', 'config.sqlite', ...]
```

---

## Usage Examples

### Example 1: Read File
```javascript
const content = StorageAPI.readFile('/sdcard/data.txt');
console.log(content);
```

### Example 2: Write File
```javascript
const success = StorageAPI.writeFile('/sdcard/output.txt', 'Hello World');
if (success) {
  console.log('File written');
}
```

### Example 3: List Directory
```javascript
const files = StorageAPI.listDirectory('/sdcard/Download');
files.forEach(file => console.log(file));
```

### Example 4: Search Files
```javascript
const results = StorageAPI.searchFiles('/sdcard', '.*\\.apk$');
console.log(`Found ${results.length} APK files`);
```

### Example 5: Check Termux
```javascript
if (TermuxAPI.isAvailable()) {
  const packages = TermuxAPI.getPackages();
  console.log(`Termux has ${packages.length} packages`);
}
```

### Example 6: Get File Info
```javascript
const info = StorageAPI.getFileInfo('/sdcard/file.txt');
console.log(`File size: ${info.size} bytes`);
console.log(`Writable: ${info.writable}`);
```

### Example 7: Check Tools
```javascript
const config = TermuxAPI.getConfig();
if (config.gcc_available) {
  console.log('GCC compiler available');
}
if (config.python3_available) {
  console.log('Python 3 available');
}
```

---

## Error Handling

All APIs return safe defaults on error:

```javascript
// If error:
StorageAPI.readFile(path)        // → returns ''
StorageAPI.writeFile(path, cont) // → returns false
StorageAPI.listDirectory(path)   // → returns []
TermuxAPI.isAvailable()          // → returns false
TermuxAPI.getPackages()          // → returns []
```

No exceptions thrown - always check return values!

---

## Permission Requirements

```
For StorageAPI:
  → READ_EXTERNAL_STORAGE (Android < 11)
  → WRITE_EXTERNAL_STORAGE (Android < 11)
  → MANAGE_EXTERNAL_STORAGE (Android 11+)

For TermuxAPI:
  → No special permissions (already accessible)
```

---

## Return Value Summary

| Function | Returns |
|----------|---------|
| readFile | string |
| writeFile | boolean |
| deleteFile | boolean |
| listDirectory | array |
| createDirectory | boolean |
| copyFile | boolean |
| getFileInfo | object |
| searchFiles | array |
| getDirectorySize | string |
| getAllStoragePaths | array |
| getStoragePaths | object |
| hasPermissions | boolean |
| isAvailable | boolean |
| getInfo | object |
| getPaths | object |
| getPackages | array |
| getConfig | object |
| readFile (Termux) | string |
| listDirectory (Termux) | array |
| getDatabaseList | array |

