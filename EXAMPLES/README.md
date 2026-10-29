# Examples - Working Code

## Using These Examples

All examples are ready to use. Copy the function you want and run it in terminal:

```bash
$ js functionName()
```

---

## Example 1: File Operations

**File:** `Example-File-Operations.js`

Working examples of reading, writing, listing, and searching files.

### Functions:
- `readMyFile()` - Read file contents
- `writeMyFile()` - Write file
- `listMyFiles()` - List directory
- `searchMyFiles()` - Search by pattern
- `getMyFileInfo()` - Get file information
- `copyMyFile()` - Copy file
- `getMyDirectorySize()` - Get directory size
- `createMyDirectory()` - Create directory
- `deleteMyFile()` - Delete file
- `batchOperations()` - Multiple operations
- `safeFileOperations()` - Safe with error checking
- `showAllPaths()` - Show all storage paths

### Usage:
```bash
$ js readMyFile()
$ js writeMyFile()
$ js searchMyFiles()
```

---

## Example 2: Termux Integration

**File:** `Example-Termux-Integration.js`

Working examples for Termux operations.

### Functions:
- `checkTermux()` - Check if Termux installed
- `getTermuxInfo()` - Get Termux information
- `getTermuxPaths()` - Get Termux paths
- `getTermuxPackages()` - List packages
- `checkTermuxTools()` - Check available tools
- `readTermuxBashrc()` - Read .bashrc file
- `listTermuxBinaries()` - List binaries
- `getTermuxDatabases()` - List databases
- `comprehensiveTermuxCheck()` - Full check
- `compareTermuxAndStorage()` - Compare systems
- `setupWorkEnvironment()` - Setup workspace
- `quickStatus()` - Quick status check

### Usage:
```bash
$ js checkTermux()
$ js checkTermuxTools()
$ js comprehensiveTermuxCheck()
```

---

## How to Use

### 1. Copy Function
Copy the function from the example file.

### 2. Add to index.html (Optional)
Or just run directly in terminal:
```bash
$ js functionName()
```

### 3. Customize
Modify paths, patterns, or logic as needed.

### 4. Test
Run it and check output.

---

## Quick Start Examples

### List all your files
```bash
$ js listMyFiles()
```

### Search for APK files
Edit `searchMyFiles()` to use pattern `.*\.apk`

### Check Termux tools
```bash
$ js checkTermuxTools()
```

### Get full status
```bash
$ js quickStatus()
```

---

## Tips

1. **Edit before using** - Change paths to your actual paths
2. **Test simple first** - Try `readMyFile()` before complex operations
3. **Check permissions** - Run `$ access info` first
4. **Use patterns** - For search, use regex: `.*\.txt`, `.*\.apk`, etc
5. **Error handling** - Look at `safeFileOperations()` for best practices

---

## Common Tasks

### Find all JPG files
```javascript
// Modify searchMyFiles():
const pattern = '.*\\.jpg';
const results = StorageAPI.searchFiles('/sdcard', pattern);
```

### Check if Python available
```javascript
// Use checkTermuxTools() or:
const config = TermuxAPI.getConfig();
if (config.python3_available) {
    tp('✅ Python 3 available');
}
```

### Backup important files
```javascript
// Use copyMyFile() to backup:
StorageAPI.copyFile(
    '/sdcard/important.txt',
    '/sdcard/backup.txt'
);
```

### Get all Termux packages
```javascript
// Use getTermuxPackages():
const packages = TermuxAPI.getPackages();
packages.forEach(pkg => tp(pkg));
```

---

## Error Handling

All functions handle errors gracefully:
- Check return values (true/false)
- Check if results exist before using
- Use `safeFileOperations()` as template
- Look for `❌` symbols in output

---

## More Examples Needed?

1. Check `DOCS/API-REFERENCE.md` - All functions available
2. Check `DOCS/TERMINAL-COMMANDS.md` - All commands
3. Check `COMPLETE-GUIDE.md` - Usage patterns

---

## Contributing Examples

If you create useful examples:
1. Follow the naming: `Example-[Category].js`
2. Add comments explaining each function
3. Include "HOW TO USE" section
4. Keep functions simple and focused

---

