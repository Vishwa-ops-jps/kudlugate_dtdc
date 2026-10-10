const express = require('express');
const router = express.Router();

const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MAX_MESSAGES = 20;
const MAX_CHARS = 1000;

const SYSTEM_PROMPT = `You are the official smart AI assistant for DK Enterprise Kudlu New Franchise, a premier courier, cargo, and parcel booking branch in Bengaluru, Karnataka, India.

Your primary mission is to answer ANY question about the branch, services, shipping, packing, pickup, rates, and tracking with total accuracy, politeness, and professionalism.

=======================================================
BRANCH KNOWLEDGE BASE & FACTS
=======================================================
1. STORE IDENTITY:
   - Name: DK Enterprise Kudlu New Franchise (Courier & Cargo)
   - Category: Domestic & International Express Courier, Doorstep Delivery & Cargo Service

2. LOCATION & LANDMARK:
   - Full Address: Shop No. 3, 1st Floor, BREN PALMS, No. 47/2A2, Kudlu Main Rd, Bengaluru, Karnataka 560068.
   - Key Landmarks: Directly above Med Plus Pharmacy, near TVS Godown, opposite Bren Palms entrance gate.
   - Google Maps Location: https://maps.app.goo.gl/Bp4kTUK2omVuxT347

3. OPERATING HOURS:
   - Monday to Saturday: 9:30 AM – 8:30 PM
   - Sunday: Closed (Counter is closed, but urgent booking inquiries can be sent on WhatsApp).

4. CONTACT DETAILS:
   - Phone / Helpline: +91 63661 18850
   - WhatsApp Support: https://wa.me/916366118850 (Direct chat: +91 63661 18850)
   - Contact Form: /contact.html
   - Customer Reviews: /reviews.html

5. CORE SERVICES OFFERED:
   - Domestic Express Air: 1 to 2 business days delivery to major metros (Delhi, Mumbai, Chennai, Hyderabad, Kolkata, Pune, etc.).
   - Standard Surface / Ground Cargo: Cost-effective delivery (3 to 5 business days) for parcels, bulky cartons, and commercial freight.
   - Doorstep / Home Pickup: Available across Kudlu, Kudlu Gate, HSR Layout, Singasandra, Haralur, Electronic City, and nearby areas. Call or WhatsApp +91 63661 18850 to schedule.
   - Professional Packaging Counter: In-store packaging materials available: corrugated cartons, multi-layer bubble wrap, stretch film, tamper-proof security flyers, and industrial tape.
   - Document Courier: High-priority delivery for legal documents, passports, bank letters, academic certificates with tamper-evident envelopes.
   - International Shipping: Global parcel delivery to 200+ countries including USA, UK, Canada, Australia, UAE/Dubai, Europe, and Asia (requires standard invoice & KYC like Aadhaar/Passport).
   - Commercial & Bulk Cargo: Special discounted rates for business consignments, e-commerce dispatch, and multi-box relocations.

6. RATES & PRICING RULES:
   - Rates depend on actual weight vs volumetric weight (Length × Width × Height in cm / 5000), destination pin code, and mode (Air Express vs Surface).
   - Local document courier starts at low minimum base rates.
   - For an exact rate quotation, advise the customer to send parcel weight and destination pin code to WhatsApp (+91 63661 18850) or call directly.

7. TRACKING:
   - Every booking receives a unique tracking ID on the printed receipt or SMS.
   - Tracking Portal: https://www.dtdc.com/track-your-shipment/
   - Enter your tracking ID on the portal to view live transit updates anytime 24/7.

8. ACCEPTABLE ITEMS:
   - Clothes, books, dry non-perishable foods (properly sealed), gifts, corporate documents, electronics & laptops (with protective bubble wrap packing), household items, sealed non-liquid goods.

9. PROHIBITED & RESTRICTED ITEMS:
   - Liquids, flammable substances, explosives, currency/cash, loose jewelry/bullion, firearms, hazardous chemicals, and illegal substances are strictly prohibited by courier aviation regulations.

10. PAYMENT MODES ACCEPTED:
    - UPI (Google Pay, PhonePe, Paytm, BHIM, QR code scan), Cash, and Card payments accepted at counter.

=======================================================
RESPONSE GUIDELINES:
=======================================================
- Be warm, confident, and professional.
- Keep responses concise (2 to 4 sentences).
- If customer asks in English, answer in English. If they write in Kannada or Hindi, reply in that language or bilingual English.
- Always provide the branch phone (+91 63661 18850) or WhatsApp link when they ask to book, get a rate, or request doorstep pickup.`;

// Intelligent Comprehensive Knowledge Engine for instant answers
function getSmartFallbackReply(userText) {
  const q = userText.toLowerCase().trim();

  // 1. Greetings
  if (/^(hi|hello|hey|namaste|namaskara|good\s*(morning|afternoon|evening)|hlo)\b/i.test(q)) {
    return 'Hello! Welcome to DK Enterprise Kudlu New Franchise. How can I assist you with your courier or parcel today? You can ask about rates, doorstep pickup, packing, or branch location.';
  }

  // 2. Location / Address / Landmark / Directions
  if (q.includes('location') || q.includes('address') || q.includes('where') || q.includes('map') || q.includes('shop') || q.includes('landmark') || q.includes('reach') || q.includes('bren palms')) {
    return 'Our branch is located at: Shop No. 3, 1st Floor, BREN PALMS, Kudlu Main Rd, Bengaluru 560068 (directly above Med Plus Pharmacy, near TVS Godown). Map: https://maps.app.goo.gl/Bp4kTUK2omVuxT347';
  }

  // 3. Timings / Hours / Open / Close / Sunday
  if (q.includes('time') || q.includes('timing') || q.includes('hour') || q.includes('open') || q.includes('close') || q.includes('sunday') || q.includes('working')) {
    return 'We are open Monday to Saturday from 9:30 AM to 8:30 PM. We are closed on Sundays, though urgent pickup requests can be messaged on WhatsApp (+91 63661 18850).';
  }

  // 4. Doorstep / Home Pickup
  if (q.includes('pickup') || q.includes('pick up') || q.includes('home') || q.includes('doorstep') || q.includes('collect') || q.includes('from house') || q.includes('from my flat')) {
    return 'Yes, we provide doorstep parcel pickup across Kudlu, Kudlu Gate, HSR Layout, Singasandra, Electronic City, and nearby areas! Please call or WhatsApp us at +91 63661 18850 with your address and parcel details to arrange a pickup.';
  }

  // 5. Packaging / Boxes / Bubble Wrap
  if (q.includes('pack') || q.includes('packing') || q.includes('box') || q.includes('bubble') || q.includes('carton') || q.includes('material')) {
    return 'Yes, professional packaging is available right at our counter! We have sturdy corrugated boxes, heavy-duty bubble wrap, tamper-proof flyers, and courier tape to keep your items 100% secure during transit.';
  }

  // 6. Delivery Duration / How many days / Speed
  if (q.includes('how many days') || q.includes('how long') || q.includes('duration') || q.includes('speed') || q.includes('express') || q.includes('when will it reach') || q.includes('delivery time')) {
    return 'For major Indian cities (Delhi, Mumbai, Chennai, Hyderabad, etc.), Express Air takes 1 to 2 business days. Economical Standard Surface delivery takes approximately 3 to 5 business days depending on distance.';
  }

  // 7. Pricing / Rates / Cost / Charges / Per kg
  if (q.includes('rate') || q.includes('cost') || q.includes('price') || q.includes('charge') || q.includes('per kg') || q.includes('how much') || q.includes('estimate') || q.includes('quote')) {
    return 'Our courier rates start at affordable base charges for local parcels and vary depending on weight, destination pin code, and delivery mode (Air Express vs Surface). Send us your parcel weight and destination on WhatsApp (+91 63661 18850) for an instant quotation!';
  }

  // 8. Tracking / Status
  if (q.includes('track') || q.includes('status') || q.includes('where is my parcel') || q.includes('consignment') || q.includes('waybill') || q.includes('receipt')) {
    return 'You can track your shipment live 24/7 on our tracking portal: https://www.dtdc.com/track-your-shipment/ . Simply enter the tracking ID (such as DKKG...) printed on your booking receipt.';
  }

  // 9. International / Abroad / USA / UK / UAE / Canada
  if (q.includes('international') || q.includes('abroad') || q.includes('foreign') || q.includes('usa') || q.includes('uk') || q.includes('dubai') || q.includes('uae') || q.includes('canada') || q.includes('europe') || q.includes('australia')) {
    return 'Yes, we provide worldwide international courier services to 200+ countries including USA, UK, Canada, Australia, and UAE. Basic invoice and KYC (Aadhaar or Passport) are required. Please WhatsApp +91 63661 18850 for international rates and guidelines.';
  }

  // 10. Documents / Certificates / Passport
  if (q.includes('document') || q.includes('certificate') || q.includes('passport') || q.includes('paper') || q.includes('legal') || q.includes('marksheet')) {
    return 'Yes, we specialize in high-priority secure document delivery with tamper-proof security pouches and signature verification for legal papers, university certificates, and corporate mail.';
  }

  // 11. Electronics / Laptops / Mobiles
  if (q.includes('laptop') || q.includes('mobile') || q.includes('phone') || q.includes('electronic') || q.includes('gadget') || q.includes('computer')) {
    return 'Yes, electronics and laptops can be shipped safely! We recommend our multi-layer bubble wrap and sturdy box packaging to ensure total shock protection during transport.';
  }

  // 12. Medicines / Tablets
  if (q.includes('medicine') || q.includes('tablets') || q.includes('pharma') || q.includes('prescription')) {
    return 'Medicines can be couriered along with a valid doctor prescription and purchase invoice/bill. Please check with our staff on WhatsApp (+91 63661 18850) prior to booking for clearance details.';
  }

  // 13. Clothes / Food / Personal Gifts
  if (q.includes('cloth') || q.includes('dress') || q.includes('sweet') || q.includes('food') || q.includes('snack') || q.includes('gift')) {
    return 'Yes, garments, personal gifts, and dry non-perishable food items (dry snacks, sweets, commercial packets) are welcomed. Items must be properly sealed and non-liquid.';
  }

  // 14. Prohibited / Restricted Items
  if (q.includes('liquid') || q.includes('prohibited') || q.includes('allowed') || q.includes('banned') || q.includes('gold') || q.includes('cash') || q.includes('money')) {
    return 'Strictly prohibited items include liquids, flammable liquids, currency/cash, precious jewelry, and hazardous chemicals under airline security norms. All dry non-hazardous parcels are permitted.';
  }

  // 15. Phone / Contact / WhatsApp
  if (q.includes('phone') || q.includes('contact') || q.includes('call') || q.includes('whatsapp') || q.includes('number') || q.includes('mobile')) {
    return 'You can call our Kudlu branch directly at +91 63661 18850 or message us on WhatsApp: https://wa.me/916366118850 . Our team is ready to assist you!';
  }

  // 16. Payment Options
  if (q.includes('payment') || q.includes('pay') || q.includes('upi') || q.includes('gpay') || q.includes('google pay') || q.includes('phonepe') || q.includes('card') || q.includes('cash')) {
    return 'We accept all standard payment methods including UPI (Google Pay, PhonePe, Paytm, QR scan), Cash, and Card at our counter.';
  }

  // 17. Cargo / Heavy / Bulk shipment
  if (q.includes('cargo') || q.includes('bulk') || q.includes('heavy') || q.includes('relocation') || q.includes('commercial')) {
    return 'Yes, we handle heavy commercial cargo, freight consignments, and bulk parcels with special discounted commercial rates. Contact us on WhatsApp (+91 63661 18850) for bulk freight pricing.';
  }

  // 18. Default fallback
  return 'Welcome to DK Enterprise Kudlu New Franchise! We are open Mon–Sat (9:30 AM – 8:30 PM) at BREN PALMS, Kudlu Main Road (above Med Plus). For instant rate quotes, doorstep pickup, or queries, call or WhatsApp us at +91 63661 18850!';
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
      generationConfig: { maxOutputTokens: 350, temperature: 0.3 }
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
      options: {
        num_predict: 350,
        temperature: 0.3
      }
    })
  });
  if (!r.ok) throw new Error(`Ollama HTTP error ${r.status}`);
  const data = await r.json();
  const reply = (data.message && data.message.content || '').trim();
  if (!reply) throw new Error('Empty Ollama response');
  return reply;
}

// simple in-memory rate limit: 30 requests / 10 min / IP
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 30;
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
        console.warn('Gemini failed, falling back to Ollama/rules:', geminiErr.message);
      }
    }

    // 2. Try Ollama (for local dev or self-hosted LLM)
    try {
      const reply = await callOllama(messages);
      return res.json({ reply });
    } catch (ollamaErr) {
      // Expected on remote hosts without Ollama
    }

    // 3. High-intelligence Knowledge Engine fallback
    const reply = getSmartFallbackReply(lastUserMsg);
    return res.json({ reply });

  } catch (err) {
    console.error('Chat error:', err);
    res.json({ reply: 'Welcome to DK Enterprise Kudlu New Franchise! We are open Mon–Sat (9:30 AM – 8:30 PM). For parcel bookings, rates, or doorstep pickup, call or WhatsApp us at +91 63661 18850!' });
  }
});

module.exports = router;
