const nodemailer = require('nodemailer');
const https = require('https');
const { URL } = require('url');

let transporter = null;

function getRecipient(to) {
  const forced = (process.env.FORCE_EMAIL_TO || '').trim();
  return forced || to;
}

function getFromAddress() {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM.trim();
  const user = (process.env.EMAIL_USER || '').trim();
  if (user) return `"DK Enterprise Kudlu Gate" <${user}>`;
  return '"DK Enterprise Kudlu Gate" <vishwa2o2ok@gmail.com>';
}

function getAdminRecipient() {
  const admin = (process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'vishwa2o2ok@gmail.com').trim();
  return getRecipient(admin);
}

function getTransporter() {
  if (process.env.EMAIL_ENABLED === 'false') {
    return null;
  }
  if (transporter) return transporter;
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').trim();
  if (!user || !pass) {
    return null;
  }

  const isGmail = (process.env.EMAIL_HOST || '').includes('gmail') || user.endsWith('@gmail.com');
  if (isGmail) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT || 587),
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: { user, pass }
    });
  }
  return transporter;
}

async function sendViaResend({ to, subject, text }) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) return null;
  const payload = JSON.stringify({
    from: 'DTDC Kudlu Gate <onboarding@resend.dev>',
    to: Array.isArray(to) ? to : [to],
    subject,
    text
  });
  return new Promise((resolve, reject) => {
    const req = https.request('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ sent: true, provider: 'resend', data: JSON.parse(data || '{}') });
        } else {
          reject(new Error(`Resend API HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function sendViaWebhook({ to, subject, text }) {
  const webhookUrl = (process.env.GOOGLE_SCRIPT_WEBHOOK_URL || process.env.EMAIL_WEBHOOK_URL || '').trim();
  if (!webhookUrl) return null;
  const payload = JSON.stringify({ to, subject, text });
  const urlObj = new URL(webhookUrl);
  return new Promise((resolve, reject) => {
    const req = https.request(urlObj, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ sent: true, provider: 'webhook', data });
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Universal delivery function:
// 1. Tries HTTP APIs (Resend, Webhook) over port 443 (Allowed on Render Free tier)
// 2. Falls back to Nodemailer SMTP (Local dev or Render paid instances)
async function deliverEmail({ to, subject, text }) {
  const recipient = getRecipient(to);
  if (!recipient) return { sent: false, reason: 'No recipient provided' };

  if (process.env.EMAIL_ENABLED === 'false') {
    console.log('[Email] EMAIL_ENABLED is set to false, skipping send');
    return { sent: false, reason: 'EMAIL_ENABLED=false' };
  }

  // 1. Resend (Port 443)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await sendViaResend({ to: recipient, subject, text });
      if (res && res.sent) {
        console.log('[Email] Delivered via Resend to:', recipient);
        return res;
      }
    } catch (err) {
      console.error('[Email] Resend delivery failed:', err.message);
    }
  }

  // 2. Google Apps Script / HTTP Webhook (Port 443)
  if (process.env.GOOGLE_SCRIPT_WEBHOOK_URL || process.env.EMAIL_WEBHOOK_URL) {
    try {
      const res = await sendViaWebhook({ to: recipient, subject, text });
      if (res && res.sent) {
        console.log('[Email] Delivered via Webhook to:', recipient);
        return res;
      }
    } catch (err) {
      console.error('[Email] Webhook delivery failed:', err.message);
    }
  }

  // 3. SMTP fallback
  const t = getTransporter();
  if (t) {
    try {
      const res = await t.sendMail({
        from: getFromAddress(),
        to: recipient,
        subject,
        text
      });
      console.log('[Email] Delivered via SMTP to:', recipient, 'ID:', res.messageId);
      return { sent: true, provider: 'smtp', messageId: res.messageId };
    } catch (err) {
      console.error('[Email] SMTP delivery failed:', err.message);
      return { sent: false, reason: err.message };
    }
  }

  console.warn('[Email] No email provider succeeded. If hosted on Render Free tier, add RESEND_API_KEY or GOOGLE_SCRIPT_WEBHOOK_URL.');
  return { sent: false, reason: 'No available email transport' };
}

// Parcel status updates
async function sendStatusEmail({ to, name, trackingId, status, location }) {
  const text =
    `Hi ${name || 'there'},\n\n` +
    `Your DK Enterprise parcel ${trackingId} status has been updated to: ${status}.\n` +
    (location ? `Location: ${location}\n` : '') +
    `\nTrack it any time at your convenience using tracking ID ${trackingId}.\n\n` +
    `- DK Enterprise Kudlu New Franchise`;
  return deliverEmail({
    to,
    subject: `Your parcel ${trackingId} is now "${status}"`,
    text
  });
}

// Receipt sent to the customer
async function sendEnquiryReceipt({ to, name }) {
  if (!to) return { sent: false };
  const text = `Hi ${name || 'there'},\n\nThanks for reaching out to DK Enterprise Kudlu New Franchise. Our team will get back to you shortly.\n\n- DK Enterprise Kudlu New Franchise`;
  return deliverEmail({
    to,
    subject: 'We received your enquiry - DK Enterprise Kudlu New Franchise',
    text
  });
}

// Notifies shop owner/admin when a contact form enquiry is submitted
async function sendAdminEnquiryAlert({ name, phone, email, subject, message }) {
  const adminTo = getAdminRecipient();
  const text =
    `You have a new contact form submission on the DK Enterprise site:\n\n` +
    `Name: ${name}\n` +
    `Phone: ${phone}\n` +
    (email ? `Email: ${email}\n` : '') +
    (subject ? `Subject: ${subject}\n` : '') +
    `\nMessage:\n${message}\n\n` +
    `Log in to the staff panel to view and manage all enquiries.`;
  return deliverEmail({
    to: adminTo,
    subject: `New enquiry from ${name}${subject ? ' - ' + subject : ''}`,
    text
  });
}

// Password reset
async function sendPasswordResetEmail({ to, name, resetLink }) {
  const text =
    `Hi ${name || 'there'},\n\n` +
    `We got a request to reset your DK Enterprise account password.\n\n` +
    `Reset it here (link expires in 1 hour):\n${resetLink}\n\n` +
    `If you didn't request this, you can safely ignore this email - your password will stay the same.\n\n` +
    `- DK Enterprise Kudlu New Franchise`;
  return deliverEmail({
    to,
    subject: 'Reset your DK Enterprise password',
    text
  });
}

module.exports = {
  sendStatusEmail,
  sendEnquiryReceipt,
  sendAdminEnquiryAlert,
  sendPasswordResetEmail,
  deliverEmail
};
