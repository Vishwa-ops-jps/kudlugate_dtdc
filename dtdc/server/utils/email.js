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
  const isExplicitlyDisabled = (process.env.EMAIL_ENABLED || '').trim().toLowerCase() === 'false';
  if (isExplicitlyDisabled) return null;

  const emailUser = (process.env.EMAIL_USER || 'vishwa2o2ok@gmail.com').trim();
  let passInput = (process.env.EMAIL_PASS || 'qdtffzfdbxejelnt').replace(/\s+/g, '');
  if (!passInput || passInput === 'fzmootiqvmbyrqdye' || passInput.includes('fzmoo')) {
    passInput = 'qdtffzfdbxejelnt';
  }
  const emailPass = passInput;

  if (transporter) return transporter;

  const port = Number(process.env.EMAIL_PORT || 587);
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: emailUser, pass: emailPass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 15000
  });
  return transporter;
}

async function sendStatusEmail({ to, name, trackingId, status, location }) {
  const t = getTransporter();
  const recipient = getRecipient(to);
  if (!t || !recipient) return { sent: false, reason: 'email disabled or no address' };
  try {
    const fromAddr = process.env.EMAIL_FROM || '"DTDC Kudlu Gate" <vishwa2o2ok@gmail.com>';
    await t.sendMail({
      from: fromAddr,
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
    transporter = null;
    return { sent: false, reason: err.message };
  }
}

async function sendEnquiryReceipt({ to, name }) {
  const t = getTransporter();
  const recipient = getRecipient(to);
  if (!t || !recipient) return { sent: false, reason: 'email disabled or no address' };
  try {
    const fromAddr = process.env.EMAIL_FROM || '"DTDC Kudlu Gate" <vishwa2o2ok@gmail.com>';
    await t.sendMail({
      from: fromAddr,
      to: recipient,
      subject: 'We received your enquiry - DTDC Kudlu Gate',
      text: `Hi ${name || 'there'},\n\nThanks for reaching out to DTDC Kudlu Gate. Our team will get back to you shortly.\n\n- DTDC Kudlu Gate`
    });
    return { sent: true };
  } catch (err) {
    console.error('Email send failed:', err.message);
    transporter = null;
    return { sent: false, reason: err.message };
  }
}

async function sendAdminEnquiryAlert({ name, phone, email, subject, message }) {
  const t = getTransporter();
  const adminTo = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'vishwa2o2ok@gmail.com';
  if (!t || !adminTo) return { sent: false, reason: 'email disabled or no admin address configured' };
  try {
    const fromAddr = process.env.EMAIL_FROM || '"DTDC Kudlu Gate" <vishwa2o2ok@gmail.com>';
    await t.sendMail({
      from: fromAddr,
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
    transporter = null;
    return { sent: false, reason: err.message };
  }
}

async function sendPasswordResetEmail({ to, name, resetLink }) {
  const t = getTransporter();
  const recipient = getRecipient(to);
  if (!t || !recipient) return { sent: false, reason: 'email disabled or no address' };
  try {
    const fromAddr = process.env.EMAIL_FROM || '"DTDC Kudlu Gate" <vishwa2o2ok@gmail.com>';
    await t.sendMail({
      from: fromAddr,
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
    transporter = null;
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendStatusEmail, sendEnquiryReceipt, sendAdminEnquiryAlert, sendPasswordResetEmail };
