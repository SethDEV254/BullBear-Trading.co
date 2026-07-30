/* ═══════════════════════════════════════════════════
   BullBear Payment Modal  — shared across all pages
   ═══════════════════════════════════════════════════ */
(function () {
  const PAYPAL_CLIENT_ID = 'AR2mGqK9aUHm9KFg7z3VWo54ILqueC8GpWNcSn1Z_IXq72lFC9mRZkBTEG_VU40kFu5yz__TxOJAWZVr';

  /* ── UPDATE THESE WITH YOUR REAL WALLET ADDRESSES ── */
  const BB_WALLETS = {
    usdt: {
      address: 'USDT_TRC20_ADDRESS_HERE',
      network: 'TRC-20 (Tron)',
      label: 'USDT',
      color: '#26a17b',
      bg: 'rgba(38,161,123,.12)',
      symbol: '₮',
      logo: `<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#26a17b"/><path d="M17.922 17.383v-.002c-.112.008-.687.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657zm0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.126 0 1.053 3.309 1.924 7.709 2.126v7.607h3.913v-7.611c4.392-.202 7.694-1.073 7.694-2.122 0-1.05-3.302-1.92-7.694-2.125z" fill="white"/></svg>`,
    },
    btc: {
      address: 'BTC_ADDRESS_HERE',
      network: 'Bitcoin Network',
      label: 'BTC',
      color: '#f7931a',
      bg: 'rgba(247,147,26,.12)',
      symbol: '₿',
      logo: `<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#f7931a"/><path d="M22.283 14.144c.313-2.098-1.284-3.226-3.469-3.98l.709-2.841-1.729-.431-.69 2.768c-.455-.113-.922-.22-1.387-.326l.695-2.785-1.728-.431-.709 2.84c-.376-.086-.746-.17-1.104-.259l.002-.009-2.385-.596-.46 1.847s1.284.294 1.257.312c.7.175.827.638.806 1.006l-.807 3.237c.048.012.111.03.18.058l-.183-.046-1.131 4.538c-.086.213-.303.533-.793.411.017.025-1.258-.314-1.258-.314l-.859 1.977 2.25.561c.419.105.829.215 1.233.318l-.716 2.872 1.727.431.709-2.843c.472.128.93.246 1.378.358l-.707 2.83 1.729.431.716-2.865c2.951.558 5.17.333 6.103-2.337.752-2.146-.038-3.385-1.589-4.193 1.131-.261 1.983-1.005 2.21-2.541zm-3.954 5.545c-.535 2.146-4.151.987-5.325.695l.95-3.807c1.175.293 4.943.874 4.375 3.112zm.534-5.577c-.487 1.953-3.496.961-4.473.718l.861-3.452c.977.244 4.12.697 3.612 2.734z" fill="white"/></svg>`,
    },
    eth: {
      address: '0xD384588c82Aad6F3F39E9Bb8f3A9C626F88CB42E',
      network: 'Ethereum · ERC-20',
      label: 'ETH',
      color: '#627eea',
      bg: 'rgba(98,126,234,.12)',
      symbol: 'Ξ',
      logo: `<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#627eea"/><path d="M16 5l-.183.622v14.09l.183.182 8.385-4.955L16 5z" fill="rgba(255,255,255,.9)"/><path d="M16 5L7.615 14.939l8.385 4.955V5z" fill="white"/><path d="M16 21.573l-.103.126v6.44L16 28.5l8.389-11.82L16 21.573z" fill="rgba(255,255,255,.9)"/><path d="M16 28.5v-6.927l-8.385-4.893L16 28.5z" fill="white"/></svg>`,
    },
  };

  let _config = null;
  let _paypalRendered = false;
  let _paypalLoaded = false;
  let _activeCoin = 'usdt';

  /* ── CSS ── */
  const css = `
/* Overlay */
.bb-overlay{position:fixed;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;animation:bbFadeIn .2s ease}
@keyframes bbFadeIn{from{opacity:0}to{opacity:1}}

/* Modal shell */
.bb-modal{background:linear-gradient(160deg,#0d1117 0%,#111827 100%);border:1px solid rgba(255,255,255,.07);border-radius:24px;width:100%;max-width:860px;display:grid;grid-template-columns:300px 1fr;overflow:hidden;box-shadow:0 60px 140px rgba(0,0,0,.95),0 0 0 1px rgba(255,255,255,.04),inset 0 1px 0 rgba(255,255,255,.05);position:relative;animation:bbSlideUp .24s cubic-bezier(.4,0,.2,1)}
@keyframes bbSlideUp{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}

/* Close */
.bb-close{position:absolute;top:16px;right:16px;width:32px;height:32px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:50%;color:rgba(255,255,255,.45);font-size:14px;cursor:pointer;z-index:2;display:flex;align-items:center;justify-content:center;transition:all .2s;line-height:1;font-family:inherit}
.bb-close:hover{background:rgba(255,255,255,.14);color:#fff;transform:rotate(90deg)}

/* Left panel */
.bb-left{background:linear-gradient(165deg,rgba(16,185,129,.18) 0%,rgba(0,0,0,0) 60%);border-right:1px solid rgba(255,255,255,.06);padding:36px 28px;display:flex;flex-direction:column;position:relative;overflow:hidden}
.bb-left::before{content:'';position:absolute;top:-60px;left:-60px;width:200px;height:200px;background:radial-gradient(circle,rgba(16,185,129,.25) 0%,transparent 70%);pointer-events:none}
.bb-icon-wrap{width:56px;height:56px;background:linear-gradient(135deg,#10b981,#059669);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:1.6rem;margin-bottom:20px;box-shadow:0 8px 30px rgba(16,185,129,.45),inset 0 1px 0 rgba(255,255,255,.2)}
.bb-tag{display:inline-block;background:rgba(16,185,129,.2);border:1px solid rgba(16,185,129,.4);color:#6ee7b7;font-size:.67rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:4px 12px;border-radius:20px;margin-bottom:12px}
.bb-pname{font-size:1.2rem;font-weight:800;color:#fff;margin:0 0 4px;line-height:1.3;letter-spacing:-.2px}
.bb-price-row{margin:16px 0 22px;display:flex;align-items:baseline;gap:4px}
.bb-price-main{font-size:3rem;font-weight:900;color:#fff;line-height:1;letter-spacing:-2px;background:linear-gradient(135deg,#fff 40%,rgba(255,255,255,.7));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.bb-price-per{font-size:.85rem;color:rgba(255,255,255,.35);font-weight:500}
.bb-feats{list-style:none;padding:0;margin:0 0 24px;flex:1;border-top:1px solid rgba(255,255,255,.06);padding-top:18px}
.bb-feats li{padding:8px 0;color:rgba(255,255,255,.65);font-size:.845rem;display:flex;align-items:flex-start;gap:10px;border-bottom:1px solid rgba(255,255,255,.04);line-height:1.4}
.bb-feats li .ck{width:18px;height:18px;background:rgba(16,185,129,.18);border:1px solid rgba(16,185,129,.3);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#10b981;font-weight:800;font-size:.66rem;flex-shrink:0;margin-top:1px}
.bb-trust{display:flex;flex-direction:column;gap:8px;margin-top:auto;padding-top:20px;border-top:1px solid rgba(255,255,255,.05)}
.bb-trust-row{display:flex;align-items:center;gap:8px;color:rgba(255,255,255,.3);font-size:.75rem}
.bb-trust-row svg{flex-shrink:0;opacity:.5}

/* Right panel */
.bb-right{padding:32px 28px;overflow-y:auto;max-height:92vh;display:flex;flex-direction:column;gap:0}
.bb-right-title{font-size:1.05rem;font-weight:700;color:#fff;margin:0 0 20px;letter-spacing:-.2px}

/* Email input */
.bb-email-wrap{position:relative;margin-bottom:20px}
.bb-email-wrap svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);opacity:.35;pointer-events:none}
.bb-inp{width:100%;padding:13px 15px 13px 42px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:12px;color:#fff;font-size:.9rem;outline:none;box-sizing:border-box;transition:border-color .2s,background .2s;font-family:inherit}
.bb-inp:focus{border-color:rgba(16,185,129,.6);background:rgba(16,185,129,.05)}
.bb-inp::placeholder{color:rgba(255,255,255,.25)}
.bb-inp.plain{padding-left:15px}

/* Method tabs */
.bb-tabs{display:flex;gap:0;padding:4px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:14px;margin-bottom:24px}
.bb-tb{flex:1;padding:10px 8px;border:none;border-radius:11px;background:transparent;color:rgba(255,255,255,.38);font-weight:600;font-size:.8rem;cursor:pointer;transition:all .22s;display:flex;align-items:center;justify-content:center;gap:6px;font-family:inherit;letter-spacing:.1px}
.bb-tb.active{background:rgba(16,185,129,.75);color:#fff;box-shadow:0 4px 18px rgba(16,185,129,.45),inset 0 1px 0 rgba(255,255,255,.15)}
.bb-tb:not(.active):hover{color:rgba(255,255,255,.7);background:rgba(255,255,255,.05)}
.bb-pane{display:none}.bb-pane.active{display:block}

/* PayPal pane */
.bb-paypal-note{font-size:.77rem;color:rgba(255,255,255,.28);text-align:center;margin-top:12px;line-height:1.5}

/* M-Pesa pane */
.bb-mpesa-amount{background:linear-gradient(135deg,rgba(16,185,129,.12),rgba(5,150,105,.06));border:1px solid rgba(16,185,129,.2);border-radius:14px;padding:20px;text-align:center;margin-bottom:16px}
.bb-mpesa-kes{font-size:2.4rem;font-weight:900;color:#10b981;letter-spacing:-1px;line-height:1}
.bb-mpesa-usd{font-size:.8rem;color:rgba(255,255,255,.3);margin-top:4px}
.bb-mpesa-steps{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px 16px;margin-bottom:16px}
.bb-mpesa-step{display:flex;align-items:center;gap:10px;padding:6px 0;color:rgba(255,255,255,.5);font-size:.8rem}
.bb-mpesa-step:not(:last-child){border-bottom:1px solid rgba(255,255,255,.04)}
.bb-step-num{width:22px;height:22px;border-radius:50%;background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);color:#10b981;font-size:.7rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.bb-btn-green-wrap{position:relative;margin-bottom:8px}
.bb-btn{width:100%;padding:14px;border:none;border-radius:12px;font-size:.92rem;font-weight:700;cursor:pointer;transition:all .25s;font-family:inherit;letter-spacing:.2px}
.bb-btn-purple{background:linear-gradient(135deg,#10b981,#059669);color:#fff;box-shadow:0 4px 20px rgba(16,185,129,.35)}
.bb-btn-purple:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(16,185,129,.5)}
.bb-btn-green{background:linear-gradient(135deg,#10b981,#059669);color:#fff;box-shadow:0 4px 20px rgba(16,185,129,.3)}
.bb-btn-green:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(16,185,129,.45)}
.bb-btn:disabled{opacity:.5;cursor:not-allowed;transform:none !important}

/* Crypto pane */
.bb-coins{display:flex;gap:8px;margin-bottom:16px}
.bb-coin{flex:1;padding:12px 8px 10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;color:rgba(255,255,255,.4);font-size:.77rem;font-weight:700;cursor:pointer;transition:all .22s;text-align:center;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:6px}
.bb-coin .coin-logo{width:32px;height:32px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;transition:transform .2s}
.bb-coin:hover .coin-logo{transform:scale(1.08)}
.bb-coin.active{box-shadow:0 0 20px var(--cc,rgba(99,102,241,.2))}
.bb-coin.active[data-c="usdt"]{--cc:rgba(38,161,123,.3);border-color:#26a17b;color:#26a17b;background:rgba(38,161,123,.1)}
.bb-coin.active[data-c="btc"]{--cc:rgba(247,147,26,.3);border-color:#f7931a;color:#f7931a;background:rgba(247,147,26,.1)}
.bb-coin.active[data-c="eth"]{--cc:rgba(98,126,234,.3);border-color:#627eea;color:#627eea;background:rgba(98,126,234,.1)}

/* Due amount bar */
.bb-due{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:12px 16px;margin-bottom:16px}
.bb-due-lbl{font-size:.78rem;color:rgba(255,255,255,.35);font-weight:600;text-transform:uppercase;letter-spacing:.8px}
.bb-due-amt{font-size:1.1rem;font-weight:900;color:#fff}

/* QR + address row */
.bb-crypto-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:20px;margin-bottom:14px}
.bb-crypto-inner{display:flex;gap:20px;align-items:flex-start}
.bb-qr-frame{flex-shrink:0;position:relative}
.bb-qr-outer{width:126px;height:126px;background:#fff;border-radius:14px;padding:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 1px rgba(255,255,255,.12),0 8px 30px rgba(0,0,0,.5)}
.bb-qr-outer img{width:110px;height:110px;display:block;border-radius:6px}
.bb-qr-badge{position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);background:#0d1117;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:3px 10px;font-size:.67rem;font-weight:800;letter-spacing:.5px;white-space:nowrap}
.bb-addr-col{flex:1;min-width:0}
.bb-net-pill{display:inline-flex;align-items:center;gap:6px;font-size:.7rem;font-weight:700;padding:5px 12px;border-radius:20px;margin-bottom:12px;letter-spacing:.5px;border:1px solid;transition:all .2s}
.bb-addr-lbl{font-size:.68rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px}
.bb-addr-box{background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 12px;font-family:'Courier New',monospace;font-size:.7rem;color:rgba(255,255,255,.65);word-break:break-all;line-height:1.65;margin-bottom:10px;position:relative}
.bb-copy-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:rgba(16,185,129,.14);border:1px solid rgba(16,185,129,.3);border-radius:9px;color:#6ee7b7;font-size:.76rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit}
.bb-copy-btn:hover{background:rgba(16,185,129,.28);transform:translateY(-1px)}
.bb-copy-btn.copied{background:rgba(16,185,129,.14);border-color:rgba(16,185,129,.3);color:#6ee7b7}

/* Warning */
.bb-warn{display:flex;gap:10px;align-items:flex-start;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.18);border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:.77rem;color:rgba(245,158,11,.85);line-height:1.55}
.bb-warn-icon{flex-shrink:0;margin-top:1px;font-size:.9rem}

/* TX hash */
.bb-tx-label{font-size:.75rem;color:rgba(255,255,255,.35);margin-bottom:6px;text-transform:uppercase;letter-spacing:.8px}

/* Bottom note */
.bb-note{font-size:.74rem;color:rgba(255,255,255,.25);text-align:center;margin-top:10px;line-height:1.55}

/* Spinner */
@keyframes bbSpin{to{transform:rotate(360deg)}}
.bb-spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:bbSpin .7s linear infinite;display:inline-block;vertical-align:middle;margin-right:6px}

/* Responsive */
@media(max-width:700px){
  .bb-modal{grid-template-columns:1fr;max-width:100%;border-radius:20px}
  .bb-left{border-right:none;border-bottom:1px solid rgba(255,255,255,.06);padding:28px 22px}
  .bb-right{padding:24px 20px}
  .bb-price-main{font-size:2.4rem}
  .bb-crypto-inner{flex-direction:column;align-items:center}
  .bb-qr-outer{width:160px;height:160px;padding:10px}
  .bb-qr-outer img{width:140px;height:140px}
}
`;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── Open modal ── */
  window.openBBPaymentModal = function (config) {
    _config = config;
    _paypalRendered = false;
    _activeCoin = 'usdt';

    document.getElementById('bb-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'bb-overlay';
    overlay.className = 'bb-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) closeBBModal(); };

    const feats = (config.features || [])
      .map(f => `<li><span class="ck">✓</span>${f}</li>`).join('');

    const w = BB_WALLETS.usdt;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(w.address)}`;

    overlay.innerHTML = `
      <div class="bb-modal">
        <button class="bb-close" onclick="closeBBModal()">✕</button>

        <!-- LEFT -->
        <div class="bb-left">
          <div class="bb-icon-wrap">${config.icon || '🎓'}</div>
          <span class="bb-tag">${config.tag || 'Purchase'}</span>
          <h2 class="bb-pname">${config.name}</h2>
          <div class="bb-price-row">
            <span class="bb-price-main">$${config.amount}</span>
            <span class="bb-price-per">${config.period || ''}</span>
          </div>
          <ul class="bb-feats">${feats}</ul>
          <div class="bb-trust">
            <div class="bb-trust-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              256-bit SSL encryption
            </div>
            <div class="bb-trust-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              Instant access on payment
            </div>
            <div class="bb-trust-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2.5"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              Verified secure checkout
            </div>
          </div>
        </div>

        <!-- RIGHT -->
        <div class="bb-right">
          <p class="bb-right-title">Complete your purchase</p>

          <div class="bb-email-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
            <input id="bb-email" class="bb-inp" type="email" placeholder="your@email.com" />
          </div>

          <!-- Method tabs -->
          <div class="bb-tabs">
            <button class="bb-tb active" onclick="switchBBTab('paypal')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.63 3.993a.804.804 0 01-.794.679H7.72a.483.483 0 01-.477-.558L9.22 7.08a.965.965 0 01.952-.814h4.645c1.683.094 2.765.672 3.256 2.212z"/></svg>
              PayPal
            </button>
            <button class="bb-tb" onclick="switchBBTab('mpesa')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              M-Pesa
            </button>
            <button class="bb-tb" onclick="switchBBTab('crypto')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 015 0v.5a2.5 2.5 0 01-5 0V9zM12 14v4M10 18h4"/></svg>
              Crypto
            </button>
          </div>

          <!-- PayPal pane -->
          <div id="bb-pane-paypal" class="bb-pane active">
            <div id="bb-paypal-container" style="min-height:55px;"></div>
            <p class="bb-paypal-note">You'll be redirected to PayPal to complete your payment securely.</p>
          </div>

          <!-- M-Pesa pane -->
          <div id="bb-pane-mpesa" class="bb-pane">
            <div class="bb-mpesa-amount">
              <div class="bb-mpesa-kes">KES ${(config.mpesaAmount || 0).toLocaleString()}</div>
              <div class="bb-mpesa-usd">≈ $${config.amount} USD at current rate</div>
            </div>
            <div class="bb-mpesa-steps">
              <div class="bb-mpesa-step"><span class="bb-step-num">1</span>Enter your Safaricom number below</div>
              <div class="bb-mpesa-step"><span class="bb-step-num">2</span>Click "Send Prompt" to initiate STK push</div>
              <div class="bb-mpesa-step"><span class="bb-step-num">3</span>Check your phone and enter M-Pesa PIN</div>
              <div class="bb-mpesa-step"><span class="bb-step-num">4</span>Access is granted automatically on confirmation</div>
            </div>
            <input id="bb-mpesa-phone" class="bb-inp plain" type="tel" placeholder="e.g. 0712 345 678" maxlength="10" style="margin-bottom:12px;" />
            <button id="bb-mpesa-btn" class="bb-btn bb-btn-green" onclick="initiateBBMpesa()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:6px;"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              Send M-Pesa Prompt
            </button>
            <p class="bb-note">Safaricom STK push. Your number must be registered for M-Pesa.</p>
          </div>

          <!-- Crypto pane -->
          <div id="bb-pane-crypto" class="bb-pane">
            <!-- Coin selector -->
            <div class="bb-coins">
              <button class="bb-coin active" data-c="usdt" onclick="switchBBCoin('usdt')">
                <div class="coin-logo">${BB_WALLETS.usdt.logo}</div>
                USDT
              </button>
              <button class="bb-coin" data-c="btc" onclick="switchBBCoin('btc')">
                <div class="coin-logo">${BB_WALLETS.btc.logo}</div>
                BTC
              </button>
              <button class="bb-coin" data-c="eth" onclick="switchBBCoin('eth')">
                <div class="coin-logo">${BB_WALLETS.eth.logo}</div>
                ETH
              </button>
            </div>

            <!-- Amount due -->
            <div class="bb-due">
              <span class="bb-due-lbl">Amount Due</span>
              <span class="bb-due-amt">$${config.amount} <span style="font-size:.75rem;color:rgba(255,255,255,.35);font-weight:500;">USD equivalent</span></span>
            </div>

            <!-- QR + address card -->
            <div class="bb-crypto-card">
              <div class="bb-crypto-inner">
                <div class="bb-qr-frame">
                  <div class="bb-qr-outer">
                    <img id="bb-qr-img" src="${qrUrl}" alt="Wallet QR Code" />
                  </div>
                  <div id="bb-qr-badge" class="bb-qr-badge" style="color:#26a17b;">USDT</div>
                </div>
                <div class="bb-addr-col">
                  <div id="bb-net-pill" class="bb-net-pill" style="background:rgba(38,161,123,.12);border-color:rgba(38,161,123,.3);color:#26a17b;">
                    <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
                    ${w.network}
                  </div>
                  <div class="bb-addr-lbl">Send to this address</div>
                  <div id="bb-addr-val" class="bb-addr-box">${w.address}</div>
                  <button id="bb-copy-btn" class="bb-copy-btn" onclick="copyBBAddress()">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    Copy Address
                  </button>
                </div>
              </div>
            </div>

            <!-- Warning -->
            <div class="bb-warn">
              <span class="bb-warn-icon">⚠</span>
              <span>Always verify the <strong>network type</strong> matches your wallet. Sending on the wrong network results in permanent loss of funds.</span>
            </div>

            <!-- TX hash -->
            <div class="bb-tx-label">Transaction Hash / TXID</div>
            <input id="bb-tx-hash" class="bb-inp plain" type="text" placeholder="Paste your TXID after sending payment" style="margin-bottom:12px;" />
            <button class="bb-btn bb-btn-purple" onclick="submitBBCrypto()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:6px;"><polyline points="20 6 9 17 4 12"/></svg>
              Confirm Crypto Payment
            </button>
            <p class="bb-note">Access is granted once your transaction is verified on-chain (usually within 10–30 min).</p>
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
        .then(d => {
          const el = document.getElementById('bb-email');
          if (el && d.data?.email) el.value = d.data.email;
        }).catch(() => {});
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
    const w = BB_WALLETS[coin];

    document.querySelectorAll('.bb-coin').forEach(b => b.classList.toggle('active', b.dataset.c === coin));

    document.getElementById('bb-addr-val').textContent = w.address;

    const pill = document.getElementById('bb-net-pill');
    pill.style.background = w.bg;
    pill.style.borderColor = w.color.replace(')', ', .35)').replace('rgb', 'rgba');
    pill.style.color = w.color;
    pill.innerHTML = `<svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg> ${w.network}`;

    const badge = document.getElementById('bb-qr-badge');
    badge.textContent = w.label;
    badge.style.color = w.color;

    document.getElementById('bb-qr-img').src =
      `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(w.address)}`;

    const copyBtn = document.getElementById('bb-copy-btn');
    if (copyBtn) { copyBtn.classList.remove('copied'); copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy Address`; }
  };

  window.copyBBAddress = function () {
    const addr = document.getElementById('bb-addr-val')?.textContent;
    if (!addr) return;
    navigator.clipboard.writeText(addr).then(() => {
      const btn = document.getElementById('bb-copy-btn');
      if (btn) {
        btn.classList.add('copied');
        btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy Address`;
        }, 2200);
      }
    }).catch(() => {
      /* fallback */
      const ta = document.createElement('textarea');
      ta.value = addr;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    });
  };

  window.initiateBBMpesa = async function () {
    const phone = document.getElementById('bb-mpesa-phone')?.value?.trim();
    const email = document.getElementById('bb-email')?.value?.trim();
    if (!email) { alert('Enter your email address first.'); return; }
    if (!phone || phone.length < 9) { alert('Enter a valid Safaricom number.'); return; }

    const btn = document.getElementById('bb-mpesa-btn');
    btn.innerHTML = '<span class="bb-spinner"></span> Sending prompt…';
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
      if (!data.success) throw new Error(data.message || 'Failed to send prompt');

      const checkoutId = data.data?.CheckoutRequestID || ('MPESA-' + Date.now());

      await fetch(base + '/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: email,
          courseId: _config.courseId,
          amount: _config.amount,
          paymentMethod: 'mpesa',
          orderId: checkoutId,
          transactionId: checkoutId,
          status: 'pending',
        }),
      });

      btn.innerHTML = '<span class="bb-spinner"></span> Waiting for PIN…';
      showBBToast('📱 Prompt sent! Check your phone and enter your M-Pesa PIN.', 'green');

      let polls = 0;
      const iv = setInterval(async () => {
        polls++;
        try {
          const sr = await fetch(`${base}/mpesa/status/${encodeURIComponent(checkoutId)}`);
          const sd = await sr.json();
          if (sd.status === 'approved') {
            clearInterval(iv);
            closeBBModal();
            _config.onSuccess?.('mpesa');
            showBBToast('✅ M-Pesa payment confirmed! Access unlocked.', 'green');
          } else if (polls >= 45) {
            clearInterval(iv);
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:6px;"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> Send M-Pesa Prompt';
            btn.disabled = false;
            showBBToast('Payment not confirmed yet. Contact support if you were charged.', 'blue');
          }
        } catch (_) {}
      }, 4000);

    } catch (err) {
      alert('M-Pesa error: ' + err.message);
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:6px;"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> Send M-Pesa Prompt';
      btn.disabled = false;
    }
  };

  window.submitBBCrypto = async function () {
    const email = document.getElementById('bb-email')?.value?.trim();
    const txHash = document.getElementById('bb-tx-hash')?.value?.trim();
    if (!email) { alert('Enter your email address first.'); return; }
    if (!txHash) { alert('Paste your transaction hash after sending payment.'); return; }

    const btn = document.querySelector('#bb-pane-crypto .bb-btn');
    btn.innerHTML = '<span class="bb-spinner"></span> Submitting…';
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
        showBBToast('₿ Payment submitted! Access granted once confirmed on-chain.', 'purple');
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (err) {
      alert('Error: ' + err.message);
      btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:6px;"><polyline points="20 6 9 17 4 12"/></svg> Confirm Crypto Payment';
      btn.disabled = false;
    }
  };

  window.showBBToast = function (msg, color) {
    const cols = { green: 'linear-gradient(135deg,#059669,#10b981)', purple: 'linear-gradient(135deg,#10b981,#059669)', blue: 'linear-gradient(135deg,#2563eb,#3b82f6)' };
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;top:20px;right:20px;background:${cols[color] || cols.green};color:#fff;padding:14px 20px;border-radius:14px;font-weight:700;font-size:.875rem;z-index:99999;box-shadow:0 12px 36px rgba(0,0,0,.45);max-width:340px;line-height:1.5;animation:bbFadeIn .2s ease;border:1px solid rgba(255,255,255,.15);`;
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
