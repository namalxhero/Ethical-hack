package com.nipuna.cyberai

import android.net.Uri
import org.json.JSONObject
import org.json.JSONArray
import java.io.BufferedReader
import java.io.InputStreamReader

/**
 * JSONL File Handler
 * Processes JSON Lines format files (.jsonl, .ndjson)
 * Each line is a separate JSON object
 */
object JSONLHandler {
    
    data class JSONLData(
        val lineCount: Int,
        val rows: List<JSONObject>,
        val headers: Set<String>,
        val formatted: String
    )
    
    /**
     * Parse JSONL content from URI
     * @param contentResolver Android ContentResolver
     * @param uri File URI
     * @return Parsed JSONL data or null on error
     */
    fun parseJSONL(contentResolver: android.content.ContentResolver, uri: Uri): JSONLData? {
        return try {
            val rows = mutableListOf<JSONObject>()
            val headers = mutableSetOf<String>()
            var lineCount = 0
            
            contentResolver.openInputStream(uri)?.use { input ->
                BufferedReader(InputStreamReader(input)).use { reader ->
                    reader.forEachLine { line ->
                        if (line.trim().isNotEmpty()) {
                            try {
                                val json = JSONObject(line)
                                rows.add(json)
                                headers.addAll(json.keys().asSequence())
                                lineCount++
                            } catch (e: Exception) {
                                // Skip invalid lines
                            }
                        }
                    }
                }
            }
            
            val formatted = formatJSONL(rows, headers)
            JSONLData(lineCount, rows, headers, formatted)
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Format JSONL data as readable table
     */
    private fun formatJSONL(rows: List<JSONObject>, headers: Set<String>): String {
        if (rows.isEmpty()) return "[JSONL] Empty file"
        
        val sb = StringBuilder()
        sb.append("[JSONL] ").append(rows.size).append(" rows\n")
        sb.append("Headers: ").append(headers.joinToString(", ")).append("\n")
        sb.append("─".repeat(80)).append("\n")
        
        // Display first 10 rows
        rows.take(10).forEach { row ->
            headers.forEach { header ->
                val value = row.optString(header, "")
                sb.append("$header: ").append(value.take(40)).append(" | ")
            }
            sb.append("\n")
        }
        
        if (rows.size > 10) {
            sb.append("... and ").append(rows.size - 10).append(" more rows\n")
        }
        
        return sb.toString()
    }
    
    /**
     * Export JSONL as CSV
     */
    fun toCSV(data: JSONLData): String {
        if (data.rows.isEmpty()) return ""
        
        val headers = data.headers.toList()
        val sb = StringBuilder()
        
        // Header row
        sb.append(headers.joinToString(",")).append("\n")
        
        // Data rows
        data.rows.forEach { row ->
            sb.append(headers.map { h ->
                val value = row.optString(h, "")
                if (value.contains(",") || value.contains("\"")) {
                    "\"${value.replace("\"", "\"\"")}\""
                } else {
                    value
                }
            }.joinToString(",")).append("\n")
        }
        
        return sb.toString()
    }
    
    /**
     * Filter JSONL by key-value match
     */
    fun filter(data: JSONLData, key: String, value: String): JSONLData {
        val filtered = data.rows.filter { row ->
            row.optString(key, "").contains(value, ignoreCase = true)
        }
        
        val headers = mutableSetOf<String>()
        filtered.forEach { headers.addAll(it.keys().asSequence()) }
        val formatted = formatJSONL(filtered, headers)
        
        return JSONLData(filtered.size, filtered, headers, formatted)
    }
    
    /**
     * Get column statistics
     */
    fun getStats(data: JSONLData, column: String): String {
        val values = data.rows.mapNotNull { it.optString(column, null) }
        
        return """
            Column: $column
            Total: ${values.size}
            Unique: ${values.distinct().size}
            Sample: ${values.take(3).joinToString(", ")}
        """.trimIndent()
    }
}
