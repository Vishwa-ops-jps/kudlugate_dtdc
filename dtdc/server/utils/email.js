const nodemailer = require('nodemailer');

let transporter = null;

function getForceEmailTo() {
  const forced = (process.env.FORCE_EMAIL_TO || '').trim().toLowerCase();
  return forced || null;
}

function getRecipient(to) {
  const forced = getForceEmailTo();
  return forced || to;
}

function getTransporter() {
  if (process.env.EMAIL_ENABLED !== 'true') return null;
  if (transporter) return transporter;
  const port = Number(process.env.EMAIL_PORT || 587);
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
  return transporter;
}

// Never throws - a failed notification should never break the API request
// that triggered it (e.g. a staff member updating a parcel's status).
async function sendStatusEmail({ to, name, trackingId, status, location }) {
  const t = getTransporter();
  const recipient = getRecipient(to);
  if (!t || !recipient) return { sent: false, reason: 'email disabled or no address' };
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: recipient,
      subject: `Your parcel ${trackingId} is now "${status}"`,
      text:
        `Hi ${name || 'there'},\n\n` +
        `Your DTDC Kudlu Gate parcel ${trackingId} status has been updated to: ${status}.\n` +
        (location ? `Location: ${location}\n` : '') +
        `\nTrack it any time at your convenience using tracking ID ${trackingId}.\n\n` +
        `- DTDC Kudlu Gate`
    });
    return { sent: true };
  } catch (err) {
    console.error('Email send failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

async function sendEnquiryReceipt({ to, name }) {
  const t = getTransporter();
  const recipient = getRecipient(to);
  if (!t || !recipient) return { sent: false };
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: recipient,
      subject: 'We received your enquiry - DTDC Kudlu Gate',
      text: `Hi ${name || 'there'},\n\nThanks for reaching out to DTDC Kudlu Gate. Our team will get back to you shortly.\n\n- DTDC Kudlu Gate`
    });
    return { sent: true };
  } catch (err) {
    console.error('Email send failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

// Notifies the shop owner/admin the moment a customer submits the contact form.
// Goes to ADMIN_NOTIFY_EMAIL if set, otherwise falls back to ADMIN_EMAIL.
async function sendAdminEnquiryAlert({ name, phone, email, subject, message }) {
  const t = getTransporter();
  const adminTo = getRecipient(process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.EMAIL_USER);
  if (!t || !adminTo) return { sent: false, reason: 'email disabled or no admin address configured' };
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: adminTo,
      subject: `New enquiry from ${name}${subject ? ' - ' + subject : ''}`,
      text:
        `You have a new contact form submission on the DTDC Kudlu Gate site:\n\n` +
        `Name: ${name}\n` +
        `Phone: ${phone}\n` +
        (email ? `Email: ${email}\n` : '') +
        (subject ? `Subject: ${subject}\n` : '') +
        `\nMessage:\n${message}\n\n` +
        `Log in to the staff panel to view and manage all enquiries.`
    });
    return { sent: true };
  } catch (err) {
    console.error('Admin alert email failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

// Sends the "forgot password" link. Never throws - the route always returns
// a generic success message either way, so a failed send just means the
// email quietly didn't arrive rather than leaking account existence.
async function sendPasswordResetEmail({ to, name, resetLink }) {
  const t = getTransporter();
  const recipient = getRecipient(to);
  if (!t || !recipient) return { sent: false, reason: 'email disabled or no address' };
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: recipient,
      subject: 'Reset your DTDC Kudlu Gate password',
      text:
        `Hi ${name || 'there'},\n\n` +
        `We got a request to reset your DTDC Kudlu Gate account password.\n\n` +
        `Reset it here (link expires in 1 hour):\n${resetLink}\n\n` +
        `If you didn't request this, you can safely ignore this email - your password will stay the same.\n\n` +
        `- DTDC Kudlu Gate`
    });
    return { sent: true };
  } catch (err) {
    console.error('Password reset email failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendStatusEmail, sendEnquiryReceipt, sendAdminEnquiryAlert, sendPasswordResetEmail };
