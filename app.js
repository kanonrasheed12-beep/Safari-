const STORAGE_KEY = 'privateBrowser.tabs.v3';
const ACTIVE_KEY = 'privateBrowser.activeTab.v3';
const BOOKMARKS_KEY = 'privateBrowser.bookmarks.v3';
const ENGINE_KEY = 'privateBrowser.searchEngine.v3';

const LEGACY_TABS_KEY = 'privateBrowser.tabs.v2';
const LEGACY_ACTIVE_KEY = 'privateBrowser.activeTab.v2';

const $ = id => document.getElementById(id);

const form = $('searchForm');
const address = $('address');
const startSearchForm = $('startSearchForm');
const startAddress = $('startAddress');
const searchEngine = $('searchEngine');
const tabsBar = $('tabsBar');
const startPage = $('startPage');
const viewer = $('viewer');
const webFrame = $('webFrame');
const viewerStatus = $('viewerStatus');
const tabCount = $('tabCount');

const backBtn = $('backBtn');
const forwardBtn = $('forwardBtn');
const refreshBtn = $('refreshBtn');
const homeBtn = $('homeBtn');
const bookmarkBtn = $('bookmarkBtn');
const newTabBtn = $('newTabBtn');
const openDirectBtn = $('openDirectBtn');
const closeTabBtn = $('closeTabBtn');
const fireBtn = $('fireBtn');
const tabsBtn = $('tabsBtn');

const bookmarksGrid = $('bookmarksGrid');
const emptyBookmarks = $('emptyBookmarks');
const manageBookmarksBtn = $('manageBookmarksBtn');

const tabsOverlay = $('tabsOverlay');
const closeTabsOverlayBtn = $('closeTabsOverlayBtn');
const overlayNewTabBtn = $('overlayNewTabBtn');
const tabCards = $('tabCards');
const tabsSummary = $('tabsSummary');

const bookmarksOverlay = $('bookmarksOverlay');
const closeBookmarksOverlayBtn = $('closeBookmarksOverlayBtn');
const bookmarkList = $('bookmarkList');

const menuBtn = $('menuBtn');
const menu = $('menu');
const duplicateTabBtn = $('duplicateTabBtn');
const closeOtherTabsBtn = $('closeOtherTabsBtn');
const openSafariBtn = $('openSafariBtn');
const eraseAllBtn = $('eraseAllBtn');
const cancelMenuBtn = $('cancelMenuBtn');

let tabs = [];
let activeTabId = null;
let bookmarks = [];
let selectedEngine = 'duckduckgo';

const ENGINES = {
  duckduckgo: q => 'https://duckduckgo.com/?q=' + encodeURIComponent(q),
  brave: q => 'https://search.brave.com/search?q=' + encodeURIComponent(q),
  startpage: q => 'https://www.startpage.com/sp/search?query=' + encodeURIComponent(q)
};

function makeId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function normalizeTab(tab) {
  const url = typeof tab?.url === 'string' ? tab.url : '';
  const history = Array.isArray(tab?.history) && tab.history.length ? tab.history : (url ? [url] : []);
  let historyIndex = Number.isInteger(tab?.historyIndex) ? tab.historyIndex : history.length - 1;
  historyIndex = Math.max(-1, Math.min(historyIndex, history.length - 1));

  return {
    id: typeof tab?.id === 'string' ? tab.id : makeId(),
    title: typeof tab?.title === 'string' ? tab.title : (url ? titleForUrl(url) : 'New Tab'),
    url,
    history,
    historyIndex,
    createdAt: tab?.createdAt || Date.now(),
    updatedAt: tab?.updatedAt || Date.now()
  };
}

function newTab(url = '', title = 'New Tab') {
  return normalizeTab({
    id: makeId(),
    title,
    url,
    history: url ? [url] : [],
    historyIndex: url ? 0 : -1,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
}

function loadState() {
  try {
    let stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');

    if (!Array.isArray(stored)) {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_TABS_KEY) || '[]');
      if (Array.isArray(legacy) && legacy.length) {
        stored = legacy;
        activeTabId = localStorage.getItem(LEGACY_ACTIVE_KEY);
      }
    }

    tabs = Array.isArray(stored) ? stored.map(normalizeTab) : [];
    activeTabId = activeTabId || localStorage.getItem(ACTIVE_KEY);
    bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
    if (!Array.isArray(bookmarks)) bookmarks = [];
    selectedEngine = localStorage.getItem(ENGINE_KEY) || 'duckduckgo';
    if (!ENGINES[selectedEngine]) selectedEngine = 'duckduckgo';
  } catch (_) {
    tabs = [];
    bookmarks = [];
    activeTabId = null;
    selectedEngine = 'duckduckgo';
  }

  if (!tabs.length) {
    const first = newTab();
    tabs = [first];
    activeTabId = first.id;
  }

  if (!tabs.some(tab => tab.id === activeTabId)) {
    activeTabId = tabs[0].id;
  }

  searchEngine.value = selectedEngine;
  saveState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
    localStorage.setItem(ACTIVE_KEY, activeTabId || '');
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    localStorage.setItem(ENGINE_KEY, selectedEngine);
  } catch (_) {}
}

function getActiveTab() {
  return tabs.find(tab => tab.id === activeTabId) || null;
}

function searchUrl(query) {
  return (ENGINES[selectedEngine] || ENGINES.duckduckgo)(query);
}

function toUrl(value) {
  const v = value.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[^\s]+\.[^\s]+(?:\/.*)?$/.test(v)) return 'https://' + v;
  return searchUrl(v);
}

function safeHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (_) {
    return 'Web Page';
  }
}

function faviconUrl(url) {
  try {
    const host = new URL(url).hostname;
    return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`;
  } catch (_) {
    return '';
  }
}

function queryTitle(url) {
  try {
    const u = new URL(url);
    for (const key of ['q', 'query']) {
      const q = u.searchParams.get(key);
      if (q) return q.slice(0, 32);
    }
  } catch (_) {}
  return '';
}

function titleForUrl(url) {
  return queryTitle(url) || safeHost(url).slice(0, 32) || 'Web Page';
}

function currentIsBookmarked() {
  const tab = getActiveTab();
  return Boolean(tab?.url && bookmarks.some(b => b.url === tab.url));
}

function makeSiteIcon(url, sizeClass = '') {
  const wrap = document.createElement('span');
  wrap.className = 'siteIcon ' + sizeClass;

  if (!url) {
    wrap.textContent = '＋';
    return wrap;
  }

  const fallback = safeHost(url).charAt(0).toUpperCase() || 'W';
  const img = document.createElement('img');
  img.alt = '';
  img.loading = 'lazy';
  img.src = faviconUrl(url);
  img.addEventListener('error', () => {
    img.remove();
    wrap.textContent = fallback;
  });
  wrap.appendChild(img);
  return wrap;
}

function renderTabs() {
  tabsBar.innerHTML = '';

  tabs.forEach(tab => {
    const item = document.createElement('div');
    item.className = 'tab' + (tab.id === activeTabId ? ' active' : '');
    item.setAttribute('role', 'tab');
    item.setAttribute('aria-selected', tab.id === activeTabId ? 'true' : 'false');

    const select = document.createElement('button');
    select.type = 'button';
    select.className = 'tabSelect';

    const label = document.createElement('span');
    label.className = 'tabLabel';
    label.textContent = tab.title || 'New Tab';

    select.append(makeSiteIcon(tab.url), label);
    select.addEventListener('click', () => activateTab(tab.id));

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'tabClose';
    close.setAttribute('aria-label', `Close ${tab.title || 'tab'}`);
    close.textContent = '×';
    close.addEventListener('click', event => {
      event.stopPropagation();
      closeTab(tab.id);
    });

    item.append(select, close);
    tabsBar.appendChild(item);
  });

  tabCount.textContent = String(tabs.length);
}

function renderNavState() {
  const tab = getActiveTab();
  backBtn.disabled = !tab || tab.historyIndex <= 0;
  forwardBtn.disabled = !tab || tab.historyIndex < 0 || tab.historyIndex >= tab.history.length - 1;
  refreshBtn.disabled = !tab?.url;
  bookmarkBtn.disabled = !tab?.url;
  bookmarkBtn.textContent = currentIsBookmarked() ? '★' : '☆';
  bookmarkBtn.classList.toggle('bookmarked', currentIsBookmarked());
}

function renderBookmarks() {
  bookmarksGrid.innerHTML = '';
  emptyBookmarks.classList.toggle('hidden', bookmarks.length > 0);

  bookmarks.slice(0, 8).forEach(bookmark => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bookmarkTile';

    const text = document.createElement('span');
    text.className = 'bookmarkText';

    const title = document.createElement('strong');
    title.textContent = bookmark.title || titleForUrl(bookmark.url);

    const host = document.createElement('small');
    host.textContent = safeHost(bookmark.url);

    text.append(title, host);
    button.append(makeSiteIcon(bookmark.url, 'large'), text);
    button.addEventListener('click', () => navigateCurrent(bookmark.url));
    bookmarksGrid.appendChild(button);
  });
}

function renderActiveTab({ reloadFrame = true } = {}) {
  const tab = getActiveTab();
  if (!tab) return;

  address.value = tab.url || '';

  if (!tab.url) {
    startPage.classList.remove('hidden');
    viewer.classList.add('hidden');
    webFrame.removeAttribute('src');
    startAddress.value = '';
  } else {
    startPage.classList.add('hidden');
    viewer.classList.remove('hidden');
    viewerStatus.textContent =
      `Viewing ${safeHost(tab.url)}. Some sites block embedded viewing; use Open page if needed.`;
    if (reloadFrame) webFrame.src = tab.url;
  }

  renderTabs();
  renderNavState();
  renderBookmarks();
}

function activateTab(id) {
  if (!tabs.some(tab => tab.id === id)) return;
  activeTabId = id;
  saveState();
  renderActiveTab();
  hideOverlay(tabsOverlay);
}

function addTab(url = '') {
  const tab = newTab(url, url ? titleForUrl(url) : 'New Tab');
  tabs.push(tab);
  activeTabId = tab.id;
  saveState();
  renderActiveTab();
  hideOverlay(tabsOverlay);
  if (!url) setTimeout(() => startAddress.focus(), 0);
}

function pushHistory(tab, url) {
  if (tab.historyIndex >= 0 && tab.history[tab.historyIndex] === url) return;
  tab.history = tab.history.slice(0, tab.historyIndex + 1);
  tab.history.push(url);
  tab.historyIndex = tab.history.length - 1;
}

function applyTabUrl(tab, url, { addHistory = true } = {}) {
  tab.url = url;
  tab.title = titleForUrl(url);
  tab.updatedAt = Date.now();
  if (addHistory) pushHistory(tab, url);
}

function navigateCurrent(rawValue) {
  const url = toUrl(rawValue);
  if (!url) return;

  let tab = getActiveTab();
  if (!tab) {
    tab = newTab();
    tabs.push(tab);
    activeTabId = tab.id;
  }

  applyTabUrl(tab, url);
  saveState();
  renderActiveTab();
}

function goHistory(delta) {
  const tab = getActiveTab();
  if (!tab) return;

  const nextIndex = tab.historyIndex + delta;
  if (nextIndex < 0 || nextIndex >= tab.history.length) return;

  tab.historyIndex = nextIndex;
  tab.url = tab.history[nextIndex];
  tab.title = titleForUrl(tab.url);
  tab.updatedAt = Date.now();
  saveState();
  renderActiveTab();
}

function refreshCurrent() {
  const tab = getActiveTab();
  if (!tab?.url) return;
  webFrame.src = 'about:blank';
  requestAnimationFrame(() => {
    webFrame.src = tab.url;
  });
}

function goHome() {
  const tab = getActiveTab();
  if (!tab) return;
  tab.url = '';
  tab.title = 'New Tab';
  tab.updatedAt = Date.now();
  saveState();
  renderActiveTab();
}

function closeTab(id) {
  const index = tabs.findIndex(tab => tab.id === id);
  if (index === -1) return;

  const wasActive = id === activeTabId;
  tabs.splice(index, 1);

  if (!tabs.length) {
    const replacement = newTab();
    tabs = [replacement];
    activeTabId = replacement.id;
  } else if (wasActive) {
    activeTabId = tabs[Math.min(index, tabs.length - 1)].id;
  }

  saveState();
  renderActiveTab();
  renderTabCards();
}

function toggleBookmark() {
  const tab = getActiveTab();
  if (!tab?.url) return;

  const index = bookmarks.findIndex(b => b.url === tab.url);
  if (index >= 0) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.unshift({
      id: makeId(),
      title: tab.title || titleForUrl(tab.url),
      url: tab.url,
      createdAt: Date.now()
    });
  }

  saveState();
  renderBookmarks();
  renderNavState();
}

function fireSession() {
  const confirmed = confirm('Close every open tab and erase this browser session? Bookmarks and search-engine choice will be kept.');
  if (!confirmed) return;

  tabs = [newTab()];
  activeTabId = tabs[0].id;

  try {
    sessionStorage.clear();
    localStorage.removeItem(LEGACY_TABS_KEY);
    localStorage.removeItem(LEGACY_ACTIVE_KEY);
  } catch (_) {}

  webFrame.src = 'about:blank';
  saveState();
  renderActiveTab();
}

function eraseAllAppData() {
  const confirmed = confirm('Erase all tabs, bookmarks, and browser settings stored by this app?');
  if (!confirmed) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_KEY);
    localStorage.removeItem(BOOKMARKS_KEY);
    localStorage.removeItem(ENGINE_KEY);
    localStorage.removeItem(LEGACY_TABS_KEY);
    localStorage.removeItem(LEGACY_ACTIVE_KEY);
    sessionStorage.clear();
  } catch (_) {}

  tabs = [newTab()];
  activeTabId = tabs[0].id;
  bookmarks = [];
  selectedEngine = 'duckduckgo';
  searchEngine.value = selectedEngine;
  webFrame.src = 'about:blank';
  saveState();
  hideOverlay(menu);
  renderActiveTab();
}

function openCurrentDirect() {
  const tab = getActiveTab();
  if (!tab?.url) return;
  window.open(tab.url, '_blank', 'noopener,noreferrer');
}

function renderTabCards() {
  tabCards.innerHTML = '';
  tabsSummary.textContent = `${tabs.length} ${tabs.length === 1 ? 'tab' : 'tabs'}`;

  tabs.forEach(tab => {
    const card = document.createElement('article');
    card.className = 'tabCard' + (tab.id === activeTabId ? ' active' : '');

    const preview = document.createElement('button');
    preview.type = 'button';
    preview.className = 'tabPreview';

    const fakeBar = document.createElement('div');
    fakeBar.className = 'fakeBrowserBar';
    fakeBar.append(makeSiteIcon(tab.url));

    const fakeAddress = document.createElement('span');
    fakeAddress.textContent = tab.url ? safeHost(tab.url) : 'New Tab';
    fakeBar.append(fakeAddress);

    const previewBody = document.createElement('div');
    previewBody.className = 'previewBody';
    previewBody.append(makeSiteIcon(tab.url, 'previewIcon'));

    const details = document.createElement('div');
    details.className = 'tabCardDetails';

    const title = document.createElement('strong');
    title.textContent = tab.title || 'New Tab';

    const url = document.createElement('small');
    url.textContent = tab.url || 'Start page';

    details.append(title, url);
    preview.append(fakeBar, previewBody, details);
    preview.addEventListener('click', () => activateTab(tab.id));

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'cardClose';
    close.textContent = '×';
    close.setAttribute('aria-label', `Close ${tab.title || 'tab'}`);
    close.addEventListener('click', e => {
      e.stopPropagation();
      closeTab(tab.id);
    });

    card.append(preview, close);
    tabCards.appendChild(card);
  });
}

function renderBookmarkManager() {
  bookmarkList.innerHTML = '';

  if (!bookmarks.length) {
    const empty = document.createElement('p');
    empty.className = 'emptyState';
    empty.textContent = 'No bookmarks yet.';
    bookmarkList.appendChild(empty);
    return;
  }

  bookmarks.forEach(bookmark => {
    const row = document.createElement('div');
    row.className = 'bookmarkRow';

    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'bookmarkOpen';

    const info = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = bookmark.title || titleForUrl(bookmark.url);
    const host = document.createElement('small');
    host.textContent = bookmark.url;
    info.append(title, host);

    open.append(makeSiteIcon(bookmark.url, 'large'), info);
    open.addEventListener('click', () => {
      navigateCurrent(bookmark.url);
      hideOverlay(bookmarksOverlay);
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'removeBookmark';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      bookmarks = bookmarks.filter(b => b.id !== bookmark.id);
      saveState();
      renderBookmarks();
      renderBookmarkManager();
      renderNavState();
    });

    row.append(open, remove);
    bookmarkList.appendChild(row);
  });
}

function showOverlay(el) {
  el.classList.remove('hidden');
}

function hideOverlay(el) {
  el.classList.add('hidden');
}

form.addEventListener('submit', e => {
  e.preventDefault();
  navigateCurrent(address.value);
});

startSearchForm.addEventListener('submit', e => {
  e.preventDefault();
  navigateCurrent(startAddress.value);
});

searchEngine.addEventListener('change', () => {
  selectedEngine = searchEngine.value;
  saveState();
});

backBtn.addEventListener('click', () => goHistory(-1));
forwardBtn.addEventListener('click', () => goHistory(1));
refreshBtn.addEventListener('click', refreshCurrent);
homeBtn.addEventListener('click', goHome);
bookmarkBtn.addEventListener('click', toggleBookmark);
newTabBtn.addEventListener('click', () => addTab());
closeTabBtn.addEventListener('click', () => activeTabId && closeTab(activeTabId));
fireBtn.addEventListener('click', fireSession);
openDirectBtn.addEventListener('click', openCurrentDirect);

tabsBtn.addEventListener('click', () => {
  renderTabCards();
  showOverlay(tabsOverlay);
});

closeTabsOverlayBtn.addEventListener('click', () => hideOverlay(tabsOverlay));
overlayNewTabBtn.addEventListener('click', () => addTab());

manageBookmarksBtn.addEventListener('click', () => {
  renderBookmarkManager();
  showOverlay(bookmarksOverlay);
});
closeBookmarksOverlayBtn.addEventListener('click', () => hideOverlay(bookmarksOverlay));

document.querySelectorAll('[data-url]').forEach(button => {
  button.addEventListener('click', () => navigateCurrent(button.dataset.url));
});

menuBtn.addEventListener('click', () => showOverlay(menu));
cancelMenuBtn.addEventListener('click', () => hideOverlay(menu));

duplicateTabBtn.addEventListener('click', () => {
  const tab = getActiveTab();
  if (tab) addTab(tab.url);
  hideOverlay(menu);
});

closeOtherTabsBtn.addEventListener('click', () => {
  const tab = getActiveTab();
  if (!tab) return;
  tabs = [tab];
  activeTabId = tab.id;
  saveState();
  renderActiveTab({ reloadFrame: false });
  hideOverlay(menu);
});

openSafariBtn.addEventListener('click', () => {
  openCurrentDirect();
  hideOverlay(menu);
});

eraseAllBtn.addEventListener('click', eraseAllAppData);

for (const overlay of [tabsOverlay, bookmarksOverlay, menu]) {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) hideOverlay(overlay);
  });
}

window.addEventListener('pageshow', () => {
  loadState();
  renderActiveTab();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveState();
});

loadState();
renderActiveTab();
