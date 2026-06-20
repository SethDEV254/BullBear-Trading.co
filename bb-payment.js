/* ═══════════════════════════════════════════════════
   BullBear Payment Modal  — shared across all pages
   ═══════════════════════════════════════════════════ */
(function () {
  const PAYPAL_CLIENT_ID = 'AR2mGqK9aUHm9KFg7z3VWo54ILqueC8GpWNcSn1Z_IXq72lFC9mRZkBTEG_VU40kFu5yz__TxOJAWZVr';

  /* ── UPDATE THESE WITH YOUR REAL WALLET ADDRESSES ── */
  const BB_WALLETS = {
    usdt: { address: 'USDT_TRC20_ADDRESS_HERE', network: 'USDT · TRC-20 (Tron)' },
    btc:  { address: 'BTC_ADDRESS_HERE',         network: 'Bitcoin · BTC' },
    eth:  { address: 'ETH_ADDRESS_HERE',          network: 'Ethereum · ERC-20' },
  };
  /* ─────────────────────────────────────────────────── */

  let _config = null;
  let _paypalRendered = false;
  let _paypalLoaded = false;
  let _activeCoin = 'usdt';

  /* ── Inject CSS ── */
  const css = `
.bb-overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;animation:bbFadeIn .18s ease}
@keyframes bbFadeIn{from{opacity:0}to{opacity:1}}
.bb-modal{background:linear-gradient(145deg,#0d1117,#161b27);border:1px solid rgba(124,58,237,.22);border-radius:24px;width:100%;max-width:840px;display:grid;grid-template-columns:320px 1fr;overflow:hidden;box-shadow:0 50px 120px rgba(0,0,0,.9),0 0 0 1px rgba(124,58,237,.08),inset 0 1px 0 rgba(255,255,255,.04);position:relative;animation:bbSlideUp .22s ease}
@keyframes bbSlideUp{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}
.bb-close{position:absolute;top:14px;right:14px;width:30px;height:30px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:50%;color:rgba(255,255,255,.5);font-size:13px;cursor:pointer;z-index:2;display:flex;align-items:center;justify-content:center;transition:all .2s;line-height:1}
.bb-close:hover{background:rgba(255,255,255,.16);color:#fff}
.bb-left{background:linear-gradient(160deg,rgba(124,58,237,.13),rgba(217,70,239,.06));border-right:1px solid rgba(124,58,237,.18);padding:36px 26px;display:flex;flex-direction:column}
.bb-icon{width:52px;height:52px;background:linear-gradient(135deg,#7c3aed,#d946ef);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:18px;box-shadow:0 8px 28px rgba(124,58,237,.4)}
.bb-tag{display:inline-block;background:rgba(124,58,237,.18);border:1px solid rgba(124,58,237,.35);color:#a78bfa;font-size:.68rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:4px 10px;border-radius:20px;margin-bottom:10px}
.bb-pname{font-size:1.25rem;font-weight:800;color:#fff;margin:0 0 2px;line-height:1.3}
.bb-price{margin:14px 0 18px;display:flex;align-items:baseline;gap:3px}
.bb-price-main{font-size:2.8rem;font-weight:900;color:#fff;line-height:1}
.bb-price-per{font-size:.85rem;color:rgba(255,255,255,.38);font-weight:500}
.bb-feats{list-style:none;padding:0;margin:0 0 20px;flex:1;border-top:1px solid rgba(255,255,255,.06);padding-top:16px}
.bb-feats li{padding:8px 0;color:rgba(255,255,255,.72);font-size:.875rem;display:flex;align-items:center;gap:9px;border-bottom:1px solid rgba(255,255,255,.05)}
.bb-feats li .ck{color:#10b981;font-weight:700;font-size:.8rem;flex-shrink:0}
.bb-trust{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto;padding-top:18px;border-top:1px solid rgba(255,255,255,.06)}
.bb-trust span{font-size:.72rem;color:rgba(255,255,255,.38);display:flex;align-items:center;gap:4px}
.bb-right{padding:34px 30px;overflow-y:auto;max-height:92vh}
.bb-right h3{font-size:1.05rem;font-weight:700;color:#fff;margin:0 0 18px}
.bb-inp{width:100%;padding:13px 15px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;color:#fff;font-size:.93rem;margin-bottom:14px;outline:none;box-sizing:border-box;transition:border-color .2s;font-family:inherit}
.bb-inp:focus{border-color:rgba(124,58,237,.6);background:rgba(124,58,237,.05)}
.bb-inp::placeholder{color:rgba(255,255,255,.28)}
.bb-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;padding:3px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:13px;margin-bottom:22px}
.bb-tb{padding:9px 6px;border:none;border-radius:10px;background:transparent;color:rgba(255,255,255,.42);font-weight:600;font-size:.82rem;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:5px;font-family:inherit}
.bb-tb.active{background:rgba(124,58,237,.72);color:#fff;box-shadow:0 4px 14px rgba(124,58,237,.38)}
.bb-pane{display:none}.bb-pane.active{display:block}
.bb-coins{display:flex;gap:7px;margin-bottom:14px}
.bb-coin{flex:1;padding:9px 5px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:10px;color:rgba(255,255,255,.45);font-size:.78rem;font-weight:700;cursor:pointer;transition:all .2s;text-align:center;font-family:inherit}
.bb-coin.active[data-c="usdt"]{border-color:#26a17b;color:#26a17b;background:rgba(38,161,123,.1)}
.bb-coin.active[data-c="btc"]{border-color:#f7931a;color:#f7931a;background:rgba(247,147,26,.1)}
.bb-coin.active[data-c="eth"]{border-color:#627eea;color:#627eea;background:rgba(98,126,234,.1)}
.bb-addr-block{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:15px;margin-bottom:13px}
.bb-addr-lbl{font-size:.7rem;color:rgba(255,255,255,.38);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
.bb-net{display:inline-flex;align-items:center;gap:5px;background:rgba(38,161,123,.1);border:1px solid rgba(38,161,123,.22);color:#26a17b;font-size:.68rem;font-weight:700;padding:3px 9px;border-radius:6px;margin-bottom:9px;letter-spacing:.5px}
.bb-addr-val{font-family:'Courier New',monospace;font-size:.75rem;color:#a78bfa;word-break:break-all;line-height:1.6;margin-bottom:9px}
.bb-copy{display:inline-flex;align-items:center;gap:5px;padding:6px 13px;background:rgba(124,58,237,.14);border:1px solid rgba(124,58,237,.28);border-radius:8px;color:#a78bfa;font-size:.77rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit}
.bb-copy:hover{background:rgba(124,58,237,.28)}
.bb-amt{background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.2);border-radius:10px;padding:12px 15px;margin-bottom:13px;display:flex;align-items:center;justify-content:space-between}
.bb-amt span{color:rgba(255,255,255,.45);font-size:.83rem}
.bb-amt strong{color:#10b981;font-size:.95rem;font-weight:700}
.bb-mpesa-box{background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:15px;text-align:center;margin-bottom:14px}
.bb-mpesa-box .k{font-size:1.7rem;font-weight:900;color:#10b981}
.bb-mpesa-box .eq{font-size:.78rem;color:rgba(255,255,255,.38);margin-top:2px}
.bb-btn{width:100%;padding:14px;border:none;border-radius:12px;font-size:.92rem;font-weight:700;cursor:pointer;transition:all .25s;margin-top:5px;font-family:inherit}
.bb-btn-purple{background:linear-gradient(135deg,#7c3aed,#d946ef);color:#fff}
.bb-btn-purple:hover{transform:translateY(-1px);box-shadow:0 8px 26px rgba(124,58,237,.48)}
.bb-btn-green{background:linear-gradient(135deg,#10b981,#059669);color:#fff}
.bb-btn-green:hover{transform:translateY(-1px);box-shadow:0 8px 26px rgba(16,185,129,.38)}
.bb-note{font-size:.75rem;color:rgba(255,255,255,.3);text-align:center;margin-top:10px;line-height:1.5}
.bb-divider{height:1px;background:rgba(255,255,255,.06);margin:18px 0}
@media(max-width:680px){.bb-modal{grid-template-columns:1fr}.bb-left{border-right:none;border-bottom:1px solid rgba(124,58,237,.18);padding:26px 22px}.bb-right{padding:26px 22px}.bb-price-main{font-size:2.2rem}}
`;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── Modal open ── */
  window.openBBPaymentModal = function (config) {
    _config = config;
    _paypalRendered = false;
    _activeCoin = 'usdt';

    document.getElementById('bb-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'bb-overlay';
    overlay.className = 'bb-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) closeBBModal(); };

    const feats = (config.features || []).map(f => `<li><span class="ck">✓</span>${f}</li>`).join('');

    overlay.innerHTML = `
      <div class="bb-modal">
        <button class="bb-close" onclick="closeBBModal()">✕</button>

        <div class="bb-left">
          <div class="bb-icon">${config.icon || '🎓'}</div>
          <span class="bb-tag">${config.tag || 'Purchase'}</span>
          <h2 class="bb-pname">${config.name}</h2>
          <div class="bb-price">
            <span class="bb-price-main">$${config.amount}</span>
            <span class="bb-price-per">${config.period || ''}</span>
          </div>
          <ul class="bb-feats">${feats}</ul>
          <div class="bb-trust">
            <span>🔒 256-bit SSL</span>
            <span>⚡ Instant access</span>
            <span>✓ Verified</span>
          </div>
        </div>

        <div class="bb-right">
          <h3>Complete your purchase</h3>
          <input id="bb-email" class="bb-inp" type="email" placeholder="your@email.com" />

          <div class="bb-tabs">
            <button class="bb-tb active" onclick="switchBBTab('paypal')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.63 3.993a.804.804 0 01-.794.679H7.72a.483.483 0 01-.477-.558L9.22 7.08a.965.965 0 01.952-.814h4.645c1.683.094 2.765.672 3.256 2.212z"/></svg>
              PayPal
            </button>
            <button class="bb-tb" onclick="switchBBTab('mpesa')">📱 M-Pesa</button>
            <button class="bb-tb" onclick="switchBBTab('crypto')">₿ Crypto</button>
          </div>

          <div id="bb-pane-paypal" class="bb-pane active">
            <div id="bb-paypal-container" style="min-height:50px;"></div>
            <p class="bb-note">Redirected to PayPal to complete payment securely.</p>
          </div>

          <div id="bb-pane-mpesa" class="bb-pane">
            <div class="bb-mpesa-box">
              <div class="k">KES ${(config.mpesaAmount || 0).toLocaleString()}</div>
              <div class="eq">≈ $${config.amount} USD</div>
            </div>
            <input id="bb-mpesa-phone" class="bb-inp" type="tel" placeholder="e.g. 0712 345 678" maxlength="10" />
            <button class="bb-btn bb-btn-green" onclick="initiateBBMpesa()">📱 Send M-Pesa Prompt</button>
            <p class="bb-note">A prompt is sent to your Safaricom number. Enter your PIN to confirm.</p>
          </div>

          <div id="bb-pane-crypto" class="bb-pane">
            <div class="bb-coins">
              <button class="bb-coin active" data-c="usdt" onclick="switchBBCoin('usdt')">₮ USDT</button>
              <button class="bb-coin" data-c="btc"  onclick="switchBBCoin('btc')">₿ BTC</button>
              <button class="bb-coin" data-c="eth"  onclick="switchBBCoin('eth')">Ξ ETH</button>
            </div>
            <div class="bb-addr-block">
              <div class="bb-addr-lbl">Send exactly $${config.amount} USD worth to:</div>
              <div id="bb-net-badge" class="bb-net">USDT · TRC-20 (Tron)</div>
              <div id="bb-addr-val" class="bb-addr-val">${BB_WALLETS.usdt.address}</div>
              <button class="bb-copy" onclick="copyBBAddress()">📋 Copy Address</button>
            </div>
            <div class="bb-amt">
              <span>Amount due</span>
              <strong>$${config.amount} USD</strong>
            </div>
            <input id="bb-tx-hash" class="bb-inp" type="text" placeholder="Paste transaction hash after paying" />
            <button class="bb-btn bb-btn-purple" onclick="submitBBCrypto()">Confirm Crypto Payment</button>
            <p class="bb-note">⚠ Double-check the address and network. Crypto payments are irreversible.</p>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    /* Auto-fill email */
    const token = localStorage.getItem('bullbearToken');
    if (token) {
      const base = window.API_BASE || 'https://backend-tawny-nu-33.vercel.app/api';
      fetch(base + '/auth/me', { headers: { Authorization: 'Bearer ' + token } })
        .then(r => r.json())
        .then(d => { const el = document.getElementById('bb-email'); if (el && d.data?.email) el.value = d.data.email; })
        .catch(() => {});
    }

    /* Render PayPal */
    _loadPayPal(() => {
      if (_paypalRendered) return;
      _paypalRendered = true;
      const base = window.API_BASE || 'https://backend-tawny-nu-33.vercel.app/api';
      paypal.Buttons({
        style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' },
        createOrder: async () => {
          const res = await fetch(base + '/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: _config.amount, courseId: _config.courseId, currency: 'USD' }),
          });
          const d = await res.json();
          if (!d.orderId) throw new Error('Order creation failed');
          return d.orderId;
        },
        onApprove: async (data) => {
          const email = document.getElementById('bb-email')?.value?.trim();
          if (!email) { alert('Please enter your email address.'); return; }
          const res = await fetch(base + '/paypal/capture-order/' + data.orderID, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: email, courseId: _config.courseId, amount: _config.amount }),
          });
          const result = await res.json();
          if (result.status === 'success') {
            closeBBModal();
            _config.onSuccess?.('paypal');
            showBBToast('Payment successful! Access unlocked.', 'green');
          } else {
            alert('Payment verification failed. Contact support.');
          }
        },
        onError: (err) => {
          console.error('PayPal error:', err);
          alert('PayPal payment failed. Try again or use a different method.');
        },
      }).render('#bb-paypal-container');
    });
  };

  window.closeBBModal = function () {
    document.getElementById('bb-overlay')?.remove();
    _paypalRendered = false;
  };

  window.switchBBTab = function (tab) {
    document.querySelectorAll('.bb-tb').forEach((b, i) => {
      b.classList.toggle('active', ['paypal', 'mpesa', 'crypto'][i] === tab);
    });
    document.querySelectorAll('.bb-pane').forEach(p => p.classList.remove('active'));
    document.getElementById('bb-pane-' + tab)?.classList.add('active');
  };

  window.switchBBCoin = function (coin) {
    _activeCoin = coin;
    document.querySelectorAll('.bb-coin').forEach(b => b.classList.toggle('active', b.dataset.c === coin));
    document.getElementById('bb-addr-val').textContent = BB_WALLETS[coin].address;
    document.getElementById('bb-net-badge').textContent = BB_WALLETS[coin].network;
  };

  window.copyBBAddress = function () {
    const addr = document.getElementById('bb-addr-val')?.textContent;
    if (!addr) return;
    navigator.clipboard.writeText(addr).then(() => {
      const btn = document.querySelector('.bb-copy');
      if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => (btn.textContent = '📋 Copy Address'), 2000); }
    });
  };

  window.initiateBBMpesa = async function () {
    const phone = document.getElementById('bb-mpesa-phone')?.value?.trim();
    const email = document.getElementById('bb-email')?.value?.trim();
    if (!email) { alert('Enter your email address first.'); return; }
    if (!phone || phone.length < 9) { alert('Enter a valid Safaricom number.'); return; }

    const btn = document.querySelector('#bb-pane-mpesa .bb-btn');
    const orig = btn.textContent;
    btn.textContent = '⏳ Sending prompt...';
    btn.disabled = true;

    const base = window.API_BASE || 'https://backend-tawny-nu-33.vercel.app/api';
    try {
      const res = await fetch(base + '/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          amount: _config.mpesaAmount,
          accountReference: email,
          transactionDesc: 'BullBear - ' + _config.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        btn.textContent = '✅ Prompt Sent!';
        await fetch(base + '/purchases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: email,
            courseId: _config.courseId,
            amount: _config.amount,
            paymentMethod: 'mpesa',
            orderId: data.data?.CheckoutRequestID || ('MPESA-' + Date.now()),
            transactionId: data.data?.CheckoutRequestID || '',
          }),
        });
        showBBToast('📱 M-Pesa prompt sent! Enter your PIN on your phone to complete.', 'green');
        setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 5000);
      } else {
        throw new Error(data.message || 'Failed to send prompt');
      }
    } catch (err) {
      alert('M-Pesa error: ' + err.message);
      btn.textContent = orig;
      btn.disabled = false;
    }
  };

  window.submitBBCrypto = async function () {
    const email = document.getElementById('bb-email')?.value?.trim();
    const txHash = document.getElementById('bb-tx-hash')?.value?.trim();
    if (!email) { alert('Enter your email address first.'); return; }
    if (!txHash) { alert('Paste your transaction hash after sending payment.'); return; }

    const btn = document.querySelector('#bb-pane-crypto .bb-btn');
    const orig = btn.textContent;
    btn.textContent = '⏳ Submitting...';
    btn.disabled = true;

    const base = window.API_BASE || 'https://backend-tawny-nu-33.vercel.app/api';
    try {
      const res = await fetch(base + '/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: email,
          courseId: _config.courseId,
          amount: _config.amount,
          paymentMethod: 'crypto_' + _activeCoin,
          orderId: txHash,
          transactionId: txHash,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        closeBBModal();
        showBBToast('₿ Crypto payment submitted! Access will be granted once confirmed on-chain.', 'purple');
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (err) {
      alert('Error: ' + err.message);
      btn.textContent = orig;
      btn.disabled = false;
    }
  };

  window.showBBToast = function (msg, color) {
    const cols = { green: '#10b981', purple: '#7c3aed', blue: '#3b82f6' };
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;top:20px;right:20px;background:${cols[color] || cols.green};color:#fff;padding:14px 20px;border-radius:12px;font-weight:700;font-size:.88rem;z-index:99999;box-shadow:0 8px 28px rgba(0,0,0,.4);max-width:340px;line-height:1.5;animation:bbFadeIn .18s ease;`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 5000);
  };

  function _loadPayPal(cb) {
    if (window.paypal) { cb(); return; }
    if (_paypalLoaded) {
      const iv = setInterval(() => { if (window.paypal) { clearInterval(iv); cb(); } }, 80);
      return;
    }
    _paypalLoaded = true;
    const s = document.createElement('script');
    s.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    s.onload = cb;
    document.head.appendChild(s);
  }
})();
