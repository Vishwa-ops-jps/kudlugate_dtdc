// ---------- API helper ----------
const API = {
  base: '/api',
  async request(path, { method = 'GET', body, auth = true } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = localStorage.getItem('token');
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(this.base + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }
};

// ---------- File download helper (for PDF receipts/labels) ----------
// Regular <a href> links can't carry the Authorization header, so downloads
// that require auth (e.g. a staff-only shipping label) are fetched as a
// blob and saved client-side instead.
async function downloadFile(path, filename) {
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API.base + path, { headers });
  if (!res.ok) {
    let msg = 'Could not download the file.';
    try { const data = await res.json(); msg = data.error || msg; } catch {}
    throw new Error(msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ---------- Session helpers ----------
const Session = {
  getUser() {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  },
  set(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  logout(redirect = '/') {
    this.clear();
    window.location.href = redirect;
  }
};

// ---------- Nav mobile toggle + active link + auth-aware CTA ----------
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }

  const path = window.location.pathname;
  const current = path.split('/').filter(Boolean).pop() || 'index.html';

  document.querySelectorAll('.nav-links a').forEach((a) => {
    a.classList.remove('active');
    const href = a.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) return;

    if (href === '/' || href === '/index.html') {
      if (path === '/' || path === '/index.html' || !current || current === 'index.html') {
        a.classList.add('active');
      }
    } else {
      const page = href.split('/').filter(Boolean).pop();
      if (page && page === current) {
        a.classList.add('active');
      }
    }
  });

  const authSlot = document.querySelector('[data-auth-slot]');
  if (authSlot) {
    const user = Session.getUser();
    if (user && user.role === 'customer') {
      authSlot.innerHTML = `<a href="#" data-logout class="cta">Log Out</a>`;
    } else if (user) {
      authSlot.innerHTML = `<a href="/admin/dashboard.html">Staff Panel</a>`;
    } else {
      authSlot.innerHTML = `<a href="/login.html">Log In</a><a href="/register.html" class="cta">Sign Up</a>`;
    }
    const logoutLink = authSlot.querySelector('[data-logout]');
    if (logoutLink) logoutLink.addEventListener('click', (e) => { e.preventDefault(); Session.logout(); });
  }
});

// ---------- "Sign in with Google" helper ----------
// Loads Google's Identity Services script, fetches our server's client ID,
// and renders a Google button into the given element. `onToken(credential)`
// is called with the verified ID token once the customer picks an account.
async function renderGoogleButton(elementId, onToken) {
  const el = document.getElementById(elementId);
  if (!el) return;
  try {
    const { clientId } = await API.request('/auth/google-client-id', { auth: false });
    if (!clientId) { el.style.display = 'none'; return; }

    await new Promise((resolve, reject) => {
      if (window.google && window.google.accounts) return resolve();
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => onToken(response.credential)
    });
    window.google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', width: 320, text: 'continue_with' });
  } catch (err) {
    el.style.display = 'none';
  }
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function statusClass(status) {
  return 'status-' + String(status).replace(/\s+/g, '-');
}

function fmtDate(d) {
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
