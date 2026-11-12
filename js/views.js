/* ============================================================
   Moneta – Page Views
   ============================================================ */

// Transaction list helper
const txList = () => {
  const k = q.toLowerCase();
  const r = recent()
    .filter(
      (t) =>
        (typeF === 'all' || t.type === typeF) &&
        (t.note + t.cat).toLowerCase().includes(k)
    )
    .slice(0, 100);
  return r.map(TxRow).join('') || '<p class="text-sm text-mut py-4">Tidak ada transaksi.</p>';
};

// ── View definitions ──
const VIEWS = {
  // ── Dashboard ──
  dashboard() {
    const [a, b] = range();
    const L = b - a;
    const inc = sum('in', a, b);
    const ex = sum('out', a, b);
    const pi = sum('in', a - L, a);
    const pe = sum('out', a - L, a);
    const bal = balance();
    const h = now.getHours();
    const g = h < 11 ? 'pagi' : h < 15 ? 'siang' : h < 18 ? 'sore' : 'malam';
    const P = [
      ['month', 'Bulan Ini'],
      ['30', '30 Hari'],
      ['q', 'Kuartal'],
      ['y', 'Tahun'],
    ];

    return `
      <section class="flex flex-col gap-3" style="display:flex;flex-direction:column;gap:0.75rem">
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.75rem">
            <div>
              <h1 class="text-2xl font-semibold tracking-tight">Selamat ${g}, ${esc(S.user.name.split(' ')[0])}</h1>
              <p class="text-sm text-mut">${now.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })} • ${synced ? 'Tersinkron ke akun' : 'Tersimpan di perangkat ini'}</p>
            </div>
            <div class="flex flex-wrap gap-2 items-center">
              <div class="period-toggle">
                ${P.map(
                  (p) =>
                    `<button onclick="A.per('${p[0]}')" class="period-btn ${period === p[0] ? 'active' : ''}">${p[1]}</button>`
                ).join('')}
              </div>
              <button onclick="A.csv()" class="btn">${ic('file_download')}Ekspor</button>
            </div>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 sm\\:grid-cols-2 gap-4" style="display:grid;grid-template-columns:repeat(1,minmax(0,1fr));gap:1rem">
        ${Metric('Saldo Bersih', fmt(bal), 'account_balance_wallet', null, 'Di luar tabungan')}
        ${Metric('Pemasukan', fmt(inc), 'arrow_downward_alt', pct(inc, pi), 'vs periode lalu', null)}
        ${Metric('Pengeluaran', fmt(ex), 'arrow_upward_alt', pct(ex, pe), 'vs periode lalu', inc ? (ex / inc) * 100 : 0, 'bg-err', true)}
        ${SavingsCard(inc - ex)}
      </section>

      <section class="grid grid-cols-1 gap-6 items-start" style="display:grid;grid-template-columns:1fr;gap:1.5rem;align-items:start">
        ${CashFlow('cf-main')}
        <div class="card cf-recent">
          <div class="flex justify-between items-center mb-2">
            <h2 class="font-semibold text-lg">Transaksi Terbaru</h2>
            <button onclick="A.go('transactions')" class="text-xs font-bold text-sec hover-underline" style="background:none;border:none;cursor:pointer;font-family:var(--font-sans)">Lihat semua (${S.tx.length})</button>
          </div>
          ${recent().slice(0, 6).map(TxRow).join('')}
        </div>
      </section>

      <section class="grid grid-cols-1 gap-6 items-start" style="display:grid;grid-template-columns:1fr;gap:1.5rem;align-items:start">
        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-lg">Batas Anggaran Bulanan</h2>
            <button onclick="A.go('budgets')" class="btn2">Kelola</button>
          </div>
          ${BudgetList(false)}
        </div>
        ${Goals()}
      </section>`;
  },

  // ── Transactions ──
  transactions() {
    return `
      <div class="card">
        <div class="flex flex-wrap gap-2 justify-between mb-3">
          <h2 class="font-semibold text-lg">Semua Transaksi</h2>
          <div class="flex gap-2">
            <input oninput="A.q(this.value)" placeholder="Cari…" value="${esc(q)}" class="inp" style="width:10rem">
            <select onchange="A.tf(this.value)" class="inp" style="width:8rem">
              <option value="all">Semua</option>
              <option value="in" ${typeF === 'in' ? 'selected' : ''}>Masuk</option>
              <option value="out" ${typeF === 'out' ? 'selected' : ''}>Keluar</option>
            </select>
          </div>
        </div>
        <div id="txl">${txList()}</div>
      </div>`;
  },

  // ── Budgets ──
  budgets() {
    return `
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-semibold text-lg">Anggaran per Kategori</h2>
          <button onclick="A.editBud()" class="btn2">${ic('add')}Kategori</button>
        </div>
        ${BudgetList(true)}
      </div>`;
  },

  // ── Reports ──
  reports() {
    const rows = [0, 1, 2, 3, 4, 5]
      .map((i) => {
        const [a, b] = mRange(i);
        const I = sum('in', a, b);
        const O = sum('out', a, b);
        return `
          <tr>
            <td>${new Date(a).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</td>
            <td>${fmt(I)}</td>
            <td>${fmt(O)}</td>
            <td class="font-semibold" style="color:${I - O < 0 ? 'var(--err)' : 'var(--sec)'}">${fmt(I - O)}</td>
          </tr>`;
      })
      .join('');

    return `
      <div class="card overflow-x-auto">
        <div class="flex justify-between mb-3">
          <h2 class="font-semibold text-lg">Laporan Bulanan</h2>
          <button onclick="A.csv()" class="btn">${ic('file_download')}Unduh CSV</button>
        </div>
        <table class="report-table">
          <tr>
            <th>Bulan</th>
            <th>Masuk</th>
            <th>Keluar</th>
            <th>Selisih</th>
          </tr>
          ${rows}
        </table>
      </div>
      ${CashFlow()}`;
  },

  // ── Goals ──
  goals: () => Goals(),

  // ── Savings ──
  savings() {
    const l = [...(S.sv || [])].sort((a, b) => (b.d > a.d ? 1 : b.d < a.d ? -1 : b.id - a.id));
    const r = (e) => `
      <div class="tx-row">
        <div class="flex items-center gap-3 min-w-0">
          <div class="tx-icon ${e.type === 'dep' ? 'income' : 'expense'}">
            ${ic(e.type === 'dep' ? 'south_west' : 'north_east')}
          </div>
          <div class="min-w-0">
            <div class="text-sm font-semibold truncate">${e.type === 'dep' ? 'Menabung' : 'Tarik ke saldo bersih'}${e.note ? ' – ' + esc(e.note) : ''}</div>
            <div class="text-xs text-mut">${fdate(e.d)}</div>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-sm font-bold ${e.type === 'dep' ? 'text-sec' : ''}">${e.type === 'dep' ? '+' : '-'}${fmt(e.amt)}</span>
          <button onclick="A.delSv(${e.id})" class="action-btn danger" aria-label="Hapus">${ic('delete')}</button>
        </div>
      </div>`;

    return `
      <div class="card flex flex-wrap justify-between gap-3 items-center">
        <div>
          <div class="text-xs font-semibold text-mut">Total Tabungan</div>
          <div class="text-3xl font-bold tracking-tight">${fmt(svTotal())}</div>
          <div class="text-xs text-mut mt-1">Saldo bersih (di luar tabungan): <b>${fmt(balance())}</b></div>
        </div>
        <div class="flex gap-2">
          <button onclick="A.sv(1)" class="btn-sec" style="height:2.5rem">${ic('add')}Menabung</button>
          <button onclick="A.sv(-1)" class="btn2">${ic('remove')}Tarik ke Saldo</button>
        </div>
      </div>
      <div class="card">
        <h2 class="font-semibold text-lg mb-2">Riwayat Tabungan</h2>
        ${l.map(r).join('') || '<p class="text-sm text-mut py-4">Belum ada riwayat menabung.</p>'}
      </div>`;
  },

  // ── Settings ──
  settings() {
    return `
      <div style="display:grid;gap:1.5rem;align-items:start" class="settings-grid">
        <div class="card flex flex-col gap-3">
          <h2 class="font-semibold text-lg">Profil</h2>
          <div class="flex items-center gap-4">
            ${avatar(64)}
            <label class="btn2 cursor-pointer">Ganti foto
              <input type="file" accept="image/*" style="display:none" onchange="A.photo(this)">
            </label>
            ${S.user.photo ? `<button onclick="A.rmPhoto()" class="text-xs text-err font-semibold" style="background:none;border:none;cursor:pointer;font-family:var(--font-sans)">Hapus foto</button>` : ''}
          </div>
          <label class="form-label">Nama
            <input value="${esc(S.user.name)}" onchange="A.name(this.value)" class="inp">
          </label>
          ${fld('Saldo awal (' + S.cur + ')', '', inv(S.open), 'number', 'step="any" onchange="A.open(this.value)"')}
        </div>

        <div class="card flex flex-col gap-3">
          <h2 class="font-semibold text-lg">Kurs Mata Uang</h2>
          <p class="text-xs text-mut">Halaman ini tidak bisa mengambil kurs langsung dari internet, jadi kurs diisi manual (nilai IDR untuk 1 unit). Rujukan resmi: kurs JISDOR Bank Indonesia (bi.go.id) atau kurs bank Anda.</p>
          ${Object.keys(S.rates)
            .filter((c) => c !== 'IDR')
            .map(
              (c) =>
                `<label class="form-label-row"><span style="width:2.5rem">${c}</span>
                  <input type="number" step="any" value="${S.rates[c]}" onchange="A.rate('${c}',this.value)" class="inp">
                </label>`
            )
            .join('')}
          <label class="form-label">Sumber kurs
            <input value="${esc(S.rateSrc)}" onchange="A.src(this.value)" class="inp">
          </label>
          <p class="text-xs text-mut">Terakhir diperbarui: ${fdate(S.rateDate)}</p>
        </div>

        <div class="card flex flex-col gap-2 settings-full">
          <h2 class="font-semibold text-lg">Akun & Cadangan</h2>
          <p class="text-sm">Masuk sebagai <b>${esc(ME)}</b></p>
          <p class="text-sm text-mut">${
            synced
              ? 'Data akun ini juga tersimpan di akun claude.ai Anda, jadi bisa dibuka dari perangkat lain.'
              : 'Data akun ini tersimpan di peramban perangkat ini dan tetap ada setelah keluar. Untuk berpindah perangkat, buka halaman ini dengan login claude.ai atau gunakan cadangan.'
          }</p>
          <div class="flex flex-wrap gap-2">
            <button onclick="A.backup()" class="btn2">${ic('download')}Unduh cadangan</button>
            <label class="btn2 cursor-pointer">${ic('upload')}Pulihkan cadangan
              <input type="file" accept=".json" style="display:none" onchange="A.restore(this)">
            </label>
            <button onclick="A.pw()" class="btn2">${ic('key')}Ganti NIS</button>
            <button onclick="A.logout()" class="btn2">${ic('logout')}Keluar</button>
            <button onclick="A.reset()" class="btn2" style="color:var(--err)">${ic('restart_alt')}Reset data akun</button>
          </div>
        </div>
      </div>`;
  },
};
