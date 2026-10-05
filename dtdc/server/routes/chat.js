const express = require('express');
const router = express.Router();

const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';
const MAX_MESSAGES = 20;
const MAX_CHARS = 1000;

const SYSTEM_PROMPT = `You are the AI assistant for the DTDC Kudlu Gate courier franchise in Bengaluru, India.
Help customers with: how the rate calculator works, services (standard/express), branch info, and general courier questions.

Site facts:
- Estimate cost: /calculator.html. Contact form: /contact.html. Reviews: /reviews.html.
- Tracking: this site does not track parcels itself. Send customers to the official DTDC tracking page: https://www.dtdc.com/track-your-shipment/ and tell them to enter the tracking ID from their receipt.
- Phone: +91 63661 18850. WhatsApp: https://wa.me/916366118850

Rules:
- Be brief and friendly (2-4 sentences). Plain text, no markdown headings.
- Never invent prices, delivery times, or parcel statuses. For exact prices, point to the rate calculator; for anything uncertain, suggest calling or WhatsApp.
- Never ask for or accept OTPs, passwords, or payment details.
- Reply in the language the customer writes in (English, Kannada, Hindi, etc.).
- Politely decline topics unrelated to courier services.`;

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

    const r = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        options: { num_predict: 400 }
      })
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Ollama error:', data);
      return res.status(502).json({ error: 'AI assistant is unavailable. Make sure Ollama and its model are running.' });
    }
    const reply = (data.message && data.message.content || '').trim();
    res.json({ reply: reply || 'Sorry, I could not answer that. Please call or WhatsApp us.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI assistant is unavailable. Make sure Ollama is running.' });
  }
});

module.exports = router;
