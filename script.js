'use strict';

/* ========================== 1. HELPERS ========================== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const r2 = n => Math.round(n * 100) / 100;
const DAY = 864e5;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmtDate = ts => { const d = new Date(ts); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ', ' + d.getFullYear(); };
const fmtTime = ts => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const monthStart = (off = 0) => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + off, 1).getTime(); };
const toInputDate = ts => { const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const fromInputDate = s => { const [y, m, d] = s.split('-').map(Number); const n = new Date(); return new Date(y, m - 1, d, n.getHours(), n.getMinutes()).getTime(); };
const timeAgo = ts => {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' hr ago';
  return Math.floor(s / 86400) + ' day ago';
};
const addPeriod = (ts, freq) => {
  const d = new Date(ts);
  if (freq === 'weekly') return ts + 7 * DAY;
  if (freq === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.getTime();
};

/* ========================== 2. CURRENCY + FLAGS ========================== */
const CUR = {
  USD: { sym: '$', rate: 1, flag: 'us', name: 'US Dollar' },
  EUR: { sym: '€', rate: 1.08, flag: 'de', name: 'Euro' },
  AUD: { sym: '$', rate: 0.65, flag: 'au', name: 'Australian Dollar' },
  GBP: { sym: '£', rate: 1.27, flag: 'gb', name: 'British Pound' },
  JPY: { sym: '¥', rate: 0.0067, flag: 'jp', name: 'Japanese Yen' },
  CAD: { sym: '$', rate: 0.73, flag: 'ca', name: 'Canadian Dollar' },
  CHF: { sym: 'CHF ', rate: 1.12, flag: 'ch', name: 'Swiss Franc' }
};
const money = (n, cur = 'USD', d) => {
  if (d == null) d = cur === 'JPY' ? 0 : 2;
  return (n < 0 ? '-' : '') + CUR[cur].sym + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
};
const short = n => { const a = Math.abs(n); return a >= 1e6 ? +(n / 1e6).toFixed(1) + 'M' : a >= 1e3 ? +(n / 1e3).toFixed(1) + 'k' : String(Math.round(n)); };

const FLAGS = {
  us: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 60 40"><rect width="60" height="40" fill="#fff"/><g fill="#d22f3c"><rect y="0" width="60" height="5.71"/><rect y="11.43" width="60" height="5.71"/><rect y="22.86" width="60" height="5.71"/><rect y="34.29" width="60" height="5.71"/></g><rect width="27" height="22.86" fill="#3c3b6e"/><g fill="#fff"><circle cx="5" cy="5" r="1.6"/><circle cx="13" cy="5" r="1.6"/><circle cx="21" cy="5" r="1.6"/><circle cx="9" cy="11" r="1.6"/><circle cx="17" cy="11" r="1.6"/><circle cx="5" cy="17" r="1.6"/><circle cx="13" cy="17" r="1.6"/><circle cx="21" cy="17" r="1.6"/></g></svg>`,
  de: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 60 40"><rect width="60" height="13.4" fill="#000"/><rect y="13.3" width="60" height="13.4" fill="#dd0000"/><rect y="26.6" width="60" height="13.4" fill="#ffce00"/></svg>`,
  gb: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 60 40"><rect width="60" height="40" fill="#012169"/><path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" stroke-width="8"/><path d="M0,0 L60,40 M60,0 L0,40" stroke="#c8102e" stroke-width="3"/><path d="M30,0 V40 M0,20 H60" stroke="#fff" stroke-width="13"/><path d="M30,0 V40 M0,20 H60" stroke="#c8102e" stroke-width="7"/></svg>`,
  au: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 60 40"><rect width="60" height="40" fill="#00008b"/><g transform="scale(.5)"><path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" stroke-width="8"/><path d="M0,0 L60,40 M60,0 L0,40" stroke="#c8102e" stroke-width="3"/><path d="M30,0 V40 M0,20 H60" stroke="#fff" stroke-width="13"/><path d="M30,0 V40 M0,20 H60" stroke="#c8102e" stroke-width="7"/></g><g fill="#fff"><circle cx="15" cy="30" r="3.6"/><circle cx="43" cy="8" r="2"/><circle cx="52" cy="17" r="2"/><circle cx="43" cy="31" r="2"/><circle cx="36" cy="19" r="2"/></g></svg>`,
  jp: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 60 40"><rect width="60" height="40" fill="#fff"/><circle cx="30" cy="20" r="11" fill="#bc002d"/></svg>`,
  ca: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 60 40"><rect width="60" height="40" fill="#fff"/><rect width="15" height="40" fill="#d52b1e"/><rect x="45" width="15" height="40" fill="#d52b1e"/><path d="M30,8 L33,16 L38,14 L35,22 L40,22 L31,30 L31,36 L29,36 L29,30 L20,22 L25,22 L22,14 L27,16 Z" fill="#d52b1e"/></svg>`,
  ch: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 60 40"><rect width="60" height="40" fill="#d52b1e"/><path d="M30,9 V31 M19,20 H41" stroke="#fff" stroke-width="7"/></svg>`
};
const flagSrc = k => 'data:image/svg+xml;utf8,' + encodeURIComponent(FLAGS[k] || FLAGS.us);

const CATS_EXP = ['Housing', 'Food', 'Travel', 'Software', 'Utilities', 'Shopping', 'Health', 'Entertainment', 'Other'];
const CATS_INC = ['Income', 'Investment', 'Deposit', 'Other'];
const CAT_COLORS = { Housing: '#ff5a1f', Food: '#ffa062', Travel: '#f5b53d', Software: '#36d399', Utilities: '#4ea8ff', Shopping: '#a78bfa', Health: '#f472b6', Entertainment: '#22d3ee', Other: '#94a3b8', Savings: '#84cc16', Investment: '#fb7185' };
const SUB_ICONS = [
  ['fa-brands fa-spotify', 'Music', '#1db954'], ['fa-brands fa-youtube', 'Video', '#ff0033'], ['fa-brands fa-figma', 'Design', '#f24e1e'],
  ['fa-brands fa-aws', 'Cloud', '#ff9900'], ['fa-brands fa-github', 'Code', '#e6e6e6'], ['fa-brands fa-slack', 'Chat', '#e01e5a'],
  ['fa-brands fa-dropbox', 'Storage', '#0061ff'], ['fa-solid fa-cloud', 'Other', '#8b8b92']
];
const iconColor = ic => (SUB_ICONS.find(i => i[0] === ic) || [])[2] || '#ff5a1f';

/* ========================== 3. DATA (STATE) ========================== */
const KEY = 'fintrixity_state_v2';
let S; // poori app ka data yahan hai

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// Pehli baar app khulne par sample data banta hai
function seed() {
  const R = rng(11), pick = a => a[Math.floor(R() * a.length)], rnd = (a, b) => Math.round(a + R() * (b - a));
  const now = Date.now(), today = new Date();
  const wallets = [
    { id: 'w1', cur: 'USD', bal: 24678, limit: 10000, active: true },
    { id: 'w2', cur: 'EUR', bal: 28345, limit: 8000, active: true },
    { id: 'w3', cur: 'AUD', bal: 20517.52, limit: 10000, active: true },
    { id: 'w4', cur: 'GBP', bal: 25000, limit: 7500, active: false }
  ];
  const txs = [];
  const add = (title, type, cat, amount, walletId, ts, status = 'Completed') => txs.push({ id: uid(), title, type, cat, amount, walletId, ts, status });

  // Sab se naye (design wale) rows
  add('Software License', 'income', 'Income', 25500, 'w1', now - 2 * 3600e3);
  add('Flight Ticket', 'expense', 'Travel', 1240, 'w1', now - 1 * DAY - 3 * 3600e3, 'Pending');
  add('Cloud Hosting', 'expense', 'Software', 890, 'w1', now - 2 * DAY - 5 * 3600e3);
  add('Office Supplies', 'expense', 'Shopping', 320, 'w1', now - 3 * DAY - 2 * 3600e3, 'Failed');

  const EXP = [['Groceries', 'Food', 60, 220], ['Restaurant', 'Food', 25, 120], ['Electricity Bill', 'Utilities', 70, 160], ['Internet Bill', 'Utilities', 40, 60],
    ['Cloud Hosting', 'Software', 80, 400], ['Gym Membership', 'Health', 25, 60], ['Movie Night', 'Entertainment', 15, 60], ['Office Supplies', 'Shopping', 40, 300],
    ['Flight Ticket', 'Travel', 150, 900], ['Clothes', 'Shopping', 50, 350], ['Doctor Visit', 'Health', 40, 200]];
  for (let off = 35; off >= 0; off--) {
    const y = today.getFullYear(), m = today.getMonth() - off;
    const maxDay = off === 0 ? Math.max(1, today.getDate() - 1) : 27;
    const mk = (d) => { let ts = new Date(y, m, Math.min(d, maxDay), rnd(8, 21), rnd(0, 59)).getTime(); if (ts > now) ts = now - rnd(4, 20) * 3600e3; return ts; };
    const st = () => (off <= 1 && R() < 0.1) ? 'Pending' : (off <= 1 && R() < 0.05) ? 'Failed' : 'Completed';
    if (off > 0) { // chaalu mahine ki salary/rent/freelance neeche recurring se ayegi
      add('Salary', 'income', 'Income', rnd(3200, 5200), 'w1', mk(1));
      add('Freelance Project', 'income', 'Income', rnd(800, 4200), 'w1', mk(rnd(5, 20)), st());
      if (off % 2 === 0) add('Dividend Payout', 'income', 'Investment', rnd(100, 600), 'w1', mk(rnd(10, 25)));
      add('Rent', 'expense', 'Housing', 1200, 'w1', mk(3));
    }
    if (off % 3 === 0) add('Freelance Project', 'income', 'Income', rnd(600, 2500), 'w2', mk(rnd(8, 22)));
    for (let k = 0; k < (off === 0 ? 3 : rnd(4, 6)); k++) {
      const e = pick(EXP); add(e[0], 'expense', e[1], rnd(e[2], e[3]), 'w1', mk(rnd(2, 27)), st());
    }
  }
  txs.sort((a, b) => a.ts - b.ts);
  txs.forEach((t, i) => t.orderId = 'INV_' + String(i + 1).padStart(6, '0'));

  const inv = (no, client, amount, issued, due, status) => ({ id: uid(), no, client, amount, issued: now + issued * DAY, due: now + due * DAY, status });
  const rec = (kind, title, type, cat, amount, freq, nextDays, active, icon) => ({ id: uid(), kind, title, type, cat, amount, walletId: 'w1', freq, next: now + nextDays * DAY, active, icon });

  return {
    v: 2, orderN: txs.length, wallets, txs,
    savings: 24800.45, savingsChg: 3.2, investChg: -4.7,
    holdings: [{ name: 'Stocks', value: 38000 }, { name: 'Crypto', value: 14120.78 }, { name: 'Bonds', value: 12000 }, { name: 'Gold', value: 6000 }],
    invoices: [
      inv('INV-2041', 'Acme Corp', 4800, -20, -5, 'Pending'), inv('INV-2042', 'Globex Ltd', 12500, -12, 10, 'Pending'),
      inv('INV-2043', 'Initech', 3200, -30, -15, 'Paid'), inv('INV-2044', 'Umbrella Inc', 7600, -3, 27, 'Pending'),
      inv('INV-2045', 'Stark Industries', 21000, -45, -30, 'Paid')
    ],
    recs: [
      rec('rec', 'Monthly Rent', 'expense', 'Housing', 1200, 'monthly', 6, true, 'fa-solid fa-house'),
      rec('rec', 'Salary', 'income', 'Income', 4500, 'monthly', 12, true, 'fa-solid fa-briefcase'),
      rec('rec', 'Internet Bill', 'expense', 'Utilities', 45, 'monthly', 3, true, 'fa-solid fa-wifi'),
      rec('rec', 'Gym Membership', 'expense', 'Health', 30, 'monthly', 9, false, 'fa-solid fa-dumbbell'),
      rec('sub', 'Spotify', 'expense', 'Entertainment', 11.99, 'monthly', 5, true, 'fa-brands fa-spotify'),
      rec('sub', 'Figma', 'expense', 'Software', 15, 'monthly', 8, true, 'fa-brands fa-figma'),
      rec('sub', 'AWS', 'expense', 'Software', 89.5, 'monthly', 14, true, 'fa-brands fa-aws'),
      rec('sub', 'GitHub Pro', 'expense', 'Software', 4, 'monthly', 20, true, 'fa-brands fa-github'),
      rec('sub', 'Slack', 'expense', 'Software', 8.75, 'monthly', 11, false, 'fa-brands fa-slack'),
      rec('sub', 'Dropbox', 'expense', 'Software', 119.88, 'yearly', 120, true, 'fa-brands fa-dropbox')
    ],
    feedback: [],
    notifs: [
      { id: uid(), text: 'Welcome to Fintrixity! Your dashboard is ready.', ts: now - 3600e3, read: false },
      { id: uid(), text: 'Software License payment of $25,500 received.', ts: now - 2 * 3600e3, read: false },
      { id: uid(), text: 'Flight Ticket payment is pending.', ts: now - DAY, read: true }
    ],
    user: { name: 'John Doe', email: 'john@example.com' },
    pro: false
  };
}
function load() { try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; } if (!S || S.v !== 2) { S = seed(); save(); } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage band ho to bhi app chalti rahe */ } }

/* UI state (yeh save nahi hota, sirf screen ke filters hain) */
const UI = {
  period: 'month', chartMode: 'monthly', active: null, chartData: [],
  dashQ: '', dashStatus: 'all', sel: new Set(), visible: [],
  tx: { q: '', type: 'all', status: 'all', wallet: 'all', sort: 'date_desc', page: 1 },
  inv: { q: '', status: 'all' }, an: { months: 6 }, rating: 0
};
let cur = 'dashboard', CONFIRM = null, justClosed = null, menuAnchor = null;
const PERIODS = { month: 'This Month', last: 'Last Month', year: 'This Year', all: 'All Time' };

/* ========================== 4. BUSINESS LOGIC ========================== */
const W = id => S.wallets.find(w => w.id === id);
const wCur = id => (W(id) || {}).cur || 'USD';
const totalBal = () => S.wallets.reduce((a, w) => a + w.bal * CUR[w.cur].rate, 0);
const investTotal = () => S.holdings.reduce((a, h) => a + h.value, 0);
const txCur = t => wCur(t.walletId);
const txUSD = t => t.amount * CUR[txCur(t)].rate;
const spentThisMonth = wid => S.txs.filter(t => t.walletId === wid && t.type === 'expense' && !t.sys && t.status !== 'Failed' && t.ts >= monthStart(0)).reduce((a, t) => a + t.amount, 0);

// Income/expense ka hisaab (USD mein). System transfers (savings/investment) count nahi hote
function stats(from, to) {
  let inc = 0, exp = 0;
  S.txs.forEach(t => {
    if (t.sys || t.status !== 'Completed' || t.ts < from || t.ts >= to) return;
    if (t.type === 'income') inc += txUSD(t); else if (t.type === 'expense') exp += txUSD(t);
  });
  return { inc, exp, net: inc - exp };
}
function periodRange() {
  const y = new Date().getFullYear();
  return { month: [monthStart(0), Infinity], last: [monthStart(-1), monthStart(0)], year: [new Date(y, 0, 1).getTime(), Infinity], all: [0, Infinity] }[UI.period];
}

// Transaction ka asar wallet ke balance par (dir: +1 lagao, -1 wapas karo)
function effect(t, dir) {
  if (t.status !== 'Completed') return;
  const w = W(t.walletId); if (!w) return;
  if (t.type === 'income') w.bal = r2(w.bal + dir * t.amount);
  else if (t.type === 'expense') w.bal = r2(w.bal - dir * t.amount);
  else if (t.type === 'transfer') {
    w.bal = r2(w.bal - dir * t.amount);
    const to = W(t.toWalletId); if (to) to.bal = r2(to.bal + dir * t.toAmount);
  }
}
function addTx(o) {
  S.orderN++;
  const t = { id: uid(), orderId: 'INV_' + String(S.orderN).padStart(6, '0'), title: o.title, type: o.type, cat: o.cat || 'Other', amount: r2(o.amount), walletId: o.walletId, status: o.status || 'Completed', ts: o.ts || Date.now(), toWalletId: o.toWalletId, toAmount: o.toAmount, sys: o.sys };
  effect(t, 1); S.txs.push(t); return t;
}
function checkTx(type, amount, walletId, status) {
  const w = W(walletId);
  if (!w) return 'Please select a wallet';
  if (!w.active) return w.cur + ' wallet is inactive';
  if (!(amount > 0)) return 'Amount must be greater than 0';
  if (type !== 'income') {
    if (status === 'Completed' && w.bal < amount) return 'Not enough balance in this wallet';
    if (type === 'expense' && status !== 'Failed' && spentThisMonth(walletId) + amount > w.limit) return 'Monthly limit exceeded (' + money(w.limit, w.cur, 0) + ')';
  }
  return '';
}
function setStatus(id, status) {
  const t = S.txs.find(x => x.id === id); if (!t) return;
  if (t.sys) return toast('System transactions cannot be changed', 'err');
  if (status === 'Completed' && t.type !== 'income') { const w = W(t.walletId); if (!w || w.bal < t.amount) return toast('Not enough balance to complete this', 'err'); }
  effect(t, -1); t.status = status; effect(t, 1);
  save(); refresh(); toast('Status changed to ' + status);
}
function deleteTx(id) {
  const t = S.txs.find(x => x.id === id); if (!t) return;
  if (t.sys) return toast('System transactions cannot be deleted', 'err');
  effect(t, -1); S.txs = S.txs.filter(x => x.id !== id); UI.sel.delete(id);
}
function notify(text) { S.notifs.unshift({ id: uid(), text, ts: Date.now(), read: false }); S.notifs = S.notifs.slice(0, 20); }

// Recurring/Subscription ka payment karna
function charge(r, ts = Date.now()) {
  const w = W(r.walletId) || S.wallets.find(x => x.active) || S.wallets[0];
  let status = 'Completed';
  if (!w || !w.active || (r.type === 'expense' && w.bal < r.amount)) status = 'Failed';
  return addTx({ title: r.title, type: r.type, cat: r.cat, amount: r.amount, walletId: w.id, status, ts });
}
function processDue() {
  let n = 0;
  S.recs.forEach(r => {
    let guard = 0;
    while (r.active && r.next <= Date.now() && guard++ < 12) {
      const t = charge(r, r.next); n++;
      notify(t.status === 'Completed' ? `${r.title} ${r.type === 'income' ? 'received' : 'paid'}: ${money(r.amount, wCur(t.walletId))}` : `${r.title} payment failed (check wallet balance)`);
      r.next = addPeriod(r.next, r.freq);
    }
  });
  if (n) save();
}

/* ========================== 5. UI HELPERS ========================== */
function toast(msg, type = 'ok') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `<i class="fa-solid ${type === 'err' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i> ${esc(msg)}`;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 2800);
}
function modal(title, html, wide) {
  $('#modalRoot').innerHTML = `<div class="m-back"><div class="m ${wide ? 'wide' : ''}" role="dialog"><div class="m-head"><h3>${title}</h3><button class="icon-btn" data-act="closeModal"><i class="fa-solid fa-xmark"></i></button></div><div class="m-body">${html}</div></div></div>`;
  const f = $('#modalRoot input:not([type=hidden]):not([readonly]), #modalRoot select'); if (f && window.innerWidth > 700) f.focus();
}
const closeModal = () => { $('#modalRoot').innerHTML = ''; };
function confirmBox(msg, onYes, btn = 'Yes, continue') {
  CONFIRM = onYes;
  modal('Please confirm', `<p class="muted-p">${msg}</p><div class="m-actions"><button class="btn ghost" data-act="closeModal">Cancel</button><button class="btn danger" data-act="confirmYes">${btn}</button></div>`);
}
const closeMenu = () => { $('#menuRoot').innerHTML = ''; menuAnchor = null; };
function openMenu(anchor, html, cls = '') {
  if (justClosed === anchor) { justClosed = null; return; }
  const root = $('#menuRoot'); root.innerHTML = `<div class="menu ${cls}">${html}</div>`;
  const m = root.firstChild, r = anchor.getBoundingClientRect(); menuAnchor = anchor;
  let left = r.right - m.offsetWidth; left = Math.max(8, Math.min(left, innerWidth - m.offsetWidth - 8));
  let top = r.bottom + 6; if (top + m.offsetHeight > innerHeight - 8) top = Math.max(8, r.top - m.offsetHeight - 6);
  m.style.left = left + 'px'; m.style.top = top + 'px';
}
const menuItems = items => items.map(i => i.sep ? '<div class="msep"></div>' :
  `<button class="mi ${i.danger ? 'danger' : ''}" data-act="${i.act}" data-id="${esc(i.id ?? '')}" data-val="${esc(i.val ?? '')}">${i.icon ? `<i class="${i.icon}"></i>` : ''}<span>${i.label}</span>${i.check ? '<i class="fa-solid fa-check ck"></i>' : ''}</button>`).join('');
const fld = (label, inner, cls = '') => `<label class="fld ${cls}"><span>${label}</span>${inner}</label>`;
const opts = (list, sel) => list.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(sel) ? 'selected' : ''}>${esc(l)}</option>`).join('');
const walletOpts = (sel, onlyActive = true) => S.wallets.filter(w => !onlyActive || w.active || w.id === sel).map(w => `<option value="${w.id}" ${w.id === sel ? 'selected' : ''}>${w.cur} · ${money(w.bal, w.cur)}</option>`).join('');
const statusPill = s => `<span class="status ${s.toLowerCase()}">${s}</span>`;
const pageHead = (t, sub, actions = '') => `<div class="head"><div><h2>${t}</h2><p>${sub}</p></div><div class="actions">${actions}</div></div>`;
const empty = (icon, text) => `<div class="empty"><i class="fa-solid ${icon}"></i><p>${text}</p></div>`;
function download(name, text, mime = 'text/csv') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 500);
}
function copyText(txt) {
  const done = () => toast('Copied to clipboard');
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done, fallback); else fallback();
  function fallback() { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Copy failed', 'err'); } ta.remove(); }
}
const formErr = (f, msg) => { const el = $('.form-err', f); if (el) el.textContent = msg; else toast(msg, 'err'); };

/* ========================== 6. PAGES (VIEWS) ========================== */
const ROUTES = {
  dashboard: ['Dashboard', () => viewDashboard(), () => { drawChart(); renderDashTable(); }],
  analytics: ['Analytics', () => viewAnalytics()],
  transactions: ['Transactions', () => viewTransactions(), () => renderTxTable()],
  invoices: ['Invoices', () => viewInvoices(), () => renderInvTable()],
  recurring: ['Recurring', () => viewRecurring('rec')],
  subscriptions: ['Subscriptions', () => viewRecurring('sub')],
  feedback: ['Feedback', () => viewFeedback()]
};
function route() {
  const h = (location.hash || '#/dashboard').replace('#/', '');
  cur = ROUTES[h] ? h : 'dashboard'; UI.sel.clear(); refresh();
  if (window.innerWidth <= 900) toggleMenu(false);
}
function refresh() {
  const r = ROUTES[cur];
  $$('.nav a').forEach(a => a.classList.toggle('active', a.dataset.route === cur));
  $('#crumb').textContent = r[0];
  document.title = r[0] + ' · Fintrixity';
  $('#view').innerHTML = r[1]();
  if (r[2]) r[2]();
  updateChrome();
}
function updateChrome() {
  $('#bAnalytics').textContent = S.txs.filter(t => t.ts >= monthStart(0)).length;
  $('#bRecurring').textContent = S.recs.filter(r => r.kind === 'rec' && r.active).length;
  const unread = S.notifs.filter(n => !n.read).length;
  $('#bellDot').textContent = unread; $('#bellDot').style.display = unread ? 'grid' : 'none';
  const av = $('#avatar'); av.textContent = (S.user.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2) || 'U').toUpperCase(); av.classList.toggle('pro', !!S.pro);
  $('#upgradeBox').innerHTML = S.pro
    ? `<h4>Pro Member 👑</h4><p>You have all premium features unlocked. Thank you!</p><div class="btns"><button class="btn ghost" data-act="learnMore">View benefits</button></div>`
    : `<h4>Upgrade Pro! 👑</h4><p>Higher productivity with better organization</p><div class="btns"><button class="btn primary" data-act="upgrade"><i class="fa-solid fa-crown"></i> Upgrade</button><button class="btn ghost" data-act="learnMore">Learn more</button></div>`;
}

/* ---------- Dashboard ---------- */
function walletCard(w) {
  return `<div class="wallet" data-act="walletOpen" data-id="${w.id}">
    <div class="top"><img src="${flagSrc(CUR[w.cur].flag)}" alt=""> ${w.cur}<button class="dots-btn" data-act="walletOpen" data-id="${w.id}"><i class="fa-solid fa-ellipsis-vertical"></i></button></div>
    <div class="val">${money(w.bal, w.cur)}</div>
    <div class="lim">Limit is ${CUR[w.cur].sym.trim()}${short(w.limit)} a month</div>
    <div class="st ${w.active ? '' : 'off'}">${w.active ? 'Active' : 'Inactive'}</div></div>`;
}
function viewDashboard() {
  const bal = totalBal(), ms = stats(monthStart(0), Infinity);
  const prev = bal - ms.net, balChg = prev > 0 ? ms.net / prev * 100 : 0;
  const pct = v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}% ${v >= 0 ? '↑' : '↓'}`;
  const cls = v => v >= 0 ? 'g' : 'r';
  const [pf, pt] = periodRange(), ps = stats(pf, pt);
  return `
  ${pageHead('Overview', 'Here is the summary of overall data', `
    <button class="pill" data-act="periodMenu">${PERIODS[UI.period]} <i class="fa-solid fa-chevron-down" style="font-size:9px"></i></button>
    <button class="pill" data-act="resetData"><i class="fa-solid fa-rotate-right"></i> Reset Data</button>`)}
  <div class="cards">
    <div class="stat hot">
      <div class="body"><div class="row"><div class="ic"><i class="fa-solid fa-wallet"></i></div><div><div class="ttl">My balance</div><div class="sub">Wallet Overview &amp; Spending</div></div><i class="fa-solid fa-ellipsis dots"></i></div>
      <div class="amt">${money(bal)} <span class="chg w">${pct(balChg)}</span></div></div>
      <div class="foot" data-act="balDetails">See details <i class="fa-solid fa-arrow-right"></i></div>
    </div>
    <div class="stat">
      <div class="body"><div class="row"><div class="ic"><i class="fa-solid fa-piggy-bank"></i></div><div><div class="ttl">Savings account</div><div class="sub">Steady Growth Savings</div></div><i class="fa-solid fa-ellipsis dots"></i></div>
      <div class="amt">${money(S.savings)} <span class="chg ${cls(S.savingsChg)}">${pct(S.savingsChg)}</span></div></div>
      <div class="foot" data-act="savings">View summary <i class="fa-solid fa-arrow-right"></i></div>
    </div>
    <div class="stat">
      <div class="body"><div class="row"><div class="ic"><i class="fa-solid fa-chart-pie"></i></div><div><div class="ttl">Investment portfolio</div><div class="sub">Track Your Wealth Growth</div></div><i class="fa-solid fa-ellipsis dots"></i></div>
      <div class="amt">${money(investTotal())} <span class="chg ${cls(S.investChg)}">${pct(S.investChg)}</span></div></div>
      <div class="foot" data-act="invest">Analyze performance <i class="fa-solid fa-arrow-right"></i></div>
    </div>
  </div>

  <div class="mid">
    <div class="box">
      <div class="box-head"><div><h3>My Wallet</h3><small>Today 1 USD = 122.20 BDT</small></div>
        <button class="btn primary sm" data-act="addWallet"><i class="fa-solid fa-plus"></i> Add New</button></div>
      <div class="wallets">${S.wallets.map(walletCard).join('')}</div>
    </div>
    <div class="box">
      <div class="chart-top">
        <div><h3>Cash Flow</h3><div class="big">${money(ps.net)}</div></div>
        <div class="toggle">
          <button class="${UI.chartMode === 'monthly' ? 'on' : ''}" data-act="chartMode" data-val="monthly">Monthly</button>
          <button class="${UI.chartMode === 'yearly' ? 'on or' : ''}" data-act="chartMode" data-val="yearly"><i class="fa-solid fa-circle" style="font-size:6px;color:${UI.chartMode === 'yearly' ? '#fff' : '#ff5a1f'};margin-right:4px"></i>Yearly</button>
        </div>
      </div>
      <div class="chart"><div class="yaxis" id="yaxis"></div><div class="bars" id="bars"></div><div class="tip" id="tip"></div></div>
    </div>
  </div>

  <div class="box">
    <div class="box-head" style="align-items:center">
      <h3>Recent Activities</h3>
      <div class="tools">
        <div class="tsearch"><i class="fa-solid fa-magnifying-glass"></i><input data-in="dashQ" placeholder="Search" value="${esc(UI.dashQ)}"></div>
        <button class="pill" data-act="dashFilter">Filter${UI.dashStatus !== 'all' ? ' · ' + UI.dashStatus : ''} <i class="fa-solid fa-sliders"></i></button>
      </div>
    </div>
    <div class="table-wrap"><table>${txHead('dash')}<tbody id="dashBody"></tbody></table></div>
    <div class="table-foot" id="dashFoot"></div>
  </div>`;
}
const txHead = id => `<thead><tr><th style="width:30px"><input type="checkbox" class="cb" data-selall="${id}"></th><th>Activity</th><th>Order ID</th><th>Date</th><th>Time</th><th>Price</th><th>Status</th><th></th></tr></thead>`;
function txRow(t) {
  const sign = t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '';
  return `<tr>
    <td><input type="checkbox" class="cb" data-sel="${t.id}" ${UI.sel.has(t.id) ? 'checked' : ''}></td>
    <td><div class="act"><span class="lg">${esc(t.title[0] || '?').toUpperCase()}</span>${esc(t.title)}</div></td>
    <td>${t.orderId}</td><td>${fmtDate(t.ts)}</td><td>${fmtTime(t.ts)}</td>
    <td class="amt-${t.type}">${sign}${money(t.amount, txCur(t))}</td>
    <td>${statusPill(t.status)}</td>
    <td><button class="dots-btn" data-act="txMenu" data-id="${t.id}"><i class="fa-solid fa-ellipsis"></i></button></td></tr>`;
}
function renderDashTable() {
  const body = $('#dashBody'); if (!body) return;
  const [pf, pt] = periodRange(), q = UI.dashQ.toLowerCase();
  const all = S.txs.filter(t => t.ts >= pf && t.ts < pt && (UI.dashStatus === 'all' || t.status === UI.dashStatus) && (!q || (t.title + ' ' + t.orderId + ' ' + t.cat).toLowerCase().includes(q))).sort((a, b) => b.ts - a.ts);
  const list = all.slice(0, 6); UI.visible = list.map(t => t.id);
  body.innerHTML = list.length ? list.map(txRow).join('') : `<tr><td colspan="8">${empty('fa-receipt', 'No activity found')}</td></tr>`;
  $('#dashFoot').innerHTML = all.length > 6 ? `Showing 6 of ${all.length} · <a href="#/transactions">View all transactions →</a>` : `${all.length} activit${all.length === 1 ? 'y' : 'ies'}`;
  syncSelAll('dash');
}
function syncSelAll(id) {
  const c = $(`[data-selall="${id}"]`); if (!c) return;
  c.checked = UI.visible.length > 0 && UI.visible.every(i => UI.sel.has(i));
}

/* Cash flow chart */
function chartData() {
  const now = new Date(), out = [];
  if (UI.chartMode === 'monthly') {
    for (let i = 6; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); out.push({ label: MONTHS[d.getMonth()], full: MONTHS[d.getMonth()] + ' ' + d.getFullYear(), ...stats(d.getTime(), new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()) }); }
  } else {
    for (let i = 3; i >= 0; i--) { const y = now.getFullYear() - i; out.push({ label: String(y), full: 'Year ' + y, ...stats(new Date(y, 0, 1).getTime(), new Date(y + 1, 0, 1).getTime()) }); }
  }
  return out;
}
function niceScale(max) {
  if (max <= 0) max = 1000;
  const raw = max / 5, p = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * p).find(s => s >= raw);
  return { max: step * 5, ticks: [5, 4, 3, 2, 1, 0].map(i => i * step) };
}
function drawChart() {
  const el = $('#bars'); if (!el) return;
  const d = UI.chartData = chartData(), sc = niceScale(Math.max(...d.map(x => x.inc), 0));
  $('#yaxis').innerHTML = sc.ticks.map(t => `<span>${short(t)}</span>`).join('');
  if (UI.active == null || UI.active >= d.length) UI.active = d.reduce((b, x, i) => x.inc > d[b].inc ? i : b, 0);
  el.innerHTML = d.map((x, i) => `<div class="col ${i === UI.active ? 'active' : ''}" data-i="${i}"><div class="bar" style="height:0" data-p="${x.inc / sc.max}"></div><span class="lbl">${x.label}</span></div>`).join('');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $$('.col', el).forEach(c => { const p = +c.querySelector('.bar').dataset.p; c.querySelector('.bar').style.height = (p * 100) + '%'; c.style.setProperty('--top', ((1 - p) * 100) + '%'); });
    showTip();
  }));
}
function showTip() {
  const tip = $('#tip'), d = UI.chartData[UI.active], col = $(`#bars .col[data-i="${UI.active}"]`); if (!tip || !d || !col) return;
  tip.innerHTML = `<div class="d">${d.full}</div><div class="r"><span>Income</span><span class="g">${money(d.inc)}</span></div><div class="r"><span>Expense</span><span class="rd">-${money(d.exp)}</span></div><div class="r"><span>Net</span><b>${money(d.net)}</b></div>`;
  tip.style.display = 'block';
  const cr = col.getBoundingClientRect(), pr = $('.chart').getBoundingClientRect();
  let left = cr.right - pr.left + 8; if (left + tip.offsetWidth > pr.width) left = cr.left - pr.left - tip.offsetWidth - 8;
  tip.style.left = Math.max(0, left) + 'px'; tip.style.top = '6px';
}
function setActiveBar(i) {
  if (i === UI.active) return; UI.active = i;
  $$('#bars .col').forEach(c => c.classList.toggle('active', +c.dataset.i === i)); showTip();
}

/* ---------- Transactions page ---------- */
function viewTransactions() {
  const f = UI.tx;
  return `${pageHead('Transactions', 'All your income, expenses and transfers', `
    <button class="pill" data-act="exportCsv"><i class="fa-solid fa-download"></i> Export CSV</button>
    <button class="btn primary" data-act="addTx"><i class="fa-solid fa-plus"></i> Add Transaction</button>`)}
  <div class="box">
    <div class="toolbar">
      <div class="tsearch grow"><i class="fa-solid fa-magnifying-glass"></i><input data-in="txQ" placeholder="Search activity, order ID or category" value="${esc(f.q)}"></div>
      <select class="fi sm" data-chg="txType">${opts([['all', 'All types'], ['income', 'Income'], ['expense', 'Expense'], ['transfer', 'Transfer']], f.type)}</select>
      <select class="fi sm" data-chg="txStatus">${opts([['all', 'All status'], ['Completed', 'Completed'], ['Pending', 'Pending'], ['Failed', 'Failed']], f.status)}</select>
      <select class="fi sm" data-chg="txWallet">${opts([['all', 'All wallets'], ...S.wallets.map(w => [w.id, w.cur + ' Wallet'])], f.wallet)}</select>
      <select class="fi sm" data-chg="txSort">${opts([['date_desc', 'Newest first'], ['date_asc', 'Oldest first'], ['amt_desc', 'Amount: high → low'], ['amt_asc', 'Amount: low → high']], f.sort)}</select>
      <button class="btn danger sm" id="bulkBtn" data-act="bulkDelete" style="display:none"></button>
    </div>
    <div class="table-wrap"><table>${txHead('tx')}<tbody id="txBody"></tbody></table></div>
    <div class="pager" id="txPager"></div>
  </div>`;
}
function filteredTx() {
  const f = UI.tx, q = f.q.toLowerCase();
  const L = S.txs.filter(t => (!q || (t.title + ' ' + t.orderId + ' ' + t.cat).toLowerCase().includes(q)) && (f.type === 'all' || t.type === f.type) && (f.status === 'all' || t.status === f.status) && (f.wallet === 'all' || t.walletId === f.wallet));
  const s = { date_desc: (a, b) => b.ts - a.ts, date_asc: (a, b) => a.ts - b.ts, amt_desc: (a, b) => txUSD(b) - txUSD(a), amt_asc: (a, b) => txUSD(a) - txUSD(b) }[f.sort];
  return L.sort(s);
}
const PER = 10;
function renderTxTable() {
  const body = $('#txBody'); if (!body) return;
  const all = filteredTx(), pages = Math.max(1, Math.ceil(all.length / PER));
  UI.tx.page = Math.min(Math.max(1, UI.tx.page), pages);
  const list = all.slice((UI.tx.page - 1) * PER, UI.tx.page * PER); UI.visible = list.map(t => t.id);
  body.innerHTML = list.length ? list.map(txRow).join('') : `<tr><td colspan="8">${empty('fa-receipt', 'No transactions match your filters')}</td></tr>`;
  const from = all.length ? (UI.tx.page - 1) * PER + 1 : 0, to = Math.min(all.length, UI.tx.page * PER), p = UI.tx.page;
  let nums = ''; for (let i = Math.max(1, p - 2); i <= Math.min(pages, p + 2); i++) nums += `<button class="pg ${i === p ? 'on' : ''}" data-act="pgGo" data-val="${i}">${i}</button>`;
  $('#txPager').innerHTML = `<span>Showing ${from}–${to} of ${all.length}</span><div class="pgs"><button class="pg" data-act="pgGo" data-val="${p - 1}" ${p <= 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>${nums}<button class="pg" data-act="pgGo" data-val="${p + 1}" ${p >= pages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button></div>`;
  const b = $('#bulkBtn'); if (b) { b.style.display = UI.sel.size ? '' : 'none'; b.innerHTML = `<i class="fa-solid fa-trash"></i> Delete (${UI.sel.size})`; }
  syncSelAll('tx');
}

/* ---------- Analytics page ---------- */
function viewAnalytics() {
  const n = UI.an.months, now = new Date(), months = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ label: MONTHS[d.getMonth()], ...stats(d.getTime(), new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()) }); }
  const from = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1).getTime();
  const tot = months.reduce((a, m) => ({ inc: a.inc + m.inc, exp: a.exp + m.exp }), { inc: 0, exp: 0 });
  const rate = tot.inc > 0 ? (tot.inc - tot.exp) / tot.inc * 100 : 0;
  const cat = {}, exps = [];
  S.txs.forEach(t => { if (t.type !== 'expense' || t.sys || t.status !== 'Completed' || t.ts < from) return; cat[t.cat] = (cat[t.cat] || 0) + txUSD(t); exps.push(t); });
  const cats = Object.entries(cat).sort((a, b) => b[1] - a[1]), ctot = cats.reduce((a, c) => a + c[1], 0);
  let acc = 0; const grad = cats.map(([k, v]) => { const s = acc / ctot * 100; acc += v; return `${CAT_COLORS[k] || '#94a3b8'} ${s}% ${acc / ctot * 100}%`; }).join(',');
  const top = exps.sort((a, b) => txUSD(b) - txUSD(a)).slice(0, 5);
  const mx = Math.max(1, ...months.map(m => Math.max(m.inc, m.exp)));
  const card = (ic, label, val, sub, c) => `<div class="mini"><div class="mic ${c}"><i class="fa-solid ${ic}"></i></div><div><small>${label}</small><b>${val}</b>${sub ? `<em>${sub}</em>` : ''}</div></div>`;
  return `${pageHead('Analytics', 'Understand where your money comes from and goes', `<select class="fi sm" data-chg="anRange">${opts([[3, 'Last 3 months'], [6, 'Last 6 months'], [12, 'Last 12 months']], n)}</select>`)}
  <div class="mini-grid">
    ${card('fa-arrow-trend-up', 'Total income', money(tot.inc, 'USD', 0), '', 'g')}
    ${card('fa-arrow-trend-down', 'Total expenses', money(tot.exp, 'USD', 0), '', 'r')}
    ${card('fa-piggy-bank', 'Net savings', money(tot.inc - tot.exp, 'USD', 0), '', 'o')}
    ${card('fa-percent', 'Savings rate', rate.toFixed(1) + '%', '', 'b')}
  </div>
  <div class="mid">
    <div class="box"><div class="box-head"><h3>Income vs Expenses</h3><div class="legend"><span><i style="background:#ff5a1f"></i>Income</span><span><i style="background:#4a4a50"></i>Expense</span></div></div>
      <div class="gb">${months.map(m => `<div class="gcol" title="${m.label}: ${money(m.inc, 'USD', 0)} in, ${money(m.exp, 'USD', 0)} out"><div class="g-bars"><div class="gbar inc" style="height:${m.inc / mx * 100}%"></div><div class="gbar exp" style="height:${m.exp / mx * 100}%"></div></div><span>${m.label}</span></div>`).join('')}</div></div>
    <div class="box"><div class="box-head"><h3>Spending by category</h3></div>
      ${cats.length ? `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${grad})"><div class="donut-in"><small>Total spent</small><b>${money(ctot, 'USD', 0)}</b></div></div>
      <ul class="cat-list">${cats.map(([k, v]) => `<li><i style="background:${CAT_COLORS[k] || '#94a3b8'}"></i><span>${esc(k)}</span><b>${money(v, 'USD', 0)}</b><em>${(v / ctot * 100).toFixed(0)}%</em></li>`).join('')}</ul></div>` : empty('fa-chart-pie', 'No expenses in this period')}</div>
  </div>
  <div class="box"><div class="box-head"><h3>Top expenses</h3></div>
    ${top.length ? `<div class="table-wrap"><table><thead><tr><th>Activity</th><th>Category</th><th>Date</th><th>Amount</th></tr></thead><tbody>${top.map(t => `<tr><td><div class="act"><span class="lg">${esc(t.title[0]).toUpperCase()}</span>${esc(t.title)}</div></td><td>${esc(t.cat)}</td><td>${fmtDate(t.ts)}</td><td>${money(t.amount, txCur(t))}</td></tr>`).join('')}</tbody></table></div>` : empty('fa-receipt', 'Nothing here yet')}</div>`;
}

/* ---------- Invoices page ---------- */
const invStatus = i => i.status === 'Paid' ? 'Paid' : (i.due < Date.now() ? 'Overdue' : 'Pending');
function viewInvoices() {
  const sum = s => S.invoices.filter(i => invStatus(i) === s).reduce((a, i) => a + i.amount, 0);
  const cnt = s => S.invoices.filter(i => invStatus(i) === s).length;
  const card = (ic, label, val, c) => `<div class="mini"><div class="mic ${c}"><i class="fa-solid ${ic}"></i></div><div><small>${label}</small><b>${money(val, 'USD', 0)}</b></div></div>`;
  return `${pageHead('Invoices', 'Create invoices and track payments', `<button class="btn primary" data-act="addInvoice"><i class="fa-solid fa-plus"></i> New Invoice</button>`)}
  <div class="mini-grid">
    ${card('fa-file-invoice-dollar', `Total (${S.invoices.length})`, S.invoices.reduce((a, i) => a + i.amount, 0), 'o')}
    ${card('fa-circle-check', `Paid (${cnt('Paid')})`, sum('Paid'), 'g')}
    ${card('fa-clock', `Pending (${cnt('Pending')})`, sum('Pending'), 'y')}
    ${card('fa-triangle-exclamation', `Overdue (${cnt('Overdue')})`, sum('Overdue'), 'r')}
  </div>
  <div class="box">
    <div class="toolbar">
      <div class="tsearch grow"><i class="fa-solid fa-magnifying-glass"></i><input data-in="invQ" placeholder="Search by client or invoice no." value="${esc(UI.inv.q)}"></div>
      <select class="fi sm" data-chg="invStatus">${opts([['all', 'All status'], ['Paid', 'Paid'], ['Pending', 'Pending'], ['Overdue', 'Overdue']], UI.inv.status)}</select>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Invoice</th><th>Client</th><th>Amount</th><th>Issued</th><th>Due date</th><th>Status</th><th></th></tr></thead><tbody id="invBody"></tbody></table></div>
  </div>`;
}
function renderInvTable() {
  const b = $('#invBody'); if (!b) return; const q = UI.inv.q.toLowerCase();
  const L = S.invoices.filter(i => (!q || (i.client + i.no).toLowerCase().includes(q)) && (UI.inv.status === 'all' || invStatus(i) === UI.inv.status)).sort((a, c) => c.issued - a.issued);
  b.innerHTML = L.length ? L.map(i => `<tr><td><b>${esc(i.no)}</b></td><td><div class="act"><span class="lg">${esc(i.client[0]).toUpperCase()}</span>${esc(i.client)}</div></td><td>${money(i.amount)}</td><td>${fmtDate(i.issued)}</td><td>${fmtDate(i.due)}</td><td>${statusPill(invStatus(i))}</td>
    <td><div class="row-btns">${i.status === 'Paid' ? '' : `<button class="btn ghost xs" data-act="invPaid" data-id="${i.id}"><i class="fa-solid fa-check"></i> Mark paid</button>`}<button class="dots-btn" data-act="invDelete" data-id="${i.id}" title="Delete"><i class="fa-solid fa-trash"></i></button></div></td></tr>`).join('') : `<tr><td colspan="7">${empty('fa-file-invoice', 'No invoices found')}</td></tr>`;
}

/* ---------- Recurring + Subscriptions ---------- */
function viewRecurring(kind) {
  const isSub = kind === 'sub', L = S.recs.filter(r => r.kind === kind);
  const mult = { weekly: 52 / 12, monthly: 1, yearly: 1 / 12 };
  const monthly = (type) => L.filter(r => r.active && r.type === type).reduce((a, r) => a + r.amount * CUR[wCur(r.walletId)].rate * mult[r.freq], 0);
  const active = L.filter(r => r.active).length;
  const card = (ic, label, val, c) => `<div class="mini"><div class="mic ${c}"><i class="fa-solid ${ic}"></i></div><div><small>${label}</small><b>${val}</b></div></div>`;
  const summary = isSub
    ? `${card('fa-layer-group', 'Active subscriptions', active + ' / ' + L.length, 'o')}${card('fa-calendar', 'Monthly cost', money(monthly('expense')), 'r')}${card('fa-calendar-days', 'Yearly cost', money(monthly('expense') * 12), 'y')}`
    : `${card('fa-rotate', 'Active schedules', active + ' / ' + L.length, 'o')}${card('fa-arrow-trend-down', 'Monthly outflow', money(monthly('expense')), 'r')}${card('fa-arrow-trend-up', 'Monthly inflow', money(monthly('income')), 'g')}`;
  const item = r => `<div class="rc ${r.active ? '' : 'off'}">
      <div class="rc-top"><div class="rc-ic" style="color:${isSub ? iconColor(r.icon) : '#ff5a1f'}"><i class="${r.icon}"></i></div>
        <div class="rc-t"><b>${esc(r.title)}</b><small>${isSub ? esc(r.cat) : (r.type === 'income' ? 'Income' : 'Expense') + ' · ' + esc(r.cat)}</small></div>
        <label class="switch"><input type="checkbox" data-tog="${r.id}" ${r.active ? 'checked' : ''}><i></i></label></div>
      <div class="rc-amt ${r.type === 'income' ? 'amt-income' : ''}">${r.type === 'income' ? '+' : ''}${money(r.amount, wCur(r.walletId))}<small>/ ${r.freq === 'monthly' ? 'month' : r.freq === 'yearly' ? 'year' : 'week'}</small></div>
      <div class="rc-meta"><span><i class="fa-regular fa-calendar"></i> ${r.active ? 'Next: ' + fmtDate(r.next) : (isSub ? 'Cancelled' : 'Paused')}</span><span><i class="fa-solid fa-wallet"></i> ${wCur(r.walletId)}</span></div>
      <div class="rc-btns"><button class="btn ghost xs" data-act="recRun" data-id="${r.id}"><i class="fa-solid fa-play"></i> ${r.type === 'income' ? 'Receive now' : 'Pay now'}</button><button class="dots-btn" data-act="recDelete" data-id="${r.id}" title="Delete"><i class="fa-solid fa-trash"></i></button></div>
    </div>`;
  return `${pageHead(isSub ? 'Subscriptions' : 'Recurring', isSub ? 'Manage your services and monthly billing' : 'Automatic payments that run on a schedule', `<button class="btn primary" data-act="addRec" data-val="${kind}"><i class="fa-solid fa-plus"></i> ${isSub ? 'Add Subscription' : 'Add Recurring'}</button>`)}
  <div class="mini-grid three">${summary}</div>
  ${L.length ? `<div class="rc-grid">${L.map(item).join('')}</div>` : `<div class="box">${empty('fa-rotate', 'Nothing here yet. Click the button above to add one.')}</div>`}`;
}

/* ---------- Feedback ---------- */
function viewFeedback() {
  UI.rating = 0;
  return `${pageHead('Feedback', 'Tell us what you like and what we can improve')}
  <div class="mid even">
    <div class="box"><div class="box-head"><h3>Send feedback</h3></div>
      <form data-form="feedback">
        ${fld('Category', `<select class="fi" name="cat">${opts(['General', 'Bug report', 'Feature request', 'Design'].map(x => [x, x]), 'General')}</select>`)}
        <div class="fld"><span>Rating</span><div class="stars" id="stars">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-act="rate" data-val="${i}"><i class="fa-regular fa-star"></i></button>`).join('')}</div></div>
        ${fld('Message', `<textarea class="fi" name="msg" rows="5" placeholder="Write your feedback here..."></textarea>`)}
        <div class="form-err"></div>
        <button class="btn primary" type="submit"><i class="fa-solid fa-paper-plane"></i> Submit feedback</button>
      </form></div>
    <div class="box"><div class="box-head"><h3>Your feedback (${S.feedback.length})</h3></div>
      ${S.feedback.length ? `<ul class="fb-list">${S.feedback.map(f => `<li><div class="fb-top"><b>${esc(f.cat)}</b><span class="fb-stars">${'<i class="fa-solid fa-star"></i>'.repeat(f.rating)}${'<i class="fa-regular fa-star"></i>'.repeat(5 - f.rating)}</span><small>${timeAgo(f.ts)}</small><button class="dots-btn" data-act="fbDelete" data-id="${f.id}"><i class="fa-solid fa-trash"></i></button></div><p>${esc(f.msg)}</p></li>`).join('')}</ul>` : empty('fa-comment-dots', 'No feedback sent yet')}</div>
  </div>`;
}

/* ========================== 7. MODALS & FORMS ========================== */
/* ----- Transaction add ----- */
function openAddTx(p = {}) {
  const type = p.type || 'expense';
  modal('Add transaction', `<form data-form="addTx">
    <div class="seg" id="typeSeg"><label><input type="radio" name="type" value="expense" ${type === 'expense' ? 'checked' : ''} data-chg="txFormType"><span><i class="fa-solid fa-arrow-down"></i> Expense</span></label><label><input type="radio" name="type" value="income" ${type === 'income' ? 'checked' : ''} data-chg="txFormType"><span><i class="fa-solid fa-arrow-up"></i> Income</span></label></div>
    ${fld('Title', `<input class="fi" name="title" placeholder="e.g. Grocery shopping" value="${esc(p.title || '')}" maxlength="40">`)}
    <div class="two">${fld('Amount', `<input class="fi" name="amount" type="number" step="0.01" min="0" placeholder="0.00" required>`)}${fld('Wallet', `<select class="fi" name="walletId">${walletOpts(p.walletId)}</select>`)}</div>
    <div class="two">${fld('Category', `<select class="fi" name="cat" id="catSel">${opts((type === 'income' ? CATS_INC : CATS_EXP).map(x => [x, x]), p.cat)}</select>`)}${fld('Status', `<select class="fi" name="status">${opts([['Completed', 'Completed'], ['Pending', 'Pending']], 'Completed')}</select>`)}</div>
    ${fld('Date', `<input class="fi" type="date" name="date" value="${toInputDate(Date.now())}" max="${toInputDate(Date.now())}">`)}
    <div class="form-err"></div>
    <div class="m-actions"><button type="button" class="btn ghost" data-act="closeModal">Cancel</button><button class="btn primary" type="submit">Add transaction</button></div></form>`);
}

/* ----- Wallets ----- */
function openWallet(id) {
  const w = W(id); if (!w) return;
  const spent = spentThisMonth(id), pct = Math.min(100, spent / w.limit * 100);
  modal(`${w.cur} Wallet`, `
    <div class="wd-top"><img src="${flagSrc(CUR[w.cur].flag)}" alt=""><div><b>${CUR[w.cur].name}</b><small>1 ${w.cur} = ${CUR[w.cur].rate} USD</small></div>${statusPill(w.active ? 'Active' : 'Inactive')}</div>
    <div class="wd-bal">${money(w.bal, w.cur)}<small>≈ ${money(w.bal * CUR[w.cur].rate)} USD</small></div>
    <div class="lim-bar"><div class="lim-t"><span>Monthly spending</span><b>${money(spent, w.cur, 0)} / ${money(w.limit, w.cur, 0)}</b></div><div class="progress"><i style="width:${pct}%;${pct > 85 ? 'background:#ff5a5f' : ''}"></i></div></div>
    <div class="wd-btns">
      <button class="btn primary" data-act="wDeposit" data-id="${id}"><i class="fa-solid fa-arrow-down"></i> Deposit</button>
      <button class="btn ghost" data-act="wWithdraw" data-id="${id}"><i class="fa-solid fa-arrow-up"></i> Withdraw</button>
      <button class="btn ghost" data-act="wTransfer" data-id="${id}"><i class="fa-solid fa-right-left"></i> Transfer</button>
    </div>
    <form data-form="wLimit" class="inline-form"><input type="hidden" name="id" value="${id}">${fld('Monthly limit (' + w.cur + ')', `<input class="fi" type="number" min="1" step="1" name="limit" value="${w.limit}">`)}<button class="btn ghost" type="submit">Save</button></form>
    <div class="form-err"></div>
    <div class="m-actions between"><button class="btn ghost" data-act="wToggle" data-id="${id}"><i class="fa-solid fa-power-off"></i> ${w.active ? 'Deactivate' : 'Activate'}</button><button class="btn danger" data-act="wDelete" data-id="${id}"><i class="fa-solid fa-trash"></i> Delete wallet</button></div>`);
}
function openAddWallet() {
  const free = Object.keys(CUR).filter(c => !S.wallets.some(w => w.cur === c));
  if (!free.length) return toast('All currencies already added', 'err');
  modal('Add new wallet', `<form data-form="addWallet">
    ${fld('Currency', `<select class="fi" name="cur">${free.map(c => `<option value="${c}">${c} · ${CUR[c].name}</option>`).join('')}</select>`)}
    <div class="two">${fld('Opening balance', `<input class="fi" type="number" name="bal" min="0" step="0.01" value="0">`)}${fld('Monthly limit', `<input class="fi" type="number" name="limit" min="1" step="1" value="10000">`)}</div>
    <div class="form-err"></div>
    <div class="m-actions"><button type="button" class="btn ghost" data-act="closeModal">Cancel</button><button class="btn primary" type="submit">Create wallet</button></div></form>`);
}
function openTransfer(fromId) {
  const act = S.wallets.filter(w => w.active);
  if (act.length < 2) return toast('You need at least 2 active wallets', 'err');
  const from = fromId || act[0].id, to = act.find(w => w.id !== from).id;
  modal('Transfer between wallets', `<form data-form="transfer">
    <div class="two">${fld('From', `<select class="fi" name="from" data-chg="trUpdate">${walletOpts(from)}</select>`)}${fld('To', `<select class="fi" name="to" data-chg="trUpdate">${walletOpts(to)}</select>`)}</div>
    ${fld('Amount', `<input class="fi" type="number" name="amount" min="0" step="0.01" data-in="trUpdate" required placeholder="0.00">`)}
    <div class="note" id="trPrev">Enter an amount to see the converted value</div>
    <div class="form-err"></div>
    <div class="m-actions"><button type="button" class="btn ghost" data-act="closeModal">Cancel</button><button class="btn primary" type="submit">Transfer</button></div></form>`);
}
function updateTransferPreview() {
  const f = $('form[data-form="transfer"]'); if (!f) return;
  const a = W(f.from.value), b = W(f.to.value), amt = parseFloat(f.amount.value);
  $('#trPrev').textContent = (a && b && amt > 0) ? `${money(amt, a.cur)} → ${money(amt * CUR[a.cur].rate / CUR[b.cur].rate, b.cur)}` : 'Enter an amount to see the converted value';
}

/* ----- Top card details ----- */
function openBalance() {
  const tot = totalBal();
  modal('Balance details', `<div class="bd-total"><small>Total balance</small><b>${money(tot)}</b></div>
  <ul class="bd-list">${S.wallets.map(w => { const u = w.bal * CUR[w.cur].rate; return `<li><img src="${flagSrc(CUR[w.cur].flag)}" alt=""><div class="bd-n"><b>${w.cur}</b><small>${money(w.bal, w.cur)}${w.active ? '' : ' · inactive'}</small></div><div class="bd-v"><b>${money(u)}</b><small>${tot ? (u / tot * 100).toFixed(1) : 0}%</small></div><div class="progress thin"><i style="width:${tot ? u / tot * 100 : 0}%"></i></div></li>`; }).join('')}</ul>
  <div class="nw"><span>Savings</span><b>${money(S.savings)}</b></div><div class="nw"><span>Investments</span><b>${money(investTotal())}</b></div><div class="nw total"><span>Net worth</span><b>${money(tot + S.savings + investTotal())}</b></div>`);
}
function openSavings() {
  modal('Savings account', `<div class="bd-total"><small>Savings balance · 4.2% APY</small><b>${money(S.savings)}</b></div>
  <form data-form="savings">
    <div class="seg"><label><input type="radio" name="dir" value="deposit" checked><span><i class="fa-solid fa-arrow-down"></i> Deposit</span></label><label><input type="radio" name="dir" value="withdraw"><span><i class="fa-solid fa-arrow-up"></i> Withdraw</span></label></div>
    <div class="two">${fld('Wallet', `<select class="fi" name="walletId">${walletOpts()}</select>`)}${fld('Amount', `<input class="fi" type="number" name="amount" min="0" step="0.01" required placeholder="0.00">`)}</div>
    <div class="form-err"></div>
    <div class="m-actions"><button type="button" class="btn ghost" data-act="closeModal">Close</button><button class="btn primary" type="submit">Confirm</button></div></form>`);
}
function openInvest() {
  const tot = investTotal();
  modal('Investment portfolio', `<div class="bd-total"><small>Portfolio value · <span class="${S.investChg >= 0 ? 'g' : 'rd'}">${S.investChg >= 0 ? '+' : ''}${S.investChg.toFixed(1)}%</span></small><b>${money(tot)}</b></div>
  <ul class="bd-list">${S.holdings.map(h => `<li class="nobig"><div class="bd-n"><b>${h.name}</b></div><div class="bd-v"><b>${money(h.value)}</b><small>${tot ? (h.value / tot * 100).toFixed(1) : 0}%</small></div><div class="progress thin"><i style="width:${tot ? h.value / tot * 100 : 0}%"></i></div></li>`).join('')}</ul>
  <button class="btn ghost full" data-act="market"><i class="fa-solid fa-arrows-rotate"></i> Refresh market prices</button>
  <form data-form="invest" style="margin-top:14px">
    <div class="seg"><label><input type="radio" name="dir" value="buy" checked><span><i class="fa-solid fa-arrow-down"></i> Invest</span></label><label><input type="radio" name="dir" value="sell"><span><i class="fa-solid fa-arrow-up"></i> Withdraw</span></label></div>
    <div class="two">${fld('Asset', `<select class="fi" name="asset">${S.holdings.map(h => `<option>${h.name}</option>`).join('')}</select>`)}${fld('Wallet', `<select class="fi" name="walletId">${walletOpts()}</select>`)}</div>
    ${fld('Amount (wallet currency)', `<input class="fi" type="number" name="amount" min="0" step="0.01" required placeholder="0.00">`)}
    <div class="form-err"></div>
    <div class="m-actions"><button type="button" class="btn ghost" data-act="closeModal">Close</button><button class="btn primary" type="submit">Confirm</button></div></form>`, true);
}

/* ----- Transaction details ----- */
function openTxDetail(id) {
  const t = S.txs.find(x => x.id === id); if (!t) return;
  const row = (k, v) => `<div class="dr"><span>${k}</span><b>${v}</b></div>`;
  modal('Transaction details', `<div class="bd-total"><small>${esc(t.title)}</small><b class="${t.type === 'income' ? 'g' : ''}">${t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}${money(t.amount, txCur(t))}</b></div>
    ${row('Order ID', t.orderId)}${row('Type', t.type[0].toUpperCase() + t.type.slice(1))}${row('Category', esc(t.cat))}${row('Wallet', wCur(t.walletId) + ' Wallet')}
    ${t.type === 'transfer' ? row('Received', t.toWalletId ? money(t.toAmount, wCur(t.toWalletId)) + ' in ' + wLabel(t.toWalletId) : '—') : ''}
    ${row('Date', fmtDate(t.ts))}${row('Time', fmtTime(t.ts))}${row('Status', statusPill(t.status))}
    ${t.sys ? '' : `<div class="m-actions between"><div class="row-btns">${['Completed', 'Pending', 'Failed'].filter(s => s !== t.status).map(s => `<button class="btn ghost xs" data-act="setStatus" data-id="${t.id}" data-val="${s}">Mark ${s}</button>`).join('')}</div><button class="btn danger xs" data-act="txDelete" data-id="${t.id}"><i class="fa-solid fa-trash"></i> Delete</button></div>`}`);
}
const wLabel = id => W(id) ? W(id).cur + ' Wallet' : 'Deleted wallet';

/* ----- Invoice / Recurring forms ----- */
function openAddInvoice() {
  const n = S.invoices.length + 2046;
  modal('New invoice', `<form data-form="invoice">
    <div class="two">${fld('Invoice no.', `<input class="fi" name="no" value="INV-${n}" required maxlength="14">`)}${fld('Client name', `<input class="fi" name="client" placeholder="e.g. Acme Corp" required maxlength="30">`)}</div>
    <div class="two">${fld('Amount (USD)', `<input class="fi" type="number" name="amount" min="1" step="0.01" required placeholder="0.00">`)}${fld('Due date', `<input class="fi" type="date" name="due" value="${toInputDate(Date.now() + 14 * DAY)}" required>`)}</div>
    <div class="form-err"></div>
    <div class="m-actions"><button type="button" class="btn ghost" data-act="closeModal">Cancel</button><button class="btn primary" type="submit">Create invoice</button></div></form>`);
}
function openAddRec(kind) {
  const isSub = kind === 'sub';
  modal(isSub ? 'Add subscription' : 'Add recurring payment', `<form data-form="rec"><input type="hidden" name="kind" value="${kind}">
    ${fld(isSub ? 'Service name' : 'Title', `<input class="fi" name="title" placeholder="${isSub ? 'e.g. Netflix' : 'e.g. Office rent'}" required maxlength="30">`)}
    ${isSub ? fld('Icon', `<select class="fi" name="icon">${SUB_ICONS.map(i => `<option value="${i[0]}">${i[1]}</option>`).join('')}</select>`)
      : `<div class="seg"><label><input type="radio" name="type" value="expense" checked><span><i class="fa-solid fa-arrow-down"></i> Expense</span></label><label><input type="radio" name="type" value="income"><span><i class="fa-solid fa-arrow-up"></i> Income</span></label></div>`}
    <div class="two">${fld('Amount', `<input class="fi" type="number" name="amount" min="0.01" step="0.01" required placeholder="0.00">`)}${fld('Wallet', `<select class="fi" name="walletId">${walletOpts()}</select>`)}</div>
    <div class="two">${fld('Repeats', `<select class="fi" name="freq">${opts([['monthly', 'Monthly'], ['weekly', 'Weekly'], ['yearly', 'Yearly']], 'monthly')}</select>`)}${fld(isSub ? 'Next billing' : 'Next payment', `<input class="fi" type="date" name="next" value="${toInputDate(Date.now() + 7 * DAY)}" required>`)}</div>
    ${isSub ? '' : fld('Category', `<select class="fi" name="cat">${opts(CATS_EXP.map(x => [x, x]), 'Other')}</select>`)}
    <div class="form-err"></div>
    <div class="m-actions"><button type="button" class="btn ghost" data-act="closeModal">Cancel</button><button class="btn primary" type="submit">Save</button></div></form>`);
}

/* ----- Topbar: bell, profile, help, share, pro ----- */
function openBell(anchor) {
  openMenu(anchor, `<div class="mh"><b>Notifications</b><div><button class="lnk" data-act="readAll">Mark all read</button><button class="lnk" data-act="clearNotifs">Clear</button></div></div>
    <div class="nlist">${S.notifs.length ? S.notifs.map(n => `<div class="ni ${n.read ? '' : 'unread'}"><i class="fa-solid fa-circle-dot"></i><div><p>${esc(n.text)}</p><small>${timeAgo(n.ts)}</small></div></div>`).join('') : '<div class="empty small"><p>No notifications</p></div>'}</div>`, 'wide');
}
function openProfileMenu(anchor) {
  openMenu(anchor, `<div class="mh prof"><div><b>${esc(S.user.name)}</b><small>${esc(S.user.email)}</small></div>${S.pro ? '<span class="status completed">PRO</span>' : ''}</div>` +
    menuItems([{ label: 'Edit profile', icon: 'fa-solid fa-user-pen', act: 'editProfile' }, { label: 'Notifications', icon: 'fa-regular fa-bell', act: 'bell2' }, { label: 'Send feedback', icon: 'fa-regular fa-comment-dots', act: 'goFeedback' }, { sep: 1 }, { label: 'Reset all data', icon: 'fa-solid fa-rotate-right', act: 'resetData', danger: 1 }]));
}
function openProfile() {
  modal('Edit profile', `<form data-form="profile">${fld('Full name', `<input class="fi" name="name" value="${esc(S.user.name)}" required maxlength="30">`)}${fld('Email', `<input class="fi" type="email" name="email" value="${esc(S.user.email)}" required>`)}
    <div class="form-err"></div><div class="m-actions"><button type="button" class="btn ghost" data-act="closeModal">Cancel</button><button class="btn primary" type="submit">Save changes</button></div></form>`);
}
function openHelp() {
  modal('Help & tips', `<ul class="help">
    <li><i class="fa-solid fa-wallet"></i><div><b>Wallets</b><p>Click a wallet to deposit, withdraw, transfer or change its monthly limit. Use <b>Add New</b> for another currency.</p></div></li>
    <li><i class="fa-solid fa-receipt"></i><div><b>Transactions</b><p>Add income or expenses. Balances update automatically. Pending/failed items do not change the balance.</p></div></li>
    <li><i class="fa-solid fa-rotate"></i><div><b>Recurring &amp; Subscriptions</b><p>Payments run automatically when their date arrives (checked each time the app opens).</p></div></li>
    <li><i class="fa-solid fa-floppy-disk"></i><div><b>Your data</b><p>Everything is saved in this browser. <b>Reset Data</b> restores the sample data.</p></div></li>
    <li><i class="fa-regular fa-keyboard"></i><div><b>Shortcuts</b><p><span class="kbd">Ctrl</span> + <span class="kbd">K</span> search · <span class="kbd">Esc</span> close windows</p></div></li></ul>`);
}
function summaryText() {
  const ms = stats(monthStart(0), Infinity);
  return `Fintrixity summary · ${fmtDate(Date.now())}\nTotal balance: ${money(totalBal())}\nSavings: ${money(S.savings)}\nInvestments: ${money(investTotal())}\nThis month: income ${money(ms.inc)}, expenses ${money(ms.exp)}, net ${money(ms.net)}\nWallets: ${S.wallets.map(w => w.cur + ' ' + money(w.bal, w.cur)).join(', ')}`;
}
function openShare() {
  modal('Share', `<textarea class="fi" id="shareTxt" rows="7" readonly>${esc(summaryText())}</textarea>
    <div class="m-actions"><button class="btn ghost" data-act="exportCsv"><i class="fa-solid fa-download"></i> Download CSV</button><button class="btn ghost" data-act="copyLink"><i class="fa-solid fa-link"></i> Copy link</button><button class="btn primary" data-act="copySummary"><i class="fa-regular fa-copy"></i> Copy summary</button></div>`);
}
function openUpgrade() {
  modal('Upgrade to Pro 👑', `<div class="plans"><label><input type="radio" name="plan" checked><span><b>Monthly</b><em>$9</em><small>per month</small></span></label><label><input type="radio" name="plan"><span><b>Yearly</b><em>$79</em><small>save 27%</small></span></label></div>
    <ul class="feat"><li><i class="fa-solid fa-check"></i> Unlimited wallets &amp; currencies</li><li><i class="fa-solid fa-check"></i> Advanced analytics and exports</li><li><i class="fa-solid fa-check"></i> Priority support</li></ul>
    <p class="muted-p small">This is a demo: no payment is taken.</p>
    <div class="m-actions"><button class="btn ghost" data-act="closeModal">Not now</button><button class="btn primary" data-act="activatePro"><i class="fa-solid fa-crown"></i> Activate Pro</button></div>`);
}
function openLearn() {
  modal('Fintrixity Pro', `<ul class="help"><li><i class="fa-solid fa-infinity"></i><div><b>Unlimited wallets</b><p>Hold as many currencies as you need.</p></div></li><li><i class="fa-solid fa-chart-column"></i><div><b>Advanced analytics</b><p>Deeper reports on spending and savings.</p></div></li><li><i class="fa-solid fa-headset"></i><div><b>Priority support</b><p>Faster answers from our team.</p></div></li></ul>
    <div class="m-actions"><button class="btn ghost" data-act="closeModal">Close</button>${S.pro ? '' : '<button class="btn primary" data-act="upgrade"><i class="fa-solid fa-crown"></i> Upgrade</button>'}</div>`);
}

/* ----- Form submit handlers ----- */
const FORMS = {
  addTx(d, f) {
    const amount = parseFloat(d.amount), type = d.type;
    const err = checkTx(type, amount, d.walletId, d.status); if (err) return formErr(f, err);
    const ts = d.date ? fromInputDate(d.date) : Date.now();
    const t = addTx({ title: (d.title || '').trim() || (type === 'income' ? 'Deposit' : 'Payment'), type, cat: d.cat, amount, walletId: d.walletId, status: d.status, ts: Math.min(ts, Date.now()) });
    notify(`${t.title}: ${type === 'income' ? '+' : '-'}${money(t.amount, wCur(t.walletId))} (${t.status})`);
    save(); closeModal(); refresh(); toast('Transaction added');
  },
  addWallet(d, f) {
    const bal = parseFloat(d.bal) || 0, limit = parseFloat(d.limit);
    if (!(limit > 0)) return formErr(f, 'Enter a valid monthly limit'); if (bal < 0) return formErr(f, 'Balance cannot be negative');
    if (S.wallets.some(w => w.cur === d.cur)) return formErr(f, 'Wallet already exists');
    const w = { id: 'w' + uid(), cur: d.cur, bal: r2(bal), limit, active: true }; S.wallets.push(w);
    if (bal > 0) { S.orderN++; S.txs.push({ id: uid(), orderId: 'INV_' + String(S.orderN).padStart(6, '0'), title: 'Opening balance', type: 'income', cat: 'Deposit', amount: r2(bal), walletId: w.id, status: 'Completed', ts: Date.now(), sys: true }); }
    notify(`${d.cur} wallet created`); save(); closeModal(); refresh(); toast(d.cur + ' wallet created');
  },
  wLimit(d, f) { const l = parseFloat(d.limit); if (!(l > 0)) return formErr(f, 'Enter a valid limit'); W(d.id).limit = l; save(); refresh(); openWallet(d.id); toast('Limit updated'); },
  transfer(d, f) {
    const a = W(d.from), b = W(d.to), amt = parseFloat(d.amount);
    if (!a || !b || a.id === b.id) return formErr(f, 'Choose two different wallets');
    const err = checkTx('transfer', amt, a.id, 'Completed'); if (err) return formErr(f, err);
    if (!b.active) return formErr(f, b.cur + ' wallet is inactive');
    const toAmount = r2(amt * CUR[a.cur].rate / CUR[b.cur].rate);
    addTx({ title: `Transfer to ${b.cur} Wallet`, type: 'transfer', cat: 'Transfer', amount: amt, walletId: a.id, toWalletId: b.id, toAmount });
    notify(`Transferred ${money(amt, a.cur)} to ${b.cur} wallet`); save(); closeModal(); refresh(); toast('Transfer complete');
  },
  savings(d, f) {
    const amt = parseFloat(d.amount), w = W(d.walletId), usd = amt * (w ? CUR[w.cur].rate : 1);
    if (d.dir === 'deposit') {
      const err = checkTx('transfer', amt, d.walletId, 'Completed'); if (err) return formErr(f, err);
      S.savings = r2(S.savings + usd); addTx({ title: 'Savings Deposit', type: 'expense', cat: 'Savings', amount: amt, walletId: w.id, sys: true });
    } else {
      if (!(amt > 0) || !w || !w.active) return formErr(f, 'Enter a valid amount and active wallet'); if (usd > S.savings) return formErr(f, 'Not enough savings balance');
      S.savings = r2(S.savings - usd); addTx({ title: 'Savings Withdrawal', type: 'income', cat: 'Savings', amount: amt, walletId: w.id, sys: true });
    }
    save(); closeModal(); refresh(); toast(d.dir === 'deposit' ? 'Deposited to savings' : 'Withdrawn from savings');
  },
  invest(d, f) {
    const amt = parseFloat(d.amount), w = W(d.walletId), usd = amt * (w ? CUR[w.cur].rate : 1), h = S.holdings.find(x => x.name === d.asset);
    if (d.dir === 'buy') {
      const err = checkTx('transfer', amt, d.walletId, 'Completed'); if (err) return formErr(f, err);
      h.value = r2(h.value + usd); addTx({ title: 'Invest in ' + h.name, type: 'expense', cat: 'Investment', amount: amt, walletId: w.id, sys: true });
    } else {
      if (!(amt > 0) || !w || !w.active) return formErr(f, 'Enter a valid amount and active wallet'); if (usd > h.value) return formErr(f, `Not enough in ${h.name}`);
      h.value = r2(h.value - usd); addTx({ title: 'Withdraw from ' + h.name, type: 'income', cat: 'Investment', amount: amt, walletId: w.id, sys: true });
    }
    save(); closeModal(); refresh(); toast('Portfolio updated');
  },
  invoice(d, f) {
    const amount = parseFloat(d.amount); if (!(amount > 0)) return formErr(f, 'Enter a valid amount');
    if (S.invoices.some(i => i.no === d.no.trim())) return formErr(f, 'Invoice number already exists');
    S.invoices.push({ id: uid(), no: d.no.trim(), client: d.client.trim(), amount, issued: Date.now(), due: fromInputDate(d.due), status: 'Pending' });
    notify(`Invoice ${d.no} created for ${d.client}`); save(); closeModal(); refresh(); toast('Invoice created');
  },
  rec(d, f) {
    const amount = parseFloat(d.amount); if (!(amount > 0)) return formErr(f, 'Enter a valid amount');
    const isSub = d.kind === 'sub';
    S.recs.push({ id: uid(), kind: d.kind, title: d.title.trim(), type: isSub ? 'expense' : d.type, cat: isSub ? 'Software' : d.cat, amount, walletId: d.walletId, freq: d.freq, next: fromInputDate(d.next), active: true, icon: isSub ? d.icon : (d.type === 'income' ? 'fa-solid fa-briefcase' : 'fa-solid fa-rotate') });
    processDue(); save(); closeModal(); refresh(); toast(isSub ? 'Subscription added' : 'Recurring payment added');
  },
  profile(d) { S.user.name = d.name.trim(); S.user.email = d.email.trim(); save(); closeModal(); updateChrome(); toast('Profile updated'); },
  feedback(d, f) {
    if (!UI.rating) return formErr(f, 'Please choose a rating'); if (d.msg.trim().length < 5) return formErr(f, 'Please write a little more');
    S.feedback.unshift({ id: uid(), cat: d.cat, rating: UI.rating, msg: d.msg.trim(), ts: Date.now() }); save(); refresh(); toast('Thanks for your feedback!');
  }
};

/* ========================== 8. EVENTS ========================== */
const ACT = {
  closeModal, confirmYes() { const f = CONFIRM; closeModal(); CONFIRM = null; if (f) f(); },
  navBack: () => history.back(), navFwd: () => history.forward(),
  goFeedback() { location.hash = '#/feedback'; },
  help: openHelp, share: openShare, upgrade: openUpgrade, learnMore: openLearn,
  bell: el => openBell(el), bell2() { openBell($('[data-act="bell"]')); },
  profileMenu: el => openProfileMenu(el), editProfile: openProfile,
  readAll() { S.notifs.forEach(n => n.read = true); save(); updateChrome(); openBell($('[data-act="bell"]')); },
  clearNotifs() { S.notifs = []; save(); updateChrome(); },
  activatePro() { S.pro = true; notify('Welcome to Fintrixity Pro!'); save(); closeModal(); updateChrome(); toast('Pro activated 👑'); },
  copySummary() { copyText($('#shareTxt').value); }, copyLink() { copyText(location.href); },
  exportCsv() {
    const L = cur === 'transactions' ? filteredTx() : S.txs.slice().sort((a, b) => b.ts - a.ts);
    const q = v => '"' + String(v).replace(/"/g, '""') + '"';
    const rows = [['Order ID', 'Activity', 'Type', 'Category', 'Amount', 'Currency', 'Status', 'Date', 'Time'], ...L.map(t => [t.orderId, t.title, t.type, t.cat, t.amount, txCur(t), t.status, fmtDate(t.ts), fmtTime(t.ts)])];
    download('transactions.csv', rows.map(r => r.map(q).join(',')).join('\n')); toast(`Exported ${L.length} transactions`);
  },
  resetData() { confirmBox('All your changes will be erased and the sample data will be restored.', () => { S = seed(); save(); UI.sel.clear(); refresh(); toast('Data reset'); }, 'Reset data'); },

  /* dashboard */
  periodMenu: el => openMenu(el, menuItems(Object.entries(PERIODS).map(([k, v]) => ({ label: v, act: 'setPeriod', val: k, check: UI.period === k })))),
  setPeriod(el) { UI.period = el.dataset.val; refresh(); },
  chartMode(el) { UI.chartMode = el.dataset.val; UI.active = null; refresh(); },
  dashFilter: el => openMenu(el, menuItems(['all', 'Completed', 'Pending', 'Failed'].map(s => ({ label: s === 'all' ? 'All status' : s, act: 'setDashStatus', val: s, check: UI.dashStatus === s })))),
  setDashStatus(el) { UI.dashStatus = el.dataset.val; refresh(); },
  balDetails: openBalance, savings: openSavings, invest: openInvest,
  market() {
    const before = investTotal();
    S.holdings.forEach(h => h.value = r2(h.value * (1 + (Math.random() - 0.45) * 0.06)));
    S.investChg = r2((investTotal() - before) / before * 100); save(); refresh(); openInvest(); toast('Market prices refreshed');
  },
  colClick(el) { setActiveBar(+el.dataset.i); },

  /* wallets */
  addWallet: openAddWallet, walletOpen: el => openWallet(el.dataset.id),
  wDeposit: el => openAddTx({ type: 'income', title: 'Deposit', cat: 'Deposit', walletId: el.dataset.id }),
  wWithdraw: el => openAddTx({ type: 'expense', title: 'Withdrawal', cat: 'Other', walletId: el.dataset.id }),
  wTransfer: el => openTransfer(el.dataset.id),
  wToggle(el) { const w = W(el.dataset.id); w.active = !w.active; save(); refresh(); openWallet(w.id); toast(w.cur + ' wallet ' + (w.active ? 'activated' : 'deactivated')); },
  wDelete(el) {
    const w = W(el.dataset.id);
    if (S.wallets.length < 2) return toast('At least one wallet is required', 'err');
    if (Math.abs(w.bal) > 0.009) return toast('Move or withdraw the balance first', 'err');
    confirmBox(`Delete ${w.cur} wallet and its ${S.txs.filter(t => t.walletId === w.id).length} transactions?`, () => {
      S.txs = S.txs.filter(t => t.walletId !== w.id); S.wallets = S.wallets.filter(x => x.id !== w.id); S.recs.forEach(r => { if (r.walletId === w.id) r.walletId = S.wallets[0].id; });
      save(); refresh(); toast('Wallet deleted');
    }, 'Delete');
  },

  /* transactions */
  addTx: () => openAddTx(),
  txMenu(el) {
    const t = S.txs.find(x => x.id === el.dataset.id); if (!t) return;
    openMenu(el, menuItems([{ label: 'View details', icon: 'fa-regular fa-eye', act: 'txView', id: t.id },
      ...(t.sys ? [] : [{ sep: 1 }, ...['Completed', 'Pending', 'Failed'].filter(s => s !== t.status).map(s => ({ label: 'Mark ' + s, icon: 'fa-solid fa-circle-check', act: 'setStatus', id: t.id, val: s })), { sep: 1 }, { label: 'Delete', icon: 'fa-solid fa-trash', act: 'txDelete', id: t.id, danger: 1 }])]));
  },
  txView: el => openTxDetail(el.dataset.id),
  setStatus: el => { setStatus(el.dataset.id, el.dataset.val); if ($('#modalRoot .m')) closeModal(); },
  txDelete(el) { const id = el.dataset.id; confirmBox('Delete this transaction? The wallet balance will be adjusted.', () => { deleteTx(id); save(); refresh(); toast('Transaction deleted'); }, 'Delete'); },
  bulkDelete() {
    const ids = [...UI.sel].filter(id => { const t = S.txs.find(x => x.id === id); return t && !t.sys; });
    if (!ids.length) { UI.sel.clear(); renderTxTable(); return toast('System transactions cannot be deleted', 'err'); }
    confirmBox(`Delete ${ids.length} selected transaction(s)?`, () => { ids.forEach(deleteTx); UI.sel.clear(); save(); refresh(); toast('Deleted ' + ids.length + ' transactions'); }, 'Delete');
  },
  pgGo(el) { UI.tx.page = +el.dataset.val; renderTxTable(); },

  /* invoices */
  addInvoice: openAddInvoice,
  invPaid(el) {
    const i = S.invoices.find(x => x.id === el.dataset.id), w = S.wallets.find(x => x.cur === 'USD' && x.active) || S.wallets.find(x => x.active);
    if (!w) return toast('Activate a wallet first', 'err');
    i.status = 'Paid'; addTx({ title: `Invoice ${i.no} · ${i.client}`, type: 'income', cat: 'Income', amount: r2(i.amount / CUR[w.cur].rate), walletId: w.id });
    notify(`Invoice ${i.no} paid: ${money(i.amount)}`); save(); refresh(); toast(`Payment added to ${w.cur} wallet`);
  },
  invDelete(el) { const id = el.dataset.id; confirmBox('Delete this invoice?', () => { S.invoices = S.invoices.filter(i => i.id !== id); save(); refresh(); toast('Invoice deleted'); }, 'Delete'); },

  /* recurring / subscriptions */
  addRec: el => openAddRec(el.dataset.val),
  recRun(el) {
    const r = S.recs.find(x => x.id === el.dataset.id), t = charge(r);
    notify(t.status === 'Completed' ? `${r.title} ${r.type === 'income' ? 'received' : 'paid'}` : `${r.title} payment failed`); save(); refresh();
    toast(t.status === 'Completed' ? (r.type === 'income' ? 'Received' : 'Paid') + ' ' + money(r.amount, wCur(t.walletId)) : 'Payment failed: low balance or inactive wallet', t.status === 'Completed' ? 'ok' : 'err');
  },
  recDelete(el) { const id = el.dataset.id; confirmBox('Delete this item?', () => { S.recs = S.recs.filter(r => r.id !== id); save(); refresh(); toast('Deleted'); }, 'Delete'); },

  /* feedback */
  rate(el) { UI.rating = +el.dataset.val; $$('#stars button').forEach((b, i) => { b.classList.toggle('on', i < UI.rating); b.firstChild.className = i < UI.rating ? 'fa-solid fa-star' : 'fa-regular fa-star'; }); },
  fbDelete(el) { S.feedback = S.feedback.filter(f => f.id !== el.dataset.id); save(); refresh(); },

  /* global search */
  goSearch(el) {
    const d = el.dataset; $('#searchRes').classList.remove('show'); $('#gsearch').value = '';
    if (d.id === 'tx') { UI.tx = { ...UI.tx, q: d.val, page: 1 }; }
    if (d.id === 'inv') { UI.inv.q = d.val; }
    if (location.hash === '#/' + d.r) refresh(); else location.hash = '#/' + d.r;
  }
};

const INPUTS = {
  gsearch(v) {
    const box = $('#searchRes'), q = v.trim().toLowerCase(); if (!q) { box.classList.remove('show'); return; }
    const pages = Object.entries(ROUTES).filter(([k, r]) => r[0].toLowerCase().includes(q));
    const txs = S.txs.filter(t => (t.title + ' ' + t.orderId).toLowerCase().includes(q)).sort((a, b) => b.ts - a.ts).slice(0, 4);
    const invs = S.invoices.filter(i => (i.client + i.no).toLowerCase().includes(q)).slice(0, 3);
    const recs = S.recs.filter(r => r.title.toLowerCase().includes(q)).slice(0, 3);
    const sec = (t, items) => items ? `<div class="sr-t">${t}</div>${items}` : '';
    const html = sec('Recurring & Subscriptions', recs.map(r => `<button data-act="goSearch" data-r="${r.kind === 'sub' ? 'subscriptions' : 'recurring'}"><i class="fa-solid fa-rotate"></i>${esc(r.title)} <em>${r.kind === 'sub' ? 'Subscription' : 'Recurring'}</em></button>`).join(''))
      + sec('Pages', pages.map(([k, r]) => `<button data-act="goSearch" data-r="${k}"><i class="fa-solid fa-arrow-right"></i>${r[0]}</button>`).join(''))
      + sec('Transactions', txs.map(t => `<button data-act="goSearch" data-r="transactions" data-id="tx" data-val="${esc(t.orderId)}"><i class="fa-solid fa-receipt"></i>${esc(t.title)} <em>${t.orderId}</em></button>`).join(''))
      + sec('Invoices', invs.map(i => `<button data-act="goSearch" data-r="invoices" data-id="inv" data-val="${esc(i.no)}"><i class="fa-solid fa-file-invoice"></i>${esc(i.client)} <em>${esc(i.no)}</em></button>`).join(''));
    box.innerHTML = html || '<div class="sr-t">No results</div>'; box.classList.add('show');
  },
  dashQ(v) { UI.dashQ = v; renderDashTable(); },
  txQ(v) { UI.tx.q = v; UI.tx.page = 1; renderTxTable(); },
  invQ(v) { UI.inv.q = v; renderInvTable(); },
  trUpdate: updateTransferPreview
};
const CHG = {
  txType(v) { UI.tx.type = v; UI.tx.page = 1; renderTxTable(); }, txStatus(v) { UI.tx.status = v; UI.tx.page = 1; renderTxTable(); },
  txWallet(v) { UI.tx.wallet = v; UI.tx.page = 1; renderTxTable(); }, txSort(v) { UI.tx.sort = v; renderTxTable(); },
  invStatus(v) { UI.inv.status = v; renderInvTable(); },
  anRange(v) { UI.an.months = +v; refresh(); },
  txFormType(v) { $('#catSel').innerHTML = opts((v === 'income' ? CATS_INC : CATS_EXP).map(x => [x, x])); },
  trUpdate: updateTransferPreview
};

document.addEventListener('click', e => {
  const act = e.target.closest('[data-act]');
  if (!e.target.closest('.search')) $('#searchRes').classList.remove('show');
  if (e.target.classList.contains('m-back')) { closeModal(); return; }
  if (!e.target.closest('.menu') || act) { justClosed = menuAnchor; closeMenu(); } else justClosed = null;
  if (!act) { justClosed = null; return; }
  const fn = ACT[act.dataset.act]; if (fn) fn(act, e);
  justClosed = null;
});
document.addEventListener('input', e => { const k = e.target.dataset.in; if (k && INPUTS[k]) INPUTS[k](e.target.value, e.target); });
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.chg && CHG[t.dataset.chg]) CHG[t.dataset.chg](t.value, t);
  if (t.dataset.sel) { t.checked ? UI.sel.add(t.dataset.sel) : UI.sel.delete(t.dataset.sel); syncSelAll(cur === 'dashboard' ? 'dash' : 'tx'); const b = $('#bulkBtn'); if (b) { b.style.display = UI.sel.size ? '' : 'none'; b.innerHTML = `<i class="fa-solid fa-trash"></i> Delete (${UI.sel.size})`; } }
  if (t.dataset.selall) { UI.visible.forEach(id => t.checked ? UI.sel.add(id) : UI.sel.delete(id)); $$('[data-sel]').forEach(c => c.checked = t.checked); const b = $('#bulkBtn'); if (b) { b.style.display = UI.sel.size ? '' : 'none'; b.innerHTML = `<i class="fa-solid fa-trash"></i> Delete (${UI.sel.size})`; } }
  if (t.dataset.tog) { const r = S.recs.find(x => x.id === t.dataset.tog); r.active = t.checked; if (r.active && r.next < Date.now()) r.next = Date.now() + DAY; /* resume karne par agli date kal se */ save(); refresh(); toast(`${r.title} ${r.active ? 'resumed' : (r.kind === 'sub' ? 'cancelled' : 'paused')}`); }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault();
  const fn = FORMS[f.dataset.form]; if (fn) fn(Object.fromEntries(new FormData(f)), f);
});
document.addEventListener('mouseover', e => { const c = e.target.closest('#bars .col'); if (c) setActiveBar(+c.dataset.i); });
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (window.innerWidth <= 900) toggleMenu(true); $('#gsearch').focus(); }
  if (e.key === 'Escape') { closeModal(); closeMenu(); $('#searchRes').classList.remove('show'); }
});
window.addEventListener('scroll', closeMenu, { passive: true });
window.addEventListener('resize', () => { if (window.innerWidth > 900) toggleMenu(false); if (cur === 'dashboard') showTip(); });
window.addEventListener('hashchange', route);

/* Mobile sidebar */
const sidebar = $('.sidebar'), overlay = $('#overlay');
function toggleMenu(open) { sidebar.classList.toggle('open', open); overlay.classList.toggle('show', open); }
$('#menuBtn').onclick = () => toggleMenu(!sidebar.classList.contains('open'));
overlay.onclick = () => toggleMenu(false);

/* ========================== 9. START ========================== */
load();
processDue();
route();