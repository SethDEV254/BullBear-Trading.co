const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../lib/firebase');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// POST /api/checklist/send-email
router.post('/send-email', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const pdfPath = path.join(__dirname, '../../crypto-quickstart-checklist.pdf');
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ success: false, message: 'Checklist PDF not found' });
    }

    const mailOptions = {
      from: `"BullBear Trading" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 Your FREE Crypto Quickstart Checklist - BullBear Trading',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:#ffffff;border-radius:10px;">
          <h1 style="color:#06b6d4;font-size:28px;">Welcome to BullBear Trading! 🚀</h1>
          <p style="color:#e2e8f0;">Hi ${name}, your 5-Step Crypto Quickstart Checklist is attached!</p>
          ${phone ? `<p style="color:#94a3b8;font-size:14px;">Phone: ${phone}</p>` : ''}
          <p style="color:#64748b;font-size:12px;">© ${new Date().getFullYear()} BullBear Trading. All rights reserved.</p>
        </div>
      `,
      attachments: [{
        filename: 'BullBear-Trading-Crypto-Quickstart-Checklist.pdf',
        path: pdfPath,
      }],
    };

    await transporter.sendMail(mailOptions);
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
