# 🌐 Mesra Network Monitoring

Sistem monitoring jaringan real-time yang dirancang khusus untuk infrastruktur IT Hotel Mesra Samarinda. Aplikasi ini memantau perangkat jaringan seperti Router, Switch, Access Point, dan Server secara terus-menerus, memberikan wawasan *real-time* tentang ketersediaan dan latensi, serta mengirimkan notifikasi instan jika terjadi gangguan.

Dibangun dengan arsitektur modern menggunakan **NestJS**, **PostgreSQL**, **React**, dan **Socket.IO**.

---

## ✨ Fitur Utama

### 📊 Real-time Dashboard
- **Live Monitoring:** Memantau status (Online/Offline) dan latensi perangkat jaringan secara *real-time* tanpa perlu me-refresh halaman.
- **Visualisasi Data:** Menampilkan grafik garis latensi (*sparkline*) untuk memantau performa jaringan dalam 40 pengecekan terakhir.
- **Metrik Ketersediaan:** Menghitung persentase *uptime* dan mencatat total waktu *downtime* harian secara otomatis.

### 🖧 Device Management
- Kelola daftar perangkat yang ingin dipantau langsung dari UI (Tambah, Edit, Hapus).
- Mendukung berbagai jenis perangkat (Router, Switch, Server, Access Point).
- Semua perubahan pada perangkat akan langsung diterapkan oleh sistem monitoring (*scheduler*) tanpa perlu me-restart aplikasi.

### 🚨 Alert & Notifikasi
- **Telegram Bot:** Integrasi langsung dengan bot Telegram untuk mengirim pesan instan ke staf IT saat perangkat terdeteksi *Offline* atau kembali *Online*.
- **Email Notifications:** Mengirim detail insiden melalui email.
- Aturan *Threshold*: Menghindari *false alarm* dengan memastikan perangkat benar-benar mati sebelum notifikasi dikirim (misal: 3 kali gagal berturut-turut).

### 📋 Incident History & Event Log
- **Manajemen Insiden:** Otomatis mencatat kapan perangkat mati (*Started*), menghitung durasi *downtime*, dan menandai status penyelesaian (*Resolved* atau *Active Incident*).
- **Event Log:** Mencatat segala aktivitas terkait perangkat seperti `DOWN`, `RECOVERED`, `ALERT_SENT`, dan `MANUAL_TEST`.

### 🎛️ Settings & Konfigurasi Dinamis
- **Interval & Threshold:** Atur seberapa sering sistem mengecek jaringan (interval ping) dan batas toleransi kegagalan langsung dari halaman *Settings*.
- **Manajemen Penerima Alert:** Tambah atau hapus penerima notifikasi Telegram dan Email tanpa harus menyentuh kode program.
- **System Status:** Memantau kesehatan komponen internal aplikasi (Database, WebSocket, Scheduler, dan Mail Service).

### 💻 Ping Test Terminal
- Disediakan terminal simulasi langsung pada halaman detail perangkat untuk menjalankan tes ping secara manual dari server ke perangkat tanpa perlu membuka aplikasi *Command Prompt* atau *Terminal* server.

---

## 🏗️ Teknologi yang Digunakan

Aplikasi ini menggunakan pendekatan arsitektur *monorepo* sederhana yang terbagi menjadi dua bagian:

| Bagian | Teknologi |
|---|---|
| **Backend API** | NestJS (Node.js framework), TypeORM, PostgreSQL, `ping` library |
| **Frontend** | React, Vite, TypeScript, Tailwind CSS, Framer Motion |
| **Realtime Engine** | Socket.IO |

---

## 📁 Struktur Project

```
PROJECT-MESRA-Monitoring/
├── backend/               # NestJS API Server
│   ├── src/
│   │   ├── device/        # Modul CRUD Perangkat
│   │   ├── history/       # Modul pencatatan Ping & Insiden
│   │   ├── settings/      # Modul Pengaturan Aplikasi
│   │   ├── monitoring/    # Ping Scheduler + WebSocket Gateway
│   │   ├── alert/         # Layanan Email & Telegram
│   │   └── database/      # TypeORM Entities
│   └── package.json
├── frontend/              # React Web Client
│   ├── src/
│   │   ├── components/    # Komponen UI Reusable (Layout, Widget)
│   │   ├── pages/         # Halaman Utama (Dashboard, Settings, dll)
│   │   ├── context/       # React Context untuk State Global
│   │   └── index.css      # Desain Sistem & Tailwind
│   └── package.json
├── .env.example           # Template Konfigurasi Environment
├── INSTALL.md             # Panduan Instalasi
└── README.md              # File ini
```

---

## 🚀 Panduan Instalasi & Penggunaan

Karena aplikasi ini dikembangkan untuk berjalan langsung di atas sistem Windows server / PC (tanpa Docker), silakan baca panduan lengkap instalasinya pada file **[INSTALL.md](./INSTALL.md)**.
