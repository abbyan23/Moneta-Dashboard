/* ============================================================
   Moneta – Authentication (Login / Register)
   ============================================================ */

// ── Modal helpers ──
function modal(title, body, fn, label = 'Simpan') {
  cb = fn;
  $('#modal').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)A.close()">
      <form onsubmit="return A.sub(event)" class="modal-content">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">${title}</h3>
          <button type="button" onclick="A.close()" class="action-btn" aria-label="Tutup">${ic('close')}</button>
        </div>
        ${body}
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="btn2" onclick="A.close()">Batal</button>
          ${fn ? `<button class="btn">${label}</button>` : ''}
        </div>
      </form>
    </div>`;
}

const ask = (m, fn, l = 'Hapus') =>
  modal('Konfirmasi', `<p class="text-sm">${m}</p>`, () => { A.close(); fn(); }, l);

const info = (m) =>
  modal('Info', `<p class="text-sm">${m}</p>`, null);

// ── Login View ──
function Login() {
  const up = tab === 'up';
  const tb = (k, l) =>
    `<button type="button" onclick="A.tab('${k}')" class="tab-btn ${tab === k ? 'active' : ''}">${l}</button>`;

  return `
    <div class="login-wrapper">
      <form onsubmit="return A.auth(event)" class="card login-card flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 font-bold text-xl">
            <span class="sidebar-brand-icon">M</span>Moneta
          </div>
          <button type="button" onclick="A.theme()" class="action-btn" aria-label="Ganti tema">
            ${ic(dark ? 'light_mode' : 'dark_mode')}
          </button>
        </div>

        <p class="text-sm text-mut">${
          up
            ? 'Buat akun baru. Nama lengkap ditulis HURUF BESAR, kata sandi berupa NIS 9 digit angka.'
            : 'Masuk agar data keuangan Anda tersimpan dan tidak hilang.'
        }</p>

        <div class="tab-toggle">
          ${tb('in', 'Masuk')}
          ${tb('up', 'Daftar')}
        </div>

        <label class="form-label">Nama lengkap
          <input name="n" required autocomplete="username" oninput="this.value=this.value.toUpperCase()" placeholder="NAMA LENGKAP" class="inp uppercase">
        </label>

        <label class="form-label">NIS (9 digit)
          <input name="p" type="password" required inputmode="numeric" maxlength="9" pattern="[0-9]{9}" autocomplete="${up ? 'new-password' : 'current-password'}" placeholder="9 digit angka" class="inp">
        </label>

        ${up ? `<label class="form-label">Ulangi NIS
          <input name="p2" type="password" required inputmode="numeric" maxlength="9" pattern="[0-9]{9}" class="inp">
        </label>` : ''}

        <p id="lerr" class="text-xs text-err min-h-4" role="alert"></p>
        <button class="btn justify-center w-full">${up ? 'Buat Akun' : 'Masuk'}</button>
        <p class="text-xs text-mut">Login ini melindungi data di perangkat Anda, bukan pengganti keamanan server. NIS tidak bisa dipulihkan jika lupa.</p>
      </form>
    </div>`;
}
