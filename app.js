const form = document.getElementById('searchForm');
const address = document.getElementById('address');
const clearBtn = document.getElementById('clearBtn');
const duckBtn = document.getElementById('duckBtn');
const privateSafariBtn = document.getElementById('privateSafariBtn');

function toUrl(value) {
  const v = value.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[^\s]+\.[^\s]+$/.test(v)) return 'https://' + v;
  return 'https://duckduckgo.com/?q=' + encodeURIComponent(v);
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const url = toUrl(address.value);
  if (url) window.location.href = url;
});

duckBtn.addEventListener('click', () => {
  window.location.href = 'https://duckduckgo.com/';
});

clearBtn.addEventListener('click', () => {
  address.value = '';
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (_) {}
  address.focus();
});

privateSafariBtn.addEventListener('click', () => {
  alert('On iPhone: open Safari, tap the Tabs button, choose Private, then tap +. Apple does not allow a website to force Safari into Private mode automatically.');
});
