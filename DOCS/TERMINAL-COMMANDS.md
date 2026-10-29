# Terminal Commands Reference

## Storage Commands

### storage info PATH
Get detailed information about a file

```bash
$ storage info /sdcard/file.txt
📁 /sdcard/file.txt
  exists: true
  isFile: true
  isDirectory: false
  size: 1024
  modified: 1698816000000
  readable: true
  writable: true
  executable: false
  absolutePath: /sdcard/file.txt
  parentPath: /sdcard
  name: file.txt
```

### storage read PATH
Read and display file contents

```bash
$ storage read /sdcard/data.txt
📄 /sdcard/data.txt
[file contents displayed line by line]
```

### storage list PATH
List directory contents

```bash
$ storage list /sdcard/Download
📂 /sdcard/Download (5 items)
  file1.apk
  file2.zip
  folder/
  image.jpg
  document.pdf
```

### storage size PATH
Get directory size (human readable)

```bash
$ storage size /sdcard/DCIM
💾 /sdcard/DCIM: 512 MB
```

### storage search PATH PATTERN
Search for files by regex pattern

```bash
$ storage search /sdcard ".*\.txt"
🔍 Found 42 matches
  /sdcard/file1.txt
  /sdcard/file2.txt
  /sdcard/Documents/note.txt
  ... and 39 more
```

**Common patterns:**
- `.*\.apk` - All APK files
- `.*\.jpg` - All JPG files
- `.*\.pdf` - All PDF files
- `Download.*` - Files in Download folder
- `.*2024.*` - Files with 2024 in name

### storage paths
Show all standard storage paths

```bash
$ storage paths
📍 Storage Paths:
  sdcard: /storage/emulated/0
  documents: /storage/emulated/0/Documents
  downloads: /storage/emulated/0/Download
  pictures: /storage/emulated/0/Pictures
  music: /storage/emulated/0/Music
  movies: /storage/emulated/0/Movies
  dcim: /storage/emulated/0/DCIM
```

### storage all-paths
Show all available mount points

```bash
$ storage all-paths
📍 All Available Paths (3):
  /storage/emulated/0
  /storage/external-data
  /mnt/media_rw/...
```

---

## Termux Commands

### termux info
Show Termux installation information

```bash
$ termux info
ℹ️ Termux Info:
  termux_root: /data/data/com.termux
  termux_home: /data/data/com.termux/files/home
  termux_bin: /data/data/com.termux/files/usr/bin
  termux_usr: /data/data/com.termux/files/usr
  termux_lib: /data/data/com.termux/files/usr/lib
  termux_lib64: /data/data/com.termux/files/usr/lib64
  termux_include: /data/data/com.termux/files/usr/include
  termux_etc: /data/data/com.termux/files/usr/etc
  termux_tmp: /data/data/com.termux/files/usr/tmp
  termux_databases: /data/data/com.termux/databases
  termux_shared_prefs: /data/data/com.termux/shared_prefs
  termux_cache: /data/data/com.termux/cache
```

### termux paths
List all Termux directory paths

```bash
$ termux paths
📁 Termux Paths:
  root: /data/data/com.termux
  home: /data/data/com.termux/files/home
  bin: /data/data/com.termux/files/usr/bin
  usr: /data/data/com.termux/files/usr
  lib: /data/data/com.termux/files/usr/lib
  lib64: /data/data/com.termux/files/usr/lib64
  include: /data/data/com.termux/files/usr/include
  share: /data/data/com.termux/files/usr/share
  etc: /data/data/com.termux/files/usr/etc
  tmp: /data/data/com.termux/files/usr/tmp
  opt: /data/data/com.termux/files/opt
  databases: /data/data/com.termux/databases
  shared_prefs: /data/data/com.termux/shared_prefs
  cache: /data/data/com.termux/cache
```

### termux config
Check which tools are available

```bash
$ termux config
⚙️ Termux Configuration:
  ✅ bash_available: true
  ✅ python3_available: true
  ✅ node_available: true
  ✅ gcc_available: true
  ✅ git_available: true
  ✅ zsh_available: false
  ✅ env_file_exists: true
```

### termux packages
List all installed packages

```bash
$ termux packages
📦 Installed Packages (145):
  autoconf
  automake
  bash
  binutils
  bzip2
  ...
  ... and 136 more
```

### termux databases
List Termux databases

```bash
$ termux databases
💾 Termux Databases (3):
  app_preferences.db
  history.sqlite
  config.db
```

---

## Access Commands

### access info
Check current access status

```bash
$ access info
🔐 Access Status:
  Storage: ✅ Full Access
  Termux: ✅ Available
```

Output:
- `✅ Full Access` - Storage permissions granted
- `❌ No Access` - Need to request permissions
- `✅ Available` - Termux is installed
- `❌ Not Found` - Termux not installed

### access request
Request storage permissions

```bash
$ access request
📍 Requesting storage permissions...
[Permission dialog appears]
```

User must grant permissions to proceed.

---

## Help Commands

### help storage
Show storage command help

```bash
$ help storage
STORAGE COMMANDS:
  storage info PATH - File information
  storage read PATH - Read file contents
  storage list PATH - List directory
  storage size PATH - Directory size
  storage search PATH PATTERN - Search files
  storage paths - Show all storage paths
```

### help termux
Show Termux command help

```bash
$ help termux
TERMUX COMMANDS:
  termux info - Termux information
  termux paths - Termux directory paths
  termux config - Termux configuration
  termux packages - List installed packages
  termux databases - List databases
```

### help access
Show access command help

```bash
$ help access
ACCESS COMMANDS:
  help storage - Storage commands
  help termux - Termux commands
  access info - Show access status
  access request - Request permissions
```

---

## Common Usage Patterns

### Copy file from storage to Termux workspace
```bash
$ storage list /sdcard/Download
$ storage copy /sdcard/Download/data.json ~/workspace/data.json
```

### Check if specific tools are available
```bash
$ termux config
(Look for ✅ gcc_available, python3_available, etc)
```

### Find all APK files
```bash
$ storage search /sdcard ".*\.apk$"
```

### Read Termux configuration
```bash
$ termux paths
(Get home path)
$ storage read /data/data/com.termux/files/home/.bashrc
```

### Get storage statistics
```bash
$ storage size /sdcard
$ storage size /sdcard/DCIM
$ storage size /sdcard/Download
```

---

## Output Symbols

| Symbol | Meaning |
|--------|---------|
| 📁 | File/Directory info |
| 📂 | Directory listing |
| 📄 | File content |
| 💾 | Size/Storage |
| 🔍 | Search results |
| 📍 | Paths |
| ℹ️ | Information |
| ⚙️ | Configuration |
| 📦 | Packages |
| 🔐 | Access status |
| ✅ | Available/Success |
| ❌ | Not available/Error |

---

## Error Messages

```bash
$ storage read /sdcard/nonexistent.txt
❌ Cannot read file

$ storage list /sdcard/nonexistent/
❌ Directory not found or empty

$ termux info
❌ Termux not found

$ storage search /nonexistent ".*"
❌ Cannot read directory
```

---

## Tips & Tricks

1. **Use full paths** - Always use absolute paths
   ```bash
   $ storage info /sdcard/file.txt  ✅
   $ storage info sdcard/file.txt   ❌
   ```

2. **Patterns are regex** - Not wildcard
   ```bash
   $ storage search /sdcard ".*\.txt"      ✅
   $ storage search /sdcard "*.txt"        ❌
   ```

3. **Check access first**
   ```bash
   $ access info
   (before trying to access storage)
   ```

4. **Request permissions if needed**
   ```bash
   $ access request
   (then grant in dialog)
   ```

5. **Get paths info first**
   ```bash
   $ storage paths
   (before accessing locations)
   ```

---

## Keyboard Shortcuts

In terminal:
- `↑` / `↓` - Previous/next command
- `Ctrl+A` - Start of line
- `Ctrl+E` - End of line
- `Ctrl+C` - Cancel current command
- `Tab` - Auto-complete (if implemented)

---

