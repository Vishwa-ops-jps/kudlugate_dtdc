const express = require('express');
const router = express.Router();

const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MAX_MESSAGES = 20;
const MAX_CHARS = 1000;

const SYSTEM_PROMPT = `You are the AI assistant for the DTDC Kudlu Gate courier franchise in Bengaluru, India.
Help customers with: how the rate calculator works, services (standard/express), branch info, and general courier questions.

Site facts:
- Location: Shop no 3, 1st floor, BREN PALMS, Kudlu Main Rd, Bengaluru 560068 (https://maps.app.goo.gl/Bp4kTUK2omVuxT347).
- Hours: Mon-Sat, 9:30 AM - 8:00 PM.
- Rate calculator: /calculator.html. Contact form: /contact.html. Reviews: /reviews.html.
- Tracking: send customers to official DTDC tracking page: https://www.dtdc.com/track-your-shipment/
- Phone: +91 63661 18850. WhatsApp: https://wa.me/916366118850

Rules:
- Be brief and friendly (2-4 sentences). Plain text, no markdown headings.
- Never invent prices, delivery times, or parcel statuses. For exact prices point to rate calculator; for anything uncertain, suggest calling or WhatsApp.
- Reply in the language the customer writes in (English, Kannada, Hindi, etc.).`;

// Smart instant fallback assistant for when cloud/local LLM is offline
function getSmartFallbackReply(userText) {
  const q = userText.toLowerCase();
  if (q.includes('track') || q.includes('status') || q.includes('where is')) {
    return 'You can track your shipment live on the official DTDC tracking portal: https://www.dtdc.com/track-your-shipment/ . Just enter the tracking ID from your booking receipt!';
  }
  if (q.includes('rate') || q.includes('cost') || q.includes('price') || q.includes('charge') || q.includes('calculate')) {
    return 'To estimate your shipping cost, please use our Rate Calculator at /calculator.html or reach us directly on WhatsApp: https://wa.me/916366118850';
  }
  if (q.includes('location') || q.includes('address') || q.includes('where') || q.includes('map') || q.includes('shop')) {
    return 'Our branch is located at: Shop No. 3, 1st Floor, BREN PALMS, Kudlu Main Rd, Bengaluru 560068 (above Med Plus, near TVS Godown). Map: https://maps.app.goo.gl/Bp4kTUK2omVuxT347';
  }
  if (q.includes('time') || q.includes('hour') || q.includes('open') || q.includes('close') || q.includes('sunday')) {
    return 'We are open Monday to Saturday from 9:30 AM to 8:00 PM (Closed on Sundays).';
  }
  if (q.includes('phone') || q.includes('contact') || q.includes('call') || q.includes('whatsapp') || q.includes('number')) {
    return 'You can call us directly at +91 63661 18850 or chat with us on WhatsApp: https://wa.me/916366118850';
  }
  return 'Hello! Welcome to DTDC Kudlu Gate. How can I help you today? You can ask about our shipping rates, branch location, timings, or tracking details. You can also call us at +91 63661 18850.';
}

// Gemini API call helper
async function callGemini(messages) {
  if (!GEMINI_API_KEY) throw new Error('No GEMINI_API_KEY set');
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { maxOutputTokens: 400 }
    })
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return text.trim();
}

// Ollama API call helper
async function callOllama(messages) {
  const r = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      options: { num_predict: 400 }
    })
  });
  if (!r.ok) throw new Error(`Ollama HTTP error ${r.status}`);
  const data = await r.json();
  const reply = (data.message && data.message.content || '').trim();
  if (!reply) throw new Error('Empty Ollama response');
  return reply;
}

// simple in-memory rate limit: 20 requests / 10 min / IP
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 20;
}

router.post('/', async (req, res) => {
  try {
    if (limited(req.ip)) return res.status(429).json({ error: 'Too many messages. Please try again in a few minutes.' });

    const incoming = Array.isArray(req.body.messages) ? req.body.messages.slice(-MAX_MESSAGES) : [];
    const messages = incoming
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'Send a message first.' });
    }

    const lastUserMsg = messages[messages.length - 1].content;

    // 1. Try Gemini API if key is provided
    if (GEMINI_API_KEY) {
      try {
        const reply = await callGemini(messages);
        return res.json({ reply });
      } catch (geminiErr) {
        console.warn('Gemini failed, falling back:', geminiErr.message);
      }
    }

    // 2. Try Ollama (for local dev or if Ollama is self-hosted)
    try {
      const reply = await callOllama(messages);
      return res.json({ reply });
    } catch (ollamaErr) {
      console.warn('Ollama unavailable, using smart fallback:', ollamaErr.message);
    }

    // 3. Smart Knowledge-Base fallback if neither AI engine is active
    const reply = getSmartFallbackReply(lastUserMsg);
    return res.json({ reply });

  } catch (err) {
    console.error('Chat error:', err);
    res.json({ reply: 'Hello! You can ask me about our rates, location, timings, or tracking. For immediate assistance, call us at +91 63661 18850.' });
  }
});

module.exports = router;
