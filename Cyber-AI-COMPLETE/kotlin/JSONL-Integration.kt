// Add these methods to the Shell inner class in MainActivity.kt

// ===== JSONL FILE HANDLING =====

/**
 * Load and parse JSONL file
 * Usage from JavaScript: Android.loadJSONL(token, fileUri)
 */
@JavascriptInterface
fun loadJSONL(tk: String, filePath: String) {
    if (!ok(tk)) return
    Thread {
        try {
            val uri = android.net.Uri.parse(filePath)
            val data = JSONLHandler.parseJSONL(applicationContext.contentResolver, uri)
            
            if (data != null) {
                emit("📊 JSONL Loaded: ${data.lineCount} rows")
                emit("📋 Headers: ${data.headers.joinToString(", ")}")
                emit(data.formatted)
                
                // Store for further operations
                lastJSONLData = data
                
                // Send to JS for table display
                val jsonInfo = JSONObject().apply {
                    put("rows", data.lineCount)
                    put("headers", JSONArray(data.headers.toList()))
                    put("preview", data.formatted)
                }
                web.post {
                    web.evaluateJavascript("window.__jsonlLoaded(" + jsonInfo.toString() + ")", null)
                }
            } else {
                emit("❌ Failed to parse JSONL file", true)
            }
        } catch (e: Exception) {
            emit("❌ Error loading JSONL: " + e.message, true)
        }
    }.start()
}

/**
 * Filter JSONL data
 * Usage: Android.filterJSONL(token, columnName, filterValue)
 */
@JavascriptInterface
fun filterJSONL(tk: String, column: String, value: String) {
    if (!ok(tk)) return
    if (lastJSONLData == null) {
        emit("❌ No JSONL data loaded", true)
        return
    }
    
    Thread {
        try {
            val filtered = JSONLHandler.filter(lastJSONLData!!, column, value)
            emit("🔍 Filtered: ${filtered.lineCount} matching rows")
            emit(filtered.formatted)
            
            lastJSONLData = filtered
        } catch (e: Exception) {
            emit("❌ Filter error: " + e.message, true)
        }
    }.start()
}

/**
 * Get statistics for a column
 * Usage: Android.getJSONLStats(token, columnName)
 */
@JavascriptInterface
fun getJSONLStats(tk: String, column: String) {
    if (!ok(tk)) return
    if (lastJSONLData == null) {
        emit("❌ No JSONL data loaded", true)
        return
    }
    
    try {
        val stats = JSONLHandler.getStats(lastJSONLData!!, column)
        emit("📈 Statistics for '$column':")
        emit(stats)
    } catch (e: Exception) {
        emit("❌ Stats error: " + e.message, true)
    }
}

/**
 * Export JSONL to CSV
 * Usage: Android.exportJSONLToCSV(token)
 */
@JavascriptInterface
fun exportJSONLToCSV(tk: String) {
    if (!ok(tk)) return
    if (lastJSONLData == null) {
        emit("❌ No JSONL data loaded", true)
        return
    }
    
    Thread {
        try {
            val csv = JSONLHandler.toCSV(lastJSONLData!!)
            val outputDir = java.io.File(tmuxHome + "/workspace/out")
            outputDir.mkdirs()
            
            val csvFile = java.io.File(outputDir, "export_${System.currentTimeMillis()}.csv")
            csvFile.writeText(csv)
            
            emit("✅ CSV exported: ${csvFile.absolutePath}")
            emit("📥 ${lastJSONLData!!.lineCount} rows, ${lastJSONLData!!.headers.size} columns")
        } catch (e: Exception) {
            emit("❌ Export error: " + e.message, true)
        }
    }.start()
}

/**
 * Query JSONL with simple SQL-like syntax
 * Usage: Android.queryJSONL(token, "SELECT column WHERE key=value")
 */
@JavascriptInterface
fun queryJSONL(tk: String, query: String) {
    if (!ok(tk)) return
    if (lastJSONLData == null) {
        emit("❌ No JSONL data loaded", true)
        return
    }
    
    try {
        // Simple query parser: "SELECT col1,col2 WHERE key=value"
        val parts = query.split("WHERE", ignoreCase = true)
        val selectPart = parts[0].trim().removePrefix("SELECT").trim()
        val columns = if (selectPart == "*") lastJSONLData!!.headers else selectPart.split(",").map { it.trim() }
        
        emit("🔎 Query: $query")
        emit("📊 Results:")
        
        lastJSONLData!!.rows.forEachIndexed { idx, row ->
            val line = columns.joinToString(" | ") { col ->
                "$col: ${row.optString(col, "")}"
            }
            if (idx < 20) emit(line) // First 20 results
        }
        
        if (lastJSONLData!!.rows.size > 20) {
            emit("... and ${lastJSONLData!!.rows.size - 20} more")
        }
    } catch (e: Exception) {
        emit("❌ Query error: " + e.message, true)
    }
}

/**
 * Get JSONL as JSON array (for chart/visualization)
 */
@JavascriptInterface
fun getJSONLAsJSON(tk: String): String {
    if (!ok(tk)) return ""
    if (lastJSONLData == null) return ""
    
    return try {
        val array = JSONArray()
        lastJSONLData!!.rows.forEach { array.put(it) }
        array.toString()
    } catch (e: Exception) {
        ""
    }
}

// Add this to MainActivity class (outside Shell):
private var lastJSONLData: JSONLHandler.JSONLData? = null
private val tmuxHome = "/data/data/com.termux/files/home"
