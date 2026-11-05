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

/**
 * Calculates live store status in Indian Standard Time (IST, UTC+05:30).
 * Store hours: Monday to Saturday, 9:30 AM to 8:30 PM (Sunday closed).
 */
function getShopStatus() {
  try {
    const now = new Date();
    const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const istDate = new Date(istString);
    const day = istDate.getDay(); // 0 = Sunday, 1 = Mon, ..., 6 = Sat
    const currentMinutes = istDate.getHours() * 60 + istDate.getMinutes();
    const openMinutes = 9 * 60 + 30;   // 9:30 AM = 570 mins
    const closeMinutes = 20 * 60 + 30; // 8:30 PM = 1230 mins

    const isSunday = (day === 0);
    const isOpen = !isSunday && (currentMinutes >= openMinutes && currentMinutes < closeMinutes);

    let label = isOpen ? 'Open Now' : 'Closed';
    let detail = '';
    let badgeClass = isOpen ? 'status-open' : 'status-closed';

    if (isOpen) {
      detail = 'Closes at 8:30 PM';
    } else if (isSunday) {
      detail = 'Opens Mon 9:30 AM';
    } else if (currentMinutes < openMinutes) {
      detail = 'Opens today at 9:30 AM';
    } else {
      detail = (day === 6) ? 'Opens Mon 9:30 AM' : 'Opens tomorrow at 9:30 AM';
    }

    return { isOpen, label, detail, badgeClass };
  } catch (e) {
    return { isOpen: true, label: 'Open Now', detail: 'Mon–Sat 9:30 AM–8:30 PM', badgeClass: 'status-open' };
  }
}

// Injects the site nav and footer into #site-header / #site-footer placeholders.
function renderChrome() {
  const currentUser = typeof Session !== 'undefined' ? Session.getUser() : null;
  const shop = getShopStatus();

  const header = document.getElementById('site-header');
  if (header) {
    header.innerHTML = `
      <div class="topbar">
        <div class="wrap">
          <div class="topbar-ticker">
            <div class="topbar-status-badge ${shop.badgeClass}" title="Store Hours: Mon–Sat 9:30 AM – 8:30 PM IST">
              <span class="status-pulse-dot"></span>
              <span class="status-label"><strong>${shop.label}</strong></span>
              <span class="status-sub">· ${shop.detail}</span>
            </div>
            <span style="opacity:0.35;margin:0 4px;">|</span>
            <strong>DK Enterprise Kudlu New Franchise</strong> · Kudlu Gate, Bengaluru
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

  // Update any Store Hours card with the live status badge
  try {
    document.querySelectorAll('.contact-item-card').forEach(card => {
      const label = card.querySelector('.contact-label');
      if (label && label.textContent.trim().toLowerCase().includes('store hours')) {
        const val = card.querySelector('.contact-val');
        if (val && !val.querySelector('.live-status-pill')) {
          const pill = document.createElement('span');
          pill.className = `live-status-pill ${shop.isOpen ? 'open' : 'closed'}`;
          pill.style.marginLeft = '8px';
          pill.innerHTML = `<span class="pulse-dot"></span>${shop.label}`;
          val.appendChild(pill);
        }
      }
    });
  } catch(e){}

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
      <svg class="robot-svg" viewBox="0 0 100 115" aria-hidden="true">
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="60%" stop-color="#F1F5F9"/>
            <stop offset="100%" stop-color="#CBD5E1"/>
          </linearGradient>
          <linearGradient id="blueCapGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#2563EB"/>
            <stop offset="100%" stop-color="#1D4ED8"/>
          </linearGradient>
          <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1E3A8A"/>
            <stop offset="100%" stop-color="#0F172A"/>
          </linearGradient>
          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#38BDF8"/>
            <stop offset="65%" stop-color="#0284C7"/>
            <stop offset="100%" stop-color="#0F172A"/>
          </radialGradient>
          <linearGradient id="redBallGrad" x1="30%" y1="20%" x2="80%" y2="80%">
            <stop offset="0%" stop-color="#FF4D4D"/>
            <stop offset="40%" stop-color="#E31837"/>
            <stop offset="100%" stop-color="#880000"/>
          </linearGradient>
        </defs>

        <!-- Ground Hover Shadow -->
        <ellipse cx="50" cy="110" rx="22" ry="4" fill="#0C2340" class="robot-shadow"/>

        <!-- Dual Antennas with Red Glossy Spheres -->
        <path d="M28 26 L19 12" stroke="#CBD5E1" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="18" cy="11" r="5" fill="url(#redBallGrad)"/>
        <circle cx="16.5" cy="9.5" r="1.5" fill="#FFFFFF" opacity="0.85"/>

        <path d="M72 26 L81 12" stroke="#CBD5E1" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="82" cy="11" r="5" fill="url(#redBallGrad)"/>
        <circle cx="80.5" cy="9.5" r="1.5" fill="#FFFFFF" opacity="0.85"/>

        <!-- Earphone modules with red trim -->
        <rect x="14" y="27" width="9" height="19" rx="4.5" fill="url(#bodyGrad)" stroke="#CBD5E1" stroke-width="1.2"/>
        <path d="M16 32 L16 41" stroke="#E31837" stroke-width="2" stroke-linecap="round"/>
        
        <rect x="77" y="27" width="9" height="19" rx="4.5" fill="url(#bodyGrad)" stroke="#CBD5E1" stroke-width="1.2"/>
        <path d="M84 32 L84 41" stroke="#E31837" stroke-width="2" stroke-linecap="round"/>

        <!-- Head Group with subtle bob -->
        <g class="robot-head-bob">
          <!-- Helmet -->
          <rect x="21" y="16" width="58" height="46" rx="23" fill="url(#bodyGrad)" stroke="#CBD5E1" stroke-width="1.3"/>
          
          <!-- Blue Top Crest -->
          <path d="M30 25 C30 17, 70 17, 70 25 C66 31, 34 31, 30 25 Z" fill="url(#blueCapGrad)"/>
          <!-- White Forehead Plate -->
          <path d="M43 16.5 L57 16.5 L54 27 L46 27 Z" fill="#FFFFFF"/>

          <!-- Blue Visor Mask -->
          <rect x="25" y="26" width="50" height="24" rx="11" fill="url(#visorGrad)" stroke="#1D4ED8" stroke-width="1.4"/>

          <!-- Eyebrows -->
          <path d="M31 23 Q36 20 42 23" stroke="#0F172A" stroke-width="2.2" stroke-linecap="round" fill="none"/>
          <path d="M58 23 Q64 20 69 23" stroke="#0F172A" stroke-width="2.2" stroke-linecap="round" fill="none"/>

          <!-- Left Anime Eye -->
          <ellipse cx="37" cy="38" rx="6.5" ry="8" fill="url(#eyeGlow)"/>
          <ellipse cx="37" cy="38.5" rx="5" ry="6.5" fill="#061224"/>
          <circle cx="35" cy="35.5" r="2.2" fill="#FFFFFF" class="robot-eye-shine"/>
          <circle cx="39" cy="41.5" r="1.1" fill="#FFFFFF"/>

          <!-- Right Anime Eye -->
          <ellipse cx="63" cy="38" rx="6.5" ry="8" fill="url(#eyeGlow)"/>
          <ellipse cx="63" cy="38.5" rx="5" ry="6.5" fill="#061224"/>
          <circle cx="61" cy="35.5" r="2.2" fill="#FFFFFF" class="robot-eye-shine"/>
          <circle cx="65" cy="41.5" r="1.1" fill="#FFFFFF"/>

          <!-- Chin Speaker Accent -->
          <rect x="47" y="54" width="6" height="2" rx="1" fill="#E31837"/>
        </g>

        <!-- Neck Joint -->
        <rect x="45" y="60" width="10" height="4" rx="2" fill="#64748B"/>

        <!-- Glossy Hover Pod Torso -->
        <path d="M30 63 C30 59, 70 59, 70 63 C74 78, 62 100, 50 104 C38 100, 26 78, 30 63 Z" fill="url(#bodyGrad)" stroke="#CBD5E1" stroke-width="1.3"/>
        
        <!-- Chest Red Trim Curve -->
        <path d="M35 67 Q50 77 65 67" stroke="#E31837" stroke-width="2" stroke-linecap="round" fill="none"/>

        <!-- Red Triangular DTDC Chest Core -->
        <polygon points="50,71 44,80 56,80" fill="url(#redBallGrad)"/>

        <!-- Left Articulated Arm (Magnetic Shoulder) -->
        <g class="robot-arm-left">
          <circle cx="27" cy="69" r="4.5" fill="url(#redBallGrad)"/>
          <path d="M26 70 Q16 75 18 88" stroke="url(#bodyGrad)" stroke-width="7" stroke-linecap="round" fill="none"/>
          <circle cx="18" cy="88" r="3.8" fill="#1D4ED8"/>
        </g>

        <!-- Right Articulated Arm (Magnetic Shoulder) -->
        <g class="robot-arm-right">
          <circle cx="73" cy="69" r="4.5" fill="url(#redBallGrad)"/>
          <path d="M74 70 Q84 75 82 88" stroke="url(#bodyGrad)" stroke-width="7" stroke-linecap="round" fill="none"/>
          <circle cx="82" cy="88" r="3.8" fill="#1D4ED8"/>
        </g>
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
            <span class="wa-status-dot" style="background:${shop.isOpen ? '#22c55e' : '#ef4444'};box-shadow:0 0 0 2px rgba(255,255,255,0.25);"></span>
            ${shop.isOpen ? 'Open Now · Closes 8:30 PM' : 'Closed · ' + shop.detail}
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

          <button type="button" class="wa-action-item" id="wa-btn-location-pickup" style="width:100%;text-align:left;background:none;border:none;padding:12px;font:inherit;cursor:pointer;">
            <span class="wa-action-icon">📍</span>
            <div class="wa-action-texts">
              <span class="wa-action-main">Pickup by Map Pin / GPS</span>
              <span class="wa-action-sub">Send doorstep pin to courier rider</span>
            </div>
            <span class="wa-action-arrow">→</span>
          </button>

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

    // Setup Pickup by Map Pin action in WA panel
    const waLocBtn = waPanel.querySelector('#wa-btn-location-pickup');
    if (waLocBtn) {
      waLocBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleWa(false);
        if (typeof window.openLocationPicker === 'function') {
          window.openLocationPicker();
        }
      });
    }

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

/* ============================================================
   LOCATION PICKER MODAL (Map Pin & GPS Coordinates)
   ============================================================ */
let activeLocationCallback = null;

function initLocationPickerModal() {
  if (document.getElementById('location-picker-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'location-picker-modal';
  modal.className = 'loc-modal-overlay';
  modal.innerHTML = `
    <div class="loc-modal-card">
      <div class="loc-modal-header">
        <h3>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#E31837" stroke-width="2.3">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          Pickup Location Pin (GPS)
        </h3>
        <button type="button" class="loc-modal-close" id="loc-modal-close" aria-label="Close">&times;</button>
      </div>

      <div class="loc-modal-body">
        <p style="margin:0;font-size:13px;color:#475569;line-height:1.45;">
          Pin your home or office location so the DK DTDC pickup rider arrives at the exact spot without calling for directions.
        </p>

        <button type="button" class="loc-detect-btn-large" id="btn-gps-detect">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.3">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9 12 2"></polygon>
          </svg>
          <span id="gps-btn-text">Detect My Live GPS Location</span>
        </button>

        <div>
          <div class="loc-chips-title">Or Choose Nearby Landmark</div>
          <div class="loc-chips-row">
            <button type="button" class="loc-chip-btn is-selected" data-lat="12.8872" data-lng="77.6534" data-name="Bren Palms / Kudlu Main Rd">Bren Palms (Kudlu)</button>
            <button type="button" class="loc-chip-btn" data-lat="12.8452" data-lng="77.6602" data-name="Electronic City Phase 1">Electronic City Ph 1</button>
            <button type="button" class="loc-chip-btn" data-lat="12.8798" data-lng="77.6508" data-name="Singasandra Metro Station">Singasandra Metro</button>
            <button type="button" class="loc-chip-btn" data-lat="12.9116" data-lng="77.6389" data-name="HSR Layout Sector 2">HSR Layout Sec 2</button>
            <button type="button" class="loc-chip-btn" data-lat="12.9025" data-lng="77.6610" data-name="Haralur / Reliable Woods">Haralur Road</button>
          </div>
        </div>

        <div class="loc-map-container">
          <iframe id="loc-map-iframe" src="https://www.google.com/maps?q=12.8872,77.6534&z=16&output=embed" title="Selected Pickup Pin Location" loading="lazy"></iframe>
        </div>

        <div class="loc-coords-box">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="font-size:12px;color:#0F172A;">📍 Selected Coordinates:</strong>
            <span id="loc-coords-val" style="font-family:monospace;font-size:12px;color:#2563EB;font-weight:600;">12.887200, 77.653400</span>
          </div>
          <div>
            <span style="font-size:11.5px;color:#64748B;">Rider Map Link:</span>
            <a id="loc-link-val" href="https://maps.google.com/?q=12.8872,77.6534" target="_blank" rel="noopener noreferrer" class="loc-link">https://maps.google.com/?q=12.8872,77.6534</a>
          </div>
        </div>

        <div>
          <label for="loc-extra-note" style="display:block;font-size:12px;font-weight:600;color:#334155;margin-bottom:4px;">Building / Flat / Gate Instructions (Optional)</label>
          <input type="text" id="loc-extra-note" placeholder="e.g. Flat 302, Bren Palms Tower B or Landmark opposite bakery" style="width:100%;padding:9px 12px;border:1.5px solid #CBD5E1;border-radius:8px;font-size:13.5px;">
        </div>
      </div>

      <div class="loc-modal-footer">
        <button type="button" class="loc-btn-secondary" id="loc-modal-cancel">Cancel</button>
        <button type="button" class="loc-btn-confirm" id="loc-modal-confirm">
          <span id="loc-confirm-text">Send Pickup Pin via WhatsApp →</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  let currentLat = 12.8872;
  let currentLng = 77.6534;
  let currentLocationName = "Bren Palms / Kudlu Main Rd";

  function updateMapAndCoords(lat, lng, name) {
    currentLat = Number(lat);
    currentLng = Number(lng);
    currentLocationName = name || `${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`;

    const iframe = document.getElementById('loc-map-iframe');
    const coordsVal = document.getElementById('loc-coords-val');
    const linkVal = document.getElementById('loc-link-val');

    if (iframe) iframe.src = `https://www.google.com/maps?q=${currentLat},${currentLng}&z=16&output=embed`;
    if (coordsVal) coordsVal.textContent = `${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`;
    if (linkVal) {
      const gUrl = `https://maps.google.com/?q=${currentLat.toFixed(6)},${currentLng.toFixed(6)}`;
      linkVal.href = gUrl;
      linkVal.textContent = gUrl;
    }
  }

  // Preset chips click
  modal.querySelectorAll('.loc-chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.loc-chip-btn').forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      updateMapAndCoords(btn.dataset.lat, btn.dataset.lng, btn.dataset.name);
    });
  });

  // GPS Auto-detect button
  const gpsBtn = modal.querySelector('#btn-gps-detect');
  const gpsText = modal.querySelector('#gps-btn-text');
  if (gpsBtn) {
    gpsBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser. You can select one of the landmark chips instead.');
        return;
      }
      gpsBtn.disabled = true;
      gpsText.textContent = 'Acquiring GPS Satellite Pin...';

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          gpsBtn.disabled = false;
          gpsText.textContent = '✔ GPS Location Found!';
          setTimeout(() => { gpsText.textContent = 'Detect My Live GPS Location'; }, 3000);
          modal.querySelectorAll('.loc-chip-btn').forEach(b => b.classList.remove('is-selected'));
          updateMapAndCoords(pos.coords.latitude, pos.coords.longitude, 'Live Current Location');
        },
        (err) => {
          gpsBtn.disabled = false;
          gpsText.textContent = 'Detect My Live GPS Location';
          let msg = 'Unable to retrieve your location.';
          if (err.code === 1) msg = 'Location permission was denied. Please allow location access or select a nearby landmark.';
          else if (err.code === 2) msg = 'Location unavailable. Please select a nearby landmark.';
          alert(msg);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    });
  }

  // Close handlers
  function closeModal() {
    modal.classList.remove('is-open');
    activeLocationCallback = null;
  }

  modal.querySelector('#loc-modal-close').addEventListener('click', closeModal);
  modal.querySelector('#loc-modal-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Confirm button
  modal.querySelector('#loc-modal-confirm').addEventListener('click', () => {
    const note = (document.getElementById('loc-extra-note')?.value || '').trim();
    const gUrl = `https://maps.google.com/?q=${currentLat.toFixed(6)},${currentLng.toFixed(6)}`;
    const locationData = {
      lat: currentLat.toFixed(6),
      lng: currentLng.toFixed(6),
      name: currentLocationName,
      note: note,
      mapUrl: gUrl
    };

    if (typeof activeLocationCallback === 'function') {
      activeLocationCallback(locationData);
      closeModal();
    } else {
      // Default: Direct WhatsApp message to DK DTDC Kudlu Gate
      let waText = `*DTDC Kudlu Gate — Doorstep Pickup Location* 📍\n` +
        `• *GPS Pin:* ${gUrl}\n` +
        `• *Area:* ${currentLocationName}\n` +
        (note ? `• *Door / Flat Details:* ${note}\n` : '') +
        `Please assign a pickup rider to collect my parcel.`;

      window.open(`https://wa.me/916366118850?text=${encodeURIComponent(waText)}`, '_blank');
      closeModal();
    }
  });
}

/**
 * Opens the location picker modal.
 * @param {Function} [onConfirmCallback] Optional callback function when user selects and confirms a location.
 */
window.openLocationPicker = function(onConfirmCallback) {
  initLocationPickerModal();
  activeLocationCallback = onConfirmCallback || null;

  const modal = document.getElementById('location-picker-modal');
  const confirmText = modal.querySelector('#loc-confirm-text');
  if (confirmText) {
    confirmText.textContent = onConfirmCallback ? '✔ Attach Location to Form Address' : 'Send Pickup Pin via WhatsApp →';
  }
  modal.classList.add('is-open');
};

/* ============================================================
   SECURITY BASICS: reCAPTCHA ANTI-BOT WIDGETS
   ============================================================ */
function initRecaptchaWidgets() {
  document.querySelectorAll('.recaptcha-widget-card').forEach(box => {
    if (box.dataset.initialized) return;
    box.dataset.initialized = 'true';

    const checkInput = box.querySelector('.recaptcha-input');
    const label = box.querySelector('.recaptcha-checkbox-label');

    if (label) {
      label.addEventListener('click', function(e) {
        if (box.classList.contains('is-verified') || box.classList.contains('is-loading')) return;
        e.preventDefault();
        box.classList.remove('is-invalid');
        box.classList.add('is-loading');

        // Human verification simulation (550ms delay)
        setTimeout(() => {
          box.classList.remove('is-loading');
          box.classList.add('is-verified');
          if (checkInput) checkInput.checked = true;
          box.setAttribute('data-verified', 'true');
          box.setAttribute('data-verified-at', Date.now().toString());
        }, 550);
      });
    }
  });
}

/**
 * Validates whether the reCAPTCHA box is checked before form submission.
 * Triggers gentle red shake animation if unchecked.
 */
window.verifyRecaptcha = function(cardOrFormId) {
  let card = null;
  if (cardOrFormId) {
    const target = document.getElementById(cardOrFormId);
    if (target && target.classList.contains('recaptcha-widget-card')) {
      card = target;
    } else if (target) {
      card = target.querySelector('.recaptcha-widget-card');
    }
  }
  if (!card) {
    card = document.querySelector('.recaptcha-widget-card');
  }
  if (!card) return true; // If not present on page, allow submission

  if (card.getAttribute('data-verified') === 'true') {
    card.classList.remove('is-invalid');
    return true;
  }

  // Trigger invalid animation
  card.classList.remove('is-invalid');
  void card.offsetWidth; // Force CSS reflow
  card.classList.add('is-invalid');
  return false;
};

// Global bootstrap
document.addEventListener('DOMContentLoaded', () => {
  renderChrome();
  initRecaptchaWidgets();
  initLocationPickerModal();
}, { once: true });

