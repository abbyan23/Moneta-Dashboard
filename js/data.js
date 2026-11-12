/* ============================================================
   Moneta – Data Layer (State, Seed, Persistence)
   ============================================================ */

// ── Application State ──
let S;                // Current user data
let view = 'dashboard';
let period = 'month';
let q = '';           // Search query
let typeF = 'all';    // Transaction type filter
let synced = false;
let DB = null;
let DBID = null;
let cb = null;        // Modal callback
let tab = 'in';       // Login tab (in/up)
let locked = 0;       // Auth lockout timestamp
let fails = 0;        // Failed login attempts
let ME = null;        // Current user name

// Account registry
let ACC = {
  ADMIN: '4ca650fe8dc8de42eab3a26c83ee7ebe54ff5a0b1c929a16e3355d845c003120',
};

// ── Dark Mode ──
let dark = (() => {
  try {
    const t = localStorage.getItem('moneta_theme');
    return t ? t === 'd' : matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (e) {
    return false;
  }
})();

// ── Seed Data ──
function seed() {
  const tx = [];
  let id = 1;
  const inc = [38.5, 36, 35, 34, 33, 32];
  const ex = [19.3, 18.2, 19.5, 16.8, 18, 17.2];
  const sp = [
    ['Makanan', 0.29],
    ['Transportasi', 0.09],
    ['Hunian', 0.39],
    ['Hiburan', 0.08],
    ['Kesehatan', 0.04],
    ['Lainnya', 0.11],
  ];

  for (let m = 0; m < 6; m++) {
    const cap = m ? 28 : now.getDate();

    // Income
    tx.push({
      id: id++,
      d: iso(now.getFullYear(), now.getMonth() - m, 1),
      type: 'in',
      cat: 'Pendapatan',
      note: 'Gaji & pendapatan lain',
      amt: inc[m] * 1e6,
    });

    // Expenses by category
    sp.forEach(([c, p], k) =>
      tx.push({
        id: id++,
        d: iso(now.getFullYear(), now.getMonth() - m, Math.min(1 + k * 3, cap)),
        type: 'out',
        cat: c,
        note: c === 'Hunian' ? 'Sewa & utilitas' : 'Pengeluaran ' + c.toLowerCase(),
        amt: Math.round(((ex[m] * 1e6 * p) / 1000)) * 1000,
      })
    );
  }

  return {
    user: { name: 'Alexandra M.', photo: '' },
    cur: 'IDR',
    open: 60000000,
    rates: { IDR: 1, USD: 16000, EUR: 18500, SGD: 12300, JPY: 105 },
    rateSrc: 'Manual – isi dari BI JISDOR / bank Anda',
    rateDate: iso(now.getFullYear(), now.getMonth(), now.getDate()),
    tx,
    budgets: {
      Makanan: 8e6,
      Transportasi: 3e6,
      Hunian: 8e6,
      Hiburan: 4e6,
      Kesehatan: 1.5e6,
      Lainnya: 3e6,
    },
    goals: [
      { id: 1, n: 'Dana Darurat 6 Bulan', t: 100e6, c: 82e6, due: '2026-12' },
      { id: 2, n: 'Liburan Jepang', t: 40e6, c: 26e6, due: '2027-03' },
      { id: 3, n: 'DP Apartemen (KPR)', t: 200e6, c: 84e6, due: '2028-11' },
    ],
    plans: [],
    nid: 1000,
  };
}

// ── Blank user data ──
function blank(n) {
  const d = seed();
  return {
    ...d,
    tx: [],
    sv: [],
    budgets: {},
    goals: [],
    plans: [],
    open: 0,
    user: { name: n, photo: '' },
  };
}

// ── Firebase reference helper ──
const dref = (k) => DB && DB.collection('data/users/' + DBID).doc(k);

// ── Load user data ──
function loadUser(n) {
  ME = n;
  let j = null;

  try {
    j = localStorage.getItem('moneta_d_' + n);
    if (!j && n === 'ADMIN') {
      j = localStorage.getItem(KEY);
    }
  } catch (e) {
    // localStorage not available
  }

  try {
    S = j ? JSON.parse(j) : n === 'ADMIN' ? seed() : blank(n);
  } catch (e) {
    S = n === 'ADMIN' ? seed() : blank(n);
  }

  // BUG FIX: Ensure 'sv' (savings) array always exists
  if (!S.sv) S.sv = [];
  // BUG FIX: Ensure 'plans' array always exists
  if (!S.plans) S.plans = [];
  // BUG FIX: Ensure 'nid' counter exists
  if (!S.nid) S.nid = Math.max(1000, ...S.tx.map((t) => t.id), ...(S.sv || []).map((e) => e.id), ...S.goals.map((g) => g.id)) + 1;
}

// ── Load accounts from localStorage ──
try {
  const storedAcc = localStorage.getItem('moneta_acc');
  if (storedAcc) {
    Object.assign(ACC, JSON.parse(storedAcc));
  }
  const me = localStorage.getItem('moneta_me');
  if (me && ACC[me]) {
    loadUser(me);
  }
} catch (e) {
  // localStorage not available
}

// ── Save current user data ──
async function save() {
  if (!ME) return;
  try {
    localStorage.setItem('moneta_d_' + ME, JSON.stringify(S));
  } catch (e) {
    // localStorage full or not available
  }
  if (DB) {
    try {
      await dref('d_' + hx(ME)).set({ json: JSON.stringify(S) });
    } catch (e) {
      // Firebase save failed
    }
  }
}

// ── Save account registry ──
async function regSave() {
  try {
    localStorage.setItem('moneta_acc', JSON.stringify(ACC));
  } catch (e) {
    // localStorage full or not available
  }
  if (DB) {
    try {
      await dref('accounts').set({ json: JSON.stringify(ACC) });
    } catch (e) {
      // Firebase save failed
    }
  }
}
