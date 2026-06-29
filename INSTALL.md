# 🚀 Installation Guide

Dokumen ini menjelaskan cara menjalankan Mesra Network Monitoring pada lingkungan development maupun production tanpa menggunakan Docker.

---

# 1. Requirements

Pastikan software berikut sudah terpasang.

* Node.js 18+ (disarankan versi LTS)
* PostgreSQL 15 atau lebih baru
* Git (opsional)

---

# 2. Create Database

Buat database baru di PostgreSQL.

```sql
CREATE DATABASE mesra_monitoring;
```

Catat username dan password PostgreSQL yang akan digunakan pada file `.env`.

---

# 3. Configure Environment

Salin file `.env.example` menjadi `.env`.

```bash
cp .env.example .env
```

Sesuaikan konfigurasi berikut:

* Database
* SMTP Email
* Telegram Bot Token
* VITE_API_URL

Contoh:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=mesra_monitoring

TELEGRAM_BOT_TOKEN=

MAIL_USER=
MAIL_PASS=

VITE_API_URL=http://localhost:3000
```

Jika frontend diakses dari komputer lain dalam jaringan, ubah `localhost` menjadi alamat IP server.

---

# 4. Install Dependencies

Jalankan dari folder utama project.

```bash
npm install
```

Perintah ini akan menginstal dependency untuk root project, backend, dan frontend.

---

# 5. Run Development Server

Masih dari folder utama project.

```bash
npm run dev
```

Service yang akan berjalan:

* Backend API : http://localhost:3000
* Frontend : http://localhost:5173

Saat backend pertama kali dijalankan, TypeORM akan membuat tabel database secara otomatis sesuai konfigurasi project.

---

# 6. Production Build

## Frontend

```bash
cd frontend
npm run build
```

Folder `dist/` dapat disajikan menggunakan NGINX, Apache, atau web server lainnya.

---

## Backend

```bash
cd backend
npm run build
npm run start:prod
```

Untuk deployment jangka panjang, gunakan **PM2** agar backend tetap berjalan sebagai service.

Install PM2:

```bash
npm install -g pm2
```

Menjalankan backend:

```bash
cd backend
pm2 start dist/main.js --name mesra-backend
```

Melihat status:

```bash
pm2 status
```

Restart service:

```bash
pm2 restart mesra-backend
```

---

# Notes

* Jangan mengunggah file `.env` ke GitHub.
* Gunakan `.env.example` sebagai template konfigurasi.
* Pastikan PostgreSQL sudah berjalan sebelum backend dijalankan.
* Untuk deployment production, disarankan menggunakan reverse proxy seperti NGINX.
