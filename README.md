# 🌐 Mesra Network Monitoring

Sistem monitoring jaringan real-time untuk Hotel Mesra Samarinda.  
Dibangun dengan **NestJS + PostgreSQL + React + Socket.IO**.

---

## 🚀 Cara Menjalankan (Docker — Direkomendasikan)

### Prasyarat
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) terinstall dan berjalan
- Port **80** dan **3000** tidak dipakai aplikasi lain

### Langkah-langkah

**1. Clone / copy project ke komputer tujuan**

**2. Buat file `.env` dari template**
```bash
copy .env.example .env
```

**3. Edit `.env` sesuai kebutuhan**
```env
# Jika deploy di server lain, ganti IP di baris ini:
VITE_API_URL=http://192.168.1.100:3000

# Isi email untuk notifikasi alert:
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
MAIL_TO=recipient@gmail.com
```

**4. Jalankan semua service**
```bash
docker compose up -d
```

Tunggu ~30 detik hingga semua container siap. Lalu buka browser:

| Service | URL |
|---|---|
| **Dashboard** | http://localhost |
| **Backend API** | http://localhost:3000 |
| **Database** | localhost:5432 |

**5. (Opsional) Lihat log real-time**
```bash
docker compose logs -f backend
```

---

## 🔄 Update ke Versi Baru

```bash
docker compose down
docker compose up -d --build
```

---

## 🛑 Menghentikan Aplikasi

```bash
# Stop sementara (data tetap tersimpan)
docker compose stop

# Stop dan hapus container (data tetap di volume)
docker compose down

# Stop + hapus semua data (HATI-HATI: menghapus database!)
docker compose down -v
```

---

## 🔧 Menjalankan Tanpa Docker (Development)

### Prasyarat
- Node.js 20+
- PostgreSQL 15+ terinstall dan berjalan
- Database `mesra_monitoring` sudah dibuat

### Backend
```bash
cd backend
npm install
npm run seed        # Isi data awal ke database (jalankan sekali)
npm run start:dev   # Jalankan dev server
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Buka http://localhost:5173

---

## 📁 Struktur Project

```
PROJECT-MESRA-Monitoring/
├── backend/               # NestJS API
│   ├── src/
│   │   ├── device/        # CRUD Devices
│   │   ├── history/       # Ping history & uptime stats
│   │   ├── settings/      # App settings (ping interval, dll)
│   │   ├── monitoring/    # Scheduler + WebSocket gateway
│   │   ├── alert/         # Email notifications
│   │   └── database/      # TypeORM entities & seeds
│   └── Dockerfile
├── frontend/              # React + Vite
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Device Management, Settings
│   │   └── types/         # TypeScript interfaces
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml     # Orkestrasi semua service
├── .env.example           # Template konfigurasi
└── README.md
```

---

## 🔑 Environment Variables

| Variable | Default | Keterangan |
|---|---|---|
| `DB_PASSWORD` | `wawan` | Password PostgreSQL |
| `DB_DATABASE` | `mesra_monitoring` | Nama database |
| `MAIL_USER` | — | Email Gmail pengirim alert |
| `MAIL_PASS` | — | App Password Gmail |
| `MAIL_TO` | — | Email penerima alert |
| `VITE_API_URL` | `http://localhost:3000` | URL backend (untuk browser) |

---

## 🏗️ Teknologi

| Layer | Teknologi |
|---|---|
| Backend API | NestJS + TypeORM |
| Database | PostgreSQL 16 |
| Realtime | Socket.IO |
| Frontend | React + Vite + Tailwind |
| Web Server | Nginx |
| Container | Docker + Docker Compose |
