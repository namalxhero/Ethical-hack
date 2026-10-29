// Add these to MainActivity.kt

// ===== AT TOP - IMPORTS =====
import com.nipuna.cyberai.FullAccessUtils
import android.os.Build

// ===== IN onCreate() - ADD AFTER web.addJavascriptInterface(Shell(), "Android") =====

override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // ... existing code ...
    
    web.addJavascriptInterface(Shell(), "Android")
    web.addJavascriptInterface(StorageAccess(), "Storage")  // NEW
    web.addJavascriptInterface(TermuxAccess(), "TermuxAPI")  // NEW
    
    // ... rest of code ...
    
    // Request permissions immediately
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        FullAccessUtils.requestAllPermissions(this)
    }
}

// ===== ADD THESE NEW INNER CLASSES TO MainActivity =====

/**
 * Full Storage Access Interface
 */
inner class StorageAccess {
    private fun ok(tk: String) = tk == token
    
    @JavascriptInterface
    fun requestPermissions(tk: String) {
        if (!ok(tk)) return
        FullAccessUtils.requestAllPermissions(this@MainActivity)
    }
    
    @JavascriptInterface
    fun hasPermissions(tk: String): Boolean {
        if (!ok(tk)) return false
        return FullAccessUtils.hasAllPermissions(this@MainActivity)
    }
    
    @JavascriptInterface
    fun readFile(tk: String, path: String): String {
        if (!ok(tk)) return ""
        return FullAccessUtils.readFile(path) ?: ""
    }
    
    @JavascriptInterface
    fun writeFile(tk: String, path: String, content: String): Boolean {
        if (!ok(tk)) return false
        return FullAccessUtils.writeFile(path, content).also {
            if (it) emit("✅ File written: $path")
            else emit("❌ Failed to write: $path", true)
        }
    }
    
    @JavascriptInterface
    fun deleteFile(tk: String, path: String, recursive: Boolean = false): Boolean {
        if (!ok(tk)) return false
        return FullAccessUtils.deleteFile(path, recursive).also {
            if (it) emit("✅ Deleted: $path")
            else emit("❌ Failed to delete: $path", true)
        }
    }
    
    @JavascriptInterface
    fun listDirectory(tk: String, path: String): String {
        if (!ok(tk)) return ""
        val files = FullAccessUtils.listDirectory(path)
        return files.joinToString("\n") { it.name }
    }
    
    @JavascriptInterface
    fun createDirectory(tk: String, path: String): Boolean {
        if (!ok(tk)) return false
        return FullAccessUtils.createDirectory(path).also {
            if (it) emit("✅ Directory created: $path")
            else emit("❌ Failed to create: $path", true)
        }
    }
    
    @JavascriptInterface
    fun copyFile(tk: String, source: String, dest: String): Boolean {
        if (!ok(tk)) return false
        return FullAccessUtils.copyFile(source, dest).also {
            if (it) emit("✅ Copied: $source → $dest")
            else emit("❌ Failed to copy", true)
        }
    }
    
    @JavascriptInterface
    fun getFileInfo(tk: String, path: String): String {
        if (!ok(tk)) return ""
        val info = FullAccessUtils.getFileInfo(path)
        return org.json.JSONObject(info).toString()
    }
    
    @JavascriptInterface
    fun searchFiles(tk: String, startPath: String, pattern: String): String {
        if (!ok(tk)) return ""
        val files = FullAccessUtils.searchFiles(startPath, pattern)
        val results = files.map { it.absolutePath }
        return org.json.JSONArray(results).toString()
    }
    
    @JavascriptInterface
    fun getDirectorySize(tk: String, path: String): String {
        if (!ok(tk)) return ""
        val size = FullAccessUtils.getDirectorySize(path)
        return FullAccessUtils.formatSize(size)
    }
    
    @JavascriptInterface
    fun getAllStoragePaths(tk: String): String {
        if (!ok(tk)) return ""
        val paths = FullAccessUtils.getAllStoragePaths(this@MainActivity)
        return org.json.JSONArray(paths).toString()
    }
    
    @JavascriptInterface
    fun getStoragePaths(tk: String): String {
        if (!ok(tk)) return ""
        return org.json.JSONObject().apply {
            put("sdcard", FullAccessUtils.StoragePaths.SDCARD)
            put("documents", FullAccessUtils.StoragePaths.DOCUMENTS)
            put("downloads", FullAccessUtils.StoragePaths.DOWNLOADS)
            put("pictures", FullAccessUtils.StoragePaths.PICTURES)
            put("music", FullAccessUtils.StoragePaths.MUSIC)
            put("movies", FullAccessUtils.StoragePaths.MOVIES)
            put("dcim", FullAccessUtils.StoragePaths.DCIM)
        }.toString()
    }
}

/**
 * Full Termux Access Interface
 */
inner class TermuxAccess {
    private fun ok(tk: String) = tk == token
    
    @JavascriptInterface
    fun isTermuxAvailable(tk: String): Boolean {
        if (!ok(tk)) return false
        return FullAccessUtils.isTermuxAvailable().also {
            emit(if (it) "✅ Termux available" else "❌ Termux not found", !it)
        }
    }
    
    @JavascriptInterface
    fun getTermuxInfo(tk: String): String {
        if (!ok(tk)) return ""
        val info = FullAccessUtils.getTermuxInfo()
        return org.json.JSONObject(info).toString()
    }
    
    @JavascriptInterface
    fun getTermuxPaths(tk: String): String {
        if (!ok(tk)) return ""
        return org.json.JSONObject().apply {
            put("root", FullAccessUtils.TermuxPaths.ROOT)
            put("home", FullAccessUtils.TermuxPaths.HOME)
            put("bin", FullAccessUtils.TermuxPaths.BIN)
            put("usr", FullAccessUtils.TermuxPaths.USR)
            put("lib", FullAccessUtils.TermuxPaths.LIB)
            put("lib64", FullAccessUtils.TermuxPaths.LIB64)
            put("include", FullAccessUtils.TermuxPaths.INCLUDE)
            put("etc", FullAccessUtils.TermuxPaths.ETC)
            put("tmp", FullAccessUtils.TermuxPaths.TMP)
            put("databases", FullAccessUtils.TermuxPaths.DATABASES)
            put("shared_prefs", FullAccessUtils.TermuxPaths.SHARED_PREFS)
            put("cache", FullAccessUtils.TermuxPaths.CACHE)
        }.toString()
    }
    
    @JavascriptInterface
    fun getTermuxPackages(tk: String): String {
        if (!ok(tk)) return ""
        val packages = FullAccessUtils.getTermuxPackages()
        return org.json.JSONArray(packages).toString().also {
            emit("📦 Found ${packages.size} packages")
        }
    }
    
    @JavascriptInterface
    fun getTermuxConfig(tk: String): String {
        if (!ok(tk)) return ""
        val config = FullAccessUtils.getTermuxConfig()
        return org.json.JSONObject(config).toString().also {
            emit("⚙️ Termux config loaded")
        }
    }
    
    @JavascriptInterface
    fun readTermuxFile(tk: String, path: String): String {
        if (!ok(tk)) return ""
        val content = FullAccessUtils.readFile(path)
        return content ?: ""
    }
    
    @JavascriptInterface
    fun listTermuxDirectory(tk: String, dir: String): String {
        if (!ok(tk)) return ""
        val files = FullAccessUtils.listDirectory(dir)
        return files.joinToString("\n") { "${it.name}${if (it.isDirectory) "/" else ""}" }
    }
    
    @JavascriptInterface
    fun getTermuxDatabaseList(tk: String): String {
        if (!ok(tk)) return ""
        val dbDir = java.io.File(FullAccessUtils.TermuxPaths.DATABASES)
        if (!dbDir.exists()) {
            emit("❌ Databases directory not found", true)
            return ""
        }
        
        val databases = dbDir.listFiles()?.map { it.name } ?: emptyList()
        return org.json.JSONArray(databases).toString().also {
            emit("💾 Found ${databases.size} databases")
        }
    }
}

// ===== IN onRequestPermissionsResult() - ADD THIS =====

@Deprecated("Deprecated in Java")
override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<String>,
    grantResults: IntArray
) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    
    if (requestCode == FullAccessUtils.PERMISSION_REQUEST_CODE) {
        if (FullAccessUtils.hasAllPermissions(this)) {
            emit("✅ Full storage access granted", false)
        } else {
            emit("⚠️ Some permissions were denied", true)
        }
    }
}
