// Injects the site nav and footer into #site-header / #site-footer placeholders.
function renderChrome() {
  const currentUser = typeof Session !== 'undefined' ? Session.getUser() : null;
  const header = document.getElementById('site-header');
  if (header) {
    header.innerHTML = `
      <div class="topbar">
        <div class="wrap">
          <div class="call-cta">
            <span class="phone-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="#ffffff" aria-hidden="true"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.053 15.053 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.57 3.99c0-.55-.45-1-1-1H4.01c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.61c0-.55-.45-1-1-1z"/></svg></span>
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
            <a href="/contact.html">Contact</a>
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
              <h4>Shop</h4>
              <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">
                <a href="https://www.dtdc.com/track-your-shipment/" target="_blank" rel="noopener noreferrer">Track a parcel</a>
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
                <a href="/contact.html">Contact us</a>
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
    panel.style.cssText = 'position:fixed;left:20px;bottom:86px;z-index:9999;width:340px;max-width:calc(100vw - 36px);height:440px;max-height:calc(100vh - 110px);background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.3);display:none;flex-direction:column;overflow:hidden;font-family:inherit;';
    panel.innerHTML = '<div style="background:#d71920;color:#fff;padding:12px 14px;font-weight:600;display:flex;justify-content:space-between;align-items:center;"><span>DK Enterprise Assistant</span><button type="button" id="ai-close" aria-label="Close" style="background:none;border:0;color:#fff;font-size:20px;cursor:pointer;">&times;</button></div>'
      + '<div id="ai-msgs" style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#f6f6f6;"></div>'
      + '<div style="display:flex;gap:6px;padding:10px;border-top:1px solid #e5e5e5;background:#fff;"><input id="ai-input" type="text" maxlength="1000" placeholder="Ask about booking, rates..." style="flex:1;padding:9px 10px;border:1px solid #ccc;border-radius:8px;font-size:14px;"><button type="button" id="ai-send" style="background:#d71920;color:#fff;border:0;border-radius:8px;padding:0 14px;cursor:pointer;font-weight:600;">Send</button></div>';
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
    btn.addEventListener('click', () => { panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex'; if (panel.style.display === 'flex') input.focus(); });
    panel.querySelector('#ai-close').addEventListener('click', () => { panel.style.display = 'none'; });
  }
  // re-run the active-link + auth-slot logic now that nav exists
  document.dispatchEvent(new Event('DOMContentLoaded'));
}
document.addEventListener('DOMContentLoaded', renderChrome, { once: true });
