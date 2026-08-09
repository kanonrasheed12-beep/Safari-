Private Browser v3 — Browser-Style PWA

NEW IN V3
- Persistent multiple tabs.
- App-managed Back and Forward history.
- Refresh button.
- New-tab Home button.
- Bookmark / unbookmark current page.
- Bookmark manager.
- Tab overview cards.
- Search engine selector:
  - DuckDuckGo
  - Brave Search
  - Startpage
- Website favicons using DuckDuckGo's public icon service.
- Better URL/search-derived tab titles.
- Duplicate current tab.
- Close all other tabs.
- Fire button:
  - closes all tabs
  - clears this app's browser session
  - keeps bookmarks and selected search engine
- Full "Erase App Data" option:
  - removes tabs
  - removes bookmarks
  - resets search-engine preference
- Automatic migration from the v2 tab list when possible.

INSTALL / UPDATE ON GITHUB PAGES
1. Back up the old files in your repository.
2. Replace these files:
   - index.html
   - style.css
   - app.js
   - manifest.webmanifest
   - README.txt
3. Commit/push to GitHub.
4. Let GitHub Pages redeploy.
5. Fully close the iPhone Home Screen app and reopen it.
6. If iOS keeps an old cached copy, remove the Home Screen icon, reopen the GitHub Pages URL in Safari, then Add to Home Screen again.

IMPORTANT PWA LIMITATIONS
This is still a Progressive Web App, not a native iOS browser.

1. Some websites refuse to render inside an iframe through X-Frame-Options or Content-Security-Policy frame-ancestors. Use "Open page" for those sites.

2. Back/Forward tracks URLs navigated through this app's own controls. Because of browser same-origin security, this PWA cannot reliably inspect cross-origin links clicked inside an embedded page.

3. A website cannot erase another website's Safari cookies/storage. The Fire button clears this PWA's own tab/session state, not arbitrary third-party site data.

4. Cross-origin page titles cannot be read reliably. Titles are derived from search terms or website hostnames.

5. Favicons use DuckDuckGo's icon endpoint. This means the hostname is requested from DuckDuckGo when the icon is displayed.

For full DuckDuckGo-style behavior — independent WKWebView tabs, native back/forward history, arbitrary website compatibility, website process isolation, native download handling, full tab snapshots, and stronger per-tab controls — build a native iOS version with Swift/WKWebView.
