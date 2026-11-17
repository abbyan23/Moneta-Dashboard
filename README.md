# Moneta – Dasbor Keuangan Pribadi

Isi folder:
- index.html        : aplikasi (satu file)
- config.js         : tempat mengisi URL & kunci Supabase  <-- WAJIB DIISI
- supabase-setup.sql: dijalankan sekali di Supabase (SQL Editor)
- vercel.json       : pengaturan hosting Vercel

## Langkah
1. Supabase: buat project > SQL Editor > tempel isi supabase-setup.sql > Run.
2. Supabase: Authentication > Providers > Email > matikan "Confirm email".
3. Supabase: Project Settings > API > salin "Project URL" dan "anon public key".
4. Buka config.js, tempel kedua nilai tersebut (kunci anon, BUKAN service_role).
5. Upload seluruh isi folder ini ke Vercel (drag & drop folder, atau lewat GitHub). index.html harus berada di akar folder.
6. Buka alamat Vercel dengan Ctrl+Shift+R. Daftar dengan NAMA LENGKAP HURUF BESAR dan NIS 9 digit.
7. Cek: Pengaturan menampilkan "Tersinkron ..." dan tombol "Sinkron sekarang".

Semua perangkat harus membuka alamat hosting yang sama dan login dengan nama + NIS yang sama.
