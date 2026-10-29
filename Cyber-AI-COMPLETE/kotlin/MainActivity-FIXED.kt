package com.nipuna.cyberai

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.JavascriptInterface
import android.app.AlertDialog
import org.json.JSONObject
import java.io.OutputStreamWriter

class MainActivity : Activity() {
    private lateinit var web: WebView
    private var proc: Process? = null
    private var wr: OutputStreamWriter? = null
    private val token = java.util.UUID.randomUUID().toString()
    private var autoOn = true
    private var shellState = "stopped" // Track shell state
    private var terminalBuffer = StringBuilder() // Persist terminal output
    private val danger = Regex("""rm\s+-[a-zA-Z]*\s+(/|/sdcard/?|/data/?|/system/?|~/?|[$]HOME/?|\*)(\s|$)|mkfs|dd\s+if=|>\s*/dev/|(curl|wget)[^\n|]*\|\s*(sh|bash|su)|reboot|setprop|chmod\s+-R\s+\S+\s+/(\s|$)|:\(\)\s*\{""")

    inner class Shell {
        private fun emit(t: String, err: Boolean = false) = web.post {
            // Add to terminal buffer
            terminalBuffer.append(if (err) "[ERR] " else "[OK] ").append(t).append("\n")
            // Keep buffer from growing too large (last 50KB)
            if (terminalBuffer.length > 50000) {
                terminalBuffer.delete(0, terminalBuffer.length - 40000)
            }
            // Send to frontend
            web.evaluateJavascript("window.__sh(" + JSONObject.quote(t) + "," + err + ")", null)
        }

        private fun updateStatus(status: String) {
            shellState = status
            web.post {
                web.evaluateJavascript("window.__status(" + JSONObject.quote(status) + ")", null)
            }
        }

        private fun ok(tk: String) = tk == token

        private fun exec(cmd: String) {
            if (proc == null) startShell(root = true)
            updateStatus("executing")
            try {
                wr?.write(cmd + "\n")
                wr?.flush()
            } catch (e: Exception) {
                emit("✗ write failed: " + e.message, true)
                updateStatus("error")
            }
        }

        fun startShell(root: Boolean) {
            if (proc != null && shellState == "running") {
                emit("⟳ Shell already running")
                return
            }
            
            stopShell()
            updateStatus("starting")
            
            try {
                val tmuxPath = "/data/data/com.termux/files"
                val tmuxHome = "$tmuxPath/home"
                val tmuxUsr = "$tmuxPath/usr"
                val tmuxBin = "$tmuxUsr/bin"

                val shellInit = """
                    unset LD_PRELOAD
                    export PREFIX='$tmuxUsr'
                    export HOME='$tmuxHome'
                    export TMPDIR='$tmuxUsr/tmp'
                    export PATH='$tmuxBin:$tmuxBin/applets:/system/bin:/system/xbin:/vendor/bin'
                    export LD_LIBRARY_PATH='$tmuxUsr/lib:$tmuxUsr/lib64'
                    export LANG=en_US.UTF-8
                    export TERM=xterm-256color
                    export ANDROID_ROOT=/system
                    export ANDROID_DATA=/data
                    mkdir -p "${'$'}TMPDIR" "${'$'}HOME/workspace/out" 2>/dev/null
                    cd "${'$'}HOME/workspace" 2>/dev/null || cd "${'$'}HOME"
                    if [ -x '$tmuxBin/bash' ]; then
                        exec '$tmuxBin/bash' -i
                    else
                        exec sh -i
                    fi
                """.trimIndent()

                val pb = if (root) {
                    ProcessBuilder("su", "-c", shellInit).redirectErrorStream(true)
                } else {
                    ProcessBuilder("sh").redirectErrorStream(true)
                }

                pb.environment()["HOME"] = filesDir.absolutePath
                pb.environment()["PATH"] = "$tmuxBin:" + System.getenv("PATH")

                proc = pb.start()
                wr = OutputStreamWriter(proc!!.outputStream)
                val p = proc!!

                // Stream output thread
                Thread {
                    p.inputStream.bufferedReader().forEachLine { line ->
                        emit(line)
                    }
                    emit("[shell exited]", true)
                    updateStatus("stopped")
                }.start()

                // Initialize environment
                val initCmds = listOf(
                    "export PATH=$tmuxBin:\$PATH HOME=$tmuxHome LD_LIBRARY_PATH=$tmuxUsr/lib TMPDIR=$tmuxUsr/tmp",
                    "mkdir -p \$HOME/workspace/out 2>/dev/null",
                    "cd \$HOME/workspace 2>/dev/null || cd \$HOME"
                )
                for (cmd in initCmds) {
                    wr!!.write(cmd + "\n")
                }
                wr!!.flush()

                updateStatus("running")
                val msg = if (root) "✓ root shell started (Termux EXTREME)" else "✓ shell started"
                emit(msg)

            } catch (e: Exception) {
                emit("✗ start failed: " + e.message, true)
                updateStatus("error")
            }
        }

        fun stopShell() {
            try {
                proc?.destroy()
            } catch (_: Exception) {}
            proc = null
            wr = null
            updateStatus("stopped")
        }

        @JavascriptInterface
        fun getTerminalBuffer(tk: String): String {
            if (!ok(tk)) return ""
            return terminalBuffer.toString()
        }

        @JavascriptInterface
        fun clearTerminal(tk: String) {
            if (!ok(tk)) return
            terminalBuffer.clear()
            emit("📋 Terminal cleared")
        }

        @JavascriptInterface
        fun getStatus(tk: String): String {
            if (!ok(tk)) return "unknown"
            return shellState
        }

        @JavascriptInterface
        fun start(tk: String, root: Boolean) {
            if (!ok(tk)) return
            startShell(root)
        }

        @JavascriptInterface
        fun stop(tk: String) {
            if (!ok(tk)) return
            stopShell()
        }

        @JavascriptInterface
        fun setAuto(tk: String, on: Boolean) {
            if (!ok(tk)) return
            if (!on) {
                autoOn = false
                emit("⚙ auto-run: off")
                return
            }
            runOnUiThread {
                AlertDialog.Builder(this@MainActivity)
                    .setTitle("🔓 Enable EXTREME auto-run?")
                    .setMessage("Commands will run as ROOT WITHOUT prompt. Status updates real-time. Dangerous patterns still ask.")
                    .setPositiveButton("EXTREME MODE") { _, _ ->
                        autoOn = true
                        web.evaluateJavascript("window.__autoSet(true)", null)
                    }
                    .setNegativeButton("Cancel") { _, _ ->
                        web.evaluateJavascript("window.__autoSet(false)", null)
                    }
                    .show()
            }
        }

        @JavascriptInterface
        fun gfSearch(tk: String, id: String, q: String, key: String) {
            if (!ok(tk)) return
            Thread {
                var good = false
                var out = ""
                try {
                    val c = java.net.URL("https://api.geekflare.com/search").openConnection() as java.net.HttpURLConnection
                    c.requestMethod = "POST"
                    c.connectTimeout = 15000
                    c.readTimeout = 20000
                    c.doOutput = true
                    c.setRequestProperty("x-api-key", key)
                    c.setRequestProperty("Content-Type", "application/json")
                    val body = JSONObject()
                        .put("query", q)
                        .put("limit", 5)
                        .put("source", "web")
                        .put("format", "json")
                        .toString()
                    c.outputStream.use { it.write(body.toByteArray()) }
                    val code = c.responseCode
                    val st = if (code in 200..299) c.inputStream else c.errorStream
                    out = st?.bufferedReader()?.readText() ?: ""
                    good = code in 200..299
                    if (!good) out = "HTTP $code " + out.take(200)
                } catch (e: Exception) {
                    out = e.message ?: "error"
                }
                web.post {
                    web.evaluateJavascript(
                        "window.__gf(" + JSONObject.quote(id) + "," + good + "," + JSONObject.quote(out) + ")",
                        null
                    )
                }
            }.start()
        }

        @JavascriptInterface
        fun openDownloads(tk: String) {
            if (!ok(tk)) return
            runOnUiThread {
                try {
                    startActivity(
                        Intent(android.app.DownloadManager.ACTION_VIEW_DOWNLOADS)
                            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    )
                } catch (_: Exception) {}
            }
        }

        @JavascriptInterface
        fun run(tk: String, cmd: String, auto: Boolean) {
            if (!ok(tk)) return
            val shown = cmd.replace(Regex("\\necho __DONE__\\$\\?$"), "")

            if (auto && autoOn && !danger.containsMatchIn(shown)) {
                exec(cmd)
                return
            }

            runOnUiThread {
                AlertDialog.Builder(this@MainActivity)
                    .setTitle(if (auto && autoOn) "⚠ Dangerous — confirm?" else "Run command?")
                    .setMessage(shown)
                    .setPositiveButton("Allow") { _, _ -> exec(cmd) }
                    .setNegativeButton("Deny") { _, _ -> emit("❌ denied", true) }
                    .show()
            }
        }
    }

    private var chooser: ValueCallback<Array<Uri>>? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.parseColor("#0A0E13")
        window.navigationBarColor = Color.parseColor("#0A0E13")
        web = WebView(this)
        web.setBackgroundColor(Color.parseColor("#0A0E13"))
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.databaseEnabled = true
        web.webViewClient = object : WebViewClient() {
            override fun onPageFinished(v: WebView, url: String?) {
                v.evaluateJavascript("window.__tk=" + JSONObject.quote(token), null)
                // Restore terminal buffer and status
                v.evaluateJavascript("window.__restoreTerminal(" + JSONObject.quote(terminalBuffer.toString()) + "," + JSONObject.quote(shellState) + ")", null)
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                w: WebView,
                cb: ValueCallback<Array<Uri>>,
                p: FileChooserParams
            ): Boolean {
                chooser?.onReceiveValue(null)
                chooser = cb
                return try {
                    startActivityForResult(p.createIntent(), 1)
                    true
                } catch (e: Exception) {
                    chooser = null
                    false
                }
            }
        }
        web.addJavascriptInterface(Shell(), "Android")
        setContentView(web)
        web.loadUrl("file:///android_asset/index.html")
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == 1) {
            chooser?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data))
            chooser = null
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        web.evaluateJavascript("(window.goBack?goBack():0)") { r ->
            if (r != "1") super.onBackPressed()
        }
    }
}
