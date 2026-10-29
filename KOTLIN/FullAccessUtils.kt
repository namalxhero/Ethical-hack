package com.nipuna.cyberai

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Environment
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import java.io.File

/**
 * Full Storage & Termux Access Utility
 * Handles all file system and Termux integration
 */
object FullAccessUtils {
    
    const val PERMISSION_REQUEST_CODE = 42
    
    // ===== STORAGE PATHS =====
    object StoragePaths {
        val ROOT = "/"
        val SDCARD = Environment.getExternalStorageDirectory().absolutePath
        val DOCUMENTS = "${SDCARD}/Documents"
        val DOWNLOADS = "${SDCARD}/Download"
        val PICTURES = "${SDCARD}/Pictures"
        val MUSIC = "${SDCARD}/Music"
        val MOVIES = "${SDCARD}/Movies"
        val DCIM = "${SDCARD}/DCIM"
    }
    
    // ===== TERMUX PATHS =====
    object TermuxPaths {
        val ROOT = "/data/data/com.termux"
        val FILES = "$ROOT/files"
        val USR = "$FILES/usr"
        val BIN = "$USR/bin"
        val HOME = "$FILES/home"
        val LIB = "$USR/lib"
        val LIB64 = "$USR/lib64"
        val INCLUDE = "$USR/include"
        val SHARE = "$USR/share"
        val ETC = "$USR/etc"
        val TMP = "$USR/tmp"
        val OPT = "$FILES/opt"
        val DATABASES = "$ROOT/databases"
        val SHARED_PREFS = "$ROOT/shared_prefs"
        val CACHE = "$ROOT/cache"
    }
    
    // ===== ANDROID SYSTEM PATHS =====
    object SystemPaths {
        val ANDROID_SYSTEM = "/system"
        val ANDROID_DATA = "/data"
        val ANDROID_VENDOR = "/vendor"
        val ANDROID_PRODUCT = "/product"
        val PROC = "/proc"
        val SYS = "/sys"
    }
    
    /**
     * Request all required permissions
     */
    fun requestAllPermissions(activity: Activity) {
        val permissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            arrayOf(
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE,
                Manifest.permission.MANAGE_EXTERNAL_STORAGE
            )
        } else {
            arrayOf(
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            )
        }
        
        ActivityCompat.requestPermissions(activity, permissions, PERMISSION_REQUEST_CODE)
    }
    
    /**
     * Check if all permissions are granted
     */
    fun hasAllPermissions(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Environment.isExternalStorageManager()
        } else {
            ContextCompat.checkSelfPermission(context, Manifest.permission.READ_EXTERNAL_STORAGE) 
                == PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.WRITE_EXTERNAL_STORAGE) 
                == PackageManager.PERMISSION_GRANTED
        }
    }
    
    /**
     * Get all mounted storage paths
     */
    fun getAllStoragePaths(context: Context): List<String> {
        val paths = mutableListOf<String>()
        
        // Primary external storage
        paths.add(Environment.getExternalStorageDirectory().absolutePath)
        
        // Secondary storage (SD card, USB)
        val externalFilesDirs = context.getExternalFilesDirs(null)
        for (dir in externalFilesDirs) {
            if (dir != null) {
                paths.add(dir.absolutePath)
            }
        }
        
        // Cache directories
        val cacheDir = context.cacheDir
        paths.add(cacheDir.absolutePath)
        
        return paths.distinct()
    }
    
    /**
     * Read file from anywhere in storage
     */
    fun readFile(path: String): String? {
        return try {
            val file = File(path)
            if (file.exists() && file.isFile) {
                file.readText()
            } else null
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Write file to anywhere in storage
     */
    fun writeFile(path: String, content: String): Boolean {
        return try {
            val file = File(path)
            file.parentFile?.mkdirs()
            file.writeText(content)
            true
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * List directory contents (recursive)
     */
    fun listDirectory(path: String, recursive: Boolean = false): List<File> {
        return try {
            val dir = File(path)
            if (!dir.exists() || !dir.isDirectory) return emptyList()
            
            val files = mutableListOf<File>()
            val queue = mutableListOf(dir)
            
            while (queue.isNotEmpty()) {
                val current = queue.removeAt(0)
                val children = current.listFiles() ?: continue
                
                for (child in children) {
                    files.add(child)
                    if (recursive && child.isDirectory) {
                        queue.add(child)
                    }
                }
            }
            
            files
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    /**
     * Get file info (size, modified, permissions)
     */
    fun getFileInfo(path: String): Map<String, Any> {
        return try {
            val file = File(path)
            mapOf(
                "exists" to file.exists(),
                "isFile" to file.isFile,
                "isDirectory" to file.isDirectory,
                "size" to file.length(),
                "modified" to file.lastModified(),
                "readable" to file.canRead(),
                "writable" to file.canWrite(),
                "executable" to file.canExecute(),
                "absolutePath" to file.absolutePath,
                "parentPath" to (file.parent ?: ""),
                "name" to file.name
            )
        } catch (e: Exception) {
            mapOf("error" to (e.message ?: "Unknown error"))
        }
    }
    
    /**
     * Delete file/directory
     */
    fun deleteFile(path: String, recursive: Boolean = false): Boolean {
        return try {
            val file = File(path)
            if (!file.exists()) return false
            
            if (file.isDirectory && recursive) {
                file.deleteRecursively()
            } else {
                file.delete()
            }
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * Create directory structure
     */
    fun createDirectory(path: String): Boolean {
        return try {
            val dir = File(path)
            dir.mkdirs()
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * Copy file to another location
     */
    fun copyFile(sourcePath: String, destPath: String): Boolean {
        return try {
            val source = File(sourcePath)
            val dest = File(destPath)
            dest.parentFile?.mkdirs()
            source.copyTo(dest, overwrite = true)
            true
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * Search for files by name pattern
     */
    fun searchFiles(startPath: String, pattern: String): List<File> {
        return try {
            val regex = Regex(pattern)
            val results = mutableListOf<File>()
            val queue = mutableListOf(File(startPath))
            
            while (queue.isNotEmpty()) {
                val dir = queue.removeAt(0)
                val children = dir.listFiles() ?: continue
                
                for (child in children) {
                    if (regex.containsMatchIn(child.name)) {
                        results.add(child)
                    }
                    if (child.isDirectory) {
                        queue.add(child)
                    }
                }
            }
            
            results
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    // ===== TERMUX SPECIFIC ACCESS =====
    
    /**
     * Get Termux environment info
     */
    fun getTermuxInfo(): Map<String, String> {
        return mapOf(
            "termux_root" to TermuxPaths.ROOT,
            "termux_home" to TermuxPaths.HOME,
            "termux_bin" to TermuxPaths.BIN,
            "termux_usr" to TermuxPaths.USR,
            "termux_lib" to TermuxPaths.LIB,
            "termux_etc" to TermuxPaths.ETC,
            "termux_databases" to TermuxPaths.DATABASES,
            "termux_shared_prefs" to TermuxPaths.SHARED_PREFS,
            "termux_cache" to TermuxPaths.CACHE
        )
    }
    
    /**
     * Check if Termux is installed and accessible
     */
    fun isTermuxAvailable(): Boolean {
        return File(TermuxPaths.ROOT).exists() && 
               File(TermuxPaths.BIN).exists() &&
               File(TermuxPaths.HOME).exists()
    }
    
    /**
     * Get list of installed Termux packages
     */
    fun getTermuxPackages(): List<String> {
        return try {
            val dpkgDir = File("${TermuxPaths.USR}/var/lib/dpkg")
            if (!dpkgDir.exists()) return emptyList()
            
            val statusFile = File("${dpkgDir.absolutePath}/status")
            val content = statusFile.readText()
            
            val packages = mutableSetOf<String>()
            val lines = content.split("\n")
            
            for (line in lines) {
                if (line.startsWith("Package: ")) {
                    packages.add(line.substring(9).trim())
                }
            }
            
            packages.sorted()
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    /**
     * Get Termux shell configuration
     */
    fun getTermuxConfig(): Map<String, Any> {
        val config = mutableMapOf<String, Any>()
        
        try {
            // Check for bash
            val bashPath = "${TermuxPaths.BIN}/bash"
            config["bash_available"] = File(bashPath).exists()
            
            // Check for zsh
            val zshPath = "${TermuxPaths.BIN}/zsh"
            config["zsh_available"] = File(zshPath).exists()
            
            // Check for python
            val pythonPath = "${TermuxPaths.BIN}/python3"
            config["python3_available"] = File(pythonPath).exists()
            
            // Check for node
            val nodePath = "${TermuxPaths.BIN}/node"
            config["node_available"] = File(nodePath).exists()
            
            // Check for gcc
            val gccPath = "${TermuxPaths.BIN}/gcc"
            config["gcc_available"] = File(gccPath).exists()
            
            // Check for git
            val gitPath = "${TermuxPaths.BIN}/git"
            config["git_available"] = File(gitPath).exists()
            
            // Environment file
            val envFile = File("${TermuxPaths.ETC}/profile")
            config["env_file_exists"] = envFile.exists()
            
        } catch (e: Exception) {
            config["error"] = e.message ?: "Unknown error"
        }
        
        return config
    }
    
    /**
     * Get directory size recursively
     */
    fun getDirectorySize(path: String): Long {
        return try {
            val file = File(path)
            if (!file.exists()) return 0
            
            if (file.isFile) return file.length()
            
            var size = 0L
            val queue = mutableListOf(file)
            
            while (queue.isNotEmpty()) {
                val current = queue.removeAt(0)
                val children = current.listFiles() ?: continue
                
                for (child in children) {
                    if (child.isFile) {
                        size += child.length()
                    } else {
                        queue.add(child)
                    }
                }
            }
            
            size
        } catch (e: Exception) {
            0L
        }
    }
    
    /**
     * Get human-readable size
     */
    fun formatSize(bytes: Long): String {
        return when {
            bytes <= 0 -> "0 B"
            bytes < 1024 -> "$bytes B"
            bytes < 1024 * 1024 -> "${bytes / 1024} KB"
            bytes < 1024 * 1024 * 1024 -> "${bytes / (1024 * 1024)} MB"
            else -> "${bytes / (1024 * 1024 * 1024)} GB"
        }
    }
    
    /**
     * Execute command with full shell access
     */
    fun executeShellCommand(command: String): Pair<String, String> {
        return try {
            val process = Runtime.getRuntime().exec(arrayOf("sh", "-c", command))
            val output = process.inputStream.bufferedReader().readText()
            val error = process.errorStream.bufferedReader().readText()
            process.waitFor()
            Pair(output, error)
        } catch (e: Exception) {
            Pair("", e.message ?: "Error")
        }
    }
    
    /**
     * Execute root command (su -c)
     */
    fun executeRootCommand(command: String): Pair<String, String> {
        return try {
            val process = Runtime.getRuntime().exec(arrayOf("su", "-c", command))
            val output = process.inputStream.bufferedReader().readText()
            val error = process.errorStream.bufferedReader().readText()
            process.waitFor()
            Pair(output, error)
        } catch (e: Exception) {
            Pair("", e.message ?: "Error")
        }
    }
}
