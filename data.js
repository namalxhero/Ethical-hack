/**
 * data.js
 * ------------------------------------------------------------
 * Cyber Security Chat Bot - Knowledge Base File
 *
 * මේකේ තියෙන්නෙ:
 *  1. topics[]      -> cyber security topic එකකට අදාළ code + explanation
 *  2. knownErrors[] -> user error message එකක් දුන්නම් fix එක return කරන්න
 *  3. findTopic()    -> user ඇහුව දේට ලංම matching topic එක හොයාගන්නවා
 *  4. findErrorFix() -> error message එකට matching fix එක හොයාගන්නවා
 *
 * index.js එකෙන් මේ functions import කරලා call කරන්න:
 *   const { findTopic, findErrorFix } = require("./data.js");
 * ------------------------------------------------------------
 */

// ------------------------------------------------------------
// 1. Cyber Security Topics + Code Snippets
// ------------------------------------------------------------
const topics = [
  {
    id: "port-scan",
    keywords: ["port scan", "portscan", "open ports", "nmap"],
    title: "Port Scanning (Node.js)",
    explanation:
      "දුන්න host එකේ port එකක් open ද කියලා check කරන්නේ raw TCP socket එකකින්. නීත්‍යානුකූලව හිමිකරු ඉඩ දුන් systems වල විතරක් run කරන්න.",
    code: `
const net = require('net');

function checkPort(host, port, timeout = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => { resolve(false); });
    socket.connect(port, host);
  });
}

// usage: checkPort('example.com', 443).then(open => console.log(open));
`,
  },
  {
    id: "password-hash",
    keywords: ["hash password", "bcrypt", "password security", "encrypt password"],
    title: "Password Hashing (bcrypt)",
    explanation:
      "Password plain text විදිහට save කරන්න එපා. bcrypt වගේ library එකකින් hash කරලා store කරන්න.",
    code: `
const bcrypt = require('bcrypt');

async function hashPassword(plainText) {
  const saltRounds = 10;
  return await bcrypt.hash(plainText, saltRounds);
}

async function verifyPassword(plainText, hash) {
  return await bcrypt.compare(plainText, hash);
}
`,
  },
  {
    id: "phishing-detect",
    keywords: ["phishing", "fake link", "suspicious url", "url check"],
    title: "Suspicious URL Basic Check",
    explanation:
      "Phishing links වල පොදු lakshana තියෙනවා (IP address domain විදිහට, misspelled domains, https නැති ඒවා). මේ basic check එකෙන් red flags ටිකක් හඳුනාගන්න පුළුවන් - full protection එකක් නෙමෙයි.",
    code: `
function looksSuspicious(url) {
  const flags = [];
  if (!url.startsWith('https://')) flags.push('No HTTPS');
  if (/\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/.test(url)) flags.push('IP-based domain');
  if (url.includes('@')) flags.push('Contains @ symbol');
  if (url.length > 75) flags.push('Unusually long URL');
  return { suspicious: flags.length > 0, flags };
}
`,
  },
  {
    id: "sql-injection",
    keywords: ["sql injection", "sqli", "prevent sql injection"],
    title: "SQL Injection Prevention",
    explanation:
      "String concatenation කරලා query හදන්න එපා. Parameterized queries / prepared statements use කරන්න.",
    code: `
// Bad (vulnerable):
// db.query(\`SELECT * FROM users WHERE email = '\${email}'\`);

// Good (safe - parameterized):
db.query('SELECT * FROM users WHERE email = ?', [email]);
`,
  },
  {
    id: "rate-limit",
    keywords: ["rate limit", "brute force protection", "throttle requests"],
    title: "Basic Rate Limiting (Express)",
    explanation:
      "Brute-force attacks වළක්වගන්න request rate limit කරන්න express-rate-limit වගේ package එකක් use කරන්න.",
    code: `
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: 'Too many requests, try again later.',
});

app.use(limiter);
`,
  },
];

// ------------------------------------------------------------
// 2. Known Errors + Fixes (index.js/package.json/vercel.json related)
// ------------------------------------------------------------
const knownErrors = [
  {
    id: "module-not-found",
    keywords: ["cannot find module", "module not found"],
    fix:
      "package.json එකේ dependency එක නෑ. `npm install <package-name>` කරලා, ඊට පස්සෙ package.json/package-lock.json commit කරලා Vercel එකට push කරන්න.",
  },
  {
    id: "vercel-function-timeout",
    keywords: ["function execution timed out", "vercel timeout"],
    fix:
      "Vercel serverless function එකේ default timeout එක ඉක්මවලා. vercel.json එකේ maxDuration වැඩි කරන්න (Pro plan නම් විතරක් වැඩි කරන්න පුළුවන්), නැත්නම් logic එක optimize කරන්න.",
  },
  {
    id: "env-var-missing",
    keywords: ["undefined api key", "process.env is undefined", "api key not found"],
    fix:
      "Vercel dashboard එකේ Project Settings > Environment Variables එකේ key එක දාලා නෑ, හෝ deploy කරන්න කලින් redeploy කරලා නෑ. Env variable දාපු පස්සෙ අනිවාර්යයෙන් redeploy කරන්න.",
  },
  {
    id: "cors-error",
    keywords: ["cors", "access-control-allow-origin"],
    fix:
      "Backend (vercel function) එකේ response headers වලට CORS headers දාන්න: res.setHeader('Access-Control-Allow-Origin', '*') වගේ එකක්.",
  },
];

// ------------------------------------------------------------
// 3. Lookup Functions (Local Fuzzy/Scoring Match - Gemini අවශ්‍ය නෑ)
// ------------------------------------------------------------

/**
 * Text එකක් normalize කරලා word ටිකක් විදිහට split කරනවා
 * (punctuation අයින් කරලා, lowercase කරලා)
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

/**
 * userText එකට entry (topic/error) එකක් කොච්චර ලංද කියලා score එකක් දෙනවා.
 * - exact keyword phrase එකක් තිබ්බොත් ලොකු score එකක් (10)
 * - keyword එකේ තනි word එකක් තිබ්බොත් පොඩි score එකක් (2)
 */
function scoreEntry(userText, entry) {
  const msg = userText.toLowerCase();
  const userWords = new Set(tokenize(userText));
  let score = 0;

  for (const phrase of entry.keywords) {
    if (msg.includes(phrase.toLowerCase())) {
      score += 10; // exact phrase match - strongest signal
    } else {
      const phraseWords = tokenize(phrase);
      const matchedWords = phraseWords.filter((w) => userWords.has(w));
      score += matchedWords.length * 2; // partial word overlap
    }
  }
  return score;
}

/**
 * List එකක් (topics/knownErrors) අතරින් userText එකට
 * හොඳම (score එක වැඩිම) match එක auto-find කරනවා.
 * threshold එකට වැඩි match එකක් නැත්නම් null.
 */
function bestMatch(userText, list, threshold = 2) {
  let best = null;
  let bestScore = 0;

  for (const entry of list) {
    const score = scoreEntry(userText, entry);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return bestScore >= threshold ? { ...best, matchScore: bestScore } : null;
}

/** User message එකට ලංම topic එක auto-find කරනවා (local, Gemini අවශ්‍ය නෑ) */
function findTopic(userMessage) {
  return bestMatch(userMessage, topics);
}

/** Error message එකට ලංම fix එක auto-find කරනවා (local, Gemini අවශ්‍ය නෑ) */
function findErrorFix(errorMessage) {
  return bestMatch(errorMessage, knownErrors);
}

// ------------------------------------------------------------
// Export
// ------------------------------------------------------------
module.exports = {
  topics,
  knownErrors,
  findTopic,
  findErrorFix,
};
