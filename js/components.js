/* ============================================================
   Moneta – UI Components
   ============================================================ */

// ── Navigation Items ──
const NAV = [
  ['dashboard', 'grid_view', 'Dasbor'],
  ['transactions', 'receipt_long', 'Transaksi'],
  ['budgets', 'pie_chart', 'Anggaran'],
  ['reports', 'bar_chart', 'Laporan'],
  ['savings', 'savings', 'Tabungan'],
  ['goals', 'flag', 'Target Keuangan'],
  ['settings', 'settings', 'Pengaturan'],
];

// ── Sidebar ──
function Sidebar() {
  return `
    <aside class="sidebar" role="navigation" aria-label="Menu utama">
      <div>
        <button onclick="A.go('dashboard')" class="sidebar-brand" title="Kembali ke beranda">
          <span class="sidebar-brand-icon">M</span>Moneta
        </button>
        <nav>
          ${NAV.map(
            (n) =>
              `<button onclick="A.go('${n[0]}')" class="sidebar-link ${n[0] === view ? 'active' : ''}" aria-current="${n[0] === view ? 'page' : 'false'}">
                ${ic(n[1])}${n[2]}
              </button>`
          ).join('')}
        </nav>
      </div>
      <div class="sidebar-cta">
        <div class="sidebar-cta-box">
          <div class="flex justify-between text-sm font-semibold">
            Rencana Keuangan<span class="text-sec">${ic('verified')}</span>
          </div>
          <p class="text-xs text-mut">${
            S.plans.length
              ? S.plans.length + ' rencana tersimpan.'
              : 'Belum ada rencana. Buat rencana harian, bulanan, atau tahunan.'
          }</p>
          <button onclick="A.plan()" class="text-xs font-bold text-sec text-left hover-underline" style="background:none;border:none;cursor:pointer;padding:0;font-family:var(--font-sans)">Kelola Rencana</button>
        </div>
      </div>
    </aside>`;
}

// ── Header ──
function Header() {
  return `
    <header class="header" role="banner">
      <div class="flex items-center gap-2">
        <button onclick="A.go('dashboard')" class="btn2" title="Kembali ke menu awal">
          ${ic('home')}<span class="sm\\:inline" style="display:none">Beranda</span>
        </button>
        ${view !== 'dashboard'
          ? `<button onclick="A.go('dashboard')" class="btn2 md\\:inline-flex" style="display:none">
              ${ic('arrow_back')}Kembali
            </button>`
          : ''
        }
      </div>
      <div class="flex items-center gap-2">
        <button onclick="A.theme()" class="btn2" style="padding:0 0.75rem" aria-label="Ganti tema">
          ${ic(dark ? 'light_mode' : 'dark_mode')}
        </button>
        <select onchange="A.cur(this.value)" class="currency-select" aria-label="Mata uang">
          ${Object.keys(S.rates).map((c) => `<option ${c === S.cur ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        <button onclick="A.addTx()" class="btn-sec">
          ${ic('add')}<span class="sm\\:inline" style="display:none">Catat Transaksi</span>
        </button>
        <button onclick="A.go('settings')" class="flex items-center gap-2" style="background:none;border:none;cursor:pointer" title="Ubah profil">
          ${avatar(32)}<span class="md\\:block text-xs font-semibold" style="display:none">${esc(S.user.name)}</span>
        </button>
        <button onclick="A.logout()" class="btn2" style="padding:0 0.75rem" title="Keluar" aria-label="Keluar">
          ${ic('logout')}
        </button>
      </div>
    </header>
    <nav class="mobile-nav lg\\:hidden" aria-label="Navigasi cepat">
      ${NAV.map(
        (n) =>
          `<button onclick="A.go('${n[0]}')" class="mobile-nav-btn ${n[0] === view ? 'active' : ''}">${n[2]}</button>`
      ).join('')}
      <button onclick="A.plan()" class="mobile-nav-btn">Rencana</button>
    </nav>`;
}

// ── Metric Card ──
function Metric(l, v, icn, chg, sub, bar, col = 'bg-sec', bad = false) {
  const badge = chg != null
    ? `<div class="text-xs">
        <span class="metric-badge ${(bad ? chg <= 0 : chg >= 0) ? 'positive' : 'negative'}">
          ${chg >= 0 ? '+' : ''}${chg}%
        </span>
        <span class="text-mut">${sub}</span>
      </div>`
    : '';

  const barHtml = bar != null
    ? `<div class="progress-bar">
        <div class="progress-fill ${col}" style="width:${Math.max(0, Math.min(100, bar))}%"></div>
      </div>`
    : `<div class="text-xs text-mut">${sub}</div>`;

  return `
    <div class="card flex flex-col gap-2">
      <div class="flex justify-between">
        <div>
          <div class="text-xs font-semibold text-mut">${l}</div>
          <div class="text-2xl font-bold tracking-tight mt-1">${v}</div>
        </div>
        <div class="w-10 h-10 rounded-xl bg-soft flex items-center justify-center">${ic(icn)}</div>
      </div>
      ${badge || barHtml}
    </div>`;
}

// ── Savings Card ──
function SavingsCard(sur) {
  return `
    <div class="card flex flex-col gap-2">
      <div class="flex justify-between">
        <div>
          <div class="text-xs font-semibold text-mut">Tabungan</div>
          <div class="text-2xl font-bold tracking-tight mt-1">${fmt(svTotal())}</div>
        </div>
        <div class="w-10 h-10 rounded-xl bg-soft flex items-center justify-center">${ic('savings')}</div>
      </div>
      <div class="text-xs text-mut">
        Terpisah dari saldo bersih • Surplus periode:
        <b style="color:${sur < 0 ? 'var(--err)' : 'var(--sec)'}">${fmt(sur)}</b>
      </div>
      <div class="flex gap-2 mt-auto pt-1">
        <button onclick="A.sv(1)" class="flex-1 btn-sec" style="height:2.25rem;justify-content:center">${ic('add')}Menabung</button>
        <button onclick="A.sv(-1)" class="flex-1 btn2" style="height:2.25rem;justify-content:center">${ic('remove')}Tarik</button>
      </div>
    </div>`;
}

// ── Cash Flow Chart ──
function CashFlow(extraClass = '') {
  const m = [5, 4, 3, 2, 1, 0].map((i) => {
    const [a, b] = mRange(i);
    return {
      l: new Date(a).toLocaleDateString('id-ID', { month: 'short' }),
      i: sum('in', a, b),
      o: sum('out', a, b),
    };
  });

  const mx = Math.max(1, ...m.flatMap((x) => [x.i, x.o])) * 1.1;

  const bars = m
    .map((x, k) => {
      const X = 60 + k * 85;
      const hi = (x.i / mx) * 190;
      const ho = (x.o / mx) * 190;
      return `<g>
        <title>${x.l}: masuk ${fmt(x.i)}, keluar ${fmt(x.o)}</title>
        <rect x="${X}" y="${220 - ho}" width="16" height="${ho}" rx="3" fill="currentColor" opacity=".85"/>
        <rect x="${X + 18}" y="${220 - hi}" width="16" height="${hi}" rx="3" fill="var(--sec)"/>
        <text x="${X + 17}" y="236" font-size="11" text-anchor="middle" fill="currentColor" opacity=".7">${x.l}</text>
      </g>`;
    })
    .join('');

  const avg = m.reduce((s, x) => s + x.i - x.o, 0) / 6;

  return `
    <div class="card ${extraClass}">
      <h2 class="font-semibold text-lg">Arus Kas 6 Bulan</h2>
      <p class="text-xs text-mut mb-3">Pemasukan (hijau) vs pengeluaran (gelap) – sentuh batang untuk detail</p>
      <svg viewBox="0 0 600 245" class="chart-svg" role="img" aria-label="Grafik arus kas 6 bulan terakhir">
        <line x1="40" x2="580" y1="220" y2="220" stroke="var(--line)"/>
        ${bars}
      </svg>
      <div class="text-xs text-mut pt-2">
        Rata-rata surplus bulanan: <b>${fmt(avg)}</b>
      </div>
    </div>`;
}

// ── Transaction Row ──
const TxRow = (t) => `
  <div class="tx-row">
    <div class="flex items-center gap-3 min-w-0">
      <div class="tx-icon ${t.type === 'in' ? 'income' : 'expense'}">
        ${ic(t.type === 'in' ? 'payments' : ICON[t.cat] || 'category')}
      </div>
      <div class="min-w-0">
        <div class="text-sm font-semibold truncate">${esc(t.note)}</div>
        <div class="text-xs text-mut">${fdate(t.d)} • ${esc(t.cat)}</div>
      </div>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <span class="text-sm font-bold ${t.type === 'in' ? 'text-sec' : ''}">${t.type === 'in' ? '+' : '-'}${fmt(t.amt)}</span>
      <button onclick="A.addTx(${t.id})" class="action-btn" aria-label="Ubah">${ic('edit')}</button>
      <button onclick="A.delTx(${t.id})" class="action-btn danger" aria-label="Hapus">${ic('delete')}</button>
    </div>
  </div>`;

// ── Budget List ──
function BudgetList(edit) {
  const [a, b] = mRange(0);
  const rows = Object.entries(S.budgets)
    .map(([c, l]) => {
      const s = sum('out', a, b, c);
      const p = l ? Math.round((s / l) * 100) : 0;
      const col = p >= 90 ? 'bg-err' : p >= 70 ? 'bg-amber-500' : 'bg-sec';
      return `
        <div>
          <div class="flex justify-between items-center text-sm mb-1 gap-2">
            <span class="font-semibold flex items-center gap-2">${ic(ICON[c] || 'category')}${esc(c)}</span>
            <span class="text-xs text-mut flex items-center gap-2">
              ${fmt(s)} / ${fmt(l)}
              <b style="${p >= 90 ? 'color:var(--err)' : ''}">${p}%</b>
              ${edit
                ? `<button onclick="A.editBud('${esc(c)}')" class="action-btn" aria-label="Ubah">${ic('edit')}</button>
                   <button onclick="A.delBud('${esc(c)}')" class="action-btn danger" aria-label="Hapus">${ic('delete')}</button>`
                : ''
              }
            </span>
          </div>
          <div class="progress-bar thick">
            <div class="progress-fill ${col}" style="width:${Math.min(100, p)}%"></div>
          </div>
        </div>`;
    })
    .join('');

  return `<div class="flex flex-col gap-4">${rows || '<p class="text-sm text-mut">Belum ada anggaran.</p>'}</div>`;
}

// ── Goal Card ──
function GoalCard(g) {
  const p = g.t ? Math.min(100, Math.round((g.c / g.t) * 100)) : 0;
  return `
    <div class="p-3\\.5 rounded-xl bg-bg flex items-center gap-4" style="padding:0.875rem;border-radius:var(--radius-lg);background:var(--bg)">
      <div class="goal-ring">
        <svg viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--line)" stroke-width="3.5"/>
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="${p >= 100 ? 'var(--sec)' : 'var(--indigo)'}" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="${p},100"/>
        </svg>
        <span class="goal-ring-label">${p}%</span>
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-sm truncate">${esc(g.n)}</div>
        <div class="text-sm font-semibold">${fmt(g.c)} <span class="text-xs text-mut font-normal">/ ${fmt(g.t)}</span></div>
        <div class="text-xs text-mut">Target: ${esc(g.due || '-')}</div>
        <div class="flex gap-1 mt-1 flex-wrap" style="margin-top:0.375rem">
          <button onclick="A.fund(${g.id},1)" class="tag tag-mint">+ Tambah</button>
          <button onclick="A.fund(${g.id},-1)" class="tag tag-soft">− Kurangi</button>
          <button onclick="A.editGoal(${g.id})" class="tag tag-soft">Ubah</button>
          <button onclick="A.delGoal(${g.id})" class="tag tag-err">Hapus</button>
        </div>
      </div>
    </div>`;
}

// ── Goals section ──
const Goals = () => `
  <div class="card">
    <div class="flex justify-between items-center mb-4">
      <h2 class="font-semibold text-lg">Target Keuangan</h2>
      <button onclick="A.editGoal()" class="btn2">${ic('add')}Target Baru</button>
    </div>
    <div class="flex flex-col gap-3">
      ${S.goals.map(GoalCard).join('') || '<p class="text-sm text-mut">Belum ada target.</p>'}
    </div>
  </div>`;
