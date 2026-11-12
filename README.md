# Moneta – Dasbor Keuangan Pribadi

Aplikasi dasbor keuangan pribadi untuk mencatat transaksi, mengatur anggaran, menabung, dan merencanakan target keuangan.

## Cara Menjalankan

### Cara 1: Langsung Buka (Paling Mudah)
1. Ekstrak file ZIP / tar.gz
2. Buka folder `moneta-dashboard`
3. Klik dua kali file `index.html` — akan terbuka di browser

### Cara 2: Dengan Live Server (Direkomendasikan)
Jika Anda menggunakan **VS Code**:
1. Install ekstensi **Live Server** dari marketplace
2. Buka folder `moneta-dashboard` di VS Code
3. Klik kanan `index.html` → **Open with Live Server**

Atau gunakan **Python** (sudah terinstal di kebanyakan komputer):
```bash
cd moneta-dashboard
python3 -m http.server 8000
```
Lalu buka `http://localhost:8000` di browser.

Atau gunakan **Node.js**:
```bash
npx -y serve ./moneta-dashboard
```

## Catatan
- Aplikasi ini berjalan sepenuhnya di browser (client-side), tidak perlu server atau database.
- Data disimpan di `localStorage` browser.
- Membutuhkan koneksi internet untuk memuat font Google (Inter & Material Symbols). Tanpa internet, aplikasi tetap berjalan tetapi font akan menggunakan fallback bawaan browser.
