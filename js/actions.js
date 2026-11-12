/* ============================================================
   Moneta – Actions (Event Handlers)
   ============================================================ */

const A = {
  // ── Auth & Navigation ──
  tab(t) {
    tab = t;
    render();
  },

  err(m) {
    const el = $('#lerr');
    if (el) el.textContent = m;
  },

  theme() {
    dark = !dark;
    try {
      localStorage.setItem('moneta_theme', dark ? 'd' : 'l');
    } catch (e) {}
    render();
  },

  async enter(n) {
    loadUser(n);
    try {
      localStorage.setItem('moneta_me', n);
    } catch (e) {}
    if (DB) {
      try {
        const r = await dref('d_' + hx(n)).get();
        if (r.exists && r.data().json) {
          S = JSON.parse(r.data().json);
        } else {
          await save();
        }
      } catch (e) {}
    }
    view = 'dashboard';
    render();
  },

  async auth(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const n = f.n.trim().replace(/\s+/g, ' ').toUpperCase();
    const p = f.p;

    if (Date.now() < locked) {
      return A.err(
        'Terlalu banyak percobaan. Coba lagi dalam ' +
          Math.ceil((locked - Date.now()) / 1e3) +
          ' detik.'
      );
    }
    if (!/^[A-Z][A-Z .'\-]{1,39}$/.test(n)) {
      return A.err('Nama lengkap hanya huruf, spasi, titik, atau tanda hubung.');
    }
    if (!/^\d{9}$/.test(p)) {
      return A.err('NIS harus 9 digit angka.');
    }
    if (!(window.crypto && crypto.subtle)) {
      return A.err('Peramban tidak mendukung enkripsi kata sandi.');
    }

    const h = await H(n, p);

    if (tab === 'up') {
      if (ACC[n]) return A.err('Nama sudah terdaftar. Silakan masuk.');
      if (p !== f.p2) return A.err('Ulangi NIS tidak sama.');
      ACC[n] = h;
      await regSave();
      return A.enter(n);
    }

    if (ACC[n] !== h) {
      if (++fails >= 3) {
        locked = Date.now() + 15000;
        fails = 0;
      }
      return A.err('Nama atau NIS salah.');
    }

    fails = 0;
    A.enter(n);
  },

  logout() {
    ME = null;
    S = null;
    try {
      localStorage.removeItem('moneta_me');
    } catch (e) {}
    tab = 'in';
    render();
  },

  pw() {
    modal(
      'Ganti NIS',
      fld('NIS lama', 'o', '', 'password', 'required inputmode="numeric" maxlength="9" pattern="[0-9]{9}"') +
        fld('NIS baru (9 digit)', 'n', '', 'password', 'required inputmode="numeric" maxlength="9" pattern="[0-9]{9}"'),
      async (f) => {
        if ((await H(ME, f.o)) !== ACC[ME]) return info('NIS lama salah.');
        ACC[ME] = await H(ME, f.n);
        await regSave();
        info('NIS berhasil diganti.');
      }
    );
  },

  // ── View Navigation ──
  go(v) {
    view = v;
    A.close();
    render();
    scrollTo(0, 0);
  },

  close() {
    $('#modal').innerHTML = '';
    cb = null;
  },

  sub(e) {
    e.preventDefault();
    if (cb) cb(Object.fromEntries(new FormData(e.target)));
    return false;
  },

  // ── Settings ──
  cur(c) {
    S.cur = c;
    save();
    render();
  },

  per(p) {
    period = p;
    render();
  },

  q(v) {
    q = v;
    const el = $('#txl');
    if (el) el.innerHTML = txList();
  },

  tf(v) {
    typeF = v;
    const el = $('#txl');
    if (el) el.innerHTML = txList();
  },

  commit() {
    save();
    A.close();
    render();
  },

  // ── Transactions ──
  addTx(id) {
    const t = S.tx.find((x) => x.id === id) || {
      type: 'out',
      amt: '',
      cat: '',
      note: '',
      d: iso(now.getFullYear(), now.getMonth(), now.getDate()),
    };
    const cats = [
      ...new Set([...Object.keys(ICON), ...Object.keys(S.budgets)]),
    ];
    if (t.type === 'out' && t.cat && !cats.includes(t.cat)) cats.push(t.cat);

    modal(
      id ? 'Ubah Transaksi' : 'Catat Transaksi',
      sel('Jenis', 'type', [['out', 'Pengeluaran'], ['in', 'Pemasukan']], t.type) +
        fld('Jumlah (' + S.cur + ')', 'amt', t.amt === '' ? '' : inv(t.amt), 'number', 'required min="0" step="any"') +
        sel('Kategori (pengeluaran)', 'cat', cats.map((c) => [c, c]), t.cat) +
        fld('Catatan', 'note', t.note, 'text', 'required') +
        fld('Tanggal', 'd', t.d, 'date', 'required'),
      (f) => {
        const o = {
          d: f.d,
          type: f.type,
          cat: f.type === 'in' ? 'Pendapatan' : f.cat || 'Lainnya',
          note: f.note,
          amt: out(f.amt),
        };
        if (id) {
          Object.assign(t, o);
        } else {
          S.tx.push({ id: S.nid++, ...o });
        }
        A.commit();
      }
    );
  },

  delTx(id) {
    ask('Hapus transaksi ini?', () => {
      S.tx = S.tx.filter((t) => t.id !== id);
      A.commit();
    });
  },

  // ── Budgets ──
  editBud(c) {
    const nw = !c;
    modal(
      nw ? 'Kategori Baru' : 'Ubah Anggaran',
      (nw ? fld('Nama kategori', 'n', '', 'text', 'required') : `<b>${esc(c)}</b>`) +
        fld('Batas bulanan (' + S.cur + ')', 'l', nw ? '' : inv(S.budgets[c]), 'number', 'required min="0" step="any"'),
      (f) => {
        S.budgets[nw ? f.n.trim() : c] = out(f.l);
        A.commit();
      }
    );
  },

  delBud(c) {
    ask('Hapus kategori ' + esc(c) + '?', () => {
      delete S.budgets[c];
      A.commit();
    });
  },

  // ── Goals ──
  editGoal(id) {
    const g = S.goals.find((x) => x.id === id) || { n: '', t: '', c: 0, due: '' };
    modal(
      id ? 'Ubah Target' : 'Target Baru',
      fld('Nama target', 'n', g.n, 'text', 'required') +
        fld('Nominal target (' + S.cur + ')', 't', g.t ? inv(g.t) : '', 'number', 'required min="1" step="any"') +
        fld('Terkumpul (' + S.cur + ')', 'c', inv(g.c), 'number', 'min="0" step="any"') +
        fld('Target waktu', 'due', g.due, 'month'),
      (f) => {
        const o = { n: f.n, t: out(f.t), c: out(f.c), due: f.due };
        if (id) {
          Object.assign(g, o);
        } else {
          S.goals.push({ id: S.nid++, ...o });
        }
        A.commit();
      }
    );
  },

  fund(id, s) {
    const g = S.goals.find((x) => x.id === id);
    if (!g) return;
    modal(
      (s > 0 ? 'Tambah dana: ' : 'Kurangi dana: ') + esc(g.n),
      `<p class="text-sm text-mut">Terkumpul ${fmt(g.c)} dari ${fmt(g.t)}</p>` +
        fld('Jumlah (' + S.cur + ')', 'a', '', 'number', 'required min="0" step="any"'),
      (f) => {
        g.c = Math.max(0, g.c + s * out(f.a));
        A.commit();
      },
      s > 0 ? 'Tambah' : 'Kurangi'
    );
  },

  delGoal(id) {
    ask('Hapus target ini?', () => {
      S.goals = S.goals.filter((g) => g.id !== id);
      A.commit();
    });
  },

  // ── Savings ──
  sv(dir) {
    const dep = dir > 0;
    const max = dep ? balance() : svTotal();
    modal(
      dep ? 'Menabung (dari saldo bersih)' : 'Tarik dari Tabungan (ke saldo bersih)',
      `<p class="text-sm text-mut">${dep ? 'Saldo bersih tersedia' : 'Tabungan tersedia'}: <b>${fmt(max)}</b></p>` +
        fld('Jumlah (' + S.cur + ')', 'a', '', 'number', 'required min="0" step="any"') +
        `<button type="button" onclick="document.querySelector('[name=a]').value=${inv(max)}" class="text-xs text-sec font-semibold text-left" style="background:none;border:none;cursor:pointer;font-family:var(--font-sans);padding:0">Isi semua (${fmt(max)})</button>` +
        fld('Tanggal', 'd', today(), 'date', 'required') +
        fld('Catatan (opsional)', 'note', '') +
        '<p id="merr" class="text-xs text-err" role="alert"></p>',
      (f) => {
        let a = out(f.a);
        // BUG FIX: Allow tiny floating-point rounding differences when using "fill all"
        if (Math.abs(a - max) <= rate() * 0.01) a = max;

        const m = $('#merr');
        if (a <= 0) {
          if (m) m.textContent = 'Jumlah harus lebih dari 0.';
          return;
        }
        if (a > max) {
          if (m) m.textContent = (dep ? 'Melebihi saldo bersih (' : 'Melebihi tabungan (') + fmt(max) + ').';
          return;
        }
        if (!S.sv) S.sv = [];
        S.sv.push({
          id: S.nid++,
          d: f.d,
          type: dep ? 'dep' : 'wd',
          amt: a,
          note: f.note || '',
        });
        A.commit();
      },
      dep ? 'Tabung' : 'Tarik'
    );
  },

  delSv(id) {
    const e = (S.sv || []).find((x) => x.id === id);
    if (!e) return;
    if (e.type === 'dep' ? svTotal() - e.amt < 0 : balance() - e.amt < 0) {
      return info(
        'Riwayat ini tidak bisa dihapus karena akan membuat ' +
          (e.type === 'dep' ? 'tabungan' : 'saldo bersih') +
          ' menjadi minus.'
      );
    }
    ask('Hapus riwayat ini? Saldo bersih dan tabungan akan dihitung ulang.', () => {
      S.sv = S.sv.filter((x) => x.id !== id);
      A.commit();
    });
  },

  // ── User Profile ──
  name(v) {
    if (v.trim()) {
      S.user.name = v.trim();
      save();
      render();
    }
  },

  open(v) {
    S.open = out(v);
    save();
  },

  rate(c, v) {
    if (+v > 0) {
      S.rates[c] = +v;
      S.rateDate = iso(now.getFullYear(), now.getMonth(), now.getDate());
      save();
      render();
    }
  },

  src(v) {
    S.rateSrc = v;
    save();
  },

  photo(i) {
    const f = i.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const c = document.createElement('canvas');
        const s = Math.min(im.width, im.height);
        c.width = c.height = 128;
        c.getContext('2d').drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 128, 128);
        S.user.photo = c.toDataURL('image/jpeg', 0.8);
        save();
        render();
      };
      im.src = r.result;
    };
    r.readAsDataURL(f);
  },

  rmPhoto() {
    S.user.photo = '';
    save();
    render();
  },

  // ── Export & Backup ──
  csv() {
    const csvContent =
      'Tanggal,Jenis,Kategori,Catatan,Jumlah (IDR)\n' +
      recent()
        .map(
          (t) =>
            [
              t.d,
              t.type === 'in' ? 'Masuk' : 'Keluar',
              t.cat,
              '"' + t.note.replace(/"/g, '""') + '"',
              t.amt,
            ].join(',')
        )
        .join('\n');

    // BUG FIX: Use Blob download instead of claude.use('downloads') which doesn't exist outside Claude
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'moneta-transaksi.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      info('Gagal mengunduh file.');
    }
  },

  backup() {
    // BUG FIX: Use Blob download
    try {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'moneta-cadangan.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      info('Gagal mengunduh cadangan.');
    }
  },

  restore(i) {
    const f = i.files[0];
    if (!f) return;
    f.text().then((t) => {
      try {
        const o = JSON.parse(t);
        if (!o.tx || !o.rates) throw new Error('Invalid backup');
        S = o;
        // Ensure required arrays exist
        if (!S.sv) S.sv = [];
        if (!S.plans) S.plans = [];
        save();
        render();
        info('Data berhasil dipulihkan dari cadangan.');
      } catch (e) {
        info('Berkas cadangan tidak valid.');
      }
    });
  },

  reset() {
    ask(
      'Hapus SEMUA data akun ini (transaksi, tabungan, anggaran, target, rencana, saldo awal)? Profil, mata uang, dan kurs tetap. Tindakan ini tidak bisa dibatalkan.',
      () => {
        S = {
          ...blank(ME),
          user: S.user,
          cur: S.cur,
          rates: S.rates,
          rateSrc: S.rateSrc,
          rateDate: S.rateDate,
        };
        A.commit();
      },
      'Hapus Semua'
    );
  },

  // ── Financial Plans ──
  plan() {
    const row = (p) => `
      <div class="flex justify-between items-center rounded-lg p-2\\.5 text-xs gap-2" style="padding:0.625rem;border-radius:var(--radius-md);background:var(--bg)">
        <div>
          <b>${esc(p.n)}</b> (${{ d: 'Harian', m: 'Bulanan', y: 'Tahunan' }[p.per]})<br>
          Pemasukan ${fmt(p.inc)} • Tetap ${fmt(p.fix)} • Tabung ${p.pc}%<br>
          Jatah belanja: <b>${fmt(p.spend)}</b> • Tabungan: <b>${fmt(p.sav)}</b> per ${{ d: 'hari', m: 'bulan', y: 'tahun' }[p.per]}
        </div>
        <button type="button" onclick="A.delPlan(${p.id})" class="action-btn danger" aria-label="Hapus">${ic('delete')}</button>
      </div>`;

    modal(
      'Kelola Rencana Keuangan',
      sel('Periode rencana', 'per', [['d', 'Harian'], ['m', 'Bulanan'], ['y', 'Tahunan']], 'm') +
        fld('Nama rencana', 'n', 'Rencana saya', 'text', 'required') +
        fld('Perkiraan pemasukan per periode (' + S.cur + ')', 'inc', '', 'number', 'required min="0" step="any"') +
        fld('Pengeluaran tetap per periode (' + S.cur + ')', 'fix', '0', 'number', 'min="0" step="any"') +
        fld('Target tabungan (% dari pemasukan)', 'pc', '20', 'number', 'min="0" max="100"') +
        '<p class="text-xs text-mut">Setelah disimpan, rencana tampil di bawah beserta jatah belanja dan tabungan per periode.</p>' +
        (S.plans.length ? `<div class="flex flex-col gap-2">${S.plans.map(row).join('')}</div>` : ''),
      (f) => {
        const inc = out(f.inc);
        const fix = out(f.fix);
        const pc = Math.min(100, Math.max(0, +f.pc || 0));
        const sav = Math.round((inc * pc) / 100);
        S.plans.push({
          id: S.nid++,
          n: f.n,
          per: f.per,
          inc,
          fix,
          pc,
          sav,
          spend: Math.max(0, inc - fix - sav),
        });
        A.commit();
        A.plan();
      },
      'Simpan Rencana'
    );
  },

  delPlan(id) {
    S.plans = S.plans.filter((p) => p.id !== id);
    save();
    render();
    A.plan();
  },
};
