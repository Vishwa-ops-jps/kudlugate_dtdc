// Client-side launch guard: launches on 20 October 2026 at 2:20 PM IST (UTC+05:30)
(function() {
  const params = new URLSearchParams(window.location.search);
  const isLock = params.get('preview') === 'false' || params.get('lock') === 'true';
  if (isLock) {
    try { localStorage.removeItem('dev_preview'); } catch(e){}
    document.cookie = "dev_preview=; path=/; max-age=0";
  }

  const isDevHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const hasQuery = params.get('preview') === 'true';
  if (hasQuery) {
    try { localStorage.setItem('dev_preview', '1'); } catch(e){}
    document.cookie = "dev_preview=1; path=/; max-age=2592000";
  }
  let hasStorage = false;
  try { hasStorage = localStorage.getItem('dev_preview') === '1'; } catch(e){}
  const hasCookie = document.cookie.indexOf('dev_preview=1') !== -1;

  const launchTime = new Date('2026-10-20T14:20:00+05:30').getTime();
  const path = window.location.pathname.toLowerCase();
  const isBypassed = !isLock && (isDevHost || hasQuery || hasStorage || hasCookie);

  if (!isBypassed && Date.now() < launchTime && !path.startsWith('/admin') && !path.includes('launching.html')) {
    window.location.replace('/launching.html');
    return;
  }

  // Show subtle dev preview banner if site is in preview mode prior to launch
  if (isBypassed && Date.now() < launchTime && !path.startsWith('/admin') && !path.includes('launching.html')) {
    document.addEventListener('DOMContentLoaded', function() {
      const pill = document.createElement('div');
      pill.id = 'dev-preview-pill';
      pill.innerHTML = `
        <span>🛠️ <strong>Dev Preview Mode</strong> (Launch: 20 Oct 2:20 PM)</span>
        <a href="/launching.html" style="color:#38bdf8;text-decoration:underline;margin-left:8px;">View Countdown</a>
        <a href="/launching.html?lock=true" style="color:#f87171;text-decoration:underline;margin-left:8px;" onclick="try{localStorage.removeItem('dev_preview');}catch(e){}">Lock Site</a>
      `;
      pill.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:99999;background:rgba(15,23,42,0.92);color:#e2e8f0;font-size:12px;padding:7px 14px;border-radius:20px;border:1px solid rgba(56,189,248,0.4);box-shadow:0 4px 15px rgba(0,0,0,0.5);display:flex;align-items:center;font-family:sans-serif;backdrop-filter:blur(6px);';
      document.body.appendChild(pill);
    });
  }
})();

// Injects the site nav and footer into #site-header / #site-footer placeholders.
function renderChrome() {
  const currentUser = typeof Session !== 'undefined' ? Session.getUser() : null;
  const header = document.getElementById('site-header');
  if (header) {
    header.innerHTML = `
      <div class="topbar">
        <div class="wrap">
          <div class="topbar-ticker">
            <strong>Official Franchise Site:</strong> DK Enterprise Kudlu New Franchise · Fast, Safe &amp; Direct Delivery
          </div>
          <div class="call-cta">
            <span class="phone-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="#ffffff" aria-hidden="true"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.053 15.053 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.57 3.99c0-.55-.45-1-1-1H4.01c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.61c0-.55-.45-1-1-1z"/></svg></span>
            <span>
              <span class="call-text">Call Us Now</span><br>
              <a href="tel:+916366118850" class="call-number">+91 63661 18850</a>
            </span>
          </div>
        </div>
      </div>
      <nav class="site-nav">
        <div class="wrap">
          <a href="/" class="brand">
            <span class="brand-mark">DK</span>
            <span class="brand-text">DK Enterprise Kudlu New Franchise<small>Courier &amp; Cargo · Bengaluru</small></span>
          </a>
          <button class="nav-toggle" aria-label="Menu">&#9776;</button>
          <div class="nav-links" data-nav-links>
            <a href="/">Home</a>
            <a href="https://www.dtdc.com/track-your-shipment/" target="_blank" rel="noopener noreferrer">Track</a>
            <a href="/reviews.html">Reviews</a>
            <a class="whatsapp-contact" href="https://wa.me/916366118850?text=${encodeURIComponent('Hello DK Enterprise Kudlu New Franchise, I need help with a courier.')}" target="_blank" rel="noopener noreferrer"><span class="whatsapp-dot" aria-hidden="true"></span>WhatsApp</a>
            <span data-auth-slot style="display:flex;gap:6px;align-items:center;"></span>
          </div>
        </div>
      </nav>`;
  }
  const footer = document.getElementById('site-footer');
  if (footer) {
    footer.innerHTML = `
      <footer>
        <div class="wrap">
          <div>
            <div class="brand" style="margin-bottom:10px;">
              <span class="brand-mark">DK</span>
              <span class="brand-text" style="color:#fff;">DK Enterprise Kudlu New Franchise<small>Courier &amp; Cargo</small></span>
            </div>
            <p style="max-width:280px;font-size:13.5px;">Kudlu Gate, Bengaluru, Karnataka. Booking, tracking and delivery for local, state and national shipments.</p>
          </div>
          <div class="cols">
            <div>
              <h4>Services</h4>
              <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">
                <a href="https://www.dtdc.com/track-your-shipment/" target="_blank" rel="noopener noreferrer">Track a parcel</a>
                <a href="/b2b.html">B2B &amp; Corporate Courier</a>
                <a href="/relocation.html">Student &amp; IT Relocation</a>
                <a href="/reviews.html">Customer reviews</a>
              </div>
            </div>
            <div>
              <h4>Account</h4>
              <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">
                <a href="/login.html">Customer login</a>
                <a href="/register.html">Create account</a>
              </div>
            </div>
            <div>
              <h4>Support</h4>
              <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">
                <a href="tel:+916366118850">Call Support</a>
                <a href="https://wa.me/916366118850?text=${encodeURIComponent('Hello DK Enterprise, I need assistance.')}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                <a href="/admin/login.html" style="color:#8A94A6;">Staff login</a>
              </div>
            </div>
          </div>
        </div>
        <div class="fine">&copy; ${new Date().getFullYear()} DK Enterprise Kudlu New Franchise. Franchise site — independently operated.</div>
      </footer>`;
  }
  // AI assistant chat (bottom-left, all customer pages)
  if (!document.getElementById('ai-float')) {
    const btn = document.createElement('button');
    btn.id = 'ai-float';
    btn.type = 'button';
    btn.className = 'robot-ai-btn';
    btn.setAttribute('aria-label', 'Chat with AI Assistant');
    btn.innerHTML = `
      <svg class="robot-svg" viewBox="0 0 40 40" aria-hidden="true">
        <line x1="20" y1="9" x2="20" y2="4" stroke="#C6CCDA" stroke-width="2" stroke-linecap="round"/>
        <circle class="robot-antenna-light" cx="20" cy="3" r="2.5"/>
        <rect x="4" y="15" width="3" height="8" rx="1.5" fill="#E31E24"/>
        <rect x="33" y="15" width="3" height="8" rx="1.5" fill="#E31E24"/>
        <g class="robot-head">
          <rect x="7" y="9" width="26" height="20" rx="7" fill="#ffffff" stroke="#E2E6EE" stroke-width="1.2"/>
          <rect x="10" y="12" width="20" height="13" rx="4" fill="#0F172A"/>
          <ellipse class="robot-eye" cx="15" cy="18" rx="2.2" ry="2.6" fill="#00F0FF"/>
          <ellipse class="robot-eye" cx="25" cy="18" rx="2.2" ry="2.6" fill="#00F0FF"/>
          <path d="M17 22 Q20 24 23 22" stroke="#00F0FF" stroke-width="1.4" stroke-linecap="round" fill="none"/>
        </g>
        <rect x="16" y="29" width="8" height="3" rx="1.5" fill="#C6CCDA"/>
        <path d="M12 32 C12 30, 28 30, 28 32 L31 37 C31 38, 9 38, 9 37 Z" fill="#E31E24"/>
      </svg>`;

    const panel = document.createElement('div');
    panel.id = 'ai-panel';
    panel.style.cssText = 'position:fixed;left:24px;right:auto;bottom:90px;z-index:9999;width:340px;max-width:calc(100vw - 36px);height:440px;max-height:calc(100vh - 110px);background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(12,35,64,.3);display:none;flex-direction:column;overflow:hidden;font-family:inherit;border:1px solid #e2e8f0;';
    panel.innerHTML = '<div style="background:#e31837;color:#fff;padding:12px 14px;font-weight:600;display:flex;justify-content:space-between;align-items:center;"><span>DK Enterprise Assistant</span><button type="button" id="ai-close" aria-label="Close" style="background:none;border:0;color:#fff;font-size:20px;cursor:pointer;">&times;</button></div>'
      + '<div id="ai-msgs" style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#f8fafc;"></div>'
      + '<div style="display:flex;gap:6px;padding:10px;border-top:1px solid #e2e8f0;background:#fff;"><input id="ai-input" type="text" maxlength="1000" placeholder="Ask about booking, rates..." style="flex:1;padding:9px 10px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:14px;"><button type="button" id="ai-send" style="background:#e31837;color:#fff;border:0;border-radius:8px;padding:0 14px;cursor:pointer;font-weight:600;">Send</button></div>';
    
    document.body.appendChild(panel);
    document.body.appendChild(btn);

    const msgsEl = panel.querySelector('#ai-msgs');
    const input = panel.querySelector('#ai-input');
    const history = [];
    function addMsg(text, who) {
      const d = document.createElement('div');
      d.textContent = text;
      d.style.cssText = 'max-width:85%;padding:8px 11px;border-radius:12px;font-size:14px;line-height:1.4;white-space:pre-wrap;word-break:break-word;' +
        (who === 'user' ? 'align-self:flex-end;background:#d71920;color:#fff;' : 'align-self:flex-start;background:#fff;color:#222;border:1px solid #e5e5e5;');
      msgsEl.appendChild(d);
      msgsEl.scrollTop = msgsEl.scrollHeight;
      return d;
    }
    addMsg('Hi! I\u2019m the DK Enterprise AI assistant. Ask me about booking, rates or services.', 'bot');
    let busy = false;
    async function send() {
      const text = input.value.trim();
      if (!text || busy) return;
      busy = true; input.value = '';
      addMsg(text, 'user'); history.push({ role: 'user', content: text });
      const typing = addMsg('Typing\u2026', 'bot');
      try {
        const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Something went wrong.');
        typing.textContent = data.reply;
        history.push({ role: 'assistant', content: data.reply });
      } catch (e) {
        typing.textContent = e.message;
        history.pop();
      }
      msgsEl.scrollTop = msgsEl.scrollHeight;
      busy = false; input.focus();
    }
    panel.querySelector('#ai-send').addEventListener('click', send);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
    btn.addEventListener('click', () => {
      const isOpen = panel.style.display === 'flex';
      panel.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen) {
        input.focus();
        const waP = document.getElementById('wa-quick-panel');
        const waB = document.getElementById('wa-float-btn');
        if (waP) waP.classList.remove('is-visible');
        if (waB) waB.classList.remove('is-open');
      }
    });
    panel.querySelector('#ai-close').addEventListener('click', () => { panel.style.display = 'none'; });
  }

  // Floating WhatsApp Quick Action Widget (bottom-right, all customer pages)
  if (!document.getElementById('wa-float-btn')) {
    const waBtn = document.createElement('button');
    waBtn.id = 'wa-float-btn';
    waBtn.type = 'button';
    waBtn.className = 'wa-float-btn';
    waBtn.setAttribute('aria-label', 'WhatsApp Quick Actions');
    waBtn.innerHTML = `
      <span class="wa-online-pulse"></span>
      <span class="wa-icon-holder">
        <svg class="wa-brand-svg" viewBox="0 0 24 24" width="28" height="28" fill="#ffffff">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.705 1.754zm6.097-4.148l.437.259c1.554.921 3.33 1.409 5.145 1.41 5.46 0 9.902-4.442 9.904-9.9 0-2.645-1.03-5.132-2.903-7.006-1.874-1.874-4.362-2.903-7.007-2.903-5.462 0-9.903 4.442-9.905 9.9-.001 1.887.521 3.727 1.51 5.323l.285.457-1.002 3.662 3.746-.982z"/>
        </svg>
        <svg class="wa-close-svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </span>`;

    const waPanel = document.createElement('div');
    waPanel.id = 'wa-quick-panel';
    waPanel.className = 'wa-quick-panel';
    waPanel.innerHTML = `
      <div class="wa-panel-head">
        <div class="wa-panel-avatar">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="#ffffff">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.705 1.754zm6.097-4.148l.437.259c1.554.921 3.33 1.409 5.145 1.41 5.46 0 9.902-4.442 9.904-9.9 0-2.645-1.03-5.132-2.903-7.006-1.874-1.874-4.362-2.903-7.007-2.903-5.462 0-9.903 4.442-9.905 9.9-.001 1.887.521 3.727 1.51 5.323l.285.457-1.002 3.662 3.746-.982z"/>
          </svg>
        </div>
        <div class="wa-panel-title">
          <div class="wa-panel-name">DK Enterprise Kudlu Gate</div>
          <div class="wa-panel-status">
            <span class="wa-status-dot"></span> Online · Replies in minutes
          </div>
        </div>
        <button type="button" class="wa-panel-close-btn" id="wa-panel-close" aria-label="Close">&times;</button>
      </div>

      <div class="wa-panel-body">
        <div class="wa-chat-bubble">
          <p class="wa-bubble-text">Hello! 👋 Welcome to DK Enterprise Kudlu New Franchise. How can we help you today?</p>
          <span class="wa-bubble-time">Just now</span>
        </div>

        <div class="wa-actions-label">Quick Actions</div>
        <div class="wa-actions-list">
          <a href="https://wa.me/916366118850?text=${encodeURIComponent('Hello DK Enterprise Kudlu Gate, I want to schedule a doorstep parcel pickup from my address. Please let me know the available time slots.')}" target="_blank" rel="noopener noreferrer" class="wa-action-item">
            <span class="wa-action-icon">📦</span>
            <div class="wa-action-texts">
              <span class="wa-action-main">Schedule a Pickup</span>
              <span class="wa-action-sub">Doorstep collection at Kudlu Gate</span>
            </div>
            <span class="wa-action-arrow">→</span>
          </a>

          <a href="https://wa.me/916366118850?text=${encodeURIComponent('Hello DK Enterprise Kudlu Gate, I need a courier rate estimate. My destination pincode is: [  ] and parcel weight is approx: [  ] kg.')}" target="_blank" rel="noopener noreferrer" class="wa-action-item">
            <span class="wa-action-icon">💰</span>
            <div class="wa-action-texts">
              <span class="wa-action-main">Get Price Estimate</span>
              <span class="wa-action-sub">Domestic &amp; International courier</span>
            </div>
            <span class="wa-action-arrow">→</span>
          </a>

          <a href="https://maps.app.goo.gl/Bp4kTUK2omVuxT347?g_st=awb" target="_blank" rel="noopener noreferrer" class="wa-action-item">
            <span class="wa-action-icon">📍</span>
            <div class="wa-action-texts">
              <span class="wa-action-main">Store Directions</span>
              <span class="wa-action-sub">Bren Palms, Kudlu · Open 9:30 AM–8:30 PM</span>
            </div>
            <span class="wa-action-arrow">↗</span>
          </a>

          <a href="https://wa.me/916366118850?text=${encodeURIComponent('Hello DK Enterprise Kudlu Gate, I have an inquiry about courier services.')}" target="_blank" rel="noopener noreferrer" class="wa-action-item">
            <span class="wa-action-icon">💬</span>
            <div class="wa-action-texts">
              <span class="wa-action-main">Direct Chat</span>
              <span class="wa-action-sub">Talk directly with store staff</span>
            </div>
            <span class="wa-action-arrow">→</span>
          </a>
        </div>
      </div>

      <div class="wa-panel-footer">
        DK Enterprise Kudlu New Franchise · Fast &amp; Safe Delivery
      </div>`;

    document.body.appendChild(waPanel);
    document.body.appendChild(waBtn);

    function toggleWa(open) {
      const show = open !== undefined ? open : !waPanel.classList.contains('is-visible');
      if (show) {
        waPanel.classList.add('is-visible');
        waBtn.classList.add('is-open');
        const aiP = document.getElementById('ai-panel');
        if (aiP) aiP.style.display = 'none';
      } else {
        waPanel.classList.remove('is-visible');
        waBtn.classList.remove('is-open');
      }
    }

    waBtn.addEventListener('click', () => toggleWa());
    waPanel.querySelector('#wa-panel-close').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWa(false);
    });
  }
  // re-run the active-link + auth-slot logic now that nav exists
  document.dispatchEvent(new Event('DOMContentLoaded'));

  // Initialize dynamic scroll up/down animations & content reveals
  initScrollAnimations();
}

/**
 * Dynamic Directional Scroll Animations:
 * 1. Scroll Down: Top header hides smoothly ("above part should be invisible").
 * 2. Scroll Up: Bottom floating widgets hide smoothly ("down part should be invisible"), top header returns.
 * 3. At top/bottom: Natural accessible states.
 * 4. Elements reveal smoothly into view as you scroll up and down.
 */
function initScrollAnimations() {
  let lastScrollY = Math.max(0, window.pageYOffset || document.documentElement.scrollTop || 0);
  let isTicking = false;
  const nav = document.querySelector('.site-nav');
  const waBtn = document.getElementById('wa-float-btn');
  const aiBtn = document.getElementById('ai-float');
  const waPanel = document.getElementById('wa-quick-panel');
  const aiPanel = document.getElementById('ai-panel');

  function handleScroll() {
    const currentScrollY = Math.max(0, window.pageYOffset || document.documentElement.scrollTop || 0);
    const scrollDelta = currentScrollY - lastScrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const isNearBottom = (currentScrollY + windowHeight) >= (docHeight - 60);

    // Keep nav visible if mobile menu drawer is open
    const isMobileNavOpen = !!document.querySelector('.nav-links.open');

    // Hysteresis threshold to prevent vibration/micro-movement triggers
    if (Math.abs(scrollDelta) > 5 || currentScrollY <= 40 || isNearBottom) {
      if (currentScrollY <= 60) {
        // At top of page: header and bottom widgets are visible
        if (nav) nav.classList.remove('nav-hidden');
        if (waBtn) waBtn.classList.remove('wa-hidden');
        if (aiBtn) aiBtn.classList.remove('robot-hidden');
      } else if (isNearBottom) {
        // Near page bottom: bottom quick widgets stay visible
        if (waBtn) waBtn.classList.remove('wa-hidden');
        if (aiBtn) aiBtn.classList.remove('robot-hidden');
      } else if (scrollDelta > 0) {
        // SCROLLING DOWN:
        // Top header becomes invisible
        if (nav && !isMobileNavOpen) {
          nav.classList.add('nav-hidden');
        }
        // Bottom widgets become visible
        if (waBtn) waBtn.classList.remove('wa-hidden');
        if (aiBtn) aiBtn.classList.remove('robot-hidden');
      } else {
        // SCROLLING UP:
        // Top header becomes visible
        if (nav) nav.classList.remove('nav-hidden');
        // Bottom widgets become invisible
        if (waBtn) {
          waBtn.classList.add('wa-hidden');
          if (waPanel && waPanel.classList.contains('is-visible')) {
            waPanel.classList.remove('is-visible');
            waBtn.classList.remove('is-open');
          }
        }
        if (aiBtn) {
          aiBtn.classList.add('robot-hidden');
          if (aiPanel && aiPanel.style.display === 'flex') {
            aiPanel.style.display = 'none';
          }
        }
      }
      lastScrollY = currentScrollY;
    }
    isTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!isTicking) {
      window.requestAnimationFrame(handleScroll);
      isTicking = true;
    }
  }, { passive: true });

  // Initial trigger to configure visibility based on load position
  handleScroll();

  // Scroll reveal observer for elements across the website
  initScrollReveal();
}

function initScrollReveal() {
  const explicit = Array.from(document.querySelectorAll('.scroll-reveal, .scroll-reveal-scale'));
  const autoTargets = Array.from(document.querySelectorAll(
    '.service-bullet-item, .b2b-feature-card, .relocation-card, .b2b-card, .contact-item-card, .why-list li, .trust-score-card, .review-card-modern, .info-grid > div, .map-embed'
  ));

  const allElements = Array.from(new Set([...explicit, ...autoTargets]));
  allElements.forEach((el) => {
    if (!el.classList.contains('scroll-reveal') && !el.classList.contains('scroll-reveal-scale')) {
      el.classList.add('scroll-reveal');
      const parent = el.parentElement;
      if (parent) {
        const idx = Array.from(parent.children).indexOf(el);
        if (idx >= 0 && idx < 6) {
          el.classList.add('stagger-' + ((idx % 6) + 1));
        }
      }
    }
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        } else if (entry.boundingClientRect.top > window.innerHeight) {
          // Re-trigger animation when scrolled back down
          entry.target.classList.remove('in-view');
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.08
    });

    allElements.forEach(el => observer.observe(el));
  } else {
    allElements.forEach(el => el.classList.add('in-view'));
  }
}
document.addEventListener('DOMContentLoaded', renderChrome, { once: true });
