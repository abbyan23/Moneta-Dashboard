/* ============================================================
   Moneta – Utilities & Helper Functions
   ============================================================ */

// DOM helper
const $ = (s) => document.querySelector(s);

// Constants
const KEY = 'moneta_v2';
const now = new Date();
const DAY = 86400000; // 24 * 60 * 60 * 1000

// Pad number to 2 digits
const pad = (n) => String(n).padStart(2, '0');

// Create ISO date string (YYYY-MM-DD)
const iso = (y, m, d) => {
  const x = new Date(y, m, d);
  return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate());
};

// HTML escape — prevents XSS
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );

// Locale map for currency formatting
const LOC = {
  IDR: 'id-ID',
  USD: 'en-US',
  EUR: 'de-DE',
  SGD: 'en-SG',
  JPY: 'ja-JP',
};

// Category icon map
const ICON = {
  Makanan: 'restaurant',
  Transportasi: 'directions_car',
  Hunian: 'home',
  Hiburan: 'sports_esports',
  Kesehatan: 'fitness_center',
  Lainnya: 'category',
};

// Material icon helper
const ic = (name) => `<span class="material-symbols-outlined">${name}</span>`;

// Avatar helper
const avatar = (s = 36) =>
  S.user.photo
    ? `<img src="${S.user.photo}" class="rounded-full object-cover" style="width:${s}px;height:${s}px" alt="Foto profil ${esc(S.user.name)}">`
    : `<div class="rounded-full bg-sec text-white flex items-center justify-center font-bold" style="width:${s}px;height:${s}px">${esc((S.user.name || '?')[0].toUpperCase())}</div>`;

// Date formatting
const fdate = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

// Get today as ISO string
const today = () => iso(now.getFullYear(), now.getMonth(), now.getDate());

// Hex encode string
const hx = (s) => [...s].map((c) => c.charCodeAt(0).toString(16)).join('');

// SHA-256 hash for auth
async function H(n, p) {
  const b = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode('moneta|' + n + '|' + p)
  );
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// Currency exchange rate
const rate = () => S.rates[S.cur] || 1;

// Format currency
const fmt = (n) =>
  new Intl.NumberFormat(LOC[S.cur], {
    style: 'currency',
    currency: S.cur,
    maximumFractionDigits: S.cur === 'IDR' || S.cur === 'JPY' ? 0 : 2,
  }).format(n / rate());

// Convert internal amount to display value
const inv = (n) => Math.round((n / rate()) * 100) / 100;

// Convert user input to internal amount
const out = (x) => Math.round((parseFloat(x) || 0) * rate());

// Get timestamp from transaction
const ts = (t) => new Date(t.d + 'T00:00:00').getTime();

// Get date range based on current period
function range() {
  const e = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() + DAY;
  const starts = {
    month: new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
    '30': e - 30 * DAY,
    q: e - 90 * DAY,
    y: e - 365 * DAY,
  };
  const s = starts[period];
  return [s, e];
}

// Sum transactions of a type within a date range, optionally filtered by category
const sum = (type, a, b, cat) =>
  S.tx
    .filter((t) => t.type === type && ts(t) >= a && ts(t) < b && (!cat || t.cat === cat))
    .reduce((x, t) => x + t.amt, 0);

// Get month date range (m months ago)
const mRange = (m) => [
  new Date(now.getFullYear(), now.getMonth() - m, 1).getTime(),
  new Date(now.getFullYear(), now.getMonth() - m + 1, 1).getTime(),
];

// Calculate percentage change
const pct = (a, b) => (b ? Math.round(((a - b) / b) * 1000) / 10 : 0);

// Balance end date
const bEnd = () => new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() + DAY;

// Total savings
const svTotal = () => (S.sv || []).reduce((x, e) => x + (e.type === 'dep' ? e.amt : -e.amt), 0);

// Net balance (excluding savings)
const balance = () => S.open + sum('in', 0, bEnd()) - sum('out', 0, bEnd()) - svTotal();

// Sort transactions by date (newest first)
const recent = () => [...S.tx].sort((a, b) => ts(b) - ts(a) || b.id - a.id);

// Field helper for modals
const fld = (l, n, v = '', t = 'text', x = '') =>
  `<label class="form-label">${l}<input name="${n}" type="${t}" value="${esc(v)}" ${x} class="inp"></label>`;

// Select helper for modals
const sel = (l, n, opts, v) =>
  `<label class="form-label">${l}<select name="${n}" class="inp">${opts
    .map((o) => `<option value="${o[0]}" ${o[0] == v ? 'selected' : ''}>${o[1]}</option>`)
    .join('')}</select></label>`;
