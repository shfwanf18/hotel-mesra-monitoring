# 🚀 Panduan Instalasi (Development & Production Lokal)

Sistem Mesra Network Monitoring dirancang untuk dijalankan secara langsung (*bare-metal*) di sistem operasi (Windows/Linux) menggunakan Node.js dan PostgreSQL.

Berikut adalah langkah-langkah untuk menyiapkan dan menjalankan aplikasi ini dari awal.

---

## 1️⃣ Prasyarat Sistem

Pastikan aplikasi berikut sudah terpasang di komputer/server Anda:
- **Node.js** (versi 18.x atau 20.x ke atas)
- **PostgreSQL** (versi 15 atau 16)
- **Git** (opsional, untuk *version control*)

---

## 2️⃣ Persiapan Database

1. Buka PostgreSQL (menggunakan pgAdmin atau psql CLI).
2. Buat database baru dengan nama `mesra_monitoring`.
   ```sql
   CREATE DATABASE mesra_monitoring;
   ```
3. Pastikan Anda mengingat **username** (biasanya `postgres`) dan **password** database Anda.

---

## 3️⃣ Persiapan Repository & Environment Variables

1. Buka terminal (Command Prompt / PowerShell / Bash).
2. Pindah ke folder tempat Anda ingin menyimpan proyek, dan *clone* repository ini (atau salin folder *source code*).
3. Buat file `.env` di folder utama (root) dari template yang disediakan:
   ```bash
   cp .env.example .env
   ```
4. Buka file `.env` yang baru dibuat dengan teks editor dan sesuaikan nilainya:
   - Ganti `DB_PASSWORD` dengan password PostgreSQL Anda.
   - Isi `TELEGRAM_BOT_TOKEN` dengan token dari @BotFather (jika ingin fitur Telegram aktif).
   - Isi `MAIL_USER` dan `MAIL_PASS` (Gunakan *App Password* Gmail, bukan password login biasa).
   - Biarkan `VITE_API_URL=http://localhost:3000` jika Anda hanya mengaksesnya di komputer yang sama. (Jika server akan diakses dari komputer lain, ubah `localhost` menjadi IP server Anda, misal: `http://192.168.1.50:3000`).

---

## 4️⃣ Menjalankan Aplikasi (Satu Perintah)

Sekarang Anda bisa menginstall semua dependencies (backend & frontend) sekaligus dan menjalankan keduanya secara bersamaan (menggunakan *concurrently*).

1. Buka terminal (berada di folder utama `PROJECT-MESRA-Monitoring`).
2. Install semua dependencies secara otomatis (alat utama, backend, dan frontend):
   ```bash
   npm install
   ```
3. Jalankan server backend (API) dan frontend (UI) secara bersamaan:
   ```bash
   npm run dev
   ```
   > **Catatan:** TypeORM akan secara otomatis membuatkan semua tabel di database Anda saat pertama kali backend dijalankan. Backend dan frontend akan berjalan di satu jendela terminal (ditandai label `BACKEND` dan `FRONTEND`).

4. Buka browser dan akses alamat yang muncul (biasanya **http://localhost:5173**).

---

## 🌐 Mode Produksi (Production Build)

Jika Anda ingin menjalankan aplikasi untuk jangka panjang sebagai servis permanen (bukan mode *development*):

### Build Frontend
```bash
cd frontend
npm run build
```
Proses ini akan menghasilkan folder `dist/` yang berisi file HTML/CSS/JS statis. Anda dapat menyajikan file ini menggunakan NGINX, Apache, atau web server lainnya.

### Build Backend
```bash
cd backend
npm run build
npm run start:prod
```
> **Tips:** Untuk server *production* Node.js, disarankan menggunakan *process manager* seperti **PM2** agar backend dapat berjalan di latar belakang dan otomatis *restart* jika komputer dihidupkan ulang.
> ```bash
> npm install -g pm2
> cd backend
> pm2 start dist/main.js --name "mesra-backend"
> ```
