# Complete Guide - Full Storage & Termux Access

## 📖 Table of Contents

1. [Overview](#overview)
2. [What You Get](#what-you-get)
3. [Installation Steps](#installation-steps)
4. [APIs](#apis)
5. [Terminal Commands](#terminal-commands)
6. [Examples](#examples)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## Overview

This package provides complete device storage access and Termux integration for your Cyber AI Android app.

**Time to setup:** 30 minutes  
**Difficulty:** Easy (copy-paste)  
**Requirements:** Android device with permission system

---

## What You Get

### Storage Access ✅
- Read files from `/sdcard` and all storage
- Write files to storage
- Delete files/directories
- List directory contents
- Search files by pattern
- Get file information
- Copy files
- Get directory sizes

### Termux Integration ✅
- Check if Termux installed
- Get Termux paths
- List installed packages
- Check tool availability
- Read Termux configuration
- Access Termux databases
- Direct Termux folder access

### Terminal Commands ✅
Easy to use commands in terminal:
```
$ storage info /sdcard/file.txt
$ storage read /sdcard/file.txt
$ storage list /sdcard
$ storage size /sdcard
$ storage search /sdcard "pattern"
$ termux config
$ termux packages
$ access info
```

### JavaScript APIs ✅
Browser-side APIs for programmatic access:
```javascript
StorageAPI.readFile(path)
StorageAPI.writeFile(path, content)
TermuxAPI.getPackages()
TermuxAPI.getConfig()
```

---

## Installation Steps

### Step 1: Update AndroidManifest.xml

**File:** `AndroidManifest.xml`

Add permissions (copy from: `KOTLIN/AndroidManifest.xml`):

```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" />
<uses-permission android:name="com.termux.permission.RUN_COMMAND" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_SUPERUSER" />
```

### Step 2: Add FullAccessUtils.kt

**File:** `app/src/main/java/com/nipuna/cyberai/FullAccessUtils.kt`

Create new file (copy from: `KOTLIN/FullAccessUtils.kt`)

This is the core library providing all file operations.

### Step 3: Update MainActivity.kt

**3A - Add imports:**
```kotlin
import com.nipuna.cyberai.FullAccessUtils
import android.os.Build
```

**3B - Update onCreate() method:**
After `web.addJavascriptInterface(Shell(), "Android")` add:
```kotlin
web.addJavascriptInterface(StorageAccess(), "Storage")
web.addJavascriptInterface(TermuxAccess(), "TermuxAPI")

if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
    FullAccessUtils.requestAllPermissions(this)
}
```

**3C - Add inner classes:**
At end of MainActivity class, before last `}`, add (from: `KOTLIN/MainActivity-Integration.kt`):
- StorageAccess class (with @JavascriptInterface methods)
- TermuxAccess class (with @JavascriptInterface methods)

**3D - Add permission handler:**
Also from integration file, add:
```kotlin
override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<String>,
    grantResults: IntArray
) { ... }
```

### Step 4: Add JavaScript to index.html

**File:** `app/src/main/assets/index.html`

Before `</script>` tag, add (copy both files):
- Content of: `JAVASCRIPT/FULL-ACCESS-API.js`
- Content of: `JAVASCRIPT/Terminal-Commands.js`

### Step 5: Build & Test

```
1. Android Studio → Build → Clean Project
2. Android Studio → Build → Rebuild Project
3. Run app on device
4. Grant storage permissions (dialog)
5. In terminal: $ access info
6. Should show: ✅ Storage: Full Access
```

---

## APIs

### StorageAPI

```javascript
// Read file
const content = StorageAPI.readFile('/sdcard/file.txt');

// Write file
StorageAPI.writeFile('/sdcard/out.txt', 'content');

// Delete file
StorageAPI.deleteFile('/sdcard/file.txt');

// List directory
const files = StorageAPI.listDirectory('/sdcard');

// Get file info
const info = StorageAPI.getFileInfo('/sdcard/file.txt');

// Search files
const results = StorageAPI.searchFiles('/sdcard', '.*\.txt');

// Get directory size
const size = StorageAPI.getDirectorySize('/sdcard');

// Get all paths
const paths = StorageAPI.getStoragePaths();

// Request permissions
StorageAPI.requestPermissions();

// Check permissions
const hasAccess = StorageAPI.hasPermissions();
```

**Full reference:** See `DOCS/API-REFERENCE.md`

### TermuxAPI

```javascript
// Check if available
const available = TermuxAPI.isAvailable();

// Get info
const info = TermuxAPI.getInfo();

// Get paths
const paths = TermuxAPI.getPaths();

// Get packages
const packages = TermuxAPI.getPackages();

// Get config
const config = TermuxAPI.getConfig();

// Read file
const content = TermuxAPI.readFile('/data/data/com.termux/files/home/.bashrc');

// List directory
const files = TermuxAPI.listDirectory('/data/data/com.termux/files/usr/bin');

// Get databases
const dbs = TermuxAPI.getDatabaseList();
```

**Full reference:** See `DOCS/API-REFERENCE.md`

---

## Terminal Commands

### Storage Commands

```bash
# File info
$ storage info /sdcard/file.txt

# Read file
$ storage read /sdcard/file.txt

# List directory
$ storage list /sdcard

# Directory size
$ storage size /sdcard/DCIM

# Search files
$ storage search /sdcard ".*\.txt"

# Show paths
$ storage paths
```

### Termux Commands

```bash
# Info
$ termux info

# Paths
$ termux paths

# Config
$ termux config

# Packages
$ termux packages

# Databases
$ termux databases
```

### Access Commands

```bash
# Check status
$ access info

# Request permissions
$ access request
```

**Full reference:** See `DOCS/TERMINAL-COMMANDS.md`

---

## Examples

### Example 1: Read Storage File

```javascript
const content = StorageAPI.readFile('/sdcard/data.txt');
if (content) {
    console.log(content);
} else {
    console.log('File not found or no permission');
}
```

### Example 2: Write File

```javascript
const success = StorageAPI.writeFile(
    '/sdcard/output.txt',
    'Hello World\n' + new Date()
);
if (success) {
    tp('✅ File written');
} else {
    tp('❌ Failed to write file', 'e');
}
```

### Example 3: List Files

```javascript
const files = StorageAPI.listDirectory('/sdcard/Download');
tp('📂 Files (' + files.length + '):');
files.forEach(f => tp('  ' + f));
```

### Example 4: Search Files

```javascript
const apkFiles = StorageAPI.searchFiles('/sdcard', '.*\.apk$');
tp('Found ' + apkFiles.length + ' APK files');
apkFiles.slice(0, 10).forEach(f => tp('  ' + f));
```

### Example 5: Check Termux

```javascript
if (TermuxAPI.isAvailable()) {
    const config = TermuxAPI.getConfig();
    
    if (config.gcc_available) {
        tp('✅ GCC compiler available');
    }
    if (config.python3_available) {
        tp('✅ Python 3 available');
    }
    if (config.node_available) {
        tp('✅ Node.js available');
    }
} else {
    tp('❌ Termux not installed');
}
```

### Example 6: Get Termux Packages

```javascript
const packages = TermuxAPI.getPackages();
tp('📦 Total packages: ' + packages.length);
tp('Top 10:');
packages.slice(0, 10).forEach(p => tp('  - ' + p));
```

### Example 7: File Info

```javascript
const info = StorageAPI.getFileInfo('/sdcard/file.txt');

tp('File: ' + info.name);
tp('Size: ' + info.size + ' bytes');
tp('Readable: ' + info.readable);
tp('Writable: ' + info.writable);
tp('Modified: ' + new Date(info.modified));
```

**More examples:** See `DOCS/` folder

---

## File Structure

```
FULL-ACCESS/
├── 00-INDEX.md              # Map of everything
├── START-HERE.txt           # Begin here!
├── QUICK-SETUP.txt          # 5 step integration
├── COMPLETE-GUIDE.md        # This file
│
├── KOTLIN/                  # Android code
│   ├── FullAccessUtils.kt   # Core library
│   ├── MainActivity-Integration.kt
│   └── AndroidManifest.xml
│
├── JAVASCRIPT/              # Browser APIs
│   ├── FULL-ACCESS-API.js   # API definitions
│   └── Terminal-Commands.js # Command handlers
│
├── EXAMPLES/                # Working code
│   ├── Example-Storage-Access.kt
│   ├── Example-Termux-Check.js
│   └── ...
│
└── DOCS/                    # Documentation
    ├── API-REFERENCE.md     # All functions
    ├── TERMINAL-COMMANDS.md # All commands
    ├── TROUBLESHOOTING.md   # Problem solving
    └── ARCHITECTURE.md      # How it works
```

---

## Accessing Different Paths

### Public Storage (No root needed)
```
✅ /sdcard
✅ /storage/emulated/0
✅ /sdcard/Download
✅ /sdcard/Documents
✅ /sdcard/Pictures
✅ /sdcard/Music
✅ /sdcard/Movies
✅ /sdcard/DCIM
```

### Termux (Always accessible)
```
✅ /data/data/com.termux/*
✅ /data/data/com.termux/files/home
✅ /data/data/com.termux/files/usr/bin
✅ /data/data/com.termux/databases
```

### System (Need root)
```
❌ /system
❌ /data (other apps)
→ Use root shell for these
```

---

## Security Notes

✅ **Safe:**
- Permission system built-in
- User grants access
- Token validation on all calls
- Cannot access other apps' private data

⚠️ **Remember:**
- Full storage access = can read/delete anything
- Termux access includes all configurations
- With root, can access system files

---

## Performance Tips

1. **Large file reads** - May take time, use threads
2. **Directory search** - Use specific patterns
3. **Many files** - Limit results shown
4. **Disk operations** - Don't block UI thread

```javascript
// Wrong - blocks UI
const files = StorageAPI.listDirectory('/sdcard');  // 10000 files

// Right - run in background
new Promise(() => {
    const files = StorageAPI.listDirectory('/sdcard');
    // process results
}).then(...);
```

---

## Updating Later

If you want to update:

1. Keep `FULL-ACCESS-SETUP-GUIDE.md` - Reference
2. Check `DOCS/` for latest features
3. Update `FullAccessUtils.kt` if new version
4. Rebuild project

---

## FAQ

**Q: How long does setup take?**  
A: 30 minutes (15 minutes integration, 15 minutes build/test)

**Q: Do I need root?**  
A: Recommended for best results. Basic storage works without.

**Q: What if Termux not installed?**  
A: APIs work anyway, just return empty values.

**Q: Can I use without permissions?**  
A: No, app will ask for storage permissions on first run.

**Q: Is this safe?**  
A: Yes, uses Android's built-in permission system.

**Q: Can I access other apps' data?**  
A: No, protected by Android. Only with root.

**Q: What about performance?**  
A: Good for normal files. Large searches may be slow.

**Q: How do I uninstall?**  
A: Just remove the 4 files you added, revert changes.

---

## Getting Help

1. **Setup issues?** → Read `QUICK-SETUP.txt`
2. **API questions?** → Read `DOCS/API-REFERENCE.md`
3. **Command help?** → Read `DOCS/TERMINAL-COMMANDS.md`
4. **Something broken?** → Read `DOCS/TROUBLESHOOTING.md`
5. **Need examples?** → Check `EXAMPLES/` folder

---

## Version Info

- **Full Access Version:** 2.0
- **Android Min SDK:** 24
- **Status:** ✅ Production Ready
- **Date:** 2026-10-28

---

## Summary

After setup, you have:

✅ Complete storage access  
✅ Termux integration  
✅ Terminal commands  
✅ JavaScript APIs  
✅ Permission system  
✅ Error handling  

**That's it! You're done.** 🎉

Next? Explore the APIs and commands, or read the examples.

