# Troubleshooting Guide

## Build Issues

### Error: "Cannot resolve symbol 'FullAccessUtils'"
**Problem:** FullAccessUtils.kt not found

**Solution:**
1. Check file location: `app/src/main/java/com/nipuna/cyberai/FullAccessUtils.kt`
2. Right-click project → Invalidate Caches
3. Clean → Rebuild

### Error: "Unresolved reference" in MainActivity
**Problem:** Missing imports or class not recognized

**Solution:**
1. Add imports at top of MainActivity:
   ```kotlin
   import com.nipuna.cyberai.FullAccessUtils
   import android.os.Build
   ```
2. Rebuild project
3. Check spelling of class names

### Error: "Multiple errors in MainActivity"
**Problem:** Inner classes not added properly

**Solution:**
1. Check you copied BOTH StorageAccess and TermuxAccess classes
2. Make sure they're INSIDE MainActivity class (before last `}`)
3. Check method is public
4. Rebuild

### Error: "Gradle build failed"
**Problem:** General build error

**Solution:**
1. Clean: Build → Clean Project
2. Wait for completion
3. Rebuild: Build → Rebuild Project
4. If still fails, check logcat for specific error

---

## Runtime Issues

### App Crashes on Startup
**Problem:** Crash when app starts

**Solution:**
1. Check AndroidManifest.xml has all permissions
2. Check MainActivity.kt imports are correct
3. Check no syntax errors in added code
4. Look at logcat for error message
5. Try removing onRequestPermissionsResult if added incorrectly

### Permissions Not Working
**Problem:** Permission dialog doesn't appear

**Solution:**
1. Check AndroidManifest.xml has permissions:
   ```xml
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" />
   ```
2. Build → Clean + Rebuild
3. Uninstall app completely
4. Reinstall and run

### "Cannot find permission dialog"
**Problem:** Dialog doesn't appear, just grant permissions

**Solution:**
1. Go to: Settings → Apps → [YourApp] → Permissions
2. Manually grant: Files and media
3. Or reinstall app

---

## API Issues

### StorageAPI returns empty strings
**Problem:** `StorageAPI.readFile()` returns `''`

**Possible causes:**
1. ✗ Storage permissions not granted
   - Fix: `$ access request` in terminal, grant permissions

2. ✗ File doesn't exist
   - Fix: Check path with `$ storage info /path`

3. ✗ JavaScript not added to index.html
   - Fix: Check FULL-ACCESS-API.js is in index.html before `</script>`

4. ✗ Token not set
   - Fix: Window.__tk should be set automatically, check console

### StorageAPI returns false (operation failed)
**Problem:** `StorageAPI.writeFile()` returns `false`

**Possible causes:**
1. ✗ Permissions not granted
   - Fix: Grant storage permissions

2. ✗ Path doesn't exist
   - Fix: Create parent directory first: `StorageAPI.createDirectory(path)`

3. ✗ Storage is read-only
   - Fix: Try different location

4. ✗ Disk full
   - Fix: Free up space

### TermuxAPI returns empty
**Problem:** `TermuxAPI.getPackages()` returns `[]`

**Possible causes:**
1. ✓ Normal if Termux not installed
   - Fix: Install Termux first

2. ✗ Termux not accessible
   - Fix: Check `$ termux info` in terminal

3. ✗ JavaScript not loaded
   - Fix: Check console for: `✓ Full Access APIs loaded`

### terminal commands not recognized
**Problem:** `$ storage list /sdcard` not working

**Possible causes:**
1. ✗ Terminal-Commands.js not added
   - Fix: Add JAVASCRIPT/Terminal-Commands.js to index.html

2. ✗ Need to integrate command handler
   - Fix: Make sure handleFullAccessCommand() is called from terminal

3. ✗ Different terminal implementation
   - Fix: Check how your terminal handles commands

---

## JavaScript Issues

### "Storage is not defined"
**Problem:** Console error about Storage

**Solution:**
1. Check JavaScript is added to index.html
2. Check before `</script>` tag
3. Rebuild and reload app

### "window.__tk is undefined"
**Problem:** Token not set

**Solution:**
1. This should be set automatically in onPageFinished
2. Check MainActivity.kt has proper implementation
3. Try refreshing page

### "JSON.parse error"
**Problem:** Error parsing JSON response

**Solution:**
1. Check response is valid JSON
2. Add error handling:
   ```javascript
   try {
     const obj = JSON.parse(json);
   } catch (e) {
     console.log('Parse error:', e);
   }
   ```

---

## Permission Issues

### "Permission denied" in logcat
**Problem:** App trying to access restricted path

**Solution:**
1. Check permissions in AndroidManifest.xml
2. Grant permissions in app
3. Some paths need root access

### Cannot access `/system`
**Problem:** System files not accessible

**Solution:**
1. Use root shell instead:
   ```bash
   $ start root
   ```
2. Not all paths accessible from Java

### Cannot write to `/data/data/other.app`
**Problem:** Other app's private data protected

**Solution:**
1. Android protects other apps' data
2. Only access your own data
3. Use root if absolutely needed

---

## File Operation Issues

### File read returns wrong content
**Problem:** File contents corrupted or wrong

**Solution:**
1. Check file exists: `$ storage info /path`
2. Check file encoding (UTF-8 assumed)
3. For binary files, use different method

### Search returns too many results
**Problem:** `storage search` taking too long

**Solution:**
1. Use more specific pattern:
   ```bash
   $ storage search /sdcard ".*\.apk$"
   (instead of just ".*")
   ```
2. Search smaller directories
3. Pattern is regex, not wildcard

### Cannot delete directory
**Problem:** `storage deleteFile` returns false

**Solution:**
1. Use recursive flag:
   ```javascript
   StorageAPI.deleteFile(path, true);  // true = recursive
   ```
2. Check permissions
3. Check directory is not in use

---

## Termux Integration Issues

### "Termux not found" but Termux is installed
**Problem:** Termux available but not detected

**Solution:**
1. Check Termux path: `/data/data/com.termux`
2. If rooted, try:
   ```bash
   $ start root
   $ ls /data/data/com.termux/
   ```
3. Reinstall Termux

### Termux config shows all false
**Problem:** `termux config` shows no tools available

**Solution:**
1. May be correct if Termux is empty
2. Install packages: Open Termux app, run:
   ```bash
   apt update
   apt install gcc python3 git node
   ```
3. Check again with `$ termux config`

### Cannot read Termux files
**Problem:** `TermuxAPI.readFile()` returns empty

**Solution:**
1. Check file exists:
   ```bash
   $ storage info /data/data/com.termux/files/home/.bashrc
   ```
2. May need root access
3. Start root shell first

---

## Common Mistakes

### ❌ Mistake 1: Wrong imports
```kotlin
// WRONG
import com.nipuna.cyberai.StorageAccess  // This class is inside MainActivity!

// RIGHT
// Just import FullAccessUtils
import com.nipuna.cyberai.FullAccessUtils
```

### ❌ Mistake 2: Inner classes in wrong place
```kotlin
// WRONG - Outside MainActivity
class StorageAccess { ... }

// RIGHT - Inside MainActivity class
class MainActivity : AppCompatActivity() {
    inner class StorageAccess { ... }
    inner class TermuxAccess { ... }
}
```

### ❌ Mistake 3: Wrong permissions block
```xml
<!-- WRONG -->
<uses-permission android:name="STORAGE" />

<!-- RIGHT -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

### ❌ Mistake 4: JavaScript in wrong place
```html
<!-- WRONG -->
<script src="config.js"></script>
<script>
  // Full Access API code
</script>

<!-- RIGHT -->
<script src="config.js"></script>
<script>
  // Original script code
  // Full Access API code here
</script>
```

### ❌ Mistake 5: Not rebuilding project
```
Clean → Clean project completely
Rebuild → Rebuild from scratch
Don't just: Build (may use cache)
```

---

## Performance Issues

### App freezing when accessing storage
**Problem:** UI blocks during file operations

**Solution:**
1. Use threads for large operations:
   ```kotlin
   Thread {
       val content = StorageAPI.readFile(path)
   }.start()
   ```
2. Avoid searching huge directories
3. Limit search patterns

### Search is very slow
**Problem:** `storage search` takes too long

**Solution:**
1. Search smaller area:
   ```bash
   $ storage search /sdcard/Download ".*\.apk$"
   (instead of /sdcard)
   ```
2. Use more specific pattern
3. Avoid searching system directories

---

## Debugging

### Enable logcat
```
Android Studio → View → Tool Windows → Logcat
```

### Check what's happening
```javascript
console.log('Debug:', StorageAPI);
console.log('Paths:', StorageAPI.getStoragePaths());
```

### Test in terminal first
```bash
$ access info        # Check status
$ storage paths      # List paths
$ storage list /path # Try operations
```

### Check manifest
```bash
grep -i "permission" AndroidManifest.xml
(Should see all 6 permissions)
```

---

## Getting Help

1. **Read this file completely** - Most answers here
2. **Check API-REFERENCE.md** - Function details
3. **Check TERMINAL-COMMANDS.md** - Command syntax
4. **Check logcat** - Error messages
5. **Try simpler operations first** - Start with `access info`

---

## Quick Checklist

Before debugging, verify:

- [ ] FullAccessUtils.kt in correct folder
- [ ] Imports added to MainActivity
- [ ] Both inner classes added
- [ ] onRequestPermissionsResult() added
- [ ] JavaScript added to index.html
- [ ] AndroidManifest.xml has permissions
- [ ] Project cleaned and rebuilt
- [ ] App reinstalled
- [ ] Permissions granted
- [ ] No syntax errors

---

## Still Need Help?

1. Check error message in logcat carefully
2. Search this file for that error
3. Try a simpler operation first
4. Check all files are copied correctly
5. Verify folder structure

