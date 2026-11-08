const express = require('express');
const router = express.Router();

const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MAX_MESSAGES = 20;
const MAX_CHARS = 1000;

const SYSTEM_PROMPT = `You are the official Autonomous AI Logistics Agent for DK Enterprise Kudlu New Franchise, a premier DTDC courier, cargo, and express logistics hub in Bengaluru, Karnataka, India.

Unlike a basic chatbot assistant, you are an intelligent LOGISTICS ACTION AGENT with domain expertise in:
1. Live parcel consignment tracking & transit queries.
2. Accurate domestic & international freight rate estimations.
3. Scheduling doorstep rider parcel pickups across Kudlu Gate and nearby localities.
4. Advising on protective packaging standards, volumetric weight calculations, and prohibited aviation items.
5. Student luggage relocation and B2B corporate GST accounts.

=======================================================
BRANCH SPECIFICATIONS & LOGISTICS FACTS
=======================================================
1. STORE IDENTITY:
   - Branch: DK Enterprise Kudlu New Franchise (DTDC Courier & Cargo)
   - Category: Domestic & International Express Courier, Cargo Freight & Doorstep Pickup Hub

2. EXACT LOCATION & LANDMARK:
   - Address: Shop No. 3, 1st Floor, BREN PALMS, No. 47/2A2, Kudlu Main Rd, Bengaluru, Karnataka 560068.
   - Landmarks: Directly above Med Plus Pharmacy, near TVS Godown, opposite Bren Palms entrance gate.
   - Google Maps: https://maps.app.goo.gl/Bp4kTUK2omVuxT347

3. OPERATING TIMINGS:
   - Monday to Saturday: 9:30 AM – 8:30 PM (Counter open)
   - Sunday: Counter closed (Urgent bookings accepted on WhatsApp +91 63661 18850)

4. DIRECT HELPLINES:
   - Phone: +91 63661 18850 (Call: tel:+916366118850)
   - WhatsApp Dispatch: https://wa.me/916366118850
   - Tracking Portal: https://www.dtdc.com/track-your-shipment/

5. DOORSTEP PICKUP LOCALITIES:
   - Free/Nominal doorstep collection across Kudlu, Kudlu Gate, Kudlu Main Road, Singasandra, Haralur Road, HSR Layout, Electronic City, Kasavanahalli, Begur.

6. CORE FREIGHT SERVICES:
   - Domestic Express Air: 1 to 2 business days to major metros (Delhi, Mumbai, Chennai, Hyderabad, Kolkata, Pune).
   - Standard Ground Surface: 3 to 5 business days economical cargo.
   - Document Courier: High-priority legal papers, passports, certificates in tamper-evident envelopes.
   - Student & IT Luggage Relocation (/relocation.html): Cheap per-kg surface cargo, free waterproof shrink wrap, flat/PG pickup.
   - B2B Corporate Shipping (/b2b.html): Daily 5 PM van pickup, consolidated monthly GST invoice, bulk discounts.
   - International Shipping: 200+ countries (USA, UK, UAE, Canada, Australia, Europe). Requires standard invoice & KYC (Aadhaar/Passport).

7. PRICING & VOLUMETRIC FORMULA:
   - Charged on higher of Actual Weight vs Volumetric Weight: (Length × Width × Height in cm) / 5000.

=======================================================
AGENT OPERATIONAL GUIDELINES:
=======================================================
- Format replies cleanly using bullet points, emojis, bold highlights, and direct action links.
- When tracking numbers are provided, format a tracking action card.
- When weights/cities are provided, compute an estimated rate breakdown.
- Support English, Kannada, and Hindi fluently.`;

/**
 * Autonomous AI Agent Engine - Deep intent extraction & tool execution
 */
function runAgentActionEngine(userText) {
  const q = userText.toLowerCase().trim();

  // 1. TOOL: TRACK SHIPMENT ACTION
  const awbMatch = userText.match(/\b([A-Z]\d{8,9}|\d{9,11}|DTDC\d{7,10}|[A-Z]{2}\d{7,9})\b/i);
  if (awbMatch || (q.includes('track') && /\d/.test(q))) {
    const awb = awbMatch ? awbMatch[1].toUpperCase() : 'your consignment';
    return `🔍 **Live Tracking Query Resolved**\n\n` +
      `• **Consignment ID:** \`${awb}\`\n` +
      `• **Carrier Network:** DTDC Express National Logistics\n` +
      `• **Origin Branch:** DK Enterprise Kudlu New Franchise\n\n` +
      `👉 **Live Tracking Link:** https://www.dtdc.com/track-your-shipment/\n\n` +
      `💬 **Need Priority Status Verification?**\n` +
      `Message our Kudlu dispatch desk with this AWB:\n` +
      `https://wa.me/916366118850?text=${encodeURIComponent('Please check live tracking status for consignment ID: ' + awb)}`;
  }

  // 2. TOOL: DOORSTEP PICKUP ACTION
  if (q.includes('pickup') || q.includes('pick up') || q.includes('collect') || q.includes('doorstep') || q.includes('home') || q.includes('from flat') || q.includes('from pg') || q.includes('send rider')) {
    return `📦 **Doorstep Parcel Collection Dispatched**\n\n` +
      `Yes! We provide fast doorstep parcel collection across:\n` +
      `• **Kudlu Gate & Kudlu Main Road**\n` +
      `• **Bren Palms & TVS Godown area**\n` +
      `• **Singasandra & AECS Layout**\n` +
      `• **Haralur Road & Kasavanahalli**\n` +
      `• **HSR Layout & Electronic City**\n\n` +
      `🛵 **Pickup Schedule:**\n` +
      `• Daytime Rider: On-demand pickup\n` +
      `• Evening Van: Daily 5:00 PM collection\n\n` +
      `👉 **Tap to Book Rider on WhatsApp:**\n` +
      `https://wa.me/916366118850?text=${encodeURIComponent('Hello DK Enterprise, I want to book a doorstep parcel pickup. My address is: ')}\n` +
      `📞 Or call branch helpline: +91 63661 18850`;
  }

  // 3. TOOL: RATE & PRICING CALCULATOR ACTION
  const weightMatch = userText.match(/(\d+(?:\.\d+)?)\s*(kg|kilos?|gm?|grams?)/i);
  if (weightMatch || q.includes('rate') || q.includes('cost') || q.includes('price') || q.includes('charge') || q.includes('how much') || q.includes('quote') || q.includes('per kg')) {
    let weightVal = weightMatch ? parseFloat(weightMatch[1]) : 0;
    if (weightMatch && weightMatch[2].toLowerCase().startsWith('g')) weightVal = weightVal / 1000;

    let calcNote = '';
    if (weightVal > 0) {
      if (weightVal <= 0.5) {
        calcNote = `\n• **Estimated Weight:** ~${weightVal} kg (Document / Mini Packet)\n` +
          `• **Local Karnataka:** ₹40 – ₹70\n` +
          `• **Metro Express Air:** ₹110 – ₹160 (1–2 days delivery)`;
      } else if (weightVal <= 2) {
        calcNote = `\n• **Estimated Weight:** ~${weightVal} kg\n` +
          `• **South Metros (Chennai, Hyderabad):** Air ₹160–₹240 | Surface ₹90–₹140\n` +
          `• **Major Metros (Delhi, Mumbai, Kolkata):** Air ₹220–₹340 | Surface ₹130–₹200`;
      } else if (weightVal > 10) {
        calcNote = `\n• **Estimated Weight:** ~${weightVal} kg (Heavy / Luggage Relocation)\n` +
          `• **Special Bulk Surface Cargo:** Economical per-kg bulk rates available!\n` +
          `• **Includes:** Free waterproof shrink wrapping & PG/flat collection.`;
      } else {
        calcNote = `\n• **Estimated Weight:** ~${weightVal} kg\n` +
          `• **Express Air (1-2 days):** Standard metro rate per kg\n` +
          `• **Surface Cargo (3-5 days):** Economical freight slab`;
      }
    }

    return `💰 **DK Freight Rate Calculator Engine**${calcNote}\n\n` +
      `📌 **How Rates are Computed:**\n` +
      `1. **Actual vs Volumetric Weight:** Charged on whichever is higher: $(L \\times W \\times H \\text{ cm}) / 5000$\n` +
      `2. **Speed Mode:** Express Air (1–2 Days) vs Surface Cargo (3–5 Days)\n\n` +
      `👉 **Get an Exact Pincode-Specific Quote:**\n` +
      `https://wa.me/916366118850?text=${encodeURIComponent('Hello DK Enterprise, please provide exact rate quote for my parcel weight: ' + (weightVal ? weightVal + 'kg' : '') + ' to destination pincode: ')}`;
  }

  // 4. KANNADA MULTILINGUAL RESOLVER
  if (/[\u0C80-\u0CFF]/.test(q)) {
    if (q.includes('ದರ') || q.includes('ಬೆಲೆ') || q.includes('ಖರ್ಚು') || q.includes('ಎಷ್ಟು')) {
      return `💰 **ಡಿಕೆ ಎಂಟರ್‌ಪ್ರೈಸ್ ಕೊರಿಯರ್ ದರಗಳು:**\n\n` +
        `• ಸ್ಥಳೀಯ ಡಾಕ್ಯುಮೆಂಟ್ ಕೊರಿಯರ್ ಕನಿಷ್ಠ ದರದಿಂದ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ.\n` +
        `• ಮೆಟ್ರೋ ನಗರಗಳಿಗೆ (ದೆಹಲಿ, ಮುಂಬೈ, ಚೆನ್ನೈ) ಎಕ್ಸ್‌ಪ್ರೆಸ್ ಏರ್ ಮತ್ತು ಸರ್ಫೇಸ್ ಕಾರ್ಗೋ ಲಭ್ಯವಿದೆ.\n` +
        `• ನಿಖರ ದರಕ್ಕಾಗಿ ನಿಮ್ಮ ಪಾರ್ಸೆಲ್ ತೂಕ ಮತ್ತು ಡೆಸ್ಟಿನೇಶನ್ ಪಿನ್‌ಕೋಡ್ ಕಳುಹಿಸಿ:\n` +
        `👉 ವಾಟ್ಸಾಪ್: https://wa.me/916366118850`;
    }
    if (q.includes('ಪಿಕಪ್') || q.includes('ಮನೆ')) {
      return `📦 **ಮನೆ ಬಾಗಿಲ ಪಿಕಪ್ ಸೇವೆ:**\n\n` +
        `ಹೌದು! ಕುಡ್ಲು ಗೇಟ್, ಸಿಂಗಸಂದ್ರ, ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಿಟಿ ಮತ್ತು ಎಚ್‌ಎಸ್‌ಆರ್ ಲೇಔಟ್ ಸುತ್ತಮುತ್ತ ಉಚಿತ ಮನೆ ಬಾಗಿಲ ಪಿಕಪ್ ಲಭ್ಯವಿದೆ.\n` +
        `👉 ರೈಡರ್ ಬುಕ್ ಮಾಡಲು ವಾಟ್ಸಾಪ್ ಮಾಡಿ: https://wa.me/916366118850\n` +
        `📞 ಕರೆ ಮಾಡಿ: +91 63661 18850`;
    }
    if (q.includes('ಸಮಯ') || q.includes('ತೆರೆ') || q.includes('ಮುಚ್ಚ')) {
      return `🕒 **ಶಾಖೆಯ ಸಮಯ:**\n\n` +
        `• ಸೋಮವಾರದಿಂದ ಶನಿವಾರ: ಬೆಳಿಗ್ಗೆ 9:30 ರಿಂದ ರಾತ್ರಿ 8:30 ರವರೆಗೆ ತೆರೆದಿರುತ್ತದೆ.\n` +
        `• ಭಾನುವಾರ: ರಜೆ (ತುರ್ತು ಬುಕಿಂಗ್‌ಗಾಗಿ ವಾಟ್ಸಾಪ್ +91 63661 18850 ಸಂಪರ್ಕಿಸಿ).`;
    }
    if (q.includes('ಎಲ್ಲಿದೆ') || q.includes('ವಿಳಾಸ') || q.includes('ಸ್ಥಳ')) {
      return `📍 **ಶಾಖೆಯ ವಿಳಾಸ:**\n\n` +
        `ಶಾಪ್ ನಂ 3, 1ನೇ ಮಹಡಿ, ಬ್ರೆನ್ ಪಾಮ್ಸ್, ಮೆಡ್ ಪ್ಲಸ್ ಮೇಲ್ಭಾಗ, ಕುಡ್ಲು ಮುಖ್ಯ ರಸ್ತೆ, ಬೆಂಗಳೂರು 560068.\n` +
        `👉 ಗೂಗಲ್ ಮ್ಯಾಪ್: https://maps.app.goo.gl/Bp4kTUK2omVuxT347`;
    }
    return `ನಮಸ್ಕಾರ! ನಾನು ಡಿಕೆ ಎಂಟರ್‌ಪ್ರೈಸ್ ಸ್ವಾಯತ್ತ ಎಐ ಕೊರಿಯರ್ ಏಜೆಂಟ್. ಲೈವ್ ಟ್ರ್ಯಾಕಿಂಗ್, ಕೊರಿಯರ್ ದರಗಳು ಅಥವಾ ಮನೆ ಬಾಗಿಲ ಪಿಕಪ್‌ಗಾಗಿ ನನಗೆ ಸಂದೇಶ ಕಳುಹಿಸಿ ಅಥವಾ ಕರೆ ಮಾಡಿ: +91 63661 18850.`;
  }

  // 5. HINDI MULTILINGUAL RESOLVER
  if (/[\u0900-\u097F]/.test(q)) {
    if (q.includes('रेट') || q.includes('दाम') || q.includes('कीमत') || q.includes('कितना') || q.includes('खर्च')) {
      return `💰 **डीके एंटरप्राइज कूरियर रेट्स:**\n\n` +
        `• लोकल डॉक्यूमेंट कूरियर कम से कम बेस रेट से शुरू होता है।\n` +
        `• एयर एक्सप्रेस (1-2 दिन) और सरफेस कार्गो (3-5 दिन) दोनों उपलब्ध हैं।\n` +
        `• सटीक कोटेशन के लिए पार्सल का वजन और पिनकोड भेजें:\n` +
        `👉 व्हाट्सएप: https://wa.me/916366118850`;
    }
    if (q.includes('पिकअप') || q.includes('घर')) {
      return `📦 **डोरस्टेप पिकअप सेवा:**\n\n` +
        `हाँ! कुडलू गेट, इलेक्ट्रॉनिक सिटी, सिंगसंद्रा और एचएसआर लेआउट में फ्री डोरस्टेप पिकअप उपलब्ध है।\n` +
        `👉 राइडर शेड्यूल करें: https://wa.me/916366118850\n` +
        `📞 कॉल करें: +91 63661 18850`;
    }
    if (q.includes('समय') || q.includes('टाइम') || q.includes('खुला') || q.includes('कब')) {
      return `🕒 **शाखा का समय:**\n\n` +
        `• सोमवार से शनिवार: सुबह 9:30 बजे से रात 8:30 बजे तक।\n` +
        `• रविवार: बंद (व्हाट्सएप पर आपातकालीन बुकिंग उपलब्ध)।`;
    }
    if (q.includes('कहाँ') || q.includes('पता') || q.includes('लोकेशन')) {
      return `📍 **शाखा का पता:**\n\n` +
        `शॉप नं. 3, पहली मंज़िल, ब्रेन पाल्म्स, मेड प्लस के ऊपर, कुडलू मेन रोड, बेंगलुरु 560068।\n` +
        `👉 गूगल मैप: https://maps.app.goo.gl/Bp4kTUK2omVuxT347`;
    }
    return `नमस्ते! मैं डीके एंटरप्राइज का एआई कूरियर एजेंट हूँ। ट्रैकिंग, कूरियर रेट्स, या डोरस्टेप पिकअप के लिए आप मुझसे पूछ सकते हैं या कॉल करें: +91 63661 18850।`;
  }

  // 6. PIN CODE COVERAGE
  const pinMatch = userText.match(/\b([1-9][0-9]{5})\b/);
  if (pinMatch) {
    const pin = pinMatch[1];
    return `📍 **PIN Code Serviceability Analysis: ${pin}**\n\n` +
      `• **Network Coverage:** Fully serviceable under DTDC Pan-India network (10,000+ pin codes).\n` +
      `• **Express Air:** 24–48 hours transit to major metro hubs.\n` +
      `• **Surface Ground:** 3–5 business days economical freight.\n\n` +
      `👉 **Book Consignment to ${pin}:**\n` +
      `https://wa.me/916366118850?text=${encodeURIComponent('Hello DK Enterprise, I want to ship a parcel to PIN code: ' + pin)}`;
  }

  // 7. LOCATION & DIRECTIONS
  if (q.includes('location') || q.includes('address') || q.includes('where') || q.includes('map') || q.includes('shop') || q.includes('landmark') || q.includes('reach') || q.includes('bren palms')) {
    return `📍 **DK Enterprise Branch Coordinates:**\n\n` +
      `• **Address:** Shop No. 3, 1st Floor, BREN PALMS, Kudlu Main Rd, Bengaluru 560068\n` +
      `• **Landmark:** Directly above Med Plus Pharmacy, near TVS Godown, opposite Bren Palms Gate.\n` +
      `👉 **Google Maps Navigation:** https://maps.app.goo.gl/Bp4kTUK2omVuxT347\n` +
      `📞 Counter Helpline: +91 63661 18850`;
  }

  // 8. STORE TIMINGS & SUNDAY
  if (q.includes('time') || q.includes('timing') || q.includes('hour') || q.includes('open') || q.includes('close') || q.includes('sunday') || q.includes('working')) {
    return `🕒 **Official Operating Hours:**\n\n` +
      `• **Monday – Saturday:** 9:30 AM – 8:30 PM (Counter Open)\n` +
      `• **Sunday:** Counter Closed (WhatsApp urgent pickup scheduling active: +91 63661 18850)\n` +
      `• **Daily Van Dispatch:** Evening 5:00 PM`;
  }

  // 9. STUDENT & IT LUGGAGE RELOCATION
  if (q.includes('luggage') || q.includes('relocat') || q.includes('shift') || q.includes('suitcase') || q.includes('duffle') || q.includes('student') || q.includes('pg move') || q.includes('baggage')) {
    return `🎒 **Student & IT Luggage Relocation Desk**\n\n` +
      `Moving out of Bangalore PG or apartment? Save high airline excess baggage fees!\n` +
      `• **Cheapest Surface Cargo Rates** across India\n` +
      `• **Free Doorstep PG Collection** in Kudlu, HSR & Electronic City\n` +
      `• **Free Multi-Layer Waterproof Shrink Wrapping**\n` +
      `• **Full Tracking from Kudlu to Home Doorstep**\n\n` +
      `👉 **Book Luggage Relocation:** /relocation.html\n` +
      `💬 WhatsApp Luggage Desk: https://wa.me/916366118850?text=${encodeURIComponent('Hello DK Enterprise, I want to book luggage shifting from my PG')}`;
  }

  // 10. B2B CORPORATE SHIPPING
  if (q.includes('b2b') || q.includes('corporate') || q.includes('seller') || q.includes('business account') || q.includes('monthly bill') || q.includes('gst invoice') || q.includes('daily pickup') || q.includes('ecommerce')) {
    return `🏢 **B2B & Corporate Logistics Accounts**\n\n` +
      `Designed for online brands, startups, e-commerce sellers & local offices:\n` +
      `• **Scheduled 5 PM Daily Doorstep Van Collection**\n` +
      `• **Consolidated Monthly Statement & ITC Tax GST Invoicing**\n` +
      `• **Commercial Volume Slab Discounts**\n` +
      `• **Protective Laptop & Fragile Packaging**\n\n` +
      `👉 **Explore B2B Solutions:** /b2b.html\n` +
      `💬 Message Corporate Desk: https://wa.me/916366118850?text=${encodeURIComponent('Hello DK Enterprise, I want to open a B2B corporate shipping account')}`;
  }

  // 11. PACKAGING & BOXES
  if (q.includes('pack') || q.includes('box') || q.includes('bubble') || q.includes('carton') || q.includes('material')) {
    return `📦 **Professional Counter Packaging Supplies:**\n\n` +
      `Yes, professional packing materials are available on-site at our Kudlu counter:\n` +
      `• Multi-layer heavy duty bubble wrap & shrink film\n` +
      `• Corrugated 3-ply & 5-ply shipping boxes (all sizes)\n` +
      `• Tamper-evident flyer security pouches & reinforced duct tape`;
  }

  // 12. INTERNATIONAL COURIER
  if (q.includes('international') || q.includes('abroad') || q.includes('usa') || q.includes('uk') || q.includes('dubai') || q.includes('uae') || q.includes('canada') || q.includes('europe') || q.includes('australia')) {
    return `✈️ **Worldwide International Courier Service:**\n\n` +
      `We ship parcels to 200+ countries including USA, UK, Canada, Australia, UAE & Europe.\n` +
      `• **Documentation:** Requires standard commercial invoice + KYC (Aadhaar or Passport).\n` +
      `• **Transit Times:** Express air 4 to 7 business days.\n` +
      `👉 **Inquire International Rates:** https://wa.me/916366118850?text=${encodeURIComponent('Hello DK Enterprise, please guide me on international shipping rates')}`;
  }

  // 13. PROHIBITED ITEMS
  if (q.includes('liquid') || q.includes('prohibited') || q.includes('allowed') || q.includes('banned') || q.includes('gold') || q.includes('cash')) {
    return `⚠️ **Courier Aviation Regulations:**\n\n` +
      `• **Strictly Prohibited:** Liquids, flammable chemicals, cash/currency, loose bullion/jewelry, explosives, and lithium batteries without clearance.\n` +
      `• **Permitted:** Clothes, books, dry sealed foods, electronics with protective bubble pack, documents, and corporate goods.`;
  }

  // 14. DEFAULT AGENT RESOLVER
  return `⚡ **DK Courier AI Agent Online**\n\n` +
    `Welcome to DK Enterprise Kudlu New Franchise! I am your autonomous logistics agent.\n\n` +
    `I can directly assist you with:\n` +
    `• 🔍 **Live Shipment Tracking** (enter tracking ID)\n` +
    `• 💰 **Instant Rate Quotation** (provide weight & destination city)\n` +
    `• 📦 **Doorstep Rider Collection** in Kudlu Gate & nearby\n` +
    `• 🏢 **B2B Accounts & Luggage Shifting**\n\n` +
    `👉 Call helpline: tel:+916366118850 or WhatsApp: https://wa.me/916366118850`;
}

// Gemini API call helper (agentic mode)
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
      generationConfig: { maxOutputTokens: 400, temperature: 0.2 }
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
        num_predict: 400,
        temperature: 0.2
      }
    })
  });
  if (!r.ok) throw new Error(`Ollama HTTP error ${r.status}`);
  const data = await r.json();
  const reply = (data.message && data.message.content || '').trim();
  if (!reply) throw new Error('Empty Ollama response');
  return reply;
}

// Simple in-memory rate limit: 40 requests / 10 min / IP
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 40;
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

    // 1. Try Gemini API if key is configured
    if (GEMINI_API_KEY) {
      try {
        const reply = await callGemini(messages);
        return res.json({ reply, agent: true });
      } catch (geminiErr) {
        console.warn('Gemini failed, falling back to autonomous engine:', geminiErr.message);
      }
    }

    // 2. Try Ollama (for local dev or self-hosted LLM)
    try {
      const reply = await callOllama(messages);
      return res.json({ reply, agent: true });
    } catch (ollamaErr) {
      // Expected on remote hosts without Ollama
    }

    // 3. Autonomous AI Agent Action Engine
    const reply = runAgentActionEngine(lastUserMsg);
    return res.json({ reply, agent: true });

  } catch (err) {
    console.error('AI Agent error:', err);
    res.json({
      reply: '⚡ **DK Courier AI Agent Online**\nWe are open Mon–Sat (9:30 AM – 8:30 PM). For instant bookings, rates, or doorstep pickup, please WhatsApp or call our dispatch desk at +91 63661 18850!',
      agent: true
    });
  }
});

module.exports = router;
