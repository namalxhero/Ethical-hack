# Cyber AI (Android APK) - full project

## Install / build
1. Me folder eka GitHub repo ekakata push karanna (branch: main).
2. Settings > Secrets > Actions: GEMINI_API_KEY (+ optional GEMINI_SEARCH_KEY, GEEKFLARE_API_KEY).
3. Actions > Build APK iwara unama Artifacts > CyberAI-debug-apk download karala install karanna.

## First run (phone)
- Magisk/KernelSU root permission "Grant" karanna.
- App eka "all files access" illanawa: Allow karanna (nathnam Terminal tab eke `storage` type karanna).
- Settings eke Gemini API key eka danna, "Auto-run" on karanna.

## GitHub ekata AI ekenma push + build check
1. Github > Settings > Developer settings > Tokens: aluth token ekak hadanna (scopes: repo, workflow).
2. App eke Terminal tab eke ekparak type karanna (token eka chat ekata danna epa):
   printf 'GH_TOKEN=%s\n' 'MEKATA_TOKEN' > ~/.cyberai_env && chmod 600 ~/.cyberai_env
3. Chat eke kiyanna: "project eka github ekata push karala build eka balanna, repo name: cyber-ai"
   AI eka push-to-github.sh (app ekath ekka enawa) use karala push karanawa, Actions build eka balala result eka kiyanawa.

## Added in this version
- Terminal output persist (page reload unath ape wenawa na)
- Root shell: LD_PRELOAD unset + Termux env (PREFIX, LANG, TERM)
- Storage: all-files access request + `storage` terminal command
- AI system prompt: device access, Termux paths, safe GitHub push + build check, token rules
