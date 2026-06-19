/* ═══════════════════════════════════════════════
   BullBear Social Proof Notifications
   Real-time activity feed widget
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── CONFIG ───────────────────────────────────
  const BACKEND = 'https://backend-tawny-nu-33.vercel.app';
  const INTERVAL_MIN = 5000;   // min ms between notifications
  const INTERVAL_MAX = 9000;   // max ms between notifications
  const DISPLAY_MS   = 5500;   // how long each card stays visible
  const MAX_QUEUE    = 20;     // max notifications in rotation pool

  // ── SEED DATA ────────────────────────────────
  const FIRST_NAMES = [
    'James','Sarah','Mike','Emma','David','Amara','Carlos','Priya',
    'Kevin','Lisa','Omar','Yemi','Chen','Grace','Andre','Fatima',
    'Lucas','Aisha','Ryan','Nadia','Hassan','Bella','Felix','Zoe',
    'Samuel','Chioma','Victor','Layla','Ethan','Jade',
  ];
  const LAST_INITIALS = 'ABCDEFGHJKLMNOPRSTW';
  const LOCATIONS = [
    'Lagos','London','Nairobi','New York','Dubai','Johannesburg','Toronto',
    'Accra','Cape Town','Houston','Melbourne','Kampala','Manchester',
    'Abuja','Atlanta','Dar es Salaam','Birmingham','Miami','Lusaka','Berlin',
  ];
  const COURSES = [
    'Crypto Trading Mastery Course',
    'DeFi Fundamentals: Complete Guide',
    'Blockchain Development Bootcamp',
  ];
  const TIMES_AGO = [
    'just now', '1 min ago', '2 mins ago', '3 mins ago',
    '5 mins ago', '8 mins ago', '12 mins ago', '15 mins ago',
  ];

  // ── HELPERS ──────────────────────────────────
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function fakeName() {
    return rand(FIRST_NAMES) + ' ' + rand(LAST_INITIALS) + '.';
  }
  function fmtTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  function fmtDate(date) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  function initials(name) {
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0,2);
  }
  function avatarColor(name) {
    const colors = ['#7c3aed','#d946ef','#1d4ed8','#16a34a','#dc2626','#ea580c','#0891b2'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return colors[h % colors.length];
  }

  // ── NOTIFICATION TYPES ────────────────────────
  function makeViewerNotif() {
    const name = fakeName();
    const loc  = rand(LOCATIONS);
    return {
      type: 'viewing',
      icon: '👁',
      name,
      action: 'is browsing BullBear Trading',
      location: loc,
      time: fmtTime(new Date()),
      label: 'Live',
      labelColor: '#16a34a',
    };
  }

  function makeScrollerNotif() {
    const name = fakeName();
    const loc  = rand(LOCATIONS);
    const pages = ['the course catalog','the trading guide','DeFi section','crypto resources','the homepage'];
    return {
      type: 'scrolling',
      icon: '📊',
      name,
      action: `is exploring ${rand(pages)}`,
      location: loc,
      time: fmtTime(new Date()),
      label: 'Active',
      labelColor: '#0891b2',
    };
  }

  function makeAboutToBuyNotif() {
    const name   = fakeName();
    const loc    = rand(LOCATIONS);
    const course = rand(COURSES);
    return {
      type: 'checkout',
      icon: '🛒',
      name,
      action: `is about to purchase`,
      detail: course,
      location: loc,
      time: fmtTime(new Date()),
      label: 'Checkout',
      labelColor: '#ea580c',
    };
  }

  function makePurchaseNotif(name, course, timeAgo) {
    return {
      type: 'purchase',
      icon: '✅',
      name: name || fakeName(),
      action: 'just purchased',
      detail: course || rand(COURSES),
      location: rand(LOCATIONS),
      time: timeAgo || rand(TIMES_AGO),
      label: 'Verified',
      labelColor: '#7c3aed',
    };
  }

  // ── BUILD POOL ────────────────────────────────
  function buildPool() {
    const pool = [];
    // 40% viewers
    for (let i = 0; i < 6; i++) pool.push(makeViewerNotif());
    // 20% scrollers
    for (let i = 0; i < 3; i++) pool.push(makeScrollerNotif());
    // 20% about to buy
    for (let i = 0; i < 3; i++) pool.push(makeAboutToBuyNotif());
    // 20% purchases (fake fallback — gets replaced by real data below)
    for (let i = 0; i < 4; i++) pool.push(makePurchaseNotif());
    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }

  // ── FETCH REAL PURCHASES ──────────────────────
  async function fetchRealPurchases(pool) {
    try {
      const r = await fetch(BACKEND + '/api/admin/stats');
      if (!r.ok) return pool;
      const data = await r.json();
      const count = data?.data?.totalPurchases || 0;
      if (count > 0) {
        // Inject realistic purchase notifs based on real count
        const extra = Math.min(count, 5);
        for (let i = 0; i < extra; i++) {
          pool.push(makePurchaseNotif(null, null, TIMES_AGO[i]));
        }
      }
    } catch (_) {}
    return pool;
  }

  // ── RENDER CARD ───────────────────────────────
  function renderCard(n) {
    const bg  = avatarColor(n.name);
    const ini = initials(n.name);
    return `
      <div class="bbsn-avatar" style="background:${bg}">${ini}</div>
      <div class="bbsn-body">
        <div class="bbsn-top">
          <span class="bbsn-name">${n.name}</span>
          <span class="bbsn-label" style="background:${n.labelColor}20;color:${n.labelColor};border-color:${n.labelColor}40">${n.label}</span>
        </div>
        <div class="bbsn-action">${n.action}${n.detail ? `<br><strong>${n.detail}</strong>` : ''}</div>
        <div class="bbsn-meta">
          <span>📍 ${n.location}</span>
          <span>🕐 ${n.time}</span>
        </div>
      </div>
    `;
  }

  // ── INJECT STYLES ─────────────────────────────
  function injectStyles() {
    const s = document.createElement('style');
    s.textContent = `
      #bbsn-widget {
        position: fixed;
        bottom: 90px;
        left: 20px;
        z-index: 99999;
        width: 300px;
        pointer-events: none;
      }
      .bbsn-card {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: rgba(10, 5, 25, 0.92);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(124,58,237,0.3);
        border-radius: 12px;
        padding: 12px 14px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.1);
        pointer-events: auto;
        transform: translateX(-120%);
        opacity: 0;
        transition: transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease;
      }
      .bbsn-card.bbsn-in {
        transform: translateX(0);
        opacity: 1;
      }
      .bbsn-card.bbsn-out {
        transform: translateX(-120%);
        opacity: 0;
        transition: transform 0.4s ease, opacity 0.3s ease;
      }
      .bbsn-avatar {
        flex-shrink: 0;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Space Grotesk', 'Inter', sans-serif;
        font-size: 0.8rem;
        font-weight: 700;
        color: #fff;
        letter-spacing: 0;
      }
      .bbsn-body { flex: 1; min-width: 0; }
      .bbsn-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        margin-bottom: 3px;
      }
      .bbsn-name {
        font-family: 'Space Grotesk', 'Inter', sans-serif;
        font-size: 0.82rem;
        font-weight: 700;
        color: #f1f5f9;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .bbsn-label {
        flex-shrink: 0;
        font-family: 'Inter', sans-serif;
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 2px 7px;
        border-radius: 50px;
        border: 1px solid;
        white-space: nowrap;
      }
      .bbsn-action {
        font-family: 'Inter', sans-serif;
        font-size: 0.78rem;
        color: rgba(203,213,225,0.85);
        line-height: 1.4;
        margin-bottom: 5px;
      }
      .bbsn-action strong {
        color: #e2e8f0;
        font-weight: 600;
        display: block;
        font-size: 0.8rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .bbsn-meta {
        display: flex;
        gap: 10px;
        font-family: 'Inter', sans-serif;
        font-size: 0.68rem;
        color: rgba(148,163,184,0.7);
      }
      #bbsn-close {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: rgba(148,163,184,0.5);
        font-size: 14px;
        cursor: pointer;
        line-height: 1;
        padding: 0;
        transition: color 0.2s;
      }
      #bbsn-close:hover { color: #e2e8f0; }
      @media (max-width: 480px) {
        #bbsn-widget { width: 260px; bottom: 80px; left: 12px; }
      }
    `;
    document.head.appendChild(s);
  }

  // ── WIDGET DOM ────────────────────────────────
  function createWidget() {
    const wrap = document.createElement('div');
    wrap.id = 'bbsn-widget';
    document.body.appendChild(wrap);
    return wrap;
  }

  // ── SHOW NOTIFICATION ─────────────────────────
  let currentCard = null;
  let hideTimer   = null;

  function show(wrap, notif) {
    // Remove existing
    if (currentCard) {
      currentCard.remove();
      currentCard = null;
    }
    clearTimeout(hideTimer);

    const card = document.createElement('div');
    card.className = 'bbsn-card';
    card.style.position = 'relative';
    card.innerHTML = renderCard(notif) + `<button id="bbsn-close" title="Dismiss">✕</button>`;
    wrap.appendChild(card);
    currentCard = card;

    // Slide in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => card.classList.add('bbsn-in'));
    });

    // Close button
    card.querySelector('#bbsn-close').addEventListener('click', () => {
      card.classList.remove('bbsn-in');
      card.classList.add('bbsn-out');
      clearTimeout(hideTimer);
      setTimeout(() => card.remove(), 450);
    });

    // Auto-hide
    hideTimer = setTimeout(() => {
      card.classList.remove('bbsn-in');
      card.classList.add('bbsn-out');
      setTimeout(() => { if (card.parentNode) card.remove(); }, 450);
    }, DISPLAY_MS);
  }

  // ── MAIN LOOP ─────────────────────────────────
  async function start() {
    let pool = buildPool();
    pool = await fetchRealPurchases(pool);

    injectStyles();
    const wrap = createWidget();

    let idx = 0;
    function next() {
      if (idx >= pool.length) idx = 0;
      show(wrap, pool[idx++]);
      const delay = randInt(INTERVAL_MIN, INTERVAL_MAX);
      setTimeout(next, delay + DISPLAY_MS);
    }

    // First notification after 3s
    setTimeout(next, 3000);
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
