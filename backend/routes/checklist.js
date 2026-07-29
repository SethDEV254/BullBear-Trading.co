const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/resendEmail');
const { getDb } = require('../lib/firebase');

// POST /api/checklist/send-email
router.post('/send-email', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const pdfUrl = 'https://bullbearblockchain.com/crypto-quickstart-checklist.pdf';

    const mailOptions = {
      from: `"BullBear Trading" <${process.env.EMAIL_FROM || 'info@bullbearblockchain.com'}>`,
      to: email,
      subject: 'Your FREE Crypto Quickstart Checklist - BullBear Trading',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px;text-align:center;">
            <img src="https://bullbearblockchain.com/images/bullbear-logo.png" alt="BullBear Trading" style="height:56px;width:auto;display:block;margin:0 auto 12px;">
            <h1 style="color:#fff;margin:0;font-size:1.6rem;font-weight:800;">BullBear Trading</h1>
            <p style="color:rgba(255,255,255,.75);margin:8px 0 0;font-size:.95rem;">Master the Markets</p>
          </div>
          <div style="padding:36px 32px;">
            <h2 style="color:#f1f5f9;font-size:1.25rem;margin:0 0 12px;">Hi ${name},</h2>
            <p style="color:#94a3b8;line-height:1.7;margin:0 0 24px;">Your <strong style="color:#c4b5fd;">Free Crypto Quickstart Checklist</strong> is ready. Click the button below to download it instantly.</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${pdfUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:1rem;letter-spacing:.3px;">Download Free PDF</a>
            </div>
            <p style="color:#64748b;font-size:.85rem;line-height:1.6;margin:0;">Inside you'll find step-by-step guidance on wallets, exchanges, funding your account, and making your first crypto trade the right way.</p>
          </div>
          <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,.06);text-align:center;">
            <p style="color:#475569;font-size:.78rem;margin:0;">© ${new Date().getFullYear()} BullBear Trading · <a href="https://bullbearblockchain.com" style="color:#a78bfa;">bullbearblockchain.com</a></p>
          </div>
        </div>
      `,
    };

    await sendEmail({ to: email, subject: mailOptions.subject, html: mailOptions.html });
    res.json({ success: true, message: 'Checklist email sent successfully' });
  } catch (error) {
    console.error('Checklist email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send checklist email', error: error.message });
  }
});

// POST /api/checklist/lead
router.post('/lead', async (req, res) => {
  try {
    const { name, email, phone, source } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const db = getDb();
    const col = db.collection('checklist_leads');

    const existing = await col.where('email', '==', email.toLowerCase().trim()).limit(1).get();
    if (!existing.empty) {
      return res.json({ success: true, message: 'Lead already recorded', existing: true });
    }

    await col.add({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '',
      source: source || 'index',
      downloadedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ success: true, message: 'Lead saved successfully' });
  } catch (error) {
    console.error('Checklist lead error:', error);
    res.status(500).json({ success: false, message: 'Failed to save lead', error: error.message });
  }
});

// GET /api/checklist/leads
router.get('/leads', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('checklist_leads').orderBy('createdAt', 'desc').get();
    const leads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: leads, total: leads.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
