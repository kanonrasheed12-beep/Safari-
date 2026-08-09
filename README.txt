Private Browser v2 — Persistent Tabs PWA

WHAT CHANGED
- Multiple tabs.
- New Tab (+) button.
- Close individual tabs.
- Switch between open tabs.
- Open tabs are stored in localStorage and restored after the Home Screen app is closed/reopened.
- The active tab is restored too.
- Duplicate tab.
- Close other tabs.
- "Erase All" is separate from normal tab closing.
- DuckDuckGo remains the default search engine.
- In-app iframe viewer for websites that allow embedding.
- "Open page" fallback for websites that block iframe embedding.

HOW TO UPDATE GITHUB
1. Back up your current files.
2. Replace:
   - index.html
   - style.css
   - app.js
   - manifest.webmanifest
3. Commit and push the changes.
4. Wait for GitHub Pages to redeploy.
5. On iPhone, fully close the Home Screen app and reopen it.
6. If the old version is cached, remove the Home Screen icon, open the GitHub Pages URL in Safari, then Add to Home Screen again.

IMPORTANT TECHNICAL LIMIT
This remains a Progressive Web App, not a native iOS browser.

A normal website/PWA cannot reliably display every other website inside an iframe. Websites can block embedding using headers such as:
- X-Frame-Options
- Content-Security-Policy frame-ancestors

That means the app can fully maintain and restore its own tab SESSION LIST, but some pages will need the "Open page" fallback instead of displaying inside the shell.

For true DuckDuckGo-style browsing — arbitrary pages, accurate per-tab navigation history, back/forward state, independent web views, reliable website rendering, and native browser controls — the next version should be a native iOS app using Swift + WKWebView rather than a GitHub Pages PWA.

PRIVACY NOTE
Persistent tabs require saving the open tab URLs locally on the device. "Erase All" removes that saved tab-session data.
