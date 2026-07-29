const axios = require('axios');

const FROM = (process.env.EMAIL_FROM || 'info@bullbearblockchain.com').trim();
const API_KEY = (process.env.RESEND_API_KEY || '').trim();
const REPLY_TO = 'info@bullbearblockchain.com';

async function sendEmail({ to, subject, html, text, headers }) {
  try {
    const payload = { from: `BullBear Trading <${FROM}>`, to, subject, html, reply_to: REPLY_TO };
    if (text) payload.text = text;
    if (headers) payload.headers = headers;
    const res = await axios.post(
      'https://api.resend.com/emails',
      payload,
      { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
    );
    return res.data;
  } catch (err) {
    const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    throw new Error(detail);
  }
}

module.exports = { sendEmail };
