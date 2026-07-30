const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const router = express.Router();
const { getDb } = require('../lib/firebase');

function verifyResendSignature(req) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return true; // skip if not configured

  const msgId = req.headers['svix-id'];
  const msgTimestamp = req.headers['svix-timestamp'];
  const msgSignature = req.headers['svix-signature'];

  if (!msgId || !msgTimestamp || !msgSignature) return false;

  // Reject timestamps older than 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(msgTimestamp, 10)) > 300) return false;

  const rawKey = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const toSign = `${msgId}.${msgTimestamp}.${req.rawBody || ''}`;
  const computed = crypto.createHmac('sha256', rawKey).update(toSign).digest('base64');

  return msgSignature.split(' ').some(sig => {
    const sigValue = sig.replace(/^v1,/, '');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(sigValue));
  });
}

const STATUS_MAP = { 'email.opened': 'opened', 'email.delivered': 'delivered', 'email.bounced': 'bounced' };

async function updateCampaignRecipientStatus(emailId, eventType) {
  if (!emailId) return;
  try {
    const db = getDb();
    const snap = await db.collection('email_campaign_recipients')
      .where('resendEmailId', '==', emailId).limit(1).get();
    if (snap.empty) return; // not a tracked bulk-email send

    const doc = snap.docs[0];
    const newStatus = STATUS_MAP[eventType];
    // Don't downgrade an 'opened' status back to 'delivered' if a delayed
    // delivered event arrives after the open event.
    if (doc.data().status === 'opened' && newStatus === 'delivered') return;

    const update = { status: newStatus };
    if (newStatus === 'opened' && !doc.data().openedAt) update.openedAt = new Date().toISOString();
    await doc.ref.update(update);
  } catch (err) {
    console.error('Failed to update campaign recipient status:', err.message);
  }
}

// POST /api/inbound/email — Resend inbound webhook or Google Apps Script
router.post('/email', async (req, res) => {
  const appScriptSecret = process.env.INBOUND_SECRET || 'bb-inbound-2026';
  const providedSecret = req.headers['x-bb-secret'];
  const validAppScript = providedSecret === appScriptSecret;
  const validResend = verifyResendSignature(req);

  if (!validAppScript && !validResend) {
    return res.status(401).json({ success: false, message: 'Invalid signature' });
  }

  try {
    const body = req.body || {};
    // Resend sends every email lifecycle event (sent/delivered/bounced/opened/...) to this
    // same webhook URL, enveloped as { type, data }. We only build a reply record for
    // email.received; a couple of other event types update bulk-email read tracking.
    const isResendEnvelope = typeof body.type === 'string' && body.data;
    if (isResendEnvelope && body.type !== 'email.received') {
      if (body.type === 'email.opened' || body.type === 'email.delivered' || body.type === 'email.bounced') {
        await updateCampaignRecipientStatus(body.data.email_id, body.type);
      }
      return res.json({ success: true, ignored: body.type });
    }
    const payload = isResendEnvelope ? body.data : body;
    const { from, to, subject, inReplyTo } = payload;
    const messageId = payload.messageId || payload.message_id;

    if (!from) return res.status(400).json({ success: false, message: 'No sender' });

    // Resend's webhook is metadata-only (no body/headers/attachments) by
    // design — the actual text/html must be fetched separately.
    let text = payload.text || '';
    let html = payload.html || '';
    const emailId = payload.email_id;
    if (isResendEnvelope && emailId && process.env.RESEND_API_KEY) {
      try {
        const full = await axios.get(`https://api.resend.com/emails/receiving/${emailId}`, {
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          timeout: 10000,
        });
        text = full.data.text || text;
        html = full.data.html || html;
      } catch (err) {
        console.error('Failed to fetch full inbound email body:', err.response?.data || err.message);
      }
    }

    const db = getDb();
    await db.collection('email_replies').add({
      from: from || '',
      to: Array.isArray(to) ? to.join(', ') : (to || ''),
      subject: subject || '(no subject)',
      text: text || '',
      html: html || '',
      messageId: messageId || '',
      inReplyTo: inReplyTo || '',
      read: false,
      receivedAt: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Inbound email error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
