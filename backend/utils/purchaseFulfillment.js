const { sendEmail } = require('./resendEmail');
const DIGITAL_PRODUCTS = require('../config/digitalProducts');

function formatDate(iso) {
  try {
    return new Date(iso || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Sends a single email covering both the payment receipt and, for
 * digital products with a configured file, an instant download link.
 * Safe to call for any purchase — silently no-ops on email failure so
 * approval flows never break because of a mail delivery issue.
 */
async function sendPurchaseFulfillment(purchase) {
  try {
    const { userEmail, courseId, courseName, amount, orderId, paymentMethod, verifiedAt } = purchase;
    if (!userEmail) return;

    const digital = DIGITAL_PRODUCTS[courseId];
    const downloadSection = (digital && digital.fileUrl)
      ? `<div style="text-align:center;margin:28px 0;">
           <a href="${digital.fileUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#3DFF6E,#1FAE4B);color:#04140a;text-decoration:none;border-radius:10px;font-weight:800;font-size:1rem;letter-spacing:.3px;">Download Now</a>
         </div>`
      : '';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d1117;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0a0a0d,#1FAE4B);padding:32px;text-align:center;">
          <img src="https://bullbearblockchain.com/images/bullbear-logo.png" alt="BullBear Trading" style="height:56px;width:auto;display:block;margin:0 auto 12px;">
          <h1 style="color:#fff;margin:0;font-size:1.6rem;font-weight:800;">BullBear Trading</h1>
          <p style="color:rgba(255,255,255,.75);margin:8px 0 0;font-size:.95rem;">Master the Markets</p>
        </div>
        <div style="padding:36px 32px;">
          <h2 style="color:#f1f5f9;font-size:1.25rem;margin:0 0 12px;">Thank you for your purchase!</h2>
          <p style="color:#94a3b8;line-height:1.7;margin:0 0 24px;">Your payment for <strong style="color:#7CFFA0;">${courseName || courseId}</strong> has been confirmed.${digital && digital.fileUrl ? ' Your download is ready below.' : ''}</p>
          ${downloadSection}
          <div style="background:rgba(255,255,255,.03);border:1px solid rgba(61,255,110,.18);border-radius:12px;padding:20px 24px;margin-top:8px;">
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06);"><span style="color:#64748b;font-size:.85rem;">Receipt / Order ID</span><span style="color:#e2e8f0;font-size:.85rem;font-weight:700;">${orderId || 'N/A'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06);"><span style="color:#64748b;font-size:.85rem;">Item</span><span style="color:#e2e8f0;font-size:.85rem;font-weight:700;">${courseName || courseId}</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06);"><span style="color:#64748b;font-size:.85rem;">Amount Paid</span><span style="color:#e2e8f0;font-size:.85rem;font-weight:700;">$${(parseFloat(amount) || 0).toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06);"><span style="color:#64748b;font-size:.85rem;">Payment Method</span><span style="color:#e2e8f0;font-size:.85rem;font-weight:700;text-transform:capitalize;">${paymentMethod || 'N/A'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;"><span style="color:#64748b;font-size:.85rem;">Date</span><span style="color:#e2e8f0;font-size:.85rem;font-weight:700;">${formatDate(verifiedAt)}</span></div>
          </div>
          <p style="color:#64748b;font-size:.8rem;line-height:1.6;margin:24px 0 0;">Keep this email as your receipt. Questions? Just reply to this email or reach us at info@bullbearblockchain.com.</p>
        </div>
        <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,.06);text-align:center;">
          <p style="color:#475569;font-size:.78rem;margin:0;">© ${new Date().getFullYear()} BullBear Trading · <a href="https://bullbearblockchain.com" style="color:#7CFFA0;">bullbearblockchain.com</a></p>
        </div>
      </div>
    `;

    await sendEmail({
      to: userEmail,
      subject: `Your BullBear Trading Receipt — ${courseName || courseId}`,
      html,
    });
  } catch (err) {
    console.error('Purchase fulfillment email error:', err.message);
  }
}

module.exports = { sendPurchaseFulfillment };
