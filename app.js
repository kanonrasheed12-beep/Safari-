const STORAGE_KEY = 'privateBrowser.tabs.v2';
const ACTIVE_KEY = 'privateBrowser.activeTab.v2';

const form = document.getElementById('searchForm');
const address = document.getElementById('address');
const startSearchForm = document.getElementById('startSearchForm');
const startAddress = document.getElementById('startAddress');
const tabsBar = document.getElementById('tabsBar');
const newTabBtn = document.getElementById('newTabBtn');
const homeBtn = document.getElementById('homeBtn');
const startPage = document.getElementById('startPage');
const viewer = document.getElementById('viewer');
const webFrame = document.getElementById('webFrame');
const viewerStatus = document.getElementById('viewerStatus');
const openDirectBtn = document.getElementById('openDirectBtn');
const tabCount = document.getElementById('tabCount');
const closeTabBtn = document.getElementById('closeTabBtn');
const eraseBtn = document.getElementById('eraseBtn');
const tabsBtn = document.getElementById('tabsBtn');

const menuBtn = document.getElementById('menuBtn');
const menu = document.getElementById('menu');
const duplicateTabBtn = document.getElementById('duplicateTabBtn');
const closeOtherTabsBtn = document.getElementById('closeOtherTabsBtn');
const openSafariBtn = document.getElementById('openSafariBtn');
const cancelMenuBtn = document.getElementById('cancelMenuBtn');

let tabs = [];
let activeTabId = null;

function makeId() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function newTab(url = '', title = 'New Tab') {
  return {
    id: makeId(),
    title,
    url,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(stored)) {
      tabs = stored.filter(tab => tab && typeof tab.id === 'string');
    }
    activeTabId = localStorage.getItem(ACTIVE_KEY);
  } catch (_) {
    tabs = [];
    activeTabId = null;
  }

  if (!tabs.length) {
    const first = newTab();
    tabs = [first];
    activeTabId = first.id;
  }

  if (!tabs.some(tab => tab.id === activeTabId)) {
    activeTabId = tabs[0].id;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
    localStorage.setItem(ACTIVE_KEY, activeTabId || '');
  } catch (_) {}
}

function getActiveTab() {
  return tabs.find(tab => tab.id === activeTabId) || null;
}

function toUrl(value) {
  const v = value.trim();
  if (!v) return null;

  if (/^https?:\/\//i.test(v)) return v;

  if (/^[^\s]+\.[^\s]+(?:\/.*)?$/.test(v)) {
    return 'https://' + v;
  }

  return 'https://duckduckgo.com/?q=' + encodeURIComponent(v);
}

function safeHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (_) {
    return 'Web Page';
  }
}

function titleForUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('duckduckgo.com') && u.searchParams.get('q')) {
      return u.searchParams.get('q').slice(0, 28);
    }
    return safeHost(url).slice(0, 28);
  } catch (_) {
    return 'New Tab';
  }
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

    const favicon = document.createElement('span');
    favicon.className = 'favicon';
    favicon.textContent = tab.url ? safeHost(tab.url).charAt(0).toUpperCase() : '＋';

    const label = document.createElement('span');
    label.className = 'tabLabel';
    label.textContent = tab.title || 'New Tab';

    select.append(favicon, label);
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
    viewerStatus.textContent = `Viewing ${safeHost(tab.url)}. If the site blocks in-app viewing, use Open page.`;

    if (reloadFrame) {
      webFrame.src = tab.url;
    }
  }

  renderTabs();
}

function activateTab(id) {
  if (!tabs.some(tab => tab.id === id)) return;
  activeTabId = id;
  saveState();
  renderActiveTab();
}

function addTab(url = '') {
  const tab = newTab(url, url ? titleForUrl(url) : 'New Tab');
  tabs.push(tab);
  activeTabId = tab.id;
  saveState();
  renderActiveTab();
  if (!url) {
    setTimeout(() => startAddress.focus(), 0);
  }
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

  tab.url = url;
  tab.title = titleForUrl(url);
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
    const nextIndex = Math.min(index, tabs.length - 1);
    activeTabId = tabs[nextIndex].id;
  }

  saveState();
  renderActiveTab();
}

function eraseAll() {
  const confirmed = confirm('Erase all saved tabs from this device?');
  if (!confirmed) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_KEY);
    sessionStorage.clear();
  } catch (_) {}

  const first = newTab();
  tabs = [first];
  activeTabId = first.id;
  saveState();
  renderActiveTab();
}

function openCurrentDirect() {
  const tab = getActiveTab();
  if (!tab || !tab.url) return;

  // On iOS Home Screen PWAs, target=_blank gives the browser the best chance
  // to open a normal top-level browsing context when iframe embedding is blocked.
  window.open(tab.url, '_blank', 'noopener,noreferrer');
}

function showMenu() {
  menu.classList.remove('hidden');
}

function hideMenu() {
  menu.classList.add('hidden');
}

form.addEventListener('submit', event => {
  event.preventDefault();
  navigateCurrent(address.value);
});

startSearchForm.addEventListener('submit', event => {
  event.preventDefault();
  navigateCurrent(startAddress.value);
});

newTabBtn.addEventListener('click', () => addTab());

homeBtn.addEventListener('click', () => {
  const tab = getActiveTab();
  if (!tab) return;
  tab.url = '';
  tab.title = 'New Tab';
  tab.updatedAt = Date.now();
  saveState();
  renderActiveTab();
});

closeTabBtn.addEventListener('click', () => {
  if (activeTabId) closeTab(activeTabId);
});

eraseBtn.addEventListener('click', eraseAll);
openDirectBtn.addEventListener('click', openCurrentDirect);

tabsBtn.addEventListener('click', () => {
  tabsBar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

document.querySelectorAll('[data-url]').forEach(button => {
  button.addEventListener('click', () => navigateCurrent(button.dataset.url));
});

menuBtn.addEventListener('click', showMenu);
cancelMenuBtn.addEventListener('click', hideMenu);

duplicateTabBtn.addEventListener('click', () => {
  const tab = getActiveTab();
  if (tab) addTab(tab.url);
  hideMenu();
});

closeOtherTabsBtn.addEventListener('click', () => {
  const tab = getActiveTab();
  if (!tab) return;
  tabs = [tab];
  activeTabId = tab.id;
  saveState();
  renderActiveTab({ reloadFrame: false });
  hideMenu();
});

openSafariBtn.addEventListener('click', () => {
  openCurrentDirect();
  hideMenu();
});

menu.addEventListener('click', event => {
  if (event.target === menu) hideMenu();
});

window.addEventListener('pageshow', () => {
  loadState();
  renderActiveTab();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveState();
});

// Initial boot
loadState();
renderActiveTab();
