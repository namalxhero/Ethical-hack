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
    private val termBuf = StringBuilder()
    private val danger = Regex("""rm\s+-[a-zA-Z]*\s+(/|/sdcard/?|/data/?|/system/?|~/?|[$]HOME/?|\*)(\s|$)|mkfs|dd\s+if=|>\s*/dev/|(curl|wget)[^\n|]*\|\s*(sh|bash|su)|reboot|setprop|chmod\s+-R\s+\S+\s+/(\s|$)|:\(\)\s*\{""")

    inner class Shell {
        private fun emit(t: String, err: Boolean = false) {
            if (!t.startsWith("__DONE__")) {
                synchronized(termBuf) {
                    termBuf.append(if (err) 'E' else 'O').append(t.replace('\n', ' ')).append('\n')
                    if (termBuf.length > 60000) { termBuf.delete(0, termBuf.length - 40000) }
                }
            }
            web.post { web.evaluateJavascript("window.__sh(" + JSONObject.quote(t) + "," + err + ")", null) }
        }
        private fun ok(tk: String) = tk == token
        private fun exec(cmd: String) {
            if (proc == null) startShell(true)
            try { wr?.write(cmd + "\n"); wr?.flush() } catch (e: Exception) { emit("write failed: " + e.message, true) }
        }
        fun startShell(root: Boolean) {
            stopShell()
            try {
                val pb = ProcessBuilder(if (root) "su" else "sh").redirectErrorStream(true)
                pb.environment()["HOME"] = filesDir.absolutePath
                pb.environment()["PATH"] = "/data/data/com.termux/files/usr/bin:" + System.getenv("PATH")
                proc = pb.start()
                wr = OutputStreamWriter(proc!!.outputStream)
                val p = proc!!
                Thread {
                    p.inputStream.bufferedReader().forEachLine { emit(it) }
                    emit("[shell exited]", true)
                }.start()
                val tm = "/data/data/com.termux/files"
                wr!!.write("unset LD_PRELOAD; export PREFIX=" + tm + "/usr LANG=en_US.UTF-8 TERM=xterm-256color\n")
                wr!!.write("export PATH=" + tm + "/usr/bin:\$PATH HOME=" + tm + "/home LD_LIBRARY_PATH=" + tm + "/usr/lib TMPDIR=" + tm + "/usr/tmp\n")
                wr!!.write("mkdir -p \$HOME/workspace/out 2>/dev/null; cd \$HOME/workspace 2>/dev/null\n")
                wr!!.flush()
                emit(if (root) "root shell started" else "shell started")
            } catch (e: Exception) { emit("start failed: " + e.message, true) }
        }
        fun stopShell() { try { proc?.destroy() } catch (_: Exception) {}; proc = null; wr = null }

        @JavascriptInterface fun storageOk(tk: String): Boolean = ok(tk) && hasAllFiles()
        @JavascriptInterface fun askStorage(tk: String) { if (ok(tk)) runOnUiThread { askAllFiles() } }

        @JavascriptInterface fun start(tk: String, root: Boolean) { if (ok(tk)) startShell(root) }
        @JavascriptInterface fun stop(tk: String) { if (ok(tk)) stopShell() }

        @JavascriptInterface fun setAuto(tk: String, on: Boolean) {
            if (!ok(tk)) return
            if (!on) { autoOn = false; emit("auto-run off"); return }
            runOnUiThread {
                AlertDialog.Builder(this@MainActivity)
                    .setTitle("Enable auto-run?")
                    .setMessage("Commands written by the AI will run WITHOUT asking and their output goes back to the AI. Dangerous patterns (rm -rf /, su, curl|sh, dd, mkfs...) still ask. Resets when the app restarts.")
                    .setPositiveButton("Enable") { _, _ -> autoOn = true; web.evaluateJavascript("window.__autoSet(true)", null) }
                    .setNegativeButton("Cancel") { _, _ -> web.evaluateJavascript("window.__autoSet(false)", null) }
                    .show()
            }
        }

        @JavascriptInterface fun gfSearch(tk: String, id: String, q: String, key: String) {
            if (!ok(tk)) return
            Thread {
                var good = false
                var out = ""
                try {
                    val c = java.net.URL("https://api.geekflare.com/search").openConnection() as java.net.HttpURLConnection
                    c.requestMethod = "POST"; c.connectTimeout = 15000; c.readTimeout = 20000; c.doOutput = true
                    c.setRequestProperty("x-api-key", key); c.setRequestProperty("Content-Type", "application/json")
                    val body = JSONObject().put("query", q).put("limit", 5).put("source", "web").put("format", "json").toString()
                    c.outputStream.use { it.write(body.toByteArray()) }
                    val code = c.responseCode
                    val st = if (code in 200..299) c.inputStream else c.errorStream
                    out = st?.bufferedReader()?.readText() ?: ""
                    good = code in 200..299
                    if (!good) out = "HTTP " + code + " " + out.take(200)
                } catch (e: Exception) { out = e.message ?: "error" }
                web.post { web.evaluateJavascript("window.__gf(" + JSONObject.quote(id) + "," + good + "," + JSONObject.quote(out) + ")", null) }
            }.start()
        }

        @JavascriptInterface fun openDownloads(tk: String) {
            if (!ok(tk)) return
            runOnUiThread {
                try { startActivity(Intent(android.app.DownloadManager.ACTION_VIEW_DOWNLOADS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (_: Exception) {}
            }
        }

        @JavascriptInterface fun run(tk: String, cmd: String, auto: Boolean) {
            if (!ok(tk)) return
            val shown = cmd.replace(Regex("\\necho __DONE__\\$\\?$"), "")
            if (auto && autoOn && !danger.containsMatchIn(shown)) { exec(cmd); return }
            runOnUiThread {
                AlertDialog.Builder(this@MainActivity)
                    .setTitle(if (auto && autoOn) "Dangerous command - run?" else "Run this command?")
                    .setMessage(shown)
                    .setPositiveButton("Allow") { _, _ -> exec(cmd) }
                    .setNegativeButton("Deny") { _, _ -> emit("denied", true) }
                    .show()
            }
        }
    }

    private fun hasAllFiles(): Boolean =
        if (android.os.Build.VERSION.SDK_INT >= 30) android.os.Environment.isExternalStorageManager()
        else checkSelfPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE) == android.content.pm.PackageManager.PERMISSION_GRANTED

    private fun askAllFiles() {
        try {
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                startActivity(Intent(android.provider.Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION, Uri.parse("package:" + packageName)))
            } else {
                requestPermissions(arrayOf(android.Manifest.permission.READ_EXTERNAL_STORAGE, android.Manifest.permission.WRITE_EXTERNAL_STORAGE), 2)
            }
        } catch (e: Exception) {
            try { startActivity(Intent(android.provider.Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION)) } catch (_: Exception) {}
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
        web.webViewClient = object : WebViewClient() {
            override fun onPageFinished(v: WebView, url: String?) {
                v.evaluateJavascript("window.__tk=" + JSONObject.quote(token), null)
                val snap = synchronized(termBuf) { termBuf.toString() }
                if (snap.isNotEmpty()) v.evaluateJavascript("window.__restore&&window.__restore(" + JSONObject.quote(snap) + ")", null)
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(w: WebView, cb: ValueCallback<Array<Uri>>, p: FileChooserParams): Boolean {
                chooser?.onReceiveValue(null)
                chooser = cb
                return try { startActivityForResult(p.createIntent(), 1); true } catch (e: Exception) { chooser = null; false }
            }
        }
        web.addJavascriptInterface(Shell(), "Android")
        setContentView(web)
        web.loadUrl("file:///android_asset/index.html")
        try {
            assets.open("push-to-github.sh").use { i -> java.io.File(filesDir, "push-to-github.sh").outputStream().use { o -> i.copyTo(o) } }
        } catch (_: Exception) {}
        val prefs = getSharedPreferences("cfg", MODE_PRIVATE)
        if (!prefs.getBoolean("askedStorage", false)) {
            prefs.edit().putBoolean("askedStorage", true).apply()
            if (!hasAllFiles()) askAllFiles()
        }
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
