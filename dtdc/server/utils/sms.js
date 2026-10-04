// SMS is optional because it needs a paid Twilio account. If SMS_ENABLED is
// not "true" in .env, this quietly does nothing - email notifications still work.
// To use it: npm install twilio, then set the TWILIO_* vars in .env.

let client = null;

function getClient() {
  if (process.env.SMS_ENABLED !== 'true') return null;
  if (client) return client;
  try {
    const twilio = require('twilio');
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    return client;
  } catch (err) {
    console.warn('SMS_ENABLED is true but the "twilio" package is not installed. Run: npm install twilio');
    return null;
  }
}

async function sendStatusSms({ to, trackingId, status }) {
  const c = getClient();
  if (!c || !to) return { sent: false };
  try {
    await c.messages.create({
      from: process.env.TWILIO_FROM_NUMBER,
      to,
      body: `DTDC Kudlu Gate: parcel ${trackingId} is now "${status}".`
    });
    return { sent: true };
  } catch (err) {
    console.error('SMS send failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendStatusSms };
